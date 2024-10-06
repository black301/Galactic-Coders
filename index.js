//#region imports
// explore
import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'jsm/postprocessing/ShaderPass.js';
//#endregion

//#region HTML staff
const startButton = document.getElementById('startButton');
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingBar = document.getElementById('loadingBar');
const solarSystemContainer = document.getElementById('solarSystem');
const planetMenu = document.getElementById('planetMenu');
const infoBox = document.getElementById('infoBox');
const spacebutton = document.getElementById('spacebutton');
const list = document.getElementById('list');
const introVideo = document.getElementById('introVideo');

document.addEventListener('DOMContentLoaded', () => {
  createStars();
  startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    introVideo.style.display = 'block';
    attemptPlay();

    introVideo.addEventListener('ended', () => {
      introVideo.style.display = 'none';
      loadingBar.style.display = 'block';
      loadingBar.style.opacity = '1';
      animateProgress();
      setTimeout(() => {
        initScene();
      }, 1500);
    });
  });
});

function attemptPlay() {
  introVideo.play().catch(error => {
    console.log("Autoplay was prevented. Please interact with the document to play the video.");
    // You might want to show a play button here if autoplay fails
  });
}

function createStars() {
  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = `${Math.random() * 3}px`;
    star.style.height = star.style.width;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    loadingScreen.appendChild(star);
  }
}

function animateProgress() {
  let progress = 0;
  const intervalId = setInterval(() => {
    if (progress < 100) {
      progress += 0.9;
      loadingProgress.style.width = `${progress}%`;
    } else {
      clearInterval(intervalId);
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        solarSystemContainer.style.opacity = '1';
        planetMenu.style.opacity = '1';
        spacebutton.style.opacity = '1';
      }, 1500);
    }
  }, 20);
}

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.font = 'Bold 64px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);

  return sprite;
}
//#endregion

