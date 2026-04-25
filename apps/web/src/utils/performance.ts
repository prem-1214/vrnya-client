/**
 * Performance optimization utilities for token streaming and message rendering
 * P3-12: Performance Optimization Pass
 */

/**
 * Batches token updates to reduce render cycles
 * Yields chunks of tokens at specified interval
 */
export async function* batchTokens(
  source: AsyncIterable<string>,
  batchTimeMs: number = 50,
): AsyncGenerator<string> {
  let buffer = "";
  let lastFlush = Date.now();

  try {
    for await (const token of source) {
      buffer += token;
      const now = Date.now();

      if (now - lastFlush >= batchTimeMs || buffer.length > 1000) {
        if (buffer) {
          yield buffer;
          buffer = "";
          lastFlush = now;
        }
      }
    }

    // Flush remaining tokens
    if (buffer) {
      yield buffer;
    }
  } catch (error) {
    if (buffer) {
      yield buffer;
    }
    throw error;
  }
}

/**
 * Debounces function calls to reduce frequency
 * Useful for handling frequent state updates
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttles function calls to limit execution frequency
 * Useful for scroll and resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number,
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= intervalMs) {
      fn(...args);
      lastCallTime = now;

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else if (!timeoutId) {
      const remainingTime = intervalMs - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        fn(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, remainingTime);
    }
  };
}

/**
 * Measures performance metrics for debugging
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();

  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  measure(label: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end && endMark) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;

    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getStats(label: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
  } | null {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
    };
  }

  clear(): void {
    this.marks.clear();
    this.measurements.clear();
  }
}

/**
 * Intersection Observer helper for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: Partial<IntersectionObserverInit>,
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: "50px",
    threshold: 0,
    ...options,
  });
}

/**
 * Request Idle Callback with fallback
 */
export function scheduleIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
): number {
  if ("requestIdleCallback" in window) {
    return (window as any).requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  const timeoutId = window.setTimeout(() => {
    callback({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline);
  }, 1000);

  return timeoutId as any;
}

/**
 * Cancel Idle Callback with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ("cancelIdleCallback" in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();
