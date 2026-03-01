#!/usr/bin/env python3
"""
Live video detection using YOLO. Runs inference on webcam feed in real time.
Single window, updated in place. Press 'q' to quit.
"""

import argparse
from pathlib import Path

import cv2
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Live YOLO detection from webcam")
    parser.add_argument(
        "--model",
        type=str,
        default="best.pt",
        help="Path to YOLO model weights (default: best.pt)",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Camera device index (default: 0)",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold (default: 0.25)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Inference image size. Lower is faster (default: 640)",
    )
    parser.add_argument(
        "--skip-frames",
        type=int,
        default=1,
        help="Run inference every N frames (default: 1)",
    )
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    model = YOLO(str(model_path))

    cap = cv2.VideoCapture(args.camera, cv2.CAP_AVFOUNDATION)
    if not cap.isOpened():
        raise RuntimeError(
            f"Cannot open camera {args.camera}. "
            "Check that no other app is using it and that permissions are granted."
        )

    # Prefer a smaller buffer so we get the latest frame (helps on macOS)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    # Optional: force a common resolution (can help with black screen on some Macs)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    window_name = "YOLO Live"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    # Discard first few frames (often black on macOS while camera initializes)
    for _ in range(5):
        cap.read()

    ret, first_frame = cap.read()
    if not ret:
        raise RuntimeError("Camera opened but no frames were read.")
    if first_frame.mean() < 2:
        print(
            "Warning: camera frames look nearly black. "
            "Check macOS camera permissions for your terminal/IDE."
        )

    print(f"Starting live detection (camera {args.camera}). Press 'q' in the window to quit.")

    try:
        frame_idx = 0
        annotated = first_frame
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to read from camera.")
                break

            frame_idx += 1
            if frame_idx % max(1, args.skip_frames) == 0:
                results = model(
                    frame,
                    conf=args.conf,
                    imgsz=args.imgsz,
                    verbose=False,
                )
                annotated = results[0].plot()
            cv2.imshow(window_name, annotated)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