//#region scene && camera && renderer && background
function initScene() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if (solarSystemContainer) {
    solarSystemContainer.appendChild(renderer.domElement);
  } else {
    console.error('Solar system container not found');
    return;
  }

  const fov = 75;
  const aspect = w / h;
  const near = 0.1;
  const far = 10000000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 5000, 15000);
  const scene = new THREE.Scene();
  const loader = new THREE.TextureLoader();

  const starTexture = loader.load('./textures/Planets/silver_and_gold_nebulae_1.png');
  const starGeo = new THREE.SphereGeometry(1000000, 100, 100);
  const starMat = new THREE.MeshBasicMaterial({
    map: starTexture,
    side: THREE.BackSide,
  });
  const starSphere = new THREE.Mesh(starGeo, starMat);
  scene.add(starSphere);

  // Layers for selective bloom
  const BLOOM_LAYER = 1;
  const ENTIRE_SCENE = 0;

  // Post-processing setup
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.3;
  bloomPass.strength = 2.5;
  bloomPass.radius = 1;

  const bloomComposer = new EffectComposer(renderer);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
        }
      `,
      defines: {}
    }), "baseTexture"
  );
  finalPass.needsSwap = true;

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  //#endregion

  //#region size and distance 
  let unitSize = 1;
  let Earth_size = 3959;
  let sun_size = unitSize * (864950 / Earth_size);
  let Mercury_size = unitSize * (1516 / Earth_size);
  let Venus_size = unitSize * (3760 / Earth_size);
  let Mars_size = unitSize * (2106 / Earth_size);
  let Jupiter_size = unitSize * (43441 / Earth_size);
  let Saturn_size = unitSize * (36184 / Earth_size);
  let Uranus_size = unitSize * (15759 / Earth_size);
  let Neptune_size = unitSize * (15299 / Earth_size);

  let Au = 100;
  let Mercury_distance = 0.38 * Au;
  let Venus_distance = 0.72 * Au;
  let Earth_distance = 1 * Au;
  let Mars_distance = 1.52 * Au;
  let Jupiter_distance = 5.20 * Au;
  let Saturn_distance = 9.58 * Au;
  let Uranus_distance = 19.14 * Au;
  let Neptune_distance = 30.20 * Au;
  //#endregion

  //#region  sun && light && planets
  const sunGeo = new THREE.SphereGeometry(sun_size, 64, 64);
  const sunMat = new THREE.MeshBasicMaterial({
    map: loader.load('./textures/Planets/8k_sun.jpg'),

  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.layers.set(ENTIRE_SCENE);
  sunMesh.layers.enable(BLOOM_LAYER);
  scene.add(sunMesh);

  const sunlight = new THREE.PointLight(0xffffff, 10, 1000);
  sunlight.position.set(0, 0, 0);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.width = 2048;
  sunlight.shadow.mapSize.height = 2048;
  scene.add(sunlight);

  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500);
  scene.add(hemiLight);

  let dis = 3000;
  const distanceScale = 10;
  const planetData = [
    { name: 'Mercury', radius: Mercury_size, distance: dis + 200 * distanceScale, orbitalPeriod: 88, rotationPeriod: 58.65, texture: './textures/Planets/8k_mercury.jpg', color: 0xaaaaaa, beat: './audio/Mercury.mp3', inclination: 7.0, initialAngle: 0, orbitColor: 0xfffffff, angle: 0 }, // Fixed angle for Mercury
    { name: 'Venus', radius: Venus_size, distance: dis + 500 * distanceScale, orbitalPeriod: 224.7, rotationPeriod: -243, texture: './textures/Planets/8k_venus_surface.jpg', color: 0xffd700, beat: './audio/Venus.mp3', inclination: 3.4, initialAngle: 0, orbitColor: 0xfffffff, angle: Math.PI / 4 }, // Fixed angle for Venus
    {
      name: 'Earth',
      radius: unitSize,
      distance: dis + 2500 * distanceScale,
      orbitalPeriod: 365.25,
      rotationPeriod: 1,
      texture: './textures/Earth/8k_earth_daymap.jpg',
      nightTexture: './textures/Earth/8k_earth_nightmap.jpg',
      cloudTexture: './textures/Earth/8k_earth_clouds.jpg',
      color: 0x00ff00, beat: './audio/Earth.mp3',
      inclination: 0.0, initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI / 2,
      moon: {
        name: 'Moon',
        radius: unitSize * 0.27, // Moon's radius is about 27% of Earth's
        distance: unitSize * 10, // Adjust this value to set the Moon's distance from Earth
        orbitalPeriod: 27.3, // Moon's orbital period in Earth days
        rotationPeriod: 27.3, // Moon's rotation period (tidally locked)
        texture: './textures/MOON/8k_moon.jpg' // Make sure you have this texture
      }
    }, // Fixed angle for Earth
    {
      name: 'Mars',
      radius: Mars_size,
      distance: dis + 3500 * distanceScale,
      orbitalPeriod: 687,
      rotationPeriod: 1.03,
      texture: './textures/Planets/8k_mars.jpg',
      color: 0xff4500,
      beat: './audio/Mars.mp3',
      inclination: 1.9,
      initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI,
      moons: [
        {
          name: 'Phobos',
          radius: Mars_size * 0.056, // Phobos is about 11.2 km in radius, Mars is 3389.5 km
          distance: Mars_size * 2.76, // Phobos orbits at about 9,377 km from Mars' center
          orbitalPeriod: 6.3, // Phobos orbits Mars in about 7.66 hours (in Earth days)
          rotationPeriod: 0.031891, // Phobos is tidally locked to Mars
          texture: './textures/MOON/mar1kuu2.jpg' // Make sure you have this texture
        },
        {
          name: 'Deimos',
          radius: Mars_size * 0.031, // Deimos is about 6.2 km in radius
          distance: Mars_size * 6.92, // Deimos orbits at about 23,460 km from Mars' center
          orbitalPeriod: 12.263, // Deimos orbits Mars in about 30.3 hours (in Earth days)
          rotationPeriod: 1.263, // Deimos is tidally locked to Mars
          texture: './textures/MOON/mar2kuu2.jpg' // Make sure you have this texture
        }
      ]
    },
    {
      name: 'Jupiter',
      radius: Jupiter_size,
      distance: dis + 5500 * distanceScale,
      orbitalPeriod: 4333,
      rotationPeriod: 0.41,
      texture: './textures/Planets/8k_jupiter.jpg',
      color: 0xffa500,
      beat: './audio/Jupiter.mp3',
      inclination: 1.3,
      initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI * 1.5,
      moons: [
        {
          name: 'Io',
          radius: Jupiter_size * 0.026, // Io is about 1,821.6 km in radius
          distance: Jupiter_size * 2.82, // Io orbits at about 421,700 km from Jupiter's center
          orbitalPeriod: 1.769, // Io's orbital period in Earth days
          rotationPeriod: 1.769, // Io is tidally locked to Jupiter
          texture: './textures/MOON/JMoon1.jpg' // Make sure you have this texture
        },
        {
          name: 'Europa',
          radius: Jupiter_size * 0.0245, // Europa is about 1,560.8 km in radius
          distance: Jupiter_size * 4.49, // Europa orbits at about 671,100 km from Jupiter's center
          orbitalPeriod: 3.551, // Europa's orbital period in Earth days
          rotationPeriod: 3.551, // Europa is tidally locked to Jupiter
          texture: './textures/MOON/JMoon2.jpg' // Make sure you have this texture
        },
        {
          name: 'Ganymede',
          radius: Jupiter_size * 0.0413, // Ganymede is about 2,634.1 km in radius
          distance: Jupiter_size * 7.16, // Ganymede orbits at about 1,070,400 km from Jupiter's center
          orbitalPeriod: 7.155, // Ganymede's orbital period in Earth days
          rotationPeriod: 7.155, // Ganymede is tidally locked to Jupiter
          texture: './textures/MOON/ganymedeJ.jpg' // Make sure you have this texture
        },
        {
          name: 'Callisto',
          radius: Jupiter_size * 0.0378, // Callisto is about 2,410.3 km in radius
          distance: Jupiter_size * 12.59, // Callisto orbits at about 1,882,700 km from Jupiter's center
          orbitalPeriod: 16.689, // Callisto's orbital period in Earth days
          rotationPeriod: 16.689, // Callisto is tidally locked to Jupiter
          texture: './textures/MOON/JMoon3.jpg' // Make sure you have this texture
        }
      ]
    },
    {
      name: 'Saturn',
      radius: Saturn_size,
      distance: dis + 6500 * distanceScale,
      orbitalPeriod: 10759,
      rotationPeriod: 0.44,
      texture: './textures/Planets/8k_saturn.jpg',
      color: 0xffd700,
      hasRing: true,
      beat: './audio/Saturn.mp3',
      inclination: 2.5,
      initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI * 2,
      moons: [
        {
          name: 'Titan',
          radius: Saturn_size * 0.06, // Titan is about 2,576 km in radius
          distance: Saturn_size * 4.95, // Titan orbits at about 1,221,870 km from Saturn's center
          orbitalPeriod: 15.945, // Titan's orbital period in Earth days
          rotationPeriod: 15.945, // Titan is tidally locked to Saturn
          texture: './textures/MOON/titan_texture_map_8k.png' // Make sure you have this texture
        },
        {
          name: 'Rhea',
          radius: Saturn_size * 0.05, // Rhea is about 763.8 km in radius
          distance: Saturn_size * 3.52, // Rhea orbits at about 527,108 km from Saturn's center
          orbitalPeriod: 4.518, // Rhea's orbital period in Eart h days
          rotationPeriod: 4.518, // Rhea is tidally locked to Saturn
          texture: './textures/MOON/Rhea_photomosaics.webp' // Make sure you have this texture
        },
        {
          name: 'Iapetus',
          radius: Saturn_size * 0.07, // Iapetus is about 735.6 km in radius
          distance: Saturn_size * 15.47, // Iapetus orbits at about 3,560,820 km from Saturn's center
          orbitalPeriod: 79.322, // Iapetus' orbital period in Earth days
          rotationPeriod: 79.322, // Iapetus is tidally locked to Saturn
          texture: './textures/MOON/LapetusNew.webp' // Make sure you have this texture
        },
        {
          name: 'Dione',
          radius: Saturn_size * 0.01, // Dione is about 561.4 km in radius
          distance: Saturn_size * 3.53, // Dione orbits at about 377,396 km from Saturn's center
          orbitalPeriod: 2.737, // Dione's orbital period in Earth days
          rotationPeriod: 2.737, // Dione is tidally locked to Saturn
          texture: './textures/MOON/RS3_Dione.webp' // Make sure you have this texture
        },
        {
          name: 'Tethys',
          radius: Saturn_size * 0.005, // Tethys is about 531.1 km in radius
          distance: Saturn_size * 6.97, // Tethys orbits at about 294,619 km from Saturn's center
          orbitalPeriod: 1.888, // Tethys' orbital period in Earth days
          rotationPeriod: 1.888, // Tethys is tidally locked to Saturn
          texture: './textures/MOON/Tethys1.webp' // Make sure you have this texture
        }
      ]
    },
    {
      name: 'Uranus',
      radius: Uranus_size,
      distance: dis + 7000 * distanceScale,
      orbitalPeriod: 30687,
      rotationPeriod: -0.72,
      texture: './textures/Planets/2k_uranus.jpg',
      color: 0x00ffff,
      beat: './audio/Uranus.mp3',
      inclination: 0.8,
      initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI * 2.5,
      moons: [
        {
          name: 'Titania',
          radius: Uranus_size * 0.031, // Titania is about 788.9 km in radius
          distance: Uranus_size * 4.36, // Titania orbits at about 436,300 km from Uranus' center
          orbitalPeriod: 8.706, // Titania's orbital period in Earth days
          rotationPeriod: 8.706, // Titania is tidally locked to Uranus
          texture: './textures/MOON/Titania.jpg'
        },
        {
          name: 'Oberon',
          radius: Uranus_size * 0.030, // Oberon is about 761.4 km in radius
          distance: Uranus_size * 5.83, // Oberon orbits at about 583,500 km from Uranus' center
          orbitalPeriod: 13.463, // Oberon's orbital period in Earth days
          rotationPeriod: 13.463, // Oberon is tidally locked to Uranus
          texture: './textures/MOON/Oberon.jpg'
        },
        {
          name: 'Umbriel',
          radius: Uranus_size * 0.023, // Umbriel is about 584.7 km in radius
          distance: Uranus_size * 2.66, // Umbriel orbits at about 266,000 km from Uranus' center
          orbitalPeriod: 4.144, // Umbriel's orbital period in Earth days
          rotationPeriod: 4.144, // Umbriel is tidally locked to Uranus
          texture: './textures/MOON/Umbriel.webp'
        },
        {
          name: 'Ariel',
          radius: Uranus_size * 0.029, // Ariel is about 578.9 km in radius
          distance: Uranus_size * 1.91, // Ariel orbits at about 191,020 km from Uranus' center
          orbitalPeriod: 2.520, // Ariel's orbital period in Earth days
          rotationPeriod: 2.520, // Ariel is tidally locked to Uranus
          texture: './textures/MOON/Ariel.jpg'
        }
      ]
    },
    {
      name: 'Neptune',
      radius: Neptune_size,
      distance: dis + 8500 * distanceScale,
      orbitalPeriod: 60190,
      rotationPeriod: 0.67,
      texture: './textures/Planets/2k_neptune.jpg',
      color: 0x0000ff,
      beat: './audio/Neptune.mp3',
      inclination: 1.8,
      initialAngle: 0,
      orbitColor: 0xfffffff,
      angle: Math.PI * 3,
      moons: [
        {
          name: 'Triton',
          radius: Neptune_size * 0.054, // Triton is about 1,353.4 km in radius
          distance: Neptune_size * 3.54, // Triton orbits at about 354,759 km from Neptune's center
          orbitalPeriod: -5.877, // Negative because Triton has a retrograde orbit
          rotationPeriod: 5.877, // Triton is tidally locked to Neptune
          texture: './textures/MOON/Triton.jpg'
        },
        {
          name: 'Nereid',
          radius: Neptune_size * 0.014, // Nereid is about 170 km in radius
          distance: Neptune_size * 10.13, // Nereid has a highly elliptical orbit
          orbitalPeriod: 360.13, // Nereid's orbital period in Earth days
          rotationPeriod: 360.13, // Assumed to be tidally locked
          texture: './textures/MOON/Nereid.webp'
        },
        {
          name: 'Naiad',
          radius: Neptune_size * 0.003, // Naiad is about 33 km in radius
          distance: Neptune_size * 0.48, // Naiad orbits very close to Neptune
          orbitalPeriod: 0.294, // Naiad's orbital period in Earth days
          rotationPeriod: 0.294, // Assumed to be tidally locked
          texture: './textures/MOON/Nereid.webp'
        },
        {
          name: 'Thalassa',
          radius: Neptune_size * 0.004, // Thalassa is about 41 km in radius
          distance: Neptune_size * 0.50, // Thalassa orbits very close to Neptune
          orbitalPeriod: 0.311, // Thalassa's orbital period in Earth days
          rotationPeriod: 0.311, // Assumed to be tidally locked
          texture: './textures/MOON/Nereid.webp'
        }
      ]
    }];
  const asteroidTexture = loader.load('./Asteroid/vesta_dawn_fc_hamo_mosaic_global_1024.jpg');

  function createAsteroid(size, distance, angle) {
    const asteroidGeo = new THREE.SphereGeometry(size, 16, 16);
    const asteroidMat = new THREE.MeshBasicMaterial({
      map: asteroidTexture,

    });
    const asteroidMesh = new THREE.Mesh(asteroidGeo, asteroidMat);

    asteroidMesh.position.x = Math.cos(angle) * distance;
    asteroidMesh.position.z = Math.sin(angle) * distance;
    asteroidMesh.position.y = (Math.random() - 0.5) * 50;

    return asteroidMesh;
  }
  const planets = [];
  const orbitMeshes = [];

  const outlineRadiusFactor = 130;

  planetData.forEach(data => {
    const planetGeo = new THREE.SphereGeometry(data.radius, 64, 64);
    const planetMat = new THREE.MeshBasicMaterial({
      map: loader.load(data.texture),

    });

    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;

    const outlineGeometry = new THREE.BufferGeometry();
    const outlinePoints = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      outlinePoints.push(new THREE.Vector3(Math.cos(theta) * (outlineRadiusFactor), 0, Math.sin(theta) * (outlineRadiusFactor)));
    }
    outlineGeometry.setFromPoints(outlinePoints);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const outlineMesh = new THREE.Line(outlineGeometry, outlineMaterial);

    outlineMesh.position.y = data.radius;
    outlineMesh.rotation.x = Math.PI / 2;

    outlineMesh.visible = true;
    planetMesh.add(outlineMesh);

    const orbitObject = new THREE.Object3D();
    scene.add(orbitObject);

    const pivotObject = new THREE.Object3D();
    orbitObject.add(pivotObject);

    pivotObject.rotation.x = data.inclination * (Math.PI / 180);

    planetMesh.userData = {
      name: data.name,
      distance: data.distance,
      orbitalPeriod: data.orbitalPeriod,
      rotationPeriod: data.rotationPeriod,
      angle: data.angle,
      viewDistance: data.radius * 5,
      inclination: data.inclination,
      beat: data.beat
    };
    planetMesh.position.x = data.distance;
    pivotObject.add(planetMesh);
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const orbitSegments = 600;

    for (let i = 0; i <= orbitSegments; i++) {
      const angle = (i / orbitSegments) * Math.PI * 2;
      const x = data.distance * Math.cos(angle);
      const z = data.distance * Math.sin(angle);
      orbitPoints.push(new THREE.Vector3(x, 0, z));
    }
    orbitGeometry.setFromPoints(orbitPoints);

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: data.orbitColor,
      transparent: true,
      opacity: 0.3
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    pivotObject.add(orbitLine);
    planetMesh.userData.orbitLine = orbitLine;
    if (data.name === 'Earth' && data.moon) {
      const moonGeo = new THREE.SphereGeometry(data.moon.radius, 32, 32);
      const moonMat = new THREE.MeshBasicMaterial({
        map: loader.load(data.moon.texture)
      });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);

      // Create a pivot for the moon's orbit
      const moonPivot = new THREE.Object3D();
      planetMesh.add(moonPivot);

      // Position the moon
      moonMesh.position.x = data.moon.distance;
      moonPivot.add(moonMesh);

      // Add moon data to userData
      moonMesh.userData = {
        name: data.moon.name,
        distance: data.moon.distance,
        orbitalPeriod: data.moon.orbitalPeriod,
        rotationPeriod: data.moon.rotationPeriod,
        angle: 0
      };

      // Add moon to planets array
      planets.push(moonMesh);
    }
    if ((data.name === 'Mars' || data.name === 'Jupiter' || data.name === 'Saturn' || data.name === 'Uranus' || data.name === 'Neptune') && data.moons) {
      data.moons.forEach(moonData => {
        const moonGeo = new THREE.SphereGeometry(moonData.radius, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({
          map: loader.load(moonData.texture)
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);

        // Create a pivot for the moon's orbit
        const moonPivot = new THREE.Object3D();
        planetMesh.add(moonPivot);

        // Add inclination to the moon's orbit
        moonPivot.rotation.x = (moonData.inclination || 0) * (Math.PI / 180);

        // Position the moon
        moonMesh.position.x = moonData.distance;
        moonPivot.add(moonMesh);

        // Add moon data to userData
        moonMesh.userData = {
          name: moonData.name,
          distance: moonData.distance,
          orbitalPeriod: moonData.orbitalPeriod,
          rotationPeriod: moonData.rotationPeriod,
          angle: Math.random() * Math.PI * 2, // Random initial angle
          inclination: moonData.inclination || 0
        };

        // Create moon orbit line
        const moonOrbitGeometry = new THREE.BufferGeometry();
        const moonOrbitPoints = [];
        const moonOrbitSegments = 64;

        for (let i = 0; i <= moonOrbitSegments; i++) {
          const angle = (i / moonOrbitSegments) * Math.PI * 2;
          const x = moonData.distance * Math.cos(angle);
          const z = moonData.distance * Math.sin(angle);
          moonOrbitPoints.push(new THREE.Vector3(x, 0, z));
        }
        moonOrbitGeometry.setFromPoints(moonOrbitPoints);

        const moonOrbitMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        });
        const moonOrbitLine = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
        moonPivot.add(moonOrbitLine);

        // Add moon to planets array
        planets.push(moonMesh);
      });
    }

    if (data.name === 'Saturn') {
      const innerRadius = data.radius * 1.5;
      const outerRadius = data.radius * 2.3;
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
      const ringTexture = loader.load('./textures/Planets/rings_baseColor.jpeg');
      const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        transparent: true,
        opacity: 0.9,

        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = Math.PI / 2;
      const ringThickness = data.radius * 0.01;
      ringMesh.scale.set(1, 1, ringThickness);
      planetMesh.add(ringMesh);
    }
    const planetName = createTextSprite(data.name);
    planetName.position.y = data.radius + data.radius * 0.5;
    planetName.scale.set(data.radius * 2, data.radius, 1);
    planetMesh.add(planetName);

    planets.push(planetMesh);
    orbitMeshes.push(orbitObject);
  });

  const asteroidBelt = new THREE.Object3D();
  const numAsteroids = 2000;
  const asteroidBeltStart = dis + 4000 * distanceScale;
  const asteroidBeltEnd = dis + 5000 * distanceScale;

  for (let i = 0; i < numAsteroids; i++) {
    const distance = asteroidBeltStart + Math.random() * (asteroidBeltEnd - asteroidBeltStart);
    const angle = Math.random() * Math.PI * 2;
    const size = Math.random() * 100 + 5;
    const asteroid = createAsteroid(size, distance, angle);
    asteroidBelt.add(asteroid);
  }
  scene.add(asteroidBelt);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = false;
  controls.minDistance = 1000;
  controls.maxDistance = 122000;
  let selectedPlanet = null;
  let isFocused = false;

  let cameraStartPos = new THREE.Vector3();
  let cameraTargetPos = new THREE.Vector3();
  let cameraLookAtPos = new THREE.Vector3();

  //#endregion

  //#region  plant info && focus on planet && resetView 
  let animationInProgress = false;

  function focusOnPlanet(planet) {
    planet.userData.isStopped = true;

    if (selectedPlanet === planet) return;

    if (selectedPlanet) {
      selectedPlanet.userData.isStopped = false;
      selectedPlanet.children[0].visible = true;
    }

    selectedPlanet = planet;
    isFocused = true;

    planet.children[0].visible = true;

    cameraStartPos.copy(camera.position);
    const distance = selectedPlanet.userData.viewDistance;
    const planetWorldPosition = new THREE.Vector3();
    selectedPlanet.getWorldPosition(planetWorldPosition);

    const sunToPlanet = new THREE.Vector3().subVectors(planetWorldPosition, sunMesh.position);
    const angle = Math.PI / 6;
    const offsetY = Math.sin(angle) * distance;
    const offsetXZ = Math.cos(angle) * distance * 2;

    cameraTargetPos.copy(planetWorldPosition).add(
      sunToPlanet.normalize().multiplyScalar(offsetXZ)
    );
    cameraTargetPos.y += offsetY;

    cameraLookAtPos.copy(planetWorldPosition);

    controls.enabled = false;
    animationInProgress = true;

    const startTime = performance.now();
    const duration = 10000; // 10 seconds for camera movement

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Hide any existing card before starting new animation
    cardContainer.style.opacity = '0';
    setTimeout(() => {
      cardContainer.style.display = 'none';
    }, 300);

    function animateCamera(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      camera.position.lerpVectors(cameraStartPos, cameraTargetPos, easedProgress);

      const currentLookAt = new THREE.Vector3();
      currentLookAt.lerpVectors(controls.target, cameraLookAtPos, easedProgress);
      camera.lookAt(currentLookAt);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        controls.enabled = true;
        controls.enableZoom = true;
        controls.minDistance = selectedPlanet.geometry.parameters.radius * 1.5;
        controls.maxDistance = selectedPlanet.userData.viewDistance * 10;
        controls.target.copy(planetWorldPosition);
        animationInProgress = false;

        // Show the planet card after camera animation is complete
        showPlanetCard(selectedPlanet.userData.name);
      }

      renderScenes();
    }

    requestAnimationFrame(animateCamera);
  }


  function updateCameraPosition(deltaTime) {
    if (isFocused && selectedPlanet && !animationInProgress) {
      const planetWorldPosition = new THREE.Vector3();
      selectedPlanet.getWorldPosition(planetWorldPosition);

      controls.target.copy(planetWorldPosition);

      controls.update();

      const distanceToPlanet = camera.position.distanceTo(planetWorldPosition);
      const outlineVisibilityThreshold = selectedPlanet.geometry.parameters.radius * 3;

      if (distanceToPlanet < outlineVisibilityThreshold) {
        selectedPlanet.children[0].visible = false;
      } else {
        selectedPlanet.children[0].visible = false;
      }
    }
  }
  function resetView() {
    if (selectedPlanet) {
      selectedPlanet.userData.isStopped = false;
      selectedPlanet.children[0].visible = true;
    }

    if (sound) {
      sound.pause();
      sound.currentTime = 0;
      sound = null;
    }

    // Hide the card container
    cardContainer.style.opacity = '0';
    setTimeout(() => {
      cardContainer.style.display = 'none';
    }, 300);

    highlightButton(null);

    selectedPlanet = null;
    isFocused = false;

    const cameraStartPos = camera.position.clone();
    const cameraEndPos = new THREE.Vector3(0, 5000, 15000);
    const cameraStartTarget = controls.target.clone();
    const cameraEndTarget = new THREE.Vector3(0, 0, 0);

    const duration = 2000;
    const startTime = performance.now();

    controls.enabled = false;
    controls.enableZoom = false;
    animationInProgress = true;

    function animateCamera(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      camera.position.lerpVectors(cameraStartPos, cameraEndPos, progress);

      const currentTarget = new THREE.Vector3();
      currentTarget.lerpVectors(cameraStartTarget, cameraEndTarget, progress);
      camera.lookAt(currentTarget);

      controls.target.copy(currentTarget);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        controls.enabled = true;
        controls.enableZoom = true;
        controls.minDistance = 400;
        controls.maxDistance = 122000;
        animationInProgress = false;

        camera.lookAt(new THREE.Vector3(0, 0, 0));
        controls.target.set(0, 0, 0);
      }
    }

    requestAnimationFrame(animateCamera);
  }
  //#endregion

  //#region  highlight orbit && planetButtons click && sound
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bloomComposer.setSize(w, h);
    finalComposer.setSize(w, h);
  });

  let sound = null;
  const planetButtons = document.querySelectorAll('.planet-button');

  function highlightButton(button) {
    planetButtons.forEach(btn => btn.classList.remove('highlighted'));

    if (button) {
      button.classList.add('highlighted');
    }
  }

  const cardContainer = document.querySelector('.card-container');
  const allCards = document.querySelectorAll('.profile-card');

  // Hide all cards initially
  allCards.forEach(card => {
    card.style.display = 'none';
  });

  function showPlanetCard(planetName) {
    // Hide all cards first
    allCards.forEach(card => {
      card.style.display = 'none';
    });

    // If planetName is 'SolarSystem', hide all cards and return
    if (planetName === 'SolarSystem') {
      cardContainer.style.opacity = '0';
      setTimeout(() => {
        cardContainer.style.display = 'none';
      }, 300);
      return;
    }

    // Find and show the corresponding card
    const card = Array.from(allCards).find(card =>
      card.querySelector('.card-title').textContent === planetName
    );

    if (card) {
      cardContainer.style.display = 'flex';
      setTimeout(() => {
        card.style.display = 'block';
        cardContainer.style.opacity = '1';
      }, 10);
    }
  }

  // Update the existing planetButtons click handlers
  planetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const planetName = button.getAttribute('data-planet');

      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }

      if (planetName === 'SolarSystem') {
        resetView();
        highlightButton(null);
      } else {
        const planet = planets.find(p => p.userData.name === planetName);
        if (planet) {
          sound = new Audio(planet.userData.beat);
          sound.play().catch((error) => {
            console.error('Error playing sound:', error);
          });
          focusOnPlanet(planet);
          highlightButton(button);
          // Card will be shown after camera animation completes
        }
      }
    });
  });

  const clock = new THREE.Clock();
  //#endregion

  //#region animate
  function animate() {
    const deltaTime = clock.getDelta();

    planets.forEach(planet => {
      if (!planet.userData.isStopped) {
        if (['Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Titan', 'Rhea', 'Iapetus', 'Dione', 'Tethys', 'Ariel', 'Umbriel', 'Oberon'
          , 'Titania', 'Thalassa', 'Naiad', 'Nereid', 'Triton', 'Nereid'].includes(planet.userData.name)) {
          // Rotate the moons around their parent planet
          const parentPlanet = planets.find(p => {
            if (planet.userData.name === 'Phobos' || planet.userData.name === 'Deimos') return p.userData.name === 'Mars';
            if (['Io', 'Europa', 'Ganymede', 'Callisto'].includes(planet.userData.name)) return p.userData.name === 'Jupiter';
            if (['Titan', 'Rhea', 'Iapetus', 'Dione', 'Tethys'].includes(planet.userData.name)) return p.userData.name === 'Saturn';
            if (['Titania', 'Oberon', 'Ariel', 'Umbriel'].includes(planet.userData.name)) return p.userData.name === 'Uranus';
            if (['Thalassa', 'Naiad', 'Nereid', 'Triton'].includes(planet.userData.name)) return p.userData.name === 'Neptune';

          });
          if (parentPlanet) {
            const moonPivot = parentPlanet.children.find(child => child instanceof THREE.Object3D && child.children.includes(planet));
            if (moonPivot) {
              moonPivot.rotation.y += (deltaTime / planet.userData.orbitalPeriod) * Math.PI * 2;
            }
          }
        } else {
          // Regular planet rotation
          planet.userData.angle += (deltaTime / planet.userData.orbitalPeriod) * Math.PI * 2;
          planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
          planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
        }
      }
      planet.rotation.y += (deltaTime / planet.userData.rotationPeriod) * Math.PI * 2 * 0.01;
    });


    asteroidBelt.rotation.y += deltaTime * 0.05;

    if (isFocused && selectedPlanet && !animationInProgress) {
      updateCameraPosition(deltaTime);
    } else if (!animationInProgress) {
      controls.update();
    }

    renderScenes();
    requestAnimationFrame(animate);
  }

  function renderScenes() {
    camera.layers.set(BLOOM_LAYER);
    bloomComposer.render();

    camera.layers.set(ENTIRE_SCENE);
    finalComposer.render();
  }

  animate();
}
//#endregion