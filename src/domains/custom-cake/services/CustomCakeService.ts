import { 
  CAKE_PRICING_CONFIG,
  CustomCakeConfiguration,
  PricingCalculation,
  CakeTemplate,
  CakeSize,
  CakeFlavor,
  CakeFrosting,
  CakeDecoration,
  DietaryOption
} from '../models/CakePricingConfig';

export interface CakeCompatibilityResult {
  compatible: boolean;
  issues: string[];
  suggestions?: string[];
}

export interface CakeAvailabilityCheck {
  available: boolean;
  min_preparation_days: number;
  rush_available: boolean;
  rush_fee?: number;
  restrictions?: string[];
}

export class CustomCakeService {
  private config = CAKE_PRICING_CONFIG;

  /**
   * Calculate comprehensive pricing for a custom cake configuration
   */
  calculatePricing(configuration: CustomCakeConfiguration): PricingCalculation {
    const breakdown: PricingCalculation['breakdown'] = [];

    // Base price
    const basePrice = this.config.base_cake_price;
    breakdown.push({
      item: 'Base Cake',
      cost: basePrice,
      description: 'Base cake price'
    });

    // Size multiplier
    const size = this.getSize(configuration.size);
    const sizeMultiplier = size ? size.base_price_multiplier : 1.0;
    const sizeAdjustedBase = basePrice * sizeMultiplier;
    if (sizeMultiplier !== 1.0) {
      breakdown.push({
        item: `Size: ${size?.name}`,
        cost: sizeAdjustedBase - basePrice,
        description: `Size multiplier (${sizeMultiplier}x)`
      });
    }

    // Layer pricing
    const layers = configuration.layers || 1;
    let layerCost = 0;
    if (layers === 2) {
      layerCost = this.config.pricing_rules.layer_pricing.double_layer;
    } else if (layers === 3) {
      layerCost = this.config.pricing_rules.layer_pricing.triple_layer;
    } else if (layers >= 4) {
      layerCost = this.config.pricing_rules.layer_pricing.quad_layer;
    }

    if (layerCost > 0) {
      breakdown.push({
        item: `Additional Layers (${layers - 1})`,
        cost: layerCost,
        description: `Multiple layer construction`
      });
    }

    // Flavor addon
    const flavor = this.getFlavor(configuration.flavor);
    const flavorAddon = flavor ? flavor.price_addon : 0;
    if (flavorAddon > 0) {
      breakdown.push({
        item: `Flavor: ${flavor?.name}`,
        cost: flavorAddon,
        description: flavor?.is_premium ? 'Premium flavor' : 'Specialty flavor'
      });
    }

    // Frosting addon
    const frosting = this.getFrosting(configuration.frosting);
    const frostingAddon = frosting ? frosting.price_addon : 0;
    if (frostingAddon > 0) {
      breakdown.push({
        item: `Frosting: ${frosting?.name}`,
        cost: frostingAddon,
        description: frosting?.is_premium ? 'Premium frosting' : 'Specialty frosting'
      });
    }

    // Decorations cost
    let decorationCost = 0;
    if (configuration.decorations && configuration.decorations.length > 0) {
      for (const decorationConfig of configuration.decorations) {
        const decoration = this.getDecoration(decorationConfig.decoration_id);
        if (decoration) {
          let itemCost = 0;
          const quantity = decorationConfig.quantity || 1;

          if (decoration.price_per_cake) {
            itemCost = decoration.price_per_cake;
          } else if (decoration.price_per_item) {
            itemCost = decoration.price_per_item * quantity;
          }

          decorationCost += itemCost;
          breakdown.push({
            item: `${decoration.name} ${quantity > 1 ? `(x${quantity})` : ''}`,
            cost: itemCost,
            description: decoration.description
          });
        }
      }
    }

    // Dietary restrictions addon
    let dietaryAddon = 0;
    if (configuration.dietary_restrictions && configuration.dietary_restrictions.length > 0) {
      for (const dietaryId of configuration.dietary_restrictions) {
        const dietary = this.getDietaryOption(dietaryId);
        if (dietary) {
          dietaryAddon += dietary.price_addon;
          breakdown.push({
            item: dietary.name,
            cost: dietary.price_addon,
            description: dietary.description
          });
        }
      }
    }

    // Complexity multiplier
    const complexityLevel = configuration.complexity_level || 1;
    const complexityMultiplier = this.config.pricing_rules.complexity_multipliers[complexityLevel];

    // Calculate subtotal before complexity
    const subtotalBeforeComplexity = sizeAdjustedBase + layerCost + flavorAddon + frostingAddon + decorationCost + dietaryAddon;

    // Apply complexity multiplier to base cake price and decorations only
    const complexityAddon = complexityLevel > 1 ? 
      (sizeAdjustedBase + decorationCost) * (complexityMultiplier - 1) : 0;

    if (complexityAddon > 0) {
      breakdown.push({
        item: `Complexity Level ${complexityLevel}`,
        cost: complexityAddon,
        description: `${this.getComplexityLabel(complexityLevel)} design complexity`
      });
    }

    // Service addons
    let serviceAddons = 0;
    if (configuration.serving_utensils) {
      serviceAddons += this.config.pricing_rules.service_addons.serving_utensils;
      breakdown.push({
        item: 'Serving Utensils',
        cost: this.config.pricing_rules.service_addons.serving_utensils,
        description: 'Disposable serving utensils included'
      });
    }

    if (configuration.cake_stand_rental) {
      serviceAddons += this.config.pricing_rules.service_addons.cake_stand_rental;
      breakdown.push({
        item: 'Cake Stand Rental',
        cost: this.config.pricing_rules.service_addons.cake_stand_rental,
        description: '24-hour cake stand rental'
      });
    }

    if (configuration.delivery_setup) {
      serviceAddons += this.config.pricing_rules.service_addons.delivery_setup;
      breakdown.push({
        item: 'Delivery & Setup',
        cost: this.config.pricing_rules.service_addons.delivery_setup,
        description: 'Professional delivery and setup service'
      });
    }

    const subtotal = subtotalBeforeComplexity + complexityAddon + serviceAddons;

    // Rush fee calculation
    const preparationTime = this.calculatePreparationTime(configuration);
    let rushFee = 0;
    if (configuration.preparation_days) {
      if (configuration.preparation_days <= 1) {
        rushFee = this.config.pricing_rules.rush_fees.same_day;
      } else if (configuration.preparation_days === 2) {
        rushFee = this.config.pricing_rules.rush_fees.next_day;
      } else if (configuration.preparation_days === 3) {
        rushFee = this.config.pricing_rules.rush_fees.two_days;
      }
    }

    if (rushFee > 0) {
      breakdown.push({
        item: 'Rush Order Fee',
        cost: rushFee,
        description: `Expedited ${configuration.preparation_days}-day preparation`
      });
    }

    const totalPrice = subtotal + rushFee;

    return {
      base_price: basePrice,
      size_multiplier: sizeMultiplier,
      layer_cost: layerCost,
      flavor_addon: flavorAddon,
      frosting_addon: frostingAddon,
      decoration_cost: decorationCost,
      dietary_addon: dietaryAddon,
      complexity_addon: complexityAddon,
      service_addons: serviceAddons,
      subtotal,
      rush_fee: rushFee > 0 ? rushFee : undefined,
      total_price: totalPrice,
      breakdown,
      preparation_time: preparationTime
    };
  }

