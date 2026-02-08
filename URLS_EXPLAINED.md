# URLs Explained - Simple Guide

## What are URLs?

URLs are just web addresses - like where your app lives on the internet.

Think of it like this:
- **Backend URL** = Where your API server lives (the "brain" that does the work)
- **Frontend URL** = Where your website lives (what users see in their browser)

## When Do You Need URLs?

You only need to fill in URLs **when you deploy to production** (put your app online).

Right now, if you're just running locally on your computer, you can skip this!

## Examples:

### If deploying to Railway:
- Backend URL: `https://your-app-name.railway.app`
- Frontend URL: `https://your-frontend-name.railway.app`

### If deploying to Render:
- Backend URL: `https://your-app-name.onrender.com`
- Frontend URL: `https://your-frontend-name.onrender.com`

### If deploying to Vercel (frontend) + Railway (backend):
- Backend URL: `https://your-backend.railway.app`
- Frontend URL: `https://your-app.vercel.app`

### If you have your own domain:
- Backend URL: `https://api.yourdomain.com`
- Frontend URL: `https://yourdomain.com`

## What to Do Right Now:

**If you're just testing locally:**
- ✅ You're done! The API keys are set up.
- URLs will be `localhost` automatically.

**If you're deploying:**
1. Deploy your backend first (Railway, Render, etc.)
2. Copy the URL they give you (like `https://my-app.railway.app`)
3. Put that in `backend/.env` as `BACKEND_URL`
4. Put the same URL in `webapp/.env` as `VITE_BACKEND_URL`
5. Deploy your frontend
6. Copy the frontend URL and put it in `backend/.env` as `ALLOWED_ORIGINS` and `TRUSTED_ORIGINS`

## Quick Example:

Let's say you deploy backend to Railway and it gives you: `https://my-backend.railway.app`
And you deploy frontend to Vercel and it gives you: `https://my-app.vercel.app`

**backend/.env:**
```bash
BACKEND_URL=https://my-backend.railway.app
ALLOWED_ORIGINS=https://my-app.vercel.app
TRUSTED_ORIGINS=https://my-app.vercel.app
```

**webapp/.env:**
```bash
VITE_BACKEND_URL=https://my-backend.railway.app
```

That's it!
