/**
 * JWT Testing Widget Application
 * Main application logic for testing SLUGGER JWT authentication
 */

import SluggerWidgetSDK from './slugger-widget-sdk.js';

// Global variables
let sdk = null;
let eventLogEntries = [];

// Initialize the widget
function initWidget() {
    logEvent('info', 'Initializing JWT Testing Widget...');

    sdk = new SluggerWidgetSDK({
        widgetId: 'jwt-testing-widget',
        onAuthReady: handleAuthReady,
        onAuthError: handleAuthError,
        onTokenRefresh: handleTokenRefresh
    });

    updateStatus('Waiting for authentication...', 'pending');
}

// Event Handlers
function handleAuthReady(auth) {
    logEvent('success', 'Authentication successful!');
    logEvent('info', `User: ${auth.user.email} (${auth.user.id})`);

    updateStatus('Authenticated', 'success');
    updateAuthInfo(auth);
    updateUserInfo(auth.user);
    updateTokenInfo(auth);
    updateRawPayload(auth);

    // Show hidden sections
    document.getElementById('user-section').style.display = 'block';
    document.getElementById('token-section').style.display = 'block';
    document.getElementById('api-section').style.display = 'block';
}

function handleAuthError(error) {
    logEvent('error', `Authentication failed: ${error}`);
    updateStatus(`Error: ${error}`, 'error');
}

function handleTokenRefresh(auth) {
    logEvent('success', 'Tokens refreshed successfully');
    updateAuthInfo(auth);
    updateTokenInfo(auth);
    updateRawPayload(auth);
}

// UI Update Functions
function updateStatus(message, type = 'pending') {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    statusText.textContent = message;

    // Update indicator state
    statusIndicator.className = 'status-indicator';
    if (type === 'success') {
        statusIndicator.classList.add('success');
    } else if (type === 'error') {
        statusIndicator.classList.add('error');
    }
}

function updateAuthInfo(auth) {
    const authState = document.getElementById('auth-state');
    authState.textContent = sdk.isAuthenticated() ? 'Authenticated' : 'Expired';
    authState.className = `value badge ${sdk.isAuthenticated() ? 'badge-success' : 'badge-danger'}`;

    const expiresAt = new Date(auth.expiresAt);
    document.getElementById('token-expiry').textContent = expiresAt.toLocaleString();

    document.getElementById('shell-origin').textContent = sdk.shellOrigin || 'Unknown';
}

function updateUserInfo(user) {
    document.getElementById('user-id').textContent = user.id || '—';
    document.getElementById('user-email').textContent = user.email || '—';

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
    document.getElementById('user-name').textContent = fullName;

    const roleElement = document.getElementById('user-role');
    roleElement.textContent = user.role || '—';
    roleElement.className = 'value badge badge-success';

    document.getElementById('user-team-id').textContent = user.teamId || '—';
    document.getElementById('user-team-role').textContent = user.teamRole || '—';
    document.getElementById('user-admin').textContent = user.isAdmin ? '✅ Yes' : '❌ No';
    document.getElementById('user-email-verified').textContent = user.emailVerified ? '✅ Yes' : '❌ No';
}

function updateTokenInfo(auth) {
    const accessTokenPreview = auth.accessToken.substring(0, 50) + '...';
    const idTokenPreview = auth.idToken.substring(0, 50) + '...';

    document.getElementById('access-token').textContent = accessTokenPreview;
    document.getElementById('id-token').textContent = idTokenPreview;

    const expiresAt = new Date(auth.expiresAt);
    const timeUntilExpiry = Math.floor((auth.expiresAt - Date.now()) / 1000 / 60);
    document.getElementById('token-expiration').textContent =
        `${expiresAt.toLocaleString()} (${timeUntilExpiry} minutes remaining)`;
}

