/**
 * Performance utilities for debouncing and throttling
 */

/**
 * Debounce function - delays execution until after wait time has elapsed since last call
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 * @param func Function to throttle
 * @param wait Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          executedFunction(...lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Request animation frame throttle - ensures function is called at most once per frame
 * @param func Function to throttle
 * @returns Throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Debounce with leading edge - executes immediately on first call, then debounces
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime: number = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    const later = () => {
      timeout = null;
      lastCallTime = Date.now();
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    // Execute immediately if enough time has passed
    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      func(...args);
    } else {
      timeout = setTimeout(later, wait - timeSinceLastCall);
    }
  };
}

/**
 * Create a debounced callback hook-compatible function
 * @param callback Callback function
 * @param delay Delay in milliseconds
 * @returns Debounced callback
 */
export function createDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): {
  debouncedCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedCallback = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      if (lastArgs) {
        callback(...lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, delay);
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      lastArgs = null;
    }
  };

  const flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout);
      callback(...lastArgs);
      timeout = null;
      lastArgs = null;
    }
  };

  return { debouncedCallback, cancel, flush };
}

/**
 * Create a throttled callback hook-compatible function
 * @param callback Callback function
 * @param delay Delay in milliseconds
 * @returns Throttled callback
 */
export function createThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): {
  throttledCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number = 0;

  const throttledCallback = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      callback(...args);
    } else {
      lastArgs = args;
      if (!timeout) {
        timeout = setTimeout(() => {
          if (lastArgs) {
            lastCallTime = Date.now();
            callback(...lastArgs);
          }
          timeout = null;
          lastArgs = null;
        }, delay - timeSinceLastCall);
      }
    }
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      lastArgs = null;
    }
  };

  return { throttledCallback, cancel };
}
