import os
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
import video
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = FastAPI(
    title="Smooth-Cruize Backend",
    version="0.1.0",
)


class UserAdminUpdate(BaseModel):
    is_admin: bool

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
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""),
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")
    }


def get_supabase_config():
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    )

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase backend configuration is missing.")

    return supabase_url, supabase_key


def supabase_request(path: str, method: str = "GET", body: dict | None = None, prefer: str | None = None):
    supabase_url, supabase_key = get_supabase_config()
    url = f"{supabase_url}/rest/v1/{path}"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }

    if prefer:
        headers["Prefer"] = prefer

    request_body = None if body is None else json.dumps(body).encode("utf-8")
    request = Request(url, headers=headers, data=request_body, method=method)

    try:
        with urlopen(request) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None
    except HTTPError as error:
        detail = error.read().decode("utf-8")
        raise HTTPException(status_code=error.code, detail=detail or "Supabase request failed.") from error
    except URLError as error:
        raise HTTPException(status_code=502, detail=f"Failed to reach Supabase: {error.reason}") from error


@app.get("/api/user-profiles")
def list_user_profiles():
    return supabase_request(
        "user_profiles?select=id,email,full_name,is_admin,created_at,updated_at&order=created_at.desc"
    )


@app.patch("/api/user-profiles/{user_id}")
def update_user_profile(user_id: str, payload: UserAdminUpdate):
    quoted_user_id = quote(user_id, safe="")
    return supabase_request(
        f"user_profiles?id=eq.{quoted_user_id}&select=id,email,full_name,is_admin,created_at,updated_at",
        method="PATCH",
        body={"is_admin": payload.is_admin},
        prefer="return=representation",
    )
