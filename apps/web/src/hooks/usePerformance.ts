import React, { useCallback, useRef, useEffect } from "react";
import { debounce, throttle } from "../utils/performance";

/**
 * Hook for optimizing frequent state updates
 * Batches updates to reduce re-renders
 */
export function useBatchedState<T>(initialValue: T, delayMs: number = 100) {
  const [state, setState] = React.useState(initialValue);
  const bufferRef = useRef<T>(initialValue);

  const setBatchedState = useCallback(
    debounce((value: T) => {
      setState(value);
    }, delayMs),
    [delayMs],
  );

  return [state, setBatchedState] as const;
}

/**
 * Hook for throttled event handlers
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  throttleMs: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    throttle((...args: any[]) => callbackRef.current(...args), throttleMs),
    [throttleMs],
  );
}

/**
 * Hook for debounced event handlers
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  debounceMs: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    debounce((...args: any[]) => callbackRef.current(...args), debounceMs),
    [debounceMs],
  );
}

/**
 * Hook for lazy loading elements with Intersection Observer
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "50px" },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}

/**
 * Hook for virtualized list rendering (simple version)
 * Shows only visible items to improve performance
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5,
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    startIndex,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    },
  };
}

export default {
  useBatchedState,
  useThrottledCallback,
  useDebouncedCallback,
  useLazyLoad,
  useVirtualizedList,
};
