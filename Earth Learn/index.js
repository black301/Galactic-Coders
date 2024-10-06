export { init };
import * as THREE from "three";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getLayer from "./libs/getLayer.js";
import { getFresnelMat } from "./src/getFresnelMat.js";
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';


import { OBJLoader } from 'jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'jsm/loaders/MTLLoader.js';
let scene, camera, renderer, controls, character, earthGroup;
let isAnimating = false;
const textureLoader = new THREE.TextureLoader();
const manager = new THREE.LoadingManager();
const loader = new FBXLoader(manager);
const gltfLoader = new GLTFLoader();
var ringMesh;
var model;
var saturngroup;
var lightsMesh;
var earthMesh;
var cloudMesh;
var glowMesh;
var mtlLoader;
let timeElapsed = 0;

function init() {
  manager.onLoad = function () {
  hideLoadingScreen();
  // Any other initialization that should happen after all assets are loaded
};
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(-3, 3, 25);
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
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 10; 
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI / 2; // Prevent rotating below the horizon
  controls.minPolarAngle = 0;     

  setupAudio();
  setupBackground();
  loadCharacter();
  loadAnimations();
  createCelestialBodies();
  setupLighting();
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 1;
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 10; 
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI / 2; // Prevent rotating below the horizon
  controls.minPolarAngle = 0;     


  window.addEventListener('resize', handleWindowResize, false);



  animate();
}

