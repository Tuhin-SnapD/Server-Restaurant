# 🚂 Railway Deployment Guide

Railway is one of the easiest platforms to deploy your Restaurant Backend Server. It offers automatic SSL, easy environment variable management, and a generous free tier.

## 🚀 Quick Deploy Steps

### 1. **Sign Up for Railway**
- Go to [railway.app](https://railway.app)
- Sign up with your GitHub account
- Create a new project

### 2. **Connect Your Repository**
- Click "Deploy from GitHub repo"
- Select your `Server-Restaurant` repository
- Railway will automatically detect it's a Node.js app

### 3. **Configure Environment Variables**
In Railway dashboard, go to Variables tab and add:

```env
NODE_ENV=production
PORT=3000
MONGO_URL=your-mongodb-connection-string
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 4. **Set Up MongoDB**
- In Railway, click "New" → "Database" → "MongoDB"
- Copy the connection string to your `MONGO_URL` variable
- Railway will automatically inject the connection string

### 5. **Deploy**
- Railway will automatically deploy your app
- It will be available at: `https://your-app-name.railway.app`

## 🔧 Configuration Details

### **Environment Variables for Railway**

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (Railway will provide this)
MONGO_URL=mongodb+srv://...

# Security
SECRET_KEY=your-very-long-and-secure-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Note: SSL is handled automatically by Railway
```

### **Railway-Specific Settings**

Railway automatically:
- ✅ Provides SSL certificates
- ✅ Handles port configuration
- ✅ Manages environment variables
- ✅ Provides automatic deployments
- ✅ Offers built-in monitoring

## 🗄️ Database Setup

### **Option 1: Railway MongoDB (Recommended)**
1. In Railway dashboard, click "New" → "Database" → "MongoDB"
2. Railway will create a MongoDB instance
3. Copy the connection string to your environment variables
4. Your app will automatically connect

### **Option 2: MongoDB Atlas**
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Add it to Railway environment variables

## 🚀 Deployment Commands

Railway will automatically run these commands:
```bash
npm install --production
npm start
```

## 📊 Monitoring

Railway provides:
- **Logs:** Real-time application logs
- **Metrics:** CPU, memory, and network usage
- **Deployments:** Automatic deployment history
- **Health checks:** Automatic health monitoring

## 🔄 Updates

To update your app:
1. Push changes to your GitHub repository
2. Railway automatically detects changes
3. Deploys the new version
4. Zero downtime deployments

## 💰 Pricing

- **Free Tier:** $5 credit/month
- **Pro:** Pay-as-you-use
- **Team:** $20/month per user

## 🛠️ Troubleshooting

### **Common Issues**

1. **Build Fails**
   - Check Railway logs
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Check `MONGO_URL` environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

3. **Port Issues**
   - Railway uses `PORT` environment variable
   - Don't hardcode port numbers

### **Useful Commands**

```bash
# View logs
railway logs

# Check status
railway status

# Open shell
railway shell

# View variables
railway variables
```

## 🎯 Advantages of Railway

✅ **Easy Setup** - Connect GitHub, deploy in minutes  
✅ **Automatic SSL** - No certificate management needed  
✅ **Environment Variables** - Easy configuration management  
✅ **Database Integration** - Built-in MongoDB support  
✅ **Automatic Deployments** - Push to GitHub, auto-deploy  
✅ **Monitoring** - Built-in logs and metrics  
✅ **Scaling** - Easy to scale up/down  
✅ **Free Tier** - Generous free tier available  

## 🚀 Next Steps After Deployment

1. **Test Your API:**
   ```bash
   curl https://your-app-name.railway.app/
   ```

2. **Populate Database:**
   ```bash
   # Via Railway shell
   railway shell
   npm run populate
   ```

3. **Monitor Performance:**
   - Check Railway dashboard for metrics
   - Monitor logs for errors
   - Set up alerts if needed

4. **Connect Frontend:**
   - Update your frontend to use the new API URL
   - Test all endpoints
   - Verify CORS settings

## 📞 Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Community:** [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues:** For app-specific issues 