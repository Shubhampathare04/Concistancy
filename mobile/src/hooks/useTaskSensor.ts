/**
 * useTaskSensor
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects what kind of real-world sensor a task needs based on its title,
 * then provides live progress tracking for that sensor type.
 *
 * Sensor types:
 *   steps  → Accelerometer peak detection (useMotionTracker)
 *   timer  → Elapsed time in minutes (setInterval)
 *   reps   → Manual tap counter with haptic feedback
 *   water  → Manual tap counter (glasses)
 *   none   → No sensor, manual complete only
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useMotionTracker } from './useMotionTracker';
import { SensorType } from '@/features/tasks/types';

// ── Keyword maps ──────────────────────────────────────────────────────────────
const STEP_KEYWORDS   = ['step', 'walk', 'run', 'jog', 'hike', 'march', 'stride'];
const TIMER_KEYWORDS  = ['minute', 'min', 'hour', 'meditat', 'read', 'study', 'focus', 'work', 'practice', 'stretch', 'yoga', 'plank'];
const REPS_KEYWORDS   = ['pushup', 'push-up', 'pullup', 'pull-up', 'squat', 'situp', 'sit-up', 'rep', 'curl', 'press', 'lunge', 'burpee', 'crunch'];
const WATER_KEYWORDS  = ['water', 'glass', 'drink', 'hydrat', 'litre', 'liter', 'ml', 'oz'];

export function detectSensorType(title: string, description?: string): SensorType {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  if (STEP_KEYWORDS.some((k)  => text.includes(k))) return 'steps';
  if (WATER_KEYWORDS.some((k) => text.includes(k))) return 'water';
  if (REPS_KEYWORDS.some((k)  => text.includes(k))) return 'reps';
  if (TIMER_KEYWORDS.some((k) => text.includes(k))) return 'timer';
  return 'none';
}

export function detectTarget(title: string, description?: string): number | undefined {
  const text = `${title} ${description ?? ''}`;
  // Match patterns like "10000 steps", "8 glasses", "30 minutes", "100 pushups"
  const match = text.match(/(\d[\d,]*)\s*(step|walk|glass|min|rep|pushup|squat|ml|litre|liter|km|k\b)/i);
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

export function sensorLabel(type: SensorType): string {
  switch (type) {
    case 'steps': return 'steps';
    case 'timer': return 'min';
    case 'reps':  return 'reps';
    case 'water': return 'glasses';
    default:      return '';
  }
}

export function sensorIcon(type: SensorType): string {
  switch (type) {
    case 'steps': return 'walk-outline';
    case 'timer': return 'timer-outline';
    case 'reps':  return 'barbell-outline';
    case 'water': return 'water-outline';
    default:      return 'checkmark-circle-outline';
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

interface Options {
  taskId: number;
  sensorType: SensorType;
  target: number;
  active: boolean;  // only track when card is visible / user is active
}

export function useTaskSensor({ taskId, sensorType, target, active }: Options) {
  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const baseMinutesRef = useRef<number>(0);

  // Steps — delegate to motion tracker
  const { steps, isTracking } = useMotionTracker(active && sensorType === 'steps');

  // Sync steps into progress
  useEffect(() => {
    if (sensorType === 'steps') setProgress(steps);
  }, [steps, sensorType]);

  // Timer — counts elapsed minutes
  useEffect(() => {
    if (sensorType !== 'timer') return;
    if (!active) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      return;
    }
    // Auto-start timer when card becomes active
    startTimeRef.current = Date.now();
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 60000) + baseMinutesRef.current;
      setProgress(elapsed);
    }, 10000); // update every 10s

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, sensorType]);

  // Manual increment (reps / water)
  const increment = useCallback(() => {
    if (sensorType !== 'reps' && sensorType !== 'water') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setProgress((p) => Math.min(p + 1, target * 2));
  }, [sensorType, target]);

  const decrement = useCallback(() => {
    if (sensorType !== 'reps' && sensorType !== 'water') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setProgress((p) => Math.max(p - 1, 0));
  }, [sensorType]);

  const pct = target > 0 ? Math.min(progress / target, 1) : 0;
  const done = pct >= 1;

  return {
    progress,
    pct,
    done,
    isTracking: sensorType === 'steps' ? isTracking : sensorType === 'timer' ? timerActive : false,
    increment,
    decrement,
  };
}
