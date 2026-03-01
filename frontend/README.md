# YOLO demo scripts

Quick demos for a YOLO model (`best.pt`): live camera, video file, and single image.

## Setup

```bash
pip install -r requirements.txt
```

Put your `best.pt` in this folder (or pass `--model /path/to/best.pt`).

## Usage

**Live webcam detection** (press `q` to quit):

```bash
python live_detection.py
python live_detection.py --camera 1 --conf 0.5
```

**Process a video file** (writes `input_detected.mp4` by default):

```bash
python video_processing.py path/to/video.mp4
python video_processing.py video.mp4 -o output.mp4 --conf 0.4
```

**Process an image** (shows and saves `input_detected.jpg` by default):

```bash
python image_processing.py path/to/image.jpg
python image_processing.py image.jpg -o out.jpg --no-show
```

All scripts accept `--model` to point to your weights and `--conf` for the confidence threshold.
