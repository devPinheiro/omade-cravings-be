# Omade Cravings API

A comprehensive food delivery and restaurant management platform built with Node.js, TypeScript, Express, and PostgreSQL.

## Features

- 🍽️ Restaurant management
- 👥 Multi-role user system (customers, restaurant owners, delivery partners)
- 🛒 Order management with real-time status updates
- 📱 Menu item management
- 🚚 Delivery tracking
- 🔐 Secure authentication and authorization
- 📊 Analytics and reporting
- 💳 Payment processing integration

## Tech Stack

- **Backend:** Node.js, TypeScript, Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Validation:** Yup
- **Authentication:** JWT (planned)
- **Testing:** Jest
- **Code Quality:** ESLint, Prettier
- **Security:** Helmet, CORS

## Architecture

This project follows a domain-driven architecture:

```
src/
├── config/          # Database and app configuration
├── domains/         # Business logic organized by domain
│   ├── auth/        # Authentication & authorization
│   ├── restaurant/  # Restaurant management
│   ├── order/       # Order processing
│   └── menu/        # Menu item management
├── models/          # Database models
├── shared/          # Shared utilities and validation
└── app.ts           # Express app configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd omade-cravings
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create a PostgreSQL database
# Update DATABASE_URL in .env
```

5. Start development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Restaurants
- `GET /api/v1/restaurants` - List restaurants
- `POST /api/v1/restaurants` - Create restaurant
- `GET /api/v1/restaurants/:id` - Get restaurant details

### Menu Items
- `GET /api/v1/menu/restaurant/:id` - Get restaurant menu
- `POST /api/v1/menu` - Add menu item
- `PUT /api/v1/menu/:id` - Update menu item

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `PUT /api/v1/orders/:id/status` - Update order status

## Database Models

- **User** - Customer, restaurant owner, and delivery partner accounts
- **Restaurant** - Restaurant information and settings
- **MenuItem** - Menu items with pricing and details
- **Order** - Order information and status
- **OrderItem** - Individual items within an order

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.