function updateRawPayload(auth) {
    const payload = {
        type: 'SLUGGER_AUTH',
        payload: {
            accessToken: auth.accessToken.substring(0, 50) + '...',
            idToken: auth.idToken.substring(0, 50) + '...',
            expiresAt: auth.expiresAt,
            expiresAtDate: new Date(auth.expiresAt).toISOString(),
            user: auth.user
        }
    };

    document.getElementById('raw-payload').textContent = JSON.stringify(payload, null, 2);
}

// Event Logging
function logEvent(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { type, message, timestamp };
    eventLogEntries.unshift(entry);

    // Keep only last 50 entries
    if (eventLogEntries.length > 50) {
        eventLogEntries = eventLogEntries.slice(0, 50);
    }

    renderEventLog();
}

function renderEventLog() {
    const logElement = document.getElementById('event-log');

    if (eventLogEntries.length === 0) {
        logElement.innerHTML = '<div class="log-entry">No events yet...</div>';
        return;
    }

    logElement.innerHTML = eventLogEntries.map(entry => `
        <div class="log-entry">
            <span class="log-timestamp">[${entry.timestamp}]</span>
            <span class="log-type ${entry.type}">${entry.type.toUpperCase()}</span>
            <span>${entry.message}</span>
        </div>
    `).join('');
}

function clearLog() {
    eventLogEntries = [];
    renderEventLog();
    logEvent('info', 'Event log cleared');
}

// API Testing Functions
async function testApiCall() {
    const endpoint = document.getElementById('api-endpoint').value;
    const responseContainer = document.getElementById('api-response');
    const responseText = document.getElementById('api-response-text');
    const testBtn = document.getElementById('test-api-btn');

    if (!sdk || !sdk.isAuthenticated()) {
        logEvent('error', 'Cannot make API call: not authenticated');
        alert('Not authenticated. Please wait for authentication.');
        return;
    }

    logEvent('info', `Testing API call: ${endpoint}`);

    // Disable button and show loading
    testBtn.disabled = true;
    testBtn.textContent = '⏳ Loading...';
    responseContainer.style.display = 'block';
    responseText.textContent = 'Loading...';

    try {
        const response = await sdk.fetch(endpoint);
        const data = await response.json();

        const result = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: data
        };

        responseText.textContent = JSON.stringify(result, null, 2);

        if (response.ok) {
            logEvent('success', `API call successful: ${response.status}`);
        } else {
            logEvent('warning', `API call returned status: ${response.status}`);
        }
    } catch (error) {
        responseText.textContent = `Error: ${error.message}\n\n${error.stack}`;
        logEvent('error', `API call failed: ${error.message}`);
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = '🔗 Test API Call';
    }
}

function requestRefresh() {
    if (!sdk) {
        logEvent('error', 'SDK not initialized');
        return;
    }

    logEvent('info', 'Requesting token refresh...');
    sdk.requestTokenRefresh();
}

// Token Copy Functions
window.copyToken = function (type) {
    if (!sdk) {
        alert('SDK not initialized');
        return;
    }

    const token = sdk.getFullToken(type);
    if (!token) {
        alert('Token not available');
        return;
    }

    navigator.clipboard.writeText(token).then(() => {
        logEvent('info', `${type} token copied to clipboard`);

        // Visual feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        logEvent('error', `Failed to copy token: ${err.message}`);
        alert('Failed to copy token. Please try again.');
    });
};

// Global function exports for HTML onclick handlers
window.testApiCall = testApiCall;
window.requestRefresh = requestRefresh;
window.clearLog = clearLog;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    logEvent('info', 'Widget loaded successfully');
    initWidget();
});

// Update expiry countdown every minute
setInterval(() => {
    if (sdk && sdk.isAuthenticated()) {
        const auth = sdk.getAuth();
        const timeUntilExpiry = Math.floor((auth.expiresAt - Date.now()) / 1000 / 60);

        if (timeUntilExpiry <= 5) {
            logEvent('warning', `Token expiring soon: ${timeUntilExpiry} minutes remaining`);
        }
    }
}, 60000); // Check every minute
