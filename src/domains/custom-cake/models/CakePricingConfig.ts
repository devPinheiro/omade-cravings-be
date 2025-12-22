// Custom Cake Pricing Configuration Types

export interface CakeSize {
  id: string;
  name: string;
  diameter: string;
  serves: string;
  base_price_multiplier: number;
  min_height: number;
  max_height: number;
  is_popular: boolean;
}

export interface CakeFlavor {
  id: string;
  name: string;
  description: string;
  price_addon: number;
  is_premium: boolean;
  is_popular: boolean;
  allergens?: string[];
  dietary_info?: string[];
}

export interface CakeFrosting {
  id: string;
  name: string;
  description: string;
  price_addon: number;
  is_premium: boolean;
  texture: 'smooth' | 'textured' | 'glossy';
  suitable_for_decorating: boolean;
}

export interface CakeDecoration {
  id: string;
  name: string;
  description: string;
  category: 'flowers' | 'piping' | 'toppers' | 'writing' | 'special';
  price_per_item?: number;
  price_per_cake?: number;
  complexity_level: 1 | 2 | 3 | 4 | 5;
  requires_advance_notice_days?: number;
}

export interface CakeLayer {
  height: number;
  price_multiplier: number;
  max_layers: number;
  structural_requirements?: string[];
}

export interface DietaryOption {
  id: string;
  name: string;
  description: string;
  price_addon: number;
  available_flavors: string[];
  available_frostings: string[];
  restrictions?: string[];
}

export interface CustomCakeConfiguration {
  // Basic Configuration
  flavor: string;
  size: string;
  frosting: string;
  
  // Optional Elements
  message?: string | null;
  layers?: number | null;
  height_inches?: number | null;
  
  // Decorations
  decorations?: Array<{
    decoration_id: string;
    quantity?: number;
    custom_description?: string | null;
    placement?: string | null;
  }> | null;
  
  // Special Requirements
  dietary_restrictions?: string[] | null;
  allergen_free?: string[] | null;
  
  // Images and References
  reference_images?: string[] | null;
  design_description?: string | null;
  
  // Delivery and Timing
  complexity_level?: 1 | 2 | 3 | 4 | 5 | null;
  preparation_days?: number | null;
  special_instructions?: string | null;
  
  // Additional Features
  serving_utensils?: boolean;
  cake_stand_rental?: boolean;
  delivery_setup?: boolean;
}

export interface PricingCalculation {
  base_price: number;
  size_multiplier: number;
  layer_cost: number;
  flavor_addon: number;
  frosting_addon: number;
  decoration_cost: number;
  dietary_addon: number;
  complexity_addon: number;
  service_addons: number;
  subtotal: number;
  rush_fee?: number;
  total_price: number;
  
  breakdown: {
    item: string;
    cost: number;
    description: string;
  }[];
  
  preparation_time: {
    standard_days: number;
    rush_available: boolean;
    rush_fee?: number;
    earliest_pickup: string;
  };
}

export interface CakeTemplate {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: 'birthday' | 'wedding' | 'celebration' | 'seasonal' | 'themed';
  configuration: CustomCakeConfiguration;
  estimated_price: {
    min: number;
    max: number;
  };
  is_popular: boolean;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
}

