import { Request, Response } from 'express';
import { CustomCakeService } from '../services/CustomCakeService';
import { 
  validateCakeConfiguration, 
  validatePricingRequest,
  quickPriceEstimateSchema,
  getValidationOptions,
  validateCompatibility
} from '../validation/cakeConfigValidation';
import { UserRole } from '../../../models/User';
import { CustomCakeConfiguration } from '../models/CakePricingConfig';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class CustomCakeController {
  private customCakeService = new CustomCakeService();

  /**
   * Get all available configuration options (sizes, flavors, frostings, etc.)
   */
  async getConfigurationOptions(req: Request, res: Response) {
    try {
      const options = this.customCakeService.getConfigurationOptions();
      
      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch configuration options',
      });
    }
  }

  /**
   * Get cake templates with optional filtering
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const { 
        category, 
        popular, 
        difficulty, 
        min_price, 
        max_price, 
        search,
        limit 
      } = req.query;

      let templates;

      if (search) {
        templates = this.customCakeService.searchTemplates(search as string);
      } else if (category) {
        templates = this.customCakeService.getTemplatesByCategory(category as any);
      } else if (popular === 'true') {
        templates = this.customCakeService.getPopularTemplates();
      } else if (difficulty) {
        templates = this.customCakeService.getTemplatesByDifficulty(parseInt(difficulty as string));
      } else if (min_price && max_price) {
        templates = this.customCakeService.getTemplatesByPriceRange(
          parseInt(min_price as string),
          parseInt(max_price as string)
        );
      } else {
        templates = this.customCakeService.getPopularTemplates();
      }

      // Apply limit if specified
      if (limit) {
        templates = templates.slice(0, parseInt(limit as string));
      }
      
      res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cake templates',
      });
    }
  }

  /**
   * Get specific template by ID
   */
  async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = this.customCakeService.getTemplateById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      }

      // Calculate actual pricing for the template
      const pricing = this.customCakeService.calculatePricing(template.configuration);
      
      res.json({
        success: true,
        data: {
          ...template,
          actual_pricing: pricing,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template',
      });
    }
  }

  /**
   * Calculate comprehensive pricing for a cake configuration
   */
  async calculatePricing(req: Request, res: Response) {
    try {
      const validation = await validatePricingRequest(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          details: validation.errors,
        });
      }

      const { configuration, requested_date } = req.body;

      // Validate configuration compatibility
      const configValidation = this.customCakeService.validateConfiguration(validation.data!.configuration as CustomCakeConfiguration);
      
      if (!configValidation.compatible) {
        return res.status(400).json({
          success: false,
          error: 'Configuration compatibility issues',
          details: {
            issues: configValidation.issues,
            suggestions: configValidation.suggestions,
          },
        });
      }

      // Calculate pricing
      const pricing = this.customCakeService.calculatePricing(validation.data!.configuration as CustomCakeConfiguration);
      
      // Check availability if date provided
      let availability;
      if (requested_date) {
        availability = this.customCakeService.checkAvailability(validation.data!.configuration as CustomCakeConfiguration, new Date(requested_date));
      }

      res.json({
        success: true,
        data: {
          pricing,
          availability: availability || null,
          configuration_valid: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate pricing',
      });
    }
  }

  /**
   * Get quick price estimate for size and complexity
   */
  async getQuickPriceEstimate(req: Request, res: Response) {
    try {
      const validation = await quickPriceEstimateSchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      const { size_id, complexity_level } = validation;
      const estimate = this.customCakeService.getQuickPriceEstimate(size_id, complexity_level);

      res.json({
        success: true,
        data: {
          size_id,
          complexity_level,
          estimated_price: estimate,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: (error as any).errors,
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get price estimate',
      });
    }
  }

  /**
   * Validate a cake configuration without calculating pricing
   */
  async validateConfiguration(req: Request, res: Response) {
    try {
      const validation = await validateCakeConfiguration(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Configuration validation failed',
          details: validation.errors,
        });
      }

      // Additional compatibility checks
      const compatibilityCheck = this.customCakeService.validateConfiguration(validation.data! as CustomCakeConfiguration);
      const compatibilityValidation = validateCompatibility(validation.data! as CustomCakeConfiguration);

      const allIssues = [
        ...compatibilityCheck.issues,
        ...compatibilityValidation.issues,
      ];

      res.json({
        success: true,
        data: {
          valid: allIssues.length === 0,
          configuration: validation.data,
          issues: allIssues,
          suggestions: compatibilityCheck.suggestions,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate configuration',
      });
    }
  }

  /**
   * Check availability for specific date
   */
  async checkAvailability(req: Request, res: Response) {
    try {
      const { configuration, requested_date } = req.body;

      if (!requested_date) {
        return res.status(400).json({
          success: false,
          error: 'Requested date is required',
        });
      }

      // Validate configuration first
      const validation = await validateCakeConfiguration(configuration);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          details: validation.errors,
        });
      }

      const availability = this.customCakeService.checkAvailability(
        validation.data! as CustomCakeConfiguration,
        new Date(requested_date)
      );

      res.json({
        success: true,
        data: {
          requested_date,
          availability,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
      });
    }
  }

  /**
   * Get validation options and constraints
   */
  async getValidationOptions(req: Request, res: Response) {
    try {
      const options = getValidationOptions();
      
      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch validation options',
      });
    }
  }

  /**
   * Get specific configuration recommendations based on input
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      const { 
        occasion, 
        guest_count, 
        budget_range, 
        dietary_needs,
        complexity_preference 
      } = req.query;

      const recommendations: any = {
        recommended_templates: [],
        suggested_sizes: [],
        budget_friendly_options: [],
      };

      // Size recommendations based on guest count
      if (guest_count) {
        const count = parseInt(guest_count as string);
        const options = this.customCakeService.getConfigurationOptions();
        
        recommendations.suggested_sizes = options.sizes
          .filter(size => {
            const serves = size.serves.toLowerCase();
            const maxGuests = parseInt(serves.split('-')[1] || serves) || 0;
            return maxGuests >= count;
          })
          .slice(0, 3) // Top 3 recommendations
          .map(size => ({
            ...size,
            estimated_price: this.customCakeService.getQuickPriceEstimate(size.id, 2)
          }));
      }

      // Template recommendations based on occasion
      if (occasion) {
        const templates = this.customCakeService.getPopularTemplates();
        recommendations.recommended_templates = templates
          .filter(template => 
            template.category === occasion || 
            template.name.toLowerCase().includes(occasion as string)
          )
          .slice(0, 5);
      }

      // Budget-friendly options
      if (budget_range) {
        const [min, max] = (budget_range as string).split('-').map(n => parseInt(n));
        const options = this.customCakeService.getConfigurationOptions();
        
        recommendations.budget_friendly_options = options.sizes
          .map(size => {
            const estimate = this.customCakeService.getQuickPriceEstimate(size.id, 1);
            return {
              size,
              estimated_price: estimate,
              within_budget: estimate.max <= max,
            };
          })
          .filter(option => option.within_budget)
          .slice(0, 4);
      }

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
      });
    }
  }

  /**
   * Admin only: Get configuration analytics
   */
  async getConfigurationAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin permissions
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      // This would typically fetch from database analytics
      // For now, return mock analytics data
      const analytics = {
        popular_sizes: [
          { size: 'medium_8', count: 45, percentage: 35 },
          { size: 'small_6', count: 38, percentage: 30 },
          { size: 'large_10', count: 25, percentage: 20 },
        ],
        popular_flavors: [
          { flavor: 'chocolate', count: 52, percentage: 40 },
          { flavor: 'vanilla', count: 39, percentage: 30 },
          { flavor: 'red_velvet', count: 26, percentage: 20 },
        ],
        average_complexity: 2.3,
        average_price: 65.50,
        rush_order_percentage: 15,
        dietary_restriction_requests: [
          { restriction: 'gluten_free', count: 12, percentage: 18 },
          { restriction: 'vegan', count: 8, percentage: 12 },
        ],
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      });
    }
  }
}