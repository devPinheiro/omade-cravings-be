import { Router } from 'express';
import { CustomCakeController } from '../controllers/CustomCakeController';
import { authenticate } from '../../../shared/middleware/auth';
import { validateRole } from '../../../shared/middleware/roleValidation';
import { UserRole } from '../../../models/User';

const router = Router();
const controller = new CustomCakeController();

/**
 * Public Routes - Available to all users (authenticated and guests)
 */

// Get configuration options (sizes, flavors, frostings, decorations)
router.get('/options', controller.getConfigurationOptions.bind(controller));

// Get cake templates with optional filtering
router.get('/templates', controller.getTemplates.bind(controller));

// Get specific template by ID
router.get('/templates/:id', controller.getTemplateById.bind(controller));

// Get quick price estimate
router.get('/estimate', controller.getQuickPriceEstimate.bind(controller));

// Get validation constraints and options
router.get('/validation-options', controller.getValidationOptions.bind(controller));

// Get recommendations based on criteria
router.get('/recommendations', controller.getRecommendations.bind(controller));

/**
 * Configuration and Pricing Routes
 */

// Calculate detailed pricing for a configuration
router.post('/calculate-pricing', controller.calculatePricing.bind(controller));

// Validate cake configuration
router.post('/validate', controller.validateConfiguration.bind(controller));

// Check availability for specific date
router.post('/check-availability', controller.checkAvailability.bind(controller));

/**
 * Protected Admin Routes
 */

// Get configuration analytics (admin only)
router.get('/analytics', 
  authenticate,
  validateRole([UserRole.ADMIN]),
  controller.getConfigurationAnalytics.bind(controller)
);

export { router as customCakeRoutes };