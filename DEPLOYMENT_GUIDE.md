# 🚀 Render Deployment Guide

This guide walks you through deploying your E-commerce Coupon API to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Have your database credentials ready

## 🗄️ Step 1: Database Setup

### Option A: Use Your Existing Neon Database (Recommended)
Your app is already configured with Neon PostgreSQL. You can continue using it:

```
DATABASE_URL=postgresql://neondb_owner:npg_1UWu4MepkTgX@ep-delicate-pine-ad8msrci-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Option B: Create New Render PostgreSQL Database
1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `coupon-api-db`
   - **Database**: `coupon_api`
   - **User**: `coupon_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (for testing)
3. Click **"Create Database"**
4. Copy the **External Database URL** for later use

## 🌐 Step 2: Deploy Web Service

### Method A: Connect GitHub Repository (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Coupon API"
   git branch -M main
   git remote add origin https://github.com/yourusername/coupon-api.git
   git push -u origin main
   ```

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Web Service"**
   - Click **"Connect a repository"**
   - Select your GitHub repository

3. **Configure Deployment**:
   ```
   Name: coupon-api
   Region: Oregon (US West) or closest to you
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

### Method B: Manual Deployment

1. **Prepare deployment package**:
   ```bash
   # Create deployment archive
   tar -czf coupon-api.tar.gz --exclude=node_modules --exclude=.git .
   ```

2. **Upload to Render**:
   - Go to Render Dashboard
   - Click **"New +"** → **"Web Service"**
   - Choose **"Deploy an existing image or build from a Git repository"**
   - Upload your archive

## ⚙️ Step 3: Environment Variables

In your Render Web Service settings, add these environment variables:

### Required Variables:
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=your_database_url_here
```

### Optional Variables:
```bash
# If using external database
DATABASE_TEST_URL=your_test_database_url_here
```

### Setting Environment Variables:
1. Go to your Web Service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable name and value
5. Click **"Save Changes"**

## 🚀 Step 4: Deploy and Verify

1. **Trigger Deployment**:
   - Render will automatically deploy after environment variables are set
   - Monitor deployment logs in the **"Logs"** tab

2. **Verify Deployment**:
   ```bash
   # Test health endpoint
   curl https://your-app-name.onrender.com/health
   
   # Test main endpoint
   curl https://your-app-name.onrender.com/
   
   # Test API
   curl https://your-app-name.onrender.com/api/coupons
   ```

3. **Expected Response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "uptime": 123.456,
     "environment": "production"
   }
   ```

## 🗂️ Step 5: Database Initialization

### Option A: Auto-seed on deployment
The `deploy` script will automatically run `npm run seed` to populate initial data.

### Option B: Manual seeding
If you need to manually seed the database:

1. **Connect to your Render service shell**:
   - Go to Web Service dashboard
   - Click **"Shell"** tab
   - Run: `npm run seed`

2. **Add advanced coupon data**:
   ```bash
   npm run seed:advanced
   ```

## 🔍 Step 6: Testing Your Deployment

### Test Endpoints:
```bash
# Base URL (replace with your actual URL)
BASE_URL="https://your-app-name.onrender.com"

# Health check
curl $BASE_URL/health

# Get all coupons
curl $BASE_URL/api/coupons

# Create a coupon
curl -X POST $BASE_URL/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "type": "cart_wise",
    "discount": {"type": "percentage", "value": 10},
    "conditions": {"minimumAmount": 100},
    "expirationDate": "2024-12-31T23:59:59.999Z"
  }'

# Test applicable coupons
curl -X POST $BASE_URL/api/applicable-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "cart": {
      "items": [
        {"productId": "1", "quantity": 2, "price": 100}
      ]
    }
  }'
```

## 🎯 Step 7: Custom Domain (Optional)

1. **Purchase domain** from any domain registrar
2. **Add Custom Domain** in Render:
   - Go to Web Service dashboard
   - Click **"Settings"** tab
   - Scroll to **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter your domain name
3. **Configure DNS** with your domain registrar:
   - Add CNAME record pointing to your Render URL

## 📊 Monitoring and Maintenance

### View Logs:
- **Real-time logs**: Web Service dashboard → "Logs" tab
- **Historical logs**: Available for 7 days on free plan

### Auto-Deploy:
- Render automatically deploys when you push to your connected Git branch
- Monitor deployments in the **"Events"** tab

### Scaling:
- **Free Plan**: Limited to 512MB RAM, 0.1 CPU
- **Paid Plans**: Scale up as needed for production traffic

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   ```bash
   # Check environment variables
   echo $DATABASE_URL
   
   # Verify database is accessible
   npm run seed
   ```

2. **Port Issues**:
   - Ensure your app uses `process.env.PORT`
   - Render automatically assigns port 10000

3. **Build Failures**:
   ```bash
   # Check package.json scripts
   npm install  # Should work locally
   npm start    # Should start the server
   ```

4. **Memory Issues**:
   - Free plan has 512MB limit
   - Optimize your application or upgrade plan

### Debug Commands:
```bash
# Check environment
printenv

# Check disk space
df -h

# Check memory usage
free -h

# Check process
ps aux | grep node
```

## 🎉 Your API is Live!

Once deployed, your API will be available at:
```
https://your-app-name.onrender.com
```

### Share Your API:
- **Documentation**: Share your README.md
- **Postman Collection**: Import the provided collection
- **API URL**: Use in your frontend applications

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)

---

🚀 **Congratulations! Your E-commerce Coupon API is now live on Render!** 🎉

