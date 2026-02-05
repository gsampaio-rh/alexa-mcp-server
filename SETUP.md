# Setup Guide

Complete setup instructions for the Alexa MCP Server.

## Prerequisites

- **Node.js 18+** or Bun
- **Amazon account** with Alexa devices
- **Access to Amazon.com** or Alexa mobile app (for cookies)

## Quick Setup (2 minutes)

### Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 2: Get Amazon Cookies

You need 2 cookie values from Amazon to authenticate with Alexa APIs.

#### Method 1: Browser DevTools (Easiest)

1. **Login to amazon.com** in your browser
2. **Open DevTools** (F12 or right-click → Inspect)
3. **Go to Network tab**
4. **Refresh the page** or make any request
5. **Click on any request** → Headers → Request Headers
6. **Find the Cookie header** and copy these values:
   - `ubid-main=133-678-78910` → Copy only the **value** (`133-678-78910`)
   - `at-main=Atza|IwEBIA-fRecN...` → Copy only the **value** (the long token)

**Important**: Copy only the **values**, not the cookie names or the entire cookie string.

#### Method 2: Application Tab

1. **Open DevTools** (F12)
2. **Go to Application tab** → Cookies → `https://www.amazon.com`
3. **Find cookies** starting with `ubid-` and `at-`
4. **Copy the values** (not the names)

### Step 3: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your cookie values
UBID_MAIN="your-ubid-value"
AT_MAIN="your-at-token-value"
```

**Example `.env`:**
```bash
UBID_MAIN="134-9925906-3171060"
AT_MAIN="Atza|IwEBIA-fRecN..."
```

### Step 4: Start the Server

```bash
npm run dev
# or
pnpm dev
```

The server will start at `http://localhost:8787`

## Testing Your Setup

### 1. Health Check

```bash
curl http://localhost:8787/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T18:30:00.000Z"
}
```

### 2. Connection Status

```bash
curl http://localhost:8787/api/status
```

This will show:
- Connection status
- Your account information
- List of all Alexa devices
- Number of smart home endpoints

### 3. Test Announcement

```bash
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kitchen",
    "message": "Hello from MCP server!"
  }'
```

**Note**: Announcements require Alexa mobile app cookies (see below).

## Cookie Requirements

Different features require different types of cookies:

| Feature | Amazon.com Cookies | Alexa App Cookies |
|---------|-------------------|-------------------|
| Account Info | ✅ | ✅ |
| Device Control | ✅ | ✅ |
| Smart Home | ✅ | ✅ |
| Music Status | ✅ | ✅ |
| Music Control | ✅ | ✅ |
| **Announcements** | ❌ | ✅ |

### For Announcements

Announcements require cookies from the **Alexa mobile app**, not Amazon.com. You'll need to:

1. Install a proxy tool (HTTP Toolkit, Proxyman, or Charles Proxy)
2. Configure your phone to use the proxy
3. Install SSL certificate on your phone
4. Use the Alexa app and intercept traffic
5. Extract cookies from requests to `alexa-comms-mobile-service.amazon.com`

This is more complex but only needed if you want to use announcements.

## Regional Cookies

The server supports regional Amazon cookies:

| Region | Cookie Names | Example |
|--------|-------------|---------|
| US (Main) | `ubid-main`, `at-main` | Default |
| Brazil | `ubid-acbbr`, `at-acbbr` | `-acbbr` |
| UK | `ubid-acbuk`, `at-acbuk` | `-acbuk` |
| Germany | `ubid-acbde`, `at-acbde` | `-acbde` |
| And others... | | |

**Important**: The server automatically uses `ubid-main` and `at-main` as cookie names for the Alexa API, regardless of where you got the cookie values from. You just need to provide the **values** in `UBID_MAIN` and `AT_MAIN`.

If you're using regional cookies, you may optionally set:
```bash
COOKIE_SUFFIX="-acbbr"  # Brazil example
```

## Deployment

Deploy the server to your preferred hosting platform. The server is a standard Node.js application compatible with any platform supporting Node.js 18+.

### Environment Variables

Set the following environment variables in your hosting platform:

- `UBID_MAIN` - Your Amazon ubid-main cookie value
- `AT_MAIN` - Your Amazon at-main authentication token
- `COOKIE_SUFFIX` - Optional regional cookie suffix (e.g., `-acbbr` for Brazil)
- `API_BASE` - Optional base URL for the deployed server

### Configure MCP Client

Use your deployed server URL in your MCP client configuration:

**For SSE endpoint:**
```
https://your-server-url.com/sse
```

**For HTTP endpoint:**
```
https://your-server-url.com/mcp
```

## Authentication Details

The server automatically handles authentication:

- **Detects cookie type**: Amazon.com vs Alexa app cookies
- **Builds proper headers**: Includes CSRF tokens and correct cookie format
- **Auto-discovers devices**: Dynamically finds your devices and account ID
- **Caches responses**: Reduces API calls with 5-minute cache

## Troubleshooting

### 401/403 Errors

**Problem**: Authentication failed

**Solutions**:
1. Cookies may have expired - get fresh ones from Amazon
2. Check that cookie values are correct (no extra quotes or spaces)
3. For regional cookies, ensure `COOKIE_SUFFIX` matches your region
4. Try cookies from `amazon.com` (US site) if regional ones don't work

### Device Not Found

**Problem**: Devices don't appear in `/api/status`

**Solutions**:
1. Wait 1-2 minutes for device discovery cache to refresh
2. Check that your cookies are valid (test with `/api/status`)
3. Ensure your Alexa devices are online and registered to your account

### Announcements Fail

**Problem**: Getting 401 when sending announcements

**Solution**: Announcements require Alexa mobile app cookies, not Amazon.com cookies. See cookie requirements above.

### More Help

- See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for detailed solutions
- Review [Security Guide](./docs/SECURITY.md) for security best practices
- Check [API Reference](./docs/API-REFERENCE.md) for endpoint documentation

## Next Steps

- Read the [API Reference](./docs/API-REFERENCE.md) to explore all endpoints
- Review [Architecture](./docs/ARCHITECTURE.md) for technical details
- Check [Security](./docs/SECURITY.md) for security best practices

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file (it's in `.gitignore`)
- Rotate your cookies periodically (they expire)
- Use a dedicated Amazon account for automation if possible
- See [Security Documentation](./docs/SECURITY.md) for complete security audit

---

**That's it!** Your server should now be running and ready to control your Alexa devices.
