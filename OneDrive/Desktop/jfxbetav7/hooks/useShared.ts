import { useState, useCallback, useRef, useEffect } from 'react';

interface UseOptimisticUpdateOptions<T> {
  onUpdate: (item: T) => Promise<void>;
  onError?: (error: unknown, item: T) => void;
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<T extends { id: string }>(
  initialItems: T[],
  options: UseOptimisticUpdateOptions<T>
) {
  const { onUpdate, onError, rollbackOnError = true } = options;
  const [items, setItems] = useState<T[]>(initialItems);
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const optimisticUpdate = useCallback(async (updatedItem: T) => {
    const tempId = updatedItem.id;
    
    if (pendingRef.current.has(tempId)) return;
    pendingRef.current.add(tempId);

    const previousItems = items;
    setItems(prev => prev.map(item => item.id === tempId ? updatedItem : item));

    try {
      await onUpdate(updatedItem);
    } catch (error) {
      if (rollbackOnError) {
        setItems(previousItems);
      }
      onError?.(error, updatedItem);
    } finally {
      pendingRef.current.delete(tempId);
    }
  }, [items, onUpdate, onError, rollbackOnError]);

  const optimisticAdd = useCallback((newItem: T) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...newItem, id: tempId };
    setItems(prev => [optimisticItem, ...prev]);
    return { optimisticItem, tempId };
  }, []);

  const optimisticDelete = useCallback(async (
    itemId: string,
    onDelete: (id: string) => Promise<void>
  ) => {
    const previousItems = items;
    setItems(prev => prev.filter(item => item.id !== itemId));

    try {
      await onDelete(itemId);
    } catch (error) {
      setItems(previousItems);
      onError?.(error, items.find(item => item.id === itemId)!);
    }
  }, [items, onError]);

  return {
    items,
    setItems,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    
    return () => clearInterval(id);
  }, [delay]);
}

export function useKeyPress(targetKey: string, callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey]);
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    firstElement?.focus();
    ref.current.addEventListener('keydown', handleKeyDown);

    return () => {
      ref.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, ref]);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
