// AR Script - Snap Camera Kit Integration (Enhanced)
// Features: Camera Switch, Image Capture, Multiple Lenses

import { bootstrapCameraKit, createMediaStreamSource, Transform2D } from '@snap/camera-kit';

// ==================== CONFIGURATION ====================
// IMPORTANT: Replace these with your actual Snap Camera Kit credentials

const CONFIG = {
    // Your API Token from Snap Camera Kit Developer Portal
    API_TOKEN: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzYxNzI3ODY4LCJzdWIiOiJhNGIwOTdjYS03MmNhLTRjOTctYjRkNS04NWNlOWZhYzRiNjd-U1RBR0lOR341ZWRmN2YwMy02NmIzLTRlMWQtYmU3OS0wNGMxM2FjMTJmZjkifQ.QkKcpH1DDxCpkkQ6IVq0BMVWrjdZLKmcOgHfZTpa8Vg',

    // Define multiple lenses here (get these from Camera Kit portal)
    LENSES: [
        {
            id: '6eb41c86-8bc6-4850-9c93-6bfae3a7bcf4',
            groupId: 'c997682d-fd8a-48e8-871e-5e2826719c59',
            name: 'Sword',
            description: 'TFIZ'
        },
        {
            id: 'ed543bf3-2e7f-40cb-80a5-ac8221f9facd',
            groupId: 'c997682d-fd8a-48e8-871e-5e2826719c59',
            name: 'BATMAN',
            description: 'TFIZ'
        },
    
        // Add more lenses as needed
    ]
};

// ==================== DOM ELEMENTS ====================
const canvas = document.getElementById('ar-canvas');
const placeholder = document.getElementById('canvas-placeholder');
const startBtn = document.getElementById('start-ar-btn');
const stopBtn = document.getElementById('stop-ar-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn');
const captureBtn = document.getElementById('capture-btn');
const statusMessage = document.getElementById('status-message');
const loadingSpinner = document.getElementById('loading-spinner');
const lensSelector = document.getElementById('lens-selector');
const lensGrid = document.getElementById('lens-grid');

// Capture preview modal
const capturePreview = document.getElementById('capture-preview');
const previewImage = document.getElementById('preview-image');
const downloadBtn = document.getElementById('download-btn');
const closePreviewBtn = document.getElementById('close-preview-btn');

// ==================== STATE ====================
let cameraKit = null;
let session = null;
let mediaStream = null;
let currentCameraFacing = 'user'; // 'user' = front, 'environment' = back
let currentLensIndex = 0;
let loadedLenses = [];
let capturedImageData = null;

// ==================== HELPER FUNCTIONS ====================

/**
 * Show status message to user
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show/hide loading spinner
 */
function setLoading(isLoading) {
    loadingSpinner.style.display = isLoading ? 'block' : 'none';
}

/**
 * Validate configuration
 */
function validateConfig() {
    if (CONFIG.API_TOKEN === 'YOUR_API_TOKEN_HERE') {
        throw new Error('Please configure your Snap Camera Kit API Token in ar-script.js');
    }
    if (!CONFIG.LENSES || CONFIG.LENSES.length === 0) {
        throw new Error('Please configure at least one lens in CONFIG.LENSES');
    }
    if (CONFIG.LENSES[0].id === 'YOUR_LENS_ID_1') {
        throw new Error('Please replace lens IDs with your actual lens IDs');
    }
}

/**
 * Initialize lens selector UI
 */
function initLensSelector() {
    lensGrid.innerHTML = '';

    CONFIG.LENSES.forEach((lens, index) => {
        const lensBtn = document.createElement('button');
        lensBtn.className = 'lens-option' + (index === 0 ? ' active' : '');
        lensBtn.textContent = lens.name;
        lensBtn.title = lens.description;
        lensBtn.dataset.index = index;

        lensBtn.addEventListener('click', () => switchLens(index));

        lensGrid.appendChild(lensBtn);
    });
}

/**
 * Update active lens button
 */
