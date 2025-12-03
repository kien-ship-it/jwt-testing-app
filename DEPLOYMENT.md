# SLUGGER JWT Testing Widget - Deployment Guide

## Overview

This guide provides instructions for manually deploying the JWT Testing Widget to Netlify. The widget tests the SLUGGER platform's JWT authentication via PostMessage as described in the technical proposal.

---

## Prerequisites

Before deploying, ensure you have:

1. **Netlify Account** - Sign up at [netlify.com](https://netlify.com) (free tier is sufficient)
2. **Git Repository** (Optional but recommended) - GitHub, GitLab, or Bitbucket account
3. **Files Ready** - All widget files in this directory

---

## Deployment Methods

### Method 1: Netlify Drop (Easiest - No Git Required)

This is the fastest way to deploy for testing purposes.

#### Steps:

1. **Prepare Files**
   ```bash
   # Ensure you're in the project directory
   cd /Users/leduckien/personalproject/jwt_testing-app
   ```

2. **Create Deployment Package**
   - You need to upload these files to Netlify:
     - `index.html`
     - `styles.css`
     - `app.js`
     - `slugger-widget-sdk.js`
     - `netlify.toml`

3. **Deploy via Netlify UI**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click **"Add new site"** → **"Deploy manually"**
   - Drag and drop the entire `jwt_testing-app` folder
   - Netlify will automatically deploy your site

4. **Get Deployment URL**
   - After deployment, Netlify will provide a URL like: `https://random-name-12345.netlify.app`
   - You can customize this in **Site settings** → **Domain management**

#### Updating the Deployment:

To update the site:
- Just drag and drop the folder again to the same site in Netlify
- Or use the **"Deploys"** tab → **"Drag and drop"** option

---

### Method 2: Git-Based Deployment (Recommended for Production)

This method enables automatic deployments when you push changes.

#### Steps:

1. **Initialize Git Repository** (if not already done)
   ```bash
   cd /Users/leduckien/personalproject/jwt_testing-app
   git init
   git add .
   git commit -m "Initial commit: JWT testing widget"
   ```

2. **Create GitHub Repository**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it: `jwt-testing-widget` (or your preferred name)
   - Don't initialize with README (we already have files)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/jwt-testing-widget.git
   git branch -M main
   git push -u origin main
   ```

4. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **GitHub** and authorize Netlify
   - Select your `jwt-testing-widget` repository
   - Build settings (should be auto-detected from `netlify.toml`):
     - **Build command:** (leave empty or use `echo 'No build required'`)
     - **Publish directory:** `.` (current directory)
   - Click **"Deploy site"**

5. **Automatic Deployments**
   - Now every push to `main` branch will trigger automatic deployment
   - You can see deployment status in Netlify dashboard

#### Updating the Deployment:

```bash
# Make your changes, then:
git add .
git commit -m "Description of changes"
git push
# Netlify will automatically deploy
```

---

### Method 3: Netlify CLI (For Advanced Users)

#### Installation:

```bash
npm install -g netlify-cli
```

#### Login to Netlify:

```bash
netlify login
```

#### Deploy:

```bash
cd /Users/leduckien/personalproject/jwt_testing-app

# For testing (creates a draft deployment)
netlify deploy

# For production
netlify deploy --prod
```

#### Initialize Site (First Time):

```bash
netlify init
# Follow the prompts to create a new site or link to existing one
```

---

## Post-Deployment Configuration

### 0. Update Widget URL in SLUGGER Shell

After deployment, you'll receive a URL like:
```
https://your-widget-name.netlify.app
```

This URL needs to be embedded in the SLUGGER shell application using the `WidgetFrame` component:

```tsx
import { WidgetFrame } from '@/components/WidgetFrame';

function WidgetTestPage() {
  return (
    <WidgetFrame
      src="https://your-widget-name.netlify.app"
      title="JWT Testing Widget"
      widgetId="jwt-testing-widget"
    />
  );
}
```

### 2. Add Your Domain to CORS Allowlist (If Making API Calls)

If your widget needs to make API calls to the SLUGGER backend:

Contact the SLUGGER platform team to add your Netlify domain to the CORS allowlist:
```
https://your-widget-name.netlify.app
```

This is required for **Phase 0B** (API validation). For **Phase 0A** (token reception only), this is not needed.

### 3. Custom Domain (Optional)

To use a custom domain instead of `*.netlify.app`:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS
4. Netlify provides free HTTPS certificates automatically

---

## Deployment Verification Checklist

After deployment, verify the following:

- [ ] Widget loads without errors (check browser console)
- [ ] Widget sends `SLUGGER_WIDGET_READY` message on load
- [ ] Widget can receive `SLUGGER_AUTH` message (test by embedding in SLUGGER shell)
- [ ] All UI sections display correctly
- [ ] Event log captures all PostMessage events
- [ ] Token copy functionality works
- [ ] API test endpoint field is editable
- [ ] Refresh tokens button is functional

---

## Troubleshooting

### Issue: Widget not loading in iframe

**Solution:**
- Check that `netlify.toml` is deployed (contains `X-Frame-Options` header)
- Verify Content Security Policy allows iframe embedding
- Check browser console for CSP errors

### Issue: CORS errors when making API calls

**Solution:**
- Ensure your widget domain is added to backend CORS allowlist
- Check that `Authorization` header is being sent correctly
- Verify API endpoint URL is correct

### Issue: Widget not receiving tokens

**Solution:**
- Check that widget origin is in the `allowedOrigins` array in `slugger-widget-sdk.js`
- Verify the SLUGGER shell is sending PostMessage correctly
- Check browser console for origin validation errors
- Ensure iframe has correct `sandbox` attributes

### Issue: Deployment fails

**Solution:**
- Verify all files are present in the directory
- Check `netlify.toml` syntax is valid
- Review Netlify deploy logs for specific errors
- Ensure you have proper permissions on the repository (if using Git)

---

## Monitoring and Logs

### Netlify Dashboard

Access deployment information:
1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site
3. View:
   - **Deploys:** Deployment history and logs
   - **Functions:** (Not used in this widget)
   - **Analytics:** Traffic statistics (paid feature)
   - **Logs:** Real-time function logs

### Browser Console

For debugging the widget itself:
1. Open the widget URL directly
2. Open browser DevTools (F12)
3. Check:
   - **Console:** For JavaScript errors and event logs
   - **Network:** For API calls and responses
   - **Application:** For PostMessage events

---

## Updating Allowed Origins

If you need to update the allowed shell origins (e.g., adding a new environment):

Edit `slugger-widget-sdk.js`:

```javascript
allowedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com',
    'https://alpb-analytics.com',
    'https://www.alpb-analytics.com',
    'https://your-new-origin.com'  // Add new origin
],
```

Then redeploy using your chosen method above.

---

## Environment-Specific Deployments

### Multiple Environments

You can create separate Netlify sites for different environments:

1. **Development:** `https://jwt-testing-dev.netlify.app`
2. **Staging:** `https://jwt-testing-staging.netlify.app`
3. **Production:** `https://jwt-testing.netlify.app`

