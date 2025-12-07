"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Settings, Plus, Eye, EyeOff, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { DeviceType, SensorType } from '@prisma/client'

interface Device {
  id: string
  name: string
  location: string
  deviceType: DeviceType
  deviceId: string
  isActive: boolean
  apiKey: string
  thresholdMin?: number
  thresholdMax?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  _count: {
    sensorData: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    location: '',
    deviceType: '' as DeviceType,
    thresholdMin: '',
    thresholdMax: ''
  })
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchDevices()
    }
  }, [status, session, router])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      if (response.ok) {
        const data = await response.json()
        setDevices(data.data)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDevice,
          userId: session?.user?.id,
          thresholdMin: newDevice.thresholdMin ? parseFloat(newDevice.thresholdMin) : null,
          thresholdMax: newDevice.thresholdMax ? parseFloat(newDevice.thresholdMax) : null,
        }),
      })

      if (response.ok) {
        setAlert({ type: 'success', message: 'Device berhasil ditambahkan' })
        setShowAddDevice(false)
        setNewDevice({
          name: '',
          location: '',
          deviceType: '' as DeviceType,
          thresholdMin: '',
          thresholdMax: ''
        })
        fetchDevices()
      } else {
        setAlert({ type: 'error', message: 'Gagal menambahkan device' })
      }
    } catch (error) {
      console.error('Error adding device:', error)
      setAlert({ type: 'error', message: 'Terjadi kesalahan' })
    }
  }

  const toggleDeviceStatus = async (deviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        fetchDevices()
      }
    } catch (error) {
      console.error('Error toggling device status:', error)
    }
  }

  const getDeviceTypeLabel = (type: DeviceType) => {
    switch (type) {
      case DeviceType.ESP32_1:
        return 'ESP32 #1 - Suhu & Air'
      case DeviceType.ESP32_2:
        return 'ESP32 #2 - Tanah & Getaran'
      default:
        return type
    }
  }

  const getDeviceSensors = (type: DeviceType) => {
    switch (type) {
      case DeviceType.ESP32_1:
        return [SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.WATER_LEVEL]
      case DeviceType.ESP32_2:
        return [SensorType.VIBRATION, SensorType.SOIL_MOISTURE, SensorType.LIGHT]
      default:
        return []
    }
  }

  const getSensorLabel = (sensor: SensorType) => {
    switch (sensor) {
      case SensorType.TEMPERATURE:
        return 'Suhu'
      case SensorType.HUMIDITY:
        return 'Kelembaban Udara'
      case SensorType.WATER_LEVEL:
        return 'Ketinggian Air'
      case SensorType.VIBRATION:
        return 'Getaran'
      case SensorType.SOIL_MOISTURE:
        return 'Kelembaban Tanah'
      case SensorType.LIGHT:
        return 'Intensitas Cahaya'
      default:
        return sensor
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Kelola perangkat ESP32 dan konfigurasi monitoring</p>
          </div>
          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Device Baru</DialogTitle>
                <DialogDescription>
                  Registrasi device ESP32 baru untuk monitoring
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Device</Label>
                  <Input
                    id="name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="ESP32 Device 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    placeholder="Jakarta"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceType">Tipe Device</Label>
                  <Select
                    value={newDevice.deviceType}
                    onValueChange={(value) => setNewDevice({ ...newDevice, deviceType: value as DeviceType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DeviceType.ESP32_1}>ESP32 #1 - Suhu & Air</SelectItem>
                      <SelectItem value={DeviceType.ESP32_2}>ESP32 #2 - Tanah & Getaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thresholdMin">Threshold Min</Label>
                    <Input
                      id="thresholdMin"
                      type="number"
                      value={newDevice.thresholdMin}
                      onChange={(e) => setNewDevice({ ...newDevice, thresholdMin: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thresholdMax">Threshold Max</Label>
                    <Input
                      id="thresholdMax"
                      type="number"
                      value={newDevice.thresholdMax}
                      onChange={(e) => setNewDevice({ ...newDevice, thresholdMax: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDevice(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Tambah Device</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
              <p className="text-xs text-muted-foreground">ESP32 terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.filter(d => d.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Sedang aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.reduce((acc, device) => acc + device._count.sensorData, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Data sensor terkumpul</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Threshold</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.filter(d => d.thresholdMin !== null || d.thresholdMax !== null).length}
              </div>
              <p className="text-xs text-muted-foreground">Dengan threshold</p>
            </CardContent>
          </Card>
        </div>

        {/* Device Management */}
        <Card>
          <CardHeader>
            <CardTitle>Device Management</CardTitle>
            <CardDescription>
              Kelola semua perangkat ESP32 dan konfigurasinya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sensors</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Data Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell>{getDeviceTypeLabel(device.deviceType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={device.isActive}
                          onCheckedChange={(checked) => toggleDeviceStatus(device.id, checked)}
                        />
                        <Badge variant={device.isActive ? 'default' : 'secondary'}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getDeviceSensors(device.deviceType).map((sensor) => (
                          <Badge key={sensor} variant="outline" className="text-xs">
                            {getSensorLabel(sensor)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {device.thresholdMin !== null || device.thresholdMax !== null ? (
                        <div className="text-sm">
                          {device.thresholdMin !== null && `Min: ${device.thresholdMin}`}
                          {device.thresholdMin !== null && device.thresholdMax !== null && ' | '}
                          {device.thresholdMax !== null && `Max: ${device.thresholdMax}`}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{device._count.sensorData}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(device.apiKey)
                            setAlert({ type: 'success', message: 'API Key copied to clipboard' })
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}