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

  async getProductStats(): Promise<any> {
    try {
      // Get total products count
      const totalProducts = await Product.count();

      // Get products by category
      const productsByCategory = await Product.findAll({
        attributes: [
          'category',
          [literal('COUNT(*)'), 'count']
        ],
        group: ['category'],
        raw: true
      });

      // Get low stock products (threshold: 5)
      const lowStockCount = await Product.count({
        where: {
          stock: { [Op.lte]: 5 }
        }
      });

      // Get out of stock products
      const outOfStockCount = await Product.count({
        where: {
          stock: { [Op.eq]: 0 }
        }
      });

      // Get average price by category
      const avgPriceByCategory = await Product.findAll({
        attributes: [
          'category',
          [literal('AVG(CAST(price AS DECIMAL))'), 'avg_price'],
          [literal('COUNT(*)'), 'product_count']
        ],
        group: ['category'],
        raw: true
      });

      // Get top rated products (using reviews) - rewrite as a proper SQL query
      const topRatedProducts = await sequelize.query(`
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          COALESCE(AVG(CAST(r.rating AS DECIMAL)), 0) as avg_rating,
          COUNT(r.id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        GROUP BY p.id, p.name, p.category, p.price
        HAVING COUNT(r.id) > 0
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 10
      `, { type: 'SELECT', raw: true });

      // Get recently added products
      const recentProducts = await Product.findAll({
        attributes: ['id', 'name', 'category', 'price', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true
      });

      // Get total stock value
      const stockValue = await Product.findAll({
        attributes: [
          [literal('SUM(CAST(price AS DECIMAL) * stock)'), 'total_value']
        ],
        raw: true
      });

      // Get products with no image
      const noImageCount = await Product.count({
        where: {
          [Op.or]: [
            { image_url: null },
            { image_url: '' }
          ]
        }
      });

      // Get customizable products count
      const customizableCount = await Product.count({
        where: {
          is_customizable: true
        }
      });

      return {
        overview: {
          total_products: totalProducts,
          low_stock_products: lowStockCount,
          out_of_stock_products: outOfStockCount,
          customizable_products: customizableCount,
          products_without_image: noImageCount,
          total_inventory_value: parseFloat((stockValue[0] as any)?.total_value || '0')
        },
        categories: {
          distribution: productsByCategory.map((item: any) => ({
            category: item.category || 'Uncategorized',
            count: parseInt(item.count)
          })),
          pricing: avgPriceByCategory.map((item: any) => ({
            category: item.category || 'Uncategorized',
            average_price: parseFloat(item.avg_price || '0'),
            product_count: parseInt(item.product_count)
          }))
        },
        top_rated_products: topRatedProducts.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: parseFloat(item.price),
          avg_rating: parseFloat(item.avg_rating || '0'),
          review_count: parseInt(item.review_count || '0')
        })),
        recent_products: recentProducts.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: parseFloat(item.price),
          created_at: item.createdAt
        })),
        stock_analysis: {
          low_stock_threshold: 5,
          products_needing_restock: lowStockCount,
          out_of_stock: outOfStockCount,
          total_inventory_value: parseFloat((stockValue[0] as any)?.total_value || '0')
        }
      };
    } catch (error) {
      console.error('Error fetching product statistics:', error);
      throw new Error('Failed to fetch product statistics');
    }
  }
}