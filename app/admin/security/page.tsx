'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, AlertTriangle, CheckCircle, Clock, Ban, Eye } from 'lucide-react'

interface SecurityEvent {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: Date
  status: 'open' | 'investigating' | 'resolved'
  ipAddress: string
  userId?: string
}

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Mock security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'suspicious_login',
        severity: 'high',
        title: 'Multiple Failed Login Attempts',
        description: 'User account had 5 failed login attempts from unknown IP',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        status: 'investigating',
        ipAddress: '192.168.1.100',
        userId: 'user123'
      },
      {
        id: '2',
        type: 'unusual_access',
        severity: 'medium',
        title: 'Access from Unusual Location',
        description: 'Admin access detected from new geographic location',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: 'resolved',
        ipAddress: '203.0.113.45',
        userId: 'admin456'
      },
      {
        id: '3',
        type: 'brute_force',
        severity: 'critical',
        title: 'Brute Force Attack Detected',
        description: 'Multiple login attempts on admin accounts from suspicious IP range',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        status: 'resolved',
        ipAddress: '203.0.113.0/24'
      }
    ]

    setTimeout(() => {
      setEvents(mockEvents)
      setLoading(false)
    }, 1000)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />
      case 'investigating': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredEvents = events.filter(event =>
    filter === 'all' || event.severity === filter
  )

  const securityMetrics = {
    totalEvents: events.length,
    criticalEvents: events.filter(e => e.severity === 'critical').length,
    highEvents: events.filter(e => e.severity === 'high').length,
    openInvestigations: events.filter(e => e.status === 'open' || e.status === 'investigating').length,
    resolvedToday: events.filter(e => e.status === 'resolved').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Security Monitoring</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Monitoring</h1>
          <p className="text-muted-foreground">Monitor and respond to security events</p>
        </div>
        <Button>
          <Eye className="mr-2 h-4 w-4" />
          View Logs
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.criticalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{securityMetrics.highEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Investigations</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{securityMetrics.openInvestigations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{securityMetrics.resolvedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Recent security events and incidents</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter events..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-40"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Events</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No security events found
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(event.status)}
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {event.timestamp.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">"</span>
                        <span className="text-xs text-muted-foreground">
                          {event.ipAddress}
                        </span>
                        {event.userId && (
                          <>
                            <span className="text-xs text-muted-foreground">"</span>
                            <span className="text-xs text-muted-foreground">
                              User: {event.userId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <Badge variant="outline">
                      {event.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}