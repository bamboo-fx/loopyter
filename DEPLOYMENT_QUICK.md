# Quick Deployment Guide

## TL;DR - 3 Steps

### 1️⃣ Deploy Backend (Railway)
- Go to https://railway.app → New Project → GitHub repo
- Set **Root Directory:** `backend`
- Add env vars (see below)
- Get URL: `https://your-backend.railway.app`

### 2️⃣ Deploy Frontend (Vercel)
- Go to https://vercel.com → New Project → GitHub repo
- Set **Root Directory:** `webapp`
- Add env var: `VITE_BACKEND_URL=https://your-backend.railway.app`
- Get URL: `https://your-app.vercel.app`

### 3️⃣ Connect Them
- In Railway, add: `ALLOWED_ORIGINS=https://your-app.vercel.app`
- In Railway, add: `TRUSTED_ORIGINS=https://your-app.vercel.app`

Done! 🎉

---

## Environment Variables

### Railway (Backend)
```bash
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key-here
RESEND_API_KEY=re_your-resend-key-here
DATABASE_URL=file:/data/production.db
BACKEND_URL=https://your-backend.railway.app
ALLOWED_ORIGINS=https://your-app.vercel.app
TRUSTED_ORIGINS=https://your-app.vercel.app
```

### Vercel (Frontend)
```bash
VITE_BACKEND_URL=https://your-backend.railway.app
```

---

## Important Notes

- **Railway needs a Volume** mounted at `/data` for the database
- **Replace URLs** with your actual Railway/Vercel URLs
- **No trailing slashes** in URLs!

See `DEPLOYMENT.md` for detailed step-by-step instructions.
