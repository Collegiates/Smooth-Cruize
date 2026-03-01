#!/usr/bin/env python3
"""
Scan an input folder for videos, detect potholes with YOLO, and write
context clips (buffer before/after detections) to an output folder.
"""

import argparse
from pathlib import Path
from typing import List, Optional, Tuple
import requests
import os

import cv2
from ultralytics import YOLO

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v"}


def is_video_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS


def merge_windows(windows: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    if not windows:
        return []
    windows = sorted(windows, key=lambda w: w[0])
    merged = [windows[0]]
    for start, end in windows[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


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


def detect_clip_windows(
    video_path: Path,
    model: YOLO,
    conf: float,
    buffer_seconds: float,
    pothole_class: Optional[str],
    skip_frames: int,
    imgsz: int,
) -> Tuple[List[Tuple[float, float]], float, int]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if total_frames > 0 else 0.0

    frame_idx = 0
    detection_windows: List[Tuple[float, float]] = []
    stride = max(1, skip_frames)

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_idx % stride == 0:
            results = model(frame, conf=conf, imgsz=imgsz, verbose=False)
            if has_pothole_detection(results[0], pothole_class):
                t = frame_idx / fps
                start = max(0.0, t - buffer_seconds)
                end = min(duration, t + buffer_seconds) if duration > 0 else t + buffer_seconds
                if end >= start:
                    detection_windows.append((start, end))
        frame_idx += 1

    cap.release()
    return merge_windows(detection_windows), fps, total_frames


def write_clip(
    cap: cv2.VideoCapture,
    output_path: Path,
    fps: float,
    start_frame: int,
    end_frame: int,
) -> int:
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    ok, first_frame = cap.read()
    if not ok:
        return 0

    height, width = first_frame.shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    written = 0
    frame_num = start_frame
    frame = first_frame

    while frame_num <= end_frame:
        writer.write(frame)
        written += 1
        frame_num += 1
        if frame_num > end_frame:
            break
        ok, frame = cap.read()
        if not ok:
            break

    writer.release()
    return written


def upload_clip_to_backend(clip_path: Path, api_url: str) -> bool:
    """Uploads the generated clip to the backend API."""
    try:
        with open(clip_path, "rb") as f:
            files = {"video": (clip_path.name, f, "video/mp4")}
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


def process_video(
    video_path: Path,
    output_dir: Path,
    model: YOLO,
    conf: float,
    buffer_seconds: float,
    pothole_class: Optional[str],
    skip_frames: int,
    imgsz: int,
    api_url: Optional[str] = None,
    keep_clips: bool = True,
) -> int:
    windows, fps, total_frames = detect_clip_windows(
        video_path=video_path,
        model=model,
        conf=conf,
        buffer_seconds=buffer_seconds,
        pothole_class=pothole_class,
        skip_frames=skip_frames,
        imgsz=imgsz,
    )

    if not windows:
        print(f"[NO DETECTIONS] {video_path.name}")
        return 0

    print(f"[DETECTIONS] {video_path.name}: {len(windows)} merged clip window(s)")
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video for clip writing: {video_path}")

    clips_written = 0
    for idx, (start_t, end_t) in enumerate(windows, start=1):
        start_frame = max(0, int(start_t * fps))
        end_frame = min(total_frames - 1, int(end_t * fps)) if total_frames > 0 else int(end_t * fps)
        
        # Hard cap the clip size to a maximum of 600 frames
        if (end_frame - start_frame) > 600:
            print(f"  -> Warning: Clip {idx:03d} exceeds 600 frames. Truncating to 600 frames.")
            end_frame = start_frame + 600
            
        clip_path = output_dir / f"{video_path.stem}_clip_{idx:03d}.mp4"
        written_frames = write_clip(
            cap=cap,
            output_path=clip_path,
            fps=fps,
            start_frame=start_frame,
            end_frame=end_frame,
        )
        if written_frames > 0:
            clips_written += 1
            print(
                f"  -> {clip_path.name} "
                f"(start={start_t:.2f}s, end={end_t:.2f}s, frames={written_frames})"
            )
            
            # Send to backend if API URL is provided
            if api_url:
                print(f"  -> Uploading {clip_path.name} to {api_url}...")
                success = upload_clip_to_backend(clip_path, api_url)
                
                # Optionally delete local file after successful upload
                if success and not keep_clips:
                    print(f"  -> Cleaning up local clip file: {clip_path.name}")
                    os.remove(clip_path)

    cap.release()
    return clips_written


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Process all videos in an input folder, write pothole clips to output, and optionally upload them to a backend API."
    )
    parser.add_argument("--input-dir", type=str, default="input_videos", help="Folder containing input videos.")
    parser.add_argument("--output-dir", type=str, default="output_clips", help="Folder to write generated clips.")
    parser.add_argument(
        "--model",
        type=str,
        default="best.pt",
        help="Path to YOLO model weights (default: best.pt).",
    )
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (default: 0.25).")
    parser.add_argument(
        "--buffer-seconds",
        type=float,
        default=3.5,
        help="Seconds before and after each detection (default: 3.5).",
    )
    parser.add_argument(
        "--pothole-class",
        type=str,
        default="pothole",
        help="Class name to treat as pothole. Use empty string to accept any detection.",
    )
    parser.add_argument("--skip-frames", type=int, default=1, help="Run inference every N frames (default: 1).")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size (default: 640).")
    
    # New Backend API arguments
    parser.add_argument(
        "--api-url", 
        type=str, 
        default="http://localhost:8000/api/upload-clip", 
        help="Backend API endpoint to automatically send the generated clips (default: http://localhost:8000/api/upload-clip)."
    )
    parser.add_argument(
        "--keep-clips", 
        action="store_true", 
        help="Keep local clips after a successful upload to the API. If not set, clips are deleted to save space."
    )
    
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    model_path = Path(args.model)

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    videos = sorted([p for p in input_dir.iterdir() if is_video_file(p)])
    if not videos:
        print(f"No videos found in {input_dir}.")
        return

    model = YOLO(str(model_path))
    model_names = model.names
    if isinstance(model_names, dict):
        class_names = [str(name) for _, name in sorted(model_names.items())]
    elif isinstance(model_names, (list, tuple)):
        class_names = [str(name) for name in model_names]
    else:
        class_names = []

    if class_names:
        print(f"Model classes: {', '.join(class_names)}")

    class_filter = args.pothole_class.strip() or None

    print(f"Found {len(videos)} video(s) in {input_dir}.")
    total_clips = 0
    for video_path in videos:
        print(f"\nProcessing {video_path.name}...")
        total_clips += process_video(
            video_path=video_path,
            output_dir=output_dir,
            model=model,
            conf=args.conf,
            buffer_seconds=args.buffer_seconds,
            pothole_class=class_filter,
            skip_frames=args.skip_frames,
            imgsz=args.imgsz,
            api_url=args.api_url,
            keep_clips=args.keep_clips,
        )

    print(f"\nDone. Processed {total_clips} clip(s).")


if __name__ == "__main__":
    main()
