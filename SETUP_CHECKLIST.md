# Production Setup Checklist

Quick walkthrough of what you need to fill in for production.

## 🔑 API Keys You Need

### 1. OpenAI API Key (REQUIRED)
**What it's for:** AI features (model analysis, improvements, code generation)

**How to get it:**
1. Go to https://platform.openai.com/api-keys
2. Sign up/login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Where to put it:** `backend/.env`
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

---

### 2. Resend API Key (REQUIRED)
**What it's for:** Sending email verification codes for user login

**How to get it:**
1. Go to https://resend.com/api-keys
2. Sign up/login
3. Click "Create API Key"
4. Copy the key (starts with `re_`)

**Where to put it:** `backend/.env`
```bash
RESEND_API_KEY=re_your-actual-key-here
```

**Note:** Resend has a free tier (100 emails/day). For production, you might want to verify your domain.

---

## 🌐 Domain/URL Configuration

### 3. Backend URL (REQUIRED)
**What it's for:** Where your backend API is hosted

**Examples:**
- If deploying to Railway: `https://your-app.railway.app`
- If deploying to Render: `https://your-app.onrender.com`
- If deploying to Fly.io: `https://your-app.fly.dev`
- If you have a custom domain: `https://api.yourdomain.com`

**Where to put it:** `backend/.env`
```bash
BACKEND_URL=https://your-backend-url.com
```

**Also put it in:** `webapp/.env`
```bash
VITE_BACKEND_URL=https://your-backend-url.com
```

---

### 4. Frontend URL (REQUIRED for CORS)
**What it's for:** Allows your frontend to talk to your backend

**Where to put it:** `backend/.env`
```bash
ALLOWED_ORIGINS=https://your-frontend-url.com
TRUSTED_ORIGINS=https://your-frontend-url.com
```

**Examples:**
- If deploying to Vercel: `https://your-app.vercel.app`
- If deploying to Netlify: `https://your-app.netlify.app`
- If you have a custom domain: `https://yourdomain.com`

**If you have multiple domains** (like www and non-www):
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 💾 Database Configuration

### 5. Database Path (REQUIRED)
**What it's for:** Where to store your SQLite database file

**For production, use an absolute path:**
```bash
DATABASE_URL="file:/data/production.db"
```

**Where to put it:** `backend/.env`

**Note:** Make sure the `/data` directory exists and is writable on your server.

---

## 📝 Complete .env Files

### `backend/.env` (Complete Example)
```bash
# Server
PORT=3000
NODE_ENV=production

# Your API Keys
OPENAI_API_KEY=sk-your-openai-key-here
RESEND_API_KEY=re_your-resend-key-here

# URLs
BACKEND_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
TRUSTED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL="file:/data/production.db"
```

### `webapp/.env` (Complete Example)
```bash
VITE_BACKEND_URL=https://api.yourdomain.com
```

---

## ✅ Quick Checklist

- [ ] Got OpenAI API key → Put in `backend/.env` as `OPENAI_API_KEY`
- [ ] Got Resend API key → Put in `backend/.env` as `RESEND_API_KEY`
- [ ] Know your backend URL → Put in both `backend/.env` (as `BACKEND_URL`) and `webapp/.env` (as `VITE_BACKEND_URL`)
- [ ] Know your frontend URL → Put in `backend/.env` as `ALLOWED_ORIGINS` and `TRUSTED_ORIGINS`
- [ ] Set database path → Put in `backend/.env` as `DATABASE_URL` (use absolute path like `file:/data/production.db`)

---

## 🚀 After Setup

1. **Install dependencies:**
   ```bash
   cd backend && bun install
   cd ../webapp && bun install
   ```

2. **Generate Prisma client:**
   ```bash
   cd backend && bunx prisma generate
   ```

3. **Initialize database:**
   ```bash
   cd backend && bunx prisma db push
   ```

4. **Build webapp:**
   ```bash
   cd webapp && bun run build
   ```

5. **Start backend:**
   ```bash
   cd backend
   ENVIRONMENT=production bun src/index.ts
   ```

---

## 🆘 Common Issues

**"CORS error"**
- Make sure `ALLOWED_ORIGINS` in backend matches your frontend URL exactly
- Check that `VITE_BACKEND_URL` in webapp matches your backend URL

**"OpenAI API key not configured"**
- Make sure `OPENAI_API_KEY` is in `backend/.env` (not `webapp/.env`)
- Restart your backend server after adding it

**"Email not sending"**
- Check `RESEND_API_KEY` is correct
- Make sure you've verified your domain in Resend (for production)
- Check Resend dashboard for email logs

**"Database errors"**
- Make sure `DATABASE_URL` uses an absolute path in production
- Ensure the directory exists: `mkdir -p /data && chmod 755 /data`
