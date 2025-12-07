import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all devices with thresholds
    const devices = await db.device.findMany({
      where: {
        OR: [
          { thresholdMin: { not: null } },
          { thresholdMax: { not: null } }
        ],
        isActive: true
      }
    })

    const alerts = []

    // Check each device for threshold violations
    for (const device of devices) {
      // Get latest sensor data for this device
      const latestData = await db.sensorData.findMany({
        where: { deviceId: device.id },
        orderBy: { timestamp: 'desc' },
        distinct: ['sensorType'],
        take: 10
      })

      for (const data of latestData) {
        let isAlert = false
        let alertType = ''

        // Check minimum threshold
        if (device.thresholdMin !== null && data.value < device.thresholdMin) {
          isAlert = true
          alertType = 'LOW'
        }

        // Check maximum threshold
        if (device.thresholdMax !== null && data.value > device.thresholdMax) {
          isAlert = true
          alertType = 'HIGH'
        }

        if (isAlert) {
          alerts.push({
            id: `alert_${device.id}_${data.sensorType}_${data.timestamp.getTime()}`,
            deviceId: device.id,
            deviceName: device.name,
            location: device.location,
            sensorType: data.sensorType,
            value: data.value,
            unit: data.unit,
            thresholdMin: device.thresholdMin,
            thresholdMax: device.thresholdMax,
            alertType,
            timestamp: data.timestamp,
            severity: getSeverity(data.sensorType, alertType, data.value, device.thresholdMin, device.thresholdMax)
          })
        }
      }
    }

    // Sort alerts by timestamp (newest first) and limit
    const sortedAlerts = alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      alerts: sortedAlerts,
      total: sortedAlerts.length
    })

  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSeverity(sensorType: string, alertType: string, value: number, thresholdMin?: number, thresholdMax?: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Calculate how far the value is from the threshold
  let deviation = 0
  
  if (alertType === 'LOW' && thresholdMin !== null) {
    deviation = ((thresholdMin - value) / thresholdMin) * 100
  } else if (alertType === 'HIGH' && thresholdMax !== null) {
    deviation = ((value - thresholdMax) / thresholdMax) * 100
  }

  // Determine severity based on sensor type and deviation
  if (sensorType === 'WATER_LEVEL' || sensorType === 'VIBRATION') {
    if (deviation > 50) return 'CRITICAL'
    if (deviation > 30) return 'HIGH'
    if (deviation > 15) return 'MEDIUM'
    return 'LOW'
  }

  if (sensorType === 'TEMPERATURE') {
    if (deviation > 40) return 'CRITICAL'
    if (deviation > 25) return 'HIGH'
    if (deviation > 10) return 'MEDIUM'
    return 'LOW'
  }

  // For other sensors
  if (deviation > 60) return 'CRITICAL'
  if (deviation > 40) return 'HIGH'
  if (deviation > 20) return 'MEDIUM'
  return 'LOW'
}