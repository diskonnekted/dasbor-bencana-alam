import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive, thresholdMin, thresholdMax } = body

    const device = await db.device.findUnique({
      where: { id: params.id }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }
    if (thresholdMin !== undefined) {
      updateData.thresholdMin = thresholdMin ? parseFloat(thresholdMin) : null
    }
    if (thresholdMax !== undefined) {
      updateData.thresholdMax = thresholdMax ? parseFloat(thresholdMax) : null
    }

    const updatedDevice = await db.device.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'Device updated successfully',
      device: updatedDevice
    })

  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const device = await db.device.findUnique({
      where: { id: params.id }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Delete related sensor data first
    await db.sensorData.deleteMany({
      where: { deviceId: params.id }
    })

    // Delete device
    await db.device.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Device deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}