  /**
   * Calculate minimum preparation time required for a configuration
   */
  calculatePreparationTime(configuration: CustomCakeConfiguration): PricingCalculation['preparation_time'] {
    let minDays = 2; // Minimum 2 days for custom cakes

    // Complexity adds time
    const complexityLevel = configuration.complexity_level || 1;
    if (complexityLevel >= 4) {
      minDays += 2; // Expert level needs extra time
    } else if (complexityLevel >= 3) {
      minDays += 1; // Complex designs need extra time
    }

    // Special decorations add time
    let decorationMinDays = 0;
    if (configuration.decorations) {
      for (const decorationConfig of configuration.decorations) {
        const decoration = this.getDecoration(decorationConfig.decoration_id);
        if (decoration?.requires_advance_notice_days) {
          decorationMinDays = Math.max(decorationMinDays, decoration.requires_advance_notice_days);
        }
      }
    }

    minDays = Math.max(minDays, decorationMinDays);

    // Multiple layers add time
    if (configuration.layers && configuration.layers >= 3) {
      minDays += 1;
    }

    // Dietary restrictions may need special sourcing
    if (configuration.dietary_restrictions && configuration.dietary_restrictions.length > 0) {
      minDays = Math.max(minDays, 3);
    }

    const earliestPickup = new Date();
    earliestPickup.setDate(earliestPickup.getDate() + minDays);

    return {
      standard_days: minDays,
      rush_available: minDays <= 3,
      rush_fee: minDays <= 3 ? this.getRushFeeForDays(minDays) : undefined,
      earliest_pickup: earliestPickup.toISOString().split('T')[0]
    };
  }

