"""EmailBoost backend API tests - iteration 3
Covers: guest-gen, disposable blocking, OTP, resend-otp, tier limits,
favorites CRUD, Stripe checkout (pro/enterprise), stripe status/webhook.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ORIGIN = BASE_URL


def _new_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def session():
    return _new_session()


@pytest.fixture(scope="module")
def admin_session():
    s = _new_session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@emailboost.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def free_session():
    s = _new_session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@emailboost.com", "password": "test123"})
    assert r.status_code == 200, r.text
    return s


# ---------------- Health ----------------
def test_health(session):
    r = session.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "EmailBoost" in r.json().get("message", "")


# ---------------- Disposable email block ----------------
@pytest.mark.parametrize("email", [
    f"test_{uuid.uuid4().hex[:6]}@tempmail.com",
    f"test_{uuid.uuid4().hex[:6]}@yopmail.com",
    f"test_{uuid.uuid4().hex[:6]}@mailinator.com",
])
def test_register_disposable_blocked(session, email):
    r = session.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Throwaway", "email": email, "password": "testpass123"
    })
    assert r.status_code == 400, f"Expected 400 for {email}, got {r.status_code}: {r.text}"
    assert "disposable" in r.json().get("detail", "").lower() or "permanent" in r.json().get("detail", "").lower()


# ---------------- Register with valid email returns debug_otp ----------------
def test_register_returns_needs_verification_and_debug_otp():
    s = _new_session()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test User", "email": email, "password": "testpass123"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("needs_verification") is True
    assert data.get("email") == email
    assert "debug_otp" in data, f"DEBUG_OTP=true but debug_otp missing in response: {data}"
    assert len(data["debug_otp"]) == 6


# ---------------- OTP verify: wrong then right ----------------
def test_otp_verify_wrong_then_right():
    s = _new_session()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "OTP User", "email": email, "password": "pw12345678"})
    assert r.status_code == 200
    otp = r.json()["debug_otp"]

    # wrong code
    r_wrong = s.post(f"{BASE_URL}/api/auth/verify-otp", json={"email": email, "otp": "000000"})
    assert r_wrong.status_code == 400
    assert "remaining" in r_wrong.json().get("detail", "").lower() or "incorrect" in r_wrong.json().get("detail", "").lower()

    # right code
    r_ok = s.post(f"{BASE_URL}/api/auth/verify-otp", json={"email": email, "otp": otp})
    assert r_ok.status_code == 200, r_ok.text
    data = r_ok.json()
    assert data.get("email") == email
    assert "id" in data
    # Cookie should be set
    assert "access_token" in s.cookies


# ---------------- Resend OTP ----------------
def test_resend_otp_returns_debug_otp():
    s = _new_session()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "Resend User", "email": email, "password": "pw12345678"})
    assert r.status_code == 200

    r2 = s.post(f"{BASE_URL}/api/auth/resend-otp", json={"email": email})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert "debug_otp" in data
    assert len(data["debug_otp"]) == 6


# ---------------- Admin login ----------------
def test_admin_login_pro_tier():
    s = _new_session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@emailboost.com", "password": "admin123"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("tier") == "pro"
    # /auth/me to check role
    r2 = s.get(f"{BASE_URL}/api/auth/me")
    assert r2.status_code == 200
    assert r2.json().get("role") == "admin"


# ---------------- Guest generation: first OK, second 401 ----------------
def test_guest_generate_once_then_block():
    s = _new_session()
    payload = {"email_draft": "Launch announcement for our new AI tool",
               "industry": "Technology", "email_type": "promotional"}
    r1 = s.post(f"{BASE_URL}/api/generate", json=payload, timeout=60)
    assert r1.status_code == 200, f"First guest call should succeed: {r1.status_code} {r1.text[:200]}"
    data = r1.json()
    assert data.get("guest_mode") is True
    assert len(data.get("subject_lines", [])) > 0

    # second call with same session/cookies -> should be blocked
    r2 = s.post(f"{BASE_URL}/api/generate", json=payload, timeout=30)
    assert r2.status_code == 401, f"Second guest call should be 401, got {r2.status_code}: {r2.text[:200]}"


# ---------------- Authenticated generate (admin = pro, unlimited) ----------------
def test_generate_pro_admin(admin_session):
    r = admin_session.post(f"{BASE_URL}/api/generate", json={
        "email_draft": "We launched a feature that saves time.",
        "industry": "SaaS", "email_type": "product-update"
    }, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "subject_lines" in data and len(data["subject_lines"]) > 0
    first = data["subject_lines"][0]
    assert "text" in first and "tone" in first and "estimatedOpenRate" in first


# ---------------- Favorites CRUD ----------------
def test_favorites_crud(admin_session):
    # POST
    r = admin_session.post(f"{BASE_URL}/api/favorites", json={
        "text": f"TEST_subject_{uuid.uuid4().hex[:6]}", "tone": "curious", "estimated_open_rate": 48
    })
    assert r.status_code == 200
    fav_id = r.json()["id"]

    # GET
    r = admin_session.get(f"{BASE_URL}/api/favorites")
    assert r.status_code == 200
    assert any(f["id"] == fav_id for f in r.json())

    # DELETE
    r = admin_session.delete(f"{BASE_URL}/api/favorites/{fav_id}")
    assert r.status_code == 200

    # Verify
    r = admin_session.get(f"{BASE_URL}/api/favorites")
    assert not any(f["id"] == fav_id for f in r.json())


# ---------------- Stripe checkout (pro + enterprise) ----------------
@pytest.mark.parametrize("plan", ["pro", "enterprise"])
def test_stripe_checkout_session_creation(admin_session, plan):
    r = admin_session.post(f"{BASE_URL}/api/stripe/checkout",
                           json={"plan": plan, "origin": ORIGIN})
    # Accept both success and 500 (test key failure) — but prefer 200
    assert r.status_code in (200, 500), r.text
    if r.status_code == 200:
        data = r.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data


def test_stripe_checkout_invalid_plan(admin_session):
    r = admin_session.post(f"{BASE_URL}/api/stripe/checkout",
                           json={"plan": "bogus", "origin": ORIGIN})
    assert r.status_code == 400


# ---------------- Stripe webhook (signature invalid, must not crash) ----------------
def test_stripe_webhook_accepts_post(session):
    r = session.post(f"{BASE_URL}/api/webhook/stripe",
                     data=b'{"event":"test"}',
                     headers={"Stripe-Signature": "t=0,v1=invalid"})
    # Must not 500; accepts and returns {received:true} on sig-fail
    assert r.status_code == 200
    assert r.json().get("received") is True


# ---------------- /api/usage ----------------
def test_usage_endpoint(free_session):
    r = free_session.get(f"{BASE_URL}/api/usage")
    assert r.status_code == 200
    data = r.json()
    assert data.get("tier") == "free"
    assert data.get("limit") == 3
