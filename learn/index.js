import * as THREE from "three";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { getFresnelMat } from "./src/getFresnelMat.js";
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, controls, character;
const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);
const loader = new FBXLoader(manager);
const gltfLoader = new GLTFLoader(manager);
let timeElapsed = 0;
const mercuryGroup = new THREE.Group();
const earthGroup = new THREE.Group();
const neptongroup = new THREE.Group();
const venusGroup = new THREE.Group();
const moonGroup = new THREE.Group();
const marsgroup = new THREE.Group();
const jupitergroup = new THREE.Group();
const saturngroup = new THREE.Group();
const uranusgroup = new THREE.Group();
let currentPlanetIndex = 0;
let isAnimating = false;
const animationDuration = 2; // Duration in seconds
let animationStartTime = 0;
var cloudMesh;
var earthMesh;
var glowMesh;
var lightsMesh;
var model;
var saturnmesh;
function showCongratulationsCard() {
  const card = document.createElement('div');
  card.className = 'congrats-card';
  card.innerHTML = `
    <h2>Congratulations!</h2>
    <p>Blast off! You've conquered the cosmos and become a solar system superstar! Ready to prove your cosmic knowledge? The universe is waiting.</p>
    <div class="button-container">
      <button id="exploreButton">← Learn more in the explorer</button>
      <button id="quizButton">Quiz to get your certificate →</button>
    </div>
  `;
  document.body.appendChild(card);

  // Add updated styles to match the uiOverlay style and center it
  const style = document.createElement('style');
  style.textContent = `
    .congrats-card {
      position: fixed;
      top: 50%;
      left: 55%;
      transform: translate(-50%, -50%);
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 20px;
      width: 90%;
      max-width: 800px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      z-index: 1000;
      animation: fadeIn 0.5s ease-out;
      font-family: 'Arial, sans-serif';
      color: white;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .congrats-card h2 {
      color: #035397;
      margin-bottom: 10px;
      font-size: 24px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }
    .congrats-card p {
      font-size: 18px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
    .button-container {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .button-container button {
      background-color: transparent;
      border: 2px solid white;
      border-radius: 5px;
      color: white;
      font-size: 16px;
      padding: 10px 20px;
      cursor: pointer;
      font-family: 'Arial, sans-serif';
      transition: all 0.3s ease;
      opacity: 0;
      animation: bounceIn 0.5s ease-out forwards;
    }
    #exploreButton {
      animation-delay: 0.5s;
    }
    #quizButton {
      animation-delay: 1s;
    }
    .button-container button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    @keyframes bounceIn {
      0% { transform: scale(0.1); opacity: 0; }
      60% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Attach event handlers for the buttons
  document.getElementById('exploreButton').onclick = () => window.location.href = '../index.html';
  document.getElementById('quizButton').onclick = () => window.location.href = '../quiz/test.html';
}



const planets = [
  { name: 'Mercury', position: new THREE.Vector3(50, 1, 0), size: 3, group: mercuryGroup },
  { name: 'Venus', position: new THREE.Vector3(70, 1, 0), size: 6, group: venusGroup },
  { name: 'Earth', position: new THREE.Vector3(90, 1, 0), size: 6, group: earthGroup },
  { name: 'Mars', position: new THREE.Vector3(110, 1, 0), size: 6, group: marsgroup },
  { name: 'Jupiter', position: new THREE.Vector3(130, 0, 0), size: 6, group: jupitergroup },
  { name: 'Saturn', position: new THREE.Vector3(130, 0, 0), size: 6, group: saturngroup },
  { name: 'Uranus', position: new THREE.Vector3(150, 1, 0), size: 6, group: uranusgroup },
  { name: 'Neptune', position: new THREE.Vector3(150, 1, 0), size: 6, group: neptongroup }
];

manager.onLoad = function () {
  hideLoadingScreen();
  // Any other initialization that should happen after all assets are loaded
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
};

manager.onError = function (url) {
  console.log('There was an error loading ' + url);
};

function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(-9, -1, 20);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 1;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  
  setupBackground();
  loadCharacter();
  loadAnimations();
  createCelestialBodies();
  setupLighting();
  
  createEarth();
  createVenus();
  createMoon();
  createSatellite();
  CreateMercury();
  creatUranus();
  createJupiter();
  createsaturn();
  createMars();
  createNeptune();
    
  window.addEventListener('resize', handleWindowResize, false);

  const startButton = document.getElementById('arrow');
  startButton.addEventListener('click', handleStartAnimation);

  animate();
}

function createCelestialBodies() {
  planets.forEach(planet => {
    scene.add(planet.group);
  });
}

function setupBackground() {
  scene.background = textureLoader.load('./assets/textures/silver_and_gold_nebulae_1.png');
}

function loadCharacter() {
  loader.load('./assets/SK_Sandy.fbx', (fbx) => {
    character = initCharacter(fbx);
    scene.add(character);
  });
}

function initCharacter(fbx) {
  const char = fbx;
  char.scale.setScalar(0.1);
  char.position.set(-12.3, -7, 0);
  char.traverse((c) => {
    if (c.isMesh) {
      if (c.material.name === 'Alpha_Body_MAT') {
        c.material = new THREE.MeshMatcapMaterial({
         // matcap: textureLoader.load('./assets/fire-edge-blue.jpg'),
        });
      }
      c.castShadow = true;
    }
  });
  const mixer = new THREE.AnimationMixer(char);
  char.userData = { mixer, update: (t) => mixer.update(0.01) };
  return char;
}

function loadAnimations() {
  const animations = ['Talking (4)'];
  const apath = './assets/animations/';
  animations.forEach((name) => {
    loader.load(`${apath}${name}.fbx`, (fbx) => {
      let anim = fbx.animations[0];
      anim.name = name;
      if (character) {
        const action = character.userData.mixer.clipAction(anim);
        action.play();
      }
    });
  });
}

function CreateMercury() {
  const mercuryGeo = new THREE.SphereGeometry(3, 32, 32);
  const mercuryMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/mercury.jpg'),
    bumpMap: textureLoader.load('./assets/textures/mercury.jpg'),
    bumpScale: .5,
  });
  const mercuryMesh = new THREE.Mesh(mercuryGeo, mercuryMat);
  mercuryGroup.add(mercuryMesh);
  mercuryGroup.position.set(50, 1, 0);
}

function createVenus() {
  const venusGeo = new THREE.SphereGeometry(6, 32, 32);
  const venusMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/venus.jpg'),
    bumpMap: textureLoader.load('./assets/textures/venus_atmosphere (1).jpg'),
    bumpScale: 0.5,
  });
  const venusMesh = new THREE.Mesh(venusGeo, venusMat);
  venusGroup.position.set(70, 1, 0);
  venusGroup.add(venusMesh);
}

function createEarth() {
  const earthGeometry = new THREE.IcosahedronGeometry(6, 12);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_daymap.jpg'),
  });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earthMesh);
  earthGroup.position.set(90, 1, 0);

  const lightsMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_nightmap.jpg'),
    blending: THREE.AdditiveBlending,
  });
  lightsMesh = new THREE.Mesh(earthGeometry, lightsMat);
   earthGroup.add(lightsMesh);

  const cloudMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_clouds.jpg'),
    transparent: true,
    opacity: 0.5,
    alphaMap: textureLoader.load('./assets/textures/05_earthcloudmaptrans.jpg'),
    blending: THREE.AdditiveBlending
  });
  cloudMesh = new THREE.Mesh(earthGeometry, cloudMat);
  cloudMesh.scale.setScalar(1.003);
  earthGroup.add(cloudMesh);

  const fresnelMat = getFresnelMat();
  glowMesh = new THREE.Mesh(earthGeometry, fresnelMat);
  glowMesh.scale.setScalar(1.01);
  earthGroup.add(glowMesh);
}

function createMars() {
  const marsgeo = new THREE.SphereGeometry(6, 32, 32);
  const marsmat = new THREE.MeshStandardMaterial({
    bumpScale: .5,
    map: textureLoader.load("./assets/textures/mars.jpg"),
  });
  const marsMesh = new THREE.Mesh(marsgeo, marsmat);
  marsgroup.add(marsMesh);
  marsgroup.position.set(110, 1, 0);
}

function createJupiter() {
  const jupitergeo = new THREE.SphereGeometry(8, 32, 32);
  const jupitermat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/jupiter.jpg'),
    bumpScale: 0.3,
    opacity: 0.9,
  });
  const jupitermesh = new THREE.Mesh(jupitergeo, jupitermat);
  jupitergroup.add(jupitermesh);
  jupitergroup.position.set(130, -25, 0);
}
function createsaturn() {
  // Saturn
  saturngroup.position.set(150, 0, 0);
 const saturngeo = new THREE.SphereGeometry(4, 32, 32);
 const saturnMat = new THREE.MeshStandardMaterial({
   map: textureLoader.load('./assets/textures/saturn.jpg')
 });
 saturnmesh = new THREE.Mesh(saturngeo, saturnMat);
 saturngroup.add(saturnmesh);

 // First ring with texture1
 const ringGeo1 = new THREE.RingGeometry(4, 10, 64); // Inner and outer radius
 const ringMat1 = new THREE.MeshBasicMaterial({
   map: textureLoader.load('./assets/textures/rings_baseColor.jpeg'),
   side: THREE.DoubleSide,
   transparent: true
 });
 const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
 ringMesh1.rotation.x = Math.PI / -2.7; // Rotate to align with Saturn
 saturngroup.add(ringMesh1);


}

function creatUranus() {
  const uranusgeo = new THREE.SphereGeometry(6, 32, 32);
  const uranusmat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/uranus.jpg'),
    opacity: 0.5,
    bumpScale: .5,
  });
  const uranusmesh = new THREE.Mesh(uranusgeo, uranusmat);
  uranusgroup.add(uranusmesh);
  uranusgroup.position.set(170, 1, 0);
}

function createNeptune() {
  const neptongeo = new THREE.SphereGeometry(6, 32, 32);
  const neptonmat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/neptune.jpg'),
    opacity: 0.5,
    bumpScale: .5,
  });
  const neptonmesh = new THREE.Mesh(neptongeo, neptonmat);
  neptongroup.add(neptonmesh);
  neptongroup.position.set(190, 1, 0);
}

function createMoon() {
  earthGroup.add(moonGroup);

  const moonGeo = new THREE.SphereGeometry(1, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/06_moonmap4k.jpg'),
    bumpMap: textureLoader.load('./assets/textures/07_moonbump4k.jpg'),
    bumpScale: 2,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(10, 0, 0);
  moonGroup.add(moonMesh);
}

function createSatellite() {
  const modelPath = './assets/Active Cavity Irradiance Monitor Satellite.glb';
  gltfLoader.load(modelPath, (gltf) => {
    model = gltf.scene;
    model.scale.set(0.00019, 0.00019, 0.00019);
    model.position.set(-10, 2, 0);
    model.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    earthGroup.add(model);
  });
}

function setupLighting() {
  const sunLight = new THREE.DirectionalLight(0xffffff, 3);
  sunLight.position.set(0, 2, 5);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 20;
  sunLight.shadow.camera.left = -5;
  sunLight.shadow.camera.right = 5;
  sunLight.shadow.camera.top = 5;
  sunLight.shadow.camera.bottom = -5;
  scene.add(sunLight);
}

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleStartAnimation() {
  if (!isAnimating) {
    isAnimating = true;
    animationStartTime = Date.now();
  }
}

function hidePlanets() {
    const neptune = planets.find(planet => planet.name === 'Neptune');
    neptune.group.visible = false;
    const startButton = document.getElementById('uiOverlay');
    if (startButton) {
      startButton.style.display = 'none';
    }
    setTimeout(() => {
      showCongratulationsCard();
    }, 500);
}
var currentPlanet;
function animate() {
  requestAnimationFrame(animate);

  if (isAnimating) {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - animationStartTime) / 1000; // Convert to seconds
    if (elapsedTime < animationDuration) {
      const progress = elapsedTime / animationDuration;
      currentPlanet = planets[currentPlanetIndex];
      const nextPlanet = planets[(currentPlanetIndex + 1)];
      currentPlanet.group.position.lerp(new THREE.Vector3(0, 0, 0), progress);
      if (nextPlanet) {
        nextPlanet.group.position.lerp(new THREE.Vector3(30, 0, 0), progress);
      }
      planets.forEach((planet, index) => {
        if (index !== currentPlanetIndex && index !== currentPlanetIndex + 1) {
          planet.group.position.lerp(planet.position, progress);
        }
      });
    } else {
      currentPlanetIndex++;
      isAnimating = false;
      // Check if all planets have been visited
      if (currentPlanetIndex === 9) {
        // currentPlanet.group.position.lerp(new THREE.Vector3(50, 0, 0), progress);  
        hidePlanets();
      }
    }
  }
  if (character) {
    character.userData.update(timeElapsed);
  }
  mercuryGroup.rotation.y += 0.01;
  earthGroup.rotation.y += 0.003;
  jupitergroup.rotation.y += 0.0006;
  moonGroup.rotation.y += 0.005;
  saturnmesh.rotation.y += 0.005;
  neptongroup.rotation.y += 0.005;
  uranusgroup.rotation.y += 0.0009;
  marsgroup.rotation.y += 0.0008;
  venusGroup.rotation.y += 0.005;
  controls.update();
  renderer.render(scene, camera);
}

init();