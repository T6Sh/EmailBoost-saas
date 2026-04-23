# Add this to backend/server.py (replace Stripe imports and add Razorpay)

import razorpay  # Add this import at the top with other imports

# Replace the Stripe setup section with:
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")  # Your Razorpay Key ID
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")  # Your Razorpay Key Secret

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Update PLAN_PRICES (keep same as Stripe)
PLAN_PRICES = {
    "pro": 1999,  # ₹1,999 per month (in paise: multiply by 100)
    "enterprise": 9999  # ₹9,999 per month (in paise: multiply by 100)
}

# ====== REPLACE STRIPE ROUTES WITH RAZORPAY ROUTES ======

# Create Razorpay Order
@api_router.post("/razorpay/create-order")
async def create_razorpay_order(request: Request):
    """Create a Razorpay order for payment"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        body = await request.json()
        plan = body.get("plan")  # "pro" or "enterprise"
        
        if plan not in PLAN_PRICES:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        # Get user details
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        amount = PLAN_PRICES[plan]  # Amount in paise
        
        # Create Razorpay order
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_{user_id}_{datetime.now().timestamp()}",
            "payment_capture": 1,  # Auto capture payment
            "notes": {
                "user_id": str(user_id),
                "plan": plan,
                "email": user.get("email")
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save order to database
        await db.orders.insert_one({
            "_id": razorpay_order["id"],
            "user_id": ObjectId(user_id),
            "plan": plan,
            "amount": amount,
            "status": "created",
            "created_at": datetime.now(timezone.utc),
            "razorpay_order_id": razorpay_order["id"]
        })
        
        return {
            "order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID
        }
    
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create order")


# Verify Razorpay Payment
@api_router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(request: Request):
    """Verify and process Razorpay payment"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        body = await request.json()
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_order_id = body.get("razorpay_order_id")
        razorpay_signature = body.get("razorpay_signature")
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            raise HTTPException(status_code=400, detail="Missing payment details")
        
        # Verify signature
        data = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get order from DB
        order = await db.orders.find_one({"_id": razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify user
        if str(order["user_id"]) != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Get payment details from Razorpay
        payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
        
        if payment_details["status"] != "captured":
            raise HTTPException(status_code=400, detail="Payment not captured")
        
        plan = order["plan"]
        
        # Update user subscription
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "tier": plan,
                    "subscription_status": "active",
                    "subscription_plan": plan,
                    "subscription_start": datetime.now(timezone.utc),
                    "subscription_end": datetime.now(timezone.utc) + timedelta(days=30),
                    "generation_limit": 999999 if plan == "pro" else 999999,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Update order status
        await db.orders.update_one(
            {"_id": razorpay_order_id},
            {
                "$set": {
                    "status": "completed",
                    "razorpay_payment_id": razorpay_payment_id,
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Save payment record
        await db.payments.insert_one({
            "user_id": ObjectId(user_id),
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "plan": plan,
            "amount": order["amount"],
            "currency": "INR",
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        })
        
        # Send confirmation email
        try:
            resend.emails.send({
                "from": SENDER_EMAIL,
                "to": (await db.users.find_one({"_id": ObjectId(user_id)}))["email"],
                "subject": f"Welcome to EmailBoost {plan.upper()}! 🎉",
                "html": f"""
                    <h2>Payment Successful!</h2>
                    <p>Your {plan.upper()} plan is now active.</p>
                    <p>You can now generate unlimited subject lines.</p>
                    <p>Start using EmailBoost: <a href="{os.environ.get('FRONTEND_URL')}/dashboard">Go to Dashboard</a></p>
                """
            })
        except Exception as e:
            logger.error(f"Email send failed: {str(e)}")
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "plan": plan,
            "redirect_url": f"{os.environ.get('FRONTEND_URL')}/payment/success"
        }
    
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Webhook for Razorpay (optional but recommended)
@app.post("/api/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events"""
    try:
        body = await request.json()
        event = body.get("event")
        payload = body.get("payload", {}).get("payment", {})
        
        if event == "payment.authorized":
            logger.info(f"Payment authorized: {payload.get('id')}")
            # Handle authorized payment
        
        elif event == "payment.failed":
            logger.warning(f"Payment failed: {payload.get('id')}")
            # Handle failed payment
        
        return {"status": "ok"}
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"error": str(e)}, 500
