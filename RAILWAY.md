# 🚂 Railway Deployment Guide

Simple deployment guide for Railway.app with automatic migrations.

## 🚀 Quick Deploy

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Setup for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js and deploys!

## 🗄️ Database Setup

### Add PostgreSQL
```bash
# In Railway dashboard:
# 1. Click "Add Service" → "Database" → "PostgreSQL"
# 2. Railway automatically sets DATABASE_URL
```

### Add Redis (Optional)
```bash
# In Railway dashboard:
# 1. Click "Add Service" → "Database" → "Redis"  
# 2. Railway automatically sets REDIS_URL
```

## ⚙️ Environment Variables

Set these in Railway dashboard under "Variables":

### Required
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here-minimum-32-chars
BCRYPT_SALT_ROUNDS=12
```

### Optional
```bash
# Business Info
BUSINESS_NAME=Omade Cravings Bakery
BUSINESS_EMAIL=orders@omadecravings.com
BUSINESS_PHONE=+1234567890

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email/SMS
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

## 🔄 Migrations

Railway runs migrations automatically on every deploy via the `railway:migrate` command.

### Manual Migration Commands
```bash
# Check migration status
railway run npm run db:migrate:status

# Run migrations manually
railway run npm run db:migrate

# Seed demo data (development only)
railway run npm run db:seed:all
```

## 🌐 Custom Domain

1. **In Railway Dashboard:**
   - Go to your service → "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter your domain (e.g., `api.omadecravings.com`)

2. **DNS Setup:**
   ```dns
   # Add CNAME record in your DNS provider:
   api.omadecravings.com → your-app.railway.app
   ```

## 📊 Monitoring

### Railway Built-in
- **Logs**: Real-time in dashboard
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History and rollbacks

### Health Checks
Railway automatically monitors your `/health` endpoint (configured in `railway.toml`).

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if DATABASE_URL is set
railway vars

# Test connection
railway run npm run db:test
```

**Migration Errors**
```bash
# Check migration status
railway run npm run db:migrate:status

# View logs
railway logs
```

**Build Failures**
```bash
# Check build logs in Railway dashboard
# Common fixes:
# - Ensure package.json has correct scripts
# - Check TypeScript errors
# - Verify dependencies
```

### Environment Issues
```bash
# List all environment variables
railway vars

# Add missing variables
railway variables set NODE_ENV=production
```

## 🚀 Deployment Workflow

```bash
# 1. Make changes
git add .
git commit -m "Your changes"

# 2. Push to trigger deployment
git push origin main

# 3. Railway automatically:
#    - Builds the app
#    - Runs migrations
#    - Deploys
#    - Runs health checks
```

## 💰 Cost Estimation

### Hobby Plan (Free)
- **API**: $0 (500 hours free)
- **PostgreSQL**: $0 (limited)
- **Redis**: $0 (25MB)

### Pro Plan
- **API**: ~$5-10/month
- **PostgreSQL**: ~$5/month  
- **Redis**: ~$3/month
- **Total**: ~$13-18/month

Perfect for a bakery business! 🍰

## 📝 Pro Tips

1. **Environment Variables**: Use Railway's dashboard instead of `.env` files
2. **Logs**: Use `railway logs --tail` for real-time monitoring
3. **Database**: Railway PostgreSQL includes daily backups
4. **Scaling**: Easy horizontal scaling in dashboard
5. **Rollbacks**: One-click rollback to previous deployments

Railway handles all the complex deployment stuff automatically - perfect for your bakery app! 🚂