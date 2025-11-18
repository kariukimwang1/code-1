import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Platform,
  LogBox,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';
import { PersistQueryClientProvider } from 'react-query/persistQueryClientExpir';
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MiningScreen from './src/screens/MiningScreen';
import TasksScreen from './src/screens/TasksScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import components
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { NotificationService } from './src/services/NotificationService';

// Import navigation
import AppNavigation from './src/navigation/AppNavigation';

// Import theme
import { theme } from './src/theme';

// Store for React Query
const storage = new MMKV({
  id: 'query-cache',
  encryptionKey: 'crypto-app-cache',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 10, // 10 minutes
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Ignore specific yellow box warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Setting a timer',
  'Warning: ...',
]);

interface AppProps {
  theme?: any;
}

const App: React.FC<AppProps> = ({ theme: appTheme = theme }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize services
        await NotificationService.initialize();

        // Check network connectivity
        const unsubscribe = NetInfo.addEventListener(state => {
          setConnectionStatus(state.isConnected);
        });

        // Check authentication status
        // const authStatus = await checkAuthStatus();
        // setIsAuthenticated(authStatus);

        // Simulate app initialization
        setTimeout(() => {
          setIsAppReady(true);
        }, 2000);

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              storage: {
                getItem: (key) => storage.getString(key) || null,
                setItem: (key, value) => {
                  storage.set(key, value);
                },
                removeItem: (key) => {
                  storage.delete(key);
                },
              },
              maxAge: 1000 * 60 * 60 * 24, // 24 hours
            }}
          >
            <AppProvider>
              <AuthProvider>
                <WebSocketProvider>
                  <SafeAreaView style={styles.safeArea}>
                    <StatusBar
                      barStyle={appTheme.dark ? 'light-content' : 'dark-content'}
                      backgroundColor={appTheme.colors.surface}
                      translucent={false}
                    />

                    <NavigationContainer>
                      <AppNavigation />
                    </NavigationContainer>

                    {/* Connection Status Indicator */}
                    {connectionStatus !== null && (
                      <View style={[
                        styles.connectionIndicator,
                        {
                          backgroundColor: connectionStatus ? '#4CAF50' : '#F44336'
                        }
                      ]}>
                        <Text style={styles.connectionText}>
                          {connectionStatus ? 'Connected' : 'Offline'}
                        </Text>
                      </View>
                    )}
                  </SafeAreaView>
                </WebSocketProvider>
              </AuthProvider>
            </AppProvider>
          </PersistQueryClientProvider>
        </QueryClientProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  connectionIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  connectionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default App;