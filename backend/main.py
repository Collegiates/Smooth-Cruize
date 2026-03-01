import os
import video
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Smooth-Cruize Backend",
    version="0.1.0",
)

# Allow the Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Smooth-Cruize Backend"}

@app.get("/api/env")
def get_env_vars():
    # Provide the environment variables needed by the frontend Supabase integration
    return {
        "NEXT_PUBLIC_SUPABASE_URL": os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""),
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")
    }
