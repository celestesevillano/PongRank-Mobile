export type PoseLandmark = { x: number; y: number; z: number; visibility: number };

export type PoseFrame = { timestamp: number; landmarks: PoseLandmark[] };

export type CameraFacing = 'user' | 'environment';

export type PoseEngineError = 'camera-denied' | 'camera-unavailable' | 'unsupported' | 'offline' | 'model-failed' | 'timeout' | 'crashed';

type CompactLandmark = [number, number, number, number];

export type PoseEngineMessage =
  | { type: 'camera-ready'; width: number; height: number }
  | { type: 'ready'; delegate: 'GPU' | 'CPU' }
  | { type: 'pose'; t: number; landmarks: CompactLandmark[] }
  | { type: 'no-person'; t: number }
  | { type: 'error'; code: PoseEngineError; detail?: string };
