# SARAL Bhoomi Deployment Guide

## 🚀 Complete Deployment Instructions

This guide will help you deploy the SARAL Bhoomi land records application with blockchain functionality that we fixed earlier.

## Architecture Overview
- **Frontend**: React + Vite (Deploy to Vercel)
- **Backend**: Node.js + Express (Deploy to Render)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Blockchain**: Custom implementation with integrity verification

---

## 🔧 Prerequisites

1. **GitHub Account** (for code deployment)
2. **Vercel Account** (for frontend)
3. **Render Account** (for backend)
4. **MongoDB Atlas Account** (database)
5. **Cloudinary Account** (file storage)

---

## 📦 Step 1: Prepare Your Code Repository

### 1.1 Initialize Git Repository (if not done)
```bash
git init
git add .
git commit -m "Initial commit - Land records app with blockchain fixes"
```

### 1.2 Create GitHub Repository
1. Go to GitHub and create a new repository named `saral-bhoomi-app`
2. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/saral-bhoomi-app.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Step 2: Setup MongoDB Atlas (Database)

### 2.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (Free tier is sufficient for testing)
3. Set up database user with read/write permissions
4. Add your IP to whitelist (or 0.0.0.0/0 for all IPs)
5. Get your connection string

### 2.2 Required Environment Variables for Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saral_bhoomi?retryWrites=true&w=majority
```

---

## 🖼️ Step 3: Setup Cloudinary (File Storage)

### 3.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Get your credentials from Dashboard

### 3.2 Required Environment Variables for Cloudinary
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🖥️ Step 4: Deploy Backend to Render

### 4.1 Create Render Account
1. Go to [Render](https://render.com/)
2. Sign up and connect your GitHub account

### 4.2 Deploy Backend Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure deployment:
   - **Name**: `saral-bhoomi-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Plan**: Free (for testing)

### 4.3 Set Environment Variables in Render
Add these environment variables in Render dashboard:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saral_bhoomi?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 4.4 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://saral-bhoomi-backend.onrender.com`)

---

## 🌐 Step 5: Deploy Frontend to Vercel

### 5.1 Update Vercel Configuration
Update your `vercel.json` with the correct backend URL:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://YOUR-BACKEND-URL.onrender.com/api/$1" },
    { "source": "/uploads/(.*)", "destination": "https://YOUR-BACKEND-URL.onrender.com/uploads/$1" },
    { "source": "/(assets/.*)", "destination": "/$1" },
    { "source": "/favicon.ico", "destination": "/favicon.ico" },
    { "source": "/robots.txt", "destination": "/robots.txt" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 5.2 Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.3 Set Environment Variables in Vercel
Add these in Vercel dashboard:
```env
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

### 5.4 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Get your frontend URL (e.g., `https://your-app.vercel.app`)

---

## 🔄 Step 6: Update CORS Configuration

### 6.1 Update Backend CORS
Go back to Render and update the `CORS_ORIGIN` environment variable:
```
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

---

## ✅ Step 7: Test Your Deployment

### 7.1 Test Backend Health
Visit: `https://your-backend.onrender.com/health`
Should return: `{"status":"OK",...}`

### 7.2 Test Frontend
Visit: `https://your-app.vercel.app`
Should load the SARAL Bhoomi application

### 7.3 Test Key Features
1. **User Registration/Login**
2. **CSV Upload** (test with your Chandrapada file)
3. **Blockchain Status** (should show "Verified" not "Pending" or "Compromised")
4. **Land Records Management**

---

## 🔍 Monitoring and Maintenance

### 7.1 Check Logs
- **Render**: View logs in Render dashboard
- **Vercel**: View function logs in Vercel dashboard

### 7.2 Database Monitoring
- Monitor MongoDB Atlas usage and performance

### 7.3 File Storage
- Monitor Cloudinary usage and storage limits

---

## 🚨 Troubleshooting Common Issues

### Issue 1: Backend Won't Start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check Render logs for specific errors

### Issue 2: Frontend Can't Connect to Backend
- Verify `vercel.json` has correct backend URL
- Check CORS settings in backend
- Ensure backend is deployed and running

### Issue 3: Database Connection Issues
- Verify MongoDB Atlas whitelist includes Render IPs
- Check connection string format
- Ensure database user has proper permissions

### Issue 4: File Upload Issues
- Verify Cloudinary credentials
- Check file size limits
- Monitor upload directory permissions

---

## 🔐 Security Considerations

1. **JWT Secret**: Use a strong, random JWT secret
2. **Database Access**: Restrict MongoDB access to specific IPs when possible
3. **API Keys**: Never commit API keys to version control
4. **CORS**: Set specific origins, avoid wildcards in production
5. **Rate Limiting**: Monitor API usage and adjust limits as needed

---

## 📈 Scaling Considerations

1. **Database**: Upgrade MongoDB Atlas tier as data grows
2. **File Storage**: Monitor Cloudinary usage and upgrade plan
3. **Backend**: Upgrade Render plan for better performance
4. **CDN**: Consider adding CDN for static assets

---

## 🎯 Next Steps After Deployment

1. **Domain Setup**: Configure custom domain for both frontend and backend
2. **SSL Certificates**: Ensure HTTPS is properly configured
3. **Monitoring**: Set up uptime monitoring and alerts
4. **Backup Strategy**: Implement regular database backups
5. **User Training**: Prepare documentation for end users

---

## 📞 Support

If you encounter issues during deployment:
1. Check the troubleshooting section above
2. Review logs in respective platforms
3. Ensure all environment variables are correctly set
4. Test each component individually

---

**🎉 Congratulations!** Your SARAL Bhoomi application with fixed blockchain functionality is now deployed and ready for use!