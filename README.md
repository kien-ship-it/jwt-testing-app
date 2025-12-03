# SLUGGER JWT Testing Widget

A comprehensive testing application for validating JWT authentication token passing via PostMessage between the SLUGGER platform shell and embedded widgets.

![Widget Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Overview

This widget serves as a test harness for the SLUGGER platform's Phase 0A implementation of JWT-based authentication for embedded widgets. It demonstrates:

- ✅ PostMessage-based token reception
- ✅ User information display from JWT claims
- ✅ Token validation and expiration handling
- ✅ Authenticated API calls with Bearer tokens
- ✅ Real-time event logging
- ✅ Token refresh mechanism

---

## 🏗️ Architecture

The widget implements the SLUGGER Widget SDK specification (v1.1) and communicates with the SLUGGER shell application using the PostMessage API:

```
┌─────────────────────────────────────────────┐
│         SLUGGER Shell (Parent)              │
│  ┌───────────────────────────────────────┐  │
│  │   JWT Testing Widget (iframe)         │  │
│  │                                       │  │
│  │  1. Send SLUGGER_WIDGET_READY        │  │
│  │  2. Receive SLUGGER_AUTH       ◄──────┼──┤ PostMessage
│  │  3. Display tokens & user info        │  │
│  │  4. Make authenticated API calls      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🚀 Features

### Authentication Testing

- **PostMessage Reception:** Receives authentication tokens from SLUGGER shell
- **Token Validation:** Verifies JWT format and decodes user claims
- **Expiration Tracking:** Real-time countdown to token expiration
- **Token Refresh:** Request fresh tokens from shell

### User Information Display

- User ID, email, name
- Role and team information
- Admin status
- Email verification status

### Token Inspection

- Access token preview and full copy
- ID token preview and full copy
- Expiration timestamp with countdown
- Raw payload inspection

### API Testing

- Configurable endpoint testing
- Authenticated request with Bearer token
- Response display with status and headers
- Error handling and logging

### Event Logging

- Real-time event capture
- Categorized logging (info, success, warning, error)
- Timestamp tracking
- Clear log functionality

---

## 📁 Project Structure

```
jwt_testing-app/
├── index.html                  # Main HTML interface
├── styles.css                  # Premium dark mode design system
├── app.js                      # Main application logic
├── slugger-widget-sdk.js       # SLUGGER Widget SDK implementation
├── netlify.toml                # Netlify deployment configuration
├── DEPLOYMENT.md               # Comprehensive deployment guide
├── TESTING.md                  # Detailed testing procedures
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
└── .documentation/
    ├── technical_proposal.md   # Platform migration technical proposal
    └── widget-developer-guide.md  # Widget integration guide
```

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6 modules)
- **Styling:** Custom CSS with design system
- **Deployment:** Netlify (static hosting)
- **Protocol:** PostMessage API
- **Authentication:** AWS Cognito JWT tokens

---

## 📦 Installation & Setup

### Option 1: Deploy to Netlify (Recommended)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop this folder
3. Get your deployment URL
4. Embed in SLUGGER shell using `WidgetFrame` component

### Option 2: Local Development

```bash
# Clone or navigate to project
cd /Users/leduckien/personalproject/jwt_testing-app

# Start local server (choose one):
python3 -m http.server 8080
# or
npx http-server -p 8080

# Open in browser
open http://localhost:8080
```

---

## 🧪 Testing

See [TESTING.md](TESTING.md) for comprehensive testing procedures.

**Quick Test:**

1. **Standalone Test:**

   ```bash
   # Start local server
   python3 -m http.server 8080
   
   # Open browser to
   http://localhost:8080
   ```

2. **Embedded Test:**

   - Deploy to Netlify
   - Add to SLUGGER shell:

     ```tsx
     <WidgetFrame
       src="https://your-widget.netlify.app"
       title="JWT Testing Widget"
       widgetId="jwt-testing-widget"
     />
     ```

   - Login to SLUGGER and navigate to widget page

---

## 📚 Documentation

### Key Documents

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide for Netlify
- **[TESTING.md](TESTING.md)** - Comprehensive testing procedures
- **[.documentation/widget-developer-guide.md](.documentation/widget-developer-guide.md)** - Widget SDK integration guide
- **[.documentation/technical_proposal.md](.documentation/technical_proposal.md)** - Platform migration proposal

### API Reference

#### SluggerWidgetSDK

```javascript
import SluggerWidgetSDK from './slugger-widget-sdk.js';

const sdk = new SluggerWidgetSDK({
  widgetId: 'my-widget',
  onAuthReady: (auth) => {
    console.log('Authenticated:', auth.user.email);
  },
  onAuthError: (error) => {
    console.error('Auth failed:', error);
  }
});

// Make authenticated API call
const response = await sdk.fetch('/api/users/me');
const data = await response.json();
```

**Key Methods:**
- `waitForAuth()` - Wait for authentication
- `isAuthenticated()` - Check auth status
- `getUser()` - Get user information
- `getAccessToken()` - Get access token
- `fetch(path, options)` - Make authenticated API call
- `requestTokenRefresh()` - Request fresh tokens

---

## 🔒 Security

### Token Storage

- Tokens stored in **memory only** (not localStorage)
- Automatic cleanup on page refresh
- No token persistence across sessions

### Origin Validation

- Validates PostMessage origin against allowlist
- Rejects unauthorized messages
- Configurable allowed origins

### HTTPS Enforcement

- Netlify provides automatic HTTPS
- Required for clipboard API (token copying)

### Content Security Policy

- Configured in `netlify.toml`
- Allows iframe embedding from SLUGGER shell
- Restricts external scripts

---

## 🎨 Design Features

- **Dark Mode:** Premium dark theme with vibrant accents
- **Glassmorphism:** Modern translucent card designs
- **Micro-animations:** Smooth transitions and hover effects
- **Responsive Layout:** Adapts to mobile and desktop
- **Color-coded Status:** Visual feedback for auth states
- **Live Updates:** Real-time token expiration countdown

---

## 🔧 Configuration

### Allowed Origins

Edit `slugger-widget-sdk.js` to add allowed shell origins:

```javascript
allowedOrigins: [
    'http://localhost:3000',
    'http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com',
    'https://alpb-analytics.com',
    'https://www.alpb-analytics.com',
    // Add more as needed
]
```

### API Base URL

By default, the SDK uses the shell's origin for API calls. To override:

```javascript
const sdk = new SluggerWidgetSDK({
  widgetId: 'my-widget',
  apiBaseUrl: 'https://api.example.com'
});
```

---

## 📊 Use Cases

### Development

- Test JWT token format and structure
- Validate PostMessage integration
- Debug authentication flows
- Verify user claims

### Integration Testing

- End-to-end authentication testing
- API endpoint validation
- CORS configuration verification
- Performance benchmarking

### Production Monitoring

- Token expiration tracking
- Authentication success rate
- API response times
- Error logging and debugging

---

## 🐛 Troubleshooting

### Widget shows "Authentication timeout"
**Cause:** Not embedded in SLUGGER shell or PostMessage not received  
**Solution:** Ensure widget is embedded using `WidgetFrame` and user is logged into SLUGGER

### API calls fail with CORS error
**Cause:** Widget domain not in backend CORS allowlist  
**Solution:** Contact platform team to add your widget URL to CORS allowlist

### Tokens not displaying
**Cause:** PostMessage payload format incorrect  
**Solution:** Check Raw Payload section to see what was received; verify against SDK specification

See [TESTING.md](TESTING.md#troubleshooting) for more solutions.

---

## 🗺️ Roadmap

- [x] Phase 0A: PostMessage token reception
- [x] Token display and inspection
- [x] Event logging
- [x] API testing interface
- [x] Deployment to Netlify
- [x] Comprehensive documentation
- [ ] Phase 0B: Backend JWT validation testing
- [ ] Token refresh automation
- [ ] Performance metrics dashboard
- [ ] Integration with CI/CD pipeline

---

## 🤝 Contributing

This is a testing tool for the SLUGGER platform. For questions or improvements:

1. Review documentation in `.documentation/`
2. Follow the widget developer guide
3. Test changes locally before deploying
4. Contact the platform team for backend changes

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Support

- **Documentation:** See files in this repository
- **Platform Team:** Contact for CORS/backend changes
- **Issues:** Report via platform team contact

---

## 🏷️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-02 | Initial release with full Phase 0A support |

---

## 🔗 Related Resources

- [SLUGGER Platform](https://alpb-analytics.com)
- [Widget Developer Guide](.documentation/widget-developer-guide.md)
- [Technical Proposal](.documentation/technical_proposal.md)
- [JWT.io Debugger](https://jwt.io)
- [Netlify Documentation](https://docs.netlify.com)

---

**Built with ❤️ for the SLUGGER Platform**

*Last Updated: December 2, 2025*
