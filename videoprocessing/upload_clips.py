# NOTE: This file is not used in the current version of the project.

import os
import requests
from pathlib import Path
import argparse

# Default API endpoint
API_URL = "http://localhost:8000/api/upload-clip"

def upload_clips(output_dir: str, api_url: str):
    """
    Iterates through video files in the given directory and POSTs them to the API.
    """
    output_path = Path(output_dir)
    if not output_path.exists() or not output_path.is_dir():
        print(f"Error: Directory '{output_dir}' does not exist.")
        return

    # Assuming clips are .mp4 files. Adjust if process_input_folder.py outputs other extensions.
    video_files = list(output_path.glob("*.mp4"))
    
    if not video_files:
        print(f"No video clips found in '{output_dir}'.")
        return

    print(f"Found {len(video_files)} clips in '{output_dir}'. Starting upload...")
    
    success_count = 0
    fail_count = 0

    for video_file in video_files:
        print(f"Uploading {video_file.name}...")
        
        try:
            with open(video_file, "rb") as f:
                # The backend currently expects 'video' as the file field
                files = {"video": (video_file.name, f, "video/mp4")}
                
                # We do not send latitude, longitude, and vehicle_id as form data 
                # because send-clip.py now defaults these values independently via 
                # GPSData() and a direct Supabase query.
                
                response = requests.post(api_url, files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        print(f"  -> Success! Event ID: {data.get('event_id')}")
                        success_count += 1
                    else:
                        print(f"  -> Failed: {data.get('message')}")
                        fail_count += 1
                else:
                    print(f"  -> Server returned status code {response.status_code}: {response.text}")
                    fail_count += 1
                    
        except Exception as e:
            print(f"  -> Error occurred while uploading: {e}")
            fail_count += 1

    print(f"\nUpload complete. {success_count} succeeded, {fail_count} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload generated video clips to the backend API.")
    parser.add_argument(
        "--output-dir", 
        type=str, 
        default="output_clips", 
        help="Folder containing the clips to upload (default: output_clips)."
    )
    parser.add_argument(
        "--api-url", 
        type=str, 
        default=API_URL, 
        help=f"The backend API endpoint (default: {API_URL})."
    )
    
    args = parser.parse_args()
    
    upload_clips(args.output_dir, args.api_url)
