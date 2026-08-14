import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to manage persistent state in localStorage with SSR-safety,
 * JSON serialization, and cross-tab synchronization support.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with lazy evaluation
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`[usePersistedState] Error reading localStorage key "${key}":`, error);
    }
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });

  // Sync back to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`[usePersistedState] Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  // Support functional updater and standard value setting
  const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
    setState((current) => {
      const next = typeof value === "function" ? (value as (val: T) => T)(current) : value;
      return next;
    });
  }, []);

  return [state, setPersistedState];
}
