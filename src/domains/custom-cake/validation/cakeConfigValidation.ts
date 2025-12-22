import * as Yup from 'yup';
import { CAKE_PRICING_CONFIG } from '../models/CakePricingConfig';

// Extract valid IDs from configuration
const validSizeIds = CAKE_PRICING_CONFIG.sizes.map(s => s.id);
const validFlavorIds = CAKE_PRICING_CONFIG.flavors.map(f => f.id);
const validFrostingIds = CAKE_PRICING_CONFIG.frostings.map(f => f.id);
const validDecorationIds = CAKE_PRICING_CONFIG.decorations.map(d => d.id);
const validDietaryOptionIds = CAKE_PRICING_CONFIG.dietary_options.map(d => d.id);

// Validation schemas
export const customCakeConfigurationSchema = Yup.object({
  // Required basic configuration
  flavor: Yup.string()
    .required('Cake flavor is required')
    .oneOf(validFlavorIds, 'Invalid cake flavor selected'),
  
  size: Yup.string()
    .required('Cake size is required')
    .oneOf(validSizeIds, 'Invalid cake size selected'),
  
  frosting: Yup.string()
    .required('Frosting type is required')
    .oneOf(validFrostingIds, 'Invalid frosting type selected'),

  // Optional basic properties
  message: Yup.string()
    .max(100, 'Message cannot exceed 100 characters')
    .nullable(),

  layers: Yup.number()
    .integer('Number of layers must be a whole number')
    .min(1, 'Must have at least 1 layer')
    .max(CAKE_PRICING_CONFIG.pricing_rules.layer_pricing.max_layers, 
         `Maximum ${CAKE_PRICING_CONFIG.pricing_rules.layer_pricing.max_layers} layers allowed`)
    .nullable(),

  height_inches: Yup.number()
    .positive('Height must be a positive number')
    .test('height-range', 'Height must be within size limits', function(value) {
      if (!value) return true; // Allow null/undefined
      
      const { size } = this.parent;
      const sizeConfig = CAKE_PRICING_CONFIG.sizes.find(s => s.id === size);
      
      if (!sizeConfig) return true; // Let size validation handle invalid sizes
      
      return value >= sizeConfig.min_height && value <= sizeConfig.max_height;
    })
    .nullable(),

  // Decorations array validation
  decorations: Yup.array()
    .of(
      Yup.object({
        decoration_id: Yup.string()
          .required('Decoration ID is required')
          .oneOf(validDecorationIds, 'Invalid decoration selected'),
        
        quantity: Yup.number()
          .integer('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(20, 'Maximum 20 items per decoration type')
          .default(1),
        
        custom_description: Yup.string()
          .max(200, 'Custom description cannot exceed 200 characters')
          .nullable(),
        
        placement: Yup.string()
          .max(100, 'Placement description cannot exceed 100 characters')
          .nullable(),
      })
    )
    .max(10, 'Maximum 10 different decoration types allowed')
    .nullable(),

  // Dietary restrictions
  dietary_restrictions: Yup.array()
    .of(
      Yup.string().oneOf(validDietaryOptionIds, 'Invalid dietary restriction')
    )
    .max(3, 'Maximum 3 dietary restrictions can be selected')
    .nullable(),

  // Allergen-free options
  allergen_free: Yup.array()
    .of(
      Yup.string().oneOf(['eggs', 'dairy', 'gluten', 'nuts', 'soy'], 'Invalid allergen type')
    )
    .nullable(),

  // Images and design
  reference_images: Yup.array()
    .of(Yup.string().url('Must be a valid URL'))
    .max(5, 'Maximum 5 reference images allowed')
    .nullable(),

  design_description: Yup.string()
    .max(500, 'Design description cannot exceed 500 characters')
    .nullable(),

  // Complexity and timing
  complexity_level: Yup.number()
    .integer('Complexity level must be a whole number')
    .min(1, 'Minimum complexity level is 1')
    .max(5, 'Maximum complexity level is 5')
    .nullable(),

  preparation_days: Yup.number()
    .integer('Preparation days must be a whole number')
    .min(1, 'Minimum 1 day preparation required')
    .max(30, 'Maximum 30 days advance order')
    .nullable(),

  special_instructions: Yup.string()
    .max(300, 'Special instructions cannot exceed 300 characters')
    .nullable(),

  // Service add-ons
  serving_utensils: Yup.boolean().default(false),
  cake_stand_rental: Yup.boolean().default(false),
  delivery_setup: Yup.boolean().default(false),
});

// Validation for cake pricing calculation request
export const pricingCalculationRequestSchema = Yup.object({
  configuration: customCakeConfigurationSchema.required('Configuration is required'),
  requested_date: Yup.date()
    .min(new Date(), 'Requested date must be in the future')
    .nullable(),
});

// Validation for quick price estimate
export const quickPriceEstimateSchema = Yup.object({
  size_id: Yup.string()
    .required('Size ID is required')
    .oneOf(validSizeIds, 'Invalid size ID'),
  
  complexity_level: Yup.number()
    .integer('Complexity level must be a whole number')
    .min(1, 'Minimum complexity level is 1')
    .max(5, 'Maximum complexity level is 5')
    .default(1),
});

// Validation for cake template selection
export const cakeTemplateSelectionSchema = Yup.object({
  template_id: Yup.string().required('Template ID is required'),
  customizations: customCakeConfigurationSchema.partial().nullable(),
});

// Custom validation functions
export const validateCakeConfiguration = async (config: any) => {
  try {
    const validatedConfig = await customCakeConfigurationSchema.validate(config, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { isValid: true, data: validatedConfig, errors: null };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors,
      };
    }
    throw error;
  }
};

