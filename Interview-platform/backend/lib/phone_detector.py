import sys
import os
import json
import base64
import numpy as np
import cv2

# Set stdout to autoflush so Node.js gets data immediately
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

# Disable ultralytics telemetry/updates to avoid cluttering stderr
os.environ["YOLO_VERBOSE"] = "False"

try:
    from ultralytics import YOLO
except ImportError as e:
    print(json.dumps({"error": f"ultralytics not installed: {str(e)}"}), flush=True)
    sys.exit(1)

# Initialize YOLO model once
# yolo11n.pt will automatically download if not present in the current dir or ~/.config/Ultralytics
try:
    model = YOLO("yolo11n.pt")
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}), flush=True)
    sys.exit(1)

Phone_class_id = 67

def process_frame(base64_data):
    try:
        # Decode base64
        img_bytes = base64.b64decode(base64_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"phone_detected": False, "error": "Failed to decode image"}
        
        # Predict using YOLO
        results = model.predict(
            source=frame,
            classes=[Phone_class_id],
            conf=0.4,
            verbose=False
        )
        
        phone_detected = False
        max_confidence = 0.0
        
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                phone_detected = True
                for box in result.boxes:
                    confidence = float(box.conf[0])
                    if confidence > max_confidence:
                        max_confidence = confidence
                        
        return {
            "phone_detected": phone_detected,
            "confidence": max_confidence
        }
    except Exception as e:
        return {"phone_detected": False, "error": str(e)}

def main():
    # Print a startup message to let Node know it's ready
    print(json.dumps({"status": "ready"}), flush=True)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        if line == "PING":
            print(json.dumps({"status": "PONG"}), flush=True)
            continue
        if line == "EXIT":
            break
            
        result = process_frame(line)
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
