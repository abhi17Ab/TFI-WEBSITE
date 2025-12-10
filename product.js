// Product Page JavaScript with 3D Model Viewer
// For tfi Zindabad - Premium Telugu Cinema Merchandise

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ==================== CONFIGURATION ====================
const CONFIG = {
  modelPath: 'https://ipfs.io/ipfs/bafkreih3hfgumvgwoxvbu2gdvw65xoo5yny4uktmcub76dtue2h7bkzj3q'
};

// ==================== DOM ELEMENTS ====================
const canvas = document.getElementById('product-canvas');
const modelLoading = document.getElementById('modelLoading');
const scrollHint = document.getElementById('scrollHint');
const autoRotateBtn = document.getElementById('autoRotateBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const sizeOptions = document.querySelectorAll('.size-option');
const quantityValue = document.getElementById('quantityValue');
const decreaseBtn = document.getElementById('decreaseQty');
const increaseBtn = document.getElementById('increaseQty');
const addToCartBtn = document.getElementById('addToCart');
const buyNowBtn = document.getElementById('buyNow');
const accordionHeaders = document.querySelectorAll('.accordion-header');
const topNav = document.querySelector('.top-nav');

// ==================== STATE MANAGEMENT ====================
let selectedSize = 'M';
let quantity = 1;
const maxQuantity = 10;

// Three.js variables
let scene, camera, renderer, loadedModel, composer;
let autoRotate = true;
let scrollRotation = 0;
let targetRotation = 0;

// Performance detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowEndDevice = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4);

// ==================== THREE.JS INITIALIZATION ====================
function initThreeJS() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    isMobile ? 50 : 45,
    1, // Square aspect ratio for product view
    0.1,
    1000
  );
  camera.position.set(0, 1.5, 8);
  camera.lookAt(0, 0, 0);

  // Create renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !isLowEndDevice,
    alpha: true,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });

  const container = canvas.parentElement;
  const size = container.clientWidth;
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !isLowEndDevice;

  if (!isLowEndDevice) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // Setup post-processing
  setupPostProcessing();

  // Setup lighting
  setupLighting();

  console.log('Three.js initialized for product viewer');
}

// ==================== POST-PROCESSING ====================
function setupPostProcessing() {
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Subtle bloom effect
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.width, canvas.height),
    isMobile ? 0.3 : 0.5,
    isMobile ? 0.2 : 0.25,
    0.9
  );
  composer.addPass(bloomPass);

  console.log('Post-processing setup complete');
}

// ==================== LIGHTING SETUP ====================
function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Hemisphere light
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, isMobile ? 12 : 18);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Key light
  const keyLight = new THREE.DirectionalLight(0xffffff, isMobile ? 1.2 : 2.0);
  keyLight.position.set(8, 25, 20);
  keyLight.castShadow = !isLowEndDevice;

  if (!isLowEndDevice) {
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
  }
  scene.add(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0xfff4e6, isMobile ? 0.5 : 0.7);
  fillLight.position.set(-6, 8, -5);
  scene.add(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(0xe6f3ff, isMobile ? 0.8 : 1.2);
  rimLight.position.set(0, 5, -8);
  scene.add(rimLight);

  // Accent point lights
  if (!isLowEndDevice) {
    const pointLight1 = new THREE.PointLight(0x00ffff, 0.8, 30);
    pointLight1.position.set(6, 3, 6);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.6, 25);
    pointLight2.position.set(-6, 3, -6);
    scene.add(pointLight2);
  }

  console.log('Studio lighting configured');
}

// ==================== MODEL LOADING ====================
function loadModel() {
  const loader = new GLTFLoader();

  loader.load(
    CONFIG.modelPath,
    (gltf) => {
      loadedModel = gltf.scene;

      // Process model materials
      loadedModel.traverse((child) => {
        if (child.isMesh) {
          if (!isLowEndDevice) {
            child.castShadow = true;
            child.receiveShadow = true;
          }

          if (child.material) {
            // Enhanced material properties
            if (child.material.map) {
              child.material.emissiveMap = child.material.map;
              child.material.emissive = new THREE.Color(0xffffff);
              child.material.emissiveIntensity = isMobile ? 0.15 : 0.25;
            } else {
              child.material.emissive = new THREE.Color(0x222222);
              child.material.emissiveIntensity = 0.15;
            }

            child.material.metalness = 0.6;
            child.material.roughness = 0.35;
            child.material.needsUpdate = true;
          }
        }
      });

      // Center and scale model
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;

      loadedModel.scale.setScalar(scale);
      loadedModel.position.sub(center.multiplyScalar(scale));
      loadedModel.position.y = 0;

      scene.add(loadedModel);

      // Hide loading indicator
      modelLoading.style.display = 'none';

      console.log('3D Model loaded successfully');
    },
    (progress) => {
      // Loading progress
      const percent = (progress.loaded / progress.total) * 100;
      console.log(`Loading: ${percent.toFixed(0)}%`);
    },
    (error) => {
      console.error('Error loading model:', error);
      modelLoading.querySelector('.loading-text').textContent = 'Failed to load model';
    }
  );
}

