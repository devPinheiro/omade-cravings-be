import {
  validateCakeConfiguration,
  validatePricingRequest,
  validateCompatibility,
  getValidationOptions,
  customCakeConfigurationSchema,
} from '../validation/cakeConfigValidation';

describe('Cake Configuration Validation', () => {
  describe('Basic Configuration Validation', () => {
    it('should validate a correct configuration', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        complexity_level: 2,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const config = {
        flavor: 'vanilla',
        // Missing size and frosting
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cake size is required');
      expect(result.errors).toContain('Frosting type is required');
    });

    it('should reject invalid flavor', async () => {
      const config = {
        flavor: 'invalid_flavor',
        size: 'medium_8',
        frosting: 'buttercream',
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid cake flavor selected');
    });

    it('should reject invalid size', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'invalid_size',
        frosting: 'buttercream',
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid cake size selected');
    });

    it('should reject invalid frosting', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'invalid_frosting',
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid frosting type selected');
    });
  });

  describe('Layer Validation', () => {
    it('should validate layer count within limits', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        layers: 3,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
    });

    it('should reject layer count above maximum', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        layers: 5, // Max is 4
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 4 layers allowed');
    });

    it('should reject layer count below minimum', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        layers: 0,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must have at least 1 layer');
    });
  });

  describe('Height Validation', () => {
    it('should validate height within size limits', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8', // Min: 3, Max: 8
        frosting: 'buttercream',
        height_inches: 5,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
    });

    it('should reject height below minimum for size', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8', // Min: 3
        frosting: 'buttercream',
        height_inches: 2,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be within size limits');
    });

    it('should reject height above maximum for size', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8', // Max: 8
        frosting: 'buttercream',
        height_inches: 10,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be within size limits');
    });
  });

  describe('Decoration Validation', () => {
    it('should validate correct decorations', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        decorations: [
          {
            decoration_id: 'piped_borders',
            quantity: 1,
            custom_description: 'Rainbow colored borders',
          },
        ],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid decoration IDs', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        decorations: [
          {
            decoration_id: 'invalid_decoration',
            quantity: 1,
          },
        ],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid decoration selected');
    });

    it('should validate decoration quantity limits', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        decorations: [
          {
            decoration_id: 'piped_borders',
            quantity: 25, // Max is 20
          },
        ],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 20 items per decoration type');
    });

    it('should validate maximum number of decoration types', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        decorations: Array.from({ length: 11 }, (_, i) => ({
          decoration_id: 'piped_borders',
          quantity: 1,
        })),
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 10 different decoration types allowed');
    });
  });

  describe('Dietary Restrictions Validation', () => {
    it('should validate correct dietary restrictions', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        dietary_restrictions: ['gluten_free'],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid dietary restrictions', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        dietary_restrictions: ['invalid_restriction'],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid dietary restriction');
    });

    it('should validate maximum dietary restrictions', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        dietary_restrictions: ['gluten_free', 'vegan', 'sugar_free', 'extra_restriction'],
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 3 dietary restrictions can be selected');
    });
  });

  describe('Text Field Validation', () => {
    it('should validate message length', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        message: 'A'.repeat(101), // Max is 100
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message cannot exceed 100 characters');
    });

    it('should validate design description length', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        design_description: 'A'.repeat(501), // Max is 500
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Design description cannot exceed 500 characters');
    });

    it('should validate special instructions length', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        special_instructions: 'A'.repeat(301), // Max is 300
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Special instructions cannot exceed 300 characters');
    });
  });

  describe('Complexity and Timing Validation', () => {
    it('should validate complexity level range', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        complexity_level: 6, // Max is 5
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum complexity level is 5');
    });

    it('should validate preparation days range', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        preparation_days: 0, // Min is 1
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum 1 day preparation required');
    });

    it('should validate maximum preparation days', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        preparation_days: 31, // Max is 30
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 30 days advance order');
    });
  });

  describe('Pricing Request Validation', () => {
    it('should validate correct pricing request', async () => {
      const request = {
        configuration: {
          flavor: 'vanilla',
          size: 'medium_8',
          frosting: 'buttercream',
        },
        requested_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      const result = await validatePricingRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject past requested date', async () => {
      const request = {
        configuration: {
          flavor: 'vanilla',
          size: 'medium_8',
          frosting: 'buttercream',
        },
        requested_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      const result = await validatePricingRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Requested date must be in the future');
    });
  });

  describe('Compatibility Validation', () => {
    it('should detect dietary incompatibilities', () => {
      const config = {
        flavor: 'carrot', // Contains nuts, not available for vegan
        size: 'medium_8',
        frosting: 'buttercream',
        dietary_restrictions: ['vegan'],
      };

      const result = validateCompatibility(config);

      expect(result.compatible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect frosting decoration incompatibilities', () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'whipped_cream', // Not suitable for decorating
        decorations: [
          { decoration_id: 'piped_borders' },
        ],
      };

      const result = validateCompatibility(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Fresh Whipped Cream frosting is not suitable for piped decorations');
    });

    it('should detect height limit issues', () => {
      const config = {
        flavor: 'vanilla',
        size: 'small_6', // Max height: 6
        frosting: 'buttercream',
        height_inches: 8,
      };

      const result = validateCompatibility(config);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Maximum height for 6 inch Round is 6 inches');
    });
  });

  describe('Validation Options', () => {
    it('should return validation options', () => {
      const options = getValidationOptions();

      expect(options.sizes).toBeDefined();
      expect(options.flavors).toBeDefined();
      expect(options.frostings).toBeDefined();
      expect(options.decorations).toBeDefined();
      expect(options.dietary_options).toBeDefined();
      expect(options.allergen_types).toBeDefined();
      expect(options.complexity_levels).toEqual([1, 2, 3, 4, 5]);
      expect(options.max_layers).toBe(4);
    });
  });

  describe('Schema Edge Cases', () => {
    it('should strip unknown fields', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        unknown_field: 'should be stripped',
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
      expect((result.data as any)?.unknown_field).toBeUndefined();
    });

    it('should set default values', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        serving_utensils: undefined,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.data?.serving_utensils).toBe(false);
    });

    it('should handle null and undefined values appropriately', async () => {
      const config = {
        flavor: 'vanilla',
        size: 'medium_8',
        frosting: 'buttercream',
        message: null,
        layers: null,
        decorations: null,
      };

      const result = await validateCakeConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.data?.message).toBeNull();
      expect(result.data?.layers).toBeNull();
      expect(result.data?.decorations).toBeNull();
    });
  });
});