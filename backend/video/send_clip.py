from fastapi import APIRouter, UploadFile, File, Form
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai
import os
import uuid
import tempfile
import json
import time
from datetime import datetime
from video.gps_data import GPSData

# Initialize mock GPS Data
location = GPSData()

# Load API keys from .env
load_dotenv()

router = APIRouter()

# Initialize Supabase
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Gemini will be initialized locally per request using genai.Client()

@router.post("/api/upload-clip")
async def upload_pothole_clip(
    video: UploadFile = File(...),
    latitude: float = location.getLatitude(),
    longitude: float = location.getLongitude(),
    vehicle_id: str = supabase.table("survey_vehicles").select("id").execute().data[0]["id"] # The UUID from your survey_vehicles table
):
    try:
        # 1. Read the uploaded video file
        file_bytes = await video.read()
        file_ext = video.filename.split(".")[-1]
        unique_filename = f"pothole_{uuid.uuid4()}.{file_ext}"

        # 2. Upload to Supabase Storage Bucket
        # We upload it to a bucket named 'pothole-clips'
        upload_res = supabase.storage.from_("pothole-clips").upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": video.content_type}
        )
        
        # Get the public URL for the database
        video_url = supabase.storage.from_("pothole-clips").get_public_url(unique_filename)

        # 3. Save video to a temp file and send to Gemini API
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_ext}") as temp_video_file:
            temp_video_file.write(file_bytes)
            temp_video_path = temp_video_file.name

        severity_score = None
        description = "AI Analysis Pending/Failed"

        try:
            try:
                # Initialize new API client
                client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
                
                # Upload the video file to Gemini
                gemini_video = client.files.upload(file=temp_video_path)
                
                # Wait for Gemini to finish processing the video
                while gemini_video.state.name == "PROCESSING":
                    time.sleep(2)
                    gemini_video = client.files.get(name=gemini_video.name)

                if gemini_video.state.name == "FAILED":
                    raise Exception("Video processing failed in Gemini.")

                # Create a prompt that includes the lat/long from parameters
                prompt = f"""
                Analyze this video of a pothole event. 
                The pothole was recorded at latitude: {latitude}, longitude: {longitude}.
                Please provide a JSON response containing two keys:
                - "severity": an integer between 1 and 10 indicating the severity of the pothole (10 being worst).
                - "description": a text description of the pothole, any visible context, and analysis based on the location.
                """

                # Generate content using the new client format
                from google.genai import types
                response = client.models.generate_content(
                    model='gemini-2.5-pro',
                    contents=[gemini_video, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )

                response_data = json.loads(response.text)
                severity_score = response_data.get("severity", 5)
                description = response_data.get("description", "Pothole detected")
                
                # Optional: Delete gemini file to clean up space
                client.files.delete(name=gemini_video.name)
                
            finally:
                # Clean up the local temp video file
                if os.path.exists(temp_video_path):
                    os.remove(temp_video_path)
        except Exception as gemini_err:
            print(f"Gemini Processing Error: {gemini_err}")
            description = f"AI Analysis Failed: {str(gemini_err)}"

        # 4. Insert into pothole_events table
        event_data = {
            "latitude": latitude,
            "longitude": longitude,
            "severity": severity_score,
            "status": "Open",
            "ai_description": description
        }
        event_response = supabase.table("pothole_events").insert(event_data).execute()
        new_event_id = event_response.data[0]["id"]

        # 5. Insert into clips table
        clip_data = {
            "event_id": new_event_id,
            "video_url": video_url,
            "vehicle_id": vehicle_id,
            "captured_at": datetime.utcnow().isoformat()
        }
        supabase.table("clips").insert(clip_data).execute()

        return {"status": "success", "event_id": new_event_id, "message": "Pothole logged."}

    except Exception as e:
        return {"status": "error", "message": str(e)}