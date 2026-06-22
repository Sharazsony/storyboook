# 🚀 Quick Deployment Checklist

Use this checklist to ensure everything is ready for deployment.

---

## Phase 1: Preparation (Local)

### Environment Setup
- [ ] Clone repository: `git clone https://github.com/Sharazsony/GF_GoogleClassroom_Friend.git`
- [ ] Install dependencies: `pnpm install`
- [ ] Copy `.env.example` to `.env`: `cp artifacts/api-server/.env.example artifacts/api-server/.env`
- [ ] Fill in all environment variables in `.env`

### Accounts Created
- [ ] Vercel account at [vercel.com](https://vercel.com)
- [ ] Render account at [render.com](https://render.com)
- [ ] Neon account at [console.neon.tech](https://console.neon.tech)
- [ ] Google Cloud project with OAuth credentials

### Build & Test Locally
- [ ] Frontend builds: `cd artifacts/classroom-assistant && pnpm run build`
- [ ] Backend builds: `cd artifacts/api-server && pnpm run build`
- [ ] Backend starts: `cd artifacts/api-server && pnpm start`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Can login with Google OAuth
- [ ] API health check works: `curl http://localhost:5000/api/health`

---

## Phase 2: Database Setup

### Neon PostgreSQL

- [ ] Create Neon project at [console.neon.tech](https://console.neon.tech)
- [ ] Copy Neon connection string
- [ ] Add to local `.env`: `DATABASE_URL=...`
- [ ] Initialize database: `pnpm -w exec drizzle-kit sync`
- [ ] Verify data persists by checking tables in Neon console

---

## Phase 3: Deploy Backend (Render)

### Create Service on Render

1. **Prepare:**
   - [ ] Push code to GitHub: `git push origin main`
   - [ ] Verify `render.yaml` exists in repo root

2. **In Render Dashboard:**
   - [ ] Go to [render.com/dashboard](https://render.com/dashboard)
   - [ ] Click "New +" → "Web Service"
   - [ ] Select your GitHub repository
   - [ ] Choose `main` branch
   - [ ] Set **Name:** `classmind-api`
   - [ ] Set **Runtime:** Node
   - [ ] Set **Build Command:** `pnpm install && cd artifacts/api-server && pnpm run build`
   - [ ] Set **Start Command:** `cd artifacts/api-server && pnpm start`

3. **Environment Variables:**
   - [ ] Add all variables from `.env` (see DEPLOYMENT_GUIDE.md)
   - [ ] Update `GOOGLE_REDIRECT_URI` to use Render URL: `https://classmind-api.onrender.com/api/auth/google/callback`
   - [ ] **CRITICAL:** Update `DATABASE_URL` to Neon connection string

4. **Deploy:**
   - [ ] Click "Create Web Service"
   - [ ] Wait for build to complete (~3-5 minutes)
   - [ ] Check deployment logs for errors
   - [ ] Test health endpoint: `curl https://classmind-api.onrender.com/api/health`
   - [ ] Note down your backend URL: `https://classmind-api.onrender.com`

---

## Phase 4: Update Google OAuth

### Google Cloud Console

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Select your project
- [ ] APIs & Services → Credentials
- [ ] Click your OAuth 2.0 Client ID
- [ ] Add Authorized Redirect URI:
  - [ ] `https://classmind-api.onrender.com/api/auth/google/callback`
  - [ ] Keep existing localhost URI for local dev
- [ ] Click "Save"

---

## Phase 5: Deploy Frontend (Vercel)

### In Vercel Dashboard

1. **Connect Repository:**
   - [ ] Go to [vercel.com](https://vercel.com)
   - [ ] Click "New Project"
   - [ ] Select `GF_GoogleClassroom_Friend` repository
   - [ ] Framework Preset: **Vite**
   - [ ] Root Directory: `artifacts/classroom-assistant`

2. **Build Settings:**
   - [ ] Build Command: `pnpm run build`
   - [ ] Output Directory: `dist`

3. **Environment Variables:**
   - [ ] Add `VITE_API_URL`: `https://classmind-api.onrender.com/api`
   - [ ] Click "Deploy"

4. **Deployment:**
   - [ ] Wait for build to complete (~2-3 minutes)
   - [ ] Verify deployment succeeded
   - [ ] Visit your app at the provided URL
   - [ ] Note down your frontend URL: `https://your-app.vercel.app`

---

## Phase 6: Update CORS & API URLs

### Backend CORS Configuration

- [ ] Edit `artifacts/api-server/src/app.ts`
- [ ] Add Vercel domain to CORS whitelist:
  ```typescript
  origin: ['https://your-app.vercel.app', 'http://localhost:3000']
  ```
- [ ] Push to GitHub: `git add . && git commit -m "Update CORS for production"`
- [ ] Render will auto-redeploy

---

## Phase 7: Testing

### Frontend Tests
- [ ] Visit frontend URL
- [ ] Click "Sign in with Google"
- [ ] Verify OAuth flow works
- [ ] Check that API calls reach backend
- [ ] Verify courses load
- [ ] Verify events load

### Backend Tests
- [ ] Health check: `curl https://your-backend/api/health`
- [ ] Auth callback works without errors
- [ ] Database connection is stable (check Render logs)
- [ ] No CORS errors in browser console

### Full Integration
- [ ] Login → Dashboard → View Events
- [ ] Create event flow works
- [ ] Calendar sync works
- [ ] AI summaries work

---

## Phase 8: Optimization (Optional but Recommended)

### Render
- [ ] Monitor free tier usage: Dashboard → Web Service → Metrics
- [ ] Set up email alerts for deploy failures
- [ ] Consider upgrading to Starter ($7/mo) if you need always-on

### Vercel
- [ ] Add custom domain (optional)
- [ ] Enable automatic deployments on `main` push
- [ ] Set up analytics

### Database
- [ ] Create Neon backup (paid feature but recommended)
- [ ] Monitor storage usage
- [ ] Keep backups before major changes

---

## Phase 9: Post-Deployment

### Monitoring
- [ ] Check Render logs daily for errors
- [ ] Monitor Vercel deployments
- [ ] Test login flow weekly

### Updates
- [ ] Always push to GitHub first
- [ ] Both services auto-redeploy on push
- [ ] Monitor logs during deployment

### Documentation
- [ ] Share deployed URLs with team
- [ ] Document any custom configurations
- [ ] Keep `.env.example` updated

---

## ⚠️ Critical Reminders

1. **Never commit `.env` files** - always use `.env.example` template
2. **Keep secrets secure** - don't share your keys
3. **Test login before sharing** - OAuth must work first
4. **Monitor free tier limits** - especially Render's 750 hrs/month
5. **Cold starts** - Render free tier sleeps, causing 30-sec delays

---

## 🆘 Troubleshooting

### "CORS error" or "Cannot reach API"
- [ ] Check CORS origin in backend code
- [ ] Verify Render is running (check logs)
- [ ] Verify Vercel frontend URL is in CORS whitelist
- [ ] Test with direct curl: `curl https://your-backend/api/health`

### "OAuth failed" or "redirect_uri mismatch"
- [ ] Verify `GOOGLE_REDIRECT_URI` in .env matches exactly
- [ ] Verify Google Cloud OAuth settings match
- [ ] Clear browser cookies and try again

### "Cold start taking 30+ seconds"
- [ ] This is normal on Render free tier
- [ ] Upgrade to Starter plan ($7/mo) for always-on
- [ ] Or use a uptime monitor to keep it warm

### "Database connection failed"
- [ ] Verify `DATABASE_URL` is set in Render env vars
- [ ] Check Neon connection string includes `?sslmode=require`
- [ ] Verify Neon project is active
- [ ] Check Neon dashboard for active connections limit

---

## ✅ All Done!

Once you complete all sections, your app is live and ready to use! 🎉

- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://classmind-api.onrender.com`
- **Database:** Neon PostgreSQL

**Share your deployed app with friends and get feedback!**
