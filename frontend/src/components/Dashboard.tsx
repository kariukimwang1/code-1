/**
 * Advanced Dashboard Component
 * Real-time data visualization and comprehensive platform management
 * Multi-billion dollar crypto platform frontend
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, Row, Col, Statistic, Progress, Timeline, Alert, Badge, Spin, Switch } from 'antd';
import {
  TrophyOutlined, DollarOutlined, UserOutlined, GlobalOutlined,
  TrendingUpOutlined, FireOutlined, StarOutlined, ThunderboltOutlined,
  TeamOutlined, BankOutlined, RocketOutlined, EyeOutlined, AlertOutlined,
  SettingOutlined, MonitorOutlined, BellOutlined, WalletOutlined,
  GiftOutlined, CrownOutlined, SafetyCertificateOutlined,
  CloudServerOutlined, DatabaseOutlined, ApiOutlined, MobileOutlined
} from '@ant-design/icons';
import { formatNumber, formatCurrency } from '../utils/formatting';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePlatformMetrics } from '../hooks/usePlatformMetrics';
import { RealTimeAnalytics } from '../services/analytics';

interface DashboardProps {
  userId?: string;
  userRole?: 'user' | 'admin' | 'enterprise' | 'super_admin';
  theme?: 'light' | 'dark';
  language?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  userId,
  userRole = 'user',
  theme = 'light',
  language = 'en'
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  const { socket, isConnected, lastMessage } = useWebSocket({
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
    userId,
    reconnectAttempts: 5,
    reconnectInterval: 1000
  });

  const { data: platformMetrics, error: metricsError } = usePlatformMetrics({
    timeframe: selectedTimeframe,
    refreshInterval: autoRefresh ? refreshInterval : null
  });

  // WebSocket message handling
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      handleRealTimeUpdate(message);
    }
  }, [lastMessage]);

  // Initialize dashboard data
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const analytics = new RealTimeAnalytics();
      const [dashboardData, systemAlerts] = await Promise.all([
        analytics.getDashboardData(userId, userRole),
        analytics.getActiveAlerts(userRole)
      ]);

      setMetrics(dashboardData);
      setAlerts(systemAlerts);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = useCallback((message: any) => {
    if (message.type === 'METRICS_UPDATE') {
      setMetrics(prev => ({ ...prev, ...message.data }));
    } else if (message.type === 'ALERT') {
      setAlerts(prev => [message.data, ...prev.slice(0, 4)]);
    } else if (message.type === 'USER_BALANCE_UPDATE') {
      setMetrics(prev => ({
        ...prev,
        user: {
          ...prev?.user,
          balance: message.data.balance,
          earnings: message.data.earnings
        }
      }));
    }
  }, []);

  const revenueData = useMemo(() => {
    if (!metrics?.revenue) return [];
    return metrics.revenue.breakdown.map((item: any) => ({
      name: item.source,
      value: parseFloat(item.amount),
      percentage: item.percentage
    }));
  }, [metrics]);

  const userGrowthData = useMemo(() => {
    if (!metrics?.users) return [];
    return metrics.users.growth.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(),
      users: item.count,
      active: item.active,
      paying: item.paying
    }));
  }, [metrics]);

  const tokenEconomicsData = useMemo(() => {
    if (!metrics?.tokenomics) return [];
    return metrics.tokenomics.supplyDistribution.map((item: any) => ({
      name: item.category,
      value: parseFloat(item.percentage),
      fill: getCategoryColor(item.category)
    }));
  }, [metrics]);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'circulating': '#8884d8',
      'burned': '#82ca9d',
      'staking': '#ffc658',
      'treasury': '#ff7c7c',
      'team': '#8dd1e1',
      'community': '#d084d0'
    };
    return colors[category] || '#8884d8';
  };

  const getPerformanceMetrics = () => {
    if (!metrics) return [];
    return [
      {
        subject: 'Response Time',
        value: metrics.performance?.responseTime || 0,
        fullMark: 100
      },
      {
        subject: 'Uptime',
        value: metrics.performance?.uptime || 0,
        fullMark: 100
      },
      {
        subject: 'User Satisfaction',
        value: metrics.performance?.satisfaction || 0,
        fullMark: 100
      },
      {
        subject: 'Task Completion Rate',
        value: metrics.engagement?.completionRate || 0,
        fullMark: 100
      },
      {
        subject: 'Revenue Growth',
        value: metrics.revenue?.growth || 0,
        fullMark: 100
      },
      {
        subject: 'Network Effects',
        value: metrics.networkEffects?.score || 0,
        fullMark: 100
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  const isEnterprise = ['admin', 'enterprise', 'super_admin'].includes(userRole);

  return (
    <div className="dashboard-container p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header with connection status */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              status={isConnected ? "success" : "error"}
              text={isConnected ? "Connected" : "Disconnected"}
            />
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Auto Refresh:</span>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
          </div>
          <div className="flex items-center gap-2">
            <span>Timeframe:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 border rounded"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
          <button
            onClick={initializeDashboard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              message={alert.message}
              description={alert.description}
              type={alert.type}
              showIcon
              closable
              className="mb-2"
            />
          ))}
        </div>
      )}

      {/* Key Metrics Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={metrics?.users?.total || 0}
              prefix={<UserOutlined />}
              suffix={
                <span className="text-green-500">
                  +{metrics?.users?.growthRate || '0'}%
                </span>
              }
              formatter={(value) => formatNumber(Number(value))}
            />
            <Progress
              percent={metrics?.users?.retention * 100 || 0}
              size="small"
              status="active"
              className="mt-2"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={metrics?.revenue?.monthly || 0}
              prefix={<DollarOutlined />}
              suffix={
                <span className="text-blue-500">
                  +{metrics?.revenue?.growth || '0'}%
                </span>
              }
              formatter={(value) => formatCurrency(Number(value))}
            />
            <div className="mt-2 text-sm text-gray-600">
              MRR: {formatCurrency(metrics?.revenue?.mrr || 0)}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Tasks"
              value={metrics?.engagement?.tasks || 0}
              prefix={<TrophyOutlined />}
              suffix={
                <span className="text-purple-500">
                  {metrics?.engagement?.completionRate || 0}% completion
                </span>
              }
              formatter={(value) => formatNumber(Number(value))}
            />
            <div className="mt-2 text-sm text-gray-600">
              Volume: {formatCurrency(metrics?.engagement?.volume || 0)}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Token Price"
              value={metrics?.tokenomics?.price || 0}
              prefix={<TrendingUpOutlined />}
              suffix="WORK"
              precision={4}
              formatter={(value) => `$${Number(value).toFixed(4)}`}
            />
            <div className="mt-2 text-sm text-gray-600">
              Market Cap: {formatCurrency(metrics?.tokenomics?.marketCap || 0)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* User Growth Chart */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="User Growth" extra={<GlobalOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" name="Total Users" />
                <Line type="monotone" dataKey="active" stroke="#82ca9d" name="Active Users" />
                <Line type="monotone" dataKey="paying" stroke="#ffc658" name="Paying Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Revenue Breakdown" extra={<BankOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Token Economics and Performance */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Token Supply Distribution" extra={<CloudServerOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tokenEconomicsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Performance Metrics" extra={<MonitorOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={getPerformanceMetrics()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Enterprise Features */}
      {isEnterprise && (
        <>
          {/* Enterprise Clients */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={16}>
              <Card title="Enterprise Clients" extra={<TeamOutlined />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics?.enterprise?.clients?.slice(0, 4).map((client: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{client.name}</h4>
                          <p className="text-sm text-gray-600">{client.industry}</p>
                        </div>
                        <Badge status={client.status === 'active' ? 'success' : 'default'} />
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Contract Value:</span>
                          <span>{formatCurrency(client.contractValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate:</span>
                          <span>{client.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Platform Health" extra={<SettingOutlined />}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <span>Server Load</span>
                      <span>{metrics?.health?.serverLoad || 0}%</span>
                    </div>
                    <Progress
                      percent={metrics?.health?.serverLoad || 0}
                      status={metrics?.health?.serverLoad > 80 ? 'exception' : 'normal'}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span>Database Load</span>
                      <span>{metrics?.health?.dbLoad || 0}%</span>
                    </div>
                    <Progress
                      percent={metrics?.health?.dbLoad || 0}
                      status={metrics?.health?.dbLoad > 80 ? 'exception' : 'normal'}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span>Cache Hit Rate</span>
                      <span>{metrics?.health?.cacheHitRate || 0}%</span>
                    </div>
                    <Progress
                      percent={metrics?.health?.cacheHitRate || 0}
                      status={metrics?.health?.cacheHitRate < 80 ? 'exception' : 'normal'}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span>API Response Time</span>
                      <span>{metrics?.health?.apiResponseTime || 0}ms</span>
                    </div>
                    <Progress
                      percent={100 - ((metrics?.health?.apiResponseTime || 0) / 5)}
                      status={metrics?.health?.apiResponseTime > 500 ? 'exception' : 'normal'}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Real-time Activity Feed */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Real-time Activity" extra={<BellOutlined />}>
                <Timeline
                  items={metrics?.activity?.slice(0, 10).map((activity: any, index: number) => ({
                    key: index,
                    dot: <FireOutlined style={{ color: getActivityColor(activity.type) }} />,
                    color: getActivityColor(activity.type),
                    children: (
                      <div>
                        <div className="font-semibold">{activity.title}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* User Dashboard Features */}
      {!isEnterprise && (
        <>
          {/* User Earnings and Activity */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card title="My Earnings" extra={<WalletOutlined />}>
                <div className="space-y-4">
                  <Statistic
                    title="Total Earnings"
                    value={metrics?.user?.totalEarnings || 0}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />

                  <Statistic
                    title="This Month"
                    value={metrics?.user?.monthlyEarnings || 0}
                    prefix={<TrendingUpOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {metrics?.user?.tasksCompleted || 0}
                      </div>
                      <div className="text-sm text-gray-600">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {metrics?.user?.averageRating || 0}/5
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Achievements & Badges" extra={<TrophyOutlined />}>
                <div className="grid grid-cols-4 gap-4">
                  {metrics?.user?.achievements?.slice(0, 8).map((achievement: any, index: number) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <div className="text-sm font-medium">{achievement.name}</div>
                      <Badge count={achievement.level} size="small" />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Recommended Opportunities */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Recommended Opportunities" extra={<StarOutlined />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metrics?.recommendations?.slice(0, 6).map((opportunity: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <Badge text={opportunity.type} color="blue" />
                        <span className="text-lg font-bold text-green-500">
                          {opportunity.earnings}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{opportunity.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{opportunity.estimatedTime}</span>
                        <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Network Status */}
      <Card title="Network Status" className="mb-6" extra={<ApiOutlined />}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <DatabaseOutlined />
              <span>Database</span>
            </div>
            <Badge status={metrics?.networkStatus?.database === 'healthy' ? 'success' : 'error'} />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <CloudServerOutlined />
              <span>API Gateway</span>
            </div>
            <Badge status={metrics?.networkStatus?.api === 'healthy' ? 'success' : 'error'} />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <MobileOutlined />
              <span>Mobile App</span>
            </div>
            <Badge status={metrics?.networkStatus?.mobile === 'healthy' ? 'success' : 'error'} />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <RocketOutlined />
              <span>Blockchain</span>
            </div>
            <Badge status={metrics?.networkStatus?.blockchain === 'healthy' ? 'success' : 'error'} />
          </div>
        </div>
      </Card>
    </div>
  );
};

const getActivityColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'task_completed': '#52c41a',
    'user_joined': '#1890ff',
    'revenue': '#f5222d',
    'milestone': '#faad14',
    'alert': '#fa8c16',
    'announcement': '#722ed1'
  };
  return colors[type] || '#1890ff';
};

export default Dashboard;