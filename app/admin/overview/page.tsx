'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Alert,
  Tabs,
  List,
  Avatar,
  Timeline,
  Badge,
  Tooltip,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  MiningOutlined,
  SecurityScanOutlined,
  TrophyOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  BarChartOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  ShieldCheckOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalMiningPower: number;
  dailyRevenue: number;
  totalTransactions: number;
  systemHealth: number;
  securityScore: number;
  uptime: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  kycLevel: 0 | 1 | 2;
  balance: number;
  lastActivity: Date;
  riskScore: number;
  joinDate: Date;
  country: string;
  deviceCount: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved';
  userId?: string;
  ipAddress: string;
}

interface SystemEvent {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  source: string;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [systemStatusModalVisible, setSystemStatusModalVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOverviewData();
    if (autoRefresh) {
      const interval = setInterval(fetchOverviewData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchOverviewData = async () => {
    try {
      const [metricsResponse, usersResponse, alertsResponse, eventsResponse] = await Promise.all([
        fetch('/api/admin/overview/metrics').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/security/alerts').then(r => r.json()),
        fetch('/api/admin/system/events').then(r => r.json()),
      ]);

      setMetrics(metricsResponse.data);
      setUsers(usersResponse.data);
      setSecurityAlerts(alertsResponse.data);
      setSystemEvents(eventsResponse.data);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      message.error('Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        message.success(`User ${action} successful`);
        fetchOverviewData();
      } else {
        message.error(`Failed to ${action} user`);
      }
    } catch (error) {
      message.error(`Error ${action} user`);
    }
  };

  const handleSystemStatusChange = async (field: string, value: boolean) => {
    try {
      const response = await fetch('/api/admin/system/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        message.success(`System ${field} ${value ? 'enabled' : 'disabled'}`);
        fetchOverviewData();
      }
    } catch (error) {
      message.error(`Failed to update system status`);
    }
  };

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          inactive: 'orange',
          suspended: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'KYC Level',
      dataIndex: 'kycLevel',
      key: 'kycLevel',
      render: (level: number) => (
        <div>
          <Tag color={level === 2 ? 'green' : level === 1 ? 'blue' : 'orange'}>
            Level {level}
          </Tag>
          {level < 2 && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>⚠</span>}
        </div>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `$${balance.toFixed(2)}`,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score > 70 ? '#ff4d4f' : score > 40 ? '#faad14' : '#52c41a'}
        />
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setUserModalVisible(true);
            }}
          />
          {record.status === 'active' && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleUserAction('suspend', record.id)}
            />
          )}
          {record.status === 'suspended' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleUserAction('activate', record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const securityAlertColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          critical: 'magenta',
        };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Alert',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          open: 'red',
          investigating: 'orange',
          resolved: 'green',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
  ];

  const getUserDistribution = () => {
    const distribution = users.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const getRevenueData = () => {
    // Generate sample data for the last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        revenue: Math.floor(Math.random() * 10000) + 5000,
        users: Math.floor(Math.random() * 100) + 50,
      });
    }
    return data;
  };

  if (loading && !metrics) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Overview</h1>
        <Space>
          <Tooltip title="Auto-refresh every 30 seconds">
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="Auto"
              unCheckedChildren="Manual"
            />
          </Tooltip>
          <Button icon={<SyncOutlined />} onClick={fetchOverviewData}>
            Refresh
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setSystemStatusModalVisible(true)}>
            System Settings
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={metrics?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              {metrics?.activeUsers || 0} active today
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Mining Power"
              value={metrics?.totalMiningPower || 0}
              suffix="TH/s"
              prefix={<MiningOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Network: {metrics?.totalMiningPower ? '0.1%' : '0%'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Daily Revenue"
              value={metrics?.dailyRevenue || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              {metrics?.totalTransactions || 0} transactions
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="System Health"
              value={metrics?.systemHealth || 0}
              suffix="%"
              prefix={<ShieldCheckOutlined />}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Security: {metrics?.securityScore || 0}/100
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alert for critical issues */}
      {(securityAlerts.filter(alert => alert.severity === 'critical').length > 0) && (
        <Alert
          message="Critical Security Alerts Require Attention"
          description={`There are ${securityAlerts.filter(alert => alert.severity === 'critical').length} critical security alerts that need immediate attention.`}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      <Tabs defaultActiveKey="users" size="large">
        <TabPane tab={<span><UserOutlined />Users</span>} key="users">
          <Card title="User Management">
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><BarChartOutlined />Analytics</span>} key="analytics">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Revenue Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1890ff" name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="users" stroke="#52c41a" name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="User Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getUserDistribution()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {getUserDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><SecurityScanOutlined />Security</span>} key="security">
          <Card title="Security Alerts">
            <Table
              columns={securityAlertColumns}
              dataSource={securityAlerts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><DatabaseOutlined />System Events</span>} key="events">
          <Card title="System Events Timeline">
            <Timeline>
              {systemEvents.slice(0, 10).map((event) => (
                <Timeline.Item
                  key={event.id}
                  dot={
                    event.severity === 'error' ? (
                      <ExclamationCircleOutlined style={{ color: 'red' }} />
                    ) : event.severity === 'warning' ? (
                      <AlertOutlined style={{ color: 'orange' }} />
                    ) : (
                      <CheckCircleOutlined style={{ color: 'green' }} />
                    )
                  }
                >
                  <div style={{ marginBottom: '8px' }}>
                    <strong>{event.message}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {event.source} • {new Date(event.timestamp).toLocaleString()}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane tab={<span><GlobalOutlined />Global</span>} key="global">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="System Status">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Mining Operations</span>
                    <Switch defaultChecked onChange={(checked) => handleSystemStatusChange('mining', checked)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Transaction Processing</span>
                    <Switch defaultChecked onChange={(checked) => handleSystemStatusChange('transactions', checked)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>User Registration</span>
                    <Switch defaultChecked onChange={(checked) => handleSystemStatusChange('registration', checked)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>API Access</span>
                    <Switch defaultChecked onChange={(checked) => handleSystemStatusChange('api', checked)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Mobile App Access</span>
                    <Switch defaultChecked onChange={(checked) => handleSystemStatusChange('mobile', checked)} />
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Quick Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button block type="primary" icon={<SyncOutlined />}>
                    Sync All Data
                  </Button>
                  <Button block icon={<SecurityScanOutlined />}>
                    Run Security Scan
                  </Button>
                  <Button block icon={<DatabaseOutlined />}>
                    Backup Database
                  </Button>
                  <Button block icon={<BarChartOutlined />}>
                    Generate Report
                  </Button>
                  <Button block icon={<AlertOutlined />}>
                    Check System Health
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* User Details Modal */}
      <Modal
        title="User Details"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Avatar size={64} icon={<UserOutlined />} />
              </Col>
              <Col span={16}>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <Space>
                  <Tag color={selectedUser.status === 'active' ? 'green' : 'red'}>
                    {selectedUser.status}
                  </Tag>
                  <Tag>KYC Level {selectedUser.kycLevel}</Tag>
                </Space>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <strong>Balance:</strong> ${selectedUser.balance.toFixed(2)}
              </Col>
              <Col span={12}>
                <strong>Country:</strong> {selectedUser.country}
              </Col>
              <Col span={12}>
                <strong>Devices:</strong> {selectedUser.deviceCount}
              </Col>
              <Col span={12}>
                <strong>Joined:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* System Status Modal */}
      <Modal
        title="System Settings"
        open={systemStatusModalVisible}
        onCancel={() => setSystemStatusModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Maintenance Mode">
            <Switch />
          </Form.Item>
          <Form.Item label="Debug Mode">
            <Switch />
          </Form.Item>
          <Form.Item label="API Rate Limiting">
            <Select defaultValue="1000" style={{ width: '100%' }}>
              <Option value="100">100/hour</Option>
              <Option value="1000">1000/hour</Option>
              <Option value="10000">10000/hour</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Log Level">
            <Select defaultValue="info" style={{ width: '100%' }}>
              <Option value="debug">Debug</Option>
              <Option value="info">Info</Option>
              <Option value="warn">Warning</Option>
              <Option value="error">Error</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}