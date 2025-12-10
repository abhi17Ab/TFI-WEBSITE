// Main JavaScript for tfi Zindabad Landing Page
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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
            if (isLowEndDevice) {
                observer.unobserve(entry.target);
            }
        }
    });
}, observerOptions);

function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => observer.observe(el));
}

// ==================== STUDIO LIGHTING SETUP ====================
function createStudioLighting(scene) {
    // Soft ambient base light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Hemisphere light for natural ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 25);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // KEY LIGHT - Main light (slightly warm white, bright)
    const keyLight = new THREE.DirectionalLight(0xffffff, isMobile ? 2.0 : 50.5);
    keyLight.position.set(10, 35, 30);
    keyLight.castShadow = !isLowEndDevice;

    if (!isLowEndDevice) {
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -20;
        keyLight.shadow.camera.right = 20;
        keyLight.shadow.camera.top = 20;
        keyLight.shadow.camera.bottom = -20;
        keyLight.shadow.bias = -0.0001;
    }

    scene.add(keyLight);

    // FILL LIGHT - Softer, warm tone
    const fillLight = new THREE.DirectionalLight(0xfff4e6, isMobile ? 0.8 : 1.2);
    fillLight.position.set(-8, 10, -6);
    scene.add(fillLight);

    // RIM LIGHT - Cool tone for depth and separation
    const rimLight = new THREE.DirectionalLight(0xe6f3ff, isMobile ? 1.5 : 2.0);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // Accent point lights for highlights (studio setup)
    if (!isLowEndDevice) {
        const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 40);
        pointLight1.position.set(8, 5, 8);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xfff4e6, 1.2, 35);
        pointLight2.position.set(-8, 5, -8);
        scene.add(pointLight2);

        const pointLight3 = new THREE.PointLight(0xffd4a3, 1.0, 30);
        pointLight3.position.set(0, 2, 12);
        scene.add(pointLight3);
    }

    console.log('Studio lighting configured');
}

// ==================== THREE.JS INITIALIZATION ====================
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background

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
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isLowEndDevice;

    if (!isLowEndDevice) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // ==================== POST-PROCESSING SETUP ====================
    // Create EffectComposer
    composer = new EffectComposer(renderer);

    // Add RenderPass (base scene rendering)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add UnrealBloomPass with optimized settings for mobile
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        isMobile ? 1.0 : 1.5, // strength - reduced on mobile
        isMobile ? 0.3 : 0.4, // radius - reduced on mobile
        0.85 // threshold
    );
    composer.addPass(bloomPass);

    console.log('Bloom effect initialized');

    // Initialize studio lighting
    createStudioLighting(scene);

    console.log('Three.js initialized with studio lighting and bloom');
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
                    // If the material has a texture map, use it as emissive map
                    if (child.material.map) {
                        child.material.emissiveMap = child.material.map;
                        child.material.emissive = new THREE.Color(0xffffff); // White to show texture colors
                        child.material.emissiveIntensity = isMobile ? 0.4 : 0.5; // Slightly reduced on mobile
                    } else {
                        // Fallback for materials without textures
                        child.material.emissive = new THREE.Color(0x333333);
                        child.material.emissiveIntensity = 0.3;
                    }

                    child.material.metalness = 0.7;
                    child.material.roughness = 0.3;
                    child.material.needsUpdate = true; // Important: trigger material update
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

        console.log('Model loaded with emissive textures');
    }, undefined, (err) => {
        console.error('Model load error:', err);
    });
}

// ==================== SCROLL-BASED CAMERA ANIMATION ====================
let targetCameraAngle = 0;
let targetCameraDistance = 6;
let targetCameraHeight = 2;
let lastScrollTime = 0;
const scrollThrottle = isMobile ? 32 : 16;

function updateCameraOnScroll() {
    const now = Date.now();
    if (now - lastScrollTime < scrollThrottle) return;

    lastScrollTime = now;

    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);

    targetCameraAngle = scrollProgress * Math.PI * (isMobile ? 3 : 4);

    const zoomCycle = Math.sin(scrollProgress * Math.PI * (isMobile ? 4 : 6)) * (isMobile ? 1.5 : 2);
    targetCameraDistance = 6 + zoomCycle;

    const heightCycle = Math.sin(scrollProgress * Math.PI * (isMobile ? 3 : 4)) * (isMobile ? 1 : 1.5);
    targetCameraHeight = 2 + heightCycle;
}

function animateCamera() {
    const radius = targetCameraDistance;
    const targetX = Math.sin(targetCameraAngle) * radius;
    const targetZ = Math.cos(targetCameraAngle) * radius;
    const targetY = targetCameraHeight;

    const lerpFactor = isMobile ? 0.08 : 0.05;

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
        loadedModel.rotation.y += isMobile ? 0.004 : 0.003;
    }

    animateCamera();

    // Use composer instead of renderer
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

        // Update composer size
        if (composer) {
            composer.setSize(window.innerWidth, window.innerHeight);
        }
    }, 100);
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

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    loadModel();
    animate(performance.now());
    initScrollAnimations();

    console.log(`Scene loaded - Mobile: ${isMobile}, Low-end: ${isLowEndDevice}`);
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
