# Disaster Monitoring System

Sistem monitoring bencana alam real-time menggunakan ESP32 dan sensor IoT untuk deteksi dini potensi bencana.

## Overview

Sistem ini dirancang untuk memantau parameter lingkungan secara real-time menggunakan node ESP32 yang dilengkapi dengan berbagai sensor. Data yang dikumpulkan akan divisualisasikan dalam bentuk grafik dan chart untuk analisis lebih lanjut.

## Fitur Utama

- **Real-time Monitoring**: Pemantauan data sensor secara real-time
- **Multi-Sensor Support**: Mendukung berbagai jenis sensor (suhu, kelembaban, ketinggian air, getaran, kelembaban tanah, cahaya)
- **Dashboard Interaktif**: Visualisasi data dalam bentuk grafik dan chart
- **Admin Panel**: Konfigurasi perangkat ESP32 dan manajemen pengguna
- **Alert System**: Notifikasi ketika nilai sensor melebihi threshold
- **Role-based Access**: Sistem autentikasi dengan role admin dan user
- **Responsive Design**: Tampilan yang optimal di berbagai perangkat

## Arsitektur Sistem

```
ESP32 Node 1 (DHT22 + VL53L0X) → WiFi → Backend API → Database → Frontend
ESP32 Node 2 (Vibration + Soil Moisture + Light) → WiFi → Backend API → Database → Frontend
```

## Teknologi yang Digunakan

### Backend
- **Framework**: Next.js 15 dengan App Router
- **Database**: SQLite dengan Prisma ORM
- **Authentication**: NextAuth.js
- **API**: RESTful API untuk komunikasi dengan ESP32
- **Runtime**: Node.js 18.17+ (Recommended: 20.x LTS or 22.x)

### Frontend
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Charts**: Recharts untuk visualisasi data
- **UI Components**: shadcn/ui
- **Runtime**: Node.js 18.17+ (Recommended: 20.x LTS or 22.x)

### Hardware
- **Microcontroller**: ESP32 Dev Module 30 Pin
- **Sensors**:
  - DHT22 (Suhu dan Kelembaban Udara)
  - VL53L0X (Ketinggian Air)
  - Vibration Sensor (Getaran)
  - Soil Moisture Sensor (Kelembaban Tanah)
  - Light Sensor (Intensitas Cahaya)

## Instalasi

### Prasyarat
- Node.js 18.17+ (Recommended: Node.js 20.x LTS or 22.x)
- npm 8.0+ 
- Git

### Langkah-langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone https://github.com/diskonnekted/dasbor-bencana-alam.git
   cd dasbor-bencana-alam
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` dan sesuaikan konfigurasi database:
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Setup Database**
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed
   ```

5. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

6. **Aplikasi akan tersedia di** `http://localhost:3000`

## Konfigurasi ESP32

### ESP32 Node 1 - Suhu & Air
- **Sensor**: DHT22 (Suhu dan Kelembaban), VL53L0X (Ketinggian Air)
- **Pin Configuration**:
  - DHT22: Pin 4
  - VL53L0X: I2C (SDA: Pin 21, SCL: Pin 22)

### ESP32 Node 2 - Tanah & Getaran
- **Sensor**: Vibration Sensor, Soil Moisture Sensor, Light Sensor
- **Pin Configuration**:
  - Vibration Sensor: Pin 34
  - Soil Moisture Sensor: Pin 32
  - Light Sensor: Pin 33

## API Documentation

### Authentication
Endpoint: `/api/auth/[...nextauth]`
Method: POST/GET
Description: Handle authentication untuk login dan session management

### Device Management
#### Register Device
Endpoint: `/api/devices/register`
Method: POST
Description: Registrasi device ESP32 baru
Request Body:
```json
{
  "name": "ESP32 Device 1",
  "location": "Jakarta",
  "deviceType": "ESP32_1",
  "email": "user@example.com",
  "password": "password"
}
```

#### Get Devices
Endpoint: `/api/devices`
Method: GET
Description: Mendapatkan daftar semua devices
Query Parameters:
- `userId`: Filter by user ID
- `deviceType`: Filter by device type

