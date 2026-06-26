import * as THREE from "/vendor/three/three.module.js";

const ambientCanvas = document.querySelector("#ambient-canvas");
const ambientRenderer = new THREE.WebGLRenderer({ canvas: ambientCanvas, antialias: true, alpha: true });
const ambientScene = new THREE.Scene();
const ambientCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
ambientCamera.position.z = 28;

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 520;
const positions = new Float32Array(particleCount * 3);

for (let index = 0; index < particleCount; index += 1) {
  positions[index * 3] = (Math.random() - 0.5) * 70;
  positions[index * 3 + 1] = (Math.random() - 0.5) * 44;
  positions[index * 3 + 2] = (Math.random() - 0.5) * 34;
}

particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.08, transparent: true, opacity: 0.7 })
);
ambientScene.add(particles);

const cardScenes = [...document.querySelectorAll("[data-three-card]")].map((canvas, index) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const colors = [0x38bdf8, 0xfacc15, 0xd8b4fe];
  const material = new THREE.MeshStandardMaterial({
    color: colors[index],
    roughness: 0.24,
    metalness: 0.62,
    emissive: colors[index],
    emissiveIntensity: 0.18,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.16,
  });
  const geometry =
    index === 0
      ? new THREE.IcosahedronGeometry(1.55, 1)
      : index === 1
        ? new THREE.TorusKnotGeometry(1.05, 0.28, 128, 16)
        : new THREE.OctahedronGeometry(1.65, 2);
  const mesh = new THREE.Mesh(geometry, material);
  const wire = new THREE.Mesh(geometry, wireMaterial);
  const group = new THREE.Group();
  group.add(mesh, wire);
  scene.add(group);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.015, 12, 96),
    new THREE.MeshBasicMaterial({ color: colors[index], transparent: true, opacity: 0.45 })
  );
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.PointLight(colors[index], 18, 18);
  light.position.set(2.6, 2.2, 4);
  scene.add(light);

  return { renderer, scene, camera, group, ring, canvas };
});

function resizeRenderer(renderer, camera, canvas) {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function animate(time) {
  const seconds = time * 0.001;
  resizeRenderer(ambientRenderer, ambientCamera, ambientCanvas);
  particles.rotation.y = seconds * 0.035;
  particles.rotation.x = Math.sin(seconds * 0.2) * 0.06;
  ambientRenderer.render(ambientScene, ambientCamera);

  cardScenes.forEach((item, index) => {
    resizeRenderer(item.renderer, item.camera, item.canvas);
    item.group.rotation.x = seconds * (0.28 + index * 0.04);
    item.group.rotation.y = seconds * (0.44 + index * 0.03);
    item.group.position.y = Math.sin(seconds + index) * 0.16;
    item.ring.rotation.z = seconds * (0.5 + index * 0.12);
    item.renderer.render(item.scene, item.camera);
  });

  requestAnimationFrame(animate);
}

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

requestAnimationFrame(animate);