// ==================== SCROLL-BASED ROTATION ====================
let lastScrollY = 0;
let scrollVelocity = 0;

function updateScrollRotation() {
  const productContainer = document.querySelector('.product-container');
  if (!productContainer) return;

  const rect = productContainer.getBoundingClientRect();
  const containerTop = rect.top;
  const containerHeight = rect.height;
  const viewportHeight = window.innerHeight;

  // Calculate scroll progress within the product container
  const scrollProgress = Math.max(0, Math.min(1,
    (viewportHeight - containerTop) / (containerHeight + viewportHeight)
  ));

  // Calculate rotation based on scroll
  if (!autoRotate) {
    targetRotation = scrollProgress * Math.PI * 4; // 2 full rotations
  }

  // Calculate scroll velocity for dynamic effects
  const currentScrollY = window.scrollY;
  scrollVelocity = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;
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
    if (autoRotate) {
      // Auto rotation mode
      loadedModel.rotation.y += 0.005;
    } else {
      // Scroll-based rotation with smooth interpolation
      const lerpFactor = 0.1;
      loadedModel.rotation.y += (targetRotation - loadedModel.rotation.y) * lerpFactor;
    }

    // Add slight tilt based on scroll velocity
    const tiltAmount = Math.min(Math.abs(scrollVelocity) * 0.001, 0.1);
    loadedModel.rotation.x = loadedModel.rotation.x * 0.9 + (scrollVelocity > 0 ? -tiltAmount : tiltAmount);
  }

  composer.render();
}

// ==================== CONTROL BUTTONS ====================
autoRotateBtn.addEventListener('click', function () {
  autoRotate = !autoRotate;
  this.classList.toggle('active');

  if (autoRotate) {
    scrollHint.style.display = 'none';
  } else {
    scrollHint.style.display = 'flex';
  }

  showNotification(
    autoRotate ? 'Auto rotation enabled' : 'Scroll to rotate model',
    'success'
  );
});

resetViewBtn.addEventListener('click', function () {
  if (loadedModel) {
    targetRotation = 0;
    loadedModel.rotation.y = 0;
    loadedModel.rotation.x = 0;
    loadedModel.rotation.z = 0;
    camera.position.set(0, 1.5, 8);
    camera.lookAt(0, 0, 0);

    showNotification('View reset', 'success');
  }
});

// ==================== SCROLL EVENT ====================
let scrollTimeout;
const scrollThrottle = isMobile ? 50 : 32;

window.addEventListener('scroll', () => {
  if (scrollTimeout) return;

  scrollTimeout = setTimeout(() => {
    updateScrollRotation();
    scrollTimeout = null;
  }, scrollThrottle);
}, { passive: true });

// ==================== SIZE SELECTION ====================
sizeOptions.forEach(option => {
  option.addEventListener('click', function () {
    sizeOptions.forEach(opt => opt.classList.remove('active'));
    this.classList.add('active');
    selectedSize = this.getAttribute('data-size');
    showNotification(`Size ${selectedSize} selected`, 'success');
  });
});

// ==================== QUANTITY CONTROL ====================
decreaseBtn.addEventListener('click', function () {
  if (quantity > 1) {
    quantity--;
    quantityValue.textContent = quantity;
    updateButtonStates();
  }
});

increaseBtn.addEventListener('click', function () {
  if (quantity < maxQuantity) {
    quantity++;
    quantityValue.textContent = quantity;
    updateButtonStates();
  } else {
    showNotification(`Maximum quantity is ${maxQuantity}`, 'warning');
  }
});

function updateButtonStates() {
  decreaseBtn.style.opacity = quantity === 1 ? '0.5' : '1';
  increaseBtn.style.opacity = quantity === maxQuantity ? '0.5' : '1';
}

