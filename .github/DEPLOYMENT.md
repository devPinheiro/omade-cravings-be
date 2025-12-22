# 🚀 Deployment Checklist

## Pre-Deployment Setup

### 1. GitHub Secrets Configuration
Set these secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

```bash
# Required for Railway deployment
RAILWAY_TOKEN=your-railway-api-token

# Optional: For database operations in CI
RAILWAY_DATABASE_URL=postgresql://user:pass@host:port/db
```

### 2. Railway Project Setup
1. Create a new Railway project
2. Connect your GitHub repository
3. Add PostgreSQL database service
4. Add Redis database service (optional)
5. Set environment variables in Railway dashboard

### 3. Environment Variables in Railway
```bash
# Production Environment
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12

# Business Configuration
BUSINESS_NAME="Omade Cravings Bakery"
BUSINESS_EMAIL="orders@omadecravings.com"
BUSINESS_PHONE="+1234567890"
BUSINESS_ADDRESS="Your bakery address"

# Delivery Settings
DEFAULT_DELIVERY_FEE=5.99
FREE_DELIVERY_MINIMUM=50.00
MAX_DELIVERY_DISTANCE_KM=25

# Loyalty Program
POINTS_PER_DOLLAR=1
POINTS_REDEMPTION_RATE=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (add your frontend domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. Optional Services Configuration
```bash
# Payment Processing (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Choose one)
# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@yourdomain.com

# Or SMTP
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1

# Or Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Push Notifications (Firebase)
FCM_SERVER_KEY=your-fcm-key

# OAuth (Optional)
GOOGLE_OAUTH_CLIENT_ID=xxx
GOOGLE_OAUTH_CLIENT_SECRET=xxx
FACEBOOK_OAUTH_CLIENT_ID=xxx
FACEBOOK_OAUTH_CLIENT_SECRET=xxx
```

## Deployment Steps

### 1. Pre-deployment Checks
- [ ] All tests pass locally: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] API documentation validates: `npm run docs:validate`
- [ ] Environment variables are set in Railway
- [ ] Database migrations are ready

### 2. Deployment Process
1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "feat: ready for production deployment"
   git push origin main
   ```

2. **Monitor GitHub Actions:**
   - Watch the CI/CD pipeline
   - Ensure all tests pass
   - Verify build completes successfully

3. **Verify Railway Deployment:**
   - Check Railway dashboard for deployment status
   - Monitor application logs
   - Verify health check endpoint: `/api/health`

### 3. Post-deployment Verification
- [ ] API responds: `curl https://your-app.railway.app/api/health`
- [ ] Database connection works
- [ ] Redis connection works (if enabled)
- [ ] API documentation accessible: `/api/docs`
- [ ] Authentication endpoints work
- [ ] Core business endpoints respond correctly

### 4. Production Monitoring
- [ ] Set up log monitoring in Railway
- [ ] Configure error tracking (optional)
- [ ] Set up uptime monitoring
- [ ] Monitor API performance
- [ ] Check database performance

## Common Issues & Solutions

### Database Issues
```bash
# Check database connection
railway run npm run db:test

# Check migration status
railway run npm run db:migrate:status

# Run migrations manually
railway run npm run db:migrate

# Seed initial data (if needed)
railway run npm run db:seed:all
```

### Environment Variable Issues
```bash
# List all variables
railway vars

# Add missing variable
railway variables set JWT_SECRET="your-secret"

# Check specific service logs
railway logs --service your-service-name
```

### Health Check Failures
1. Verify `/api/health` endpoint works locally
2. Check database and Redis connections
3. Review Railway service logs
4. Ensure `railway.toml` configuration is correct

### Build Failures
1. Check GitHub Actions logs
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles locally
4. Check for missing environment variables

## Rollback Plan

If deployment fails:

1. **Quick Rollback (Railway):**
   - Go to Railway dashboard
   - Select previous deployment
   - Click "Redeploy"

2. **Git Rollback:**
   ```bash
   # Revert last commit
   git revert HEAD
   git push origin main
   ```

3. **Emergency Database Rollback:**
   ```bash
   # Rollback last migration
   railway run npm run db:migrate:undo
   ```

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] BCRYPT salt rounds set to 12+
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] No secrets in code/logs
- [ ] Database credentials secured
- [ ] API endpoints properly authenticated

## Performance Optimization

- [ ] Database indexes optimized
- [ ] Redis caching implemented where beneficial
- [ ] API response times monitored
- [ ] Resource usage monitored in Railway
- [ ] Consider CDN for static assets
- [ ] Implement request compression

## Maintenance Schedule

- **Weekly:** Review logs and performance
- **Monthly:** Update dependencies
- **Quarterly:** Security audit
- **As needed:** Database maintenance and optimization

---

## Getting Railway API Token

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your profile → "Account Settings"
3. Go to "Tokens" section
4. Click "Create Token"
5. Copy the token and add it to GitHub Secrets as `RAILWAY_TOKEN`

Your Omade Cravings API is ready for production! 🍰🚀