#### Using Git Branches:

```bash
# Development
git checkout -b develop
git push origin develop
# Configure Netlify to deploy 'develop' branch to dev site

# Staging
git checkout -b staging
git push origin staging
# Configure Netlify to deploy 'staging' branch to staging site

# Production
git checkout main
git push origin main
# Configure Netlify to deploy 'main' branch to production site
```

---

## Security Best Practices

1. **Origin Validation**
   - Keep `allowedOrigins` list strict and up-to-date
   - Never use `*` wildcard for production

2. **Token Storage**
   - Tokens are stored in memory only (SDK design)
   - Never log full tokens to console in production

3. **HTTPS**
   - Netlify provides automatic HTTPS
   - Always use HTTPS URLs in production

4. **Content Security Policy**
   - Review and adjust CSP headers in `netlify.toml` as needed
   - Test thoroughly after CSP changes

---

## Cost Estimation

### Netlify Free Tier Includes:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ 300 build minutes/month

**For this widget:** Free tier is more than sufficient, as it's a static site with minimal bandwidth requirements.

---

## Support and Resources

- **Netlify Documentation:** [docs.netlify.com](https://docs.netlify.com)
- **Netlify Community:** [answers.netlify.com](https://answers.netlify.com)
- **SLUGGER Widget Guide:** See `.documentation/widget-developer-guide.md`
- **Technical Proposal:** See `.documentation/technical_proposal.md`

---

## Quick Reference Commands

```bash
# Deploy with Netlify CLI (draft)
netlify deploy

# Deploy to production
netlify deploy --prod

# Open deployed site
netlify open:site

# View deployment logs
netlify logs

# Link local project to existing site
netlify link

# Get site info
netlify status
```

---

## Next Steps

After successful deployment:

1. ✅ Test widget standalone (open URL directly)
2. ✅ Embed widget in SLUGGER shell using `WidgetFrame` component
3. ✅ Test full authentication flow
4. ✅ Verify token reception and display
5. ✅ Test API calls (Phase 0B)
6. ✅ Monitor event logs for issues
7. ✅ Share deployment URL with team for testing

---

**Last Updated:** December 2, 2025  
**Version:** 1.0  
**Contact:** Platform Team
