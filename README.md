# Night Shift Call Tracking System

A web application for night-shift reps to log calls, notify customer-owning reps via SMS, and provide morning activity reports.

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `.env` with your Twilio credentials (optional - app works without them).

### 3. Seed the Database

```bash
cd server
node seed.js
```

Creates test users:
- Admin: `admin@example.com` / `admin123`
- Rep: `john@example.com` / `rep123`
- Rep: `jane@example.com` / `rep123`

### 4. Start Development

```bash
npm run dev
```

App runs at http://localhost:5173

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/phones.git
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### 3. Add a Volume (for SQLite persistence)

1. In your Railway project, click **+ New** → **Volume**
2. Set mount path: `/data`
3. Attach it to your service

### 4. Set Environment Variables

In Railway dashboard → Your service → **Variables**:

```
NODE_ENV=production
DATABASE_PATH=/data/phones.db
SESSION_SECRET=your-random-secret-string-here
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

### 5. Configure Build Settings

Railway should auto-detect, but verify:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 6. Initialize Database

After first deploy, run the seed script via Railway CLI or shell:

```bash
railway run node server/seed.js
```

Or manually create your admin user through the Railway shell.

### 7. Get Your URL

Railway provides a URL like `your-app.up.railway.app`

---

## Features

- **Log Calls**: Record incoming calls with customer info and notes
- **SMS Notifications**: Automatically notify the customer's rep via Twilio
- **Activity Dashboard**: View all overnight activity grouped by rep
- **SMS History**: Track all sent SMS messages with delivery status
- **Rep Management**: Admin can add/edit/deactivate reps

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **SMS**: Twilio API
