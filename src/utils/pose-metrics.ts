import { PoseLandmarkIndex as L } from '@/constants/coach';
import type { PoseFrame, PoseLandmark } from '@/types/pose';

export type FrameSize = { width: number; height: number };
type Point = { x: number; y: number };

const MIN_VISIBILITY = 0.5;
const MIN_WRIST_VISIBILITY = 0.3;
const SHOULDER_WIDTH_METERS = 0.4;
const MAX_FRAME_GAP_MS = 400;
export const SWING_VELOCITY_LIMIT = 50;

const IDEAL_KNEE = { min: 120, max: 150 };
const IDEAL_STANCE_RATIO = { min: 1.2, max: 1.9 };
const MAX_SHOULDER_TILT = 8;
const MAX_HEAD_OFFSET_RATIO = 0.35;

export type PostureCheck = 'knees' | 'stance' | 'balance' | 'arms';

export type PostureAnalysis = {
  score: number;
  kneeAngle: number | null;
  shoulderRotation: number | null;
  checks: Record<PostureCheck, number>;
  weakest: PostureCheck;
};

const WEIGHTS: Record<PostureCheck, number> = { knees: 0.35, stance: 0.25, balance: 0.2, arms: 0.2 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const visible = (...points: PoseLandmark[]) => points.every((point) => point && point.visibility >= MIN_VISIBILITY);
const toPixels = (landmark: PoseLandmark, size: FrameSize): Point => ({ x: landmark.x * size.width, y: landmark.y * size.height });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

export function angleAt(a: Point, vertex: Point, c: Point) {
  const first = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const second = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  const degrees = Math.abs(((first - second) * 180) / Math.PI);
  return degrees > 180 ? 360 - degrees : degrees;
}

function rangeScore(value: number, ideal: { min: number; max: number }, tolerance: number) {
  if (value >= ideal.min && value <= ideal.max) return 1;
  const gap = value < ideal.min ? ideal.min - value : value - ideal.max;
  return clamp(1 - gap / tolerance, 0, 1);
}

export function kneeFlexionAngle({ landmarks }: PoseFrame, size: FrameSize) {
  const sides = [
    [L.leftHip, L.leftKnee, L.leftAnkle],
    [L.rightHip, L.rightKnee, L.rightAnkle],
  ]
    .filter(([hip, knee, ankle]) => visible(landmarks[hip], landmarks[knee], landmarks[ankle]))
    .map(([hip, knee, ankle]) => angleAt(toPixels(landmarks[hip], size), toPixels(landmarks[knee], size), toPixels(landmarks[ankle], size)));
  return average(sides);
}

export function shoulderRotation({ landmarks }: PoseFrame) {
  const left = landmarks[L.leftShoulder];
  const right = landmarks[L.rightShoulder];
  if (!visible(left, right)) return null;
  return (Math.atan2(right.z - left.z, right.x - left.x) * 180) / Math.PI;
}

export function shoulderWidthPixels({ landmarks }: PoseFrame, size: FrameSize) {
  const left = landmarks[L.leftShoulder];
  const right = landmarks[L.rightShoulder];
  if (!visible(left, right)) return null;
  return distance(toPixels(left, size), toPixels(right, size));
}

export function analyzePosture(frame: PoseFrame, size: FrameSize): PostureAnalysis | null {
  const { landmarks } = frame;
  const shoulderWidth = shoulderWidthPixels(frame, size);
  const kneeAngle = kneeFlexionAngle(frame, size);
  if (shoulderWidth === null || shoulderWidth < 1 || kneeAngle === null) return null;

  const leftShoulder = toPixels(landmarks[L.leftShoulder], size);
  const rightShoulder = toPixels(landmarks[L.rightShoulder], size);
  const hips = visible(landmarks[L.leftHip], landmarks[L.rightHip])
    ? midpoint(toPixels(landmarks[L.leftHip], size), toPixels(landmarks[L.rightHip], size))
    : null;

  const stance = visible(landmarks[L.leftAnkle], landmarks[L.rightAnkle])
    ? rangeScore(distance(toPixels(landmarks[L.leftAnkle], size), toPixels(landmarks[L.rightAnkle], size)) / shoulderWidth, IDEAL_STANCE_RATIO, 0.8)
    : 0;

  const tilt = Math.abs((Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180) / Math.PI);
  const shoulderTilt = Math.min(tilt, 180 - tilt);
  const headOffset = hips && visible(landmarks[L.nose]) ? Math.abs(toPixels(landmarks[L.nose], size).x - hips.x) / shoulderWidth : 1;
  const balance = (clamp(1 - Math.max(0, shoulderTilt - MAX_SHOULDER_TILT) / 12, 0, 1) + clamp(1 - Math.max(0, headOffset - MAX_HEAD_OFFSET_RATIO) / 0.4, 0, 1)) / 2;

  const wrists = [L.leftWrist, L.rightWrist].filter((index) => visible(landmarks[index])).map((index) => toPixels(landmarks[index], size).y);
  const arms = hips && wrists.length ? (Math.min(...wrists) <= hips.y ? 1 : clamp(1 - (Math.min(...wrists) - hips.y) / shoulderWidth, 0, 1)) : 0;

  const checks: Record<PostureCheck, number> = { knees: rangeScore(kneeAngle, IDEAL_KNEE, 30), stance, balance, arms };
  const score = (Object.keys(WEIGHTS) as PostureCheck[]).reduce((total, key) => total + checks[key] * WEIGHTS[key], 0) * 100;
  const weakest = (Object.keys(checks) as PostureCheck[]).reduce((worst, key) => (checks[key] < checks[worst] ? key : worst), 'knees');

  return { score: Math.round(score), kneeAngle, shoulderRotation: shoulderRotation(frame), checks, weakest };
}

export function wristSpeed(previous: PoseFrame, current: PoseFrame, size: FrameSize, shoulderWidth: number) {
  const elapsedMs = current.timestamp - previous.timestamp;
  if (elapsedMs <= 0 || elapsedMs > MAX_FRAME_GAP_MS || shoulderWidth < 1) return null;
  const metersPerPixel = SHOULDER_WIDTH_METERS / shoulderWidth;

  const speeds = [L.leftWrist, L.rightWrist]
    .filter((index) => [previous.landmarks[index], current.landmarks[index]].every((point) => point && point.visibility >= MIN_WRIST_VISIBILITY))
    .map((index) => (distance(toPixels(previous.landmarks[index], size), toPixels(current.landmarks[index], size)) * metersPerPixel) / (elapsedMs / 1000));
  return speeds.length ? clamp(Math.max(...speeds), 0, SWING_VELOCITY_LIMIT) : null;
}

const TIPS: Record<PostureCheck, string> = {
  knees: 'Flexiona un poco más las rodillas',
  stance: 'Separa los pies algo más que el ancho de hombros',
  balance: 'Centra el peso y nivela los hombros',
  arms: 'Sube la mano de la paleta delante del cuerpo',
};

export function postureTip(analysis: PostureAnalysis | null) {
  if (!analysis) return 'Aléjate hasta que se vean tus pies';
  if (analysis.checks[analysis.weakest] >= 0.85) return '¡Buena posición! Mantenla y golpea';
  return TIPS[analysis.weakest];
}
