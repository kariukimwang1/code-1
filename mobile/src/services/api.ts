import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Types
import { User, ApiResponse, PaginatedResponse } from '../types';

class API {
  private instance: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production'
      ? 'https://api.cryptoplatform.com'
      : 'http://localhost:3000/api';

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Add request ID for tracking
          config.headers['X-Request-ID'] = this.generateRequestId();

          return config;
        } catch (error) {
          console.error('Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.instance.post('/auth/refresh', {
                refreshToken,
              });

              const { token } = response.data.data;
              await AsyncStorage.setItem('auth_token', token);

              // Process queue
              this.failedQueue.forEach(({ resolve }) => resolve(token));
              this.failedQueue = [];

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            } else {
              throw new Error('No refresh token');
            }
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];

            // Clear tokens and redirect to login
            await this.clearTokens();
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other HTTP errors
        if (error.response) {
          this.handleHttpError(error.response);
        } else if (error.request) {
          this.handleNetworkError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async clearTokens() {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private handleAuthError() {
    // Navigate to login screen (would need to use navigation or event system)
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
      [{ text: 'OK' }]
    );
  }

  private handleHttpError(response: AxiosResponse) {
    const { status, data } = response;

    switch (status) {
      case 400:
        console.error('Bad Request:', data.message);
        break;
      case 403:
        console.error('Forbidden:', data.message);
        break;
      case 404:
        console.error('Not Found:', data.message);
        break;
      case 429:
        console.error('Rate Limited:', data.message);
        break;
      case 500:
        console.error('Server Error:', data.message);
        Alert.alert('Server Error', 'Something went wrong. Please try again later.');
        break;
      default:
        console.error('HTTP Error:', status, data.message);
    }
  }

  private handleNetworkError(error: any) {
    if (error.code === 'NETWORK_ERROR') {
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Request timed out. Please try again.');
    } else {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get(url, config);
      return response.data;
    } catch (error) {
      console.error('GET Error:', error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error('POST Error:', error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error('PUT Error:', error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error('PATCH Error:', error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete(url, config);
      return response.data;
    } catch (error) {
      console.error('DELETE Error:', error);
      throw error;
    }
  }

  // File upload
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Download
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    try {
      const response = await this.instance.get(url, {
        ...config,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Download Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User> {
    const response = await this.get<User>('/auth/me');
    return response.data!;
  }

  // Pagination helper
  async getPaginated<T>(
    url: string,
    page: number = 1,
    limit: number = 20,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.get<PaginatedResponse<T>>(`${url}?${params}`, config);
    return response.data!;
  }

  // Batch requests
  async batchRequests<T>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    data?: any;
  }>): Promise<T[]> {
    try {
      const response = await this.post<T[]>('/batch', { requests });
      return response.data!;
    } catch (error) {
      console.error('Batch request error:', error);
      throw error;
    }
  }

  // WebSocket upgrade
  async upgradeToWebSocket(path: string): Promise<WebSocket> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const wsUrl = this.baseURL.replace('http', 'ws') + path + `?token=${token}`;

      return new WebSocket(wsUrl);
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const API = new API();

// Export axios instance for advanced usage
export const axiosInstance = API['instance'];

export default API;