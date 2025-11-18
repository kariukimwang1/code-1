import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Badge,
  Statistic,
  Row,
  Col,
  Alert,
  Tooltip,
  Progress,
  Tabs,
  List,
  Avatar,
  Typography,
} from 'antd';
import {
  SecurityScanOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined,
  AlertOutlined,
  ShieldOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Types
import { FraudAlert, RiskScore, SecurityMetrics } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface FraudDetectionDashboardProps {
  userRole?: 'admin' | 'analyst' | 'viewer';
  realTimeUpdates?: boolean;
}

const FraudDetectionDashboard: React.FC<FraudDetectionDashboardProps> = ({
  userRole = 'admin',
  realTimeUpdates = true
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    dateRange: null as any,
    search: '',
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchFraudData();
    if (realTimeUpdates) {
      const interval = setInterval(fetchFraudData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const [alertsResponse, metricsResponse] = await Promise.all([
        fetch('/api/security/fraud-detection?action=alerts'),
        fetch('/api/security/fraud-detection?action=metrics')
      ]);

      const [alertsData, metricsData] = await Promise.all([
        alertsResponse.json(),
        metricsResponse.json()
      ]);

      if (alertsData.success && metricsData.success) {
        setAlerts(alertsData.data.alerts || []);
        setMetrics(metricsData.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, resolution: string) => {
    try {
      const response = await fetch('/api/security/fraud-detection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_alert',
          alertId,
          resolution
        })
      });

      if (response.ok) {
        fetchFraudData(); // Refresh data
        setAlertModalVisible(false);
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'gold';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'processing';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      case 'false_positive': return 'default';
      default: return 'default';
    }
  };

  const renderMetricsOverview = () => {
    if (!metrics) return null;

    const accuracyData = [
      { name: 'True Positives', value: metrics.fraudulentTransactions, color: '#52c41a' },
      { name: 'False Positives', value: metrics.falsePositives, color: '#ff4d4f' },
      { name: 'Valid Transactions', value: metrics.totalTransactions - metrics.fraudulentTransactions - metrics.falsePositives, color: '#1890ff' }
    ];

    const performanceData = [
      { metric: 'Detection Rate', value: metrics.detectionAccuracy, max: 100 },
      { metric: 'Response Time', value: 100 - (metrics.responseTime / 100), max: 100 },
      { metric: 'Alert Resolution', value: metrics.alertsGenerated > 0 ? (metrics.alertsResolved / metrics.alertsGenerated) * 100 : 0, max: 100 }
    ];

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Total Transactions"
                value={metrics.totalTransactions}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Fraudulent Transactions"
                value={metrics.fraudulentTransactions}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Blocked Transactions"
                value={metrics.blockedTransactions}
                prefix={<ShieldOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Detection Accuracy"
                value={metrics.detectionAccuracy}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Detection Accuracy Pie Chart */}
        <Card title="Detection Accuracy Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={accuracyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accuracyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Metrics */}
        <Card title="System Performance">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis domain={[0, 100]} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderAlertsTable = () => {
    const filteredAlerts = alerts.filter(alert => {
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });

    const columns = [
      {
        title: 'Alert ID',
        dataIndex: 'id',
        key: 'id',
        render: (id: string) => (
          <Tooltip title={id}>
            <Text code>{id.slice(0, 12)}...</Text>
          </Tooltip>
        ),
      },
      {
        title: 'User',
        dataIndex: 'userId',
        key: 'userId',
        render: (userId: string) => (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{userId.slice(0, 8)}...</Text>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => {
          const colors = {
            suspicious_activity: 'blue',
            potential_fraud: 'orange',
            confirmed_fraud: 'red',
            security_threat: 'purple'
          };
          return <Tag color={colors[type as keyof typeof colors]}>{type.replace(/_/g, ' ')}</Tag>;
        },
      },
      {
        title: 'Severity',
        dataIndex: 'severity',
        key: 'severity',
        render: (severity: string) => (
          <Tag color={getSeverityColor(severity)}>
            {severity.toUpperCase()}
          </Tag>
        ),
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
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>
            {status.replace(/_/g, ' ')}
          </Tag>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (record: FraudAlert) => (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedAlert(record);
                setAlertModalVisible(true);
              }}
            >
              View
            </Button>
            {userRole === 'admin' && record.status === 'open' && (
              <Button
                type="link"
                danger
                onClick={() => handleAlertAction(record.id, 'resolved')}
              >
                Resolve
              </Button>
            )}
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Fraud Alerts"
        extra={
          <Space>
            <Input
              placeholder="Search alerts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Filter by severity"
              value={filters.severity}
              onChange={(value) => setFilters({ ...filters, severity: value })}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="critical">Critical</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
            </Select>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)}>
              Settings
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAlerts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredAlerts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    );
  };

  const renderAlertDetails = () => {
    if (!selectedAlert) return null;

    return (
      <Modal
        title={`Alert Details - ${selectedAlert.id}`}
        visible={alertModalVisible}
        onCancel={() => {
          setAlertModalVisible(false);
          setSelectedAlert(null);
        }}
        footer={[
          <Button key="close" onClick={() => setAlertModalVisible(false)}>
            Close
          </Button>,
          ...(userRole === 'admin' && selectedAlert.status === 'open' ? [
            <Button
              key="false_positive"
              onClick={() => handleAlertAction(selectedAlert.id, 'false_positive')}
            >
              Mark as False Positive
            </Button>,
            <Button
              key="resolve"
              type="primary"
              danger
              onClick={() => handleAlertAction(selectedAlert.id, 'resolved')}
            >
              Resolve Alert
            </Button>
          ] : [])
        ]}
        width={800}
      >
        <div className="space-y-6">
          {/* Alert Header */}
          <Card size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>Type:</Text>
                  <Tag color="blue">{selectedAlert.type.replace(/_/g, ' ')}</Tag>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>Severity:</Text>
                  <Tag color={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity.toUpperCase()}
                  </Tag>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>Risk Score:</Text>
                  <Progress percent={selectedAlert.riskScore} size="small" />
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>Status:</Text>
                  <Tag color={getStatusColor(selectedAlert.status)}>
                    {selectedAlert.status.replace(/_/g, ' ')}
                  </Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Description */}
          <Card size="small" title="Description">
            <Paragraph>{selectedAlert.description}</Paragraph>
          </Card>

          {/* Automated Actions */}
          {selectedAlert.actions.length > 0 && (
            <Card size="small" title="Automated Actions">
              <List
                dataSource={selectedAlert.actions}
                renderItem={(action) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<ShieldOutlined />} />}
                      title={action.type.replace(/_/g, ' ').toUpperCase()}
                      description={
                        <Space>
                          <Tag color={action.automated ? 'green' : 'blue'}>
                            {action.automated ? 'Automated' : 'Manual'}
                          </Tag>
                          <Tag color={action.executed ? 'success' : 'warning'}>
                            {action.executed ? 'Executed' : 'Pending'}
                          </Tag>
                          <Text type="secondary">{new Date(action.timestamp).toLocaleString()}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Evidence */}
          {selectedAlert.evidence.length > 0 && (
            <Card size="small" title="Evidence">
              <List
                dataSource={selectedAlert.evidence}
                renderItem={(evidence, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<EyeOutlined />} />}
                      title={`Evidence Item ${index + 1}`}
                      description={
                        <pre className="text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(evidence, null, 2)}
                        </pre>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>
          <SecurityScanOutlined /> Fraud Detection Dashboard
        </Title>
        <Space>
          <Badge count={alerts.filter(a => a.status === 'open').length}>
            <Button icon={<AlertOutlined />}>
              Active Alerts
            </Button>
          </Badge>
        </Space>
      </div>

      {realTimeUpdates && (
        <Alert
          message="Real-time Monitoring Active"
          description="Fraud detection system is actively monitoring all transactions and user activities."
          type="success"
          showIcon
          closable
        />
      )}

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          {renderMetricsOverview()}
        </TabPane>
        <TabPane
          tab={
            <Badge count={alerts.filter(a => a.status === 'open').length} offset={[10, 0]}>
              Alerts
            </Badge>
          }
          key="alerts"
        >
          {renderAlertsTable()}
        </TabPane>
      </Tabs>

      {renderAlertDetails()}
    </div>
  );
};

export default FraudDetectionDashboard;