function updateLensUI(activeIndex) {
    const buttons = lensGrid.querySelectorAll('.lens-option');
    buttons.forEach((btn, index) => {
        if (index === activeIndex) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ==================== MAIN AR FUNCTIONS ====================

/**
 * Initialize and start AR experience
 */
async function startAR() {
    try {
        validateConfig();
        setLoading(true);
        showStatus('Initializing Camera Kit...', 'info');

        // Initialize Camera Kit
        cameraKit = await bootstrapCameraKit({
            apiToken: CONFIG.API_TOKEN
        });

        console.log('✓ Camera Kit initialized');

        // Create session
        showStatus('Creating AR session...', 'info');
        session = await cameraKit.createSession({
            liveRenderTarget: canvas
        });

        // Handle errors
        session.events.addEventListener('error', (event) => {
            console.error('Lens execution error:', event.detail.error);
            showStatus('Lens error: ' + event.detail.error.message, 'error');
        });

        console.log('✓ Session created');

        // Access camera
        await startCamera();

        // Load all lenses
        showStatus('Loading lenses...', 'info');
        loadedLenses = await Promise.all(
            CONFIG.LENSES.map(lens => 
                cameraKit.lensRepository.loadLens(lens.id, lens.groupId)
            )
        );

        console.log(`✓ Loaded ${loadedLenses.length} lenses`);

        // Apply first lens
        await session.applyLens(loadedLenses[0]);
        currentLensIndex = 0;

        // Start rendering
        await session.play();

        // Update UI
        placeholder.style.display = 'none';
        canvas.style.display = 'block';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        switchCameraBtn.style.display = 'inline-block';
        captureBtn.style.display = 'inline-block';
        lensSelector.style.display = 'block';
        setLoading(false);

        // Initialize lens selector
        initLensSelector();
        updateLensUI(0);

        showStatus('AR Experience Active! 🎉', 'success');
        console.log('✓ AR started successfully');

    } catch (error) {
        console.error('AR initialization error:', error);
        setLoading(false);

        let errorMessage = 'Failed to start AR: ' + error.message;

        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found on your device.';
        } else if (error.message.includes('configure')) {
            errorMessage = error.message;
        }

        showStatus(errorMessage, 'error');
    }
}

/**
 * Start camera stream
 */
async function startCamera() {
    showStatus(`Requesting ${currentCameraFacing === 'user' ? 'front' : 'back'} camera access...`, 'info');

    // Stop existing stream if any
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }

    // Request new camera stream
    mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: currentCameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    });

    // Create source and attach to session
    const source = createMediaStreamSource(mediaStream, {
        transform: currentCameraFacing === 'user' ? Transform2D.MirrorX : Transform2D.None,
        cameraType: currentCameraFacing
    });

    await session.setSource(source);

    console.log(`✓ Camera started: ${currentCameraFacing}`);
}

/**
 * Switch between front and back camera
 */
async function switchCamera() {
    try {
        setLoading(true);
        showStatus('Switching camera...', 'info');

        // Pause session
        await session.pause();

        // Toggle camera facing
        currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';

        // Restart camera with new facing mode
        await startCamera();

        // Resume session
        await session.play();

        setLoading(false);
        showStatus(`Switched to ${currentCameraFacing === 'user' ? 'front' : 'back'} camera`, 'success');

    } catch (error) {
        console.error('Camera switch error:', error);
        setLoading(false);

        if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
            showStatus('This device does not have a ' + 
                (currentCameraFacing === 'user' ? 'front' : 'back') + 
                ' camera. Reverting...', 'error');
            // Revert camera facing
            currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
        } else {
            showStatus('Failed to switch camera: ' + error.message, 'error');
        }
    }
}

/**
 * Switch to a different lens
 */
async function switchLens(lensIndex) {
    if (lensIndex === currentLensIndex || !session || !loadedLenses[lensIndex]) {
        return;
    }

    try {
        setLoading(true);
        showStatus(`Switching to ${CONFIG.LENSES[lensIndex].name}...`, 'info');

        // Apply new lens
        await session.applyLens(loadedLenses[lensIndex]);
        currentLensIndex = lensIndex;

        // Update UI
        updateLensUI(lensIndex);
        setLoading(false);

        showStatus(`Now using: ${CONFIG.LENSES[lensIndex].name}`, 'success');
        console.log(`✓ Switched to lens: ${CONFIG.LENSES[lensIndex].name}`);

    } catch (error) {
        console.error('Lens switch error:', error);
        setLoading(false);
        showStatus('Failed to switch lens: ' + error.message, 'error');
    }
}