  /**
   * Validate configuration compatibility
   */
  validateConfiguration(configuration: CustomCakeConfiguration): CakeCompatibilityResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if size exists
    const size = this.getSize(configuration.size);
    if (!size) {
      issues.push(`Invalid size: ${configuration.size}`);
    }

    // Check if flavor exists
    const flavor = this.getFlavor(configuration.flavor);
    if (!flavor) {
      issues.push(`Invalid flavor: ${configuration.flavor}`);
    }

    // Check if frosting exists
    const frosting = this.getFrosting(configuration.frosting);
    if (!frosting) {
      issues.push(`Invalid frosting: ${configuration.frosting}`);
    }

    // Check dietary restrictions compatibility
    if (configuration.dietary_restrictions) {
      for (const dietaryId of configuration.dietary_restrictions) {
        const dietary = this.getDietaryOption(dietaryId);
        if (dietary) {
          // Check flavor compatibility
          if (flavor && !dietary.available_flavors.includes(flavor.id)) {
            issues.push(`Flavor "${flavor.name}" is not available for ${dietary.name} option`);
            suggestions.push(`Available flavors for ${dietary.name}: ${dietary.available_flavors.join(', ')}`);
          }

          // Check frosting compatibility
          if (frosting && !dietary.available_frostings.includes(frosting.id)) {
            issues.push(`Frosting "${frosting.name}" is not available for ${dietary.name} option`);
            suggestions.push(`Available frostings for ${dietary.name}: ${dietary.available_frostings.join(', ')}`);
          }
        }
      }
    }

    // Check layer limits
    const layers = configuration.layers || 1;
    if (size && layers > this.config.pricing_rules.layer_pricing.max_layers) {
      issues.push(`Maximum ${this.config.pricing_rules.layer_pricing.max_layers} layers allowed`);
    }

    // Check height limits
    if (size && configuration.height_inches) {
      if (configuration.height_inches < size.min_height) {
        issues.push(`Minimum height for ${size.name} is ${size.min_height} inches`);
      }
      if (configuration.height_inches > size.max_height) {
        issues.push(`Maximum height for ${size.name} is ${size.max_height} inches`);
      }
    }

