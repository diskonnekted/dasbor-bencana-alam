import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SensorType, DeviceType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, apiKey, sensorData } = body

    // Validasi input
    if (!deviceId || !apiKey || !sensorData || !Array.isArray(sensorData)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Cari device berdasarkan deviceId dan apiKey
    const device = await db.device.findFirst({
      where: {
        deviceId,
        apiKey,
        isActive: true
      }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found or invalid API key' },
        { status: 401 }
      )
    }

    // Simpan data sensor ke database
    const savedData = []
    for (const data of sensorData) {
      const { sensorType, value, unit, timestamp } = data

      // Validasi sensor type berdasarkan device type
      let isValidSensorType = false
      if (device.deviceType === DeviceType.ESP32_1) {
        isValidSensorType = [SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.WATER_LEVEL].includes(sensorType)
      } else if (device.deviceType === DeviceType.ESP32_2) {
        isValidSensorType = [SensorType.VIBRATION, SensorType.SOIL_MOISTURE, SensorType.LIGHT].includes(sensorType)
      }

      if (!isValidSensorType) {
        continue // Skip invalid sensor type
      }

      const sensorRecord = await db.sensorData.create({
        data: {
          deviceId: device.id,
          sensorType,
          value: parseFloat(value),
          unit,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      })

      savedData.push(sensorRecord)
    }

    // Update device last seen
    await db.device.update({
      where: { id: device.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: 'Sensor data saved successfully',
      dataCount: savedData.length
    })

  } catch (error) {
    console.error('Error saving sensor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const sensorType = searchParams.get('sensorType')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    const where: any = {}
    if (deviceId) {
      where.deviceId = deviceId
    }
    if (sensorType) {
      where.sensorType = sensorType
    }

    const data = await db.sensorData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        device: {
          select: {
            name: true,
            deviceType: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json({
      data,
      total: data.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error fetching sensor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}