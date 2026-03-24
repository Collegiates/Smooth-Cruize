#!/usr/bin/env python3
"""
Smooth-Cruize Live Inference:
Connects to a live video stream (RTSP/HTTP) or USB camera.
Continuously runs YOLO to detect potholes and maintains a rolling frame buffer.
When a pothole is detected, extracts a clip of pre and post frames,
saves it as an MP4, and uploads it to the backend.
"""

import argparse
import os
import threading
import time
import uuid
from collections import deque
from pathlib import Path
from typing import Optional

import cv2
import requests
from ultralytics import YOLO


def normalize_label(text: str) -> str:
    return "".join(ch for ch in text.lower().strip() if ch.isalnum())


def has_pothole_detection(result, pothole_class: Optional[str]) -> bool:
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return False

    if not pothole_class:
        return True

    names = result.names if hasattr(result, "names") else {}
    target = normalize_label(pothole_class)
    if not target:
        return True

    for cls_id in boxes.cls.tolist():
        cls_idx = int(cls_id)
        if isinstance(names, dict):
            class_name = str(names.get(cls_idx, ""))
        elif isinstance(names, (list, tuple)) and 0 <= cls_idx < len(names):
            class_name = str(names[cls_idx])
        else:
            class_name = ""

        label = normalize_label(class_name)
        if label == target or target in label or label in target:
            return True
    return False


