# 🗄️ Database Schema - Omade Cravings Bakery Platform

## Overview

The Omade Cravings Bakery Platform uses **PostgreSQL** as the primary database and **Redis** for caching and session management.

### Technologies
- **PostgreSQL 14+**: Main database for persistent data
- **Redis 6+**: Cache, sessions, and cart data
- **Sequelize ORM**: Database abstraction layer with TypeScript support

---

## 📊 Entity Relationship Diagram

```
Users (1) ────< Orders (M)
Orders (1) ────< OrderItems (M)
Products (1) ────< OrderItems (M)

Users (1) ────< Reviews (M)
Products (1) ────< Reviews (M)

Users (1) ────< LoyaltyPoints (1)

Orders (1) ────< CustomCakeConfigurations (1)

DeliverySchedules (1) ────< Orders (M)
```

---

## 📋 Table Schemas

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'rider', 'staff', 'admin')),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    social_provider VARCHAR(20) CHECK (social_provider IN ('google', 'apple', 'facebook')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    is_customizable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(8,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_reference VARCHAR(255),
    delivery_schedule_id UUID REFERENCES delivery_schedules(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(8,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(8,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### Reviews Table
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, product_id) -- One review per user per product
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

### Loyalty Points Table
```sql
CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
```

### Promo Codes Table
```sql
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    amount DECIMAL(8,2) NOT NULL CHECK (amount > 0),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INTEGER CHECK (usage_limit > 0),
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    
    CHECK (valid_to > valid_from),
    CHECK (used_count <= COALESCE(usage_limit, used_count))
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_valid_dates ON promo_codes(valid_from, valid_to);
CREATE INDEX idx_promo_codes_active ON promo_codes(valid_from, valid_to) 
    WHERE used_count < COALESCE(usage_limit, used_count + 1);
```

### Delivery Schedules Table
```sql
CREATE TABLE delivery_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    rider_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'assigned', 'completed'))
);

CREATE INDEX idx_delivery_schedules_date ON delivery_schedules(delivery_date);
CREATE INDEX idx_delivery_schedules_rider_id ON delivery_schedules(rider_id);
CREATE INDEX idx_delivery_schedules_status ON delivery_schedules(status);
```

### Custom Cake Configurations Table
```sql
CREATE TABLE custom_cake_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    flavor VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    frosting VARCHAR(100) NOT NULL,
    message TEXT,
    image_reference VARCHAR(500),
    extra_details JSONB
);

CREATE INDEX idx_custom_cake_order_id ON custom_cake_configurations(order_id);
CREATE INDEX idx_custom_cake_extras ON custom_cake_configurations USING gin(extra_details);
```

---

## 🔄 Database Triggers and Functions

### Update Timestamp Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Order Total Calculation Trigger
```sql
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_total 
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_order_total();
```

---

## 🔍 Useful Views

### Product Statistics View
```sql
CREATE VIEW product_stats AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.id) as review_count,
    COALESCE(SUM(oi.quantity), 0) as total_sold
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
GROUP BY p.id, p.name, p.category, p.price, p.stock;
```

### User Order Summary View
```sql
CREATE VIEW user_order_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    COALESCE(MAX(o.created_at), u.created_at) as last_order_date,
    lp.points as loyalty_points
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'delivered'
LEFT JOIN loyalty_points lp ON u.id = lp.user_id
GROUP BY u.id, u.name, u.email, lp.points;
```

### Daily Sales View
```sql
CREATE VIEW daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;
```

---

## 🚨 Redis Schema

### Cart Data Structure
```
Key: cart:{user_id}
Type: String (JSON)
TTL: 24 hours (86400 seconds)

Value Structure:
{
  "user_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 25.99,
      "subtotal": 51.98
    }
  ],
  "total_amount": 51.98,
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Session Data Structure
```
Key: session:{session_id}
Type: String (JSON)
TTL: 30 days (2592000 seconds)

Value Structure:
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "customer",
  "created_at": "2024-01-15T10:30:00Z",
  "last_activity": "2024-01-15T12:45:00Z"
}
```

### Product Cache Structure
```
Key: product:{product_id}
Type: String (JSON)
TTL: 1 hour (3600 seconds)

Value Structure:
{
  "id": "uuid",
  "name": "Chocolate Cake",
  "price": 25.99,
  "stock": 15,
  "category": "cakes",
  "is_customizable": true
}
```

### Rate Limiting Structure
```
Key: rate_limit:{ip_address}:{endpoint}
Type: String (Counter)
TTL: 15 minutes (900 seconds)

Value: Request count (integer)
```

---

## 📊 Database Monitoring Queries

### Check Database Size
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Table Row Counts
```sql
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

### Check Slow Queries
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🔧 Database Maintenance

### Daily Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Vacuum tables (automatic with autovacuum, but can be run manually)
VACUUM VERBOSE;

-- Reindex if needed (usually not necessary with PostgreSQL 12+)
REINDEX DATABASE omade_cravings;
```

### Weekly Maintenance Tasks
```sql
-- Check for table bloat
SELECT 
    schemaname, 
    tablename, 
    n_dead_tup, 
    n_live_tup,
    ROUND(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 2) as dead_ratio
FROM pg_stat_user_tables 
WHERE n_live_tup > 0
ORDER BY dead_ratio DESC;

-- Update statistics for query planner
VACUUM ANALYZE;
```

### Backup Commands
```bash
# Full database backup
pg_dump -h localhost -U username -d omade_cravings_prod > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -h localhost -U username -d omade_cravings_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema-only backup
pg_dump -h localhost -U username -s omade_cravings_prod > schema_backup.sql

# Data-only backup
pg_dump -h localhost -U username -a omade_cravings_prod > data_backup.sql
```

### Restore Commands
```bash
# Restore from backup
psql -h localhost -U username -d omade_cravings_prod < backup_20240115.sql

# Restore from compressed backup
gunzip -c backup_20240115.sql.gz | psql -h localhost -U username -d omade_cravings_prod
```

---

## 🔒 Security Configurations

### Database Security
```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE omade_cravings_prod TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_app_password';
GRANT CONNECT ON DATABASE omade_cravings_prod TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Row Level Security (Future Enhancement)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY user_orders ON orders 
    FOR ALL TO app_user 
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

---

## 📈 Performance Optimization

### Configuration Recommendations
```sql
-- PostgreSQL configuration for production
-- postgresql.conf recommendations:

shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
wal_buffers = 16MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 2
```

### Query Optimization Tips

1. **Use Indexes Effectively:**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
```

2. **Optimize Full-Text Search:**
```sql
-- Create specialized index for product search
CREATE INDEX idx_products_fts ON products USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
```

3. **Use Prepared Statements:**
```sql
-- Example prepared statement for frequent queries
PREPARE get_user_orders AS 
SELECT * FROM orders WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC;

EXECUTE get_user_orders('user-uuid', 'delivered');
```

---

## 🚀 Migration Scripts

### Initial Database Setup
```sql
-- Run this script to set up the database from scratch
-- File: migrations/001_initial_setup.sql

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables (schemas from above)
-- ... (include all table creation statements)

-- Create indexes
-- ... (include all index creation statements)

-- Create triggers
-- ... (include all trigger creation statements)

-- Create views
-- ... (include all view creation statements)

COMMIT;
```

### Sample Data Seeds
```sql
-- File: seeds/sample_data.sql

BEGIN;

-- Insert sample users
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '$2b$12$hash1', 'customer', '+1234567890'),
('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', '$2b$12$hash2', 'customer', '+1234567891'),
('00000000-0000-0000-0000-000000000003', 'Admin User', 'admin@omadecravings.com', '$2b$12$hash3', 'admin', '+1234567892');

-- Insert sample products
INSERT INTO products (id, name, description, price, category, stock, is_customizable) VALUES
('10000000-0000-0000-0000-000000000001', 'Chocolate Cake', 'Rich chocolate cake with ganache', 25.99, 'cakes', 20, true),
('10000000-0000-0000-0000-000000000002', 'Vanilla Cupcakes', 'Classic vanilla cupcakes (6 pack)', 12.99, 'cupcakes', 50, false),
('10000000-0000-0000-0000-000000000003', 'Red Velvet Cake', 'Traditional red velvet with cream cheese frosting', 28.99, 'cakes', 15, true);

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, amount, valid_from, valid_to, usage_limit) VALUES
('WELCOME10', 'percent', 10, '2024-01-01', '2024-12-31', 1000),
('SAVE5', 'fixed', 5.00, '2024-01-01', '2024-06-30', 500);

COMMIT;
```

---

This database documentation provides a comprehensive overview of the Omade Cravings Bakery Platform's data architecture, including schemas, relationships, optimization strategies, and maintenance procedures.