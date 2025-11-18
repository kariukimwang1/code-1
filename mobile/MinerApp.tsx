import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { WebView } from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NetInfo } from '@react-native-community/netinfo'
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

const { width, height } = Dimensions.get('window')

interface AppSettings {
  userId?: string
  token?: string
  biometricEnabled?: boolean
  notificationsEnabled?: boolean
}

const MinerApp = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [settings, setSettings] = useState<AppSettings>({})
  const [webViewKey, setWebViewKey] = useState(0)
  const navigationRef = useNavigationContainerRef()

  const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://miner-app.com'
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://miner-api.com'

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch()
      setIsConnected(netInfo.isConnected ?? true)

      // Load user settings
      const storedSettings = await AsyncStorage.getItem('miner_app_settings')
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings))
      }

      // Initialize app analytics
      if (Platform.OS === 'ios') {
        // Initialize Firebase Analytics for iOS
      } else if (Platform.OS === 'android') {
        // Initialize Firebase Analytics for Android
      }

      setTimeout(() => {
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error('App initialization error:', error)
      setIsLoading(false)
    }
  }

  const handleWebViewMessage = async (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data)

      switch (type) {
        case 'SAVE_USER_DATA':
          await AsyncStorage.setItem('miner_app_settings', JSON.stringify(data))
          setSettings(data)
          break

        case 'GET_USER_DATA':
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'USER_DATA_RESPONSE',
              data: settings,
            }),
            '*'
          )
          break

        case 'CONNECT_WALLET':
          await handleWalletConnection(data)
          break

        case 'BIOMETRIC_AUTH':
          await handleBiometricAuth()
          break

        case 'SHARE_CONTENT':
          await handleShare(data)
          break

        case 'TAKE_PHOTO':
          await handlePhotoCapture()
          break

        case 'VIBRATE':
          handleVibration(data.duration)
          break

        case 'NOTIFICATION':
          await handleNotification(data)
          break

        case 'OPEN_EXTERNAL_LINK':
          await handleExternalLink(data.url)
          break

        default:
          console.log('Unknown message type:', type)
      }
    } catch (error) {
      console.error('WebView message handling error:', error)
    }
  }

  const handleWalletConnection = async (walletData: any) => {
    try {
      // Implement native wallet connection logic
      if (Platform.OS === 'android') {
        // Connect to MetaMask Android app
        // await connectMetaMaskAndroid(walletData)
      } else if (Platform.OS === 'ios') {
        // Connect to MetaMask iOS app
        // await connectMetaMaskIOS(walletData)
      }

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'WALLET_CONNECTED',
          data: { success: true },
        }),
        '*'
      )
    } catch (error) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'WALLET_CONNECTION_ERROR',
          data: { error: error.message },
        }),
        '*'
      )
    }
  }

  const handleBiometricAuth = async () => {
    try {
      // Implement biometric authentication
      const { LocalAuthentication } = require('expo-local-authentication')

      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

      if (hasHardware) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access MINER',
          fallbackLabel: 'Use passcode',
        })

        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'BIOMETRIC_RESULT',
            data: { success: result.success },
          }),
          '*'
        )
      }
    } catch (error) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'BIOMETRIC_RESULT',
          data: { success: false, error: error.message },
        }),
        '*'
      )
    }
  }

  const handleShare = async (shareData: any) => {
    try {
      const { Share } = require('react-native')
      await Share.share({
        message: shareData.message,
        url: shareData.url,
        title: shareData.title,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handlePhotoCapture = async () => {
    try {
      const { launchImageLibrary } = require('react-native-image-picker')

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
      }

      launchImageLibrary(options, (response) => {
        if (response.assets && response.assets[0]) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'PHOTO_CAPTURED',
              data: {
                uri: response.assets[0].uri,
                name: response.assets[0].fileName,
                type: response.assets[0].type,
              },
            }),
            '*'
          )
        }
      })
    } catch (error) {
      console.error('Photo capture error:', error)
    }
  }

  const handleVibration = (duration: number = 100) => {
    try {
      const { Vibration } = require('react-native')
      Vibration.vibrate(duration)
    } catch (error) {
      console.error('Vibration error:', error)
    }
  }

  const handleNotification = async (notificationData: any) => {
    try {
      const { Notifications } = require('expo-notifications')

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
        },
        trigger: null,
      })
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  const handleExternalLink = async (url: string) => {
    try {
      const { Linking } = require('react-native')
      const supported = await Linking.canOpenURL(url)

      if (supported) {
        await Linking.openURL(url)
      }
    } catch (error) {
      console.error('External link error:', error)
    }
  }

  const onRefresh = () => {
    setWebViewKey(prev => prev + 1)
  }

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <View style={styles.loadingContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MINER</Text>
        </View>

        <ActivityIndicator size="large" color="#10b981" />

        <Text style={styles.loadingText}>Loading Mining Platform...</Text>

        <View style={styles.loadingFeatures}>
          <Text style={styles.featureText}>✓ Smart Mining</Text>
          <Text style={styles.featureText}>✓ Staking Rewards</Text>
          <Text style={styles.featureText}>✓ Secure Wallet</Text>
        </View>
      </View>
    </View>
  )

  const renderNoConnection = () => (
    <View style={styles.noConnectionContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <View style={styles.noConnectionContent}>
        <Text style={styles.noConnectionTitle}>No Internet Connection</Text>
        <Text style={styles.noConnectionText}>
          Please check your internet connection and try again.
        </Text>

        <button
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </View>
    </View>
  )

  const webViewRef = React.useRef<WebView>(null)

  const injectedJavaScript = `
    (function() {
      // Inject React Native bridge
      window.ReactNativeWebView = {
        postMessage: function(data) {
          window.ReactNativeBridge.postMessage(data);
        }
      };

      // Create bridge for WebView communication
      window.ReactNativeBridge = {
        postMessage: function(data) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(data);
          }
        }
      };

      // Detect device type
      window.isNativeApp = true;
      window.isIOS = ${Platform.OS === 'ios'};
      window.isAndroid = ${Platform.OS === 'android'};

      // Add mobile-specific classes
      document.body.classList.add('native-app');
      document.body.classList.add('${Platform.OS}-app');

      // Override Web3 wallet connection
      if (typeof window.ethereum !== 'undefined') {
        const originalRequest = window.ethereum.request;
        window.ethereum.request = async function(args) {
          if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
            // Use native wallet connection
            return new Promise((resolve, reject) => {
              window.ReactNativeBridge.postMessage(JSON.stringify({
                type: 'CONNECT_WALLET',
                data: { method: args.method }
              }));

              // Listen for response
              const handleMessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'WALLET_CONNECTED') {
                    window.removeEventListener('message', handleMessage);
                    resolve(['0x1234567890abcdef1234567890abcdef12345678']); // Mock address
                  } else if (data.type === 'WALLET_CONNECTION_ERROR') {
                    window.removeEventListener('message', handleMessage);
                    reject(new Error(data.data.error));
                  }
                } catch (error) {
                  reject(error);
                }
              };

              window.addEventListener('message', handleMessage);
            });
          }
          return originalRequest.apply(this, arguments);
        };
      }

      true;
    })();
  `

  if (isLoading) {
    return renderLoadingScreen()
  }

  if (!isConnected) {
    return renderNoConnection()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0f172a"
        translucent={false}
      />

      <WebView
        ref={webViewRef}
        key={webViewKey}
        source={{ uri: WEB_APP_URL }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onNavigationStateChange={(navState) => {
          // Handle navigation state changes
          if (navState.url.includes('/auth/')) {
            // User is on auth page
          }
        }}
        onLoadStart={() => {
          // Show loading indicator if needed
        }}
        onLoadEnd={() => {
          // Hide loading indicator
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('WebView error: ', nativeEvent)
          Alert.alert('Error', 'Failed to load the application. Please try again.')
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.warn('HTTP error: ', nativeEvent)
        }}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 20,
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingFeatures: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    marginVertical: 4,
  },
  noConnectionContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noConnectionContent: {
    alignItems: 'center',
  },
  noConnectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  noConnectionText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MinerApp