def upload_clip_to_backend(clip_path: Path, api_url: str) -> bool:
    """Uploads the generated clip to the backend API."""
    try:
        with open(clip_path, "rb") as f:
            files = {"video": (clip_path.name, f, "video/mp4")}
            # For Stage 1, we still lack GIS, so let the backend use its mock fallback.
            # In Stage 2, we will pass explicit GPS data in the 'data' payload.
            response = requests.post(api_url, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    print(f"  -> Successfully uploaded to API! Event ID: {data.get('event_id')}")
                    return True
                else:
                    print(f"  -> API Upload Failed: {data.get('message')}")
                    return False
            else:
                print(f"  -> API returned status code {response.status_code}: {response.text}")
                return False
    except Exception as e:
        print(f"  -> Error occurred while uploading to API: {e}")
        return False


class ThreadedCamera:
    """
    Reads frames in a background thread to ensure the buffer is always the most 
    recent real-time frame without blocking on YOLO inference.
    """
    def __init__(self, source):
        self.cap = cv2.VideoCapture(source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Could not open video source: {source}")
        
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        if self.fps <= 0 or self.fps > 120:
            self.fps = 30.0  # Safe default
        
        # Read first frame
        self.ret, self.frame = self.cap.read()
        self.running = True
        self.thread = threading.Thread(target=self.update, daemon=True)
        self.thread.start()

    def update(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                self.running = False
            else:
                self.ret, self.frame = ret, frame

    def read(self):
        return self.ret, self.frame

    def release(self):
        self.running = False
        self.thread.join(timeout=1.0)
        self.cap.release()


def main():
    parser = argparse.ArgumentParser(description="Live YOLO Pothole Detection Pipeline")
    base_dir = Path(__file__).resolve().parent
    parser.add_argument(
        "--source", 
        type=str, 
        default="0", 
        help="Video source: '0' for USB camera, or an RTSP/HTTP URL string (e.g. rtsp://192.168.1.100:554/stream)."
    )
    parser.add_argument("--model", type=str, default=str(base_dir.parent / "best.pt"), help="Path to YOLO model weights.")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold.")
    parser.add_argument("--pothole-class", type=str, default="pothole", help="Class name for potholes.")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size.")
    parser.add_argument("--fps", type=float, default=30.0, help="Expected FPS if stream FPS is unreadable.")
    parser.add_argument("--buffer-seconds", type=float, default=3.5, help="Seconds of footage to capture before/after detection.")
    parser.add_argument("--output-dir", type=str, default=str(base_dir / "output_clips"), help="Local directory to temporarily save clips.")
    parser.add_argument("--api-url", type=str, default="http://localhost:8000/api/upload-clip", help="Backend API URL to send clips.")
    parser.add_argument("--keep-clips", action="store_true", help="Keep local clips after a successful upload.")
    parser.add_argument("--show", action="store_true", help="Show live video feed (for testing on laptops).")
    args = parser.parse_args()

    # Create output dir
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Convert source to int if it's a digit (USB Camera)
    source = int(args.source) if args.source.isdigit() else args.source

    print(f"[INFO] Loading YOLO model from {args.model}...")
    model = YOLO(args.model)

    print(f"[INFO] Connecting to video source: {source}")
    try:
        cam = ThreadedCamera(source)
    except RuntimeError as e:
        print(f"[ERROR] {e}")
        return

    fps = cam.fps if cam.fps > 0 else args.fps
    buffer_frames = int(args.buffer_seconds * fps)
    
    # We maintain a double-ended queue. Max length = total frames needed for a full clip 
    # (pre-buffer + post-buffer, so we'll just track raw frames passing by)
    print(f"[INFO] Stream FPS established at {fps}. Target buffer = {buffer_frames} frames per side.")
    
    rolling_buffer = deque(maxlen=buffer_frames)
    
    is_recording = False
    recording_frames_collected = 0
    saved_clip_frames = []

    print("[INFO] Live detection active. Press Ctrl+C to stop.")
    try:
        while True:
            ret, frame = cam.read()
            if not ret or frame is None:
                print("[WARNING] Frame dropped or stream ended. Waiting...")
                time.sleep(0.1)
                continue
            
            # 1. Manage current rolling buffer if we are NOT recording
            if not is_recording:
                rolling_buffer.append(frame)

                # Run Inference (for efficiency, you might skip frames here if the hardware struggles)
                results = model(frame, conf=args.conf, imgsz=args.imgsz, verbose=False)
                
                if has_pothole_detection(results[0], args.pothole_class):
                    print(f"\n[ALERT] Pothole detected! Triggering recording window...")
                    is_recording = True
                    recording_frames_collected = 0
                    
                    # Copy over all frames from the rolling buffer (pre-detection)
                    saved_clip_frames = list(rolling_buffer)
                    # Add the frame where it was detected
                    saved_clip_frames.append(frame)
            
            else:
                # 2. We ARE currently recording the post-detection window
                saved_clip_frames.append(frame)
                recording_frames_collected += 1
                
                # If we've collected enough post-detection frames, bundle the clip!
                if recording_frames_collected >= buffer_frames:
                    print(f"[INFO] Recording complete. Assembling {len(saved_clip_frames)} frames.")
                    
                    clip_filename = output_dir / f"live_clip_{uuid.uuid4().hex[:8]}.mp4"
                    
                    # Write video
                    height, width = saved_clip_frames[0].shape[:2]
                    fourcc = cv2.VideoWriter_fourcc(*"avc1")
                    writer = cv2.VideoWriter(str(clip_filename), fourcc, fps, (width, height))
                    
                    for f in saved_clip_frames:
                        writer.write(f)
                    writer.release()
                    
                    print(f"[INFO] Clip saved to {clip_filename}. Uploading...")
                    success = upload_clip_to_backend(clip_filename, args.api_url)
                    
                    if success and not args.keep_clips:
                        os.remove(clip_filename)
                        print(f"[INFO] Local file {clip_filename.name} deleted.")
                    
                    # Reset state back to scanning
                    is_recording = False
                    rolling_buffer.clear()
                    saved_clip_frames = []
                    
                    # Prevent instant re-triggering (Cooldown feature for Stage 3, basic time-delay)
                    time.sleep(1.0)

            if args.show:
                display_frame = frame
                if not is_recording and 'results' in locals() and len(results) > 0:
                    display_frame = results[0].plot()
                cv2.imshow("Live Detection Mode", display_frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("\n[INFO] 'q' pressed. Stopping...")
                    break

            # Optional: Add small sleep to not max out 100% CPU thread
            time.sleep(0.005)

    except KeyboardInterrupt:
        print("\n[INFO] Stopped by user.")
    finally:
        cam.release()
        if args.show:
            cv2.destroyAllWindows()
        print("[INFO] Application closed.")


if __name__ == "__main__":
    main()
