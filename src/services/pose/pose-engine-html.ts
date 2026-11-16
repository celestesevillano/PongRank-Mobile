import { PoseEngineConfig } from '@/constants/coach';
import { Brand } from '@/constants/theme';
import type { CameraFacing } from '@/types/pose';

export function buildPoseEngineHtml(facing: CameraFacing) {
  const config = JSON.stringify({ ...PoseEngineConfig, facing, lineColor: Brand.cyan, jointColor: Brand.red });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  video, canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .mirror { transform: scaleX(-1); }
</style>
</head>
<body>
<video id="video" playsinline muted autoplay></video>
<canvas id="overlay"></canvas>
<script type="module">
const config = ${config};
const post = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const round = (value) => Math.round(value * 10000) / 10000;
let landmarker = null;
let connections = [];
let stream = null;
let facing = config.facing;
let paused = false;
let lastRun = 0;
let lastVideoTime = -1;
const minInterval = 1000 / config.targetFps;

window.addEventListener('error', (event) => post({ type: 'error', code: 'crashed', detail: String(event.message) }));
window.addEventListener('unhandledrejection', (event) => post({ type: 'error', code: 'crashed', detail: String(event.reason) }));
window.addEventListener('pagehide', () => stream && stream.getTracks().forEach((track) => track.stop()));

async function startCamera() {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  const mirror = facing === 'user';
  video.classList.toggle('mirror', mirror);
  canvas.classList.toggle('mirror', mirror);
  post({ type: 'camera-ready', width: video.videoWidth, height: video.videoHeight });
}

async function createLandmarker(vision, delegate) {
  return vision.PoseLandmarker.createFromOptions(await vision.FilesetResolver.forVisionTasks(config.wasmUrl), {
    baseOptions: { modelAssetPath: config.modelUrl, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

async function init() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    post({ type: 'error', code: 'unsupported' });
    return;
  }
  try {
    await startCamera();
  } catch (error) {
    post({ type: 'error', code: error && error.name === 'NotAllowedError' ? 'camera-denied' : 'camera-unavailable', detail: String(error) });
    return;
  }
  let vision;
  try {
    vision = await import(config.bundleUrl);
  } catch (error) {
    post({ type: 'error', code: navigator.onLine ? 'model-failed' : 'offline', detail: String(error) });
    return;
  }
  let delegate = 'GPU';
  try {
    landmarker = await createLandmarker(vision, 'GPU');
  } catch (gpuError) {
    try {
      delegate = 'CPU';
      landmarker = await createLandmarker(vision, 'CPU');
    } catch (error) {
      post({ type: 'error', code: navigator.onLine ? 'model-failed' : 'offline', detail: String(error) });
      return;
    }
  }
  connections = vision.PoseLandmarker.POSE_CONNECTIONS;
  post({ type: 'ready', delegate });
  requestAnimationFrame(loop);
}

function draw(landmarks) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!landmarks) return;
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const offsetX = (width - video.videoWidth * scale) / 2;
  const offsetY = (height - video.videoHeight * scale) / 2;
  const point = (landmark) => [landmark.x * video.videoWidth * scale + offsetX, landmark.y * video.videoHeight * scale + offsetY];
  ctx.lineWidth = 3;
  ctx.strokeStyle = config.lineColor;
  for (const { start, end } of connections) {
    const a = landmarks[start];
    const b = landmarks[end];
    if ((a.visibility || 0) < 0.5 || (b.visibility || 0) < 0.5) continue;
    const [ax, ay] = point(a);
    const [bx, by] = point(b);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.fillStyle = config.jointColor;
  for (let index = 11; index < landmarks.length; index++) {
    if ((landmarks[index].visibility || 0) < 0.5) continue;
    const [x, y] = point(landmarks[index]);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop(now) {
  requestAnimationFrame(loop);
  if (paused || !landmarker || video.readyState < 2) return;
  if (now - lastRun < minInterval || video.currentTime === lastVideoTime) return;
  lastRun = now;
  lastVideoTime = video.currentTime;
  const result = landmarker.detectForVideo(video, now);
  const pose = result.landmarks[0];
  draw(pose);
  const t = Math.round(now);
  post(pose
    ? { type: 'pose', t, landmarks: pose.map((p) => [round(p.x), round(p.y), round(p.z), round(p.visibility || 0)]) }
    : { type: 'no-person', t });
}

window.__coach = {
  setPaused(value) {
    paused = value;
    if (value) draw(null);
  },
  async setFacing(value) {
    if (value === facing) return;
    facing = value;
    try {
      await startCamera();
    } catch (error) {
      post({ type: 'error', code: 'camera-unavailable', detail: String(error) });
    }
  },
};

init();
</script>
</body>
</html>`;
}
