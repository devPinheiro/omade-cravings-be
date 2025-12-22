import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../../../shared/middleware/auth';
import { requireAdmin } from '../../../shared/middleware/roleValidation';

const router = Router();
const controller = new NotificationController();

/**
 * Admin-only routes for notification management
 */

// Get notification system settings
router.get('/settings',
  authenticate,
  requireAdmin,
  controller.getSettings.bind(controller)
);

// Update notification system settings
router.put('/settings',
  authenticate,
  requireAdmin,
  controller.updateSettings.bind(controller)
);

// Test notification service connections
router.get('/test-connections',
  authenticate,
  requireAdmin,
  controller.testConnections.bind(controller)
);

// Send test notification
router.post('/test',
  authenticate,
  requireAdmin,
  controller.sendTestNotification.bind(controller)
);

// Send notification for specific order
router.post('/send-order-notification',
  authenticate,
  requireAdmin,
  controller.sendOrderNotification.bind(controller)
);

// Get available notification events and types
router.get('/options',
  authenticate,
  requireAdmin,
  controller.getNotificationOptions.bind(controller)
);

export { router as notificationRoutes };