// Pricing Configuration Data Structure
export const CAKE_PRICING_CONFIG = {
  base_cake_price: 25.00,
  
  sizes: [
    {
      id: 'small_6',
      name: '6 inch Round',
      diameter: '6 inches',
      serves: '4-6 people',
      base_price_multiplier: 1.0,
      min_height: 3,
      max_height: 6,
      is_popular: true,
    },
    {
      id: 'medium_8',
      name: '8 inch Round',
      diameter: '8 inches', 
      serves: '8-12 people',
      base_price_multiplier: 1.5,
      min_height: 3,
      max_height: 8,
      is_popular: true,
    },
    {
      id: 'large_10',
      name: '10 inch Round',
      diameter: '10 inches',
      serves: '15-20 people',
      base_price_multiplier: 2.2,
      min_height: 3,
      max_height: 8,
      is_popular: true,
    },
    {
      id: 'xlarge_12',
      name: '12 inch Round',
      diameter: '12 inches',
      serves: '25-30 people',
      base_price_multiplier: 3.0,
      min_height: 4,
      max_height: 10,
      is_popular: false,
    },
    {
      id: 'sheet_quarter',
      name: 'Quarter Sheet',
      diameter: '9x13 inches',
      serves: '12-15 people',
      base_price_multiplier: 1.8,
      min_height: 2,
      max_height: 4,
      is_popular: true,
    },
    {
      id: 'sheet_half',
      name: 'Half Sheet',
      diameter: '11x15 inches',
      serves: '20-25 people',
      base_price_multiplier: 2.5,
      min_height: 2,
      max_height: 4,
      is_popular: false,
    },
  ] as CakeSize[],
  
  flavors: [
    {
      id: 'vanilla',
      name: 'Classic Vanilla',
      description: 'Rich vanilla bean cake with vanilla extract',
      price_addon: 0,
      is_premium: false,
      is_popular: true,
      allergens: ['eggs', 'dairy', 'gluten'],
      dietary_info: [],
    },
    {
      id: 'chocolate',
      name: 'Decadent Chocolate',
      description: 'Rich chocolate cake with cocoa powder',
      price_addon: 2,
      is_premium: false,
      is_popular: true,
      allergens: ['eggs', 'dairy', 'gluten'],
      dietary_info: [],
    },
    {
      id: 'red_velvet',
      name: 'Red Velvet',
      description: 'Classic red velvet with cream cheese frosting',
      price_addon: 5,
      is_premium: true,
      is_popular: true,
      allergens: ['eggs', 'dairy', 'gluten', 'food_coloring'],
      dietary_info: [],
    },
    {
      id: 'lemon',
      name: 'Lemon Zest',
      description: 'Fresh lemon cake with lemon zest',
      price_addon: 3,
      is_premium: false,
      is_popular: false,
      allergens: ['eggs', 'dairy', 'gluten'],
      dietary_info: [],
    },
    {
      id: 'strawberry',
      name: 'Strawberry Delight',
      description: 'Fresh strawberry cake with real strawberries',
      price_addon: 6,
      is_premium: true,
      is_popular: false,
      allergens: ['eggs', 'dairy', 'gluten'],
      dietary_info: [],
    },
    {
      id: 'carrot',
      name: 'Carrot Spice',
      description: 'Moist carrot cake with warm spices and walnuts',
      price_addon: 4,
      is_premium: false,
      is_popular: false,
      allergens: ['eggs', 'dairy', 'gluten', 'nuts'],
      dietary_info: [],
    },
  ] as CakeFlavor[],
  
  frostings: [
    {
      id: 'buttercream',
      name: 'Classic Buttercream',
      description: 'Smooth and creamy buttercream frosting',
      price_addon: 0,
      is_premium: false,
      texture: 'smooth',
      suitable_for_decorating: true,
    },
    {
      id: 'cream_cheese',
      name: 'Cream Cheese',
      description: 'Rich and tangy cream cheese frosting',
      price_addon: 3,
      is_premium: false,
      texture: 'smooth',
      suitable_for_decorating: true,
    },
    {
      id: 'chocolate_ganache',
      name: 'Chocolate Ganache',
      description: 'Rich and glossy chocolate ganache',
      price_addon: 5,
      is_premium: true,
      texture: 'glossy',
      suitable_for_decorating: false,
    },
    {
      id: 'whipped_cream',
      name: 'Fresh Whipped Cream',
      description: 'Light and airy whipped cream',
      price_addon: 2,
      is_premium: false,
      texture: 'textured',
      suitable_for_decorating: false,
    },
    {
      id: 'fondant',
      name: 'Fondant',
      description: 'Smooth fondant covering for elegant finish',
      price_addon: 8,
      is_premium: true,
      texture: 'smooth',
      suitable_for_decorating: true,
    },
  ] as CakeFrosting[],
  
  decorations: [
    {
      id: 'piped_borders',
      name: 'Piped Borders',
      description: 'Decorative piped borders around cake',
      category: 'piping',
      price_per_cake: 5,
      complexity_level: 2,
    },
    {
      id: 'fresh_flowers',
      name: 'Fresh Flowers',
      description: 'Fresh edible flowers for decoration',
      category: 'flowers',
      price_per_item: 3,
      complexity_level: 2,
      requires_advance_notice_days: 2,
    },
    {
      id: 'custom_writing',
      name: 'Custom Writing',
      description: 'Personalized message written on cake',
      category: 'writing',
      price_per_cake: 3,
      complexity_level: 1,
    },
    {
      id: 'chocolate_drip',
      name: 'Chocolate Drip',
      description: 'Elegant chocolate drip effect',
      category: 'special',
      price_per_cake: 8,
      complexity_level: 3,
    },
    {
      id: 'themed_toppers',
      name: 'Themed Cake Toppers',
      description: 'Custom themed decorative toppers',
      category: 'toppers',
      price_per_item: 12,
      complexity_level: 4,
      requires_advance_notice_days: 5,
    },
  ] as CakeDecoration[],
  
  dietary_options: [
    {
      id: 'gluten_free',
      name: 'Gluten Free',
      description: 'Made with gluten-free flour alternatives',
      price_addon: 8,
      available_flavors: ['vanilla', 'chocolate', 'lemon'],
      available_frostings: ['buttercream', 'cream_cheese', 'whipped_cream'],
      restrictions: ['May contain traces of gluten from facility'],
    },
    {
      id: 'vegan',
      name: 'Vegan',
      description: 'No animal products - plant-based ingredients only',
      price_addon: 12,
      available_flavors: ['vanilla', 'chocolate', 'lemon'],
      available_frostings: ['buttercream'],
      restrictions: ['Different texture than traditional cakes'],
    },
    {
      id: 'sugar_free',
      name: 'Sugar Free',
      description: 'Sweetened with natural alternatives',
      price_addon: 6,
      available_flavors: ['vanilla', 'chocolate'],
      available_frostings: ['buttercream', 'whipped_cream'],
      restrictions: ['May have laxative effect in large quantities'],
    },
  ] as DietaryOption[],
  
  pricing_rules: {
    layer_pricing: {
      single_layer: 0,
      double_layer: 8,
      triple_layer: 18,
      quad_layer: 30,
      max_layers: 4,
    },
    complexity_multipliers: {
      1: 1.0,  // Simple
      2: 1.1,  // Easy
      3: 1.25, // Moderate
      4: 1.5,  // Complex
      5: 2.0,  // Expert
    },
    rush_fees: {
      same_day: 50,
      next_day: 25,
      two_days: 15,
      standard: 0,
    },
    service_addons: {
      serving_utensils: 5,
      cake_stand_rental: 15,
      delivery_setup: 25,
    },
    minimum_order_amount: 25,
    maximum_discount_percent: 15,
  },
};