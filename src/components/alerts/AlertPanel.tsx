'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react'

interface AlertData {
  id: string
  deviceId: string
  deviceName: string
  location: string
  sensorType: string
  value: number
  unit: string
  thresholdMin?: number
  thresholdMax?: number
  alertType: 'LOW' | 'HIGH'
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface AlertPanelProps {
  maxAlerts?: number
  refreshInterval?: number
}

export function AlertPanel({ maxAlerts = 10, refreshInterval = 30000 }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/alerts?limit=${maxAlerts}`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAlerts, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [maxAlerts, refreshInterval])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive'
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-4 w-4" />
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4" />
      case 'LOW':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSensorName = (sensorType: string) => {
    switch (sensorType) {
      case 'TEMPERATURE':
        return 'Suhu'
      case 'HUMIDITY':
        return 'Kelembaban Udara'
      case 'WATER_LEVEL':
        return 'Ketinggian Air'
      case 'VIBRATION':
        return 'Getaran'
      case 'SOIL_MOISTURE':
        return 'Kelembaban Tanah'
      case 'LIGHT':
        return 'Intensitas Cahaya'
      default:
        return sensorType
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAlertMessage = (alert: AlertData) => {
    const sensorName = getSensorName(alert.sensorType)
    
    if (alert.alertType === 'LOW') {
      return `${sensorName} terlalu rendah: ${alert.value} ${alert.unit} (min: ${alert.thresholdMin} ${alert.unit})`
    } else {
      return `${sensorName} terlalu tinggi: ${alert.value} ${alert.unit} (max: ${alert.thresholdMax} ${alert.unit})`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Threshold violations and system warnings
              {alerts.length > 0 && (
                <span className="ml-2 text-sm font-medium">
                  ({alerts.length} active alerts)
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-sm text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString('id-ID')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {alert.deviceName} - {alert.location}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.alertType}
                        </Badge>
                      </div>
                    </div>
                    <AlertDescription className="text-sm">
                      {getAlertMessage(alert)}
                    </AlertDescription>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}