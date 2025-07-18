import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// Orientation Check
function checkOrientation() {
  const alert = document.getElementById('rotate-alert');
  if (window.innerHeight > window.innerWidth) {
    alert.style.display = 'flex';
    alert.onclick = () => location.reload();
  } else {
    alert.style.display = 'none';
  }
}
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);

// THREE Setup
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg'),
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x33ccff, emissive: 0x2222ff })
);
player.position.y = 1;
scene.add(player);

// Joystick
const joystick = { x: 0, y: 0, active: false };
const thumb = document.getElementById('joystick-thumb');
const base = document.getElementById('joystick-base');
let centerX, centerY;

function updateCenter() {
  const rect = base.getBoundingClientRect();
  centerX = rect.left + rect.width / 2;
  centerY = rect.top + rect.height / 2;
}

function moveThumb(touch) {
  const dx = touch.clientX - centerX;
  const dy = touch.clientY - centerY;
  const radius = base.offsetWidth / 2;
  const dist = Math.min(Math.hypot(dx, dy), radius);
  const angle = Math.atan2(dy, dx);
  const x = dist * Math.cos(angle);
  const y = dist * Math.sin(angle);
  thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  joystick.x = x / radius;
  joystick.y = y / radius;
  joystick.active = true;
}

base.addEventListener('touchstart', e => { updateCenter(); moveThumb(e.touches[0]); });
base.addEventListener('touchmove', e => moveThumb(e.touches[0]));
base.addEventListener('touchend', () => {
  joystick.x = 0; joystick.y = 0; joystick.active = false;
  thumb.style.transform = 'translate(-50%, -50%)';
});

// Camera Orbit
let camYaw = 0, camPitch = 0;
let swipeX = 0, swipeY = 0;

canvas.addEventListener('touchstart', e => {
  swipeX = e.touches[0].clientX;
  swipeY = e.touches[0].clientY;
});
canvas.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - swipeX;
  const dy = e.touches[0].clientY - swipeY;
  camYaw -= dx * 0.003;
  camPitch -= dy * 0.003;
  camPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camPitch));
  swipeX = e.touches[0].clientX;
  swipeY = e.touches[0].clientY;
});

function updateCameraOrbit() {
  const r = 10, h = 5;
  const cosP = Math.cos(camPitch);
  const sinP = Math.sin(camPitch);
  const cosY = Math.cos(camYaw);
  const sinY = Math.sin(camYaw);
  camera.position.x = player.position.x + r * cosP * sinY;
  camera.position.y = player.position.y + r * sinP + h;
  camera.position.z = player.position.z + r * cosP * cosY;
  camera.lookAt(player.position);
}

// Jump
let velocityY = 0;
let grounded = true;
document.getElementById('jump-btn').addEventListener('click', () => {
  if (grounded) {
    velocityY = 0.25;
    grounded = false;
  }
});

// Postprocessing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8, 0.4, 0.85
);
composer.addPass(renderPass);
composer.addPass(bloomPass);

// Pause & Settings
let isPaused = false;
document.getElementById('pause-btn').onclick = () => {
  isPaused = !isPaused;
  document.getElementById('pause-menu').style.display = isPaused ? 'block' : 'none';
};

document.getElementById('resume-btn').onclick = () => {
  isPaused = false;
  document.getElementById('pause-menu').style.display = 'none';
};

document.getElementById('settings-btn').onclick = () => {
  document.getElementById('pause-menu').style.display = 'none';
  document.getElementById('settings-menu').style.display = 'block';
};

const bloomToggle = document.getElementById('bloom-toggle');
const skyboxToggle = document.getElementById('skybox-toggle');
const godrayToggle = document.getElementById('godray-toggle');

// Animate
function animate() {
  requestAnimationFrame(animate);
  if (isPaused) return;

  if (joystick.active) {
    const speed = 0.1;
    const a = camYaw;
    const moveX = Math.cos(a) * joystick.x - Math.sin(a) * joystick.y;
    const moveZ = Math.sin(a) * joystick.x + Math.cos(a) * joystick.y;
    player.position.x += moveX * speed;
    player.position.z += moveZ * speed;
  }

  velocityY -= 0.01;
  player.position.y += velocityY;
  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    grounded = true;
  }

  updateCameraOrbit();
  sky.visible = skyboxToggle.checked;
  bloomPass.enabled = bloomToggle.checked;
  composer.render();
}

animate();
