import { CakeTemplate } from '../models/CakePricingConfig';

/**
 * Comprehensive collection of pre-designed cake templates
 * These templates provide customers with inspiration and quick configuration options
 */

export const CAKE_TEMPLATES: CakeTemplate[] = [
  // Birthday Templates
  {
    id: 'classic_birthday',
    name: 'Classic Birthday Cake',
    description: 'Traditional vanilla cake with colorful buttercream frosting and happy birthday message',
    image_url: '/images/templates/classic-birthday.jpg',
    category: 'birthday',
    configuration: {
      flavor: 'vanilla',
      size: 'medium_8',
      frosting: 'buttercream',
      message: 'Happy Birthday!',
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'custom_writing', quantity: 1 }
      ],
      complexity_level: 2,
      serving_utensils: true
    },
    estimated_price: { min: 45, max: 55 },
    is_popular: true,
    difficulty_level: 2
  },

  {
    id: 'chocolate_birthday_deluxe',
    name: 'Chocolate Birthday Deluxe',
    description: 'Rich chocolate cake with chocolate drip and themed toppers',
    image_url: '/images/templates/chocolate-birthday-deluxe.jpg',
    category: 'birthday',
    configuration: {
      flavor: 'chocolate',
      size: 'medium_8',
      frosting: 'chocolate_ganache',
      message: 'Happy Birthday!',
      layers: 2,
      decorations: [
        { decoration_id: 'chocolate_drip', quantity: 1 },
        { decoration_id: 'themed_toppers', quantity: 1, custom_description: 'Birthday themed' },
        { decoration_id: 'custom_writing', quantity: 1 }
      ],
      complexity_level: 3,
      serving_utensils: true
    },
    estimated_price: { min: 75, max: 95 },
    is_popular: true,
    difficulty_level: 3
  },

  {
    id: 'kids_rainbow_birthday',
    name: 'Kids Rainbow Birthday',
    description: 'Colorful vanilla cake with rainbow decorations perfect for children',
    image_url: '/images/templates/kids-rainbow.jpg',
    category: 'birthday',
    configuration: {
      flavor: 'vanilla',
      size: 'sheet_quarter',
      frosting: 'buttercream',
      message: 'Happy Birthday!',
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'custom_writing', quantity: 1 },
        { decoration_id: 'themed_toppers', quantity: 2, custom_description: 'Rainbow and unicorn themed' }
      ],
      complexity_level: 2,
      serving_utensils: true
    },
    estimated_price: { min: 50, max: 65 },
    is_popular: true,
    difficulty_level: 2
  },

  // Wedding/Celebration Templates
  {
    id: 'elegant_wedding',
    name: 'Elegant Wedding Cake',
    description: 'Multi-layer vanilla cake with fondant covering and fresh flowers',
    image_url: '/images/templates/elegant-wedding.jpg',
    category: 'wedding',
    configuration: {
      flavor: 'vanilla',
      size: 'large_10',
      frosting: 'fondant',
      layers: 3,
      decorations: [
        { decoration_id: 'fresh_flowers', quantity: 5, custom_description: 'White roses and baby\'s breath' },
        { decoration_id: 'piped_borders', quantity: 1 }
      ],
      complexity_level: 4,
      cake_stand_rental: true,
      serving_utensils: true,
      preparation_days: 5
    },
    estimated_price: { min: 150, max: 200 },
    is_popular: true,
    difficulty_level: 4
  },

  {
    id: 'red_velvet_romance',
    name: 'Red Velvet Romance',
    description: 'Classic red velvet with cream cheese frosting and elegant piping',
    image_url: '/images/templates/red-velvet-romance.jpg',
    category: 'celebration',
    configuration: {
      flavor: 'red_velvet',
      size: 'medium_8',
      frosting: 'cream_cheese',
      layers: 2,
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'fresh_flowers', quantity: 2, custom_description: 'Red roses' }
      ],
      complexity_level: 3,
      serving_utensils: true
    },
    estimated_price: { min: 65, max: 80 },
    is_popular: true,
    difficulty_level: 3
  },

  {
    id: 'anniversary_gold',
    name: 'Golden Anniversary',
    description: 'Sophisticated vanilla cake with gold accents and elegant design',
    image_url: '/images/templates/anniversary-gold.jpg',
    category: 'celebration',
    configuration: {
      flavor: 'vanilla',
      size: 'large_10',
      frosting: 'buttercream',
      layers: 2,
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'themed_toppers', quantity: 1, custom_description: 'Gold anniversary numbers' }
      ],
      complexity_level: 3,
      serving_utensils: true,
      cake_stand_rental: true
    },
    estimated_price: { min: 80, max: 100 },
    is_popular: false,
    difficulty_level: 3
  },

  // Seasonal Templates
  {
    id: 'christmas_winter_wonderland',
    name: 'Christmas Winter Wonderland',
    description: 'Festive vanilla cake with winter-themed decorations',
    image_url: '/images/templates/christmas-winter.jpg',
    category: 'seasonal',
    configuration: {
      flavor: 'vanilla',
      size: 'sheet_quarter',
      frosting: 'buttercream',
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'themed_toppers', quantity: 3, custom_description: 'Snowflakes and Christmas trees' },
        { decoration_id: 'custom_writing', quantity: 1, custom_description: 'Merry Christmas' }
      ],
      complexity_level: 2,
      serving_utensils: true
    },
    estimated_price: { min: 55, max: 70 },
    is_popular: false,
    difficulty_level: 2
  },

  {
    id: 'halloween_spooky',
    name: 'Spooky Halloween',
    description: 'Chocolate cake with spooky decorations and orange accents',
    image_url: '/images/templates/halloween-spooky.jpg',
    category: 'seasonal',
    configuration: {
      flavor: 'chocolate',
      size: 'medium_8',
      frosting: 'buttercream',
      decorations: [
        { decoration_id: 'themed_toppers', quantity: 4, custom_description: 'Halloween pumpkins and ghosts' },
        { decoration_id: 'custom_writing', quantity: 1, custom_description: 'Happy Halloween' },
        { decoration_id: 'chocolate_drip', quantity: 1 }
      ],
      complexity_level: 3,
      serving_utensils: true
    },
    estimated_price: { min: 70, max: 85 },
    is_popular: false,
    difficulty_level: 3
  },

  {
    id: 'valentines_romance',
    name: 'Valentine\'s Day Romance',
    description: 'Strawberry cake with romantic decorations and heart theme',
    image_url: '/images/templates/valentines-romance.jpg',
    category: 'seasonal',
    configuration: {
      flavor: 'strawberry',
      size: 'small_6',
      frosting: 'cream_cheese',
      decorations: [
        { decoration_id: 'fresh_flowers', quantity: 2, custom_description: 'Red roses' },
        { decoration_id: 'themed_toppers', quantity: 2, custom_description: 'Heart decorations' },
        { decoration_id: 'custom_writing', quantity: 1, custom_description: 'Be Mine' }
      ],
      complexity_level: 2,
      serving_utensils: true
    },
    estimated_price: { min: 45, max: 60 },
    is_popular: false,
    difficulty_level: 2
  },

  // Themed Templates
  {
    id: 'superhero_adventure',
    name: 'Superhero Adventure',
    description: 'Action-packed cake perfect for superhero fans',
    image_url: '/images/templates/superhero-adventure.jpg',
    category: 'themed',
    configuration: {
      flavor: 'chocolate',
      size: 'sheet_quarter',
      frosting: 'buttercream',
      decorations: [
        { decoration_id: 'themed_toppers', quantity: 4, custom_description: 'Superhero action figures' },
        { decoration_id: 'custom_writing', quantity: 1 },
        { decoration_id: 'piped_borders', quantity: 1 }
      ],
      complexity_level: 3,
      serving_utensils: true,
      preparation_days: 3
    },
    estimated_price: { min: 75, max: 95 },
    is_popular: true,
    difficulty_level: 3
  },

  {
    id: 'princess_castle',
    name: 'Princess Castle',
    description: 'Magical princess-themed cake with castle design',
    image_url: '/images/templates/princess-castle.jpg',
    category: 'themed',
    configuration: {
      flavor: 'vanilla',
      size: 'medium_8',
      frosting: 'buttercream',
      layers: 3,
      decorations: [
        { decoration_id: 'themed_toppers', quantity: 1, custom_description: 'Princess castle tower' },
        { decoration_id: 'piped_borders', quantity: 1 },
        { decoration_id: 'fresh_flowers', quantity: 3, custom_description: 'Pink roses' }
      ],
      complexity_level: 4,
      serving_utensils: true,
      preparation_days: 4
    },
    estimated_price: { min: 90, max: 120 },
    is_popular: true,
    difficulty_level: 4
  },

  {
    id: 'sports_champion',
    name: 'Sports Champion',
    description: 'Sports-themed cake for the athletic achiever',
    image_url: '/images/templates/sports-champion.jpg',
    category: 'themed',
    configuration: {
      flavor: 'chocolate',
      size: 'sheet_quarter',
      frosting: 'buttercream',
      decorations: [
        { decoration_id: 'themed_toppers', quantity: 3, custom_description: 'Soccer ball, basketball, baseball' },
        { decoration_id: 'custom_writing', quantity: 1, custom_description: 'Champion' },
        { decoration_id: 'piped_borders', quantity: 1 }
      ],
      complexity_level: 2,
      serving_utensils: true
    },
    estimated_price: { min: 60, max: 75 },
    is_popular: false,
    difficulty_level: 2
  },

  // Simple/Budget-Friendly Templates
  {
    id: 'simple_vanilla_delight',
    name: 'Simple Vanilla Delight',
    description: 'Classic vanilla cake with basic buttercream frosting',
    image_url: '/images/templates/simple-vanilla.jpg',
    category: 'celebration',
    configuration: {
      flavor: 'vanilla',
      size: 'small_6',
      frosting: 'buttercream',
      decorations: [
        { decoration_id: 'piped_borders', quantity: 1 }
      ],
      complexity_level: 1,
      serving_utensils: true
    },
    estimated_price: { min: 30, max: 40 },
    is_popular: true,
    difficulty_level: 1
  },

  {
    id: 'lemon_fresh',
    name: 'Fresh Lemon Cake',
    description: 'Light and refreshing lemon cake with whipped cream',
    image_url: '/images/templates/lemon-fresh.jpg',
    category: 'celebration',
    configuration: {
      flavor: 'lemon',
      size: 'medium_8',
      frosting: 'whipped_cream',
      decorations: [
        { decoration_id: 'fresh_flowers', quantity: 2, custom_description: 'Yellow daisies' }
      ],
      complexity_level: 1,
      serving_utensils: true
    },
    estimated_price: { min: 40, max: 55 },
    is_popular: false,
    difficulty_level: 1
  },

  // Premium/Expert Templates
  {
    id: 'master_chef_special',
    name: 'Master Chef Special',
    description: 'Expert-level multi-layer cake with intricate design work',
    image_url: '/images/templates/master-chef.jpg',
    category: 'celebration',
    configuration: {
      flavor: 'red_velvet',
      size: 'large_10',
      frosting: 'fondant',
      layers: 4,
      decorations: [
        { decoration_id: 'chocolate_drip', quantity: 1 },
        { decoration_id: 'fresh_flowers', quantity: 8, custom_description: 'Mixed elegant flowers' },
        { decoration_id: 'themed_toppers', quantity: 2, custom_description: 'Custom sugar art' }
      ],
      complexity_level: 5,
      cake_stand_rental: true,
      serving_utensils: true,
      delivery_setup: true,
      preparation_days: 7
    },
    estimated_price: { min: 200, max: 300 },
    is_popular: false,
    difficulty_level: 5
  }
];

