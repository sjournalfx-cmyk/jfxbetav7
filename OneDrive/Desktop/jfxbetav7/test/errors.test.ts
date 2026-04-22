import { describe, it, expect } from 'vitest';
import {
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  isNetworkError,
  isAuthError,
  getErrorMessage,
} from '../lib/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, { context: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.status).toBe(500);
      expect(error.context).toEqual({ context: 'test' });
      expect(error.name).toBe('AppError');
    });
  });

  describe('NetworkError', () => {
    it('should have default values', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network error occurred');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.status).toBe(0);
      expect(error.name).toBe('NetworkError');
    });

    it('should accept custom message', () => {
      const error = new NetworkError('Custom network error');
      expect(error.message).toBe('Custom network error');
    });
  });

  describe('AuthError', () => {
    it('should have default values', () => {
      const error = new AuthError();
      
      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.status).toBe(401);
      expect(error.name).toBe('AuthError');
    });
  });

  describe('ValidationError', () => {
    it('should create with message', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource name', () => {
      const error = new NotFoundError('Trade');
      
      expect(error.message).toBe('Trade not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });
});

describe('Error Utilities', () => {
  describe('isNetworkError', () => {
    it('should return true for NetworkError instances', () => {
      expect(isNetworkError(new NetworkError())).toBe(true);
    });

    it('should return true for errors with FETCH_ERROR code', () => {
      const error = { code: 'FETCH_ERROR' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for errors with "Failed to fetch" message', () => {
      const error = new Error('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isNetworkError(new Error('Some error'))).toBe(false);
      expect(isNetworkError(new AuthError())).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for AuthError instances', () => {
      expect(isAuthError(new AuthError())).toBe(true);
    });

    it('should return true for errors with status 401', () => {
      const error = { status: 401 };
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for errors with AUTH_ERROR code', () => {
      const error = { code: 'AUTH_ERROR' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isAuthError(new Error('Some error'))).toBe(false);
      expect(isAuthError(new NetworkError())).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from AppError', () => {
      expect(getErrorMessage(new AppError('Custom message', 'TEST'))).toBe('Custom message');
    });

    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('Regular error'))).toBe('Regular error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });
  });
});
