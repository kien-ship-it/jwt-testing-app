# SLUGGER JWT Testing Widget - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Choose Your Deployment Method

#### Option A: Deploy to Netlify (5 minutes) ⭐ Recommended

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag and drop this entire folder
4. Copy your deployment URL: `https://your-widget.netlify.app`

#### Option B: Test Locally (1 minute)

```bash
cd /Users/leduckien/personalproject/jwt_testing-app
./start-server.sh
# Opens on http://localhost:8080
```

---

### Step 2: Embed in SLUGGER Shell

Add to your SLUGGER shell application:

```tsx
// File: frontend/src/app/widget-test/page.tsx

'use client';

import { WidgetFrame } from '@/components/WidgetFrame';

export default function WidgetTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">JWT Testing Widget</h1>
      
      <WidgetFrame
        src="https://your-widget.netlify.app"  // ← Replace with your URL
        title="JWT Testing Widget"
        widgetId="jwt-testing-widget"
        className="w-full h-[800px]"
      />
    </div>
  );
}
```

---

### Step 3: Test the Integration

1. **Login to SLUGGER** shell application
2. **Navigate** to `/widget-test` (or your test page)
3. **Check** that widget receives authentication tokens
4. **Verify** user information displays correctly
5. **Test** API calls using the built-in tester

---

## ✅ What to Expect

### When Widget Loads:
- ✅ Status shows "Waiting for authentication..."
- ✅ Event log shows initialization messages
- ✅ Widget sends `SLUGGER_WIDGET_READY` to parent

### After Authentication:
- ✅ Status changes to "Authenticated" (green)
- ✅ User information section appears
- ✅ Token details section appears
- ✅ API testing section appears
- ✅ All user data populates automatically

### Features Available:
- 📋 Copy access/ID tokens to clipboard
- 🔄 Request token refresh
- 🧪 Test API endpoints with authentication
- 📝 Real-time event logging
- 🔍 Raw payload inspection

---

## 📚 Full Documentation

- **[README.md](README.md)** - Complete project overview
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide (3 methods)
- **[TESTING.md](TESTING.md)** - Comprehensive testing procedures
- **[.documentation/widget-developer-guide.md](.documentation/widget-developer-guide.md)** - SDK integration guide

---

## 🔧 Quick Commands

```bash
# Start local server
./start-server.sh

# Or manually:
python3 -m http.server 8080
# Open http://localhost:8080

# Deploy with Netlify CLI
netlify deploy --prod

# Check project structure
ls -la
```

---

## 🐛 Common Issues & Solutions

### "Authentication timeout"
- **Cause:** Widget not embedded in SLUGGER shell
- **Fix:** Ensure you're testing via `WidgetFrame` component, not standalone

### CORS errors on API calls
- **Cause:** Widget domain not in backend allowlist
- **Fix:** Contact platform team to add your Netlify URL

### Token not copying
- **Cause:** Not using HTTPS
- **Fix:** Use Netlify deployment (has auto-HTTPS)

---

## 📞 Need Help?

1. Check browser console for errors
2. Review event log in widget
3. See [TESTING.md](TESTING.md#troubleshooting)
4. Contact platform team

---

## 🎯 Testing Checklist

- [ ] Widget loads without errors
- [ ] Receives authentication tokens
- [ ] User information displays
- [ ] Tokens are valid JWTs
- [ ] Can copy tokens to clipboard
- [ ] API calls work with Bearer token
- [ ] Event log captures all events
- [ ] Token refresh works

---

**Ready to deploy? See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.**

**Need to test? See [TESTING.md](TESTING.md) for test cases and procedures.**
