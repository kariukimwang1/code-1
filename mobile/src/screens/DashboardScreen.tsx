import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Surface, Card, Button, Chip, Divider, FAB } from 'react-native-paper';
import { LineChart, PieChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'react-native-svg-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

// Components
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import MiningWidget from '../components/dashboard/MiningWidget';
import EarningsChart from '../components/dashboard/EarningsChart';
import TasksOverview from '../components/dashboard/TasksOverview';

// Services
import { API } from '../services/api';
import { WebSocketService } from '../services/WebSocketService';
import { StorageService } from '../services/StorageService';
import { useAuth } from '../hooks/useAuth';

// Types
import { User, DashboardData, MiningStats, TaskStats, EarningsData } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const handleDashboardUpdate = (data: any) => {
      setDashboardData(prev => ({
        ...prev!,
        miningStats: { ...prev?.miningStats, ...data.miningStats },
        earnings: { ...prev?.earnings, ...data.earnings },
        tasks: { ...prev?.tasks, ...data.tasks },
      }));
    };

    wsService.subscribe('dashboard_update', handleDashboardUpdate);

    return () => {
      wsService.unsubscribe('dashboard_update', handleDashboardUpdate);
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get('/dashboard', {
        params: { period: selectedPeriod }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'mining':
        navigation.navigate('Mining');
        break;
      case 'tasks':
        navigation.navigate('Tasks');
        break;
      case 'wallet':
        navigation.navigate('Wallet');
        break;
      case 'staking':
        navigation.navigate('Staking');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.firstName || 'User'}! 👋
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Icon name="bell-outline" size={24} color="#ffffff" />
        <View style={styles.notificationBadge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['day', 'week', 'month'] as const).map((period) => (
        <Chip
          key={period}
          selected={selectedPeriod === period}
          onPress={() => setSelectedPeriod(period)}
          style={styles.periodChip}
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </Chip>
      ))}
    </View>
  );

  const renderStatsOverview = () => {
    if (!dashboardData) return null;

    const stats = [
      {
        title: 'Current Balance',
        value: `$${dashboardData.earnings.currentBalance.toFixed(2)}`,
        change: dashboardData.earnings.dailyChange,
        icon: 'wallet',
        color: '#4CAF50',
      },
      {
        title: 'Mining Rate',
        value: `${dashboardData.miningStats.hashrate.toFixed(2)} H/s`,
        change: dashboardData.miningStats.efficiency,
        icon: 'lightning-bolt',
        color: '#FF9800',
      },
      {
        title: 'Active Tasks',
        value: dashboardData.tasks.activeCount.toString(),
        change: `${dashboardData.tasks.completedRate}% complete`,
        icon: 'clipboard-check',
        color: '#2196F3',
      },
      {
        title: 'Staking Rewards',
        value: `${dashboardData.staking.apy.toFixed(1)}% APY`,
        change: `$${dashboardData.staking.monthlyRewards.toFixed(2)}/mo`,
        icon: 'chart-line',
        color: '#9C27B0',
      },
    ];

    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statContainer}>
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderMiningWidget = () => {
    if (!dashboardData?.miningStats) return null;

    return (
      <Card style={styles.card}>
        <MiningWidget
          stats={dashboardData.miningStats}
          onPress={() => navigation.navigate('Mining')}
        />
      </Card>
    );
  };

  const renderEarningsChart = () => {
    if (!dashboardData?.earnings.history) return null;

    return (
      <Card style={styles.card}>
        <EarningsChart
          data={dashboardData.earnings.history}
          period={selectedPeriod}
        />
      </Card>
    );
  };

  const renderTasksOverview = () => {
    if (!dashboardData?.tasks) return null;

    return (
      <Card style={styles.card}>
        <TasksOverview
          stats={dashboardData.tasks}
          onPress={() => navigation.navigate('Tasks')}
        />
      </Card>
    );
  };

  const renderQuickActions = () => (
    <QuickActions
      actions={[
        { id: 'mining', title: 'Start Mining', icon: 'play', color: '#4CAF50' },
        { id: 'tasks', title: 'Browse Tasks', icon: 'format-list-bulleted', color: '#2196F3' },
        { id: 'wallet', title: 'Wallet', icon: 'wallet', color: '#FF9800' },
        { id: 'staking', title: 'Staking', icon: 'chart-line', color: '#9C27B0' },
      ]}
      onActionPress={handleQuickAction}
    />
  );

  const renderRecentActivity = () => {
    if (!dashboardData?.recentActivity) return null;

    return (
      <Card style={styles.card}>
        <RecentActivity
          activities={dashboardData.recentActivity}
          onViewAll={() => navigation.navigate('History')}
        />
      </Card>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchDashboardData}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderPeriodSelector()}
        {renderStatsOverview()}
        {renderQuickActions()}
        {renderMiningWidget()}
        {renderEarningsChart()}
        {renderTasksOverview()}
        {renderRecentActivity()}

        {/* Add some spacing at the bottom for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button for quick mining start/stop */}
      <FAB
        style={styles.fab}
        icon="play"
        onPress={() => handleQuickAction('mining')}
        label="Quick Mine"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#2196F3',
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodChip: {
    flex: 1,
    marginHorizontal: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statContainer: {
    width: '48%',
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  bottomSpacing: {
    height: 80, // Space for FAB
  },
});

export default DashboardScreen;