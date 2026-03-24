# Video Processing Module Information

The `videoprocessing/` directory houses all the computer vision, YOLO object detection, and video extraction logic. It is separated into two logical architectures: **Live** (designed for real-world edge execution) and **Manual** (designed for offline testing and batch processing).

## 1. `videoprocessing/live/`
This folder contains scripts intended for live execution on edge devices (like headless mini-computers on buses) connected directly to active camera feeds.

* **`live_inference.py`**
  * **Description:** The primary live production script. It uses a multi-threaded `cv2.VideoCapture` class to stream video from either a local USB camera or an RTSP/HTTP network stream. 
  * **How it works:** It constantly evaluates the live stream while maintaining a rolling buffer of frames in memory. When a pothole is detected on-screen, it waits for a short post-detection timeframe, extracts the buffered window, writes it to an `.mp4` completely headlessly, and automatically uploads it to the backend (`/api/upload-clip`).
  * **Key arguments:** `--source` (Camera index or IP stream), `--show` (Opens a visual window for debugging), `--model` (Path to the YOLO model).

## 2. `videoprocessing/manual/`
This folder contains utility scripts mainly used by developers to test models against static `.mp4` files, or to batch-process legacy dashcam footage locally.

* **`process_input_folder.py`**
  * **Description:** Iteratively scans a local folder for video files. It runs inference frame-by-frame and extracts short context clips (e.g., 3.5 seconds before/after) around every single pothole detection.
  * **Use case:** Taking a massive 2-hour dashcam recording saved to disk, running it overnight, and generating 50 separate 7-second incident clips. It can optionally POST them to the backend API afterward.

* **`video_processing.py`**
  * **Description:** A simpler script that takes a single input video file, runs YOLO over it, and exports a single, full-length copy of that video with all the bounding boxes and detection labels drawn directly onto the footage (`input_detected.mp4`).
  * **Use case:** Visually verifying how well `best.pt` performs across a specific test video.

* **`upload_clips.py`**
  * **Description:** A purely administrative script that skips YOLO detection altogether. It scans the output directory and manually `POST`s all existing `.mp4` files to the backend API.
  * **Use case:** Pushing a folder of previously-tested clips without having to re-run the time-consuming ML detection process.

* **Data Directories:**
  * **`input_videos/`:** The holding folder where raw static videos are placed to be scanned by `process_input_folder.py`.
  * **`output_clips/`:** The holding folder where the Python scripts save their generated `.mp4` clips prior to successful uploading or manual review.
