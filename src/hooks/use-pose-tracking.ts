import { useCallback, useEffect, useRef, useState } from 'react';

import { PoseEngineConfig } from '@/constants/coach';
import type { PoseEngineError, PoseEngineMessage, PoseFrame } from '@/types/pose';

export type PoseEngineStatus = 'starting' | 'loading-runtime' | 'loading-model' | 'ready' | 'error';

type FrameSize = { width: number; height: number };

export function usePoseTracking(onFrame?: (frame: PoseFrame, size: FrameSize) => void) {
  const [status, setStatus] = useState<PoseEngineStatus>('starting');
  const [error, setError] = useState<PoseEngineError | null>(null);
  const [personDetected, setPersonDetected] = useState(false);
  const [fps, setFps] = useState(0);
  const [engineKey, setEngineKey] = useState(0);
  const latestFrame = useRef<PoseFrame | null>(null);
  const frameSize = useRef<FrameSize>({ width: 640, height: 480 });
  const framesThisSecond = useRef(0);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const fail = useCallback((code: PoseEngineError) => {
    setError(code);
    setStatus('error');
  }, []);

  useEffect(() => {
    if (status === 'ready' || status === 'error') return;
    const timer = setTimeout(() => fail('timeout'), PoseEngineConfig.startupTimeoutMs);
    return () => clearTimeout(timer);
  }, [status, engineKey, fail]);

  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setInterval(() => {
      setFps(framesThisSecond.current);
      framesThisSecond.current = 0;
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleMessage = useCallback(
    (data: string) => {
      let message: PoseEngineMessage;
      try {
        message = JSON.parse(data);
      } catch {
        return;
      }
      switch (message.type) {
        case 'camera-ready':
          frameSize.current = { width: message.width, height: message.height };
          break;
        case 'progress':
          setStatus(message.step === 'runtime' ? 'loading-runtime' : 'loading-model');
          break;
        case 'ready':
          setStatus('ready');
          break;
        case 'pose': {
          const frame: PoseFrame = {
            timestamp: message.t,
            landmarks: message.landmarks.map(([x, y, z, visibility]) => ({ x, y, z, visibility })),
          };
          latestFrame.current = frame;
          framesThisSecond.current += 1;
          setPersonDetected(true);
          onFrameRef.current?.(frame, frameSize.current);
          break;
        }
        case 'no-person':
          latestFrame.current = null;
          framesThisSecond.current += 1;
          setPersonDetected(false);
          break;
        case 'error':
          fail(message.code);
          break;
      }
    },
    [fail],
  );

  const restart = useCallback(() => {
    latestFrame.current = null;
    setError(null);
    setPersonDetected(false);
    setFps(0);
    setStatus('starting');
    setEngineKey((key) => key + 1);
  }, []);

  return {
    status,
    error,
    personDetected,
    fps,
    engineKey,
    latestFrame,
    handleMessage,
    handleLoadError: () => fail('crashed'),
    restart,
  };
}