// ==================== ADD TO CART ====================
addToCartBtn.addEventListener('click', function () {
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    this.style.transform = 'scale(1)';
  }, 150);

  const productData = {
    name: 'Fanverse Premium T-Shirt',
    price: 599,
    size: selectedSize,
    quantity: quantity,
    image: 'product-thumbnail.jpg'
  };

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingIndex = cart.findIndex(item =>
    item.name === productData.name && item.size === productData.size
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += productData.quantity;
  } else {
    cart.push(productData);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showNotification(`Added ${quantity} item(s) to cart!`, 'success');
  updateCartCount();
});

// ==================== BUY NOW ====================
buyNowBtn.addEventListener('click', function () {
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    this.style.transform = 'scale(1)';
  }, 150);

  addToCartBtn.click();

  setTimeout(() => {
    showNotification('Redirecting to checkout...', 'success');
  }, 500);
});

// ==================== ACCORDION ====================
accordionHeaders.forEach(header => {
  header.addEventListener('click', function () {
    const accordionId = this.getAttribute('data-accordion');
    const content = document.querySelector(`[data-content="${accordionId}"]`);

    this.classList.toggle('active');
    content.classList.toggle('active');
  });
});

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #00ff88, #00ffff)' :
      type === 'warning' ? 'linear-gradient(135deg, #ffd700, #ff8800)' :
        'linear-gradient(135deg, #666, #888)'};
    color: ${type === 'success' || type === 'warning' ? '#000' : '#fff'};
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    backdrop-filter: blur(10px);
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ==================== CART COUNT UPDATE ====================
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartIcon = document.querySelector('[aria-label="Cart"]');
  if (cartIcon) {
    let badge = cartIcon.querySelector('.cart-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: linear-gradient(135deg, #ff00ff, #00ffff);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      `;
      cartIcon.style.position = 'relative';
      cartIcon.appendChild(badge);
    }
    badge.textContent = totalItems > 0 ? totalItems : '';
    badge.style.display = totalItems > 0 ? 'block' : 'none';
  }
}

// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    topNav.classList.add('scrolled');
  } else {
    topNav.classList.remove('scrolled');
  }
});

// ==================== WINDOW RESIZE ====================
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (camera && renderer && composer) {
      const container = canvas.parentElement;
      const size = container.clientWidth;

      camera.aspect = 1;
      camera.updateProjectionMatrix();

      renderer.setSize(size, size);
      composer.setSize(size, size);
    }
  }, 150);
});

// ==================== KEYBOARD NAVIGATION ====================
document.addEventListener('keydown', function (e) {
  if (e.key === '+' || e.key === '=') {
    increaseBtn.click();
  } else if (e.key === '-' || e.key === '_') {
    decreaseBtn.click();
  }

  const sizeMap = { '1': 'S', '2': 'M', '3': 'L', '4': 'XL', '5': 'XXL' };
  if (sizeMap[e.key]) {
    const sizeOption = Array.from(sizeOptions).find(opt =>
      opt.getAttribute('data-size') === sizeMap[e.key]
    );
    if (sizeOption) sizeOption.click();
  }

  // R key to reset view
  if (e.key === 'r' || e.key === 'R') {
    resetViewBtn.click();
  }

  // Space to toggle auto-rotate
  if (e.key === ' ') {
    e.preventDefault();
    autoRotateBtn.click();
  }
});

// ==================== MOBILE MENU ====================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', function () {
    this.classList.toggle('active');
    navLinks.classList.toggle('active');

    const spans = this.querySelectorAll('span');
    spans[0].style.transform = this.classList.contains('active') ?
      'rotate(45deg) translate(5px, 5px)' : 'none';
    spans[1].style.opacity = this.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = this.classList.contains('active') ?
      'rotate(-45deg) translate(7px, -6px)' : 'none';
  });
}

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  loadModel();
  animate(performance.now());
  updateCartCount();

  // Open first accordion by default
  if (accordionHeaders.length > 0) {
    accordionHeaders[0].click();
  }

  // Hide scroll hint after auto-rotate is on
  setTimeout(() => {
    if (autoRotate) {
      scrollHint.style.display = 'none';
    }
  }, 5000);

  console.log('🎬 tfi Zindabad Product Page with 3D Viewer Initialized');
  console.log('For The Fans. By The Fans.');
});

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
  if (renderer) {
    try { renderer.dispose(); } catch (e) { }
  }
  if (composer) {
    try { composer.dispose(); } catch (e) { }
  }
  if (scene) scene.clear();
});