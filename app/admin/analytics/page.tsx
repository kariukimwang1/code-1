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
  Select,
  DatePicker,
  RangePickerProps,
  message,
  Tabs,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  DollarOutlined,
  UserOutlined,
  TrendingUpOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new: number;
    retention: number;
    demographics: Array<{
      country: string;
      users: number;
      percentage: number;
    }>;
  };
  financial: {
    totalRevenue: number;
    dailyRevenue: number;
    monthlyRevenue: number;
    transactionVolume: number;
    averageTransaction: number;
    revenueBySource: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      transactions: number;
    }>;
  };
  mining: {
    totalHashrate: number;
    activeMiners: number;
    dailyEarnings: number;
    efficiency: number;
    distribution: Array<{
      range: string;
      users: number;
      percentage: number;
    }>;
    performance: Array<{
      date: string;
      hashrate: number;
      earnings: number;
      efficiency: number;
    }>;
  };
  platform: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    activeFeatures: Array<{
      feature: string;
      usage: number;
      growth: number;
    }>;
  };
}

interface Report {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  generatedAt: Date;
  data: AnalyticsData;
  fileUrl?: string;
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any]>([
    startOfDay(subDays(new Date(), 30)),
    endOfDay(new Date()),
  ]);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
    fetchReports();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange[0],
          endDate: dateRange[1],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        message.error('Failed to fetch analytics data');
      }
    } catch (error) {
      message.error('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/analytics/reports');
      const data = await response.json();
      setReports(data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const generateReport = async (type: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    try {
      const response = await fetch('/api/admin/analytics/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format,
          dateRange,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        message.success(`${type.toUpperCase()} report generated successfully`);

        // Download the report
        if (data.fileUrl) {
          const link = document.createElement('a');
          link.href = data.fileUrl;
          link.download = `${type}_${format}.${format}`;
          link.click();
        }

        fetchReports();
      } else {
        message.error('Failed to generate report');
      }
    } catch (error) {
      message.error('Error generating report');
    }
  };

  const exportData = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value', 'Date'],
      ['Total Users', analyticsData.users.total.toString(), new Date().toISOString()],
      ['Active Users', analyticsData.users.active.toString(), new Date().toISOString()],
      ['New Users', analyticsData.users.new.toString(), new Date().toISOString()],
      ['Total Revenue', analyticsData.financial.totalRevenue.toString(), new Date().toISOString()],
      ['Daily Revenue', analyticsData.financial.dailyRevenue.toString(), new Date().toISOString()],
      ['Total Hashrate', analyticsData.mining.totalHashrate.toString(), new Date().toISOString()],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (!analyticsData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading analytics data...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Analytics & Reporting</h1>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
            format="YYYY-MM-DD"
          />
          <Button icon={<DownloadOutlined />} onClick={exportData}>
            Export Data
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchAnalyticsData}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Key Metrics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={analyticsData.users.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#666' }}>
                  +{analyticsData.users.new} today
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Daily Revenue"
              value={analyticsData.financial.dailyRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Active Miners"
              value={analyticsData.mining.activeMiners}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={analyticsData.platform.uptime}
              suffix="%"
              prefix={<TrendingUpOutlined />}
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" size="large">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Revenue Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.financial.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="transactions"
                      stroke="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Mining Performance">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.mining.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" />
                    <RechartsTooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="hashrate"
                      stroke="#ff7300"
                      name="Hashrate (TH/s)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="earnings"
                      stroke="#00C49F"
                      name="Earnings ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Users" key="users">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="User Growth">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.users.demographics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="User Demographics">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData.users.demographics}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                      label={({ country, percentage }) => `${country} (${percentage}%)`}
                    >
                      {analyticsData.users.demographics.map((entry, index) => (
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

        <TabPane tab="Financial" key="financial">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Revenue by Source">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.financial.revenueBySource}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Financial Metrics">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Revenue:</span>
                    <strong>${analyticsData.financial.totalRevenue.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Daily Revenue:</span>
                    <strong>${analyticsData.financial.dailyRevenue.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Monthly Revenue:</span>
                    <strong>${analyticsData.financial.monthlyRevenue.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avg Transaction:</span>
                    <strong>${analyticsData.financial.averageTransaction.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Transaction Volume:</span>
                    <strong>{analyticsData.financial.transactionVolume}</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Mining" key="mining">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Mining Hashrate Distribution">
                <ResponsiveContainer width="100%" height={400}>
                  <Treemap
                    data={[
                      {
                        name: '0-10 TH/s',
                        size: analyticsData.mining.distribution.find(d => d.range === '0-10 TH/s')?.users || 0,
                        fill: '#FF6B6B',
                      },
                      {
                        name: '10-50 TH/s',
                        size: analyticsData.mining.distribution.find(d => d.range === '10-50 TH/s')?.users || 0,
                        fill: '#4ECDC4',
                      },
                      {
                        name: '50-100 TH/s',
                        size: analyticsData.mining.distribution.find(d => d.range === '50-100 TH/s')?.users || 0,
                        fill: '#45B7D1',
                      },
                      {
                        name: '100+ TH/s',
                        size: analyticsData.mining.distribution.find(d => d.range === '100+ TH/s')?.users || 0,
                        fill: '#FFA07A',
                      },
                    ]}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                  />
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Mining Metrics">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Hashrate:</span>
                    <strong>{analyticsData.mining.totalHashrate} TH/s</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Active Miners:</span>
                    <strong>{analyticsData.mining.activeMiners}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Daily Earnings:</span>
                    <strong>${analyticsData.mining.dailyEarnings.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Efficiency:</span>
                    <strong>{analyticsData.mining.efficiency.toFixed(2)}%</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Platform" key="platform">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Feature Usage">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.platform.activeFeatures}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="usage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Platform Health">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Uptime:</span>
                    <strong>{analyticsData.platform.uptime.toFixed(2)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Avg Response Time:</span>
                    <strong>{analyticsData.platform.responseTime}ms</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Error Rate:</span>
                    <strong>{(analyticsData.platform.errorRate * 100).toFixed(2)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Throughput:</span>
                    <strong>{analyticsData.platform.throughput}/s</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Reports" key="reports">
          <Card title="Automated Reports">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={() => generateReport('daily')}
                >
                  Generate Daily Report
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={() => generateReport('weekly')}
                >
                  Generate Weekly Report
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={() => generateReport('monthly')}
                >
                  Generate Monthly Report
                </Button>
              </Space>
            </div>

            <Table
              dataSource={reports}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Report Name',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type: string) => (
                    <Tag color="blue">{type.toUpperCase()}</Tag>
                  ),
                },
                {
                  title: 'Generated At',
                  dataIndex: 'generatedAt',
                  key: 'generatedAt',
                  render: (date: Date) => new Date(date).toLocaleString(),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (record: Report) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => generateReport(record.type, 'pdf')}
                      >
                        View
                      </Button>
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => generateReport(record.type, 'excel')}
                      >
                        Download
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}