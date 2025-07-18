// Orientation check
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

// Scene setup
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
scene.add(light);

// Fake sun mesh
const sunMat = new THREE.MeshBasicMaterial({
  color: 0xffcc66,
  emissive: 0xffcc66,
  emissiveIntensity: 1,
});
const sunGeo = new THREE.SphereGeometry(10, 16, 16);
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);
sun.position.set(30, 50, 30); // Example position in the sky

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Skybox
const skyGeo = new THREE.SphereGeometry(550, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load('/mobile/skybox.jpg'),
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Player
const playerMat = new THREE.MeshStandardMaterial({
  color: 0x33ccff,
  emissive: 0x00ccff,
  emissiveIntensity: 1.5
});
const player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), playerMat);
player.position.y = 1;
player.castShadow = true;
scene.add(player);

// Blob Shadow
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.3
});
const shadowGeo = new THREE.CircleGeometry(0.8, 32);
const blobShadow = new THREE.Mesh(shadowGeo, shadowMat);
blobShadow.rotation.x = -Math.PI / 2;
scene.add(blobShadow);

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

// Camera orbit
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

// Pause system
let isPaused = false;
document.getElementById('pause-btn').onclick = () => {
  isPaused = true;
  document.getElementById('pause-menu').style.display = 'block';
};
document.getElementById('resume-btn').onclick = () => {
  isPaused = false;
  document.getElementById('pause-menu').style.display = 'none';
};
document.getElementById('settings-btn').onclick = () => {
  document.getElementById('pause-menu').style.display = 'none';
  document.getElementById('settings-menu').style.display = 'block';
};

// Visual toggles
const glowToggle = document.getElementById('glow-toggle');
const skyboxToggle = document.getElementById('skybox-toggle');
const shadowToggle = document.getElementById('shadow-toggle');
const sunToggle = document.getElementById('sun-toggle');
sunToggle.addEventListener('change', () => {
  sun.visible = sunToggle.checked;
});
sun.visible = sunToggle.checked;


function updateShadowState() {
  const useRealShadow = shadowToggle.checked;
  light.castShadow = useRealShadow;
  player.castShadow = useRealShadow;
  floor.receiveShadow = useRealShadow;
  blobShadow.visible = !useRealShadow;
}
shadowToggle.addEventListener('change', updateShadowState);
updateShadowState();

// Animate loop
function animate() {
  requestAnimationFrame(animate);
  if (isPaused) return;

  if (joystick.active) {
    const speed = 0.1;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -joystick.y);
    move.addScaledVector(right, joystick.x);
    move.normalize().multiplyScalar(speed);

    player.position.add(move);
  }

  velocityY -= 0.01;
  player.position.y += velocityY;

  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    grounded = true;
  }

  blobShadow.position.set(player.position.x, 0.01, player.position.z);
  updateCameraOrbit();

  sky.visible = skyboxToggle.checked;
  sky.rotation.y += 0.0005;
  playerMat.emissiveIntensity = glowToggle.checked ? 1.5 : 0;
  renderer.render(scene, camera);
}
animate();
