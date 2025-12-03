# SLUGGER JWT Testing Widget - Testing Guide

## Overview

This guide provides comprehensive instructions for testing the JWT Testing Widget's integration with the SLUGGER platform. It covers standalone testing, embedded testing, and API validation.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Standalone Testing](#standalone-testing)
3. [Embedded Testing in SLUGGER Shell](#embedded-testing-in-slugger-shell)
4. [Mock Testing (Development)](#mock-testing-development)
5. [API Testing](#api-testing)
6. [Troubleshooting](#troubleshooting)
7. [Test Cases](#test-cases)

---

## Prerequisites

### Required Access
- ✅ Deployed widget URL (from Netlify or local server)
- ✅ Access to SLUGGER shell application
- ✅ Valid SLUGGER user account for authentication
- ✅ Browser with DevTools (Chrome, Firefox, or Safari)

### Optional Tools
- ✅ Postman or curl for API endpoint testing
- ✅ JWT debugger ([jwt.io](https://jwt.io))
- ✅ Local web server (Python's SimpleHTTPServer or Node's http-server)

---

## Standalone Testing

### Purpose
Test the widget UI and basic functionality without PostMessage integration.

### Steps

#### 1. Run Local Server (Optional - for local testing)

```bash
# Navigate to project directory
cd /Users/leduckien/personalproject/jwt_testing-app

# Option 1: Python 3
python3 -m http.server 8080

# Option 2: Python 2
python -m SimpleHTTPServer 8080

# Option 3: Node.js (install first: npm install -g http-server)
npx http-server -p 8080

# Option 4: PHP
php -S localhost:8080
```

#### 2. Access Widget

Open browser and navigate to:
- **Local:** `http://localhost:8080`
- **Deployed:** `https://your-widget-name.netlify.app`

#### 3. Verify UI Elements

Check that all sections are visible:
- ✅ Header with title "SLUGGER JWT Testing Widget"
- ✅ Status card showing "Waiting for authentication..."
- ✅ Authentication Status section
- ✅ Event Log section (at bottom)
- ✅ Raw Authentication Payload section

Hidden sections (will appear after authentication):
- ⏸️ User Information section
- ⏸️ Token Details section
- ⏸️ API Testing section

#### 4. Check Browser Console

Open DevTools (F12) and verify:
- ✅ No JavaScript errors
- ✅ Event log shows: "Widget loaded successfully"
- ✅ Event log shows: "Initializing JWT Testing Widget..."
- ✅ PostMessage sent: `SLUGGER_WIDGET_READY`

**Expected Console Output:**
```
Initializing JWT Testing Widget...
Sending WIDGET_READY message to parent
Waiting for SLUGGER_AUTH message...
```

#### 5. Check Network Tab

- ✅ All static assets loaded (HTML, CSS, JS)
- ✅ No 404 errors
- ✅ CORS headers present (if deployed to Netlify)

#### 6. Expected Behavior (Standalone)

Since the widget is not embedded:
- Status remains: "Waiting for authentication..."
- After 10 seconds, timeout message appears: "Authentication timeout - no tokens received from shell"
- This is **expected behavior** when testing standalone

---

## Embedded Testing in SLUGGER Shell

### Purpose
Test the full PostMessage authentication flow with the SLUGGER shell application.

### Prerequisites
- SLUGGER shell application running (locally or deployed)
- User must be logged into SLUGGER

### Integration Steps

#### 1. Add Widget to SLUGGER Shell

Edit the SLUGGER shell application to embed the widget:

**File:** `frontend/src/app/widget-test/page.tsx` (or create new page)

```tsx
'use client';

import { WidgetFrame } from '@/components/WidgetFrame';

export default function WidgetTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">JWT Widget Test</h1>
      
      <div className="mb-4 p-4 bg-blue-100 border border-blue-400 rounded">
        <p className="text-sm">
          <strong>Test Environment:</strong> This page embeds the JWT testing widget 
          to verify PostMessage authentication.
        </p>
      </div>

      <WidgetFrame
        src="https://your-widget-name.netlify.app"
        title="JWT Testing Widget"
        widgetId="jwt-testing-widget"
        className="w-full h-[800px] border border-gray-300 rounded-lg"
      />
    </div>
  );
}
```

#### 2. Access Test Page

1. Login to SLUGGER shell
2. Navigate to `/widget-test` (or your test page route)
3. Widget should load in iframe

#### 3. Verify Authentication Flow

**Expected Event Sequence (check widget's Event Log):**

```
[Time] INFO Widget loaded successfully
[Time] INFO Initializing JWT Testing Widget...
[Time] SUCCESS Authentication successful!
[Time] INFO User: user@example.com (user-id-123)
```

**Expected UI Changes:**

- ✅ Status changes to: "Authenticated" (green)
- ✅ User Information section appears
- ✅ Token Details section appears
- ✅ API Testing section appears
- ✅ All user fields populated (email, name, role, etc.)
- ✅ Token expiry time displayed
- ✅ Shell origin shows SLUGGER domain

#### 4. Verify User Information

Check User Information section displays:
- ✅ **User ID:** Cognito sub or database ID
- ✅ **Email:** User's email address
- ✅ **Name:** First name + Last name
- ✅ **Role:** User's role (e.g., "widget developer")
- ✅ **Team ID:** User's team ID (if applicable)
- ✅ **Team Role:** Role within team (if applicable)
- ✅ **Admin:** ✅ Yes or ❌ No
- ✅ **Email Verified:** ✅ Yes or ❌ No

#### 5. Verify Token Details

Check Token Details section shows:
- ✅ **Access Token:** First 50 characters + "..."
- ✅ **ID Token:** First 50 characters + "..."
- ✅ **Token Expiration:** Date/time and minutes remaining
- ✅ Copy buttons work (click to copy full token)

#### 6. Verify Raw Payload

Raw payload should display JSON with:
```json
{
  "type": "SLUGGER_AUTH",
  "payload": {
    "accessToken": "eyJhbG...",
    "idToken": "eyJhbG...",
    "expiresAt": 1701234567890,
    "expiresAtDate": "2025-12-02T12:00:00.000Z",
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "widget developer",
      ...
    }
  }
}
```

#### 7. Browser Console Verification

Open browser DevTools and check for:

**In Widget Console (iframe context):**
```
Authentication successful
User: user@example.com (user-id-123)
```

**In Shell Console (parent context):**
```
WidgetFrame: Sending auth tokens to widget
Widget ready: jwt-testing-widget
```

---

## Mock Testing (Development)

### Purpose
Test widget locally without SLUGGER shell integration.

### Setup

Create a mock HTML file to simulate SLUGGER shell:

**File:** `mock-shell.html` (create in project root)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock SLUGGER Shell</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        iframe {
            width: 100%;
            height: 800px;
            border: 2px solid #333;
            border-radius: 8px;
        }
        button {
            padding: 10px 20px;
            margin: 5px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="controls">
        <h2>Mock SLUGGER Shell - Testing Controls</h2>
        <button onclick="sendMockAuth()">Send Mock Authentication</button>
        <button onclick="sendTokenRefresh()">Simulate Token Refresh</button>
        <button onclick="revokeAuth()">Revoke Authentication</button>
    </div>

    <iframe id="widget" src="http://localhost:8080/index.html"></iframe>

    <script>
        const iframe = document.getElementById('widget');
        let widgetReady = false;

        // Listen for widget ready message
        window.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
            
            if (event.data.type === 'SLUGGER_WIDGET_READY') {
                widgetReady = true;
                console.log('Widget is ready!');
                // Automatically send auth after widget is ready
                setTimeout(sendMockAuth, 500);
            }
            
            if (event.data.type === 'SLUGGER_TOKEN_REFRESH') {
                console.log('Widget requested token refresh');
                sendMockAuth();
            }
        });

        function sendMockAuth() {
            if (!widgetReady) {
                alert('Widget not ready yet!');
                return;
            }

            const mockPayload = {
                type: 'SLUGGER_AUTH',
                payload: {
                    accessToken: 'mock-access-token-' + Date.now(),
                    idToken: btoa(JSON.stringify({
                        sub: 'mock-user-123',
                        email: 'test@example.com',
                        email_verified: true,
                        given_name: 'Test',
                        family_name: 'User',
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + 3600
                    })),
                    expiresAt: Date.now() + 3600000, // 1 hour
                    user: {
                        id: 'mock-user-123',
                        email: 'test@example.com',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'widget developer',
                        teamId: 'team-456',
                        teamRole: 'developer',
                        isAdmin: false
                    }
                }
            };

            iframe.contentWindow.postMessage(mockPayload, '*');
            console.log('Sent mock authentication:', mockPayload);
        }

        function sendTokenRefresh() {
            sendMockAuth();
        }

        function revokeAuth() {
            alert('In real implementation, this would clear auth state');
        }
    </script>
</body>
</html>
```

### Testing with Mock Shell

1. **Start Local Server:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open Mock Shell:**
   ```
   http://localhost:8080/mock-shell.html
   ```

3. **Test Authentication:**
   - Widget loads in iframe
   - After ~500ms, mock authentication is sent automatically
   - Verify all UI sections populate with mock data

4. **Test Manual Controls:**
   - Click "Send Mock Authentication" - should update auth
   - Click "Simulate Token Refresh" - should refresh tokens
   - Check event log for all events

---

## API Testing

### Purpose
Verify that the widget can make authenticated API calls to SLUGGER backend.

### Prerequisites
- Widget must be authenticated (embedded in SLUGGER shell)
- CORS must be configured (Phase 0B requirement)

### Test Procedure

#### 1. Test Default Endpoint

In the widget's API Testing section:
- Default endpoint is `/api/users/me`
- Click **"Test API Call"** button

**Expected Success Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "success": true,
    "data": {
      "user": {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        ...
      }
    }
  }
}
```

**Event Log Should Show:**
```
[Time] INFO Testing API call: /api/users/me
[Time] SUCCESS API call successful: 200
```

#### 2. Test Other Endpoints

Try different endpoints:

| Endpoint | Expected Result | Auth Required |
|----------|----------------|---------------|
| `/api/users/me` | User profile | ✅ Yes |
| `/api/widgets` | List of widgets | ✅ Yes |
| `/api/teams` | List of teams | ❌ No (public) |

#### 3. Test Error Handling

**Test Unauthorized Endpoint:**
```
/api/admin/users
```

**Expected Response (if not admin):**
```json
{
  "status": 403,
  "statusText": "Forbidden",
  "body": {
    "success": false,
    "message": "Insufficient permissions"
  }
}
```

**Test Invalid Endpoint:**
```
/api/invalid-endpoint
```

**Expected Response:**
```json
{
  "status": 404,
  "statusText": "Not Found"
}
```

#### 4. Verify Request Headers

Use browser DevTools Network tab to verify:
- ✅ `Authorization: Bearer <access-token>` header present
- ✅ `Content-Type: application/json` header present
- ✅ Token matches the one displayed in Token Details section

---

## Test Cases

### Test Case 1: Widget Initialization
**Objective:** Verify widget loads and initializes correctly

**Steps:**
1. Open widget URL
2. Check console for errors
3. Verify UI renders correctly

**Expected Result:**
- ✅ No console errors
- ✅ Status shows "Waiting for authentication..."
- ✅ Event log shows initialization messages

---

### Test Case 2: PostMessage Reception
**Objective:** Verify widget receives authentication tokens

**Steps:**
1. Embed widget in SLUGGER shell
2. Login to SLUGGER
3. Navigate to widget page

**Expected Result:**
- ✅ Widget receives `SLUGGER_AUTH` message
- ✅ Status changes to "Authenticated"
- ✅ User info populates
- ✅ Tokens display

---

### Test Case 3: Token Validation
**Objective:** Verify received tokens are valid JWTs

**Steps:**
1. Copy access token using copy button
2. Go to [jwt.io](https://jwt.io)
3. Paste token into debugger

**Expected Result:**
- ✅ Token decodes successfully
- ✅ Contains valid claims (sub, email, exp, etc.)
- ✅ Expiration time matches UI display
- ✅ Issuer is Cognito User Pool

---

### Test Case 4: Token Refresh
**Objective:** Verify token refresh mechanism works

**Steps:**
1. Authenticate widget
2. Note current token expiry
3. Click "Refresh Tokens" button
4. Compare new tokens with old ones

**Expected Result:**
- ✅ New tokens received
- ✅ Expiry time updates
- ✅ Event log shows refresh event
- ✅ Token values change (different JWTs)

---

### Test Case 5: API Call Authentication
**Objective:** Verify API calls use correct Bearer token

**Steps:**
1. Authenticate widget
2. Enter `/api/users/me` in API endpoint field
3. Click "Test API Call"
4. Check Network tab in DevTools

**Expected Result:**
- ✅ Request includes `Authorization: Bearer <token>` header
- ✅ Response is 200 OK
- ✅ Response contains user data
- ✅ Event log shows success

---

### Test Case 6: Token Expiration Handling
**Objective:** Verify widget handles expired tokens

**Steps:**
1. Authenticate widget
2. Wait for token to expire (or manually set short expiry in mock)
3. Try to make API call with expired token

**Expected Result:**
- ✅ API call fails with 401
- ✅ Error is logged to event log
- ✅ Widget prompts for token refresh

---

### Test Case 7: Origin Validation
**Objective:** Verify widget only accepts messages from allowed origins

**Steps:**
1. Open widget in standalone mode
2. Open browser console
3. Try to send PostMessage from console:
   ```javascript
   window.postMessage({
     type: 'SLUGGER_AUTH',
     payload: { accessToken: 'fake', idToken: 'fake', expiresAt: Date.now() }
   }, '*');
   ```

**Expected Result:**
- ✅ Message is rejected (origin validation fails)
- ✅ Widget remains in "Waiting for authentication" state
- ✅ Console shows warning about unauthorized origin

---

### Test Case 8: CORS Configuration
**Objective:** Verify CORS headers allow API calls

**Steps:**
1. Deploy widget to Netlify
2. Check response headers using DevTools

**Expected Result:**
- ✅ `Access-Control-Allow-Origin` header present
- ✅ `X-Frame-Options: ALLOW-FROM *` or similar
- ✅ Widget can be embedded in iframe

---

## Troubleshooting

### Problem: Widget shows "Authentication timeout"

**Possible Causes:**
- Widget not embedded in SLUGGER shell
- SLUGGER shell not sending PostMessage
- Origin mismatch

**Solutions:**
1. Verify widget is embedded using `WidgetFrame` component
2. Check browser console for PostMessage errors
3. Verify shell origin is in `allowedOrigins` list
4. Check that user is logged into SLUGGER

---

### Problem: Tokens not displaying

**Possible Causes:**
- PostMessage payload format incorrect
- JavaScript error in token processing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify PostMessage payload matches expected format
3. Check Raw Payload section to see what was received
4. Verify SDK is decoding tokens correctly

---

### Problem: API calls fail with CORS error

**Possible Causes:**
- Widget origin not in backend CORS allowlist
- Backend not configured for JWT validation

**Solutions:**
1. Contact platform team to add widget domain to CORS allowlist
2. Verify `Authorization` header is being sent
3. Check that backend has JWT validation middleware (Phase 0B)
4. Test API endpoint directly with Postman first

---

### Problem: "Copy Token" button doesn't work

**Possible Causes:**
- Browser clipboard API not available (requires HTTPS)
- Permissions not granted

**Solutions:**
1. Ensure widget is served over HTTPS (Netlify does this automatically)
2. Grant clipboard permissions if browser prompts
3. Try different browser

---

### Problem: Event log not showing events

**Possible Causes:**
- JavaScript error preventing log rendering

**Solutions:**
1. Check browser console for errors
2. Refresh the page
3. Try "Clear Log" button and trigger new events

---

## Performance Testing

### Metrics to Monitor

1. **Initial Load Time**
   - Target: < 2 seconds
   - Measure: DevTools Network tab

2. **Authentication Latency**
   - Target: < 500ms from READY to AUTH
   - Measure: Event log timestamps

3. **API Call Latency**
   - Target: < 1 second
   - Measure: Network tab timing

4. **Memory Usage**
   - Target: < 50MB
   - Measure: DevTools Performance tab

---

## Security Testing

### Checklist

- ✅ Tokens stored in memory only (not localStorage)
- ✅ Origin validation prevents unauthorized messages
- ✅ HTTPS enforced (if deployed)
- ✅ No tokens logged to console in production
- ✅ CSP headers configured
- ✅ XSS protections in place

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Share widget URL with platform team
3. ✅ Request addition to CORS allowlist (if needed)
4. ✅ Integrate into SLUGGER shell routing
5. ✅ Monitor production usage
6. ✅ Gather user feedback

---

**Last Updated:** December 2, 2025  
**Version:** 1.0  
**Contact:** Platform Team
