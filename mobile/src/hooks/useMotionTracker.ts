/**
 * useMotionTracker
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time step counter using Accelerometer magnitude peak detection.
 * Algorithm: sliding window peak detection on |a| = √(x²+y²+z²)
 * Persists daily count to AsyncStorage, auto-resets at midnight.
 *
 * Works on both iOS and Android via expo-sensors.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'motion_steps_v1';
const SAMPLE_INTERVAL_MS = 100;       // 10 Hz — good balance of accuracy vs battery
const PEAK_THRESHOLD     = 1.15;      // |a| must exceed this to count as a step
const MIN_STEP_INTERVAL  = 300;       // ms — debounce: ignore peaks < 300ms apart
const WINDOW_SIZE        = 5;         // samples in sliding window for smoothing

interface StoredSteps {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useMotionTracker(enabled: boolean) {
  const [steps, setSteps]         = useState(0);
  const [isTracking, setTracking] = useState(false);

  const stepsRef       = useRef(0);
  const lastStepTime   = useRef(0);
  const windowRef      = useRef<number[]>([]);
  const prevMagRef     = useRef(0);
  const wasAboveRef    = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // ── Load persisted steps for today ──────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const stored: StoredSteps = JSON.parse(raw);
        if (stored.date === todayStr()) {
          stepsRef.current = stored.count;
          setSteps(stored.count);
        }
      } catch {}
    });
  }, []);

  // ── Persist steps ────────────────────────────────────────────────────────────
  const persist = useCallback((count: number) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr(), count }));
  }, []);

  // ── Start / stop tracking ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setTracking(false);
      return;
    }

    Accelerometer.isAvailableAsync().then((available) => {
      if (!available) return;

      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      setTracking(true);

      subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        // Magnitude of acceleration vector
        const mag = Math.sqrt(x * x + y * y + z * z);

        // Smooth with sliding window
        windowRef.current.push(mag);
        if (windowRef.current.length > WINDOW_SIZE) windowRef.current.shift();
        const smoothed = windowRef.current.reduce((a, b) => a + b, 0) / windowRef.current.length;

        // Peak detection: rising edge crosses threshold, then falls back
        const now = Date.now();
        if (smoothed > PEAK_THRESHOLD && !wasAboveRef.current) {
          wasAboveRef.current = true;
          if (now - lastStepTime.current > MIN_STEP_INTERVAL) {
            lastStepTime.current = now;
            stepsRef.current += 1;
            setSteps(stepsRef.current);
            persist(stepsRef.current);
          }
        } else if (smoothed <= PEAK_THRESHOLD) {
          wasAboveRef.current = false;
        }

        prevMagRef.current = smoothed;
      });
    });

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setTracking(false);
    };
  }, [enabled]);

  const reset = useCallback(() => {
    stepsRef.current = 0;
    setSteps(0);
    persist(0);
  }, []);

  return { steps, isTracking, reset };
}
