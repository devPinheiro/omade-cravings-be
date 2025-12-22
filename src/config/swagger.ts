import swaggerJSDoc from 'swagger-jsdoc';
import { Request, Response } from 'express';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Omade Cravings API',
      version: '1.0.0',
      description: 'Food delivery and restaurant management platform API',
      contact: {
        name: 'API Support',
        email: 'support@omadecravings.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.omadecravings.com' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-session-id',
          description: 'Guest session ID for cart operations',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'An error occurred',
            },
            error: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
              example: 'CUSTOMER',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            emailVerified: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Chocolate Cake',
            },
            description: {
              type: 'string',
              example: 'Delicious chocolate cake with rich frosting',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 25.99,
            },
            category: {
              type: 'string',
              example: 'CAKES',
            },
            subcategory: {
              type: 'string',
              example: 'CHOCOLATE',
            },
            imageUrl: {
              type: 'string',
              format: 'url',
              example: 'https://example.com/image.jpg',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            stockQuantity: {
              type: 'integer',
              example: 10,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['sweet', 'chocolate', 'popular'],
            },
            nutritionalInfo: {
              type: 'object',
              properties: {
                calories: { type: 'number', example: 350 },
                protein: { type: 'number', example: 5 },
                carbs: { type: 'number', example: 45 },
                fat: { type: 'number', example: 18 },
              },
            },
            allergens: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['gluten', 'dairy', 'eggs'],
            },
            preparationTime: {
              type: 'integer',
              example: 30,
              description: 'Preparation time in minutes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2,
            },
            customCakeConfig: {
              type: 'object',
              properties: {
                flavor: {
                  type: 'string',
                  example: 'Vanilla',
                },
                size: {
                  type: 'string',
                  example: '8 inch',
                },
                frosting: {
                  type: 'string',
                  example: 'Buttercream',
                },
                message: {
                  type: 'string',
                  example: 'Happy Birthday!',
                },
                extraDetails: {
                  type: 'object',
                  properties: {
                    decorations: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Fresh Flowers', 'Chocolate Drip'],
                    },
                    layers: {
                      type: 'integer',
                      example: 2,
                    },
                  },
                },
              },
            },
            specialInstructions: {
              type: 'string',
              example: 'Please make it extra sweet',
            },
          },
          required: ['productId', 'quantity'],
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-20240101-001',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING',
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              example: 45.98,
            },
            tax: {
              type: 'number',
              format: 'decimal',
              example: 3.68,
            },
            deliveryFee: {
              type: 'number',
              format: 'decimal',
              example: 5.99,
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 55.65,
            },
            deliveryAddress: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'New York' },
                state: { type: 'string', example: 'NY' },
                zipCode: { type: 'string', example: '10001' },
                country: { type: 'string', example: 'US' },
              },
            },
            paymentMethod: {
              type: 'string',
              example: 'CREDIT_CARD',
            },
            estimatedDeliveryTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T18:00:00.000Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'Token is missing or invalid',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Access denied',
                error: 'Insufficient permissions',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'The requested resource does not exist',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error - invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'Invalid input data provided',
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: 'An unexpected error occurred',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Products',
        description: 'Product management and catalog endpoints',
      },
      {
        name: 'Cart',
        description: 'Shopping cart management endpoints (Legacy)',
      },
      {
        name: 'Enhanced Cart',
        description: 'Advanced cart management with guest support',
      },
      {
        name: 'Orders',
        description: 'Order management and tracking endpoints',
      },
      {
        name: 'Reviews',
        description: 'Product reviews and ratings endpoints',
      },
      {
        name: 'Loyalty',
        description: 'Loyalty points and rewards endpoints',
      },
      {
        name: 'Promotions',
        description: 'Promotional codes and discounts endpoints',
      },
      {
        name: 'Custom Cakes',
        description: 'Custom cake configuration and ordering endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'System',
        description: 'System health and information endpoints',
      },
    ],
  },
  apis: [
    './src/domains/*/routes/*.ts',
    './src/domains/*/controllers/*.ts',
    './src/app.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Health check endpoint documentation helper
export const healthCheckDocs = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check endpoint',
      description: 'Check if the API is running and healthy',
      responses: {
        200: {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'success',
                  },
                  message: {
                    type: 'string',
                    example: 'Omade Cravings API is healthy',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-01T12:00:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};