# Smooth-Cruize Pipeline Architecture

This document outlines the data pipeline from the initial YOLO pothole detection model to the backend processing, and finally to the frontend display. Focus is placed on the progression from YOLO model output into the backend AI processing and database storage.

## 1. Video Processing (YOLO Model)
The pipeline begins by scanning raw footage for potholes using a pre-trained YOLO object detection model.
* **Detection:** The processing script reads local video files (or a live stream) frame-by-frame, applying the YOLO model to identify potholes with a specified confidence threshold.
* **Clip Generation:** When a pothole is detected, the script extracts a relevant context window (e.g., 3.5 seconds before and after the detection) and saves it as a concise `.mp4` clip.
* **Transmission:** The generated video clip is immediately sent to the backend via a `POST` request to the `/api/upload-clip` endpoint.

## 2. Backend API & AI Processing
The backend, built with FastAPI, acts as the central hub for storing, analyzing, and logging the submitted pothole clips.
* **Receiving Data:** The `/api/upload-clip` endpoint receives the video clip along with mock GPS data (latitude and longitude) and a unique vehicle ID.
* **Cloud Storage:** The video file is uploaded to a **Supabase Storage Bucket** (`pothole-clips`). A public URL is then generated for future access.
* **AI Analysis (Gemini):** A temporary version of the video clip is saved and passed to the **Google Gemini API** (`gemini-2.5-flash`). Gemini analyzes the clip alongside its GPS location to generate:
  * A **severity score** (1-10) indicating the danger level of the pothole.
  * A brief text **description** of the pothole and its situational context.
* **Database Logging:** 
  * A new event is logged in the `pothole_events` Supabase table, recording the location (latitude/longitude), AI severity score, status ("Open"), and AI description.
  * The video metadata is saved in the `clips` table, linking the newly created `event_id` to the video's public URL and a timestamp.

## 3. Frontend Application (Next.js)
The frontend application connects to the Supabase database to surface the processed data to end-users.
* **Data Retrieval:** Using the Supabase client (configured via environment variables provided by the backend API at `/api/env`), the Next.js app fetches the `pothole_events` and their associated `clips`.
* **User Interface:** Users (such as city administrators or road analysts) can view the registered potholes on an interactive map, watch the detected video clips, and review the Gemini AI-generated severity scores and descriptions for maintenance planning.
