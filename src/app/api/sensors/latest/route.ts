import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const sensorType = searchParams.get('sensorType')

    // Build query untuk mendapatkan data terbaru per sensor type
    const where: any = {}
    if (deviceId) {
      where.deviceId = deviceId
    }

    // Jika sensorType spesifik diminta
    if (sensorType) {
      where.sensorType = sensorType
    }

    // Group by sensor type dan get latest data
    const latestData = await db.sensorData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      distinct: ['sensorType', 'deviceId'],
      take: sensorType ? 1 : 50, // Max 50 records jika tidak ada filter
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

    // Format data untuk frontend
    const formattedData = latestData.map(item => ({
      id: item.id,
      deviceId: item.deviceId,
      deviceName: item.device.name,
      deviceType: item.device.deviceType,
      location: item.device.location,
      sensorType: item.sensorType,
      value: item.value,
      unit: item.unit,
      timestamp: item.timestamp
    }))

    return NextResponse.json({
      data: formattedData,
      count: formattedData.length
    })

  } catch (error) {
    console.error('Error fetching latest sensor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}