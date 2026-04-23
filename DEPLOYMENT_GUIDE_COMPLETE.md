# 🚀 EmailBoost - Complete Setup & Deployment Guide

## **System Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   EMAILBOOST SAAS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FRONTEND (React/Vite)                                  │
│  ├─ Landing Page (Hero, Features, Pricing)             │
│  ├─ Auth Modal (Signup/Login with OTP)                 │
│  ├─ Dashboard (User area)                              │
│  ├─ Demo Generator                                     │
│  └─ Payment Integration                                │
│                                                          │
│  BACKEND (FastAPI/Python)                              │
│  ├─ User Authentication (JWT + OTP)                    │
│  ├─ Subject Line Generation (LLM)                      │
│  ├─ Payment Processing (Stripe)                        │
│  ├─ Email Notifications (Resend)                       │
│  └─ User Management                                    │
│                                                          │
│  DATABASE (MongoDB)                                     │
│  ├─ Users                                              │
│  ├─ Subject Line History                               │
│  ├─ Payments                                           │
│  └─ Subscription Data                                  │
│                                                          │
│  EXTERNAL SERVICES                                      │
│  ├─ Stripe (Payments)                                  │
│  ├─ Resend (Email)                                     │
│  └─ LLM Service (Emergent/Claude)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## **PART 1: LOCAL DEVELOPMENT SETUP**

### **Step 1: Prerequisites**

Install these on your machine:

```bash
# Required:
- Python 3.10+ (download from python.org)
- Node.js 18+ (download from nodejs.org)
- MongoDB (Community Edition or Atlas cloud)
- Git (download from git-scm.com)
```

### **Step 2: MongoDB Setup**

