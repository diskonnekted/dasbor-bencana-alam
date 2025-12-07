"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Thermometer, Droplets, Waves, Vibrate, Sprout, Sun, Activity, Settings, LogIn } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { AlertPanel } from '@/components/alerts/AlertPanel'

// Mock data untuk development
const mockSensorData = {
  temperature: [
    { time: '00:00', value: 25.5 },
    { time: '04:00', value: 24.8 },
    { time: '08:00', value: 26.2 },
    { time: '12:00', value: 28.5 },
    { time: '16:00', value: 29.1 },
    { time: '20:00', value: 27.3 },
  ],
  humidity: [
    { time: '00:00', value: 65 },
    { time: '04:00', value: 70 },
    { time: '08:00', value: 62 },
    { time: '12:00', value: 58 },
    { time: '16:00', value: 55 },
    { time: '20:00', value: 68 },
  ],
  waterLevel: [
    { time: '00:00', value: 120 },
    { time: '04:00', value: 125 },
    { time: '08:00', value: 130 },
    { time: '12:00', value: 135 },
    { time: '16:00', value: 140 },
    { time: '20:00', value: 128 },
  ],
  vibration: [
    { time: '00:00', value: 0.2 },
    { time: '04:00', value: 0.1 },
    { time: '08:00', value: 0.3 },
    { time: '12:00', value: 0.5 },
    { time: '16:00', value: 0.4 },
    { time: '20:00', value: 0.2 },
  ],
  soilMoisture: [
    { time: '00:00', value: 45 },
    { time: '04:00', value: 48 },
    { time: '08:00', value: 42 },
    { time: '12:00', value: 38 },
    { time: '16:00', value: 35 },
    { time: '20:00', value: 44 },
  ],
  light: [
    { time: '00:00', value: 0 },
    { time: '04:00', value: 0 },
    { time: '08:00', value: 350 },
    { time: '12:00', value: 850 },
    { time: '16:00', value: 650 },
    { time: '20:00', value: 50 },
  ],
}

const deviceStatus = [
  { id: 'ESP32_1', name: 'Device 1 - Suhu & Air', status: 'online', lastUpdate: '2 menit yang lalu' },
  { id: 'ESP32_2', name: 'Device 2 - Tanah & Getaran', status: 'online', lastUpdate: '1 menit yang lalu' },
]

export default function Home() {
  const { data: session } = useSession()
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [realTimeData, setRealTimeData] = useState(mockSensorData)

  // Simulasi real-time data update
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        const newData = { ...prev }
        Object.keys(newData).forEach(key => {
          const lastValue = newData[key][newData[key].length - 1].value
          const variation = (Math.random() - 0.5) * 2 // Random variation
          newData[key].push({
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            value: Math.max(0, lastValue + variation)
          })
          if (newData[key].length > 10) {
            newData[key].shift()
          }
        })
        return newData
      })
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-red-500'
  }

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature': return <Thermometer className="h-5 w-5" />
      case 'humidity': return <Droplets className="h-5 w-5" />
      case 'waterLevel': return <Waves className="h-5 w-5" />
      case 'vibration': return <Vibrate className="h-5 w-5" />
      case 'soilMoisture': return <Sprout className="h-5 w-5" />
      case 'light': return <Sun className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getSensorUnit = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature': return '°C'
      case 'humidity': return '%'
      case 'waterLevel': return 'cm'
      case 'vibration': return 'g'
      case 'soilMoisture': return '%'
      case 'light': return 'lux'
      default: return ''
    }
  }

  const getSensorName = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature': return 'Suhu'
      case 'humidity': return 'Kelembaban Udara'
      case 'waterLevel': return 'Ketinggian Air'
      case 'vibration': return 'Getaran'
      case 'soilMoisture': return 'Kelembaban Tanah'
      case 'light': return 'Intensitas Cahaya'
      default: return sensorType
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring Bencana Alam</h1>
            <p className="text-muted-foreground">Real-time monitoring system untuk deteksi bencana alam</p>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </a>
                  </Button>
                )}
                <div className="text-sm text-muted-foreground">
                  Welcome, {session.user.name}
                </div>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => signIn()}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Device Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {deviceStatus.map((device) => (
            <Card key={device.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
                <div className={`h-3 w-3 rounded-full ${getStatusColor(device.status)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{device.status}</div>
                <p className="text-xs text-muted-foreground">{device.lastUpdate}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sensor Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(realTimeData).map(([sensorType, data]) => (
            <Card key={sensorType}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getSensorIcon(sensorType)}
                  {getSensorName(sensorType)}
                </CardTitle>
                <Badge variant="secondary">
                  {data[data.length - 1].value.toFixed(1)} {getSensorUnit(sensorType)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={sensorType === 'temperature' ? '#ef4444' : 
                               sensorType === 'humidity' ? '#3b82f6' :
                               sensorType === 'waterLevel' ? '#06b6d4' :
                               sensorType === 'vibration' ? '#f59e0b' :
                               sensorType === 'soilMoisture' ? '#22c55e' : '#eab308'}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Charts */}
        <Tabs defaultValue="temperature" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            {Object.keys(realTimeData).map((sensorType) => (
              <TabsTrigger key={sensorType} value={sensorType}>
                {getSensorName(sensorType)}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(realTimeData).map(([sensorType, data]) => (
            <TabsContent key={sensorType} value={sensorType} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getSensorIcon(sensorType)}
                    {getSensorName(sensorType)} - Detail
                  </CardTitle>
                  <CardDescription>
                    Data monitoring {getSensorName(sensorType).toLowerCase()} secara real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={sensorType === 'temperature' ? '#ef4444' : 
                                 sensorType === 'humidity' ? '#3b82f6' :
                                 sensorType === 'waterLevel' ? '#06b6d4' :
                                 sensorType === 'vibration' ? '#f59e0b' :
                                 sensorType === 'soilMoisture' ? '#22c55e' : '#eab308'}
                          fill={sensorType === 'temperature' ? '#ef4444' : 
                                sensorType === 'humidity' ? '#3b82f6' :
                                sensorType === 'waterLevel' ? '#06b6d4' :
                                sensorType === 'vibration' ? '#f59e0b' :
                                sensorType === 'soilMoisture' ? '#22c55e' : '#eab308'}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Alert Panel */}
        <AlertPanel maxAlerts={15} refreshInterval={30000} />
      </div>
    </div>
  )
}