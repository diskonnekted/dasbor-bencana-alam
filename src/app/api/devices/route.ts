import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DeviceType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const deviceType = searchParams.get('deviceType')

    const where: any = {}
    if (userId) {
      where.userId = userId
    }
    if (deviceType) {
      where.deviceType = deviceType
    }

    const devices = await db.device.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            sensorData: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      data: devices,
      count: devices.length
    })

  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, deviceType, userId, thresholdMin, thresholdMax } = body

    // Validasi input
    if (!name || !deviceType || !userId) {
      return NextResponse.json(
        { error: 'Name, device type, and user ID are required' },
        { status: 400 }
      )
    }

    // Validasi device type
    if (!Object.values(DeviceType).includes(deviceType)) {
      return NextResponse.json(
        { error: 'Invalid device type' },
        { status: 400 }
      )
    }

    // Generate unique deviceId and apiKey
    const deviceId = `ESP32_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const apiKey = `sk_${Math.random().toString(36).substr(2, 32)}`

    // Create device
    const device = await db.device.create({
      data: {
        name,
        location,
        deviceType,
        deviceId,
        apiKey,
        userId,
        thresholdMin: thresholdMin ? parseFloat(thresholdMin) : null,
        thresholdMax: thresholdMax ? parseFloat(thresholdMax) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Device created successfully',
      device: {
        ...device,
        // Don't expose full apiKey in response
        apiKey: device.apiKey.substring(0, 8) + '...'
      }
    })

  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}