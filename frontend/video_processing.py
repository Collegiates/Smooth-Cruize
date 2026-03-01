#!/usr/bin/env python3
"""
Process a video file with YOLO: run detection on each frame and save the result.
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Run YOLO detection on a video file")
    parser.add_argument(
        "input_video",
        type=str,
        help="Path to input video file",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="best.pt",
        help="Path to YOLO model weights (default: best.pt)",
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Path for output video (default: input_detected.mp4)",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold (default: 0.25)",
    )
    args = parser.parse_args()

    input_path = Path(args.input_video)
    if not input_path.exists():
        raise FileNotFoundError(f"Input video not found: {input_path}")

    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    if args.output is None:
        output_path = input_path.parent / f"{input_path.stem}_detected{input_path.suffix}"
    else:
        output_path = Path(args.output)

    model = YOLO(str(model_path))

    import cv2

    print(f"Processing: {input_path} -> {output_path}")
    results = model.predict(
        source=str(input_path),
        conf=args.conf,
        stream=True,
    )

    out = None
    for result in results:
        frame = result.plot()
        if out is None:
            h, w = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(str(output_path), fourcc, 30, (w, h))
        out.write(frame)

    if out is not None:
        out.release()
    print(f"Saved: {output_path}")
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
