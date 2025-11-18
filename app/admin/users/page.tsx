'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Avatar,
  Modal,
  Form,
  message,
  Drawer,
  Tabs,
  Timeline,
  Progress,
  Tooltip,
  Popconfirm,
  Upload,
  Badge,
  Switch,
  Divider,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  ExportOutlined,
  ImportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BanOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SecurityScanOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import { RangePickerProps } from 'antd/es/date-picker';

const { Option } = Select;
const { TabPane } = Tabs;

interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  kycLevel: 0 | 1 | 2;
  balance: number;
  totalEarnings: number;
  miningPower: number;
  lastActivity: Date;
  joinDate: Date;
  riskScore: number;
  country: string;
  city: string;
  phone?: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  ipAddresses: string[];
  devices: Array<{
    id: string;
    name: string;
    type: string;
    lastSeen: Date;
    trusted: boolean;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    timestamp: Date;
  }>;
  securityEvents: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  suspendedUsers: number;
  verifiedUsers: number;
  twoFactorEnabled: number;
  averageBalance: number;
  totalBalance: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userDetailsVisible, setUserDetailsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    kycLevel: '',
    country: '',
    dateRange: null as any,
  });
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.data);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      message.error('Failed to fetch user statistics');
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.kycLevel) {
      filtered = filtered.filter(user => user.kycLevel === parseInt(filters.kycLevel));
    }

    if (filters.country) {
      filtered = filtered.filter(user => user.country === filters.country);
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(user => {
        const userDate = new Date(user.joinDate);
        return userDate >= start && userDate <= end;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        message.success(`User ${action} successful`);
        fetchUsers();
        fetchUserStats();
      } else {
        message.error(`Failed to ${action} user`);
      }
    } catch (error) {
      message.error(`Error ${action} user`);
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Status', 'KYC Level', 'Balance', 'Country', 'Join Date'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.status,
        user.kycLevel,
        user.balance,
        user.country,
        new Date(user.joinDate).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getUserStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'orange',
      suspended: 'red',
      banned: 'magenta',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getKYCColor = (level: number) => {
    const colors = ['red', 'orange', 'green'];
    return colors[level] || 'default';
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} size={40} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
            <Space size="small">
              {record.emailVerified && <CheckCircleOutlined style={{ color: 'green', fontSize: '12px' }} />}
              {record.twoFactorEnabled && <SecurityScanOutlined style={{ color: 'blue', fontSize: '12px' }} />}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getUserStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'KYC',
      dataIndex: 'kycLevel',
      key: 'kycLevel',
      render: (level: number) => (
        <Tag color={getKYCColor(level)}>
          Level {level}
          {level < 2 && <span style={{ marginLeft: '4px' }}>⚠</span>}
        </Tag>
      ),
    },
    {
      title: 'Financial',
      key: 'financial',
      render: (record: User) => (
        <div>
          <div>Balance: <strong>${record.balance.toFixed(2)}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Total: ${record.totalEarnings.toFixed(2)} | Mining: {record.miningPower}TH/s
          </div>
        </div>
      ),
    },
    {
      title: 'Risk',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Tooltip title={`Risk Score: ${score}/100`}>
          <Progress
            percent={score}
            size="small"
            strokeColor={score > 70 ? '#ff4d4f' : score > 40 ? '#faad14' : '#52c41a'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'country',
      key: 'location',
      render: (country: string, record: User) => (
        <div>
          <div>{record.city}, {country}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.ipAddresses.length} IPs
          </div>
        </div>
      ),
    },
    {
      title: 'Activity',
      dataIndex: 'lastActivity',
      key: 'activity',
      render: (date: Date, record: User) => (
        <div>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Joined: {new Date(record.joinDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setUserDetailsVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setUserModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'active' && (
            <Popconfirm
              title="Are you sure you want to suspend this user?"
              onConfirm={() => handleUserAction('suspend', record.id)}
            >
              <Tooltip title="Suspend User">
                <Button type="link" icon={<BanOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'suspended' && (
            <Tooltip title="Activate User">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUserAction('activate', record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const getUserDistributionData = () => {
    const distribution = users.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const getKYCDistributionData = () => {
    const distribution = users.reduce((acc, user) => {
      acc[`Level ${user.kycLevel}`] = (acc[`Level ${user.kycLevel}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([level, count]) => ({
      name: level,
      value: count,
    }));
  };

  const getRecentActivityData = () => {
    // Generate sample data for the last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        users: Math.floor(Math.random() * 50) + 10,
        active: Math.floor(Math.random() * 40) + 5,
      });
    }
    return data;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>User Management</h1>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExportUsers}>
            Export CSV
          </Button>
          <Button icon={<ImportOutlined />}>
            Import Users
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats?.activeUsers || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="New Today"
              value={stats?.newUsersToday || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Avg Balance"
              value={stats?.averageBalance || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="suspended">Suspended</Option>
              <Option value="banned">Banned</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="KYC Level"
              value={filters.kycLevel}
              onChange={(value) => setFilters({ ...filters, kycLevel: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="0">Level 0</Option>
              <Option value="1">Level 1</Option>
              <Option value="2">Level 2</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Country"
              value={filters.country}
              onChange={(value) => setFilters({ ...filters, country: value })}
              style={{ width: '100%' }}
              showSearch
              allowClear
            >
              {Array.from(new Set(users.map(u => u.country))).map(country => (
                <Option key={country} value={country}>{country}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card title={`Users (${filteredUsers.length})`}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* User Details Drawer */}
      <Drawer
        title={`User Details - ${selectedUser?.name}`}
        placement="right"
        onClose={() => setUserDetailsVisible(false)}
        open={userDetailsVisible}
        width={800}
      >
        {selectedUser && (
          <Tabs defaultActiveKey="profile">
            <TabPane tab="Profile" key="profile">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <Avatar size={80} src={selectedUser.avatar} icon={<UserOutlined />} />
                  <h2>{selectedUser.name}</h2>
                  <p>{selectedUser.email}</p>
                  <Space>
                    <Tag color={getUserStatusColor(selectedUser.status)}>
                      {selectedUser.status.toUpperCase()}
                    </Tag>
                    <Tag color={getKYCColor(selectedUser.kycLevel)}>
                      KYC Level {selectedUser.kycLevel}
                    </Tag>
                  </Space>
                </div>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <strong>Balance:</strong> ${selectedUser.balance.toFixed(2)}
                  </Col>
                  <Col span={12}>
                    <strong>Total Earnings:</strong> ${selectedUser.totalEarnings.toFixed(2)}
                  </Col>
                  <Col span={12}>
                    <strong>Mining Power:</strong> {selectedUser.miningPower} TH/s
                  </Col>
                  <Col span={12}>
                    <strong>Risk Score:</strong>
                    <Progress
                      percent={selectedUser.riskScore}
                      size="small"
                      strokeColor={selectedUser.riskScore > 70 ? '#ff4d4f' : selectedUser.riskScore > 40 ? '#faad14' : '#52c41a'}
                    />
                  </Col>
                  <Col span={12}>
                    <strong>Country:</strong> {selectedUser.city}, {selectedUser.country}
                  </Col>
                  <Col span={12}>
                    <strong>Phone:</strong> {selectedUser.phone || 'Not provided'}
                  </Col>
                  <Col span={12}>
                    <strong>Join Date:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}
                  </Col>
                  <Col span={12}>
                    <strong>Last Activity:</strong> {new Date(selectedUser.lastActivity).toLocaleDateString()}
                  </Col>
                </Row>

                <Divider />

                <h3>Security Status</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Space>
                      <CheckCircleOutlined style={{ color: selectedUser.emailVerified ? 'green' : 'red' }} />
                      <span>Email Verified</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <SecurityScanOutlined style={{ color: selectedUser.twoFactorEnabled ? 'blue' : 'red' }} />
                      <span>2FA Enabled</span>
                    </Space>
                  </Col>
                </Row>
              </Space>
            </TabPane>

            <TabPane tab="Devices" key="devices">
              <List
                dataSource={selectedUser.devices}
                renderItem={(device) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<GlobalOutlined />} />}
                      title={device.name}
                      description={
                        <div>
                          <div>Type: {device.type}</div>
                          <div>Last Seen: {new Date(device.lastSeen).toLocaleDateString()}</div>
                          <div>
                            Trusted: <Tag color={device.trusted ? 'green' : 'red'}>
                              {device.trusted ? 'Yes' : 'No'}
                            </Tag>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </TabPane>

            <TabPane tab="Transactions" key="transactions">
              <List
                dataSource={selectedUser.transactions}
                renderItem={(transaction) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<DollarOutlined />} />}
                      title={`${transaction.type} - $${transaction.amount.toFixed(2)}`}
                      description={
                        <div>
                          <div>Status: <Tag>{transaction.status}</Tag></div>
                          <div>Date: {new Date(transaction.timestamp).toLocaleDateString()}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </TabPane>

            <TabPane tab="Security Events" key="security">
              <Timeline>
                {selectedUser.securityEvents.map((event) => (
                  <Timeline.Item
                    key={event.id}
                    dot={
                      event.severity === 'critical' ? (
                        <ExclamationCircleOutlined style={{ color: 'red' }} />
                      ) : event.severity === 'high' ? (
                        <ExclamationCircleOutlined style={{ color: 'orange' }} />
                      ) : (
                        <ClockCircleOutlined style={{ color: 'blue' }} />
                      )
                    }
                  >
                    <div>
                      <strong>{event.type}</strong>
                      <p>{event.description}</p>
                      <small>{new Date(event.timestamp).toLocaleString()}</small>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div  );
}