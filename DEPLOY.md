# MysteryPath Deployment Guide

## Architecture
- **Frontend**: React + Vite → Deploy on **Vercel**
- **Backend**: Flask + Socket.IO → Deploy on **Render.com** (or Railway/Fly.io)
- **Database**: SQLite (local dev) → Consider PostgreSQL for production

---

## Step 1: Deploy Backend on Render

1. Push your code to GitHub
2. Go to [Render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Name**: `mysterypath-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python run.py`
   - **Plan**: Free

5. Add these **Environment Variables** in Render dashboard:
   ```
   SECRET_KEY=<generate-a-random-secret-key>
   JWT_SECRET_KEY=<generate-another-random-secret-key>
   DATABASE_URL=sqlite:///mysterypath.db
   FLASK_ENV=production
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

6. Click **Create Web Service** and wait for deployment

7. Copy your Render URL (e.g., `https://mysterypath-api.onrender.com`)

---

## Step 2: Deploy Frontend on Vercel

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com) → New Project → Import your repo
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add this **Environment Variable** in Vercel:
   - Key: `VITE_API_URL`
   - Value: `https://mysterypath-api.onrender.com/api`
   - **Important**: In Vercel, go to Project Settings → Environment Variables and add:
     ```
     VITE_API_URL=https://your-render-url.onrender.com/api
     ```

5. Click **Deploy**

---

## Step 3: Update OAuth Callbacks (if using GitHub/Twitter login)

After both deployments are live:

1. **GitHub OAuth**:
   - Go to GitHub Settings → Developer Settings → OAuth Apps
   - Update **Authorization callback URL** to:
     `https://your-render-url.onrender.com/api/auth/github/callback`

2. **Twitter/X OAuth**:
   - Update callback URL in Twitter Developer Portal to:
     `https://your-render-url.onrender.com/api/auth/twitter/callback`

---

## Step 4: Test

1. Visit your Vercel URL (e.g., `https://mysterypath.vercel.app`)
2. Test login, registration, chat, communities, etc.
3. Check Render logs for any backend errors

---

## Notes

- **SQLite on Render**: The free tier has ephemeral filesystem. Data will reset on each deploy. For production, upgrade to PostgreSQL.
- **Socket.IO**: Works on Render, but may have connection issues on free tier due to sleeping. Consider upgrading to paid plan.
- **CORS**: Already configured to allow your Vercel domain via `FRONTEND_URL` env var.
- **Static files**: Uploads stored in `static/uploads/` will not persist on Render free tier. Use S3 or Cloudinary for production.

---

## Quick Commands

```bash
# Test build locally before deploying
npm run build

# Deploy to Vercel (if you have Vercel CLI)
vercel --prod
```
