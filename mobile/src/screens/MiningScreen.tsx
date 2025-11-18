import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  Vibration,
  Linking,
} from 'react-native';
import {
  Surface,
  Card,
  Button,
  ProgressBar,
  Divider,
  Chip,
  List,
  Badge,
} from 'react-native-paper';
import { LineChart, AreaChart } from 'react-native-svg-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

// Components
import MiningStatsCard from '../components/mining/MiningStatsCard';
import MiningChart from '../components/mining/MiningChart';
  import MiningControls from '../components/mining/MiningControls';
import MiningRewards from '../components/mining/MiningRewards';
import MiningSettings from '../components/mining/MiningSettings';

// Services
import { API } from '../services/api';
import { WebSocketService } from '../services/WebSocketService';
import { BatteryService } from '../services/BatteryService';
import { useAuth } from '../hooks/useAuth';

// Types
import { MiningStats, MiningConfig, RewardHistory } from '../types';

interface MiningScreenProps {
  navigation: any;
}

const MiningScreen: React.FC<MiningScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [miningStats, setMiningStats] = useState<MiningStats | null>(null);
  const [miningConfig, setMiningConfig] = useState<MiningConfig | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batteryOptimization, setBatteryOptimization] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // WebSocket for real-time mining updates
  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const handleMiningUpdate = (data: any) => {
      setMiningStats(prev => ({
        ...prev!,
        hashrate: data.hashrate || prev?.hashrate,
        shares: data.shares || prev?.shares,
        earnings: data.earnings || prev?.earnings,
        efficiency: data.efficiency || prev?.efficiency,
        temperature: data.temperature || prev?.temperature,
      }));
    };

    const handleMiningReward = (data: any) => {
      Alert.alert(
        'Mining Reward! 🎉',
        `You've earned ${data.reward} MINER tokens!`,
        [{ text: 'Awesome!' }]
      );
      Vibration.vibrate(200);
    };

    wsService.subscribe('mining_update', handleMiningUpdate);
    wsService.subscribe('mining_reward', handleMiningReward);

    return () => {
      wsService.unsubscribe('mining_update', handleMiningUpdate);
      wsService.unsubscribe('mining_reward', handleMiningReward);
    };
  }, []);

  const fetchMiningData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, configResponse] = await Promise.all([
        API.get('/mining/stats'),
        API.get('/mining/config'),
      ]);

      if (statsResponse.data.success && configResponse.data.success) {
        setMiningStats(statsResponse.data.data);
        setMiningConfig(configResponse.data.data);
        setIsMining(statsResponse.data.data.isActive);
      } else {
        setError('Failed to load mining data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Mining fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMiningData();
  }, [fetchMiningData]);

  useFocusEffect(
    useCallback(() => {
      fetchMiningData();
    }, [fetchMiningData])
  );

  const handleToggleMining = async () => {
    try {
      const response = await API.post('/mining/toggle', {
        enable: !isMining,
        batteryOptimization,
        config: miningConfig,
      });

      if (response.data.success) {
        setIsMining(!isMining);
        Vibration.vibrate(100);

        if (!isMining) {
          Alert.alert(
            'Mining Started ⚡',
            'Your device is now contributing to the network. Monitor your earnings in real-time!',
            [{ text: 'Got it!' }]
          );
        }
      } else {
        Alert.alert('Error', response.data.error || 'Failed to toggle mining');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error while toggling mining');
      console.error('Mining toggle error:', err);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMiningData();
    setRefreshing(false);
  }, [fetchMiningData]);

  const handleSettingsSave = async (newConfig: MiningConfig) => {
    try {
      const response = await API.put('/mining/config', newConfig);

      if (response.data.success) {
        setMiningConfig(newConfig);
        setShowSettings(false);
        Alert.alert('Success', 'Mining settings updated successfully!');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update settings');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error while updating settings');
      console.error('Mining settings error:', err);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Mining Operations</Text>
        <Text style={styles.subtitle}>
          {isMining ? '🟢 Active' : '⚪ Inactive'}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <Chip
          icon={isMining ? 'stop' : 'play'}
          onPress={handleToggleMining}
          style={[
            styles.miningToggle,
            { backgroundColor: isMining ? '#F44336' : '#4CAF50' }
          ]}
        >
          {isMining ? 'Stop' : 'Start'} Mining
        </Chip>
      </View>
    </View>
  );

  const renderMiningControls = () => {
    if (!miningStats || !miningConfig) return null;

    return (
      <Card style={styles.card}>
        <MiningControls
          stats={miningStats}
          config={miningConfig}
          isMining={isMining}
          onToggle={handleToggleMining}
          onSettingsPress={() => setShowSettings(true)}
        />
      </Card>
    );
  };

  const renderMiningStats = () => {
    if (!miningStats) return null;

    return (
      <Card style={styles.card}>
        <MiningStatsCard stats={miningStats} />
      </Card>
    );
  };

  const renderPerformanceChart = () => {
    if (!miningStats?.performanceHistory) return null;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Performance</Text>
          <Text style={styles.cardSubtitle}>Last 24 hours</Text>
        </View>
        <MiningChart data={miningStats.performanceHistory} />
      </Card>
    );
  };

  const renderMiningRewards = () => {
    if (!miningStats?.recentRewards) return null;

    return (
      <Card style={styles.card}>
        <MiningRewards
          rewards={miningStats.recentRewards}
          totalEarned={miningStats.totalEarned}
        />
      </Card>
    );
  };

  const renderMiningSettings = () => {
    if (!showSettings || !miningConfig) return null;

    return (
      <MiningSettings
        config={miningConfig}
        batteryOptimization={batteryOptimization}
        onBatteryOptimizationChange={setBatteryOptimization}
        onSave={handleSettingsSave}
        onClose={() => setShowSettings(false)}
      />
    );
  };

  const renderTips = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Mining Tips</Text>
        <Icon name="lightbulb-outline" size={20} color="#FF9800" />
      </View>
      <List.Item
        title="Connect to WiFi"
        description="WiFi provides better stability and lower power consumption than mobile data"
        left={(props) => <List.Icon {...props} icon="wifi" />}
      />
      <Divider />
      <List.Item
        title="Keep device charging"
        description="Mining can drain battery - keep connected to power for optimal performance"
        left={(props) => <List.Icon {...props} icon="battery-charging" />}
      />
      <Divider />
      <List.Item
        title="Close background apps"
        description="Free up device resources for maximum mining efficiency"
        left={(props) => <List.Icon {...props} icon="apps" />}
      />
    </Card>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchMiningData}>
          Retry
        </Button>
      </View>
    );
  }

  if (showSettings) {
    return renderMiningSettings();
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
        {renderMiningControls()}
        {renderMiningStats()}
        {renderPerformanceChart()}
        {renderMiningRewards()}
        {renderTips()}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerRight: {
    marginLeft: 16,
  },
  miningToggle: {
    backgroundColor: '#4CAF50',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
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
});

export default MiningScreen;