from dotenv import load_dotenv
load_dotenv()

import os, jwt, bcrypt, json, uuid, re, random, asyncio, logging, stripe as stripe_sdk
from datetime import datetime, timezone, timedelta
from typing import Optional, Annotated
from pathlib import Path

import resend
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, BeforeValidator
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from email_validator import validate_email, EmailNotValidError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Config ---
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret")
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Strict email allowlist (public consumer providers only)
ALLOWED_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com"}

# OTP config
OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 30
OTP_MAX_RESENDS = 3
OTP_RATE_LIMIT_PER_HOUR = 5
MAX_ACCOUNTS_PER_IP = 3
FREE_GENERATION_LIMIT = 3  # lifetime per verified email

resend.api_key = RESEND_API_KEY
stripe_sdk.api_key = STRIPE_API_KEY

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")
scheduler = AsyncIOScheduler()

CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]
PLAN_PRICES = {"pro": 19.00, "enterprise": 99.00}

# =========================================================
# DISPOSABLE EMAIL BLOCKLIST
# =========================================================
DISPOSABLE_DOMAINS = {
    "mailinator.com","tempmail.com","guerrillamail.com","throwaway.email",
    "yopmail.com","10minutemail.com","trashmail.com","temp-mail.org",
    "fakeinbox.com","mailnull.com","spamgourmet.com","getairmail.com",
    "maildrop.cc","sharklasers.com","guerrillamail.info","guerrillamail.biz",
    "guerrillamail.de","spam4.me","trashmail.me","dispostable.com",
    "mailnew.com","nwytg.net","mail7.io","emailondeck.com",
    "discard.email","throwam.com","mytemp.email","moakt.com",
    "mailtemp.info","tempinbox.com","temp.email","safetymail.info",
    "fakemailgenerator.com","trash-mail.com","tempr.email","0-mail.com",
    "10mail.org","10minutemail.net","10minutemail.org","20minutemail.com",
    "60minutemail.com","anonbox.net","anonymbox.com","antichef.com",
    "binkmail.com","bobmail.info","bugmenot.com","crapmail.org",
    "deadaddress.com","devnullmail.com","dfgh.net","digitalsanctuary.com",
    "disposableaddress.com","disposableemailaddresses.com","disposableinbox.com",
    "dodgeit.com","dumpandfuck.com","dumpmail.de","dumpyemail.com",
    "e4ward.com","emailage.cf","emailondeck.com","emailtemporanea.com",
    "emailthe.net","emailtmp.com","emkei.cz","fakeinbox.cf",
    "fakeinbox.ga","fakeinbox.info","fakeinbox.ml","fakeinbox.net",
    "fakemail.fr","filzmail.de","fleckens.hu","forgetmail.com",
    "garbagemail.org","get-mail.cf","get-mail.ga","get-mail.ml",
    "ghosttexter.de","grr.la","gustr.com","hailmail.net",
    "hatespam.org","herp.in","hidemail.de","hmamail.com",
    "iheartspam.org","inboxalias.com","incognitomail.com","incognitomail.net",
    "incognitomail.org","instant-mail.de","instantemailaddress.com",
    "internetemails.net","ipoo.org","irc.so","jnxjn.com",
    "junk.to","kasmail.com","killmail.com","killmail.net",
    "klassmaster.com","klassmaster.net","kurzepost.de","lortemail.dk",
    "losemymail.com","m21.cc","mail-filter.com","mail-temporaire.fr",
    "mail1a.de","mail2rss.org","mailbidon.com","mailcat.biz",
    "mailcatch.com","maildrop.cc","mailexpire.com","mailforspam.com",
    "mailguard.de","mailhazard.com","mailimate.com","mailinator.com",
    "mailinator2.com","mailismagic.com","mailmate.com","mailme.ir",
    "mailme.lv","mailme24.com","mailmetrash.com","mailmoat.com",
    "mailnew.com","mailpick.biz","mailquack.com","mailsac.com",
    "mailscrap.com","mailshell.com","mailsimp.com","mailtemp.eu",
    "mailtemp.info","mailtemp.net","mailtemp.org","mailtome.de",
    "mailtothis.com","mailtrash.net","mailway.com","mailzilla.com",
    "makemetheking.com","mbx.cc","mega.zik.dj","mintemail.com",
    "moemail.com","mohmal.com","moxkid.com","mt2009.com",
    "myopang.com","myphantomemail.com","mytemp.email","mytrashmail.com",
    "nada.email","nadas.lol","nermalmail.com","netmails.com",
    "neverbox.com","nextmail.ru","no-spam.ws","nomail.pw",
    "nomail2me.com","nonspam.eu","nonspammer.de","norseforce.com",
    "not2be.com","nwytg.net","oc-eu.com","oopi.org",
    "pepbot.com","pookmail.com","proxymail.eu","rcpt.at",
    "recode.me","rejectmail.com","rmqkr.net","rppkn.com",
    "s0ny.net","safe-mail.net","saynotospams.com","secretemail.de",
    "secure-mail.biz","sharklasers.com","sibmail.com","sloppymail.com",
    "smashmail.de","snakemail.com","sneakemail.com","snkmail.com",
    "sofimail.com","spam.la","spam.mn","spam.su","spam4.me",
    "spambox.info","spambox.us","spambog.com","spambog.de",
    "spamcannon.com","spamcero.com","spamcon.org","spamday.com",
    "spamex.com","spamfree.eu","spamfree24.de","spamgourmet.com",
    "spamgourmet.net","spamgourmet.org","spamhole.com","spamify.com",
    "spamkill.info","spaml.com","spaml.de","spammotel.com",
    "spamoff.de","spampass.com","spamspot.com","spamstack.net",
    "spamtroll.net","spamwc.de","stuff-email.com","stuffmail.de",
    "sweetxxx.de","temp-mail.com","temp-mail.de","temp-mail.io",
    "temp-mail.ru","tempalias.com","tempe-mail.com","tempemail.biz",
    "tempemail.com","tempemail.net","tempinbox.co.uk","tempinbox.com",
    "tempomail.fr","temporaryemail.net","temporaryemail.us","tempsky.com",
    "tilen.com","tmail.io","toiea.com","trashdevil.com",
    "trashdevil.de","trashemail.de","trashmail.at","trashmail.com",
    "trashmail.de","trashmail.io","trashmail.me","trashmail.net",
    "trashmail.org","trashmailer.com","trashtigers.com","trbvm.com",
    "trickmail.net","turual.com","twinmail.de","uggsrock.com",
    "umail.net","unmail.ru","uroid.com","venompen.com",
    "vermutlich.net","viditag.com","vpn.st","walala.org",
    "walkmail.net","watchfull.net","webemail.me","webm4il.info",
    "webuser.in","wegwerfadresse.de","wegwerfemail.com","wegwerfemail.de",
    "wegwerfmail.de","wegwerfmail.net","yapped.net","yopmail.com",
    "yopmail.fr","yopmail.gq","you-spam.com","your-mail.com",
    "zehnmail.de","zoemail.net","zoemail.org","zomail.net",
}

