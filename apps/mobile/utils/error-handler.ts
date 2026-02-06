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

interface ErrorLike {
  error?: { message?: string };
  message?: string;
  status?: number;
}

export const handleApiError = (error: unknown, customMessage?: string): string => {
  const err = error as ErrorLike | null | undefined;

  // Check for standardized API error format
  if (err?.error?.message) {
    return err.error.message;
  }

  // Network errors
  if (err?.message?.includes('Network') || err?.message?.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }

  // HTTP status codes fallback
  if (err?.status) {
    switch (err.status) {
      case 400:
        return customMessage || err?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return customMessage || err?.message || 'This action conflicts with existing data.';
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
        return customMessage || err?.message || 'An error occurred. Please try again.';
    }
  }

  // Generic error
  return customMessage || err?.message || 'An unexpected error occurred.';
};

export const showErrorAlert = (error: unknown, customMessage?: string) => {
  const message = handleApiError(error, customMessage);
  Alert.alert('Error', message);
};

export const showSuccessAlert = (message: string) => {
  Alert.alert('Success', message);
};
