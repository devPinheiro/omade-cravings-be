# 🚀 Deployment Guide - Omade Cravings Bakery Platform

This guide covers deploying the Omade Cravings Bakery Platform with proper database migrations and edge case handling.

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+ (optional - app has fallback)
- Docker (optional, for containerized deployment)
- PM2 (for production process management)

---

## 🔧 Migration System Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed development data (non-production only)
npm run db:seed:all
```

### Migration Commands
```bash
# Check migration status
npm run db:migrate:status

# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Rollback all migrations
npm run db:migrate:undo:all
```

### Creating New Migrations
```bash
# Generate migration file
npx sequelize-cli migration:generate --name add-new-feature

# Edit the generated file in src/database/migrations/
# Then run: npm run db:migrate
```

## 🚀 Deployment Methods

### Option 1: Automated Script (Recommended)
```bash
# Development deployment
npm run deploy

# Staging deployment
npm run deploy:staging

# Production deployment
npm run deploy:production
```

### Option 2: Manual Steps
```bash
# 1. Install dependencies
npm ci --production=false

# 2. Build application
npm run build

# 3. Run migrations
npm run db:migrate

# 4. Start application
npm start
```

## 🏗️ Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Application
```bash
npm run build
```

This creates a `dist/` directory with compiled JavaScript files.

### 3. Verify Build
```bash
# Check build files
ls -la dist/

# Test build locally
NODE_ENV=production node dist/server.js
```

---

## 🛠️ Environment Configuration

### Development Environment

1. **Copy Environment File:**
```bash
cp .env.example .env.development
```

2. **Configure Development Settings:**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/omade_cravings_dev
REDIS_URL=redis://localhost:6379
```

### Production Environment

1. **Create Production Environment File:**
```bash
cp .env.example .env.production
```

2. **Configure Production Settings:**
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://prod_user:secure_password@db-host:5432/omade_cravings_prod
REDIS_URL=redis://redis-host:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-here-minimum-32-chars
BCRYPT_SALT_ROUNDS=12

# Email/SMS
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Payment
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=omade-cravings-prod
AWS_S3_REGION=us-east-1

# Business
BUSINESS_NAME="Omade Cravings Bakery"
BUSINESS_EMAIL="orders@omadecravings.com"
BUSINESS_PHONE="+1-555-CRAVINGS"
```

---

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Use official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bakery -u 1001
USER bakery

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: omade_cravings_prod
      POSTGRES_USER: prod_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Build and Deploy with Docker
```bash
# Build image
docker build -t omade-cravings-api .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

1. **Push to ECR:**
```bash
# Build and tag
docker build -t omade-cravings-api .
docker tag omade-cravings-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/omade-cravings-api:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/omade-cravings-api:latest
```

2. **ECS Task Definition:**
```json
{
  "family": "omade-cravings-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/omade-cravings-api:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/omade-cravings-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Using AWS RDS for Database
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier omade-cravings-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name your-subnet-group
```

### Heroku Deployment

1. **Create Heroku App:**
```bash
heroku create omade-cravings-api
```

2. **Add Buildpacks:**
```bash
heroku buildpacks:set heroku/nodejs
```

3. **Add Add-ons:**
```bash
# PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Redis
heroku addons:create heroku-redis:premium-0
```

4. **Configure Environment:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_key
```

5. **Deploy:**
```bash
git push heroku main
```

### DigitalOcean Deployment

1. **Create Droplet:**
```bash
# Create Ubuntu droplet
doctl compute droplet create omade-cravings \
  --size s-2vcpu-2gb \
  --image ubuntu-20-04-x64 \
  --region nyc1 \
  --ssh-keys your-ssh-key-id
```

2. **Setup Server:**
```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Redis
apt install -y redis-server

# Install PM2
npm install -g pm2
```

3. **Deploy Application:**
```bash
# Clone repository
git clone https://github.com/your-username/omade-cravings.git
cd omade-cravings

# Install dependencies and build
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

---

## 📊 Process Management

### PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'omade-cravings-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/var/log/omade-cravings/error.log',
    out_file: '/var/log/omade-cravings/out.log',
    log_file: '/var/log/omade-cravings/combined.log',
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=1024'
  }]
};
```

### PM2 Commands
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Logs
pm2 logs

# Restart
pm2 restart omade-cravings-api

# Stop
pm2 stop omade-cravings-api

# Auto-restart on server reboot
pm2 startup
pm2 save
```

---

## 🔧 Nginx Configuration

Create `/etc/nginx/sites-available/omade-cravings`:
```nginx
upstream api {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 80;
    server_name api.omadecravings.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.omadecravings.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/omadecravings.crt;
    ssl_certificate_key /etc/ssl/private/omadecravings.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://api;
        access_log off;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/omade-cravings /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.omadecravings.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using CloudFlare
1. Point domain to CloudFlare
2. Enable "Full (strict)" SSL mode
3. Configure CloudFlare origin certificates

---

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Add to your application
const monitoring = {
  // Health checks
  healthCheck: () => {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  },

  // Metrics collection
  metrics: {
    requests: 0,
    errors: 0,
    responseTime: []
  }
};
```

### Log Management
```bash
# Logrotate configuration for PM2
sudo nano /etc/logrotate.d/omade-cravings

/var/log/omade-cravings/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Database Monitoring
```bash
# PostgreSQL monitoring
sudo nano /etc/postgresql/12/main/postgresql.conf

# Enable logging
log_statement = 'all'
log_duration = on
log_checkpoints = on
log_connections = on
log_disconnections = on
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: omade_cravings_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:ci
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/omade_cravings_test
        REDIS_URL: redis://localhost:6379

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /opt/omade-cravings
          git pull origin main
          npm install
          npm run build
          pm2 restart omade-cravings-api
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:8080

# Kill process
kill -9 $(lsof -ti:8080)
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
psql -h localhost -U username -d omade_cravings_prod

# Check logs
tail -f /var/log/postgresql/postgresql-12-main.log
```

#### Redis Connection Issues
```bash
# Check Redis status
systemctl status redis-server

# Test connection
redis-cli ping

# Check logs
tail -f /var/log/redis/redis-server.log
```

#### Memory Issues
```bash
# Check memory usage
free -h
pm2 monit

# Restart with memory limit
pm2 restart omade-cravings-api --max-memory-restart 500M
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
```

#### Redis Optimization
```redis
# Configure Redis for production
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup procedures in place
- [ ] Load balancer configured (if needed)

### Post-deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Redis cache functioning
- [ ] Logs being written
- [ ] Monitoring alerts configured
- [ ] Performance baseline established

### Security Checklist
- [ ] JWT secrets are secure and random
- [ ] Database credentials are strong
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation enabled
- [ ] SQL injection protection active
- [ ] CORS properly configured

---

## 🔍 Health Checks

Test your deployment:
```bash
# API health
curl https://api.omadecravings.com/health

# Database connectivity
curl https://api.omadecravings.com/api/v1/products

# Redis functionality
# (Add items to cart and verify persistence)
```

---

This deployment guide provides comprehensive instructions for deploying the Omade Cravings Bakery Platform to production environments. Adjust configurations based on your specific infrastructure and requirements.