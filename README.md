# Bee Guardian 2.0 — local live dashboard

A light-theme, functional local browser dashboard for **Arduino Uno + DHT11 + GY-61 + buzzer + LED**. No potentiometer, infrared sensor, cloud account, or paid service required.

## Wiring (updated for DHT11)

| Part | Arduino Uno |
| --- | --- |
| DHT11 DATA / OUT | D2 |
| DHT11 VCC / GND | 5V / GND (check module labels) |
| GY-61 ZOUT | A1 |
| GY-61 VCC | **3.3V**, not 5V |
| GY-61 GND | GND |
| Active/passive buzzer + | D8 |
| Buzzer - | GND |
| LED anode | D9 **through a 220–330 Ω resistor** |
| LED cathode | GND |

## 1. Upload firmware

1. Open `arduino/BeeGuardianDashboard.ino` in Arduino IDE.
2. Set **Board: Arduino Uno** and select the USB port under Tools → Port.
3. Install **DHT sensor library by Adafruit** and **Adafruit Unified Sensor** in Arduino IDE Library Manager; then upload.
4. **Close Serial Monitor and Serial Plotter** before starting the server: only one program can use the serial port at a time.

## 2. Start dashboard on macOS

Open Terminal:

```bash
cd /path/to/bee_guardian_dashboard
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 server.py
```

Open **http://127.0.0.1:8765** in your browser.

If auto-detection chooses the wrong port, stop the server with Ctrl+C and run:

```bash
ls /dev/cu.usb*
python3 server.py --port /dev/cu.usbserial-1410
```

Use the real port shown on your Mac; its suffix may change. If port vanishes, check USB cable/adapter. If port is busy, close Arduino Serial Monitor, IDE serial plotter and other serial apps.

## Dashboard controls

- Temperature threshold: 15–80 °C, default 30 °C.
- Vibration threshold: 1–150 ADC counts through the UI, default 35. Firmware accepts up to 500.
- Press **Apply thresholds** to send commands to Arduino. Confirmed values appear on subsequent telemetry.
- Temperature-only alert: slow LED blink. Vibration-only: fast LED blink. Both: solid LED. Buzzer active for either alert.
- Thresholds are held in RAM; Arduino resets them to defaults after reset or power loss.
- USB serial readings arrive every 500 ms; graphs show recent data, with no cloud uploads or permanent logs.

## How it works

The Arduino outputs one JSON telemetry object per line at 9600 baud. Python `pyserial` reads it and exposes `GET /api/status` on localhost, while `POST /api/thresholds` sends `SET TEMP 32.0` and `SET VIB 45` commands back to Arduino. The dashboard polls the local server approximately every 700 ms. No external libraries or CDNs are needed in the web UI.

## DHT11 temperature and humidity monitoring

Remove the old analog LM35 sensor. DHT11 DATA/OUT is connected to **D2**. GY-61 remains powered from **3.3V** with ZOUT at **A1**. DHT11 provides temperature in Celsius and relative humidity; the firmware reads it approximately every 2.2 seconds and transmits JSON telemetry every 500 ms.

If a DHT11 reading fails, the firmware emits `temperature: null`, `humidity: null`, and `tempValid: false`; the dashboard shows an invalid-sensor warning instead of an invented temperature. Some bare DHT11 units need a DATA pull-up resistor (typically 4.7–10 kΩ). Check your module and wiring.

Your earlier DHT11 test failed repeatedly. This software does not fix defective wiring or hardware. Confirm accurate readings before relying on alarms.


## Troubleshooting

- **Disconnected:** Check the cable, USB port, close Serial Monitor, and confirm `/dev/cu.usbserial-*` or `/dev/cu.usbmodem*` exists.
- **Values not updating:** Ensure the new dashboard firmware (not the older text-only sketch) is uploaded and Serial Monitor is closed.
- **No threshold confirmation:** Check USB link and do not refresh while waiting for commands.
- **Unusual GY-61 values:** Verify 3.3V power, common ground, correct ZOUT/A1 wiring, and test motion against rest.
- **Stop:** Press Ctrl+C in Terminal. Server only listens on `127.0.0.1` and is not exposed on the network.

## Dashboard migration (November 2026)

The light dashboard includes a DHT11 humidity card and keeps temperature/vibration threshold controls, LED blink modes, and buzzer alarms. No change is required to `server.py` or `requirements.txt`. Threshold values reset after an Arduino reboot.
