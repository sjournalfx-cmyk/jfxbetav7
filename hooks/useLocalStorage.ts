
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => boolean] {
  // Get from local storage then use useState
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      // Handle the case where item is "null" string or actual null
      const parsed = item ? JSON.parse(item) : initialValue;
      return parsed !== null ? parsed : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)): boolean => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  };

  // Subscribe to storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
             const parsed = JSON.parse(e.newValue);
             if (parsed !== null) {
                 setStoredValue(parsed);
             }
        }
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return [storedValue, setValue];
}
