# Widget Developer Integration Guide

**Version:** 1.1  
**Date:** November 30, 2025  
**Status:** Active

---

## 1. Overview

This guide explains how to integrate your widget with the SLUGGER platform. Your widget will be embedded as an iframe within the SLUGGER shell application and will receive authentication tokens via the PostMessage API.

### What You'll Get

- **Access Token** - JWT for authenticating API requests
- **ID Token** - JWT containing user identity information
- **User Info** - Decoded user data (email, user ID, name, etc.)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SLUGGER Shell (Parent)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     Your Widget (iframe)                 ││
│  │                                                          ││
│  │  1. Widget loads                                         ││
│  │  2. Widget sends SLUGGER_WIDGET_READY                    ││
│  │  3. Shell sends SLUGGER_AUTH with tokens        ◄────────┼┼── PostMessage
│  │  4. Widget stores tokens                                 ││
│  │  5. Widget makes API calls with Bearer token             ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start

### Step 1: Add the SDK to Your Widget

Copy the SDK code below into your project, or install it as a module.

### Step 2: Initialize on App Load

```typescript
import { SluggerWidgetSDK } from './slugger-widget-sdk';

const sdk = new SluggerWidgetSDK({
  widgetId: 'your-widget-id',
  onAuthReady: (auth) => {
    console.log('User authenticated:', auth.user.email);
    // Now you can make API calls
  },
  onAuthError: (error) => {
    console.error('Auth failed:', error);
  }
});
```

### Step 3: Make Authenticated API Calls

```typescript
const response = await sdk.fetch('/api/widgets');
const data = await response.json();
```

---

## 3. PostMessage Protocol Specification

### 3.1 Message Types

#### Widget → Shell Messages

| Type | Description | When to Send |
|------|-------------|--------------|
| `SLUGGER_WIDGET_READY` | Widget is loaded and ready to receive tokens | On widget initialization |
| `SLUGGER_TOKEN_REFRESH` | Request fresh tokens | When tokens are expired or about to expire |

#### Shell → Widget Messages

| Type | Description | When Sent |
|------|-------------|-----------|
| `SLUGGER_AUTH` | Authentication tokens | After widget ready, or on token refresh |

### 3.2 Message Schemas

#### SLUGGER_WIDGET_READY (Widget → Shell)

```typescript
interface WidgetReadyMessage {
  type: 'SLUGGER_WIDGET_READY';
  widgetId: string;  // Your unique widget identifier
}

// Example
window.parent.postMessage({
  type: 'SLUGGER_WIDGET_READY',
  widgetId: 'my-analytics-widget'
}, '*');
```

#### SLUGGER_AUTH (Shell → Widget)

```typescript
interface SluggerAuthMessage {
  type: 'SLUGGER_AUTH';
  payload: {
    accessToken: string;   // JWT for API authentication
    idToken: string;       // JWT containing user info
    expiresAt: number;     // Unix timestamp (milliseconds)
    // User info included for convenience (no JWT decoding needed)
    user?: {
      id: string;          // Database user ID
      email: string;
      firstName: string;
      lastName: string;
      role: string;        // 'admin' | 'widget developer' | 'league' | 'master'
      teamId?: string;
      teamRole?: string;
      isAdmin?: boolean;
    };
  };
}

// Example payload
{
  type: 'SLUGGER_AUTH',
  payload: {
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    expiresAt: 1732924800000,
    user: {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'widget developer',
      teamId: 'team-456',
      isAdmin: false
    }
  }
}
```

#### SLUGGER_TOKEN_REFRESH (Widget → Shell)

```typescript
interface TokenRefreshMessage {
  type: 'SLUGGER_TOKEN_REFRESH';
}

// Example
window.parent.postMessage({
  type: 'SLUGGER_TOKEN_REFRESH'
}, '*');
```

### 3.3 ID Token Claims (User Info)

The `idToken` is a JWT containing user information. When decoded, it includes:

