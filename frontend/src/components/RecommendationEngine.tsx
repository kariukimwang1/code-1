import React, { useState, useEffect, useCallback } from 'react';
import { Card, List, Button, Progress, Tag, Space, Alert, Tooltip, Statistic, Row, Col } from 'antd';
import {
  BulbOutlined,
  TrendingUpOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  FireOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Recommendation {
  taskId: string;
  confidence: number;
  reasons: string[];
  expectedOutcomes: {
    successProbability: number;
    earningsPotential: number;
    skillGrowth: string[];
    timeCommitment: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  alternatives: Array<{
    taskId: string;
    confidence: number;
    reason: string;
  }>;
}

interface UserJourneyOptimization {
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
    timeline: string;
  }>;
  personalizedTips: string[];
  nextMilestones: Array<{
    title: string;
    description: string;
    target: string;
  }>;
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendedAction: string;
}

interface RecommendationEngineProps {
  userId: string;
  theme?: 'light' | 'dark';
  showAnalytics?: boolean;
  showAnomalies?: boolean;
  compactMode?: boolean;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  userId,
  theme = 'light',
  showAnalytics = true,
  showAnomalies = true,
  compactMode = false
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userJourney, setUserJourney] = useState<UserJourneyOptimization | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'journey' | 'insights'>('tasks');
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          limit: compactMode ? 5 : 10,
          context: 'tasks'
        })
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations || []);
      } else {
        setError(data.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Network error while fetching recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, compactMode]);

  const fetchUserJourneyOptimization = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          context: 'journey_optimization'
        })
      });

      const data = await response.json();

      if (data.success) {
        setUserJourney(data.data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching journey optimization:', err);
    }
  }, [userId]);

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/recommendations?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setAnomalies(data.data.anomalies || []);
      }
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
      if (showAnalytics) {
        fetchUserJourneyOptimization();
      }
      if (showAnomalies) {
        fetchAnomalies();
      }
    }
  }, [userId, fetchRecommendations, fetchUserJourneyOptimization, fetchAnomalies, showAnalytics, showAnomalies]);

  const renderConfidenceBadge = (confidence: number) => {
    const color = confidence > 0.8 ? 'green' : confidence > 0.6 ? 'blue' : 'orange';
    return (
      <Tag color={color}>
        {(confidence * 100).toFixed(0)}% Match
      </Tag>
    );
  };

  const renderRiskBadge = (risk: string) => {
    const color = risk === 'low' ? 'green' : risk === 'medium' ? 'orange' : 'red';
    return <Tag color={color}>{risk.toUpperCase()}</Tag>;
  };

  const renderPriorityBadge = (priority: string) => {
    const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
    return <Tag color={color}>{priority.toUpperCase()}</Tag>;
  };

  const renderSeverityBadge = (severity: string) => {
    const color = severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'blue';
    return <Tag color={color}>{severity.toUpperCase()}</Tag>;
  };

  const renderRecommendationsList = () => {
    if (recommendations.length === 0) {
      return (
        <Alert
          message="No recommendations available"
          description="AI recommendations will appear here once we have enough data about your activity."
          type="info"
          showIcon
        />
      );
    }

    return (
      <List
        dataSource={recommendations}
        renderItem={(rec, index) => (
          <List.Item key={rec.taskId}>
            <Card
              size={compactMode ? 'small' : 'default'}
              title={
                <Space>
                  <BulbOutlined />
                  <span>Recommendation #{index + 1}</span>
                  {renderConfidenceBadge(rec.confidence)}
                </Space>
              }
              extra={
                <Space>
                  <Tag color="blue">{rec.expectedOutcomes.timeCommitment}h</Tag>
                  {renderRiskBadge(rec.expectedOutcomes.riskLevel)}
                </Space>
              }
            >
              <div className="space-y-4">
                <div>
                  <strong>Expected Success Probability:</strong>
                  <Progress
                    percent={rec.expectedOutcomes.successProbability * 100}
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>

                <div>
                  <strong>Earnings Potential:</strong>
                  <Statistic
                    value={rec.expectedOutcomes.earningsPotential}
                    prefix="$"
                    precision={2}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <strong>Why this task?</strong>
                  <div className="mt-2">
                    {rec.reasons.map((reason, i) => (
                      <Tag key={i} color="cyan">{reason}</Tag>
                    ))}
                  </div>
                </div>

                {rec.expectedOutcomes.skillGrowth.length > 0 && (
                  <div>
                    <strong>Skills you'll develop:</strong>
                    <div className="mt-2">
                      {rec.expectedOutcomes.skillGrowth.map((skill, i) => (
                        <Tag key={i} color="purple">{skill}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                {rec.alternatives.length > 0 && !compactMode && (
                  <div>
                    <strong>Similar opportunities:</strong>
                    <div className="mt-2 space-y-2">
                      {rec.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{alt.reason}</span>
                          <Tag color="geekblue">{(alt.confidence * 100).toFixed(0)}%</Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Space>
                  <Button type="primary" icon={<RocketOutlined />}>
                    Start Task
                  </Button>
                  <Button icon={<ClockCircleOutlined />}>
                    Save for Later
                  </Button>
                </Space>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  const renderUserJourney = () => {
    if (!userJourney) return null;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedActions = userJourney.recommendedActions.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return (
      <div className="space-y-6">
        {userJourney.recommendedActions.length > 0 && (
          <Card title="Recommended Actions">
            <List
              dataSource={sortedActions}
              renderItem={(action) => (
                <List.Item>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <strong>{action.action}</strong>
                      <Space>
                        {renderPriorityBadge(action.priority)}
                        <Tag color="blue">{action.timeline}</Tag>
                      </Space>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Expected Impact: {(action.expectedImpact * 100).toFixed(0)}%</span>
                      <Progress percent={action.expectedImpact * 100} size="small" className="flex-1" />
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}

        {userJourney.personalizedTips.length > 0 && (
          <Card title="Personalized Tips">
            <List
              dataSource={userJourney.personalizedTips}
              renderItem={(tip, index) => (
                <List.Item>
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>{tip}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {userJourney.nextMilestones.length > 0 && (
          <Card title="Your Next Milestones">
            <Row gutter={[16, 16]}>
              {userJourney.nextMilestones.map((milestone, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card size="small">
                    <div className="text-center">
                      <TrophyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                      <h4 className="mt-2">{milestone.title}</h4>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                      <Tag color="green">{milestone.target}</Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    const confidenceData = recommendations.map((rec, index) => ({
      name: `Task ${index + 1}`,
      confidence: rec.confidence * 100,
      earnings: rec.expectedOutcomes.earningsPotential
    }));

    const riskData = recommendations.reduce((acc, rec) => {
      const risk = rec.expectedOutcomes.riskLevel;
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(riskData).map(([risk, count]) => ({
      name: `${risk.charAt(0).toUpperCase() + risk.slice(1)} Risk`,
      value: count
    }));

    return (
      <div className="space-y-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Confidence vs Earnings">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence %" />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="#82ca9d" name="Earnings $" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Risk Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card title="Performance Analytics">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Recommendations"
                value={recommendations.length}
                prefix={<BulbOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Average Confidence"
                value={recommendations.length > 0 ?
                  (recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length * 100).toFixed(1) : 0}
                suffix="%"
                prefix={<TrendingUpOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Potential Earnings"
                value={recommendations.reduce((sum, rec) => sum + rec.expectedOutcomes.earningsPotential, 0)}
                prefix="$"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="High Confidence Tasks"
                value={recommendations.filter(rec => rec.confidence > 0.8).length}
                prefix={<FireOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const renderAnomalies = () => {
    if (anomalies.length === 0) {
      return (
        <Alert
          message="No anomalies detected"
          description="Your activity patterns look normal. Keep up the good work!"
          type="success"
          showIcon
        />
      );
    }

    return (
      <List
        dataSource={anomalies}
        renderItem={(anomaly) => (
          <List.Item>
            <Alert
              type="warning"
              showIcon={<WarningOutlined />}
              title={anomaly.type.replace(/_/g, ' ').toUpperCase()}
              description={
                <div>
                  <p>{anomaly.description}</p>
                  <p><strong>Recommended Action:</strong> {anomaly.recommendedAction}</p>
                  <Space>
                    {renderSeverityBadge(anomaly.severity)}
                  </Space>
                </div>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title="AI-Powered Recommendations"
        extra={
          <Button
            type="primary"
            onClick={fetchRecommendations}
            loading={loading}
          >
            Refresh
          </Button>
        }
        tabList={[
          { key: 'tasks', tab: 'Task Recommendations' },
          ...(showAnalytics ? [{ key: 'journey', tab: 'Journey Optimization' }] : []),
          ...(showAnalytics ? [{ key: 'insights', tab: 'Analytics & Insights' }] : [])
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'tasks' && renderRecommendationsList()}
        {activeTab === 'journey' && renderUserJourney()}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {showAnomalies && (
              <Card title="Detected Anomalies">
                {renderAnomalies()}
              </Card>
            )}
            {renderAnalytics()}
          </div>
        )}
      </Card>
    </div>
  );
};