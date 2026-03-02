# Project Overview: Smooth Cruize

***Smooth Cruize*** is a web application that uses YOLO to detect potholes in videos, plot the pothole on a map, and give an analysis of the pothole in a structured format. 
- The **backend** is built with FastAPI, Supabase, and Gemini AI to give an analysis of a given pothole. 
- The **frontend** is built with Next.js and Supabase. 
- The **video processing** is done with YOLO and is tied to the backend.

**Note:** The backend is currently set up to use mock GPS data. 



# Smooth Cruize Setup

This project is split into:

- `backend/`: FastAPI service
- `videoprocessing/`: Video processing, Tied to the backend
- `frontend/`: Next.js app

## Backend Setup

From the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

The backend runs on `http://127.0.0.1:8000` by default.

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

Run the frontend in development:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Recommended Startup Order

1. Start the backend first.
2. Start the frontend second.
3. Open `http://localhost:3000`.
4. (Optional) Add a .mp4 file to `videoprocessing/input_videos/` folder and run the video processing function in a separate terminal **(stick to videos under 30 seconds unless you like to wait)**:
```bash
cd videoprocessing
python process_input_folder.py
```

**Note:** You will need the correct environment variables set in your `.env` file for the program to work. We cannot provide these. 

*Ride Smooth*