```typescript
interface IdTokenClaims {
  sub: string;           // Cognito user ID
  email: string;         // User's email address
  email_verified: boolean;
  given_name?: string;   // First name (if provided)
  family_name?: string;  // Last name (if provided)
  iat: number;           // Issued at (Unix timestamp)
  exp: number;           // Expiration (Unix timestamp)
  iss: string;           // Issuer (Cognito URL)
  aud: string;           // Audience (Client ID)
}
```

---

## 4. SDK Reference

### 4.1 Full SDK Code

Copy this into your project as `slugger-widget-sdk.ts`:

```typescript
/**
 * SLUGGER Widget SDK
 * 
 * Handles authentication token reception from the SLUGGER shell
 * and provides utilities for making authenticated API calls.
 */

export interface SluggerUser {
  id: string;          // Cognito sub or database user ID
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  /** User role: 'admin' | 'widget developer' | 'league' | 'master' */
  role?: string;
  /** Team ID if user belongs to a team */
  teamId?: string;
  /** Role within the team */
  teamRole?: string;
  /** Whether user has site admin privileges */
  isAdmin?: boolean;
}

export interface SluggerAuth {
  accessToken: string;
  idToken: string;
  expiresAt: number;
  user: SluggerUser;
}

export interface SluggerWidgetSDKOptions {
  /** Unique identifier for your widget */
  widgetId: string;
  
  /** Called when authentication is ready */
  onAuthReady?: (auth: SluggerAuth) => void;
  
  /** Called when authentication fails or is revoked */
  onAuthError?: (error: string) => void;
  
  /** Called when tokens are refreshed */
  onTokenRefresh?: (auth: SluggerAuth) => void;
  
  /** Allowed origins for the shell (defaults to SLUGGER domains) */
  allowedOrigins?: string[];
  
  /** Base URL for API calls (defaults to shell origin) */
  apiBaseUrl?: string;
}

export class SluggerWidgetSDK {
  private auth: SluggerAuth | null = null;
  private options: Required<SluggerWidgetSDKOptions>;
  private shellOrigin: string | null = null;
  private readyPromise: Promise<SluggerAuth>;
  private readyResolve!: (auth: SluggerAuth) => void;
  private readyReject!: (error: Error) => void;

  constructor(options: SluggerWidgetSDKOptions) {
    this.options = {
      allowedOrigins: [
        'http://localhost:3000',
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

    // Create a promise that resolves when auth is ready
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    this.init();
  }

  private init(): void {
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

  private handleMessage(event: MessageEvent): void {
    // Validate origin
    if (!this.options.allowedOrigins.includes(event.origin)) {
      return;
    }

    if (event.data?.type === 'SLUGGER_AUTH') {
      this.shellOrigin = event.origin;
      this.processAuth(event.data.payload);
    }
  }

  private processAuth(payload: {
    accessToken: string;
    idToken: string;
    expiresAt: number;
  }): void {
    try {
      const user = this.decodeIdToken(payload.idToken);
      
      this.auth = {
        accessToken: payload.accessToken,
        idToken: payload.idToken,
        expiresAt: payload.expiresAt,
        user
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

  private decodeIdToken(idToken: string): SluggerUser {
    try {
      const payload = idToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return {
        id: decoded.sub,
        email: decoded.email,
        emailVerified: decoded.email_verified ?? false,
        firstName: decoded.given_name,
        lastName: decoded.family_name
      };
    } catch {
      throw new Error('Failed to decode ID token');
    }
  }

  private scheduleTokenRefresh(): void {
    if (!this.auth) return;

    // Refresh 5 minutes before expiry
    const refreshTime = this.auth.expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      setTimeout(() => {
        this.requestTokenRefresh();
      }, refreshTime);
    }
  }

  private sendReady(): void {
    window.parent.postMessage({
      type: 'SLUGGER_WIDGET_READY',
      widgetId: this.options.widgetId
    }, '*');
  }

  /**
   * Request fresh tokens from the shell
   */
  public requestTokenRefresh(): void {
    window.parent.postMessage({
      type: 'SLUGGER_TOKEN_REFRESH'
    }, this.shellOrigin || '*');
  }

  /**
   * Wait for authentication to be ready
   */
  public async waitForAuth(): Promise<SluggerAuth> {
    return this.readyPromise;
  }

  /**
   * Check if authenticated
   */
  public isAuthenticated(): boolean {
    return this.auth !== null && Date.now() < this.auth.expiresAt;
  }

  /**
   * Get current auth state
   */
  public getAuth(): SluggerAuth | null {
    return this.auth;
  }

  /**
   * Get current user
   */
  public getUser(): SluggerUser | null {
    return this.auth?.user ?? null;
  }

  /**
   * Get access token for API calls
   */
  public getAccessToken(): string | null {
    if (!this.auth || Date.now() >= this.auth.expiresAt) {
      return null;
    }
    return this.auth.accessToken;
  }

  /**
   * Make an authenticated fetch request
   */
  public async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
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
  public destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }
}

// Default export for convenience
export default SluggerWidgetSDK;
```