    // Check frosting decorating compatibility
    if (frosting && configuration.decorations) {
      const pipingDecorations = configuration.decorations.filter(d => {
        const decoration = this.getDecoration(d.decoration_id);
        return decoration?.category === 'piping';
      });

      if (pipingDecorations.length > 0 && !frosting.suitable_for_decorating) {
        issues.push(`${frosting.name} frosting is not suitable for piped decorations`);
        suggestions.push('Consider buttercream or fondant for decorative piping');
      }
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Check availability for a specific date
   */
  checkAvailability(configuration: CustomCakeConfiguration, requestedDate: Date): CakeAvailabilityCheck {
    const preparationTime = this.calculatePreparationTime(configuration);
    const minDays = preparationTime.standard_days;
    
    const today = new Date();
    const daysDifference = Math.ceil((requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const available = daysDifference >= minDays;
    const rushAvailable = daysDifference >= 1 && daysDifference < minDays;
    
    let rushFee;
    if (rushAvailable) {
      rushFee = this.getRushFeeForDays(daysDifference);
    }

    const restrictions: string[] = [];
    
    // Add complexity-based restrictions
    const complexityLevel = configuration.complexity_level || 1;
    if (complexityLevel >= 4 && daysDifference < 3) {
      restrictions.push('Expert-level designs require minimum 3 days advance notice');
    }

    // Add decoration restrictions
    if (configuration.decorations) {
      for (const decorationConfig of configuration.decorations) {
        const decoration = this.getDecoration(decorationConfig.decoration_id);
        if (decoration?.requires_advance_notice_days && daysDifference < decoration.requires_advance_notice_days) {
          restrictions.push(`${decoration.name} requires ${decoration.requires_advance_notice_days} days advance notice`);
        }
      }
    }

    return {
      available: available || rushAvailable,
      min_preparation_days: minDays,
      rush_available: rushAvailable,
      rush_fee: rushFee,
      restrictions: restrictions.length > 0 ? restrictions : undefined
    };
  }

  /**
   * Get popular cake templates
   */
  getPopularTemplates(): CakeTemplate[] {
    const { getPopularTemplates } = require('../data/cakeTemplates');
    return getPopularTemplates(10);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: CakeTemplate['category']): CakeTemplate[] {
    const { getTemplatesByCategory } = require('../data/cakeTemplates');
    return getTemplatesByCategory(category);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): CakeTemplate | undefined {
    const { getTemplateById } = require('../data/cakeTemplates');
    return getTemplateById(id);
  }

  /**
   * Search templates by query
   */
  searchTemplates(query: string): CakeTemplate[] {
    const { searchTemplates } = require('../data/cakeTemplates');
    return searchTemplates(query);
  }

  /**
   * Get templates by price range
   */
  getTemplatesByPriceRange(minPrice: number, maxPrice: number): CakeTemplate[] {
    const { getTemplatesByPriceRange } = require('../data/cakeTemplates');
    return getTemplatesByPriceRange(minPrice, maxPrice);
  }

  /**
   * Get templates by difficulty level
   */
  getTemplatesByDifficulty(maxDifficulty: number): CakeTemplate[] {
    const { getTemplatesByDifficulty } = require('../data/cakeTemplates');
    return getTemplatesByDifficulty(maxDifficulty);
  }

  // Helper methods
  private getSize(sizeId: string): CakeSize | undefined {
    return this.config.sizes.find(s => s.id === sizeId);
  }

  private getFlavor(flavorId: string): CakeFlavor | undefined {
    return this.config.flavors.find(f => f.id === flavorId);
  }

  private getFrosting(frostingId: string): CakeFrosting | undefined {
    return this.config.frostings.find(f => f.id === frostingId);
  }

  private getDecoration(decorationId: string): CakeDecoration | undefined {
    return this.config.decorations.find(d => d.id === decorationId);
  }

  private getDietaryOption(dietaryId: string): DietaryOption | undefined {
    return this.config.dietary_options.find(d => d.id === dietaryId);
  }

  private getComplexityLabel(level: number): string {
    switch (level) {
      case 1: return 'Simple';
      case 2: return 'Easy';
      case 3: return 'Moderate';
      case 4: return 'Complex';
      case 5: return 'Expert';
      default: return 'Simple';
    }
  }

  private getRushFeeForDays(days: number): number {
    if (days <= 1) return this.config.pricing_rules.rush_fees.same_day;
    if (days === 2) return this.config.pricing_rules.rush_fees.next_day;
    if (days === 3) return this.config.pricing_rules.rush_fees.two_days;
    return this.config.pricing_rules.rush_fees.standard;
  }

  /**
   * Get all available configuration options
   */
  getConfigurationOptions() {
    return {
      sizes: this.config.sizes,
      flavors: this.config.flavors,
      frostings: this.config.frostings,
      decorations: this.config.decorations,
      dietary_options: this.config.dietary_options,
      pricing_rules: this.config.pricing_rules
    };
  }

  /**
   * Get quick price estimate (simplified calculation)
   */
  getQuickPriceEstimate(sizeId: string, complexityLevel: number = 1): { min: number; max: number } {
    const size = this.getSize(sizeId);
    if (!size) {
      return { min: 25, max: 50 };
    }

    const basePrice = this.config.base_cake_price * size.base_price_multiplier;
    const complexityMultiplier = this.config.pricing_rules.complexity_multipliers[complexityLevel as keyof typeof this.config.pricing_rules.complexity_multipliers];
    
    const minPrice = basePrice * complexityMultiplier;
    const maxPrice = minPrice * 2.5; // Account for premium flavors, decorations, etc.

    return {
      min: Math.round(minPrice),
      max: Math.round(maxPrice)
    };
  }
}