#### Update Device
Endpoint: `/api/devices/[id]`
Method: PATCH
Description: Update device configuration
Request Body:
```json
{
  "isActive": true,
  "thresholdMin": 20,
  "thresholdMax": 35
}
```

### Sensor Data
#### Submit Sensor Data
Endpoint: `/api/sensors/data`
Method: POST
Description: Kirim data sensor dari ESP32
Request Body:
```json
{
  "deviceId": "ESP32_DEVICE_ID",
  "apiKey": "API_KEY",
  "sensorData": [
    {
      "sensorType": "TEMPERATURE",
      "value": 25.5,
      "unit": "°C",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Sensor Data
Endpoint: `/api/sensors/data`
Method: GET
Description: Mendapatkan data sensor
Query Parameters:
- `deviceId`: Filter by device ID
- `sensorType`: Filter by sensor type
- `limit`: Jumlah data (default: 100)
- `offset`: Offset data (default: 0)

#### Get Latest Sensor Data
Endpoint: `/api/sensors/latest`
Method: GET
Description: Mendapatkan data sensor terbaru
Query Parameters:
- `deviceId`: Filter by device ID
- `sensorType`: Filter by sensor type

## Penggunaan

### Login
1. Buka aplikasi di `http://localhost:3000`
2. Klik tombol Login atau navigasi ke `/auth/signin`
3. Gunakan credentials demo:
   - Email: `admin@example.com`
   - Password: `admin123`

### Admin Dashboard
1. Login sebagai admin
2. Navigasi ke `/admin`
3. Di dashboard admin, Anda dapat:
   - Menambah device ESP32 baru
   - Mengaktifkan/menonaktifkan device
   - Mengatur threshold untuk alert system
   - Melihat statistik device
   - Mengelola API key

### Monitoring Data
1. Di halaman utama, Anda dapat melihat:
   - Status device (online/offline)
   - Data real-time dari semua sensor
   - Grafik historis untuk setiap sensor
   - Detail chart dengan zoom dan pan

## Struktur Database

### Users
- `id`: Primary key
- `email`: Email user
- `name`: Nama user
- `password`: Password user (hashed)
- `role`: Role user (USER/ADMIN)
- `createdAt`: Timestamp pembuatan
- `updatedAt`: Timestamp update terakhir

### Devices
- `id`: Primary key
- `name`: Nama device
- `location`: Lokasi device
- `deviceType`: Tipe device (ESP32_1/ESP32_2)
- `deviceId`: Unique identifier ESP32
- `isActive`: Status device
- `apiKey`: API key untuk autentikasi
- `thresholdMin`: Threshold minimum untuk alert
- `thresholdMax`: Threshold maksimum untuk alert
- `userId`: Foreign key ke users
- `createdAt`: Timestamp pembuatan
- `updatedAt`: Timestamp update terakhir

### SensorData
- `id`: Primary key
- `deviceId`: Foreign key ke devices
- `sensorType`: Tipe sensor
- `value`: Nilai sensor
- `unit`: Satuan nilai
- `timestamp`: Timestamp pengukuran

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables untuk Production
```
DATABASE_URL="file:./production.db"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Pastikan file database ada di folder `db/`
   - Check `DATABASE_URL` di environment variables

2. **Authentication Issues**
   - Pastikan `NEXTAUTH_SECRET` dan `NEXTAUTH_URL` sudah di-set
   - Clear browser cache dan cookies

3. **ESP32 Connection Issues**
   - Check WiFi configuration di ESP32
   - Verify API key validity
   - Check server logs untuk error messages

### Logs
- Development logs: `dev.log`
- Production logs: `server.log`

## Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## License

Project ini dilisensikan under the MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## Support

Untuk support dan pertanyaan:
- Email: arif.susilo@gmail.com
- GitHub Issues: [Create Issue](https://github.com/diskonnekted/dasbor-bencana-alam/issues)

## Changelog

### v1.0.0
- Initial release
- Basic monitoring system
- Admin dashboard
- ESP32 integration
- Real-time charts
- Authentication system