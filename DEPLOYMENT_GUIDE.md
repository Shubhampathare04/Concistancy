# PRODUCTION DEPLOYMENT GUIDE

## Pre-Deployment Checklist

### Backend Readiness
- [x] All endpoints tested
- [x] Redis caching implemented
- [x] Cache invalidation working
- [x] Database migrations ready
- [x] Environment variables documented
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring configured
- [ ] Database backups configured
- [ ] SSL certificates ready
- [ ] Domain configured

### Mobile Readiness
- [x] All screens functional
- [x] Error handling implemented
- [x] Loading states added
- [x] Empty states added
- [x] Toast notifications working
- [ ] App icons created
- [ ] Splash screen created
- [ ] App store screenshots
- [ ] App store description
- [ ] Privacy policy URL

---

## Backend Deployment

### Option 1: Railway (Recommended for MVP)

**1. Create Railway Account**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login
```

**2. Initialize Project**
```bash
cd backend
railway init
```

**3. Add Services**
```bash
# Add MySQL
railway add mysql

# Add Redis
railway add redis

# Link services
railway link
```

**4. Set Environment Variables**
```bash
railway variables set DATABASE_URL="mysql+pymysql://..."
railway variables set REDIS_URL="redis://..."
railway variables set JWT_SECRET="your-secret-key"
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set CORS_ORIGINS='["https://your-app.com"]'
```

**5. Deploy**
```bash
railway up
```

**6. Run Migrations**
```bash
railway run alembic upgrade head
```

### Option 2: AWS ECS

**1. Create ECR Repository**
```bash
aws ecr create-repository --repository-name consistency-backend
```

**2. Build and Push Docker Image**
```bash
# Build
docker build -t consistency-backend .

# Tag
docker tag consistency-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/consistency-backend:latest

# Push
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/consistency-backend:latest
```

**3. Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name consistency-cluster
```

**4. Create Task Definition**
```json
{
  "family": "consistency-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/consistency-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DATABASE_URL", "value": "..."},
        {"name": "REDIS_URL", "value": "..."}
      ]
    }
  ]
}
```

**5. Create Service**
```bash
aws ecs create-service \
  --cluster consistency-cluster \
  --service-name consistency-backend \
  --task-definition consistency-backend \
  --desired-count 2 \
  --launch-type FARGATE
```

### Option 3: DigitalOcean App Platform

**1. Create App**
- Go to DigitalOcean dashboard
- Click "Create" → "Apps"
- Connect GitHub repository
- Select `backend` folder

**2. Configure Build**
```yaml
name: consistency-backend
services:
  - name: api
    github:
      repo: your-username/consistency-app
      branch: main
      deploy_on_push: true
    source_dir: /backend
    build_command: pip install -r requirements.txt
    run_command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: REDIS_URL
        value: ${redis.REDIS_URL}
databases:
  - name: db
    engine: MYSQL
    version: "8"
  - name: redis
    engine: REDIS
    version: "7"
```

---

## Mobile Deployment

### iOS App Store

**1. Prepare Assets**
```bash
cd mobile

# Generate app icons
# Use https://www.appicon.co/ to generate all sizes

# Create screenshots
# Use iOS Simulator to capture screenshots
# Required sizes: 6.5", 5.5"
```

**2. Configure app.json**
```json
{
  "expo": {
    "name": "Consistency",
    "slug": "consistency-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.consistency",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Take photos of completed tasks",
        "NSPhotoLibraryUsageDescription": "Choose photos for task proof"
      }
    }
  }
}
```

**3. Build**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios
```

**4. Submit to App Store**
```bash
eas submit --platform ios
```

### Android Play Store

**1. Configure app.json**
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.consistency",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

**2. Build**
```bash
# Build for Android
eas build --platform android
```

**3. Submit to Play Store**
```bash
eas submit --platform android
```

---

## Database Setup

### MySQL Production

**1. Create Database**
```sql
CREATE DATABASE consistency_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'consistency'@'%' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON consistency_db.* TO 'consistency'@'%';
FLUSH PRIVILEGES;
```

**2. Run Migrations**
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

**3. Seed Initial Data (Optional)**
```bash
python seed_users.py
```

### MongoDB Atlas

**1. Create Cluster**
- Go to MongoDB Atlas
- Create new cluster
- Choose region closest to your backend

**2. Configure Network Access**
- Add IP whitelist: 0.0.0.0/0 (or specific IPs)

**3. Create Database User**
- Username: consistency
- Password: strong-password
- Role: readWrite

**4. Get Connection String**
```
mongodb+srv://consistency:password@cluster.mongodb.net/consistency_app?retryWrites=true&w=majority
```

**5. Initialize Collections**
```bash
python init_mongodb_complete.py
```

### Redis Production

**Option 1: Redis Cloud**
- Go to redis.com
- Create free account
- Create database
- Get connection string

**Option 2: AWS ElastiCache**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id consistency-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

---

## Environment Variables

### Backend Production .env
```bash
# Database
DATABASE_URL=mysql+pymysql://user:pass@host:3306/consistency_db
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/consistency_app
REDIS_URL=redis://host:6379/0

