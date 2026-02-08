# Testing Guide - Step by Step

## ✅ Step 1: Setup (Already Done!)
- ✅ API keys are configured
- ✅ Dependencies are installed
- ✅ Frontend is configured to use `localhost:3000` for backend

## 🚀 Step 2: Start the Backend Server

Open a terminal and run:

```bash
cd backend
bun run dev
```

**What to expect:**
- You should see: `✅ Environment variables validated successfully`
- Server should start on `http://localhost:3000`
- You'll see logs like: `Listening on http://localhost:3000`

**Keep this terminal open!** The backend needs to keep running.

---

## 🌐 Step 3: Start the Frontend Server

Open a **NEW terminal** (keep the backend running) and run:

```bash
cd webapp
bun run dev
```

**What to expect:**
- Server should start on `http://localhost:8000` (or another port)
- You'll see something like: `Local: http://localhost:8000`

---

## 🧪 Step 4: Test the App

1. **Open your browser** and go to: `http://localhost:8000`

2. **Test the health endpoint:**
   - Go to: `http://localhost:3000/health`
   - Should see: `{"status":"ok"}`

3. **Test the app:**
   - You should see the Loopyter app
   - Try signing up/login (will send email via Resend)
   - Try running some code in the notebook
   - Try the AI features

---

## 🐛 Troubleshooting

### Backend won't start
- **Error:** "Port 3000 already in use"
  - **Fix:** Kill the process using port 3000:
    ```bash
    lsof -ti:3000 | xargs kill -9
    ```

- **Error:** "OpenAI API key not configured"
  - **Fix:** Check `backend/.env` has `OPENAI_API_KEY=sk-...`

### Frontend won't connect to backend
- **Error:** CORS error or connection refused
  - **Fix:** Make sure backend is running on port 3000
  - **Fix:** Check `webapp/.env` has `VITE_BACKEND_URL=http://localhost:3000`

### Database errors
- **Error:** "Database file not found"
  - **Fix:** Run this once:
    ```bash
    cd backend
    bunx prisma db push
    ```

### Email not sending
- **Error:** Resend API errors
  - **Fix:** Check `backend/.env` has correct `RESEND_API_KEY`
  - **Note:** In development, emails might go to spam or Resend's test inbox

---

## 📝 Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access `http://localhost:8000` in browser
- [ ] Can access `http://localhost:3000/health` (shows `{"status":"ok"}`)
- [ ] Can sign up/login (email OTP works)
- [ ] Can run code in notebook
- [ ] AI features work (if OpenAI key is valid)

---

## 🎯 What to Test

1. **Authentication:**
   - Sign up with your email
   - Check email for OTP code
   - Login with the code

2. **Notebook:**
   - Write some Python code
   - Click "Run"
   - See output

3. **AI Features:**
   - Try "Improve with AI" button
   - Try model analysis
   - Try data cleaning suggestions

4. **Dashboard:**
   - View runs/experiments
   - See metrics and charts

---

## 💡 Tips

- **Keep both terminals open** - Backend and frontend need to run simultaneously
- **Check the terminal logs** - They'll show errors if something breaks
- **Use browser DevTools** - Press F12 to see console errors
- **Hot reload works** - Changes to code will auto-refresh

---

## 🛑 Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the servers
- Or close the terminal windows
