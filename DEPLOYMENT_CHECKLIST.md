# 🚀 SARAL Bhoomi Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code Preparation
- [ ] All blockchain fixes are working (status shows "Verified" not "Compromised")
- [ ] CSV upload functionality tested with Chandrapada file
- [ ] All dependencies installed and working
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts without errors
- [ ] Git repository is clean and committed

### Environment Setup
- [ ] MongoDB Atlas cluster created and configured
- [ ] Cloudinary account set up with API credentials
- [ ] JWT secret generated (minimum 32 characters)
- [ ] Production environment variables prepared

### Platform Accounts
- [ ] GitHub account ready with repository
- [ ] Render.com account created
- [ ] Vercel.com account created

---

## 🗄️ Database Setup (MongoDB Atlas)

### Steps:
1. [ ] Create MongoDB Atlas account
2. [ ] Create new cluster (Free tier M0)
3. [ ] Create database user with read/write permissions
4. [ ] Add IP addresses to whitelist (0.0.0.0/0 for all IPs)
5. [ ] Get connection string
6. [ ] Test connection with database

### Required Info:
- [ ] MongoDB URI: `mongodb+srv://...`
- [ ] Database name: `saral_bhoomi`

---

## 🖼️ File Storage Setup (Cloudinary)

### Steps:
1. [ ] Create Cloudinary account
2. [ ] Get dashboard credentials
3. [ ] Test upload functionality

### Required Info:
- [ ] Cloud Name: `_____________`
- [ ] API Key: `_____________`
- [ ] API Secret: `_____________`

---

## 📦 Code Repository Setup

### Steps:
1. [ ] Create GitHub repository: `saral-bhoomi-app`
2. [ ] Push code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment - blockchain fixes included"
   git push origin main
   ```

---

## 🖥️ Backend Deployment (Render)

### Steps:
1. [ ] Go to Render.com dashboard
2. [ ] Click "New" → "Web Service"
3. [ ] Connect GitHub repository
4. [ ] Configure service:
   - Name: `saral-bhoomi-backend`
   - Root Directory: `backend`
   - Build Command: `npm ci`
   - Start Command: `npm start`
5. [ ] Add environment variables (see .env.production.template)
6. [ ] Deploy service
7. [ ] Test health endpoint: `/health`

### Required Environment Variables:
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET=...`
- [ ] `MONGODB_URI=...`
- [ ] `CLOUDINARY_CLOUD_NAME=...`
- [ ] `CLOUDINARY_API_KEY=...`
- [ ] `CLOUDINARY_API_SECRET=...`
- [ ] `CORS_ORIGIN=https://your-app.vercel.app`

### Deployment URL:
- [ ] Backend URL: `https://____________.onrender.com`

---

## 🌐 Frontend Deployment (Vercel)

### Steps:
1. [ ] Update `vercel.json` with correct backend URL
2. [ ] Go to Vercel.com dashboard
3. [ ] Click "New Project"
4. [ ] Import GitHub repository
5. [ ] Configure project:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. [ ] Add environment variables if needed
7. [ ] Deploy project

### Deployment URL:
- [ ] Frontend URL: `https://____________.vercel.app`

---

## 🔄 Post-Deployment Configuration

### Update CORS Settings:
1. [ ] Go back to Render backend settings
2. [ ] Update `CORS_ORIGIN` with actual Vercel URL
3. [ ] Redeploy backend service

---

## ✅ Testing Deployed Application

### Backend Tests:
- [ ] Health check: `https://your-backend.onrender.com/health`
- [ ] Test endpoint: `https://your-backend.onrender.com/api/test`

### Frontend Tests:
- [ ] Application loads: `https://your-app.vercel.app`
- [ ] User registration/login works
- [ ] Dashboard displays correctly

### Integration Tests:
- [ ] CSV upload functionality (test with Chandrapada file)
- [ ] Blockchain status shows "Verified" (not "Pending" or "Compromised")
- [ ] Land records CRUD operations
- [ ] File uploads work correctly
- [ ] Authentication flow works end-to-end

---

## 🚨 Troubleshooting

### Common Issues:
- [ ] Backend won't start → Check environment variables and logs
- [ ] Frontend can't connect → Check CORS settings and backend URL
- [ ] Database errors → Verify MongoDB connection and permissions
- [ ] File upload fails → Check Cloudinary credentials
- [ ] Blockchain shows wrong status → Verify data integrity scripts ran

---

## 🎉 Deployment Complete!

### Final Steps:
- [ ] Document deployment URLs
- [ ] Set up monitoring/alerts
- [ ] Create user documentation
- [ ] Plan backup strategy
- [ ] Consider custom domain setup

---

**Congratulations! Your SARAL Bhoomi application with blockchain fixes is now live! 🎊**

### Important URLs to Save:
- **Frontend**: `https://____________.vercel.app`
- **Backend**: `https://____________.onrender.com`
- **Database**: MongoDB Atlas Dashboard
- **File Storage**: Cloudinary Dashboard