### 4.2 SDK Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `waitForAuth()` | `Promise<SluggerAuth>` | Wait for authentication to complete |
| `isAuthenticated()` | `boolean` | Check if user is authenticated |
| `getAuth()` | `SluggerAuth \| null` | Get full auth object |
| `getUser()` | `SluggerUser \| null` | Get user info |
| `getAccessToken()` | `string \| null` | Get access token for API calls |
| `fetch(path, options)` | `Promise<Response>` | Make authenticated API request |
| `requestTokenRefresh()` | `void` | Request fresh tokens from shell |
| `destroy()` | `void` | Cleanup event listeners |

---

## 5. Usage Examples

### 5.1 React Integration

```tsx
// hooks/useSluggerAuth.ts
import { useEffect, useState } from 'react';
import { SluggerWidgetSDK, SluggerAuth } from './slugger-widget-sdk';

let sdkInstance: SluggerWidgetSDK | null = null;

export function useSluggerAuth(widgetId: string) {
  const [auth, setAuth] = useState<SluggerAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdkInstance) {
      sdkInstance = new SluggerWidgetSDK({
        widgetId,
        onAuthReady: (auth) => {
          setAuth(auth);
          setLoading(false);
        },
        onAuthError: (err) => {
          setError(err);
          setLoading(false);
        },
        onTokenRefresh: (auth) => {
          setAuth(auth);
        }
      });
    }

    return () => {
      // Don't destroy on unmount - keep singleton
    };
  }, [widgetId]);

  return { 
    auth, 
    loading, 
    error, 
    sdk: sdkInstance,
    user: auth?.user ?? null,
    isAuthenticated: auth !== null
  };
}

// Usage in component
function MyWidget() {
  const { user, loading, error, sdk } = useSluggerAuth('my-widget');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {user?.firstName || user?.email}</h1>
      <button onClick={() => fetchData(sdk)}>Load Data</button>
    </div>
  );
}

async function fetchData(sdk: SluggerWidgetSDK | null) {
  if (!sdk) return;
  
  const response = await sdk.fetch('/api/widgets');
  const data = await response.json();
  console.log(data);
}
```

### 5.2 Vue Integration

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SluggerWidgetSDK, SluggerAuth } from './slugger-widget-sdk';

const auth = ref<SluggerAuth | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

let sdk: SluggerWidgetSDK;

onMounted(() => {
  sdk = new SluggerWidgetSDK({
    widgetId: 'my-vue-widget',
    onAuthReady: (a) => {
      auth.value = a;
      loading.value = false;
    },
    onAuthError: (e) => {
      error.value = e;
      loading.value = false;
    }
  });
});

onUnmounted(() => {
  sdk?.destroy();
});

