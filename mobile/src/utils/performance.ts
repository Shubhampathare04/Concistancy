/**
 * Mobile Performance Optimization Utilities
 * 
 * Provides optimized configurations and utilities for:
 * - FlatList rendering
 * - Image caching
 * - Memory management
 * - Battery optimization
 */

import { FlatListProps } from 'react-native';

/**
 * Optimized FlatList props for large lists
 * Fixes H1: FlatList performance issues
 */
export const OPTIMIZED_FLATLIST_PROPS = {
  // Remove clipped subviews for better performance
  removeClippedSubviews: true,
  
  // Render items in batches
  maxToRenderPerBatch: 10,
  
  // Update cells in batches
  updateCellsBatchingPeriod: 50,
  
  // Initial number of items to render
  initialNumToRender: 15,
  
  // Window size (number of screens to render)
  windowSize: 10,
  
  // Enable faster scrolling
  legacyImplementation: false,
};

/**
 * Get optimized FlatList props with item height
 * Use when all items have the same height for maximum performance
 */
export function getOptimizedFlatListProps<T>(itemHeight: number): Partial<FlatListProps<T>> {
  return {
    ...OPTIMIZED_FLATLIST_PROPS,
    getItemLayout: (data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
  };
}

/**
 * Exponential backoff for polling
 * Fixes H2: Battery drain from constant polling
 */
export class ExponentialBackoff {
  private currentInterval: number;
  private readonly minInterval: number;
  private readonly maxInterval: number;
  private readonly multiplier: number;

  constructor(
    minInterval: number = 5000,
    maxInterval: number = 30000,
    multiplier: number = 1.5
  ) {
    this.minInterval = minInterval;
    this.maxInterval = maxInterval;
    this.multiplier = multiplier;
    this.currentInterval = minInterval;
  }

  /**
   * Get current polling interval
   */
  getInterval(): number {
    return this.currentInterval;
  }

  /**
   * Increase interval (slow down polling)
   */
  increase(): number {
    this.currentInterval = Math.min(
      this.currentInterval * this.multiplier,
      this.maxInterval
    );
    return this.currentInterval;
  }

  /**
   * Reset to minimum interval (speed up polling)
   */
  reset(): number {
    this.currentInterval = this.minInterval;
    return this.currentInterval;
  }

  /**
   * Decrease interval (speed up polling)
   */
  decrease(): number {
    this.currentInterval = Math.max(
      this.currentInterval / this.multiplier,
      this.minInterval
    );
    return this.currentInterval;
  }
}

/**
 * Smart polling manager
 * Adjusts polling frequency based on activity
 */
export class SmartPoller {
  private backoff: ExponentialBackoff;
  private lastActivityTime: number;
  private readonly activityThreshold: number;

  constructor(activityThresholdMs: number = 60000) {
    this.backoff = new ExponentialBackoff();
    this.lastActivityTime = Date.now();
    this.activityThreshold = activityThresholdMs;
  }

  /**
   * Mark activity (new message, user interaction, etc.)
   */
  markActivity(): void {
    this.lastActivityTime = Date.now();
    this.backoff.reset();
  }

  /**
   * Get current polling interval based on activity
   */
  getInterval(): number {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    
    if (timeSinceActivity < this.activityThreshold) {
      // Recent activity - poll frequently
      return this.backoff.getInterval();
    } else {
      // No recent activity - slow down
      this.backoff.increase();
      return this.backoff.getInterval();
    }
  }

  /**
   * Reset polling to fast interval
   */
  reset(): void {
    this.lastActivityTime = Date.now();
    this.backoff.reset();
  }
}

/**
 * Memory-efficient list key extractor
 */
export function createKeyExtractor<T extends { id: number | string }>(
  prefix: string = 'item'
): (item: T, index: number) => string {
  return (item, index) => `${prefix}-${item.id}-${index}`;
}

/**
 * Debounce function for search and input
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
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request deduplication cache
 * Prevents duplicate API calls
 */
export class RequestCache {
  private cache: Map<string, Promise<any>>;
  private readonly ttl: number;

  constructor(ttlMs: number = 1000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  /**
   * Get or create a request
   */
  getOrCreate<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const promise = factory();
    this.cache.set(key, promise);

    // Remove from cache after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);

    return promise;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove specific key
   */
  remove(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Image cache configuration
 */
export const IMAGE_CACHE_CONFIG = {
  // Cache images for 7 days
  maxAge: 7 * 24 * 60 * 60,
  
  // Max cache size: 100MB
  maxSize: 100 * 1024 * 1024,
  
  // Prefetch priority images
  prefetchPriority: 'high' as const,
};

/**
 * Batch operations helper
 * Groups multiple operations into batches
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private readonly batchSize: number;
  private readonly processor: (batch: T[]) => Promise<void>;
  private timeout: NodeJS.Timeout | null = null;
  private readonly maxWaitMs: number;

  constructor(
    processor: (batch: T[]) => Promise<void>,
    batchSize: number = 10,
    maxWaitMs: number = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.maxWaitMs = maxWaitMs;
  }

  /**
   * Add item to batch
   */
  add(item: T): void {
    this.queue.push(item);

    // Process if batch is full
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    }
  }

  /**
   * Process current batch
   */
  async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);
    await this.processor(batch);
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private readonly threshold: number;
  private readonly onThresholdExceeded: () => void;

  constructor(thresholdMB: number = 150, onThresholdExceeded: () => void) {
    this.threshold = thresholdMB * 1024 * 1024;
    this.onThresholdExceeded = onThresholdExceeded;
  }

  /**
   * Check memory usage (if available)
   */
  check(): void {
    // Note: React Native doesn't expose memory API directly
    // This is a placeholder for native module integration
    if (global.performance && (global.performance as any).memory) {
      const memory = (global.performance as any).memory;
      if (memory.usedJSHeapSize > this.threshold) {
        this.onThresholdExceeded();
      }
    }
  }
}

/**
 * Component render tracker for debugging
 */
export function createRenderTracker(componentName: string) {
  let renderCount = 0;
  
  return () => {
    renderCount++;
    if (__DEV__) {
      console.log(`[Render] ${componentName} rendered ${renderCount} times`);
    }
  };
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
