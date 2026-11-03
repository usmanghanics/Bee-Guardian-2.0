// Bee Guardian 2.0: Uno + DHT11 (D2) + GY-61 ZOUT (A1) + buzzer (D8) + LED (D9)
// USB Serial: newline-delimited JSON telemetry; SET TEMP <degrees> / SET VIB <counts>
// Commands are case-sensitive, e.g. SET TEMP 30.5 and SET VIB 35.

#include <DHT.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
#define GY61_PIN A1
#define BUZZER_PIN 8
#define LED_PIN 9

const unsigned long SAMPLE_MS = 10;
const unsigned long REPORT_MS = 500;
const unsigned long DHT_READ_MS = 2200; // DHT11 measurement interval
const unsigned long TEMP_BLINK_MS = 1000;
const unsigned long VIB_BLINK_MS = 150;

float tempThreshold = 30.0f;
int vibThreshold = 35;
unsigned long lastSample = 0, lastReport = 0, lastBlink = 0, lastDhtRead = 0;
float lastTemperature = NAN, lastHumidity = NAN;
bool tempValid = false;
int minZ = 1023, maxZ = 0, lastZ = 0;
bool tempAlert = false, vibAlert = false, ledState = false;
uint8_t mode = 0;
char command[48];
uint8_t commandLen = 0;

void sendSettings() {
  Serial.print(F("{\"type\":\"settings\",\"tempThreshold\":"));
  Serial.print(tempThreshold, 1);
  Serial.print(F(",\"vibThreshold\":"));
  Serial.print(vibThreshold);
  Serial.println('}');
}

void handleCommand(const char* cmd) {
  if (strcmp(cmd, "GET") == 0) {
    sendSettings();
    return;
  }
  if (strncmp(cmd, "SET TEMP ", 9) == 0) {
    char *end;
    float value = strtod(cmd + 9, &end);
    if (end != cmd + 9 && *end == '\0' && value >= 15.0f && value <= 80.0f) {
      tempThreshold = value;
      sendSettings();
    } else Serial.println(F("{\"type\":\"error\",\"message\":\"Temperature must be 15 to 80 C\"}"));
    return;
  }
  if (strncmp(cmd, "SET VIB ", 8) == 0) {
    char *end;
    long value = strtol(cmd + 8, &end, 10);
    if (end != cmd + 8 && *end == '\0' && value >= 1 && value <= 500) {
      vibThreshold = (int)value;
      sendSettings();
    } else Serial.println(F("{\"type\":\"error\",\"message\":\"Vibration must be 1 to 500 counts\"}"));
    return;
  }
  Serial.println(F("{\"type\":\"error\",\"message\":\"Unknown command\"}"));
}

void readCommands() {
  while (Serial.available() > 0) {
    char c = (char) Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      command[commandLen] = '\0';
      if (commandLen) handleCommand(command);
      commandLen = 0;
    } else if (commandLen < sizeof(command) - 1) {
      command[commandLen++] = c;
    } else {
      commandLen = 0;
    }
  }
}

void readDHT11() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  // DHT11 temperature and humidity are trusted only within sensor specifications.
  tempValid = !isnan(t) && !isnan(h) &&
              t >= 0.0f && t <= 50.0f &&
              h >= 20.0f && h <= 90.0f;
  if (tempValid) {
    lastTemperature = t;
    lastHumidity = h;
  } else {
    lastTemperature = NAN;
    lastHumidity = NAN;
    tempAlert = false;
  }
}

void updateIndicators(unsigned long now) {
  uint8_t nextMode = (tempAlert && vibAlert) ? 3 : (tempAlert ? 1 : (vibAlert ? 2 : 0));
  if (nextMode != mode) {
    mode = nextMode;
    ledState = (mode != 0);
    lastBlink = now;
  }
  if (mode == 0) ledState = false;
  else if (mode == 3) ledState = true;
  else {
    unsigned long interval = (mode == 1) ? TEMP_BLINK_MS : VIB_BLINK_MS;
    if (now - lastBlink >= interval) {
      lastBlink = now;
      ledState = !ledState;
    }
  }
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  if (tempAlert || vibAlert) tone(BUZZER_PIN, 1000);
  else noTone(BUZZER_PIN);
}

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(9600);
  dht.begin();
  lastReport = millis();
  lastDhtRead = millis();
  sendSettings();
}

void loop() {
  unsigned long now = millis();
  readCommands();
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    // Reading after switched temperature channel can be discarded by subsequent temperature code.
    lastZ = analogRead(GY61_PIN);
    if (lastZ < minZ) minZ = lastZ;
    if (lastZ > maxZ) maxZ = lastZ;
  }
  if (now - lastDhtRead >= DHT_READ_MS) {
    lastDhtRead = now;
    readDHT11();
  }
  if (now - lastReport >= REPORT_MS) {
    lastReport = now;
    int swing = maxZ - minZ;
    tempAlert = tempValid && (lastTemperature >= tempThreshold);
    vibAlert = (swing > vibThreshold);

    Serial.print(F("{\"type\":\"telemetry\",\"ms\":"));
    Serial.print(now);
    Serial.print(F(",\"temperature\":"));
    if (tempValid) Serial.print(lastTemperature, 2);
    else Serial.print(F("null"));
    Serial.print(F(",\"humidity\":"));
    if (tempValid) Serial.print(lastHumidity, 2);
    else Serial.print(F("null"));
    Serial.print(F(",\"tempValid\":"));
    Serial.print(tempValid ? F("true") : F("false"));
    Serial.print(F(",\"z\":"));
    Serial.print(lastZ);
    Serial.print(F(",\"minZ\":"));
    Serial.print(minZ);
    Serial.print(F(",\"maxZ\":"));
    Serial.print(maxZ);
    Serial.print(F(",\"swing\":"));
    Serial.print(swing);
    Serial.print(F(",\"tempThreshold\":"));
    Serial.print(tempThreshold, 1);
    Serial.print(F(",\"vibThreshold\":"));
    Serial.print(vibThreshold);
    Serial.print(F(",\"tempAlert\":"));
    Serial.print(tempAlert ? F("true") : F("false"));
    Serial.print(F(",\"vibAlert\":"));
    Serial.print(vibAlert ? F("true") : F("false"));
    Serial.println('}');

    minZ = 1023;
    maxZ = 0;
  }
  updateIndicators(now);
}
