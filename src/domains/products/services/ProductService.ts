import { Product } from '../../../models/Product';
import { Review } from '../../../models/Review';
import { Op, literal } from 'sequelize';
import { sequelize } from '../../../config/database';

export interface ProductFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock: number;
  image_url?: string;
  is_customizable?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export class ProductService {
  async createProduct(data: CreateProductData): Promise<Product> {
    return await Product.create(data as any);
  }

  async getProducts(filters: ProductFilters = {}) {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (minPrice !== undefined) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    if (inStock) {
      where.stock = { [Op.gt]: 0 };
    }

    const orderOptions: any = {
      name: [['name', sortOrder]],
      price: [['price', sortOrder]],
      createdAt: [['createdAt', sortOrder]],
      rating: [literal('avg_rating'), sortOrder === 'DESC' ? 'DESC NULLS LAST' : 'ASC NULLS LAST']
    };

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      offset,
      limit,
      order: orderOptions[sortBy] || [['createdAt', 'DESC']],
      attributes: {
        include: [
          [literal('(SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviews.product_id = "Product"."id")'), 'avg_rating'],
          [literal('(SELECT COUNT(*) FROM reviews WHERE reviews.product_id = "Product"."id")'), 'review_count']
        ]
      },
      distinct: true
    });

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    return await Product.findByPk(id);
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) {
      return null;
    }

    await product.update(data);
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const deleted = await Product.destroy({
      where: { id },
    });
    return deleted > 0;
  }

  async updateStock(id: string, stockChange: number): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) {
      return null;
    }

    const newStock = product.stock + stockChange;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    await product.update({ stock: newStock });
    return product;
  }

  async getCategories(): Promise<string[]> {
    const categories = await Product.findAll({
      attributes: [[literal('DISTINCT category'), 'category']],
      where: {
        category: { [Op.not]: null }
      },
      order: [['category', 'ASC']]
    });
    return categories.map((cat: any) => cat.dataValues.category).filter(Boolean);
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    return await Product.findAll({
      where: {
        stock: { [Op.lte]: threshold }
      },
      order: [['stock', 'ASC']]
    });
  }

  async bulkUpdateStock(updates: { id: string; stock: number }[]): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      for (const update of updates) {
        await Product.update(
          { stock: update.stock },
          { where: { id: update.id }, transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getProductWithReviews(id: string): Promise<Product | null> {
    return await Product.findByPk(id, {
      attributes: {
        include: [
          [literal('(SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviews.product_id = "Product"."id")'), 'avg_rating'],
          [literal('(SELECT COUNT(*) FROM reviews WHERE reviews.product_id = "Product"."id")'), 'review_count']
        ]
      }
    });
  }
}