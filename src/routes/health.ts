import { Router, Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { sequelize } from '../config/database';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     redis:
 *                       type: string
 *                       example: connected
 *                     api:
 *                       type: string
 *                       example: running
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/health', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const services: Record<string, string> = {};
  const errors: string[] = [];
  let isHealthy = true;

  // Check database connection
  try {
    await sequelize.authenticate();
    services.database = 'connected';
  } catch (error) {
    services.database = 'disconnected';
    errors.push('Database connection failed');
    isHealthy = false;
  }

  // Check Redis connection
  try {
    const redis = getRedisClient();
    await redis.ping();
    services.redis = 'connected';
  } catch (error) {
    services.redis = 'disconnected';
    errors.push('Redis connection failed');
    isHealthy = false;
  }

  services.api = 'running';

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    services,
    ...(errors.length > 0 && { errors })
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

export default router;