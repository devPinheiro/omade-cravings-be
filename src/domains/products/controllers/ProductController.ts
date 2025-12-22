import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../../../config/cloudinary';

const productService = new ProductService();

export class ProductController {
  async createProduct(req: Request, res: Response) {
    try {
      let productData = req.body;

      // Handle image upload if provided
      if (req.file) {
        try {
          const imageUpload = await uploadImageToCloudinary(req.file.buffer);
          productData.image_url = imageUpload.url;
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            error: 'Failed to upload image',
          });
        }
      }

      const product = await productService.createProduct(productData);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock === 'true',
        sortBy: req.query.sortBy as 'name' | 'price' | 'createdAt' | 'rating' || 'createdAt',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'DESC',
      };

      const result = await productService.getProducts(filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includeReviews = req.query.includeReviews === 'true';
      
      const product = includeReviews 
        ? await productService.getProductWithReviews(id)
        : await productService.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await productService.deleteProduct(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await productService.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  }

  async getLowStockProducts(req: Request, res: Response) {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const products = await productService.getLowStockProducts(threshold);
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch low stock products',
      });
    }
  }

  async bulkUpdateStock(req: Request, res: Response) {
    try {
      const updates = req.body.updates;
      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array',
        });
      }

      await productService.bulkUpdateStock(updates);
      res.json({
        success: true,
        message: 'Stock updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stock',
      });
    }
  }

  async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stockChange } = req.body;

      if (typeof stockChange !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Stock change must be a number',
        });
      }

      const product = await productService.updateStock(id, stockChange);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stock',
      });
    }
  }

  async getProductStats(req: Request, res: Response) {
    try {
      const stats = await productService.getProductStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product statistics',
      });
    }
  }
}