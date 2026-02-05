# Fixing Announcements - 401 Error

## Problem

You're getting `401 Unauthorized` when trying to send announcements. This is because **announcements require Alexa app cookies**, not just amazon.com cookies.

## Solution

### Option 1: Get Alexa App Cookies (Recommended)

The announcements API (`alexa-comms-mobile-service.amazon.com`) requires cookies from the **Alexa mobile app**, not from amazon.com.

**📱 Detailed Tutorials:**

- **iPhone Users**: See **[IPHONE-COOKIE-TUTORIAL.md](./IPHONE-COOKIE-TUTORIAL.md)** for step-by-step instructions
- **Android Users**: Use HTTP Toolkit or Burp Suite (similar process)

**Quick Steps:**

1. **Install Alexa App** on your phone (iOS or Android)
2. **Set up proxy** (Proxyman/Charles/HTTP Toolkit on your Mac)
3. **Configure iPhone** to use proxy (Settings → Wi-Fi → HTTP Proxy)
4. **Install SSL certificate** on iPhone (required for HTTPS interception)
5. **Open Alexa app** and use it (send announcement, browse, etc.)
6. **Find cookies** in proxy tool:
   - Look for requests to `alexa-comms-mobile-service.amazon.com`
   - Check **Headers** → **Cookie** header
   - Extract `ubid-main` and `at-main` **values**

7. **Update `.dev.vars`:**
   ```bash
   UBID_MAIN=<value from Alexa app>
   AT_MAIN=<value from Alexa app>
   ```

8. **Restart server** and try again

### Option 2: Use Alternative Endpoints

If you can't get Alexa app cookies, you can still use other features:
- ✅ Device status (`/api/status`)
- ✅ Sensor data (`/api/bedroom`, `/api/sensors`)
- ✅ Music status (`/api/music`)
- ✅ Light control (`/api/lights`) - if you have smart lights
- ✅ Volume control (`/api/volume`)
- ✅ DND control (`/api/dnd`)

Only announcements require Alexa app cookies.

### Option 3: Test Other Features First

Before fixing announcements, test that everything else works:

```bash
# These should all work with amazon.com cookies
curl http://localhost:8787/api/status
curl http://localhost:8787/api/bedroom
curl http://localhost:8787/api/music
curl http://localhost:8787/api/volume
```

## Why This Happens

According to the SETUP.md:
- **Amazon.com cookies**: Work for most features ✅
- **Alexa app cookies**: Required for announcements ❌

The announcements API is part of Alexa's mobile communication service, which requires mobile app authentication.

## Quick Test

Once you have Alexa app cookies:

```bash
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "message": "Hello from MCP server"}'
```

You should see your Echo Dot light up and speak the message!
