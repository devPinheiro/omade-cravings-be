import swaggerJSDoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Omade Cravings API',
      version: '1.0.0',
      description: 'Food delivery and restaurant management platform API documentation',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      contact: {
        name: 'Omade Cravings Support',
        email: 'support@omadecravings.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.omadecravings.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        sessionId: {
          type: 'apiKey',
          in: 'header',
          name: 'x-session-id',
          description: 'Guest session ID for cart operations',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'An error occurred',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 10,
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Products',
        description: 'Product catalog management endpoints',
      },
      {
        name: 'Cart (Legacy)',
        description: 'Legacy cart operations (authenticated users only)',
      },
      {
        name: 'Cart (Enhanced)',
        description: 'Enhanced cart operations (supports guests and authenticated users)',
      },
      {
        name: 'Orders',
        description: 'Order management and tracking endpoints',
      },
      {
        name: 'Reviews',
        description: 'Product review and rating endpoints',
      },
      {
        name: 'Loyalty',
        description: 'Loyalty points and rewards endpoints',
      },
      {
        name: 'Promotions',
        description: 'Promo codes and discount management endpoints',
      },
      {
        name: 'Custom Cakes',
        description: 'Custom cake configuration and pricing endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification system management endpoints',
      },
    ],
  },
  apis: [
    './docs/swagger/paths/*.yaml',
    './docs/swagger/components/*.yaml',
    './src/domains/*/routes/*.ts',
    './src/app.ts',
  ],
};

export const specs = swaggerJSDoc(options);