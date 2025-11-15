'use client';

import { useRef, useMemo } from 'react';
import store from './store';

/**
 * SSR-safe version of useDispatch that returns a no-op function during server-side rendering
 * 
 * During SSR/build, this returns a function that does nothing.
 * On the client, it returns the actual dispatch function from the store.
 */
export function useDispatch() {
  // Use ref to track if we're in SSR/build mode
  const isSSR = useRef(typeof window === 'undefined');
  
  // Return dispatch function - no-op during SSR, actual dispatch on client
  return useMemo(() => {
    if (isSSR.current) {
      // Return a no-op function during SSR/build
      return () => {};
    }
    // Return the actual dispatch function from the store
    return store.dispatch.bind(store);
  }, []);
}

