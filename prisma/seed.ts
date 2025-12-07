import { db } from '../src/lib/db'
import { Role } from '@prisma/client'

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123', // In production, use hashed password
      role: Role.ADMIN,
    },
  })

  console.log('Admin user created:', adminUser)

  // Create demo devices
  const device1 = await db.device.create({
    data: {
      name: 'ESP32 Device 1 - Suhu & Air',
      location: 'Jakarta',
      deviceType: 'ESP32_1',
      deviceId: 'ESP32_DEMO_1',
      apiKey: 'sk_demo_esp32_1_' + Math.random().toString(36).substr(2, 32),
      userId: adminUser.id,
      thresholdMin: 20,
      thresholdMax: 35,
    },
  })

  const device2 = await db.device.create({
    data: {
      name: 'ESP32 Device 2 - Tanah & Getaran',
      location: 'Bandung',
      deviceType: 'ESP32_2',
      deviceId: 'ESP32_DEMO_2',
      apiKey: 'sk_demo_esp32_2_' + Math.random().toString(36).substr(2, 32),
      userId: adminUser.id,
      thresholdMin: 0,
      thresholdMax: 100,
    },
  })

  console.log('Demo devices created:', { device1, device2 })

  // Create some sample sensor data
  const sensorTypes = ['TEMPERATURE', 'HUMIDITY', 'WATER_LEVEL', 'VIBRATION', 'SOIL_MOISTURE', 'LIGHT']
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - (i * 5 * 60 * 1000)) // Every 5 minutes for past ~4 hours
    
    // Data for device 1
    await db.sensorData.create({
      data: {
        deviceId: device1.id,
        sensorType: 'TEMPERATURE',
        value: 25 + Math.random() * 10,
        unit: '°C',
        timestamp,
      },
    })

    await db.sensorData.create({
      data: {
        deviceId: device1.id,
        sensorType: 'HUMIDITY',
        value: 50 + Math.random() * 30,
        unit: '%',
        timestamp,
      },
    })

    await db.sensorData.create({
      data: {
        deviceId: device1.id,
        sensorType: 'WATER_LEVEL',
        value: 100 + Math.random() * 50,
        unit: 'cm',
        timestamp,
      },
    })

    // Data for device 2
    await db.sensorData.create({
      data: {
        deviceId: device2.id,
        sensorType: 'VIBRATION',
        value: Math.random() * 2,
        unit: 'g',
        timestamp,
      },
    })

    await db.sensorData.create({
      data: {
        deviceId: device2.id,
        sensorType: 'SOIL_MOISTURE',
        value: 30 + Math.random() * 40,
        unit: '%',
        timestamp,
      },
    })

    await db.sensorData.create({
      data: {
        deviceId: device2.id,
        sensorType: 'LIGHT',
        value: Math.random() * 1000,
        unit: 'lux',
        timestamp,
      },
    })
  }

  console.log('Sample sensor data created')
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })