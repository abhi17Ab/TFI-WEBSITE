// Product Page JavaScript with Scroll-Triggered UI Cards
// For tfi Zindabad

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ==================== CONFIGURATION ====================
const CONFIG = {
    modelPath: 'https://ipfs.io/ipfs/bafybeidydujm77zeccxui5ugmg43frwfzw23yoo7y2uyxpdb5hspenypqy'
};

// ==================== DOM ELEMENTS ====================
const canvas = document.getElementById('product-canvas');
const modelLoading = document.getElementById('modelLoading');
const autoRotateBtn = document.getElementById('autoRotateBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const sizeOptions = document.querySelectorAll('.size-option');
const quantityValue = document.getElementById('quantityValue');
const decreaseBtn = document.getElementById('decreaseQty');
const increaseBtn = document.getElementById('increaseQty');
const addToCartBtn = document.getElementById('addToCart');
const buyNowBtn = document.getElementById('buyNow');
const accordionHeaders = document.querySelectorAll('.accordion-header');
const cards = document.querySelectorAll('[data-card]');

// ==================== STATE MANAGEMENT ====================
let selectedSize = 'M';
let quantity = 1;
const maxQuantity = 10;

// Three.js variables
let scene, camera, renderer, loadedModel, composer;
let autoRotate = true;
let targetRotation = 0;
let scrollProgress = 0;

// Performance detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowEndDevice = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4);

// ==================== SCROLL-TRIGGERED CARD REVEAL ====================
function checkCardVisibility() {
    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    cards.forEach((card, index) => {
        const cardTop = card.offsetTop;
        const cardHeight = card.offsetHeight;
        const triggerPoint = scrollY + windowHeight - 100;
        
        if (triggerPoint > cardTop) {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100); // Stagger animation
        }
    });
    
    // Calculate scroll progress for 3D model rotation
    const maxScroll = document.body.scrollHeight - windowHeight;
    scrollProgress = Math.min(scrollY / maxScroll, 1);
}

// Throttled scroll handler
let scrollTimeout;
const scrollThrottle = isMobile ? 50 : 16;

window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
        checkCardVisibility();
        updateModelOnScroll();
        scrollTimeout = null;
    }, scrollThrottle);
}, { passive: true });

// Initial check
window.addEventListener('load', checkCardVisibility);

// ==================== THREE.JS INITIALIZATION ====================
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(
        isMobile ? 50 : 45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 8);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
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

    setupPostProcessing();
    setupLighting();

    console.log('Three.js initialized');
}

// ==================== POST-PROCESSING ====================
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);


}

// ==================== LIGHTING SETUP ====================
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, isMobile ? 15 : 22);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isMobile ? 2.0 : 3.5);
    keyLight.position.set(10, 30, 25);
    keyLight.castShadow = !isLowEndDevice;

    if (!isLowEndDevice) {
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
    }

    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff4e6, isMobile ? 0.8 : 1.5);
    fillLight.position.set(-8, 10, -6);
    scene.add(fillLight);

    const rimLight1 = new THREE.DirectionalLight(0x00ffff, isMobile ? 1.2 : 2.0);
    rimLight1.position.set(0, 8, -12);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xff00ff, isMobile ? 0.8 : 1.5);
    rimLight2.position.set(-10, 5, -8);
    scene.add(rimLight2);

    if (!isLowEndDevice) {
        const pointLight1 = new THREE.PointLight(0x00ffff, 2.0, 40);
        pointLight1.position.set(8, 5, 8);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 35);
        pointLight2.position.set(-8, 5, -8);
        scene.add(pointLight2);
    }
}

// ==================== MODEL LOADING ====================
function loadModel() {
    const loader = new GLTFLoader();

    loader.load(
        CONFIG.modelPath,
        (gltf) => {
            loadedModel = gltf.scene;

            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    if (!isLowEndDevice) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }

                    if (child.material) {
                        if (child.material.map) {
                            child.material.emissiveMap = child.material.map;
                            child.material.emissive = new THREE.Color(0xffffff);
                            child.material.emissiveIntensity = isMobile ? 0.25 : 0.35;
                        } else {
                            child.material.emissive = new THREE.Color(0x444444);
                            child.material.emissiveIntensity = 0.2;
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
            const scale = 5.5 / maxDim;

            loadedModel.scale.setScalar(scale);
            loadedModel.position.sub(center.multiplyScalar(scale));
            loadedModel.position.y = 0;

            scene.add(loadedModel);
            modelLoading.style.display = 'none';

            console.log('Model loaded successfully');
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
            modelLoading.querySelector('.loading-text').textContent = 'Failed to load model';
        }
    );
}

// ==================== SCROLL-BASED MODEL ANIMATION ====================
function updateModelOnScroll() {
    if (!autoRotate && loadedModel) {
        // Rotate model based on scroll progress
        targetRotation = scrollProgress * Math.PI * 6; // 3 full rotations
        
        // Update camera position based on scroll
        const radius = 8 - scrollProgress * 2; // Zoom in as you scroll
        camera.position.z = radius;
        camera.lookAt(0, 0, 0);
    }
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
            loadedModel.rotation.y += 0.006;
        } else {
            const lerpFactor = 0.1;
            loadedModel.rotation.y += (targetRotation - loadedModel.rotation.y) * lerpFactor;
        }

        // Floating animation
        loadedModel.position.y = Math.sin(currentTime * 0.001) * 0.15;
    }

    composer.render();
}

// ==================== CONTROL BUTTONS ====================
autoRotateBtn.addEventListener('click', function () {
    autoRotate = !autoRotate;
    this.classList.toggle('active');
    showNotification(
        autoRotate ? 'Auto rotation enabled' : 'Scroll to control rotation',
        'success'
    );
});

resetViewBtn.addEventListener('click', function () {
    if (loadedModel) {
        targetRotation = 0;
        loadedModel.rotation.set(0, 0, 0);
        camera.position.set(0, 1.5, 8);
        camera.lookAt(0, 0, 0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification('View reset', 'success');
    }
});

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
        name: 'Batman Verse Tshirt',
        price: 599,
        size: selectedSize,
        quantity: quantity,
        image: 'batman-verse-tshirt.jpg'
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
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 32px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #00ff88, #00ffff)' :
            type === 'warning' ? 'linear-gradient(135deg, #ffd700, #ff8800)' :
            'linear-gradient(135deg, #666, #888)'};
        color: ${type === 'success' || type === 'warning' ? '#000' : '#fff'};
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ==================== CART COUNT ====================
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
                font-size: 11px;
                font-weight: 700;
                padding: 3px 7px;
                border-radius: 10px;
                min-width: 20px;
                text-align: center;
            `;
            cartIcon.style.position = 'relative';
            cartIcon.appendChild(badge);
        }

        badge.textContent = totalItems > 0 ? totalItems : '';
        badge.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// ==================== WINDOW RESIZE ====================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (camera && renderer && composer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }
    }, 150);
});

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    loadModel();
    animate(performance.now());
    updateCartCount();
    checkCardVisibility();

    console.log('🎬 tfi Zindabad Product Page Initialized');
});

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
    if (renderer) renderer.dispose();
    if (composer) composer.dispose();
    if (scene) scene.clear();
});
