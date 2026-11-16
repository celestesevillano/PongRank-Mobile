import { useCallback, useEffect, useRef, useState } from 'react';

import type { PoseFrame } from '@/types/pose';
import { analyzePosture, postureTip, shoulderWidthPixels, wristSpeed, type FrameSize } from '@/utils/pose-metrics';

const LIVE_REFRESH_MS = 250;
const SMOOTHING = 0.3;
const SCALE_TRACKING = 0.1;
const MAX_SCALE_UPDATE = 0.25;
const SWING_THRESHOLD = 1.2;
const MIN_MS_BETWEEN_SWINGS = 600;

export type LiveMetrics = {
  postureScore: number | null;
  kneeAngle: number | null;
  swingPeak: number;
  swings: number;
  tip: string;
};

export type SessionSummary = {
  durationSeconds: number;
  postureScore: number;
  swingVelocityMax: number;
  kneeFlexionAngle?: number;
  shoulderRotationAngle?: number;
  swings: number;
  analyzedFrames: number;
};

type Totals = { posture: number[]; knee: number[]; rotation: number[]; swingPeak: number; swings: number; lastSwingAt: number | null };

const emptyTotals = (): Totals => ({ posture: [], knee: [], rotation: [], swingPeak: 0, swings: 0, lastSwingAt: null });
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const round1 = (value: number) => Math.round(value * 10) / 10;
const INITIAL_LIVE: LiveMetrics = { postureScore: null, kneeAngle: null, swingPeak: 0, swings: 0, tip: 'Aléjate hasta que se vean tus pies' };

export function useCoachAnalysis(active: boolean) {
  const [live, setLive] = useState<LiveMetrics>(INITIAL_LIVE);
  const totals = useRef<Totals>(emptyTotals());
  const previous = useRef<PoseFrame | null>(null);
  const scale = useRef<number | null>(null);
  const smoothed = useRef<{ posture: number | null; knee: number | null }>({ posture: null, knee: null });
  const pending = useRef<LiveMetrics | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const timer = setInterval(() => {
      if (pending.current) {
        setLive(pending.current);
        pending.current = null;
      }
    }, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!active) previous.current = null;
  }, [active]);

  const onFrame = useCallback((frame: PoseFrame, size: FrameSize) => {
    if (!activeRef.current) return;
    const current = totals.current;

    const analysis = analyzePosture(frame, size);
    const width = shoulderWidthPixels(frame, size);
    if (width) {
      const known = scale.current;
      if (known === null || width > known * (1 + MAX_SCALE_UPDATE)) scale.current = width;
      else if (Math.abs(width - known) / known <= MAX_SCALE_UPDATE) scale.current = known + (width - known) * SCALE_TRACKING;
    }
    const last = previous.current;
    if (last && scale.current) {
      const speed = wristSpeed(last, frame, size, scale.current);
      if (speed !== null) {
        current.swingPeak = Math.max(current.swingPeak, speed);
        const rested = current.lastSwingAt === null || frame.timestamp - current.lastSwingAt >= MIN_MS_BETWEEN_SWINGS;
        if (speed >= SWING_THRESHOLD && rested) {
          current.swings += 1;
          current.lastSwingAt = frame.timestamp;
        }
      }
    }
    previous.current = frame;

    if (analysis) {
      current.posture.push(analysis.score);
      current.knee.push(analysis.kneeAngle!);
      if (analysis.shoulderRotation !== null) current.rotation.push(analysis.shoulderRotation);
      const ease = (prior: number | null, next: number) => (prior === null ? next : prior + (next - prior) * SMOOTHING);
      smoothed.current = { posture: ease(smoothed.current.posture, analysis.score), knee: ease(smoothed.current.knee, analysis.kneeAngle!) };
    }

    pending.current = {
      postureScore: smoothed.current.posture === null ? null : Math.round(smoothed.current.posture),
      kneeAngle: smoothed.current.knee === null ? null : Math.round(smoothed.current.knee),
      swingPeak: round1(current.swingPeak),
      swings: current.swings,
      tip: postureTip(analysis),
    };
  }, []);

  const summary = useCallback((durationSeconds: number): SessionSummary | null => {
    const current = totals.current;
    if (current.posture.length === 0) return null;
    const maxRotation = current.rotation.reduce((widest, value) => (Math.abs(value) > Math.abs(widest) ? value : widest), 0);
    return {
      durationSeconds: Math.max(1, Math.round(durationSeconds)),
      postureScore: round1(mean(current.posture)),
      swingVelocityMax: round1(current.swingPeak),
      kneeFlexionAngle: round1(mean(current.knee)),
      shoulderRotationAngle: current.rotation.length ? round1(maxRotation) : undefined,
      swings: current.swings,
      analyzedFrames: current.posture.length,
    };
  }, []);

  const reset = useCallback(() => {
    totals.current = emptyTotals();
    previous.current = null;
    scale.current = null;
    smoothed.current = { posture: null, knee: null };
    pending.current = INITIAL_LIVE;
  }, []);

  return { live, onFrame, summary, reset };
}
