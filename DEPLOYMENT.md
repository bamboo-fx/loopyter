# Deployment Plan - Step by Step

## 🎯 Overview

You have 2 parts to deploy:
1. **Backend** (API server) → Use Railway or Render (Vercel doesn't support Bun well)
2. **Frontend** (React app) → Use Vercel (you've used this before!)

---

## 📋 Step-by-Step Deployment

### Part 1: Deploy Backend (Railway - Recommended)

Railway is super easy and works great with Bun.

#### Step 1: Sign up for Railway
1. Go to https://railway.app
2. Sign up with GitHub (easiest)
3. Click "New Project"

#### Step 2: Connect Your Repo
1. Click "Deploy from GitHub repo"
2. Select your repository
3. Railway will detect it's a Bun project

#### Step 3: Configure Backend
1. Railway will auto-detect `backend/` folder
2. If not, set **Root Directory** to `backend`
3. Set **Start Command** to: `bun src/index.ts`

#### Step 4: Add Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```bash
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key-here
RESEND_API_KEY=re_your-resend-key-here
DATABASE_URL=file:/data/production.db
```

**Note:** Railway will give you a URL like `https://your-app.railway.app` - save this!

#### Step 5: Add Database Volume (for SQLite)
1. In Railway, click **+ New** → **Volume**
2. Mount path: `/data`
3. This stores your database file

#### Step 6: Get Your Backend URL
1. Railway will deploy automatically
2. Once deployed, click on your service
3. Go to **Settings** → **Generate Domain**
4. Copy the URL (e.g., `https://your-backend.railway.app`)

**✅ Backend is deployed!** Save that URL - you'll need it next.

---

### Part 2: Deploy Frontend (Vercel)

#### Step 1: Push to GitHub
Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push
```

#### Step 2: Go to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"

#### Step 3: Import Your Repo
1. Select your repository
2. Vercel will auto-detect it's a Vite/React app

#### Step 4: Configure Frontend
1. **Root Directory:** `webapp` (important!)
2. **Framework Preset:** Vite
3. **Build Command:** `bun run build` (or `npm run build` if bun doesn't work)
4. **Output Directory:** `dist`

#### Step 5: Add Environment Variables
In Vercel, go to **Environment Variables** and add:

```bash
VITE_BACKEND_URL=https://your-backend.railway.app
```

**Replace** `your-backend.railway.app` with your actual Railway backend URL!

#### Step 6: Deploy
1. Click "Deploy"
2. Wait for it to finish
3. Vercel will give you a URL like `https://your-app.vercel.app`

**✅ Frontend is deployed!**

---

### Part 3: Connect Frontend to Backend

Now you need to tell your backend to accept requests from your frontend.

#### Go back to Railway (Backend)
1. Add these environment variables:

```bash
BACKEND_URL=https://your-backend.railway.app
ALLOWED_ORIGINS=https://your-app.vercel.app
TRUSTED_ORIGINS=https://your-app.vercel.app
```

**Replace** `your-app.vercel.app` with your actual Vercel frontend URL!

2. Railway will automatically redeploy with new variables

---

## ✅ Final Checklist

- [ ] Backend deployed on Railway
- [ ] Backend URL saved (e.g., `https://your-backend.railway.app`)
- [ ] Frontend deployed on Vercel
- [ ] Frontend URL saved (e.g., `https://your-app.vercel.app`)
- [ ] `VITE_BACKEND_URL` in Vercel points to Railway backend
- [ ] `ALLOWED_ORIGINS` and `TRUSTED_ORIGINS` in Railway point to Vercel frontend
- [ ] Test: Visit your Vercel URL - app should work!

---

## 🧪 Testing After Deployment

1. **Test Backend:**
   - Visit: `https://your-backend.railway.app/health`
   - Should see: `{"status":"ok"}`

2. **Test Frontend:**
   - Visit: `https://your-app.vercel.app`
   - App should load
   - Try signing up/login
   - Try AI features

3. **If CORS errors:**
   - Double-check `ALLOWED_ORIGINS` in Railway matches your Vercel URL exactly
   - Make sure no trailing slashes

---

## 🆘 Troubleshooting

### Backend won't start on Railway
- Check logs in Railway dashboard
- Make sure `DATABASE_URL` is set
- Make sure volume is mounted at `/data`

### Frontend can't connect to backend
- Check `VITE_BACKEND_URL` in Vercel matches Railway URL exactly
- Make sure backend is deployed and running
- Check Railway logs for errors

### CORS errors
- Make sure `ALLOWED_ORIGINS` in Railway includes your Vercel URL
- No `http://` vs `https://` mismatch
- No trailing slashes

### Database errors
- Make sure volume is mounted at `/data` in Railway
- Check `DATABASE_URL=file:/data/production.db` is set

---

## 💰 Cost Estimate

- **Railway:** Free tier includes $5/month credit (usually enough for small apps)
- **Vercel:** Free tier is generous (perfect for frontend)
- **Total:** Should be free for small projects!

---

## 🚀 Alternative: Render (if Railway doesn't work)

If Railway gives you trouble, Render is a good alternative:

1. Go to https://render.com
2. Sign up with GitHub
3. **New** → **Web Service**
4. Connect repo, set:
   - **Root Directory:** `backend`
   - **Build Command:** `bun install && bunx prisma generate`
   - **Start Command:** `bun src/index.ts`
5. Add same environment variables as Railway
6. Render gives you a URL like `https://your-app.onrender.com`

---

## 📝 Quick Reference

**Backend (Railway):**
- URL: `https://your-backend.railway.app`
- Environment: `DATABASE_URL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `ALLOWED_ORIGINS`, `TRUSTED_ORIGINS`

**Frontend (Vercel):**
- URL: `https://your-app.vercel.app`
- Environment: `VITE_BACKEND_URL`

That's it! You're live! 🎉