# Security
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=["https://your-app.com","https://www.your-app.com"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_AUTH_PER_MINUTE=10

# Celery (if using)
CELERY_BROKER_URL=redis://host:6379/1
CELERY_RESULT_BACKEND=redis://host:6379/2

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...
```

### Mobile Production .env
```bash
EXPO_PUBLIC_API_URL=https://api.your-app.com/api/v1
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

**1. Install Certbot**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

**2. Get Certificate**
```bash
sudo certbot --nginx -d api.your-app.com
```

**3. Auto-Renewal**
```bash
sudo certbot renew --dry-run
```

### Using Cloudflare (Recommended)

**1. Add Domain to Cloudflare**
- Go to Cloudflare dashboard
- Add your domain
- Update nameservers

**2. Configure DNS**
```
A    api    <your-server-ip>
A    @      <your-server-ip>
```

**3. Enable SSL**
- SSL/TLS → Full (strict)
- Edge Certificates → Always Use HTTPS

---

## Monitoring Setup

### Sentry (Error Tracking)

**1. Create Sentry Account**
- Go to sentry.io
- Create new project

**2. Install SDK**
```bash
# Backend
pip install sentry-sdk[fastapi]

# Mobile
npx expo install sentry-expo
```

**3. Configure Backend**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)
```

**4. Configure Mobile**
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'your-dsn',
  enableInExpoDevelopment: false,
  debug: false,
});
```

### Performance Monitoring

**Option 1: New Relic**
```bash
pip install newrelic
newrelic-admin run-program uvicorn app.main:app
```

**Option 2: DataDog**
```bash
pip install ddtrace
ddtrace-run uvicorn app.main:app
```

---

## CI/CD Setup

### GitHub Actions

**Create `.github/workflows/deploy.yml`**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and Submit
        run: |
          cd mobile
          npm install -g eas-cli
          eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Post-Deployment

### 1. Health Checks
```bash
# Backend
curl https://api.your-app.com/health

# Detailed health
curl https://api.your-app.com/health/detailed
```

### 2. Database Verification
```bash
# Connect to production DB
mysql -h host -u user -p consistency_db

# Check tables
SHOW TABLES;

# Check data
SELECT COUNT(*) FROM users;
```

### 3. Redis Verification
```bash
redis-cli -h host -p 6379
PING
KEYS *
```

### 4. Mobile Testing
- Download from App Store / Play Store
- Test complete user flow
- Verify API connection
- Test offline mode

### 5. Monitoring Setup
- Configure alerts in Sentry
- Set up uptime monitoring (UptimeRobot)
- Configure log aggregation
- Set up performance dashboards

---

## Rollback Plan

### Backend Rollback
```bash
# Railway
railway rollback

# AWS ECS
aws ecs update-service \
  --cluster consistency-cluster \
  --service consistency-backend \
  --task-definition consistency-backend:previous-version
```

### Database Rollback
```bash
# Downgrade one migration
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision>
```

### Mobile Rollback
- Cannot rollback app store releases
- Must submit new version
- Keep previous APK/IPA for emergency

---

## Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Check database size
- [ ] Verify backups

### Weekly
- [ ] Review user feedback
- [ ] Check crash reports
- [ ] Analyze performance metrics
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database cleanup
- [ ] Cost optimization

---

## Support

### User Support
- Email: support@your-app.com
- In-app feedback form
- FAQ page
- Community forum

### Technical Support
- Sentry for errors
- CloudWatch for logs
- New Relic for performance
- PagerDuty for alerts

---

## Costs Estimate (Monthly)

### MVP (< 1000 users)
- Railway: $20
- MongoDB Atlas: Free tier
- Redis Cloud: Free tier
- Domain: $12/year
- **Total: ~$25/month**

### Growth (1000-10000 users)
- Railway: $50
- MongoDB Atlas: $25
- Redis Cloud: $10
- Sentry: $26
- **Total: ~$111/month**

### Scale (10000+ users)
- AWS ECS: $100
- RDS MySQL: $50
- ElastiCache: $30
- MongoDB Atlas: $50
- Sentry: $80
- New Relic: $100
- **Total: ~$410/month**

---

**Status:** Ready for Production Deployment
**Timeline:** 1-2 days for complete deployment
**Risk Level:** LOW