**Option A: Cloud MongoDB (Easiest)**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a free cluster
4. Get your connection string (will look like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
5. Copy this string (you'll need it in .env)

**Option B: Local MongoDB**
1. Download from: https://www.mongodb.com/try/download/community
2. Install
3. Start MongoDB service
4. Connection string: `mongodb://localhost:27017/emailboost`

### **Step 3: Backend Setup**

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cp .env.example .env

# 6. Edit .env with your values:
# - MONGO_URL=your_mongodb_connection_string
# - STRIPE_API_KEY=your_stripe_secret_key
# - RESEND_API_KEY=your_resend_api_key
# - JWT_SECRET=any_random_string_min_32_chars
# - EMERGENT_LLM_KEY=your_emergent_key (or Claude API key)

# 7. Start backend server
python -m uvicorn server:app --reload --port 8000
```

Backend will be running at: `http://localhost:8000`

### **Step 4: Frontend Setup**

```bash
# 1. Navigate to frontend folder (in new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env:
# REACT_APP_API_URL=http://localhost:8000
# REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# 5. Start frontend
npm start
```

Frontend will be running at: `http://localhost:3000`

### **Step 5: Test Locally**

1. Open browser: `http://localhost:3000`
2. Click "Try Free Demo" or "Get Started"
3. Sign up with your email (OTP will be sent)
4. Try the subject line generator
5. Try upgrading to Pro (Stripe test mode)

---

## **PART 2: PRODUCTION DEPLOYMENT**

### **Architecture**
```
Frontend: Vercel (free)
Backend: Railway.app or Render.com (free)
Database: MongoDB Atlas (free)
Payments: Stripe (free until you make sales)
Email: Resend (free tier)
```

### **Step 1: Deploy MongoDB Atlas**

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user (username/password)
4. Whitelist IP: 0.0.0.0/0 (allow all for now, restrict later)
5. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/emailboost`

### **Step 2: Deploy Backend to Railway.app**

**Easiest deployment option**

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your EmailBoost repository
5. Choose the `backend` folder as the root directory
6. Add environment variables:
   ```
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   STRIPE_API_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_...
   SENDER_EMAIL=noreply@yourdomain.com
   EMERGENT_LLM_KEY=your_key
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   DB_NAME=emailboost
   ```
7. Deploy!
8. Get your backend URL (will be like: https://emailboost-production-xyz.up.railway.app)

**Alternative: Deploy to Render.com**

1. Go to: https://render.com
2. Sign up
3. Click "New +" → "Web Service"
4. Connect GitHub
5. Select repository
6. Set build command: `cd backend && pip install -r requirements.txt`
7. Set start command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
8. Add environment variables (same as above)
9. Deploy!

### **Step 3: Deploy Frontend to Vercel**

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Settings:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Install Command: `npm install`
6. Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
7. Deploy!
8. Get your frontend URL

### **Step 4: Setup Stripe Payments**

1. Go to: https://stripe.com
2. Sign up
3. Get your API keys:
   - Secret Key: `sk_live_...` (for backend)
   - Publishable Key: `pk_live_...` (for frontend)
4. Setup webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-backend-url/api/webhook/stripe`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`
   - Copy webhook secret: `whsec_...` (for backend env)

### **Step 5: Setup Resend Email**

1. Go to: https://resend.com
2. Sign up
3. Get API key: `re_...`
4. Add to backend environment variables
5. Set sender email in environment

### **Step 6: Setup Emergent/Claude LLM**

1. Go to: https://console.anthropic.com (for Claude API)
   OR
   https://emergent.sh (if using Emergent)
2. Get your API key
3. Add to backend environment variables

### **Step 7: Connect Everything**

Update all environment variables in your deployed services:

**Backend (Railway/Render):**
```
✓ MONGO_URL (from MongoDB Atlas)
✓ STRIPE_API_KEY & STRIPE_WEBHOOK_SECRET (from Stripe)
✓ RESEND_API_KEY & SENDER_EMAIL (from Resend)
✓ EMERGENT_LLM_KEY (from Emergent/Claude)
✓ JWT_SECRET (random string, min 32 chars)
✓ CORS_ORIGINS (your frontend URL)
```

**Frontend (Vercel):**
```
✓ REACT_APP_API_URL (your backend URL)
✓ REACT_APP_STRIPE_PUBLISHABLE_KEY (from Stripe)
```

---

## **PART 3: POST-DEPLOYMENT CHECKLIST**

- [ ] Backend is running (`curl https://your-backend-url/health`)
- [ ] Frontend is deployed and accessible
- [ ] Can sign up with email
- [ ] OTP email is received
- [ ] Can log in to dashboard
- [ ] Subject line generator works
- [ ] Can upgrade to Pro
- [ ] Stripe payment modal appears
- [ ] Test payment processes successfully
- [ ] Success page shows after payment
- [ ] User plan updates in dashboard
- [ ] Database has user records (check MongoDB)

---

## **PART 4: CUSTOM DOMAIN (OPTIONAL)**

### **Frontend Domain**
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Go to Vercel → Settings → Domains
3. Add domain
4. Update DNS records as instructed by Vercel
5. Wait 24-48 hours for DNS propagation

### **Backend Domain (Optional)**
1. Add custom domain to Railway/Render
2. Update CORS_ORIGINS in backend environment
3. Update REACT_APP_API_URL in frontend

---

## **PART 5: MAINTENANCE & MONITORING**

### **Weekly Checks:**
- [ ] Check error logs in Railway/Render
- [ ] Verify Stripe payments are processing
- [ ] Check MongoDB storage (Atlas shows usage)
- [ ] Monitor email quota (Resend)

### **Monthly Tasks:**
- [ ] Review user feedback
- [ ] Check payment success rate
- [ ] Review API usage and costs
- [ ] Update dependencies (`npm update`, `pip update`)

### **Logs & Debugging:**
- Backend logs: Railway/Render dashboard
- Frontend errors: Browser console (F12)
- Database: MongoDB Atlas dashboard
- Payments: Stripe dashboard

---

## **TROUBLESHOOTING**

### **Backend Won't Start**
```bash
# Check Python version
python --version  # Should be 3.10+

# Check dependencies
pip list

# Try reinstalling
pip install -r requirements.txt --force-reinstall

# Check .env variables are all set
```

### **Frontend Can't Connect to Backend**
- Check REACT_APP_API_URL is correct
- Check backend CORS_ORIGINS includes your frontend URL
- Check backend is running

### **Payment Not Working**
- Verify Stripe keys are correct
- Check webhook is configured
- Check MongoDB is storing payment records
- Test with Stripe test cards: `4242 4242 4242 4242`

### **Email Not Sending**
- Verify RESEND_API_KEY is correct
- Check sender email is verified in Resend
- Check SENDER_EMAIL in .env

### **OTP Not Arriving**
- Check RESEND_API_KEY
- Check spam folder
- Try different email
- Check Resend dashboard for failures

---

## **IMPORTANT SECURITY NOTES**

⚠️ **NEVER commit .env to GitHub!**
- Add to .gitignore (already done)
- Use environment variables in production
- Different .env for each environment

⚠️ **Keep secrets safe:**
- Change JWT_SECRET in production
- Use strong Stripe API keys (live keys only in production)
- Restrict MongoDB IP whitelist

⚠️ **HTTPS only in production**
- All URLs should be https://
- Update CORS_ORIGINS to https URLs

---

## **COST BREAKDOWN** (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| MongoDB Atlas | $0 | Free tier sufficient initially |
| Railway/Render | $7 | Cheapest hobby tier |
| Vercel | $0 | Free tier |
| Stripe | 2.9% + $0.30 | Per transaction (not per month) |
| Resend | $20 | If you go over 100 emails/day |
| Claude API | $0-30 | Pay per generation (~$0.001 each) |
| Domain | $10-15 | Annual |
| **TOTAL** | **$37-55/month** | **Scales with usage** |

At 100 Pro customers ($1,900/month revenue), costs are ~$150/month = 92% profit! 💰

---

## **SUCCESS METRICS**

Your app is ready when:
✅ Users can sign up
✅ Users can generate subject lines
✅ Users can upgrade and pay
✅ Stripe confirms payment
✅ Users get Pro access
✅ Database stores everything
✅ Emails are delivered
✅ No error logs in backend

---

## **SUPPORT & RESOURCES**

- **Python/FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **MongoDB:** https://docs.mongodb.com/
- **Stripe:** https://stripe.com/docs
- **Railway:** https://docs.railway.app/
- **Vercel:** https://vercel.com/docs

---

## **WHAT YOU HAVE**

✅ **Complete SAAS application**
✅ **All features:** Auth, payments, email, AI
✅ **Professional UI** (matching your Emergent design)
✅ **Production-ready code**
✅ **Scalable architecture**
✅ **Ready to make sales TODAY**

---

**You're all set! 🚀 Deploy now and start building your business!**
