# ✅ PRODUCTION DEPLOYMENT CHECKLIST

## **PRE-DEPLOYMENT**

### MongoDB Setup
- [ ] Create MongoDB Atlas account (atlas.mongodb.com)
- [ ] Create free cluster
- [ ] Create database user (username & password)
- [ ] Whitelist IP (0.0.0.0/0 or your IP)
- [ ] Get connection string
- [ ] Test connection from local machine
- [ ] Verify database created in MongoDB

### Stripe Setup
- [ ] Create Stripe account (stripe.com)
- [ ] Verify email
- [ ] Get Secret API Key (sk_...)
- [ ] Get Publishable Key (pk_...)
- [ ] Create webhook endpoint
- [ ] Get webhook secret (whsec_...)
- [ ] Test webhook with Stripe CLI

### Resend Setup
- [ ] Create Resend account (resend.com)
- [ ] Verify sender domain/email
- [ ] Get API key (re_...)
- [ ] Send test email
- [ ] Whitelist sending domain in email settings

### LLM Setup (Claude or Emergent)
- [ ] Create Claude API account (console.anthropic.com)
- [ ] Get API key (sk-ant-...)
- [ ] Test API call locally
- [ ] Verify billing method set up

### GitHub Setup
- [ ] Repository created
- [ ] Code pushed to GitHub
- [ ] .gitignore configured correctly
- [ ] No .env files in repo
- [ ] README updated

---

## **BACKEND DEPLOYMENT (Railway.app)**

- [ ] Railway account created (railway.app)
- [ ] GitHub connected to Railway
- [ ] New project created
- [ ] Root directory set to `backend`
- [ ] Environment variables added:
  - [ ] MONGO_URL
  - [ ] JWT_SECRET
  - [ ] STRIPE_API_KEY
  - [ ] STRIPE_WEBHOOK_SECRET
  - [ ] RESEND_API_KEY
  - [ ] SENDER_EMAIL
  - [ ] EMERGENT_LLM_KEY or CLAUDE_API_KEY
  - [ ] CORS_ORIGINS
  - [ ] DB_NAME
- [ ] Build process started
- [ ] Deployment successful (no errors)
- [ ] Backend URL obtained
- [ ] Health check: `curl https://your-backend-url/health`
- [ ] Logs show "Application startup complete"

### Backend Verification
- [ ] Can POST to /api/auth/signup
- [ ] Can POST to /api/auth/otp
- [ ] Can generate subject lines
- [ ] Can process Stripe webhook
- [ ] Can send emails via Resend
- [ ] No 500 errors in logs

---

## **FRONTEND DEPLOYMENT (Vercel)**

- [ ] Vercel account created (vercel.com)
- [ ] GitHub connected to Vercel
- [ ] New project created
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Install command: `npm install`
- [ ] Environment variables added:
  - [ ] REACT_APP_API_URL (your backend URL)
  - [ ] REACT_APP_STRIPE_PUBLISHABLE_KEY
- [ ] Deployment successful
- [ ] Frontend URL obtained
- [ ] Frontend loads without errors
- [ ] No 404 errors for assets

### Frontend Verification
- [ ] Landing page loads
- [ ] All sections visible (Hero, Features, Pricing)
- [ ] Images load correctly
- [ ] Buttons clickable
- [ ] Modal opens on "Get Started"
- [ ] No console errors (F12)

---

## **INTEGRATION TESTING**

### Authentication Flow
- [ ] Can access landing page
- [ ] Can open signup modal
- [ ] Can enter email and get OTP
- [ ] OTP email received in inbox
- [ ] Can submit OTP
- [ ] Logged in successfully
- [ ] Redirected to dashboard
- [ ] JWT token in localStorage
- [ ] Can log out

### Subject Generator
- [ ] Can access generator in dashboard
- [ ] Can select industry
- [ ] Can select email type
- [ ] Can paste email draft
- [ ] Can click Generate
- [ ] Results load within 5 seconds
- [ ] 20 subject lines displayed
- [ ] Open rates show correctly
- [ ] Copy button works
- [ ] Can favorite (if implemented)

### Payment Flow
- [ ] Pro tier button visible in pricing
- [ ] Can click "Upgrade to Pro"
- [ ] Stripe modal appears
- [ ] Can enter test card: `4242 4242 4242 4242`
- [ ] Can enter any future date & CVC
- [ ] Payment processes successfully
- [ ] Redirected to success page
- [ ] Confirmation email received
- [ ] Dashboard shows Pro status
- [ ] Unlimited generations now available
- [ ] User record in MongoDB shows plan: "pro"

### Email Verification
- [ ] OTP emails received
- [ ] Welcome email received
- [ ] Payment confirmation email received
- [ ] Emails have correct sender (SENDER_EMAIL)
- [ ] Emails formatted correctly
- [ ] No spam folder (likely)

### Database Verification
- [ ] MongoDB Atlas dashboard shows data
- [ ] Users collection has records
- [ ] Generations collection has records
- [ ] Payments collection has records
- [ ] User data structure correct

