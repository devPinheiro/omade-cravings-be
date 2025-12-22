import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../../models/Order';
import { OrderItem } from '../../../models/OrderItem';
import { Product } from '../../../models/Product';
import { User } from '../../../models/User';
import { PromoCode, DiscountType } from '../../../models/PromoCode';
import { CustomCakeConfiguration } from '../../../models/CustomCakeConfiguration';
import { CartService, Cart } from '../../cart/services/CartService';
import { EnhancedCartService, CartIdentifier } from '../../cart/services/EnhancedCartService';
import { ProductService } from '../../products/services/ProductService';
import { OrderNotificationService } from '../../notifications/services/OrderNotificationService';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../../config/database';

export interface CreateOrderData {
  // User information (either user_id OR guest info required)
  user_id?: string;
  session_id?: string; // For guest users
  guest_email?: string;
  guest_phone?: string;
  guest_name?: string;
  
  // Order details
  payment_method?: PaymentMethod;
  pickup_instructions?: string;
  preferred_pickup_date?: Date;
  preferred_pickup_time?: string;
  promo_code?: string;
  
  // Cart data (for direct order creation)
  items?: Array<{
    product_id: string;
    quantity: number;
    custom_cake_config?: any;
  }>;
}

export interface OrderFilters {
  user_id?: string;
  guest_email?: string;
  guest_phone?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  date_from?: Date;
  date_to?: Date;
  order_number?: string;
  page?: number;
  limit?: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  pickup_instructions?: string;
  preferred_pickup_date?: Date;
  preferred_pickup_time?: string;
  staff_notes?: string;
}

export class OrderService {
  private cartService = new CartService();
  private enhancedCartService = new EnhancedCartService();
  private productService = new ProductService();
  private notificationService = new OrderNotificationService();

  async createOrder(data: CreateOrderData): Promise<Order> {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate user or guest information
      this.validateCustomerInfo(data);
      
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();
      
      // Get cart items (either from existing cart or from data.items)
      let cartItems;
      if (data.user_id || data.session_id) {
        // Use enhanced cart service for both authenticated and guest users
        const cartIdentifier: CartIdentifier = data.user_id 
          ? { user_id: data.user_id }
          : { session_id: data.session_id! };
        
        const cart = await this.enhancedCartService.getCart(cartIdentifier);
        cartItems = cart.items;
        
        // If no guest info provided and cart has guest info, use it
        if (!data.user_id && cart.guest_info) {
          data.guest_email = data.guest_email || cart.guest_info.email;
          data.guest_phone = data.guest_phone || cart.guest_info.phone;
          data.guest_name = data.guest_name || cart.guest_info.name;
        }
      } else {
        cartItems = await this.validateDirectItems(data.items || []);
      }
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cannot create order with empty cart');
      }
      
      // Validate inventory availability
      await this.validateInventory(cartItems);
      
      // Calculate totals
      const totals = await this.calculateTotals(cartItems, data.promo_code);
      
      // Create the order
      const order = await Order.create({
        user_id: data.user_id || null,
        guest_email: data.guest_email || null,
        guest_phone: data.guest_phone || null,
        guest_name: data.guest_name || null,
        order_number: orderNumber,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: data.payment_method || PaymentMethod.CASH,
        total_amount: totals.total,
        discount_amount: totals.discount,
        promo_code: data.promo_code || null,
        pickup_instructions: data.pickup_instructions || null,
        preferred_pickup_date: data.preferred_pickup_date || null,
        preferred_pickup_time: data.preferred_pickup_time || null,
      } as any, { transaction });
      
      // Create order items
      await this.createOrderItems(order.id, cartItems, transaction);
      
      // Handle custom cake configurations
      await this.createCustomCakeConfigurations(order.id, cartItems, transaction);
      
      // Update inventory
      await this.updateInventory(cartItems);
      
      // Clear cart if applicable
      if (data.user_id || data.session_id) {
        const cartIdentifier: CartIdentifier = data.user_id 
          ? { user_id: data.user_id }
          : { session_id: data.session_id! };
        await this.enhancedCartService.clearCart(cartIdentifier);
      }
      