/**
 * Helper functions for template management
 */

export const getTemplatesByCategory = (category: CakeTemplate['category']): CakeTemplate[] => {
  return CAKE_TEMPLATES.filter(template => template.category === category);
};

export const getPopularTemplates = (limit: number = 10): CakeTemplate[] => {
  return CAKE_TEMPLATES
    .filter(template => template.is_popular)
    .slice(0, limit);
};

export const getTemplatesByDifficulty = (maxDifficulty: number): CakeTemplate[] => {
  return CAKE_TEMPLATES.filter(template => template.difficulty_level <= maxDifficulty);
};

export const getTemplatesByPriceRange = (minPrice: number, maxPrice: number): CakeTemplate[] => {
  return CAKE_TEMPLATES.filter(template => 
    template.estimated_price.min <= maxPrice && template.estimated_price.max >= minPrice
  );
};

export const getTemplateById = (id: string): CakeTemplate | undefined => {
  return CAKE_TEMPLATES.find(template => template.id === id);
};

export const searchTemplates = (query: string): CakeTemplate[] => {
  const searchQuery = query.toLowerCase();
  return CAKE_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchQuery) ||
    template.description.toLowerCase().includes(searchQuery) ||
    template.category.toLowerCase().includes(searchQuery)
  );
};

export default {
  CAKE_TEMPLATES,
  getTemplatesByCategory,
  getPopularTemplates,
  getTemplatesByDifficulty,
  getTemplatesByPriceRange,
  getTemplateById,
  searchTemplates,
};