def is_disposable_email(email: str) -> bool:
    domain = email.split("@")[-1].lower().strip()
    if domain in DISPOSABLE_DOMAINS:
        return True
    # Pattern-based check
    disposable_patterns = ["tempmail", "throwaway", "disposable", "trash", "fake", "spam", "guerrilla", "yopmail"]
    return any(p in domain for p in disposable_patterns)

def validate_email_strict(raw_email: str) -> str:
    """Validate email: RFC format + strict allowlist of providers. Returns normalized email."""
    try:
        result = validate_email(raw_email, check_deliverability=False)
        normalized = result.normalized.lower()
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Please enter a valid permanent email address.")
    domain = normalized.split("@")[-1]
    if is_disposable_email(normalized) or domain not in ALLOWED_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid permanent email address. Only Gmail, Yahoo, Outlook and Hotmail addresses are supported.",
        )
    return normalized

def get_client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"

async def _rate_limit_otp(email: str, ip: str):
    """Reject if either email or IP exceeded 5 OTP requests in the past hour."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    email_count = await db.otp_requests.count_documents({"key": f"email:{email}", "created_at": {"$gte": cutoff}})
    if email_count >= OTP_RATE_LIMIT_PER_HOUR:
        await _audit("otp_rate_limit_email", {"email": email, "ip": ip})
        raise HTTPException(status_code=429, detail="Too many verification attempts. Please wait an hour and try again.")
    ip_count = await db.otp_requests.count_documents({"key": f"ip:{ip}", "created_at": {"$gte": cutoff}})
    if ip_count >= OTP_RATE_LIMIT_PER_HOUR:
        await _audit("otp_rate_limit_ip", {"email": email, "ip": ip})
        raise HTTPException(status_code=429, detail="Too many verification attempts from your network. Please try again later.")

async def _log_otp_request(email: str, ip: str):
    now = datetime.now(timezone.utc).isoformat()
    await db.otp_requests.insert_many([
        {"key": f"email:{email}", "created_at": now},
        {"key": f"ip:{ip}", "created_at": now},
    ])

async def _audit(event: str, data: dict):
    try:
        await db.auth_audit_log.insert_one({
            "event": event, **data, "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Audit log failed: {e}")

# =========================================================
# AUTH HELPERS
# =========================================================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

def generate_otp() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            return None
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except Exception:
        return None

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# =========================================================
# EMAIL TEMPLATES & SENDING
# =========================================================
def _otp_html(name: str, otp: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
      <tr><td style="background:#2563EB;padding:28px 40px;text-align:center;">
        <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">EmailBoost</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#0A0A0A;font-size:22px;margin:0 0 12px 0;">Verify your email address</h2>
        <p style="color:#525252;font-size:15px;margin:0 0 24px 0;">Hi {name}, enter this code to verify your EmailBoost account:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:24px;">
            <span style="font-size:40px;font-weight:900;color:#2563EB;letter-spacing:10px;">{otp}</span>
          </td></tr>
        </table>
        <p style="color:#525252;font-size:13px;margin:20px 0 0 0;text-align:center;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 EmailBoost. If you didn't request this, ignore this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

def _welcome_html(name: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
      <tr><td style="background:#2563EB;padding:28px 40px;text-align:center;">
        <span style="font-size:24px;font-weight:900;color:#ffffff;">EmailBoost</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#0A0A0A;font-size:22px;margin:0 0 16px 0;">Welcome to EmailBoost, {name}!</h2>
        <p style="color:#525252;font-size:15px;margin:0 0 16px 0;">Your account is verified. Start generating AI-powered subject lines that <strong>actually work</strong>.</p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="padding:4px 0;"><span style="color:#2563EB;font-weight:bold;">✓</span>&nbsp;<span style="color:#525252;font-size:14px;">3 free generations per month</span></td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><span style="color:#2563EB;font-weight:bold;">✓</span>&nbsp;<span style="color:#525252;font-size:14px;">20 AI-crafted subject lines per run</span></td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><span style="color:#2563EB;font-weight:bold;">✓</span>&nbsp;<span style="color:#525252;font-size:14px;">Predicted open rates for each option</span></td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0"><tr><td style="background:#2563EB;border-radius:10px;padding:14px 28px;">
          <a href="https://ai-subject-optimizer.preview.emergentagent.com/#demo" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">Generate Your First Subject Lines →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 EmailBoost · <a href="#" style="color:#94a3b8;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

def _weekly_digest_html(name: str, tips: list) -> str:
    tips_html = "".join([f'<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><span style="color:#FF6B35;font-weight:bold;">{i+1}.</span>&nbsp;<span style="color:#374151;font-size:14px;">{tip}</span></td></tr>' for i, tip in enumerate(tips)])
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
      <tr><td style="background:#2563EB;padding:28px 40px;text-align:center;">
        <span style="font-size:24px;font-weight:900;color:#ffffff;">EmailBoost</span>
        <p style="color:#93c5fd;font-size:13px;margin:6px 0 0 0;">Weekly Email Marketing Digest</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#0A0A0A;font-size:20px;margin:0 0 8px 0;">This Week's Top Email Tips, {name}</h2>
        <p style="color:#525252;font-size:14px;margin:0 0 24px 0;">Boost your open rates with these proven strategies:</p>
        <table width="100%" cellpadding="0" cellspacing="0">{tips_html}</table>
        <div style="background:#EFF6FF;border-radius:12px;padding:20px;margin-top:28px;text-align:center;">
          <p style="color:#2563EB;font-size:14px;font-weight:bold;margin:0 0 12px 0;">Ready to put these tips to work?</p>
          <a href="https://ai-subject-optimizer.preview.emergentagent.com/#demo" style="background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px;">Generate Subject Lines Now</a>
        </div>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 EmailBoost · <a href="#" style="color:#94a3b8;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

WEEKLY_TIPS = [
    "Personalized subject lines increase open rates by 26%",
    "Subject lines with numbers (e.g. '5 ways...') boost opens by 57%",
    "The best send times are Tuesday–Thursday, 8-10am or 2-4pm",
    "Subject lines under 50 characters perform 12% better on mobile",
    "Question-based subject lines see 10% higher open rates on average",
    "Creating urgency ('Last 24 hours') boosts opens by 22%",
    "Emojis can increase open rates by 56% when used strategically",
    "A/B test your subject lines — even a 5% improvement compounds fast",
    "Avoid spam trigger words like 'FREE' in all caps or 'Act now!'",
    "Preview text is your second subject line — always optimize it",
]

async def _send_email(to: str, subject: str, html: str):
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {result}")
        return result
    except Exception as e:
        logger.error(f"Email send failed to {to}: {e}")

async def send_otp_email(email: str, name: str, otp: str):
    await _send_email(email, "Your EmailBoost verification code", _otp_html(name, otp))

async def send_welcome_email(email: str, name: str):
    await _send_email(email, "Welcome to EmailBoost! You're all set.", _welcome_html(name))

async def send_weekly_digest_to_all():
    """Send weekly digest to all verified Pro users"""
    try:
        pro_users = await db.users.find({"tier": "pro", "email_verified": True}).to_list(None)
        import random as rnd
        for user in pro_users:
            tips = rnd.sample(WEEKLY_TIPS, min(5, len(WEEKLY_TIPS)))
            await _send_email(user["email"], "Your Weekly EmailBoost Digest", _weekly_digest_html(user.get("name", "there"), tips))
            await asyncio.sleep(0.3)  # rate limit
        logger.info(f"Weekly digest sent to {len(pro_users)} users")
    except Exception as e:
        logger.error(f"Weekly digest error: {e}")

# =========================================================
# PYDANTIC MODELS
# =========================================================
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str

class GenerateRequest(BaseModel):
    email_draft: str
    industry: str
    email_type: str

class FavoriteRequest(BaseModel):
    text: str
    tone: str
    estimated_open_rate: int

class CheckoutRequest(BaseModel):
    plan: str
    origin: str

# =========================================================
# STARTUP
# =========================================================
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("created_ip")
    await db.favorites.create_index("user_id")
    await db.generations.create_index("user_id")
    try:
        await db.payment_transactions.create_index("session_id", unique=True)
    except Exception:
        pass

    # Pending registrations — TTL 15 min (OTP expiry is 5 min but give buffer)
    try:
        await db.pending_registrations.create_index("email", unique=True)
        await db.pending_registrations.create_index("expires_at", expireAfterSeconds=900)
    except Exception:
        pass
    # OTP requests — TTL 1 hour for rate limiting
    try:
        await db.otp_requests.create_index("key")
        await db.otp_requests.create_index("created_at", expireAfterSeconds=3600)
    except Exception:
        pass
    # Auth audit log — keep 30 days
    try:
        await db.auth_audit_log.create_index("created_at", expireAfterSeconds=2592000)
    except Exception:
        pass

    # Seed admin (bypass OTP — pre-verified)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@emailboost.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "tier": "pro",
            "role": "admin",
            "email_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "generations_total": 0,
            "created_ip": "seed",
        })
    else:
        if not existing.get("email_verified"):
            await db.users.update_one({"email": admin_email}, {"$set": {"email_verified": True}})

    # Backfill email_verified + generations_total for existing users
    await db.users.update_many({"email_verified": {"$exists": False}}, {"$set": {"email_verified": True}})
    await db.users.update_many(
        {"generations_total": {"$exists": False}},
        [{"$set": {"generations_total": {"$ifNull": ["$generations_this_month", 0]}}}],
    )

    # Schedule weekly digest (Monday 9am UTC)
    scheduler.add_job(send_weekly_digest_to_all, CronTrigger(day_of_week="mon", hour=9, minute=0), id="weekly_digest", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started - weekly digest scheduled for Monday 9am UTC")

# =========================================================
# AUTH ENDPOINTS
# =========================================================
@api_router.post("/auth/register")
async def register(body: RegisterRequest, request: Request):
    """Start registration: validate email, store OTP in pending_registrations. User is NOT created yet."""
    email = validate_email_strict(body.email)
    ip = get_client_ip(request)

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")

    # Already-registered check
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")

    # IP account cap
    ip_accounts = await db.users.count_documents({"created_ip": ip})
    if ip_accounts >= MAX_ACCOUNTS_PER_IP:
        await _audit("ip_account_cap", {"email": email, "ip": ip, "count": ip_accounts})
        raise HTTPException(status_code=429, detail="Too many accounts have been created from your network. Please contact support.")

    # Rate limit OTP requests
    await _rate_limit_otp(email, ip)

    # Generate OTP, store pending registration
    otp = generate_otp()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    await db.pending_registrations.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "name": body.name.strip(),
            "password_hash": hash_password(body.password),
            "otp_code": otp,
            "expires_at": expires,
            "attempts": 0,
            "resend_count": 0,
            "last_otp_sent_at": now.isoformat(),
            "ip": ip,
            "updated_at": now.isoformat(),
        }},
        upsert=True,
    )

    await _log_otp_request(email, ip)
    asyncio.create_task(send_otp_email(email, body.name.strip(), otp))
    logger.info(f"[AUTH] OTP generated for {email}")
    await _audit("register_otp_sent", {"email": email, "ip": ip})

    return {"needs_verification": True, "email": email, "message": "Verification code sent to your email."}

@api_router.post("/auth/login")
async def login(body: LoginRequest, response: Response, request: Request):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await _audit("login_failed", {"email": email, "ip": get_client_ip(request)})
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email to activate this account.")

    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    await _audit("login_success", {"email": email, "ip": get_client_ip(request)})
    return {
        "id": user_id, "email": user["email"], "name": user.get("name", ""),
        "tier": user.get("tier", "free"), "generations_total": user.get("generations_total", 0),
        "role": user.get("role", "user"), "email_verified": True,
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOTPRequest, response: Response, request: Request):
    """Verify OTP → create user account. No account exists before this succeeds."""
    email = body.email.lower().strip()
    otp_input = (body.otp or "").strip()

    # Strict input validation — reject empty / non-6-digit / hardcoded patterns
    if not otp_input or not otp_input.isdigit() or len(otp_input) != 6:
        raise HTTPException(status_code=400, detail="Please enter the full 6-digit code.")

    pending = await db.pending_registrations.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=404, detail="No pending registration found. Please start over.")

    # Check attempts
    if pending.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await db.pending_registrations.delete_one({"email": email})
        await _audit("otp_max_attempts", {"email": email, "ip": get_client_ip(request)})
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please start the signup over.")

    # Check expiry
    expires = pending["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    if not expires.tzinfo:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        await _audit("otp_expired", {"email": email})
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    # Increment attempt BEFORE comparing (so that wrong guesses are always counted)
    await db.pending_registrations.update_one({"email": email}, {"$inc": {"attempts": 1}})

    if pending.get("otp_code") != otp_input:
        remaining = max(0, OTP_MAX_ATTEMPTS - (pending.get("attempts", 0) + 1))
        await _audit("otp_wrong", {"email": email, "remaining": remaining})
        raise HTTPException(status_code=400, detail=f"Invalid OTP. Please try again. ({remaining} attempts left)")

    # Success — create user account now
    ip = get_client_ip(request)
    user_doc = {
        "email": email,
        "name": pending["name"],
        "password_hash": pending["password_hash"],
        "tier": "free",
        "role": "user",
        "email_verified": True,
        "generations_total": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_ip": ip,
    }
    try:
        result = await db.users.insert_one(user_doc)
    except Exception:
        # Edge case: duplicate race
        await db.pending_registrations.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    # Delete pending registration (auto-delete OTP)
    await db.pending_registrations.delete_one({"email": email})

    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")

    asyncio.create_task(send_welcome_email(email, pending["name"]))
    await _audit("user_created", {"email": email, "ip": ip})

    return {
        "id": user_id, "email": email, "name": pending["name"],
        "tier": "free", "generations_total": 0, "role": "user", "email_verified": True,
        "message": "Email verified successfully",
    }

@api_router.post("/auth/resend-otp")
async def resend_otp_endpoint(body: ResendOTPRequest, request: Request):
    email = body.email.lower().strip()
    ip = get_client_ip(request)

    pending = await db.pending_registrations.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=404, detail="No pending registration. Please sign up again.")

    # Cooldown check (30s)
    last_sent_str = pending.get("last_otp_sent_at")
    if last_sent_str:
        try:
            last_sent = datetime.fromisoformat(last_sent_str.replace("Z", "+00:00"))
            if not last_sent.tzinfo:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            elapsed = (datetime.now(timezone.utc) - last_sent).total_seconds()
            if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                raise HTTPException(status_code=429, detail=f"Please wait {int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)}s before requesting another code.")
        except HTTPException:
            raise
        except Exception:
            pass

    # Max resends (3 per pending registration)
    if pending.get("resend_count", 0) >= OTP_MAX_RESENDS:
        await _audit("otp_max_resends", {"email": email, "ip": ip})
        raise HTTPException(status_code=429, detail="Resend limit reached. Please restart signup.")

    # Rate limit per email / IP
    await _rate_limit_otp(email, ip)

    otp = generate_otp()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.pending_registrations.update_one(
        {"email": email},
        {"$set": {"otp_code": otp, "expires_at": expires, "attempts": 0, "last_otp_sent_at": now.isoformat()},
         "$inc": {"resend_count": 1}},
    )
    await _log_otp_request(email, ip)
    asyncio.create_task(send_otp_email(email, pending.get("name", "there"), otp))
    logger.info(f"[AUTH] OTP resent for {email}")
    await _audit("otp_resent", {"email": email, "ip": ip})

    return {"message": "New verification code sent."}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# =========================================================
# GENERATE
# =========================================================
@api_router.post("/generate")
async def generate(body: GenerateRequest, request: Request):
    user = await require_user(request)
    if not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before generating subject lines.")

    generations_remaining = None
    if user.get("tier", "free") == "free":
        used = int(user.get("generations_total", 0))
        if used >= FREE_GENERATION_LIMIT:
            raise HTTPException(status_code=402, detail="Free limit reached. Upgrade to Pro for unlimited generations.")
        generations_remaining = max(0, FREE_GENERATION_LIMIT - used - 1)

    industry = body.industry or "General"
    email_type = body.email_type or "Email"
    system_prompt = f"""You are an expert email marketing copywriter specializing in subject lines that drive high open rates.

