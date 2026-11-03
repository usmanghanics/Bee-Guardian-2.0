#!/usr/bin/env python3
"""Local-only Bee Guardian Uno USB serial dashboard server."""
import argparse
import json
import mimetypes
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import serial
from serial.tools import list_ports

ROOT = Path(__file__).resolve().parent
PORT_OVERRIDE = None
STATE = {
    "connected": False, "port": None, "error": "Waiting for Arduino",
    "lastSeen": None, "latest": None, "settings": {"temperature": 30.0, "vibration": 35},
}
LOCK = threading.RLock()
PORT_LOCK = threading.RLock()
SERIAL = None
HISTORY = deque(maxlen=200)

def candidate_ports():
    ports = list(list_ports.comports())
    def priority(p):
        d = (p.device + " " + (p.description or "")).lower()
        return 0 if any(k in d for k in ("usbserial", "usbmodem", "wch", "ch340", "arduino", "ftdi", "cp210")) else 1
    return [p.device for p in sorted(ports, key=priority) if priority(p) == 0]

def serial_worker():
    global SERIAL
    while True:
        with LOCK:
            active = STATE["connected"]
        if not active:
            devices = [PORT_OVERRIDE] if PORT_OVERRIDE else candidate_ports()
            if not devices:
                with LOCK:
                    STATE["error"] = "Arduino not found. Connect USB and close Arduino Serial Monitor."
                time.sleep(1.5)
                continue
            for device in devices:
                try:
                    port = serial.Serial(device, 9600, timeout=0.4, write_timeout=1)
                    with PORT_LOCK:
                        SERIAL = port
                    with LOCK:
                        STATE.update(connected=True, port=device, error=None, lastSeen=None, latest=None)
                    HISTORY.clear()
                    # Opening USB Serial usually resets Arduino Uno.
                    time.sleep(2.0)
                    port.reset_input_buffer()
                    port.write(b"GET\n")
                    break
                except (serial.SerialException, OSError) as exc:
                    with LOCK:
                        STATE["error"] = str(exc)
            else:
                time.sleep(1.5)
                continue
        try:
            with PORT_LOCK:
                port = SERIAL
            if port is None:
                raise serial.SerialException("Serial port closed")
            line = port.readline().decode("utf-8", errors="replace").strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(payload, dict):
                continue
            with LOCK:
                if payload.get("type") == "telemetry":
                    STATE["latest"] = payload
                    STATE["lastSeen"] = time.time()
                    HISTORY.append({"t": STATE["lastSeen"], **payload})
                    if "tempThreshold" in payload and "vibThreshold" in payload:
                        STATE["settings"] = {
                            "temperature": payload["tempThreshold"],
                            "vibration": payload["vibThreshold"],
                        }
                elif payload.get("type") == "settings":
                    STATE["settings"] = {
                        "temperature": payload.get("tempThreshold", 30),
                        "vibration": payload.get("vibThreshold", 35),
                    }
                elif payload.get("type") == "error":
                    STATE["error"] = payload.get("message", "Arduino error")
        except (serial.SerialException, OSError) as exc:
            with LOCK:
                STATE.update(connected=False, port=None, error=f"Serial disconnected: {exc}", latest=None)
            with PORT_LOCK:
                try:
                    if SERIAL:
                        SERIAL.close()
                except OSError:
                    pass
                SERIAL = None
            time.sleep(1)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if not self.path.startswith("/api/status"):
            super().log_message(fmt, *args)

    def respond(self, code, data):
        b = json.dumps(data, separators=(",", ":")).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/status":
            with LOCK:
                snapshot = dict(STATE)
                snapshot["settings"] = dict(STATE["settings"])
                snapshot["history"] = list(HISTORY)[-100:]
                if snapshot["connected"] and snapshot["lastSeen"] and time.time()-snapshot["lastSeen"] > 4:
                    snapshot["error"] = "No recent telemetry; check firmware and USB connection"
            self.respond(200, snapshot)
            return
        self.serve_static(path)

    def serve_static(self, path):
        """Serve the built frontend from web/, falling back to index.html for app routes."""
        web = (ROOT / "web").resolve()
        target = (web / path.lstrip("/")).resolve()
        if web not in target.parents and target != web:
            self.send_error(404)
            return
        if not target.is_file():
            if path.startswith("/assets/") or Path(path).suffix:
                self.send_error(404)
                return
            target = web / "index.html"  # client-side route
        body = target.read_bytes()
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml"):
            ctype += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        # Hashed build assets can be cached forever; HTML must always be fresh.
        cache = "public, max-age=31536000, immutable" if path.startswith("/assets/") else "no-store"
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != "/api/thresholds":
            self.respond(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 1024:
                raise ValueError("Invalid request size")
            body = json.loads(self.rfile.read(length))
            temperature = float(body["temperature"])
            vibration = int(body["vibration"])
            if not (15 <= temperature <= 80 and 1 <= vibration <= 500):
                raise ValueError("Temperature must be 15-80°C and vibration 1-500")
            with PORT_LOCK:
                if not SERIAL or not SERIAL.is_open:
                    self.respond(503, {"error": "Arduino is disconnected"})
                    return
                SERIAL.write(f"SET TEMP {temperature:.1f}\nSET VIB {vibration}\n".encode())
            self.respond(200, {"ok": True, "message": "Commands sent; waiting for device confirmation"})
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            self.respond(400, {"error": str(exc)})
        except (OSError, serial.SerialException) as exc:
            self.respond(503, {"error": f"Serial write failed: {exc}"})

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", help="Override USB serial port, e.g. /dev/cu.usbserial-1410")
    parser.add_argument("--http-port", type=int, default=8765)
    args = parser.parse_args()
    PORT_OVERRIDE = args.port
    threading.Thread(target=serial_worker, daemon=True).start()
    print(f"Bee Guardian dashboard: http://127.0.0.1:{args.http_port}")
    print("Close Arduino IDE Serial Monitor before connecting.")
    ThreadingHTTPServer(("127.0.0.1", args.http_port), Handler).serve_forever()
