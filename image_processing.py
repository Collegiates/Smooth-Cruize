#!/usr/bin/env python3
"""
Run YOLO detection on a single image. Optionally show and/or save the result.
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Run YOLO detection on an image")
    parser.add_argument(
        "input_image",
        type=str,
        help="Path to input image",
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
        help="Path for output image (default: input_detected.jpg)",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold (default: 0.25)",
    )
    parser.add_argument(
        "--no-show",
        action="store_true",
        help="Do not display the result window",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Do not save the output image",
    )
    args = parser.parse_args()

    input_path = Path(args.input_image)
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    if args.output is None:
        output_path = input_path.parent / f"{input_path.stem}_detected{input_path.suffix}"
    else:
        output_path = Path(args.output)

    model = YOLO(str(model_path))

    results = model.predict(
        source=str(input_path),
        conf=args.conf,
    )

    if not results:
        print("No results.")
        return

    result = results[0]

    if not args.no_save:
        result.save(filename=str(output_path))
        print(f"Saved: {output_path}")

    if not args.no_show:
        result.show()


if __name__ == "__main__":
    main()
