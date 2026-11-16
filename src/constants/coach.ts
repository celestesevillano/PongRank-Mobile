const MEDIAPIPE_VERSION = '1.2.0';
const MEDIAPIPE_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;

export const PoseEngineConfig = {
  bundleUrl: `${MEDIAPIPE_CDN}/vision_bundle.mjs`,
  wasmUrl: `${MEDIAPIPE_CDN}/wasm`,
  modelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  targetFps: 15,
  startupTimeoutMs: 60000,
} as const;

export const PoseLandmarkIndex = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;
