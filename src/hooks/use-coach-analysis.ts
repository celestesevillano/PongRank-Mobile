import { useCallback, useEffect, useRef, useState } from 'react';

import type { PoseFrame } from '@/types/pose';
import { analyzePosture, postureTip, shoulderWidthPixels, wristSpeed, type FrameSize } from '@/utils/pose-metrics';

const LIVE_REFRESH_MS = 250;
const SMOOTHING = 0.3;
const MAX_SCALE_JUMP = 0.25;

export type LiveMetrics = {
  postureScore: number | null;
  kneeAngle: number | null;
  swingPeak: number;
  tip: string;
};

export type SessionSummary = {
  durationSeconds: number;
  postureScore: number;
  swingVelocityMax: number;
  kneeFlexionAngle?: number;
  shoulderRotationAngle?: number;
  analyzedFrames: number;
};

type Totals = { posture: number[]; knee: number[]; rotation: number[]; swingPeak: number; startedAt: number | null };

const emptyTotals = (): Totals => ({ posture: [], knee: [], rotation: [], swingPeak: 0, startedAt: null });
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const round1 = (value: number) => Math.round(value * 10) / 10;

export function useCoachAnalysis(active: boolean) {
  const [live, setLive] = useState<LiveMetrics>({ postureScore: null, kneeAngle: null, swingPeak: 0, tip: 'Aléjate hasta que se vean tus pies' });
  const totals = useRef<Totals>(emptyTotals());
  const previous = useRef<{ frame: PoseFrame; scale: number } | null>(null);
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
    current.startedAt ??= frame.timestamp;

    const analysis = analyzePosture(frame, size);
    const scale = shoulderWidthPixels(frame, size);
    const last = previous.current;
    if (last && scale && Math.abs(scale - last.scale) / last.scale <= MAX_SCALE_JUMP) {
      const speed = wristSpeed(last.frame, frame, size);
      if (speed !== null) current.swingPeak = Math.max(current.swingPeak, speed);
    }
    previous.current = scale ? { frame, scale } : null;

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
      tip: postureTip(analysis),
    };
  }, []);

  const summary = useCallback((endedAt: number): SessionSummary | null => {
    const current = totals.current;
    if (current.startedAt === null || current.posture.length === 0) return null;
    const maxRotation = current.rotation.reduce((widest, value) => (Math.abs(value) > Math.abs(widest) ? value : widest), 0);
    return {
      durationSeconds: Math.max(1, Math.round((endedAt - current.startedAt) / 1000)),
      postureScore: round1(mean(current.posture)),
      swingVelocityMax: round1(current.swingPeak),
      kneeFlexionAngle: round1(mean(current.knee)),
      shoulderRotationAngle: current.rotation.length ? round1(maxRotation) : undefined,
      analyzedFrames: current.posture.length,
    };
  }, []);

  const reset = useCallback(() => {
    totals.current = emptyTotals();
    previous.current = null;
    smoothed.current = { posture: null, knee: null };
    pending.current = { postureScore: null, kneeAngle: null, swingPeak: 0, tip: 'Aléjate hasta que se vean tus pies' };
  }, []);

  return { live, onFrame, summary, reset };
}