      await transaction.commit();
      
      // Fetch complete order with relations
      const completeOrder = await this.getOrderById(order.id) as Order;
      
      // Send order confirmation notification
      try {
        await this.notificationService.handleOrderStatusChange(completeOrder);
      } catch (error) {
        console.error('Failed to send order confirmation notification:', error);
        // Don't fail the order creation if notification fails
      }
      
      return completeOrder;
      
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Transaction was already committed or rolled back
        console.warn('Transaction rollback failed:', rollbackError);
      }
      throw error;
    }
  }

  async getOrderById(id: string, includeRelations = true): Promise<Order | null> {
    const includeOptions = includeRelations ? {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
        {
          model: CustomCakeConfiguration,
          required: false,
        },
      ],
    } : {};

    return await Order.findByPk(id, includeOptions);
  }

  async getOrders(filters: OrderFilters = {}): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      user_id,
      guest_email,
      guest_phone,
      status,
      payment_status,
      payment_method,
      date_from,
      date_to,
      order_number,
      page = 1,
      limit = 20,
    } = filters;
    
    const offset = (page - 1) * limit;
    const where: any = {};
    
    if (user_id) where.user_id = user_id;
    if (guest_email) where.guest_email = guest_email;
    if (guest_phone) where.guest_phone = guest_phone;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;
    if (order_number) where.order_number = { [Op.iLike]: `%${order_number}%` };
    
    if (date_from || date_to) {
      where.createdAt = {};
      if (date_from) where.createdAt[Op.gte] = date_from;
      if (date_to) where.createdAt[Op.lte] = date_to;
    }
    
    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
    
    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order | null> {
    const order = await Order.findByPk(id);
    if (!order) {
      return null;
    }
    
    const previousStatus = order.status;
    const previousPaymentStatus = order.payment_status;
    
    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(order.status, data.status);
    }
    
    await order.update(data);
    const updatedOrder = await this.getOrderById(id);
    
    if (updatedOrder) {
      // Send notification if order status changed
      if (data.status && previousStatus !== data.status) {
        try {
          await this.notificationService.handleOrderStatusChange(updatedOrder, previousStatus);
        } catch (error) {
          console.error('Failed to send status change notification:', error);
          // Don't fail the update if notification fails
        }
      }
      
      // Send notification if payment status changed
      if (data.payment_status && previousPaymentStatus !== data.payment_status) {
        try {
          await this.notificationService.handlePaymentStatusChange(updatedOrder, previousPaymentStatus);
        } catch (error) {
          console.error('Failed to send payment status notification:', error);
          // Don't fail the update if notification fails
        }
      }
    }
    
    return updatedOrder;
  }

  async cancelOrder(id: string, reason?: string): Promise<Order | null> {
    const order = await Order.findByPk(id);
    if (!order) {
      return null;
    }
    
    // Check if order can be cancelled
    if (!this.canCancelOrder(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }
    
    const previousStatus = order.status;
    
    await order.update({
      status: OrderStatus.CANCELLED,
      staff_notes: reason ? `Cancelled: ${reason}` : 'Order cancelled',
    });
    
    // TODO: Restore inventory if needed
    // TODO: Process refund if payment was made
    
    const cancelledOrder = await this.getOrderById(id);
    
    // Send cancellation notification
    if (cancelledOrder) {
      try {
        await this.notificationService.handleOrderStatusChange(cancelledOrder, previousStatus);
      } catch (error) {
        console.error('Failed to send cancellation notification:', error);
        // Don't fail the cancellation if notification fails
      }
    }
    
    return cancelledOrder;
  }

  async trackOrder(orderNumber: string, contactInfo: { email?: string; phone?: string }): Promise<Order | null> {
    const where: any = { order_number: orderNumber };
    
    // For guest orders, require matching contact info
    if (contactInfo.email || contactInfo.phone) {
      const contactWhere: any = [];
      if (contactInfo.email) {
        contactWhere.push({ guest_email: contactInfo.email });
        contactWhere.push({ '$user.email$': contactInfo.email });
      }
      if (contactInfo.phone) {
        contactWhere.push({ guest_phone: contactInfo.phone });
        contactWhere.push({ '$user.phone$': contactInfo.phone });
      }
      where[Op.or] = contactWhere;
    }
    
    return await Order.findOne({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
      ],
    });
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return await Order.findAll({
      where: { status },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  // Private helper methods
  private validateCustomerInfo(data: CreateOrderData): void {
    const hasUser = !!data.user_id;
    const hasGuestInfo = !!(data.guest_email || data.guest_phone);
    
    if (!hasUser && !hasGuestInfo) {
      throw new Error('Either user_id or guest contact information is required');
    }
    
    if (!hasUser) {
      if (!data.guest_name) {
        throw new Error('Guest name is required for guest orders');
      }
      if (!data.guest_email && !data.guest_phone) {
        throw new Error('Either guest email or phone is required');
      }
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order of today
    const lastOrder = await Order.findOne({
      where: {
        order_number: {
          [Op.like]: `ORD${dateStr}%`,
        },
      },
      order: [['createdAt', 'DESC']],
    });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.order_number.slice(-3));
      sequence = lastSequence + 1;
    }
    
    return `ORD${dateStr}${sequence.toString().padStart(3, '0')}`;
  }

  private async validateDirectItems(items: Array<{ product_id: string; quantity: number }>): Promise<any[]> {
    const cartItems = [];
    
    for (const item of items) {
      const product = await this.productService.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      
      cartItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: product.price * item.quantity,
      });
    }
    
    return cartItems;
  }

  private async validateInventory(cartItems: any[]): Promise<void> {
    for (const item of cartItems) {
      const product = await this.productService.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    }
  }

  private async calculateTotals(cartItems: any[], promoCode?: string): Promise<{ total: number; discount: number }> {
    let subtotal = 0;
    
    for (const item of cartItems) {
      subtotal += item.subtotal;
    }
    
    let discount = 0;
    
    if (promoCode) {
      const promo = await PromoCode.findOne({
        where: { code: promoCode },
      });
      
      if (promo && this.isPromoValid(promo)) {
        if (promo.discount_type === DiscountType.PERCENT) {
          discount = (subtotal * promo.amount) / 100;
          // For percentage discounts, limit to subtotal
          discount = Math.min(discount, subtotal);
        } else if (promo.discount_type === DiscountType.FIXED) {
          discount = Math.min(promo.amount, subtotal);
        }
      }
    }
    
    return {
      total: subtotal - discount,
      discount,
    };
  }

  private isPromoValid(promo: PromoCode): boolean {
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) return false;
    if (promo.valid_to && new Date(promo.valid_to) < now) return false;
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) return false;
    return true;
  }

  private async createOrderItems(orderId: string, cartItems: any[], transaction: Transaction): Promise<void> {
    const orderItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));
    
    await OrderItem.bulkCreate(orderItems, { transaction });
  }

  private async createCustomCakeConfigurations(orderId: string, cartItems: any[], transaction: Transaction): Promise<void> {
    const customConfigs = cartItems
      .filter(item => item.custom_cake_config)
      .map(item => ({
        order_id: orderId,
        ...item.custom_cake_config,
      }));
    
    if (customConfigs.length > 0) {
      await CustomCakeConfiguration.bulkCreate(customConfigs, { transaction });
    }
  }

  private async updateInventory(cartItems: any[]): Promise<void> {
    for (const item of cartItems) {
      await this.productService.updateStock(item.product_id, -item.quantity);
    }
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.PICKED_UP, OrderStatus.NO_SHOW, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [], // Final state
      [OrderStatus.CANCELLED]: [], // Final state
      [OrderStatus.NO_SHOW]: [], // Final state
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private canCancelOrder(status: OrderStatus): boolean {
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ].includes(status);
  }
}