function setupAudio() {
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const audioLoader = new THREE.AudioLoader();
  const backgroundMusic = new THREE.Audio(listener);

  audioLoader.load('./assets/audio/Earth.mp3', (buffer) => {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setVolume(1);
    backgroundMusic.play();
    backgroundMusic.setPlaybackRate(.9);
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
  char.scale.setScalar(.124);
  char.position.set(-13, -9,-2);
  char.traverse((c) => {
    if (c.isMesh) {
      if (c.material.name === 'Alpha_Body_MAT') {
        c.material = new THREE.MeshMatcapMaterial({
          matcap: textureLoader.load('./assets/fire-edge-blue.jpg'),
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
  const animations = ['Talking (4)', 'Sitting Drinking (1)'];
  const apath = './assets/animations/';
  let actions = []; // Store actions here
  let activeAction, previousAction;
  let switched = false; // Flag to track if the switch has occurred

  // Load each animation and create an action for it
  animations.forEach((name, index) => {
    loader.load(`${apath}${name}.fbx`, (fbx) => {
      let anim = fbx.animations[0];
      anim.name = name;
      if (character) {
        const action = character.userData.mixer.clipAction(anim);
        actions[index] = action;

        // Start the first animation automatically
        if (index === 0) {
          activeAction = actions[index];
          activeAction.play();
        }
      }
    });
  });

  // Function to switch to the second animation and stop at its last frame
  function switchAndStop() {
    if (!switched) {
      previousAction = activeAction;
      activeAction = actions[1]; // Switch to the second animation

      // Fade out the previous action and play the new one
      previousAction.fadeOut(0.5);
      activeAction.reset().fadeIn(0.5).play();

      switched = true; // Set flag to true to prevent further switches

      // Set an event listener to stop at the last frame
      activeAction.clampWhenFinished = true; // Stop at the end
      activeAction.loop = THREE.LoopOnce;    // Play once and stop
    }
  }

  // Set the timeout to switch after 5 seconds (5000 ms)
  setTimeout(switchAndStop, 30000);
}


function createCelestialBodies() {
  createEarth();
 
  createSatellite();
  createMoon();
  createSatellite2();
  createAsteroid(new THREE.Vector3(-7, -10, 2), new THREE.Vector3(0.0019, 0.0019, 0.0019));
  createAsteroid(new THREE.Vector3(3, 10, 2), new THREE.Vector3(0.001, 0.001, 0.001));
  for (let i = 0; i < 5; i++) {
    const { position, scale } = getRandomAsteroidAttributes();
    createAsteroid(position, scale);
  }

}
function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to generate random position and scale for the asteroid
function getRandomAsteroidAttributes() {
  const minDistanceFromEarth = 10;  // Minimum distance from Earth (at 0, 0, 0)

  let position;
  do {
    position = new THREE.Vector3(
      getRandomInRange(-15, 15),  // Random x between -15 and 15
      getRandomInRange(-15, 15),  // Random y between -15 and 15
      getRandomInRange(-5, 5)     // Random z between -5 and 5
    );
  } while (position.length() < minDistanceFromEarth);  // Ensure the distance is greater than the threshold

  const scale = new THREE.Vector3(
    getRandomInRange(0.0005, 0.0007),  // Random scale between 0.001 and 0.005
    getRandomInRange(0.0005, 0.0007),  // Random scale between 0.001 and 0.005
    getRandomInRange(0.0005, 0.0007)   // Random scale between 0.001 and 0.005
  );

  return { position, scale };
}

function createAsteroid(position, scale) {
  mtlLoader = new MTLLoader();
  const asteroidTexture = textureLoader.load('./assets/textures/10464_Asteroid_v1_diffuse.jpg');

  mtlLoader.load('./assets/animations/10464_Asteroid_v1_Iterations-2.mtl', (materials) => {
    materials.preload();

    // Load the object using OBJLoader and apply the materials
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);

    objLoader.load('./assets/animations/10464_Asteroid_v1_Iterations-2.obj', (object) => {
      object.scale.set(scale.x, scale.y, scale.z);  // Use the passed scale values
      object.position.set(position.x, position.y, position.z);

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.map = asteroidTexture;
          child.material = new THREE.MeshBasicMaterial({ map: textureLoader.load('./assets/textures/10464_Asteroid_v1_diffuse.jpg') }); // Red color

          // Or if the texture is working

          child.material.needsUpdate = true;
        }
      });

      // Add the loaded object to the earthGroup
      earthGroup.add(object);
    });
  });
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
var model2;
function createSatellite2() {
  const modelPath = './assets/Aura.glb';
  gltfLoader.load(modelPath, (gltf) => {
    model2 = gltf.scene;
    model2.scale.set(0.0019, 0.0019, 0.0019);
    model2.position.set(15, 5, 0);
    model2.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
    model2.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    earthGroup.add(model2);
  });
}

var moonGroup = new THREE.Group();
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

function createEarth() {
  earthGroup = new THREE.Group();
  earthGroup.rotation.z = -23.4 * Math.PI / 180;
  const earthGeometry = new THREE.IcosahedronGeometry(6, 12);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_daymap.jpg'),
  });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earthMesh);
  scene.add(earthGroup);
  earthGroup.position.set(0,2, 0);

  const lightsMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_nightmap.jpg'),
    blending: THREE.AdditiveBlending,
  });
  lightsMesh = new THREE.Mesh(earthGeometry, lightsMat);
  earthGroup.add(lightsMesh);

  const cloudMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('./assets/textures/8k_earth_clouds.jpg'),
    transparent: true,
    opacity: 0.7,
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



function setupLighting() {
  const sunLight = new THREE.DirectionalLight(0xffffff, 2);
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
let satelliteOrbitAngle = 0; // Starting angle for the satellite orbit
const satelliteOrbitRadius = 12; // Orbit radius from the Earth

function animate() {
  requestAnimationFrame(animate);

  // Earth rotation
  earthMesh.rotation.y += 0.002;
  moonGroup.rotation.y += 0.008;
  lightsMesh.rotation.y += 0.002;
  cloudMesh.rotation.y += 0.0023;
  glowMesh.rotation.y += 0.002;
  earthGroup.rotation.y += 0.002;

  // earthGroup.earthMesh.rotation.y +=.002;
  // earthGroup.lightsMesh.rotation.y +=.002;
  // earthGroup.glowMesh.rotation.y +=.002;
  // earthGroup.cloudMesh.rotation.y += .0023;
  // earthGroup.model.rotation.y +=.002;

  // Update satellite's orbit around the Earth
  // satelliteOrbitAngle += 0.01; // Control the speed of the orbit (increase or decrease)
  // const x = satelliteOrbitRadius * Math.cos(satelliteOrbitAngle);
  // const z = satelliteOrbitRadius * Math.sin(satelliteOrbitAngle);

  // // Set the satellite position in a circular orbit
  // if (model) {
  //   model.position.set(x, 2, z); // Keep Y constant for level orbit
  //  // model.rotation.y += 0.01;    // Optional: Rotate the satellite around its own axis
  // }

  if (character) {
    character.userData.update(timeElapsed);
  }

  controls.update();
  renderer.render(scene, camera);
}


init();


/* // Second ring with texture2
// const ringGeo2 = new THREE.RingGeometry(10, 12, 64); // Slightly larger outer radius
// const ringMat2 = new THREE.MeshBasicMaterial({
//   map: textureLoader.load('./assets/textures/ring2.jpeg'),
//   side: THREE.DoubleSide,
//   transparent: true
// });
// const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
// ringMesh2.rotation.x = Math.PI / 2; // Align same as the first ring
// saturngroup.add(ringMesh2);

// Add group to the scene*/