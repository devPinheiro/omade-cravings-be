import { Order } from '../../../models/Order';
import { User } from '../../../models/User';
import { OrderItem } from '../../../models/OrderItem';
import { Product } from '../../../models/Product';
import { Op, literal } from 'sequelize';
import { sequelize } from '../../../config/database';

export interface CustomerStats {
  overview: {
    total_customers: number;
    registered_customers: number;
    guest_customers: number;
    customers_with_orders: number;
    customers_with_multiple_orders: number;
    average_order_value: number;
    total_customer_value: number;
  };
  top_customers: Array<{
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    customer_type: 'registered' | 'guest';
    total_orders: number;
    total_spent: number;
    avg_order_value: number;
    last_order_date: Date;
    first_order_date: Date;
  }>;
  customer_retention: {
    new_customers_this_month: number;
    returning_customers_this_month: number;
    retention_rate: number;
  };
  order_frequency: Array<{
    range: string;
    customer_count: number;
  }>;
  customer_segments: Array<{
    segment: string;
    customer_count: number;
    avg_order_value: number;
    total_revenue: number;
  }>;
}

export class CustomerService {
  async getCustomerStats(): Promise<CustomerStats> {
    try {
      // Get total registered users (customers only)
      const totalRegisteredCustomers = await User.count({
        where: { role: 'customer' }
      });

      // Get unique guest customers (based on email/phone)
      const guestCustomers = await Order.findAll({
        where: {
          user_id: { [Op.is]: null },
          [Op.or]: [
            { guest_email: { [Op.not]: null } },
            { guest_phone: { [Op.not]: null } }
          ]
        },
        attributes: ['guest_email', 'guest_phone'],
        group: ['guest_email', 'guest_phone'],
        raw: true
      });

      const totalGuestCustomers = guestCustomers.length;

      // Get customers with orders (registered)
      const customersWithOrders = await Order.findAll({
        where: { user_id: { [Op.not]: null } },
        attributes: ['user_id'],
        group: ['user_id'],
        raw: true
      });

      // Get customers with multiple orders
      const customersWithMultipleOrders = await Order.findAll({
        attributes: [
          'user_id',
          'guest_email',
          'guest_phone',
          [literal('COUNT(*)'), 'order_count']
        ],
        group: ['user_id', 'guest_email', 'guest_phone'],
        having: literal('COUNT(*) > 1'),
        raw: true
      });

      // Calculate average order value
      const averageOrderValue = await Order.findAll({
        attributes: [
          [literal('AVG(CAST(total_amount AS DECIMAL))'), 'avg_order_value']
        ],
        raw: true
      });

      // Calculate total customer lifetime value
      const totalCustomerValue = await Order.findAll({
        attributes: [
          [literal('SUM(CAST(total_amount AS DECIMAL))'), 'total_value']
        ],
        raw: true
      });

      // Get top customers by total spent
      const topCustomers = await this.getTopCustomers(20);

      // Get customer retention data
      const retentionData = await this.getCustomerRetention();

      // Get order frequency distribution
      const orderFrequency = await this.getOrderFrequencyDistribution();

      // Get customer segments
      const customerSegments = await this.getCustomerSegments();

      return {
        overview: {
          total_customers: totalRegisteredCustomers + totalGuestCustomers,
          registered_customers: totalRegisteredCustomers,
          guest_customers: totalGuestCustomers,
          customers_with_orders: customersWithOrders.length,
          customers_with_multiple_orders: customersWithMultipleOrders.length,
          average_order_value: parseFloat((averageOrderValue[0] as any)?.avg_order_value || '0'),
          total_customer_value: parseFloat((totalCustomerValue[0] as any)?.total_value || '0')
        },
        top_customers: topCustomers,
        customer_retention: retentionData,
        order_frequency: orderFrequency,
        customer_segments: customerSegments
      };
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw new Error('Failed to fetch customer statistics');
    }
  }

  async getTopCustomers(limit: number = 20) {
    // Get top registered customers
    const topRegisteredCustomers = await User.findAll({
      where: { role: 'customer' },
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        [literal('(SELECT COUNT(*) FROM orders WHERE orders.user_id = "User"."id")'), 'total_orders'],
        [literal('(SELECT COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) FROM orders WHERE orders.user_id = "User"."id")'), 'total_spent'],
        [literal('(SELECT COALESCE(AVG(CAST(total_amount AS DECIMAL)), 0) FROM orders WHERE orders.user_id = "User"."id")'), 'avg_order_value'],
        [literal('(SELECT MAX(createdAt) FROM orders WHERE orders.user_id = "User"."id")'), 'last_order_date'],
        [literal('(SELECT MIN(createdAt) FROM orders WHERE orders.user_id = "User"."id")'), 'first_order_date']
      ],
      having: literal('total_orders > 0'),
      order: [[literal('total_spent'), 'DESC']],
      limit: Math.floor(limit * 0.8), // 80% for registered customers
      raw: true
    });

