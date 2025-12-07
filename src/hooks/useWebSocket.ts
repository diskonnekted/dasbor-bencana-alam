'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SensorData {
  deviceId: string
  sensorType: string
  value: number
  unit: string
  timestamp: string
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latestData, setLatestData] = useState<Map<string, SensorData>>(new Map())

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('/?XTransformPort=3001', {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socket.on('sensor-data', (data: SensorData) => {
      console.log('Received sensor data:', data)
      setLatestData(prev => {
        const newMap = new Map(prev)
        const key = `${data.deviceId}:${data.sensorType}`
        newMap.set(key, data)
        return newMap
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const subscribeToDevice = (deviceId: string, sensorType?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe', { deviceId, sensorType })
    }
  }

  const unsubscribeFromDevice = (deviceId: string, sensorType?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', { deviceId, sensorType })
    }
  }

  const getLatestData = (deviceId: string, sensorType: string) => {
    const key = `${deviceId}:${sensorType}`
    return latestData.get(key)
  }

  return {
    isConnected,
    latestData,
    subscribeToDevice,
    unsubscribeFromDevice,
    getLatestData
  }
}