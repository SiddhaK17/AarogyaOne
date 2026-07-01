from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.connection import engine, Base

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AarogyaOne API",
    description="Backend services for the AarogyaOne Public Healthcare Intelligence Platform",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "message": "AarogyaOne API is operating normally."
    }
