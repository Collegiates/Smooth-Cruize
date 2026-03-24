# Backend Service Information

The Smooth-Cruize backend is built using **FastAPI**. It serves as an intermediary to securely interact with the Supabase database, handle complex AI processing with Google Gemini, and provide environment configuration to the Next.js frontend.

## API Routes Overview

### 1. Root & Configuration
* **`GET /`**
  * **Purpose:** A simple health-check route verifying that the FastAPI server is running.
  * **Response:** `{"message": "Smooth-Cruize Backend"}`

* **`GET /api/env`**
  * **Purpose:** Exposes specific public environment variables. Because the Next.js Edge runtime or browser client occasionally needs these variables dynamically, this endpoint serves them securely.
  * **Response:** Contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### 2. User Administration (Proxies to Supabase)
These endpoints interact directly with the Supabase REST API via a secure backend request, bypassing the need for client-side service-role keys.
* **`GET /api/user-profiles`**
  * **Purpose:** Fetches all user profiles registered in the system.
  * **Returns:** A list of profiles containing `id`, `email`, `full_name`, `is_admin`, and timestamps, ordered by the newest first.

* **`PATCH /api/user-profiles/{user_id}`**
  * **Purpose:** Updates a specific user's administrative privileges. 
  * **Payload:** Requires a JSON body: `{"is_admin": true/false}`.
  * **Returns:** The updated user profile representation.

### 3. Video Processing & AI Pipeline
* **`POST /api/upload-clip`** (Located in `video/send_clip.py`)
  * **Purpose:** The core ingestion endpoint for the YOLO video processing scripts and edge devices. It receives a detected pothole video clip, analyzes it via AI, and stores the event.
  * **Parameters:**
    * `video`: The `.mp4` file as Multipart Form Data.
    * `latitude`: (Optional) Float representing the GPS location.
    * `longitude`: (Optional) Float representing the GPS location.
    * `vehicle_id`: (Optional) The UUID of the edge device / survey vehicle sending the clip. If empty, the backend defaults to fetching a fallback ID from the database.
  * **Workflow:**
    1. Uploads the raw `.mp4` video to the `pothole-clips` Supabase bucket.
    2. Uploads a temporary copy of the video to the **Google Gemini 2.5 Flash** API alongside a prompt detailing the GPS coordinates.
    3. Gemini analyzes the footage and responds with a JSON object containing a `severity` score (1-10) and an AI `description` of the pothole.
    4. Logs a new open ticket in the `pothole_events` database table using the AI severity score and coordinates.
    5. Associates the video clip URL to the event in the `clips` database table.
  * **Returns:** `{"status": "success", "event_id": <uuid>, "message": "Pothole logged."}` on success.