/**
 * Capture current AR frame as image
 */
async function captureImage() {
    try {
        showStatus('Capturing image...', 'info');

        // Take snapshot from canvas
        const dataUrl = canvas.toDataURL('image/png');
        capturedImageData = dataUrl;

        // Show preview
        previewImage.src = dataUrl;
        capturePreview.classList.add('show');

        showStatus('Photo captured! 📸', 'success');
        console.log('✓ Image captured');

    } catch (error) {
        console.error('Capture error:', error);
        showStatus('Failed to capture image: ' + error.message, 'error');
    }
}

/**
 * Download captured image
 */
function downloadImage() {
    if (!capturedImageData) return;

    try {
        // Create download link
        const link = document.createElement('a');
        link.download = `tfi-ar-${Date.now()}.png`;
        link.href = capturedImageData;
        link.click();

        showStatus('Image downloaded! ✓', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showStatus('Failed to download image: ' + error.message, 'error');
    }
}

/**
 * Close capture preview modal
 */
function closePreview() {
    capturePreview.classList.remove('show');
    capturedImageData = null;
}

/**
 * Stop AR experience and cleanup
 */
async function stopAR() {
    try {
        setLoading(true);

        // Stop the session
        if (session) {
            await session.pause();
            session = null;
        }

        // Stop camera stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        // Clear loaded lenses
        loadedLenses = [];
        currentLensIndex = 0;

        // Reset UI
        canvas.style.display = 'none';
        placeholder.style.display = 'flex';
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        switchCameraBtn.style.display = 'none';
        captureBtn.style.display = 'none';
        lensSelector.style.display = 'none';
        setLoading(false);

        showStatus('AR stopped', 'info');
        console.log('✓ AR experience stopped');

    } catch (error) {
        console.error('Error stopping AR:', error);
        setLoading(false);
        showStatus('Error stopping AR: ' + error.message, 'error');
    }
}

// ==================== EVENT LISTENERS ====================

startBtn.addEventListener('click', startAR);
stopBtn.addEventListener('click', stopAR);
switchCameraBtn.addEventListener('click', switchCamera);
captureBtn.addEventListener('click', captureImage);
downloadBtn.addEventListener('click', downloadImage);
closePreviewBtn.addEventListener('click', closePreview);

// Close preview on backdrop click
capturePreview.addEventListener('click', (e) => {
    if (e.target === capturePreview) {
        closePreview();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!session) return;

    switch(e.key) {
        case ' ': // Spacebar - capture
            e.preventDefault();
            captureImage();
            break;
        case 'c': // C - switch camera
            e.preventDefault();
            switchCamera();
            break;
        case 'Escape': // ESC - close preview
            if (capturePreview.classList.contains('show')) {
                closePreview();
            }
            break;
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});

// ==================== INITIALIZATION ====================

console.log(`
═══════════════════════════════════════════════════════════════
    TFI ZINDABAD AR EXPERIENCE - ENHANCED VERSION
═══════════════════════════════════════════════════════════════

Features:
✓ Multiple AR Lenses
✓ Front/Back Camera Switch
✓ Capture Photos
✓ Download Images

Keyboard Shortcuts:
- SPACE: Capture photo
- C: Switch camera
- ESC: Close preview

Setup Instructions:
1. Configure CONFIG.API_TOKEN with your Snap Camera Kit API token
2. Add your lenses to CONFIG.LENSES array with IDs and group IDs
3. Run: npm run dev (or npm run build for production)
4. Deploy to Netlify with HTTPS

For detailed setup guide, see AR_SETUP_GUIDE_ENHANCED.md

═══════════════════════════════════════════════════════════════
`);

// Show initial instruction
showStatus('Configure your Snap Camera Kit credentials and lenses in ar-script.js to get started', 'info');
