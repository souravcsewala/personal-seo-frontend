'use client';

import { useSyncExternalStore, useMemo, useRef } from 'react';
import store from './store';

/**
 * SSR-safe version of useSelector that returns default value during server-side rendering
 * 
 * This hook uses useSyncExternalStore to safely subscribe to Redux store changes.
 * If we're in SSR/build mode, it returns the default value without accessing the store.
 * 
 * IMPORTANT: All hooks are called unconditionally to satisfy Rules of Hooks.
 */
export function useSelector(selector, defaultValue = null) {
  // Use ref to track if we're in SSR/build mode
  const isSSR = useRef(typeof window === 'undefined');
  
  // Create a stable no-op subscribe function for SSR
  const noOpSubscribe = useMemo(() => () => () => {}, []);
  
  // Create subscribe function - use no-op if in SSR mode
  const subscribe = useMemo(() => {
    if (isSSR.current) {
      return noOpSubscribe;
    }
    try {
      return store.subscribe.bind(store);
    } catch (error) {
      return noOpSubscribe;
    }
  }, [noOpSubscribe]);
  
  // Create snapshot function that safely accesses store
  const getSnapshot = useMemo(() => {
    return () => {
      if (isSSR.current) {
        return defaultValue;
      }
      try {
        const state = store.getState();
        return selector(state) ?? defaultValue;
      } catch (error) {
        return defaultValue;
      }
    };
  }, [selector, defaultValue]);
  
  // Always call useSyncExternalStore unconditionally (required by Rules of Hooks)
  // Use the same function for all snapshots to ensure consistency
  const selectedValue = useSyncExternalStore(
    subscribe,
    getSnapshot, // Client snapshot
    getSnapshot, // Server snapshot (SSR fallback)
    getSnapshot  // Hydration fallback
  );
  
  return selectedValue ?? defaultValue;
}

