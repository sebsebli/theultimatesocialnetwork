import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    // In production, enforce HTTPS
    if (!__DEV__ && !envUrl.startsWith('https://')) {
      throw new Error('EXPO_PUBLIC_API_BASE_URL must use HTTPS in production');
    }
    return envUrl;
  }
  
  // Development defaults
  if (__DEV__) {
    if (Platform.OS === 'ios') return 'http://localhost:3000';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  }
  
  // Production fallback - should be set via environment variable
  // This will cause an error if not configured, which is intentional
  throw new Error('EXPO_PUBLIC_API_BASE_URL must be set in production');
};

const API_URL = getApiUrl();
const TOKEN_KEY = 'jwt';

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// Global auth error handler - will be set by auth context
let onAuthError: (() => void) | null = null;

export const setAuthErrorHandler = (handler: () => void) => {
  onAuthError = handler;
};

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const token = await getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Check for network connectivity (basic check via fetch failure)
      // In a real app, use NetInfo
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        await clearAuthToken();
        // Trigger auth error handler to update auth state IMMEDIATELY
        // This must happen before throwing the error
        if (onAuthError) {
          try {
            onAuthError();
          } catch (handlerError) {
            // Ignore handler errors, but log in dev
            if (__DEV__) {
              console.warn('Auth error handler failed:', handlerError);
            }
          }
        }
        throw new ApiError('Unauthorized', 401);
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          // Keep text
        }
        throw new ApiError(errorMessage, response.status);
      }

      if (response.status === 204) return null;

      return await response.json();
    } catch (error: any) {
      console.error(`API Request Failed: ${endpoint}`, error);
      
      if (error.message === 'Auth check timeout') {
         throw new ApiError('Connection timed out. Please check your internet connection.', 0);
      }

      if (error.message === 'Network request failed' || error.message.includes('Network')) {
        throw new ApiError('Network error. Please check your internet connection.', 0);
      }
      
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async upload<T = any>(endpoint: string, file: any): Promise<T> {
    const formData = new FormData();
    const uriParts = file.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: file.uri,
      name: file.fileName || `photo.${fileType}` || 'image.jpg',
      type: file.type || `image/${fileType}` || 'image/jpeg',
    } as any);

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
