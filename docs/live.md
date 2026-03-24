# Smooth-Cruize: Live Edge Device Implementation Plan

This document outlines the step-by-step strategy for deploying the Smooth Cruize YOLO pothole detection pipeline onto a specialized edge device aboard a public transportation vehicle (e.g., a bus). The edge device will run independently, processing live feeds and syncing directly to the centralized cloud database.

## Stage 1: Wireless Live Video Capture (Dashcam)
**Objective:** Capture the continuous dashcam feed wirelessly over the vehicle's local network or via USB.
**Details:**
- Connect the edge device to the dashcam's broadcast stream or via USB.
- Implement a rolling frame buffer (e.g., 150 frames in memory) inside the Python processing script. When YOLO detects a pothole, the script extracts the pre-detection and post-detection buffer to create an `.mp4` clip.
**Libraries & Implementation:**
- *Primary:* OpenCV (`cv2.VideoCapture('rtsp://<cam-ip>:<port>/stream')` or HTTP stream). This allows reading directly from a network port.
- *Alternatives:* `vidgear.gears.CamGear` (highly optimized for stabilizing and reading network streams with zero latency).

## Stage 2: Real-time Transit GPS Integration
**Objective:** Fetch the bus’s live GPS coordinates wirelessly to tag pothole detections accurately.
**Details & Options:**
Since buses have onboard internet-connected GPS trackers, there are a few primary ways the edge device can obtain its location without a dedicated hardware module:
1. **Local Network / Router Multicast (Best/Lowest Latency):** Most modern transit buses use rugged cellular routers (like Cradlepoint, Peplink, or Sierra Wireless) equipped with native GPS. These routers can be configured to broadcast/multicast raw NMEA GPS data over the local bus Wi-Fi/Ethernet on a specific UDP port. The edge device simply listens to that port.
   - *Libraries:* Standard Python `socket` library to intercept UDP packets, and `pynmea2` to decode latitude/longitude.
2. **Transit Agency Cloud API (GTFS Realtime):** The local transit authority likely publishes a GTFS Realtime feed updating exactly where each bus is globally. The edge device could periodically query this external public API (filtered by its own specific Bus ID).
   - *Libraries:* `requests`, `google.transit.gtfs_realtime_pb2` (for parsing Protobuf feeds).
3. **Proprietary Fleet Management API:** Onboard telematics systems (e.g., Samsara, Geotab) provide APIs either locally on the bus unit or via the cloud.
   - *Libraries:* `requests` for REST APIs.

## Stage 3: Deduplication & Thresholding (20-Foot Spatial Rule)
**Objective:** Prevent the system from flooding the database with duplicate clips of the exact same pothole.
**Details:**
- **Spatial Threshold:** Whenever YOLO detects a pothole, calculate the distance between the *current* GPS location and the *last uploaded* pothole location.
- If the distance is less than **20 feet (approx. 6.1 meters)**, the script categorizes it as the same pothole and ignores the new detection window, avoiding duplicate uploads.
**Libraries & Implementation:**
- *Primary:* `geopy.distance.distance(coord1, coord2).feet`. This provides a highly accurate Haversine calculation natively in feet.

## Stage 4: Centralized Syncing & Headless Operation
**Objective:** Ensure the edge device operates entirely in the background and sends data reliably to the central cloud.
**Details:**
- Run the YOLO inference script on the edge device without any GUI or frontend (headless mode).
- Remove the local "backend API" middleman on the bus. Instead, update the Python script to upload clips directly to the central **Supabase Storage** and write directly to the `pothole_events` Supabase table via the `supabase-py` client over the bus's internet connection.
- Schedule the Gemini AI analysis to run asynchronously: either directly via the edge script before uploading, or managed by your central cloud backend via Supabase Webhooks when a new event is inserted. 
