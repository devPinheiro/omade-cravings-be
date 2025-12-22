import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../../../shared/middleware/auth';
import { requireAdmin } from '../../../shared/middleware/roleValidation';

const router = Router();
const controller = new NotificationController();

/**
 * Admin-only routes for notification management
 */

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification settings
 *     description: Get current notification system settings (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email_enabled:
 *                       type: boolean
 *                       example: true
 *                     sms_enabled:
 *                       type: boolean
 *                       example: true
 *                     push_enabled:
 *                       type: boolean
 *                       example: false
 *                     email_provider:
 *                       type: string
 *                       example: "sendgrid"
 *                     sms_provider:
 *                       type: string
 *                       example: "twilio"
 *                     templates:
 *                       type: object
 *                       properties:
 *                         order_confirmation:
 *                           type: object
 *                           properties:
 *                             email_enabled:
 *                               type: boolean
 *                               example: true
 *                             sms_enabled:
 *                               type: boolean
 *                               example: true
 *                         order_ready:
 *                           type: object
 *                           properties:
 *                             email_enabled:
 *                               type: boolean
 *                               example: true
 *                             sms_enabled:
 *                               type: boolean
 *                               example: true
 *                         order_cancelled:
 *                           type: object
 *                           properties:
 *                             email_enabled:
 *                               type: boolean
 *                               example: true
 *                             sms_enabled:
 *                               type: boolean
 *                               example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings',
  authenticate,
  requireAdmin,
  controller.getSettings.bind(controller)
);

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification settings
 *     description: Update notification system settings (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_enabled:
 *                 type: boolean
 *                 example: true
 *               sms_enabled:
 *                 type: boolean
 *                 example: true
 *               push_enabled:
 *                 type: boolean
 *                 example: false
 *               email_provider:
 *                 type: string
 *                 enum: [sendgrid, smtp, mailgun]
 *                 example: "sendgrid"
 *               sms_provider:
 *                 type: string
 *                 enum: [twilio, aws_sns]
 *                 example: "twilio"
 *               templates:
 *                 type: object
 *                 properties:
 *                   order_confirmation:
 *                     type: object
 *                     properties:
 *                       email_enabled:
 *                         type: boolean
 *                         example: true
 *                       sms_enabled:
 *                         type: boolean
 *                         example: true
 *                   order_ready:
 *                     type: object
 *                     properties:
 *                       email_enabled:
 *                         type: boolean
 *                         example: true
 *                       sms_enabled:
 *                         type: boolean
 *                         example: true
 *                   order_cancelled:
 *                     type: object
 *                     properties:
 *                       email_enabled:
 *                         type: boolean
 *                         example: true
 *                       sms_enabled:
 *                         type: boolean
 *                         example: false
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification settings updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /api/v1/notifications/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Send test notification
 *     description: Send a test notification to verify service configuration (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, sms]
 *                 example: "email"
 *               recipient:
 *                 type: string
 *                 example: "test@example.com"
 *                 description: Email address or phone number
 *               template:
 *                 type: string
 *                 enum: [order_confirmation, order_ready, order_cancelled, custom]
 *                 example: "order_confirmation"
 *               custom_message:
 *                 type: string
 *                 example: "This is a test message"
 *                 description: Custom message (required if template is 'custom')
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Test notification sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message_id:
 *                       type: string
 *                       example: "test-msg-12345"
 *                     provider_response:
 *                       type: object
 *                       description: Response from notification provider
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/test',
  authenticate,
  requireAdmin,
  controller.sendTestNotification.bind(controller)
);

/**
 * @swagger
 * /api/v1/notifications/send-order-notification:
 *   post:
 *     tags: [Notifications]
 *     summary: Send order notification
 *     description: Manually send a notification for a specific order (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - notification_type
 *             properties:
 *               order_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               notification_type:
 *                 type: string
 *                 enum: [order_confirmation, order_ready, order_cancelled, payment_received]
 *                 example: "order_ready"
 *               methods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms]
 *                 example: ["email", "sms"]
 *                 description: Notification methods to use (defaults to all enabled)
 *               force_send:
 *                 type: boolean
 *                 example: false
 *                 description: Send even if already sent before
 *     responses:
 *       200:
 *         description: Order notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order notification sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_number:
 *                       type: string
 *                       example: "ORD-20240101-001"
 *                     notifications_sent:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           method:
 *                             type: string
 *                             example: "email"
 *                           recipient:
 *                             type: string
 *                             example: "customer@example.com"
 *                           status:
 *                             type: string
 *                             example: "sent"
 *                           message_id:
 *                             type: string
 *                             example: "msg-12345"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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