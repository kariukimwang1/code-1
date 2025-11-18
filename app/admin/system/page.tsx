'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Timeline,
  Space,
  Button,
  Switch,
  Select,
  InputNumber,
  message,
  Modal,
  Form,
  Tabs,
  Table,
  Tag,
  Tooltip,
  Badge,
} from 'antd';
import {
  DatabaseOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  SyncOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  MonitorOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const { TabPane } = Tabs;
const { Option } = Select;

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
  cache: {
    hitRate: number;
    memory: number;
  };
  uptime: number;
  responseTime: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastCheck: Date;
  dependencies: string[];
  metrics?: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Alert {
  id: string;
  type: 'performance' | 'security' | 'availability' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'open' | 'acknowledged' | 'resolved';
  actions?: Array<{
    type: string;
    description: string;
    automated: boolean;
  }>;
}

export default function SystemManagement() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [systemSettingsModalVisible, setSystemSettingsModalVisible] = useState(false);
  const [emergencyModeModalVisible, setEmergencyModeModalVisible] = useState(false);

  useEffect(() => {
    fetchSystemData();
    if (autoRefresh) {
      const interval = setInterval(fetchSystemData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemData = async () => {
    try {
      const [metricsResponse, servicesResponse, logsResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/system/metrics').then(r => r.json()),
        fetch('/api/admin/system/services').then(r => r.json()),
        fetch('/api/admin/system/logs').then(r => r.json()),
        fetch('/api/admin/system/alerts').then(r => r.json()),
      ]);

      setMetrics(metricsResponse.data);
      setServices(servicesResponse.data);
      setLogs(logsResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error fetching system data:', error);
      message.error('Failed to fetch system data');
    }
  };

  const handleServiceToggle = async (serviceName: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/system/services/${serviceName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        message.success(`${serviceName} ${enabled ? 'started' : 'stopped'} successfully`);
        fetchSystemData();
      } else {
        message.error(`Failed to ${enabled ? 'start' : 'stop'} ${serviceName}`);
      }
    } catch (error) {
      message.error(`Error toggling ${serviceName}`);
    }
  };

  const handleEmergencyMode = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/system/emergency-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        message.success(`Emergency mode ${enabled ? 'enabled' : 'disabled'}`);
        fetchSystemData();
        setEmergencyModeModalVisible(false);
      } else {
        message.error('Failed to toggle emergency mode');
      }
    } catch (error) {
      message.error('Error toggling emergency mode');
    }
  };

  const handleSystemRestart = async (serviceName: string) => {
    try {
      const response = await fetch(`/api/admin/system/restart/${serviceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        message.success(`${serviceName} restart initiated`);
        fetchSystemData();
      } else {
        message.error(`Failed to restart ${serviceName}`);
      }
    } catch (error) {
      message.error(`Error restarting ${serviceName}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'green',
      degraded: 'orange',
      down: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getLogLevelIcon = (level: string) => {
    const icons = {
      info: <InfoCircleOutlined />,
      warning: <WarningOutlined />,
      error: <ExclamationCircleOutlined />,
      critical: <ExclamationCircleOutlined />,
    };
    return icons[level as keyof typeof icons];
  };

  const getLogLevelColor = (level: string) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'magenta',
    };
    return colors[level as keyof typeof colors];
  };

  const getPerformanceData = () => {
    // Generate sample data for the last hour
    const data = [];
    for (let i = 60; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60000);
      data.push({
        time: time.toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 1000,
        responseTime: Math.random() * 500 + 50,
      });
    }
    return data;
  };

  const getServiceStatusData = () => {
    const statusCount = services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const getAlertSeverityData = () => {
    const severityCount = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCount).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (!metrics) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading system data...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>System Management</h1>
        <Space>
          <Badge count={alerts.filter(a => a.status === 'open').length} size="small">
            <Button icon={<SettingOutlined />} onClick={() => setSystemSettingsModalVisible(true)}>
              System Settings
            </Button>
          </Badge>
          <Badge count={alerts.filter(a => a.severity === 'critical').length} size="small">
            <Button danger icon={<StopOutlined />} onClick={() => setEmergencyModeModalVisible(true)}>
              Emergency Mode
            </Button>
          </Badge>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren="Auto"
            unCheckedChildren="Manual"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchSystemData}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'critical' && a.status === 'open').length > 0 && (
        <Alert
          message="Critical System Alerts"
          description={`${alerts.filter(a => a.severity === 'critical' && a.status === 'open').length} critical alerts require immediate attention.`}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* System Metrics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={metrics.cpu}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: metrics.cpu > 80 ? '#ff4d4f' : metrics.cpu > 60 ? '#faad14' : '#52c41a' }}
            />
            <Progress
              percent={metrics.cpu}
              size="small"
              strokeColor={metrics.cpu > 80 ? '#ff4d4f' : metrics.cpu > 60 ? '#faad14' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={metrics.memory}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: metrics.memory > 80 ? '#ff4d4f' : metrics.memory > 60 ? '#faad14' : '#52c41a' }}
            />
            <Progress
              percent={metrics.memory}
              size="small"
              strokeColor={metrics.memory > 80 ? '#ff4d4f' : metrics.memory > 60 ? '#faad14' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Disk Usage"
              value={metrics.disk}
              suffix="%"
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: metrics.disk > 80 ? '#ff4d4f' : metrics.disk > 60 ? '#faad14' : '#52c41a' }}
            />
            <Progress
              percent={metrics.disk}
              size="small"
              strokeColor={metrics.disk > 80 ? '#ff4d4f' : metrics.disk > 60 ? '#faad14' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Response Time"
              value={metrics.responseTime}
              suffix="ms"
              prefix={<ApiOutlined />}
              valueStyle={{ color: metrics.responseTime > 500 ? '#ff4d4f' : metrics.responseTime > 200 ? '#faad14' : '#52c41a' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Uptime: {(metrics.uptime / 3600).toFixed(1)}h
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" size="large">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="System Performance">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line yAxisId="left" type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                    <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#ffc658" name="Response Time (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Service Status">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getServiceStatusData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {getServiceStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Services" key="services">
          <Card title="System Services">
            <div style={{ marginBottom: '16px' }}>
              <Button icon={<ReloadOutlined />} onClick={() => fetchSystemData()}>
                Refresh Services
              </Button>
            </div>
            <Row gutter={[16, 16]}>
              {services.map((service) => (
                <Col xs={24} sm={12} md={8} lg={6} key={service.name}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <Tag color={getStatusColor(service.status)}>
                          {service.status.toUpperCase()}
                        </Tag>
                        <span>{service.name}</span>
                      </Space>
                    }
                    extra={
                      <Switch
                        checked={service.status === 'healthy'}
                        onChange={(checked) => handleServiceToggle(service.name, checked)}
                        size="small"
                      />
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <span>Uptime: </span>
                        <Progress
                          percent={service.uptime}
                          size="small"
                          style={{ width: '100px', display: 'inline-block' }}
                        />
                      </div>
                      {service.metrics && (
                        <>
                          <div style={{ fontSize: '12px' }}>
                            Response: {service.metrics.responseTime}ms | Error Rate: {service.metrics.errorRate}%
                          </div>
                          <div style={{ fontSize: '12px' }}>
                            Throughput: {service.metrics.throughput}/s
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                      </div>
                      <Space>
                        <Button
                          size="small"
                          icon={<SyncOutlined />}
                          onClick={() => handleSystemRestart(service.name)}
                        >
                          Restart
                        </Button>
                        <Button
                          size="small"
                          icon={<MonitorOutlined />}
                        >
                          Details
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="Database" key="database">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Database Metrics">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <span>Connections: </span>
                    <Progress
                      percent={(metrics.database.connections / metrics.database.maxConnections) * 100}
                      format={() => `${metrics.database.connections}/${metrics.database.maxConnections}`}
                      size="small"
                    />
                  </div>
                  <div>
                    <span>Query Time: </span>
                    <span style={{ fontWeight: 'bold', color: metrics.database.queryTime > 100 ? '#ff4d4f' : '#52c41a' }}>
                      {metrics.database.queryTime}ms
                    </span>
                  </div>
                  <div>
                    <span>Cache Hit Rate: </span>
                    <Progress
                      percent={metrics.cache.hitRate}
                      size="small"
                      strokeColor={metrics.cache.hitRate > 90 ? '#52c41a' : '#faad14'}
                    />
                  </div>
                  <div>
                    <span>Cache Memory: </span>
                    <Progress
                      percent={metrics.cache.memory}
                      size="small"
                    />
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Quick Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button block icon={<SyncOutlined />}>
                    Optimize Database
                  </Button>
                  <Button block icon={<DatabaseOutlined />}>
                    Run Backup
                  </Button>
                  <Button block icon={<ReloadOutlined />}>
                    Clear Cache
                  </Button>
                  <Button block icon={<SettingOutlined />}>
                    View Logs
                  </Button>
                  <Button block icon={<MonitorOutlined />}>
                    Performance Analysis
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Network" key="network">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Network Performance">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <span>Upload Speed: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {(metrics.network.upload / 1024).toFixed(2)} MB/s
                    </span>
                  </div>
                  <div>
                    <span>Download Speed: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {(metrics.network.download / 1024).toFixed(2)} MB/s
                    </span>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Network Health">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>API Gateway</span>
                    <Tag color="green">Healthy</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Load Balancer</span>
                    <Tag color="green">Healthy</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CDN</span>
                    <Tag color="green">Healthy</Tag>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Alerts" key="alerts">
          <Card title="System Alerts">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <span>Filter by severity:</span>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All</Option>
                  <Option value="critical">Critical</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Space>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getAlertSeverityData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {getAlertSeverityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ff4d4f', '#faad14', '#1890ff', '#52c41a'][index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Timeline>
              {alerts.slice(0, 10).map((alert) => (
                <Timeline.Item
                  key={alert.id}
                  dot={
                    alert.severity === 'critical' ? (
                      <ExclamationCircleOutlined style={{ color: 'red' }} />
                    ) : alert.severity === 'high' ? (
                      <WarningOutlined style={{ color: 'orange' }} />
                    ) : (
                      <InfoCircleOutlined style={{ color: 'blue' }} />
                    )
                  }
                  color={
                    alert.severity === 'critical' ? 'red' :
                    alert.severity === 'high' ? 'orange' :
                    alert.severity === 'medium' ? 'blue' : 'green'
                  }
                >
                  <div style={{ marginBottom: '8px' }}>
                    <strong>{alert.title}</strong>
                    <Tag color={
                      alert.severity === 'critical' ? 'red' :
                      alert.severity === 'high' ? 'orange' :
                      alert.severity === 'medium' ? 'blue' : 'green'
                    } style={{ marginLeft: '8px' }}>
                      {alert.severity.toUpperCase()}
                    </Tag>
                    <Tag color={
                      alert.status === 'open' ? 'red' :
                      alert.status === 'acknowledged' ? 'orange' : 'green'
                    } style={{ marginLeft: '4px' }}>
                      {alert.status.toUpperCase()}
                    </Tag>
                  </div>
                  <p>{alert.description}</p>
                  <small>{new Date(alert.timestamp).toLocaleString()}</small>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane tab="Logs" key="logs">
          <Card title="System Logs">
            <Timeline>
              {logs.slice(0, 15).map((log) => (
                <Timeline.Item
                  key={log.id}
                  dot={getLogLevelIcon(log.level)}
                  color={getLogLevelColor(log.level)}
                >
                  <div style={{ marginBottom: '4px' }}>
                    <Tag color={getLogLevelColor(log.level)}>{log.level.toUpperCase()}</Tag>
                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{log.service}</span>
                  </div>
                  <p>{log.message}</p>
                  <small>{new Date(log.timestamp).toLocaleString()}</small>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      {/* System Settings Modal */}
      <Modal
        title="System Settings"
        open={systemSettingsModalVisible}
        onCancel={() => setSystemSettingsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSystemSettingsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={() => setSystemSettingsModalVisible(false)}>
            Apply
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Auto Refresh Interval">
            <Select defaultValue="5" style={{ width: '100%' }}>
              <Option value="1">1 second</Option>
              <Option value="5">5 seconds</Option>
              <Option value="10">10 seconds</Option>
              <Option value="30">30 seconds</Option>
              <Option value="60">1 minute</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Alert Thresholds">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>CPU Usage:</span>
                <InputNumber min={0} max={100} defaultValue={80} suffix="%" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Memory Usage:</span>
                <InputNumber min={0} max={100} defaultValue={80} suffix="%" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Response Time:</span>
                <InputNumber min={0} max={1000} defaultValue={500} suffix="ms" />
              </div>
            </Space>
          </Form.Item>
          <Form.Item label="Log Retention">
            <Select defaultValue="7" style={{ width: '100%' }}>
              <Option value="1">1 day</Option>
              <Option value="7">7 days</Option>
              <Option value="30">30 days</Option>
              <Option value="90">90 days</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Emergency Mode Modal */}
      <Modal
        title="Emergency Mode"
        open={emergencyModeModalVisible}
        onCancel={() => setEmergencyModeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmergencyModeModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="emergency" danger type="primary" onClick={() => handleEmergencyMode(true)}>
            Enable Emergency Mode
          </Button>,
        ]}
      >
        <Alert
          message="⚠️ Emergency Mode Warning"
          description="Emergency mode will disable non-essential services and activate maximum security monitoring. This should only be used in critical situations."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <p>
          Emergency mode will:
        </p>
        <ul>
          <li>Disable user registrations and logins</li>
          <li>Stop all mining operations</li>
          <li>Halt all financial transactions</li>
          <li>Activate maximum security monitoring</li>
          <li>Enable system-wide logging</li>
          <li>Send critical alerts to all administrators</li>
        </ul>
      </Modal>
    </div>
  );
}