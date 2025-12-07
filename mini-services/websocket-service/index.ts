import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import 'dotenv/config'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Store connected clients and their subscriptions
const clients = new Map<string, Set<string>>()

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Handle subscription to sensor data
  socket.on('subscribe', (data) => {
    const { deviceId, sensorType } = data
    const subscriptionKey = `${deviceId}:${sensorType || 'all'}`
    
    if (!clients.has(socket.id)) {
      clients.set(socket.id, new Set())
    }
    
    clients.get(socket.id)!.add(subscriptionKey)
    console.log(`Client ${socket.id} subscribed to ${subscriptionKey}`)
  })

  // Handle unsubscription
  socket.on('unsubscribe', (data) => {
    const { deviceId, sensorType } = data
    const subscriptionKey = `${deviceId}:${sensorType || 'all'}`
    
    if (clients.has(socket.id)) {
      clients.get(socket.id)!.delete(subscriptionKey)
      if (clients.get(socket.id)!.size === 0) {
        clients.delete(socket.id)
      }
    }
    console.log(`Client ${socket.id} unsubscribed from ${subscriptionKey}`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    clients.delete(socket.id)
  })
})

// API endpoint for ESP32 to send sensor data
app.post('/api/sensor-data', (req, res) => {
  const { deviceId, apiKey, sensorData } = req.body

  // Validate API key (in production, check against database)
  if (!apiKey || !deviceId || !sensorData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Broadcast sensor data to subscribed clients
  sensorData.forEach((data: any) => {
    const payload = {
      deviceId,
      sensorType: data.sensorType,
      value: data.value,
      unit: data.unit,
      timestamp: data.timestamp || new Date().toISOString()
    }

    // Broadcast to clients subscribed to this specific device and sensor
    broadcastToSubscribers(deviceId, data.sensorType, payload)
    
    // Also broadcast to clients subscribed to all sensors for this device
    broadcastToSubscribers(deviceId, 'all', payload)
  })

  res.json({ message: 'Sensor data received and broadcasted' })
})

// Helper function to broadcast to subscribers
function broadcastToSubscribers(deviceId: string, sensorType: string, payload: any) {
  const subscriptionKey = `${deviceId}:${sensorType}`
  
  clients.forEach((subscriptions, clientId) => {
    if (subscriptions.has(subscriptionKey)) {
      io.to(clientId).emit('sensor-data', payload)
    }
  })
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connectedClients: clients.size })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`)
})