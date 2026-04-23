from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Load environment variables
load_dotenv()

app = FastAPI()

# ================= CORS =================
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE CONNECTION =================
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

client = None
db = None

def connect_db():
    global client, db
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Ping database
        client.admin.command("ping")
        db = client[DB_NAME]
        print("✅ MongoDB Connected Successfully")
        return True
    except ConnectionFailure as e:
        print("❌ MongoDB Connection Failed:", str(e))
        return False

# Connect on startup
@app.on_event("startup")
def startup_db():
    connect_db()

# ================= ROUTES =================

# Root route
@app.get("/")
def read_root():
    return {"message": "EmailBoost Backend is Running 🚀"}

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Check ENV variables
@app.get("/config-check")
def config_check():
    return {
        "mongo_url": MONGO_URL,
        "db_name": DB_NAME,
        "razorpay_key": os.getenv("RAZORPAY_KEY_ID"),
    }

# 🔥 NEW: Check DB connection
@app.get("/db-check")
def db_check():
    try:
        client.admin.command("ping")
        return {"status": "MongoDB Connected ✅"}
    except Exception as e:
        return {"status": "MongoDB Not Connected ❌", "error": str(e)}

# 🔥 NEW: Test write to DB
@app.get("/test-db-write")
def test_db_write():
    try:
        collection = db["test_collection"]
        result = collection.insert_one({"message": "DB is working 🚀"})
        return {"status": "Write successful ✅", "id": str(result.inserted_id)}
    except Exception as e:
        return {"status": "Write failed ❌", "error": str(e)}

# ================= RUN SERVER =================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)