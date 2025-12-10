import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { initAR, stopAR } from './ar-module.js';

// Configuration
const CONFIG = {
  modelPath: 'https://ipfs.io/ipfs/bafkreih3hfgumvgwoxvbu2gdvw65xoo5yny4uktmcub76dtue2h7bkzj3q'
};

let scene, camera, renderer, loadedModel, composer;

// Performance detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowEndDevice = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4);

// DOM Elements
const mainCanvas = document.getElementById('main-canvas');
const loadingDiv = document.getElementById('loading');

// ==================== SCROLL ANIMATIONS ====================
const observerOptions = {
  threshold: isMobile ? 0.1 : 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      // Unobserve after reveal for performance
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => observer.observe(el));
}

// ==================== STUDIO LIGHTING SETUP ====================
function createStudioLighting(scene) {
  // Reduced ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  // Hemisphere light for natural ambient
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, isMobile ? 15 : 20);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // KEY LIGHT - Reduced intensity
  const keyLight = new THREE.DirectionalLight(0xffffff, isMobile ? 1.5 : 30);
  keyLight.position.set(10, 35, 30);
  keyLight.castShadow = !isLowEndDevice;
  
  if (!isLowEndDevice) {
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0001;
  }
  scene.add(keyLight);

  // FILL LIGHT
  const fillLight = new THREE.DirectionalLight(0xfff4e6, isMobile ? 0.6 : 0.8);
  fillLight.position.set(-8, 10, -6);
  scene.add(fillLight);

  // RIM LIGHT
  const rimLight = new THREE.DirectionalLight(0xe6f3ff, isMobile ? 1.0 : 1.5);
  rimLight.position.set(0, 8, -10);
  scene.add(rimLight);

  // Reduced point lights for low-end devices
  if (!isLowEndDevice) {
    const pointLight1 = new THREE.PointLight(0xffffff, 1.0, 40);
    pointLight1.position.set(8, 5, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xfff4e6, 0.8, 35);
    pointLight2.position.set(-8, 5, -8);
    scene.add(pointLight2);
  }

  console.log('Optimized studio lighting configured');
}

// ==================== THREE.JS INITIALIZATION ====================
function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  camera = new THREE.PerspectiveCamera(
    isMobile ? 60 : 55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 6);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas: mainCanvas ?? undefined,
    antialias: !isLowEndDevice,
    alpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; // Reduced from 1.2
  renderer.shadowMap.enabled = !isLowEndDevice;
  
  if (!isLowEndDevice) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // ==================== POST-PROCESSING SETUP ====================
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // REDUCED BLOOM SETTINGS - Much more subtle
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.3 : 0.5,    // Strength: Reduced from 1.0/1.5 to 0.3/0.5
    isMobile ? 0.2 : 0.25,   // Radius: Reduced from 0.3/0.4 to 0.2/0.25
    0.9                       // Threshold: Increased from 0.85 to 0.9
  );
  composer.addPass(bloomPass);

  console.log('Optimized bloom effect initialized');

  createStudioLighting(scene);
  console.log('Three.js initialized with optimized settings');
}

// ==================== MODEL LOADING ====================
function loadModel(path = CONFIG.modelPath) {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    if (loadedModel) scene.remove(loadedModel);
    
    loadedModel = gltf.scene;
    
    loadedModel.traverse((child) => {
      if (child.isMesh) {
        if (!isLowEndDevice) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        
        if (child.material) {
          // Reduced emissive intensity
          if (child.material.map) {
            child.material.emissiveMap = child.material.map;
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = isMobile ? 0.2 : 0.3; // Reduced from 0.4/0.5
          } else {
            child.material.emissive = new THREE.Color(0x333333);
            child.material.emissiveIntensity = 0.2; // Reduced from 0.3
          }
          
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          child.material.needsUpdate = true;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(loadedModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    
    loadedModel.scale.setScalar(scale);
    loadedModel.position.sub(center.multiplyScalar(scale));
    loadedModel.position.y = 0;
    
    scene.add(loadedModel);
    
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    console.log('Model loaded with optimized emissive settings');
  }, undefined, (err) => {
    console.error('Model load error:', err);
  });
}

// ==================== SCROLL-BASED CAMERA ANIMATION ====================
let targetCameraAngle = 0;
let targetCameraDistance = 6;
let targetCameraHeight = 2;
let lastScrollTime = 0;
const scrollThrottle = isMobile ? 50 : 32; // Increased throttle for better performance

function updateCameraOnScroll() {
  const now = Date.now();
  if (now - lastScrollTime < scrollThrottle) return;
  lastScrollTime = now;

  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollProgress = Math.min(scrollY / maxScroll, 1);

  targetCameraAngle = scrollProgress * Math.PI * (isMobile ? 2.5 : 3.5);
  
  const zoomCycle = Math.sin(scrollProgress * Math.PI * (isMobile ? 3 : 5)) * (isMobile ? 1.2 : 1.8);
  targetCameraDistance = 6 + zoomCycle;
  
  const heightCycle = Math.sin(scrollProgress * Math.PI * (isMobile ? 2.5 : 3.5)) * (isMobile ? 0.8 : 1.2);
  targetCameraHeight = 2 + heightCycle;
}

function animateCamera() {
  const radius = targetCameraDistance;
  const targetX = Math.sin(targetCameraAngle) * radius;
  const targetZ = Math.cos(targetCameraAngle) * radius;
  const targetY = targetCameraHeight;

  const lerpFactor = isMobile ? 0.06 : 0.04; // Slightly faster lerp
  camera.position.x += (targetX - camera.position.x) * lerpFactor;
  camera.position.y += (targetY - camera.position.y) * lerpFactor;
  camera.position.z += (targetZ - camera.position.z) * lerpFactor;
  camera.lookAt(0, 0, 0);
}

// ==================== ANIMATION LOOP ====================
let lastTime = performance.now();
const targetFPS = isMobile ? 30 : 60;
const frameTime = 1000 / targetFPS;

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = currentTime - lastTime;
  if (deltaTime < frameTime) return;
  lastTime = currentTime;

  if (loadedModel) {
    loadedModel.rotation.y += isMobile ? 0.003 : 0.002; // Slower rotation
  }

  animateCamera();
  composer.render();
}

// ==================== EVENT LISTENERS ====================
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    
    if (renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  }, 150); // Increased debounce
});

let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    updateCameraOnScroll();
    scrollTimeout = null;
  }, scrollThrottle);
}, { passive: true });

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ==================== AR MODULE INTEGRATION ====================
window.addEventListener('DOMContentLoaded', () => {
  const startARBtn = document.getElementById('start-ar-btn');
  const stopARBtn = document.getElementById('stop-ar-btn');

  if (startARBtn) {
    startARBtn.addEventListener('click', initAR);
  }

  if (stopARBtn) {
    stopARBtn.addEventListener('click', stopAR);
  }
});

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  loadModel();
  animate(performance.now());
  initScrollAnimations();
  console.log(`Optimized scene loaded - Mobile: ${isMobile}, Low-end: ${isLowEndDevice}`);
});

window.addEventListener('beforeunload', () => {
  if (renderer) {
    try {
      renderer.dispose();
    } catch (e) {
      // ignore
    }
  }
  
  if (composer) {
    try {
      composer.dispose();
    } catch (e) {
      // ignore
    }
  }
  
  if (scene) scene.clear();
});
