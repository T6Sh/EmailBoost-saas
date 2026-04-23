from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def read_root():
    return {"message": "EmailBoost Backend is Running 🚀"}

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Example protected config check
@app.get("/config-check")
def config_check():
    return {
        "mongo_url": os.getenv("MONGO_URL"),
        "db_name": os.getenv("DB_NAME"),
        "razorpay_key": os.getenv("RAZORPAY_KEY_ID"),
    }

# Run server
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)