import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DeviceType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, deviceType, email, password } = body

    // Validasi input
    if (!name || !deviceType || !email || !password) {
      return NextResponse.json(
        { error: 'Name, device type, email, and password are required' },
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

    // Cari atau buat user
    let user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Buat user baru
      user = await db.user.create({
        data: {
          email,
          name: name,
          password, // In production, hash this password
          role: 'USER'
        }
      })
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
        userId: user.id
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
      message: 'Device registered successfully',
      device: {
        id: device.id,
        name: device.name,
        location: device.location,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        apiKey: device.apiKey, // Return full apiKey for device configuration
        user: device.user
      }
    })

  } catch (error) {
    console.error('Error registering device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}