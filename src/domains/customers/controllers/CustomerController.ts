import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';

const customerService = new CustomerService();

export class CustomerController {
  async getAllCustomers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        customerType: req.query.customerType as 'registered' | 'guest',
        minSpent: req.query.minSpent ? parseFloat(req.query.minSpent as string) : undefined,
        maxSpent: req.query.maxSpent ? parseFloat(req.query.maxSpent as string) : undefined,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as 'name' | 'totalSpent' | 'totalOrders' | 'lastOrder') || 'totalSpent',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
      };

      const result = await customerService.getAllCustomers(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
      });
    }
  }

  async getCustomerStats(req: Request, res: Response) {
    try {
      const stats = await customerService.getCustomerStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer statistics',
      });
    }
  }

  async getTopCustomers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const customers = await customerService.getTopCustomers(limit);
      res.json({
        success: true,
        data: {
          customers,
          total: customers.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top customers',
      });
    }
  }

  async getCustomerDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { guestEmail, guestPhone } = req.query;

      let customer;
      
      if (id && id !== 'guest') {
        customer = await customerService.getCustomerDetails(id);
      } else if (guestEmail || guestPhone) {
        customer = await customerService.getCustomerDetails(
          undefined,
          guestEmail as string,
          guestPhone as string
        );
      } else {
        return res.status(400).json({
          success: false,
          error: 'Customer ID or guest email/phone is required',
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer details',
      });
    }
  }

  async getCustomerRetention(req: Request, res: Response) {
    try {
      const retention = await customerService.getCustomerRetention();
      res.json({
        success: true,
        data: retention,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer retention data',
      });
    }
  }

  async getOrderFrequencyDistribution(req: Request, res: Response) {
    try {
      const distribution = await customerService.getOrderFrequencyDistribution();
      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order frequency distribution',
      });
    }
  }

  async getCustomerSegments(req: Request, res: Response) {
    try {
      const segments = await customerService.getCustomerSegments();
      res.json({
        success: true,
        data: segments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer segments',
      });
    }
  }
}