import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error: any, customMessage?: string): string => {
  // Network errors
  if (error?.message?.includes('Network') || error?.message?.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }

  // HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 400:
        return customMessage || error?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return customMessage || error?.message || 'This action conflicts with existing data.';
      case 413:
        return 'The request is too large. Please try again with smaller data.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        return customMessage || error?.message || 'An error occurred. Please try again.';
    }
  }

  // Generic error
  return customMessage || error?.message || 'An unexpected error occurred.';
};

export const showErrorAlert = (error: any, customMessage?: string) => {
  const message = handleApiError(error, customMessage);
  Alert.alert('Error', message);
};

export const showSuccessAlert = (message: string) => {
  Alert.alert('Success', message);
};
