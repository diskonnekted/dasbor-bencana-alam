# Setup Instructions

## Prerequisites

Before setting up the Disaster Monitoring System, ensure you have the following:

- Node.js 18 or higher
- npm or yarn package manager
- Git
- ESP32 Development Board (30-pin version)
- Required sensors:
  - DHT22 Temperature & Humidity Sensor
  - VL53L0X Distance Sensor (for water level)
  - Vibration Sensor
  - Soil Moisture Sensor
  - Light Sensor

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/diskonnekted/dasbor-bencana-alam.git
cd dasbor-bencana-alam
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

Initialize the database and run migrations:

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed database with initial data
npm run db:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Hardware Setup

### ESP32 Node 1 - Temperature & Water Level Monitoring

**Components:**
- ESP32 Dev Module (30-pin)
- DHT22 Sensor
- VL53L0X Distance Sensor

**Wiring:**
```
DHT22:
- VCC → 3.3V
- GND → GND
- DATA → GPIO 4

VL53L0X:
- VCC → 3.3V
- GND → GND
- SDA → GPIO 21
- SCL → GPIO 22
```

### ESP32 Node 2 - Soil & Vibration Monitoring

**Components:**
- ESP32 Dev Module (30-pin)
- Vibration Sensor
- Soil Moisture Sensor
- Light Sensor

**Wiring:**
```
Vibration Sensor:
- VCC → 3.3V
- GND → GND
- OUT → GPIO 34

Soil Moisture Sensor:
- VCC → 3.3V
- GND → GND
- AOUT → GPIO 32

Light Sensor:
- VCC → 3.3V
- GND → GND
- AOUT → GPIO 33
```

## ESP32 Configuration

### 1. Install Arduino IDE

Download and install Arduino IDE from the official website.

### 2. Install ESP32 Board Manager

1. Open Arduino IDE
2. Go to File → Preferences
3. Add this URL to Additional Boards Manager URLs:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to Tools → Board → Boards Manager
5. Search for "esp32" and install "ESP32 by Espressif Systems"

### 3. Install Required Libraries

Install these libraries using Arduino IDE Library Manager:

- `DHT sensor library` by Adafruit
- `Adafruit Unified Sensor`
- `VL53L0X` by Pololu

### 4. Upload Sketches

#### For ESP32 Node 1:
1. Open `arduino-sketches/esp32_dht_vl53l0x.ino`
2. Configure WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Configure server URL:
   ```cpp
   const char* serverUrl = "http://localhost:3000/api/sensors/data";
   ```
4. Select your ESP32 board: Tools → Board → ESP32 Arduino → ESP32 Dev Module
5. Select the correct port: Tools → Port
6. Upload the sketch

#### For ESP32 Node 2:
1. Open `arduino-sketches/esp32_vibration_soil_light.ino`
2. Configure WiFi credentials and server URL (same as above)
3. Upload the sketch

## Application Usage

### 1. Initial Setup

1. Open `http://localhost:3000` in your browser
2. Click "Login" or navigate to `/auth/signin`
3. Use default admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

### 2. Device Registration

1. After login, navigate to `/admin`
2. Click "Tambah Device" to register a new ESP32 device
3. Fill in the device details:
   - Name: Descriptive name for the device
   - Location: Physical location of the device
   - Device Type: Select ESP32_1 or ESP32_2
   - Threshold: Set min/max values for alerts (optional)
4. Copy the generated API key for ESP32 configuration

### 3. Configure ESP32 with API Key

Update the Arduino sketch with the device API key:

```cpp
const char* apiKey = "YOUR_DEVICE_API_KEY";
const char* deviceId = "YOUR_DEVICE_ID";
```

Re-upload the sketch to the ESP32.

### 4. Monitoring Data

1. Return to the main dashboard (`/`)
2. You should see real-time data from your ESP32 devices
3. Use the tabs to view detailed charts for each sensor type
4. Monitor device status in the status cards

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Production Environment

Create a production `.env` file:

```env
DATABASE_URL="file:./production.db"
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### 3. Start Production Server

```bash
npm start
```

### 4. Web Server Configuration

For production deployment, configure a reverse proxy (Nginx/Apache) and SSL certificate.

## Troubleshooting

### Common Issues

**Database Connection Error**
- Ensure the database file exists in the `db/` directory
- Check the `DATABASE_URL` in your `.env` file
- Verify file permissions

**ESP32 Not Connecting**
- Check WiFi credentials in the Arduino sketch
- Verify the server URL is accessible from your network
- Ensure the API key and device ID are correct
- Check serial monitor for error messages

**Authentication Issues**
- Clear browser cache and cookies
- Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env`
- Check that the database contains the admin user

**Charts Not Displaying**
- Ensure sensor data is being received from ESP32
- Check browser console for JavaScript errors
- Verify the API endpoints are returning data

### Log Files

- Development logs: `dev.log`
- Production logs: `server.log`
- ESP32 serial monitor: Use Arduino IDE serial monitor at 115200 baud

## Security Considerations

1. **Change Default Passwords**: Always change the default admin password
2. **Secure API Keys**: Keep API keys confidential and rotate them regularly
3. **HTTPS**: Use HTTPS in production environments
4. **Firewall**: Configure firewall rules to restrict access
5. **Database Security**: Implement proper database backups and security measures

## Support

For technical support and issues:
- Create an issue on GitHub: [GitHub Issues](https://github.com/diskonnekted/dasbor-bencana-alam/issues)
- Email: arif.susilo@gmail.com

## Maintenance

### Regular Tasks

1. **Database Backups**: Regularly backup the database file
2. **Log Rotation**: Implement log rotation to manage log file sizes
3. **Software Updates**: Keep dependencies up to date
4. **Device Monitoring**: Regularly check ESP32 device status

### Scaling Considerations

1. **Database**: Consider migrating to PostgreSQL for larger deployments
2. **Load Balancing**: Implement load balancing for high traffic
3. **Message Queue**: Use message queues for high-frequency sensor data
4. **Caching**: Implement caching for frequently accessed data