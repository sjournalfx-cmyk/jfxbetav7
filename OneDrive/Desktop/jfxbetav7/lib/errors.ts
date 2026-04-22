export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error occurred', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, context);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof NetworkError) return true;
  if (!navigator.onLine) return true;
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if ((error as { code?: string })?.code === 'FETCH_ERROR') return true;
  if ((error as { message?: string })?.message?.includes('Failed to fetch')) return true;
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AuthError) return true;
  if ((error as { status?: number })?.status === 401) return true;
  if ((error as { code?: string })?.code === 'AUTH_ERROR') return true;
  return false;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

export const logError = (error: unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };
  
  if (import.meta.env.DEV) {
    console.group(`[ERROR] ${context || 'Unknown Context'} @ ${timestamp}`);
    console.error(error);
    console.groupEnd();
  }
  
  // In production, this could send to an error tracking service
  // errorTrackingService.capture(error, { context });
};