Generate exactly 20 high-converting email subject lines for a {industry} {email_type} email.
Email content/topic: {body.email_draft}

Requirements:
- Each subject line must be 30-60 characters (mobile-friendly)
- Use psychological triggers: urgency, curiosity, benefit-driven, personalization
- Include emojis strategically (max 1 per line)
- Vary the tone: some urgent, some curious, some benefit-focused
- Make them feel authentic and not spammy

Return ONLY valid JSON, no other text:
{{
  "subjectLines": [
    {{"text": "subject line here", "tone": "Urgent", "estimatedOpenRate": 48}},
    {{"text": "another line", "tone": "Curious", "estimatedOpenRate": 52}}
  ]
}}

Sort by estimatedOpenRate descending. Return exactly 20 items."""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=system_prompt).with_model("anthropic", "claude-4-sonnet-20250514")
        response_text = await chat.send_message(UserMessage(text="Generate the 20 email subject lines now."))
        try:
            result = json.loads(response_text)
        except Exception:
            m = re.search(r'\{.*\}', response_text, re.DOTALL)
            result = json.loads(m.group()) if m else {}
        subject_lines = result.get("subjectLines", [])
        await db.generations.insert_one({"user_id": user["_id"], "email_draft": body.email_draft[:500], "industry": body.industry, "email_type": body.email_type, "results_count": len(subject_lines), "created_at": datetime.now(timezone.utc).isoformat()})
        if user.get("tier", "free") == "free":
            await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"generations_total": 1}})
        return {"subject_lines": subject_lines, "generations_remaining": generations_remaining if user.get("tier") == "free" else None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# =========================================================
# USAGE
# =========================================================
@api_router.get("/usage")
async def get_usage(request: Request):
    user = await require_user(request)
    tier = user.get("tier", "free")
    used = int(user.get("generations_total", 0))
    return {
        "tier": tier,
        "generations_total": used,
        "limit": FREE_GENERATION_LIMIT if tier == "free" else None,
        "remaining": max(0, FREE_GENERATION_LIMIT - used) if tier == "free" else None,
    }

# =========================================================
# FAVORITES
# =========================================================
@api_router.get("/favorites")
async def get_favorites(request: Request):
    user = await require_user(request)
    docs = await db.favorites.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(None)
    return [{"id": str(d["_id"]), "text": d["text"], "tone": d.get("tone", ""), "estimated_open_rate": d.get("estimated_open_rate", 0), "created_at": d.get("created_at", "")} for d in docs]

@api_router.post("/favorites")
async def add_favorite(body: FavoriteRequest, request: Request):
    user = await require_user(request)
    existing = await db.favorites.find_one({"user_id": user["_id"], "text": body.text})
    if existing:
        return {"id": str(existing["_id"]), "message": "Already saved"}
    result = await db.favorites.insert_one({"user_id": user["_id"], "text": body.text, "tone": body.tone, "estimated_open_rate": body.estimated_open_rate, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"id": str(result.inserted_id), "message": "Saved"}

@api_router.delete("/favorites/{fav_id}")
async def delete_favorite(fav_id: str, request: Request):
    user = await require_user(request)
    result = await db.favorites.delete_one({"_id": ObjectId(fav_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Deleted"}

# =========================================================
# STRIPE
# =========================================================
@api_router.post("/stripe/checkout")
async def create_checkout(body: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    amount = PLAN_PRICES[body.plan]
    origin = body.origin.rstrip("/")
    host_url = str(request.base_url)
    checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
    session = await checkout.create_checkout_session(CheckoutSessionRequest(
        amount=float(amount), currency="usd",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/#pricing",
        metadata={"plan": body.plan, "user_id": user["_id"] if user else "", "user_email": user["email"] if user else ""}
    ))
    await db.payment_transactions.insert_one({"session_id": session.session_id, "user_id": user["_id"] if user else None, "user_email": user["email"] if user else "", "plan": body.plan, "amount": amount, "status": "pending", "payment_status": "unpaid", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/stripe/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    host_url = str(request.base_url)
    checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
    status = await checkout.get_checkout_status(session_id)
    existing = await db.payment_transactions.find_one({"session_id": session_id})
    if existing and existing.get("payment_status") != "paid" and status.payment_status == "paid":
        # Verify card is not prepaid / disposable before upgrading
        card_funding = await _get_card_funding(session_id)
        if card_funding == "prepaid":
            await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "blocked_prepaid", "payment_status": "refunded"}})
            await _refund_session(session_id)
            raise HTTPException(status_code=402, detail="Prepaid and disposable cards are not accepted. Your payment has been refunded.")
        user_id = existing.get("user_id")
        tier = "enterprise" if existing.get("plan") == "enterprise" else "pro"
        if user_id:
            await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"tier": tier}})
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "completed", "payment_status": "paid", "card_funding": card_funding}})
    return {"status": status.status, "payment_status": status.payment_status, "plan": existing.get("plan") if existing else None}

async def _get_card_funding(session_id: str) -> str:
    """Fetch card funding type from Stripe (credit/debit/prepaid/unknown). Returns 'unknown' on error."""
    try:
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.retrieve, session_id, expand=["payment_intent.payment_method"]
        )
        pm = session.get("payment_intent", {}).get("payment_method") if isinstance(session.get("payment_intent"), dict) else None
        if pm and isinstance(pm, dict):
            return (pm.get("card") or {}).get("funding", "unknown")
    except Exception as e:
        logger.error(f"Card funding check failed: {e}")
    return "unknown"

async def _refund_session(session_id: str):
    try:
        session = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, session_id)
        pi_id = session.get("payment_intent")
        if pi_id:
            await asyncio.to_thread(stripe_sdk.Refund.create, payment_intent=pi_id)
            logger.info(f"Refunded prepaid payment for session {session_id}")
    except Exception as e:
        logger.error(f"Refund failed for {session_id}: {e}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        host_url = str(request.base_url)
        checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
        event = await checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            metadata = event.metadata or {}
            # Block prepaid cards
            card_funding = await _get_card_funding(event.session_id)
            if card_funding == "prepaid":
                await _refund_session(event.session_id)
                await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"status": "blocked_prepaid", "payment_status": "refunded", "card_funding": card_funding}})
                logger.warning(f"Blocked prepaid card payment {event.session_id}")
                return {"received": True, "blocked": "prepaid"}
            user_id = metadata.get("user_id", "")
            tier = "enterprise" if metadata.get("plan") == "enterprise" else "pro"
            if user_id:
                await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"tier": tier}})
            await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"status": "completed", "payment_status": "paid", "card_funding": card_funding}})
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"received": True}

# =========================================================
# ADMIN
# =========================================================
@api_router.post("/admin/send-digest")
async def trigger_digest(request: Request):
    user = await require_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    asyncio.create_task(send_weekly_digest_to_all())
    return {"message": "Weekly digest sending initiated"}

@api_router.get("/")
async def root():
    return {"message": "EmailBoost API running"}

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown(wait=False)
    client.close()
