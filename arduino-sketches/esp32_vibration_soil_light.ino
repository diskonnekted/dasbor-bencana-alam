#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* SERVER_URL = "http://localhost:3000/api/sensors/data";
const String DEVICE_ID = "ESP32_DEMO_2";
const String API_KEY = "sk_demo_esp32_2_q550njrgw7p"; // Replace with your actual API key

// Pin definitions
#define VIBRATION_PIN 34  // Analog pin for vibration sensor
#define SOIL_MOISTURE_PIN 35  // Analog pin for soil moisture sensor
#define LIGHT_SENSOR_PIN 32  // Analog pin for light sensor

// Calibration values (you may need to adjust these)
#define SOIL_MOISTURE_MIN 0    // Minimum analog value (dry)
#define SOIL_MOISTURE_MAX 4095 // Maximum analog value (wet)
#define LIGHT_MIN 0           // Minimum analog value (dark)
#define LIGHT_MAX 4095         // Maximum analog value (bright)

// Timing variables
unsigned long previousMillis = 0;
const long interval = 5000; // Send data every 5 seconds

// Vibration detection variables
float vibrationThreshold = 2.0; // Adjust based on your sensor
unsigned long vibrationCount = 0;
unsigned long vibrationStartTime = 0;
const long vibrationWindow = 1000; // 1 second window for counting vibrations

void setup() {
  Serial.begin(115200);
  
  // Initialize analog pins
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check for vibrations continuously
  checkVibration();
  
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

void checkVibration() {
  int vibrationValue = analogRead(VIBRATION_PIN);
  float voltage = vibrationValue * (3.3 / 4095.0); // Convert to voltage
  
  // Simple vibration detection
  if (voltage > vibrationThreshold) {
    if (vibrationStartTime == 0) {
      vibrationStartTime = millis();
    }
    vibrationCount++;
  }
  
  // Reset vibration count after window
  if (vibrationStartTime > 0 && (millis() - vibrationStartTime) > vibrationWindow) {
    vibrationStartTime = 0;
    vibrationCount = 0;
  }
}

float readVibration() {
  int vibrationValue = analogRead(VIBRATION_PIN);
  float voltage = vibrationValue * (3.3 / 4095.0);
  
  // Calculate vibration intensity based on count and voltage
  float vibrationIntensity = (vibrationCount * voltage) / 10.0;
  
  // Reset for next reading
  vibrationCount = 0;
  vibrationStartTime = 0;
  
  return vibrationIntensity;
}

float readSoilMoisture() {
  int soilMoistureValue = analogRead(SOIL_MOISTURE_PIN);
  
  // Convert analog value to percentage
  float moisturePercentage = 100.0 - ((soilMoistureValue - SOIL_MOISTURE_MIN) / 
                                       (SOIL_MOISTURE_MAX - SOIL_MOISTURE_MIN) * 100.0);
  
  // Constrain between 0 and 100
  moisturePercentage = constrain(moisturePercentage, 0.0, 100.0);
  
  return moisturePercentage;
}

float readLightIntensity() {
  int lightValue = analogRead(LIGHT_SENSOR_PIN);
  
  // Convert analog value to percentage (inverted - lower value = brighter)
  float lightPercentage = 100.0 - ((lightValue - LIGHT_MIN) / 
                                   (LIGHT_MAX - LIGHT_MIN) * 100.0);
  
  // Constrain between 0 and 100
  lightPercentage = constrain(lightPercentage, 0.0, 100.0);
  
  // Convert to lux (approximate)
  float lux = lightPercentage * 1000.0; // Scale to 0-1000 lux range
  
  return lux;
}

void sendSensorData() {
  // Read all sensor data
  float vibration = readVibration();
  float soilMoisture = readSoilMoisture();
  float lightIntensity = readLightIntensity();
  
  // Create JSON payload
  JsonDocument doc;
  JsonArray sensorDataArray = doc["sensorData"].to<JsonArray>();
  
  // Add vibration data
  JsonObject vibrationData = sensorDataArray.add<JsonObject>();
  vibrationData["sensorType"] = "VIBRATION";
  vibrationData["value"] = vibration;
  vibrationData["unit"] = "g";
  vibrationData["timestamp"] = getISOString();
  
  // Add soil moisture data
  JsonObject soilData = sensorDataArray.add<JsonObject>();
  soilData["sensorType"] = "SOIL_MOISTURE";
  soilData["value"] = soilMoisture;
  soilData["unit"] = "%";
  soilData["timestamp"] = getISOString();
  
  // Add light intensity data
  JsonObject lightData = sensorDataArray.add<JsonObject>();
  lightData["sensorType"] = "LIGHT";
  lightData["value"] = lightIntensity;
  lightData["unit"] = "lux";
  lightData["timestamp"] = getISOString();
  
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
  Serial.print("Vibration: ");
  Serial.print(vibration);
  Serial.println(" g");
  Serial.print("Soil Moisture: ");
  Serial.print(soilMoisture);
  Serial.println(" %");
  Serial.print("Light Intensity: ");
  Serial.print(lightIntensity);
  Serial.println(" lux");
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