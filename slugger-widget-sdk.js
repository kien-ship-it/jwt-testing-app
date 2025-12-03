/**
 * SLUGGER Widget SDK v1.1
 * 
 * Handles authentication token reception from the SLUGGER shell
 * and provides utilities for making authenticated API calls.
 * 
 * Based on: Widget Developer Integration Guide v1.1
 */

export class SluggerUser {
    constructor(data) {
        this.id = data.id || data.sub;
        this.email = data.email;
        this.emailVerified = data.emailVerified ?? data.email_verified ?? false;
        this.firstName = data.firstName || data.given_name;
        this.lastName = data.lastName || data.family_name;
        this.role = data.role;
        this.teamId = data.teamId;
        this.teamRole = data.teamRole;
        this.isAdmin = data.isAdmin ?? false;
    }
}

export class SluggerWidgetSDK {
    constructor(options) {
        this.options = {
            allowedOrigins: [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com',
                'https://alpb-analytics.com',
                'https://www.alpb-analytics.com'
            ],
            apiBaseUrl: '',
            onAuthReady: () => {},
            onAuthError: () => {},
            onTokenRefresh: () => {},
            ...options
        };

        this.auth = null;
        this.shellOrigin = null;
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.init();
    }

    init() {
        // Listen for messages from shell
        window.addEventListener('message', this.handleMessage.bind(this));

        // Signal that widget is ready
        this.sendReady();

        // Set timeout for auth
        setTimeout(() => {
            if (!this.auth) {
                const error = 'Authentication timeout - no tokens received from shell';
                this.options.onAuthError(error);
                this.readyReject(new Error(error));
            }
        }, 10000); // 10 second timeout
    }

    handleMessage(event) {
        // Validate origin
        if (!this.options.allowedOrigins.includes(event.origin)) {
            console.warn('Received message from unauthorized origin:', event.origin);
            return;
        }

        if (event.data?.type === 'SLUGGER_AUTH') {
            this.shellOrigin = event.origin;
            this.processAuth(event.data.payload);
        }
    }

    processAuth(payload) {
        try {
            // Decode ID token to get user info
            let user;
            
            // If user info is provided in payload, use it (Phase 0A+)
            if (payload.user) {
                user = new SluggerUser(payload.user);
            } else {
                // Fallback: decode from ID token
                user = this.decodeIdToken(payload.idToken);
            }
            
            this.auth = {
                accessToken: payload.accessToken,
                idToken: payload.idToken,
                expiresAt: payload.expiresAt,
                user
            };

            // Store full tokens for copying
            this._fullTokens = {
                access: payload.accessToken,
                id: payload.idToken
            };

            // Set API base URL from shell origin if not specified
            if (!this.options.apiBaseUrl && this.shellOrigin) {
                this.options.apiBaseUrl = this.shellOrigin;
            }

            // Notify listeners
            if (this.readyResolve) {
                this.readyResolve(this.auth);
            }
            this.options.onAuthReady(this.auth);

            // Schedule token refresh
            this.scheduleTokenRefresh();

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to process auth';
            this.options.onAuthError(message);
            this.readyReject(new Error(message));
        }
    }

    decodeIdToken(idToken) {
        try {
            const payload = idToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            
            return new SluggerUser({
                sub: decoded.sub,
                email: decoded.email,
                email_verified: decoded.email_verified,
                given_name: decoded.given_name,
                family_name: decoded.family_name
            });
        } catch (error) {
            throw new Error('Failed to decode ID token: ' + error.message);
        }
    }

    scheduleTokenRefresh() {
        if (!this.auth) return;

        // Refresh 5 minutes before expiry
        const refreshTime = this.auth.expiresAt - Date.now() - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
            setTimeout(() => {
                this.requestTokenRefresh();
            }, refreshTime);
        }
    }

    sendReady() {
        window.parent.postMessage({
            type: 'SLUGGER_WIDGET_READY',
            widgetId: this.options.widgetId
        }, '*');
    }

    /**
     * Request fresh tokens from the shell
     */
    requestTokenRefresh() {
        window.parent.postMessage({
            type: 'SLUGGER_TOKEN_REFRESH'
        }, this.shellOrigin || '*');
    }

    /**
     * Wait for authentication to be ready
     */
    async waitForAuth() {
        return this.readyPromise;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.auth !== null && Date.now() < this.auth.expiresAt;
    }

    /**
     * Get current auth state
     */
    getAuth() {
        return this.auth;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.auth?.user ?? null;
    }

    /**
     * Get access token for API calls
     */
    getAccessToken() {
        if (!this.auth || Date.now() >= this.auth.expiresAt) {
            return null;
        }
        return this.auth.accessToken;
    }

    /**
     * Get full token (for copying)
     */
    getFullToken(type) {
        return this._fullTokens?.[type] || null;
    }

    /**
     * Make an authenticated fetch request
     */
    async fetch(path, options = {}) {
        const token = this.getAccessToken();
        
        if (!token) {
            throw new Error('Not authenticated or token expired');
        }

        const url = path.startsWith('http') 
            ? path 
            : `${this.options.apiBaseUrl}${path}`;

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Cleanup - call when widget unmounts
     */
    destroy() {
        window.removeEventListener('message', this.handleMessage.bind(this));
    }
}

export default SluggerWidgetSDK;
