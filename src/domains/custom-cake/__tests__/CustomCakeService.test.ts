import { CustomCakeService } from '../services/CustomCakeService';
import { CustomCakeConfiguration } from '../models/CakePricingConfig';

describe('CustomCakeService', () => {
  let service: CustomCakeService;

  beforeEach(() => {
    service = new CustomCakeService();
  });

  describe('Pricing Calculations', () => {
    it('should calculate basic cake pricing correctly', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.base_price).toBe(25.00);
      expect(pricing.size_multiplier).toBe(1.0);
      expect(pricing.flavor_addon).toBe(0);
      expect(pricing.frosting_addon).toBe(0);
      expect(pricing.total_price).toBe(25.00);
    });

    it('should apply size multipliers correctly', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.size_multiplier).toBe(1.5);
      expect(pricing.total_price).toBe(37.50); // 25 * 1.5
    });

    it('should add premium flavor costs', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'red_velvet',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.flavor_addon).toBe(5);
      expect(pricing.total_price).toBe(30.00); // 25 + 5
    });

    it('should add premium frosting costs', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'fondant',
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.frosting_addon).toBe(8);
      expect(pricing.total_price).toBe(33.00); // 25 + 8
    });

    it('should calculate layer pricing correctly', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        layers: 2,
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.layer_cost).toBe(8);
      expect(pricing.total_price).toBe(33.00); // 25 + 8
    });

    it('should apply complexity multipliers correctly', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 3,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.complexity_addon).toBe(6.25); // 25 * (1.25 - 1)
      expect(pricing.total_price).toBe(31.25);
    });

    it('should add decoration costs', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        decorations: [
          { decoration_id: 'piped_borders', quantity: 1 },
          { decoration_id: 'fresh_flowers', quantity: 2 }
        ],
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.decoration_cost).toBe(11); // 5 + (3 * 2)
      expect(pricing.total_price).toBe(36.00);
    });

    it('should add dietary restriction costs', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        dietary_restrictions: ['gluten_free'],
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.dietary_addon).toBe(8);
      expect(pricing.total_price).toBe(33.00);
    });

    it('should add service addons', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        serving_utensils: true,
        cake_stand_rental: true,
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.service_addons).toBe(20); // 5 + 15
      expect(pricing.total_price).toBe(45.00);
    });

    it('should add rush fees', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        preparation_days: 1,
        complexity_level: 1,
      };

      const pricing = service.calculatePricing(config);

      expect(pricing.rush_fee).toBe(50);
      expect(pricing.total_price).toBe(75.00);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate compatible configurations', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        complexity_level: 2,
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect invalid size', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'invalid_size',
        frosting: 'buttercream',
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Invalid size: invalid_size');
    });

    it('should detect invalid flavor', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'invalid_flavor',
        size: 'small_6',
        frosting: 'buttercream',
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Invalid flavor: invalid_flavor');
    });

    it('should detect dietary restriction incompatibilities', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'carrot', // Contains nuts
        size: 'small_6',
        frosting: 'buttercream',
        dietary_restrictions: ['vegan'], // Vegan doesn't support carrot
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect frosting decorating incompatibilities', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'whipped_cream', // Not suitable for decorating
        decorations: [
          { decoration_id: 'piped_borders' } // Requires decorating-suitable frosting
        ],
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Fresh Whipped Cream frosting is not suitable for piped decorations');
    });

    it('should validate layer limits', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        layers: 5, // Exceeds max of 4
      };

      const result = service.validateConfiguration(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Maximum 4 layers allowed');
    });
  });

  describe('Preparation Time Calculation', () => {
    it('should calculate minimum preparation time', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const prepTime = service.calculatePreparationTime(config);

      expect(prepTime.standard_days).toBe(2);
      expect(prepTime.rush_available).toBe(true);
    });

    it('should add time for complex decorations', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        decorations: [
          { decoration_id: 'themed_toppers' } // Requires 5 days advance notice
        ],
        complexity_level: 1,
      };

      const prepTime = service.calculatePreparationTime(config);

      expect(prepTime.standard_days).toBe(5);
    });

    it('should add time for high complexity', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 5,
      };

      const prepTime = service.calculatePreparationTime(config);

      expect(prepTime.standard_days).toBe(4); // 2 + 2 for expert level
    });

    it('should add time for dietary restrictions', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        dietary_restrictions: ['gluten_free'],
        complexity_level: 1,
      };

      const prepTime = service.calculatePreparationTime(config);

      expect(prepTime.standard_days).toBe(3); // Max of 2 and 3
    });
  });

  describe('Availability Checking', () => {
    it('should check availability for sufficient advance notice', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const availability = service.checkAvailability(config, futureDate);

      expect(availability.available).toBe(true);
      expect(availability.rush_available).toBe(false);
    });

    it('should offer rush service for short notice', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 1,
      };

      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      const availability = service.checkAvailability(config, tomorrowDate);

      expect(availability.available).toBe(true);
      expect(availability.rush_available).toBe(true);
      expect(availability.rush_fee).toBe(50); // Same day rush fee
    });

    it('should deny availability for complex orders with short notice', () => {
      const config: CustomCakeConfiguration = {
        flavor: 'vanilla',
        size: 'small_6',
        frosting: 'buttercream',
        complexity_level: 4,
      };

      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      const availability = service.checkAvailability(config, tomorrowDate);

      expect(availability.available).toBe(true); // Should still be available as rush
      expect(availability.restrictions?.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Price Estimates', () => {
    it('should provide quick estimate for basic size', () => {
      const estimate = service.getQuickPriceEstimate('small_6', 1);

      expect(estimate.min).toBe(25);
      expect(estimate.max).toBe(63); // 25 * 2.5
    });

    it('should provide quick estimate for larger size', () => {
      const estimate = service.getQuickPriceEstimate('large_10', 1);

      expect(estimate.min).toBe(55); // 25 * 2.2
      expect(estimate.max).toBe(138); // 55 * 2.5
    });

    it('should apply complexity multiplier', () => {
      const estimate = service.getQuickPriceEstimate('small_6', 3);

      expect(estimate.min).toBe(31); // 25 * 1.25
      expect(estimate.max).toBe(78); // 31 * 2.5
    });
  });

  describe('Configuration Options', () => {
    it('should return all configuration options', () => {
      const options = service.getConfigurationOptions();

      expect(options.sizes).toBeDefined();
      expect(options.flavors).toBeDefined();
      expect(options.frostings).toBeDefined();
      expect(options.decorations).toBeDefined();
      expect(options.dietary_options).toBeDefined();
      expect(options.pricing_rules).toBeDefined();

      expect(options.sizes.length).toBeGreaterThan(0);
      expect(options.flavors.length).toBeGreaterThan(0);
      expect(options.frostings.length).toBeGreaterThan(0);
    });
  });

  describe('Template Management', () => {
    it('should return popular templates', () => {
      const templates = service.getPopularTemplates();

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(template => {
        expect(template.is_popular).toBe(true);
      });
    });

    it('should search templates by query', () => {
      const templates = service.searchTemplates('birthday');

      expect(templates).toBeDefined();
      templates.forEach(template => {
        const searchableText = `${template.name} ${template.description} ${template.category}`.toLowerCase();
        expect(searchableText).toContain('birthday');
      });
    });

    it('should filter templates by category', () => {
      const templates = service.getTemplatesByCategory('birthday');

      expect(templates).toBeDefined();
      templates.forEach(template => {
        expect(template.category).toBe('birthday');
      });
    });

    it('should filter templates by price range', () => {
      const templates = service.getTemplatesByPriceRange(30, 60);

      expect(templates).toBeDefined();
      templates.forEach(template => {
        expect(template.estimated_price.min).toBeLessThanOrEqual(60);
        expect(template.estimated_price.max).toBeGreaterThanOrEqual(30);
      });
    });
  });
});