async function loadData() {
  const response = await sdk.fetch('/api/data');
  console.log(await response.json());
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <h1>Welcome, {{ auth?.user.email }}</h1>
    <button @click="loadData">Load Data</button>
  </div>
</template>
```

### 5.3 Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Widget</title>
</head>
<body>
  <div id="app">
    <div id="loading">Loading...</div>
    <div id="content" style="display: none;">
      <h1>Welcome, <span id="user-email"></span></h1>
      <button id="load-btn">Load Data</button>
      <pre id="data"></pre>
    </div>
  </div>

  <script type="module">
    import { SluggerWidgetSDK } from './slugger-widget-sdk.js';

    const sdk = new SluggerWidgetSDK({
      widgetId: 'vanilla-widget',
      onAuthReady: (auth) => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        document.getElementById('user-email').textContent = auth.user.email;
      },
      onAuthError: (error) => {
        document.getElementById('loading').textContent = 'Error: ' + error;
      }
    });

    document.getElementById('load-btn').addEventListener('click', async () => {
      const response = await sdk.fetch('/api/widgets');
      const data = await response.json();
      document.getElementById('data').textContent = JSON.stringify(data, null, 2);
    });
  </script>
</body>
</html>
```

---

## 6. API Reference

### 6.1 Available Endpoints

Your widget can call any SLUGGER API endpoint using the SDK's `fetch` method.

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/widgets` | GET | Yes | List all widgets |
| `/api/widgets/:id` | GET | Yes | Get widget details |
| `/api/teams` | GET | No | List all teams |
| `/api/users/me` | GET | Yes | Get current user |

### 6.2 Making API Calls

```typescript
// GET request
const widgets = await sdk.fetch('/api/widgets');

// POST request
const newWidget = await sdk.fetch('/api/widgets', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Widget' })
});

// With query parameters
const filtered = await sdk.fetch('/api/widgets?category=analytics');
```

---

## 7. Security Guidelines

### 7.1 Origin Validation

The SDK validates that messages come from allowed origins. The default allowed origins are:

- `http://localhost:3000` (development)
- `http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com` (staging)
- `https://alpb-analytics.com` (production)
- `https://www.alpb-analytics.com` (production)

### 7.2 Token Storage

- **DO NOT** store tokens in `localStorage` or `sessionStorage`
- The SDK stores tokens in memory only
- Tokens are automatically cleared on page refresh

### 7.3 Token Expiration

- Tokens expire after 1 hour
- The SDK automatically requests refresh 5 minutes before expiry
- Always check `isAuthenticated()` before making sensitive operations

---

## 8. Troubleshooting

### Widget Not Receiving Tokens

1. **Check console for errors** - Look for PostMessage errors
2. **Verify origin** - Ensure your widget's origin is in the allowed list
3. **Check iframe sandbox** - Widget must have `allow-scripts allow-same-origin`
4. **Timing issue** - Ensure you send `SLUGGER_WIDGET_READY` after setting up listener

### API Calls Failing with 401

1. **Token expired** - Call `requestTokenRefresh()`
2. **Wrong endpoint** - Ensure you're using the correct API base URL
3. **Missing Bearer prefix** - SDK handles this, but verify if using manual fetch

### CORS Errors

- Your widget can be hosted anywhere (Vercel, GitHub Pages, etc.)
- API calls require your widget's domain to be added to the backend CORS allowlist
- **For Phase 0A (token reception only):** No CORS configuration needed
- **For API calls (Phase 0B+):** Contact the platform team to add your widget domain

---

## 9. Testing

### 9.1 Local Development

For local testing, you can mock the shell's PostMessage:

```typescript
// test-harness.ts
function mockShellAuth() {
  window.postMessage({
    type: 'SLUGGER_AUTH',
    payload: {
      accessToken: 'mock-access-token',
      idToken: btoa(JSON.stringify({
        sub: 'test-user-123',
        email: 'test@example.com',
        email_verified: true,
        given_name: 'Test',
        family_name: 'User'
      })),
      expiresAt: Date.now() + 3600000,
      // Include user info for realistic testing
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'widget developer',
        teamId: 'team-123',
        isAdmin: false
      }
    }
  }, '*');
}

// Call after widget initializes
setTimeout(mockShellAuth, 100);
```

### 9.2 Integration Testing

1. Deploy your widget to a test URL
2. Contact platform team to add your origin to allowed list
3. Test in staging environment: `http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com`

---

## 10. Support

For questions or issues:

- **Platform Team Contact:** [Add contact info]
- **Documentation:** This guide
- **SDK Issues:** Report to platform team

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2025-11-30 | Added user info to SLUGGER_AUTH payload; updated SluggerUser interface with role/team fields; clarified CORS requirements for Phase 0A vs 0B |
| 1.0 | 2025-11-29 | Initial release |