export const validatePricingRequest = async (request: any) => {
  try {
    const validatedRequest = await pricingCalculationRequestSchema.validate(request, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { isValid: true, data: validatedRequest, errors: null };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors,
      };
    }
    throw error;
  }
};

// Helper function to get validation schema for specific fields
export const getFieldValidation = (fieldName: string) => {
  const schema = customCakeConfigurationSchema.fields[fieldName as keyof typeof customCakeConfigurationSchema.fields];
  return schema;
};

// Get available options for validation
export const getValidationOptions = () => {
  return {
    sizes: validSizeIds,
    flavors: validFlavorIds,
    frostings: validFrostingIds,
    decorations: validDecorationIds,
    dietary_options: validDietaryOptionIds,
    allergen_types: ['eggs', 'dairy', 'gluten', 'nuts', 'soy'],
    complexity_levels: [1, 2, 3, 4, 5],
    max_layers: CAKE_PRICING_CONFIG.pricing_rules.layer_pricing.max_layers,
  };
};

// Advanced compatibility validation
export const validateCompatibility = (config: any): { compatible: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check dietary restrictions with flavors and frostings
  if (config.dietary_restrictions && Array.isArray(config.dietary_restrictions)) {
    for (const dietaryId of config.dietary_restrictions) {
      const dietary = CAKE_PRICING_CONFIG.dietary_options.find(d => d.id === dietaryId);
      if (dietary) {
        // Check flavor compatibility
        if (config.flavor && !dietary.available_flavors.includes(config.flavor)) {
          const flavor = CAKE_PRICING_CONFIG.flavors.find(f => f.id === config.flavor);
          issues.push(`${flavor?.name} flavor is not available with ${dietary.name} option`);
        }

        // Check frosting compatibility
        if (config.frosting && !dietary.available_frostings.includes(config.frosting)) {
          const frosting = CAKE_PRICING_CONFIG.frostings.find(f => f.id === config.frosting);
          issues.push(`${frosting?.name} frosting is not available with ${dietary.name} option`);
        }
      }
    }
  }

  // Check frosting suitability for decorations
  if (config.frosting && config.decorations) {
    const frosting = CAKE_PRICING_CONFIG.frostings.find(f => f.id === config.frosting);
    if (frosting) {
      const pipingDecorations = config.decorations.filter((d: any) => {
        const decoration = CAKE_PRICING_CONFIG.decorations.find(dec => dec.id === d.decoration_id);
        return decoration?.category === 'piping';
      });

      if (pipingDecorations.length > 0 && !frosting.suitable_for_decorating) {
        issues.push(`${frosting.name} frosting is not suitable for piped decorations`);
      }
    }
  }

  // Check size height limits
  if (config.size && config.height_inches) {
    const size = CAKE_PRICING_CONFIG.sizes.find(s => s.id === config.size);
    if (size) {
      if (config.height_inches < size.min_height) {
        issues.push(`Minimum height for ${size.name} is ${size.min_height} inches`);
      }
      if (config.height_inches > size.max_height) {
        issues.push(`Maximum height for ${size.name} is ${size.max_height} inches`);
      }
    }
  }

  return {
    compatible: issues.length === 0,
    issues
  };
};

export default {
  customCakeConfigurationSchema,
  pricingCalculationRequestSchema,
  quickPriceEstimateSchema,
  cakeTemplateSelectionSchema,
  validateCakeConfiguration,
  validatePricingRequest,
  getFieldValidation,
  getValidationOptions,
  validateCompatibility,
};