---

## **SECURITY CHECKLIST**

- [ ] All connections use HTTPS
- [ ] .env not in GitHub repo
- [ ] JWT_SECRET is strong (min 32 chars, random)
- [ ] Stripe uses LIVE keys (not test keys)
- [ ] CORS_ORIGINS updated to production domain
- [ ] MongoDB whitelist configured (not 0.0.0.0 forever)
- [ ] Backend logs checked for errors
- [ ] No API keys in code comments
- [ ] No API keys in error messages
- [ ] Webhook secret verified with Stripe
- [ ] Rate limiting enabled
- [ ] Disposable email check working

---

## **PERFORMANCE CHECKLIST**

- [ ] Homepage loads in <3 seconds
- [ ] Subject generation completes in <5 seconds
- [ ] Database queries are indexed
- [ ] No N+1 queries
- [ ] Frontend bundle size < 500KB
- [ ] Images optimized
- [ ] No memory leaks in backend logs
- [ ] CPU usage normal (~10-20%)

---

## **MONITORING SETUP**

- [ ] Check Railway/Render logs daily
- [ ] Monitor Stripe payment success rate
- [ ] Monitor email delivery rate (Resend)
- [ ] Monitor API response times
- [ ] Monitor error rates in logs
- [ ] Check MongoDB storage usage
- [ ] Monitor JWT secret rotation schedule
- [ ] Setup alerts for failures (optional)

---

## **TROUBLESHOOTING**

### "Backend 500 Error"
```
✓ Check backend logs in Railway/Render
✓ Verify all environment variables are set
✓ Check MONGO_URL is correct
✓ Check API keys are valid
✓ Verify database is accessible
✓ Check for recent code changes
```

### "Can't connect to backend from frontend"
```
✓ Verify REACT_APP_API_URL is correct
✓ Check backend CORS_ORIGINS includes frontend URL
✓ Check backend is running (health check)
✓ Check network tab for 403 errors
✓ Verify HTTPS/HTTP protocol matches
```

### "Payment fails silently"
```
✓ Check Stripe API key is LIVE (not test)
✓ Verify webhook secret is correct
✓ Check webhook is configured in Stripe
✓ Verify webhook endpoint URL matches
✓ Check Stripe logs for webhook delivery failures
✓ Test with Stripe test card in test mode first
```

### "OTP email not arriving"
```
✓ Verify RESEND_API_KEY is correct
✓ Check SENDER_EMAIL is verified in Resend
✓ Check email isn't in spam folder
✓ Verify Resend account is active
✓ Check Resend logs for delivery failures
```

### "MongoDB connection timeout"
```
✓ Verify MONGO_URL format is correct
✓ Check IP whitelist in MongoDB Atlas
✓ Verify network connection from Railway
✓ Try from local machine first
✓ Check MongoDB cluster is running
```

### "Users can't log in"
```
✓ Check JWT_SECRET matches between sessions
✓ Verify token not expired
✓ Check localStorage for JWT token
✓ Verify user exists in database
✓ Check password hash is correct
```

---

## **POST-LAUNCH TASKS**

### Week 1
- [ ] Monitor error logs daily
- [ ] Check payment success rate (>95%)
- [ ] Monitor user feedback
- [ ] Fix any bugs found
- [ ] Monitor API performance
- [ ] Check email delivery

### Week 2-4
- [ ] Analyze user behavior
- [ ] Improve based on feedback
- [ ] Add any quick features
- [ ] Update documentation
- [ ] Plan marketing campaigns
- [ ] Monitor costs

### Month 2+
- [ ] Add new features based on usage
- [ ] Optimize performance
- [ ] Plan pricing changes
- [ ] Expand to new markets
- [ ] Build partnerships
- [ ] Grow user base

---

## **COST MONITORING**

| Service | Cost | Trigger |
|---------|------|---------|
| MongoDB | Free | <10GB data |
| Railway | $7/mo | Fixed |
| Vercel | Free | <100GB bandwidth |
| Stripe | 2.9%+$0.30 | Per transaction |
| Resend | $20/mo | >100 emails/day |
| Claude API | $0-50 | Per 1M tokens |

**Monitor monthly:**
- [ ] Railway usage & costs
- [ ] Stripe transaction volume
- [ ] Resend email count
- [ ] Claude API token usage
- [ ] Bandwidth usage
- [ ] Database size

---

## **SUCCESS INDICATORS**

You're LIVE and successful when:
✅ Users can sign up
✅ Payment processing works
✅ No error logs
✅ Response times <2 seconds
✅ Email delivery >99%
✅ Users convert from Free to Pro (5-10%)
✅ Revenue coming in
✅ Zero downtime

---

## **CELEBRATION MOMENT**

When you see:
- First user signup ✅
- First payment successful ✅
- First revenue in Stripe dashboard ✅

**You've officially launched a profitable SAAS!** 🎉

---

Keep this checklist handy for ongoing reference!
