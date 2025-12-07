#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <VL53L0X.h>

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* SERVER_URL = "http://localhost:3000/api/sensors/data";
const String DEVICE_ID = "ESP32_DEMO_1";
const String API_KEY = "sk_demo_esp32_1_x4e1phwlc7"; // Replace with your actual API key

// Pin definitions
#define DHTPIN 4
#define DHTTYPE DHT22
#define VL53L0X_PIN 5

// Sensor objects
DHT dht(DHTPIN, DHTTYPE);
VL53L0X vl53l0x;

// Timing variables
unsigned long previousMillis = 0;
const long interval = 5000; // Send data every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize VL53L0X sensor
  Wire.begin();
  if (!vl53l0x.init()) {
    Serial.println("Failed to initialize VL53L0X sensor!");
    while (1);
  }
  vl53l0x.setTimeout(500);
  vl53l0x.setSignalRateLimit(0.1);
  vl53l0x.setVcselPulsePeriod(VL53L0X::VcselPeriodPreRange, 18);
  vl53l0x.setVcselPulsePeriod(VL53L0X::VcselPeriodFinalRange, 14);
  vl53l0x.setMeasurementTimingBudget(200000);

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
      connectToWiFi();
    }
    
    // Read sensor data and send to server
    if (WiFi.status() == WL_CONNECTED) {
      sendSensorData();
    }
  }
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi!");
  }
}

void sendSensorData() {
  // Read DHT22 sensor data
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read VL53L0X sensor data
  uint16_t distance = vl53l0x.readRangeSingleMillimeters();
  float waterLevel = distance / 10.0; // Convert mm to cm
  
  // Check if readings are valid
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  if (vl53l0x.timeoutOccurred()) {
    Serial.println("VL53L0X timeout!");
    return;
  }
  
  // Create JSON payload
  JsonDocument doc;
  JsonArray sensorDataArray = doc["sensorData"].to<JsonArray>();
  
  // Add temperature data
  JsonObject tempData = sensorDataArray.add<JsonObject>();
  tempData["sensorType"] = "TEMPERATURE";
  tempData["value"] = temperature;
  tempData["unit"] = "°C";
  tempData["timestamp"] = getISOString();
  
  // Add humidity data
  JsonObject humData = sensorDataArray.add<JsonObject>();
  humData["sensorType"] = "HUMIDITY";
  humData["value"] = humidity;
  humData["unit"] = "%";
  humData["timestamp"] = getISOString();
  
  // Add water level data
  JsonObject waterData = sensorDataArray.add<JsonObject>();
  waterData["sensorType"] = "WATER_LEVEL";
  waterData["value"] = waterLevel;
  waterData["unit"] = "cm";
  waterData["timestamp"] = getISOString();
  
  // Add device info
  doc["deviceId"] = DEVICE_ID;
  doc["apiKey"] = API_KEY;
  
  // Serialize JSON to string
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String payload = http.getString();
    Serial.println(payload);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  
  // Print sensor readings to serial monitor
  Serial.println("Sensor Readings:");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("Water Level: ");
  Serial.print(waterLevel);
  Serial.println(" cm");
  Serial.println("-------------------");
}

String getISOString() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  char buffer[80];
  
  // For ESP32, you might need to sync time with NTP server
  // This is a simplified version
  sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ", 
          2024, 12, 7, 12, 0, 0); // Replace with actual time
  
  return String(buffer);
}