    // Get top guest customers
    const topGuestCustomers = await Order.findAll({
      where: {
        user_id: { [Op.is]: null },
        [Op.or]: [
          { guest_email: { [Op.not]: null } },
          { guest_phone: { [Op.not]: null } }
        ]
      },
      attributes: [
        'guest_name',
        'guest_email',
        'guest_phone',
        [literal('COUNT(*)'), 'total_orders'],
        [literal('SUM(CAST(total_amount AS DECIMAL))'), 'total_spent'],
        [literal('AVG(CAST(total_amount AS DECIMAL))'), 'avg_order_value'],
        [literal('MAX(createdAt)'), 'last_order_date'],
        [literal('MIN(createdAt)'), 'first_order_date']
      ],
      group: ['guest_email', 'guest_phone', 'guest_name'],
      order: [[literal('total_spent'), 'DESC']],
      limit: Math.ceil(limit * 0.2), // 20% for guest customers
      raw: true
    });

    // Combine and format results
    const formattedRegistered = topRegisteredCustomers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      customer_type: 'registered' as const,
      total_orders: parseInt(customer.total_orders || '0'),
      total_spent: parseFloat(customer.total_spent || '0'),
      avg_order_value: parseFloat(customer.avg_order_value || '0'),
      last_order_date: customer.last_order_date,
      first_order_date: customer.first_order_date
    }));

    const formattedGuest = topGuestCustomers.map((customer: any) => ({
      name: customer.guest_name || 'Guest Customer',
      email: customer.guest_email,
      phone: customer.guest_phone,
      customer_type: 'guest' as const,
      total_orders: parseInt(customer.total_orders || '0'),
      total_spent: parseFloat(customer.total_spent || '0'),
      avg_order_value: parseFloat(customer.avg_order_value || '0'),
      last_order_date: customer.last_order_date,
      first_order_date: customer.first_order_date
    }));

    // Combine and sort by total spent
    const allCustomers = [...formattedRegistered, ...formattedGuest]
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, limit);

    return allCustomers;
  }

  async getCustomerRetention() {
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(currentMonth.getMonth() - 1);

    // New customers this month (first order this month)
    const newCustomersThisMonth = await sequelize.query(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM (
        SELECT user_id as customer_id, MIN(createdAt) as first_order
        FROM orders 
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        UNION ALL
        SELECT CONCAT(guest_email, '_', guest_phone) as customer_id, MIN(createdAt) as first_order
        FROM orders 
        WHERE user_id IS NULL AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
        GROUP BY guest_email, guest_phone
      ) first_orders
      WHERE DATE_TRUNC('month', first_order) = DATE_TRUNC('month', CURRENT_DATE)
    `, { type: 'SELECT', raw: true });

    // Returning customers this month (had orders before this month and also this month)
    const returningCustomersThisMonth = await sequelize.query(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM (
        SELECT user_id as customer_id
        FROM orders 
        WHERE user_id IS NOT NULL 
          AND DATE_TRUNC('month', createdAt) = DATE_TRUNC('month', CURRENT_DATE)
          AND user_id IN (
            SELECT user_id 
            FROM orders 
            WHERE user_id IS NOT NULL 
              AND DATE_TRUNC('month', createdAt) < DATE_TRUNC('month', CURRENT_DATE)
          )
        UNION ALL
        SELECT CONCAT(guest_email, '_', guest_phone) as customer_id
        FROM orders 
        WHERE user_id IS NULL 
          AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
          AND DATE_TRUNC('month', createdAt) = DATE_TRUNC('month', CURRENT_DATE)
          AND CONCAT(guest_email, '_', guest_phone) IN (
            SELECT CONCAT(guest_email, '_', guest_phone)
            FROM orders 
            WHERE user_id IS NULL 
              AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
              AND DATE_TRUNC('month', createdAt) < DATE_TRUNC('month', CURRENT_DATE)
          )
      ) returning_customers
    `, { type: 'SELECT', raw: true });

    const newCount = (newCustomersThisMonth[0] as any)?.count || 0;
    const returningCount = (returningCustomersThisMonth[0] as any)?.count || 0;
    const totalThisMonth = newCount + returningCount;
    const retentionRate = totalThisMonth > 0 ? (returningCount / totalThisMonth) * 100 : 0;

    return {
      new_customers_this_month: parseInt(newCount),
      returning_customers_this_month: parseInt(returningCount),
      retention_rate: parseFloat(retentionRate.toFixed(2))
    };
  }

  async getOrderFrequencyDistribution() {
    const orderFrequency = await sequelize.query(`
      SELECT 
        CASE 
          WHEN order_count = 1 THEN '1 order'
          WHEN order_count BETWEEN 2 AND 5 THEN '2-5 orders'
          WHEN order_count BETWEEN 6 AND 10 THEN '6-10 orders'
          WHEN order_count > 10 THEN '10+ orders'
        END as range,
        COUNT(*) as customer_count
      FROM (
        SELECT user_id, COUNT(*) as order_count
        FROM orders 
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        UNION ALL
        SELECT CONCAT(guest_email, '_', guest_phone) as customer_id, COUNT(*) as order_count
        FROM orders 
        WHERE user_id IS NULL AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
        GROUP BY guest_email, guest_phone
      ) customer_orders
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '1 order' THEN 1
          WHEN '2-5 orders' THEN 2
          WHEN '6-10 orders' THEN 3
          WHEN '10+ orders' THEN 4
        END
    `, { type: 'SELECT', raw: true });

    return orderFrequency.map((item: any) => ({
      range: item.range,
      customer_count: parseInt(item.customer_count)
    }));
  }

  async getCustomerSegments() {
    const segments = await sequelize.query(`
      SELECT 
        CASE 
          WHEN total_spent >= 1000 THEN 'VIP'
          WHEN total_spent >= 500 THEN 'High Value'
          WHEN total_spent >= 100 THEN 'Regular'
          ELSE 'New/Low Value'
        END as segment,
        COUNT(*) as customer_count,
        AVG(avg_order_value) as avg_order_value,
        SUM(total_spent) as total_revenue
      FROM (
        SELECT 
          user_id,
          SUM(CAST(total_amount AS DECIMAL)) as total_spent,
          AVG(CAST(total_amount AS DECIMAL)) as avg_order_value
        FROM orders 
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        UNION ALL
        SELECT 
          CONCAT(guest_email, '_', guest_phone) as customer_id,
          SUM(CAST(total_amount AS DECIMAL)) as total_spent,
          AVG(CAST(total_amount AS DECIMAL)) as avg_order_value
        FROM orders 
        WHERE user_id IS NULL AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
        GROUP BY guest_email, guest_phone
      ) customer_totals
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'VIP' THEN 1
          WHEN 'High Value' THEN 2
          WHEN 'Regular' THEN 3
          WHEN 'New/Low Value' THEN 4
        END
    `, { type: 'SELECT', raw: true });

    return segments.map((item: any) => ({
      segment: item.segment,
      customer_count: parseInt(item.customer_count),
      avg_order_value: parseFloat(item.avg_order_value || '0'),
      total_revenue: parseFloat(item.total_revenue || '0')
    }));
  }

  async getAllCustomers(page: number = 1, limit: number = 20, filters: {
    customerType?: 'registered' | 'guest';
    minSpent?: number;
    maxSpent?: number;
    search?: string;
    sortBy?: 'name' | 'totalSpent' | 'totalOrders' | 'lastOrder';
    sortOrder?: 'ASC' | 'DESC';
  } = {}) {
    const offset = (page - 1) * limit;
    const { customerType, minSpent, maxSpent, search, sortBy = 'totalSpent', sortOrder = 'DESC' } = filters;

    let registeredCustomers: any[] = [];
    let guestCustomers: any[] = [];
    
    // Get registered customers if not filtering for guests only
    if (customerType !== 'guest') {
      const registeredQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          'registered' as customer_type,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(CAST(o.total_amount AS DECIMAL)), 0) as total_spent,
          COALESCE(AVG(CAST(o.total_amount AS DECIMAL)), 0) as avg_order_value,
          MAX(o."createdAt") as last_order_date,
          MIN(o."createdAt") as first_order_date,
          u."createdAt" as registered_date
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
        ${search ? `AND (u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%')` : ''}
        GROUP BY u.id, u.name, u.email, u.phone, u."createdAt"
        ${minSpent ? `HAVING SUM(CAST(o.total_amount AS DECIMAL)) >= ${minSpent}` : ''}
        ${maxSpent ? `${minSpent ? 'AND' : 'HAVING'} SUM(CAST(o.total_amount AS DECIMAL)) <= ${maxSpent}` : ''}
      `;

      registeredCustomers = await sequelize.query(registeredQuery, { type: 'SELECT', raw: true });
    }

    // Get guest customers if not filtering for registered only
    if (customerType !== 'registered') {
      const guestQuery = `
        SELECT 
          CONCAT(guest_email, '_', guest_phone) as id,
          COALESCE(guest_name, 'Guest Customer') as name,
          guest_email as email,
          guest_phone as phone,
          'guest' as customer_type,
          COUNT(*) as total_orders,
          SUM(CAST(total_amount AS DECIMAL)) as total_spent,
          AVG(CAST(total_amount AS DECIMAL)) as avg_order_value,
          MAX("createdAt") as last_order_date,
          MIN("createdAt") as first_order_date,
          MIN("createdAt") as registered_date
        FROM orders 
        WHERE user_id IS NULL 
          AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
        ${search ? `AND (guest_name ILIKE '%${search}%' OR guest_email ILIKE '%${search}%')` : ''}
        GROUP BY guest_email, guest_phone, guest_name
        ${minSpent ? `HAVING SUM(CAST(total_amount AS DECIMAL)) >= ${minSpent}` : ''}
        ${maxSpent ? `${minSpent ? 'AND' : 'HAVING'} SUM(CAST(total_amount AS DECIMAL)) <= ${maxSpent}` : ''}
      `;

      guestCustomers = await sequelize.query(guestQuery, { type: 'SELECT', raw: true });
    }

    // Combine and format results
    const allCustomers = [
      ...registeredCustomers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customer_type: customer.customer_type,
        total_orders: parseInt(customer.total_orders || '0'),
        total_spent: parseFloat(customer.total_spent || '0'),
        avg_order_value: parseFloat(customer.avg_order_value || '0'),
        last_order_date: customer.last_order_date,
        first_order_date: customer.first_order_date,
        registered_date: customer.registered_date
      })),
      ...guestCustomers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customer_type: customer.customer_type,
        total_orders: parseInt(customer.total_orders || '0'),
        total_spent: parseFloat(customer.total_spent || '0'),
        avg_order_value: parseFloat(customer.avg_order_value || '0'),
        last_order_date: customer.last_order_date,
        first_order_date: customer.first_order_date,
        registered_date: customer.registered_date
      }))
    ];

    // Sort customers
    const sortedCustomers = allCustomers.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalSpent':
          aValue = a.total_spent;
          bValue = b.total_spent;
          break;
        case 'totalOrders':
          aValue = a.total_orders;
          bValue = b.total_orders;
          break;
        case 'lastOrder':
          aValue = new Date(a.last_order_date || 0);
          bValue = new Date(b.last_order_date || 0);
          break;
        default:
          aValue = a.total_spent;
          bValue = b.total_spent;
      }

      if (sortOrder === 'ASC') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const paginatedCustomers = sortedCustomers.slice(offset, offset + limit);
    const totalCustomers = sortedCustomers.length;
    const totalPages = Math.ceil(totalCustomers / limit);

    return {
      customers: paginatedCustomers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCustomers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async getCustomerDetails(customerId?: string, guestEmail?: string, guestPhone?: string) {
    if (customerId) {
      // Get registered customer details
      const customer = await User.findOne({
        where: { 
          id: customerId,
          role: 'customer' 
        }
      });

      if (!customer) {
        return null;
      }

      // Get customer orders
      const orders = await Order.findAll({
        where: { user_id: customerId },
        include: [
          {
            model: OrderItem,
            include: [Product]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
      const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customer_type: 'registered',
        total_orders: orders.length,
        total_spent: totalSpent,
        avg_order_value: avgOrderValue,
        last_order_date: orders[0]?.createdAt,
        first_order_date: orders[orders.length - 1]?.createdAt,
        orders: orders
      };
    } else if (guestEmail || guestPhone) {
      // Get guest customer details
      const whereClause: any = { user_id: { [Op.is]: null } };
      if (guestEmail) whereClause.guest_email = guestEmail;
      if (guestPhone) whereClause.guest_phone = guestPhone;

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            include: [Product]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (orders.length === 0) {
        return null;
      }

      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
      const avgOrderValue = totalSpent / orders.length;
      const firstOrder = orders[0];

      return {
        name: firstOrder.guest_name || 'Guest Customer',
        email: firstOrder.guest_email,
        phone: firstOrder.guest_phone,
        customer_type: 'guest',
        total_orders: orders.length,
        total_spent: totalSpent,
        avg_order_value: avgOrderValue,
        last_order_date: orders[0]?.createdAt,
        first_order_date: orders[orders.length - 1]?.createdAt,
        orders: orders
      };
    }

    return null;
  }
}