import { useCallback } from 'react';
import { useToast, type ToastType } from '../components/ui/Toast';
import { 
  AppError, 
  NetworkError, 
  AuthError, 
  ValidationError,
  isNetworkError, 
  isAuthError,
  getErrorMessage,
  logError 
} from '../lib/errors';

interface UseErrorHandlerOptions {
  onNetworkError?: (error: unknown) => void;
  onAuthError?: (error: unknown) => void;
  onValidationError?: (error: unknown) => void;
  onUnknownError?: (error: unknown) => void;
  defaultMessage?: string;
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, options?: UseErrorHandlerOptions) => void;
  handleAsync: <T>(fn: () => Promise<T>, options?: UseErrorHandlerOptions) => Promise<T | undefined>;
  toastError: (title: string, message: string, toastType?: ToastType) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const { addToast } = useToast();

  const toastError = useCallback((title: string, message: string, toastType: ToastType = 'error') => {
    addToast({
      type: toastType,
      title,
      message,
      duration: 5000,
    });
  }, [addToast]);

  const handleError = useCallback((error: unknown, options: UseErrorHandlerOptions = {}) => {
    const {
      onNetworkError,
      onAuthError,
      onValidationError,
      onUnknownError,
      defaultMessage = 'An error occurred',
    } = options;

    logError(error);

    if (isNetworkError(error)) {
      toastError('Connection Error', 'Please check your internet connection');
      onNetworkError?.(error);
      return;
    }

    if (isAuthError(error)) {
      toastError('Session Expired', 'Please log in again');
      onAuthError?.(error);
      return;
    }

    if (error instanceof ValidationError) {
      toastError('Validation Error', error.message);
      onValidationError?.(error);
      return;
    }

    if (error instanceof AppError) {
      toastError('Error', error.message);
      onUnknownError?.(error);
      return;
    }

    toastError('Error', getErrorMessage(error) || defaultMessage);
    onUnknownError?.(error);
  }, [toastError]);

  const handleAsync = useCallback(async <T>(
    fn: () => Promise<T>,
    options: UseErrorHandlerOptions = {}
  ): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsync,
    toastError,
  };
};

export const withErrorHandler = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: UseErrorHandlerOptions
): T => {
  return ((...args: Parameters<T>) => {
    const errorHandler = useErrorHandler();
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.handleError(error, options);
          throw error;
        });
      }
      return result;
    } catch (error) {
      errorHandler.handleError(error, options);
      throw error;
    }
  }) as T;
};
