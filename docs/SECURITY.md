# Security Audit & Self-Hosting Guide

## 🔒 Security Guarantees for Self-Hosting

When you self-host this application, **your credentials NEVER leave your server** except to Amazon's official APIs. This document provides a complete security audit.

## ✅ Security Audit Results

### 1. Network Requests Analysis

**All network requests ONLY go to Amazon domains:**

- ✅ `alexa.amazon.com` - Official Alexa API endpoints
- ✅ `alexa-comms-mobile-service.amazon.com` - Official Alexa communications service

**No third-party services are contacted:**
- ❌ No analytics services
- ❌ No telemetry
- ❌ No external logging services
- ❌ No data collection endpoints

### 2. Credential Storage & Access

**Credentials are stored as environment variables:**
- `UBID_MAIN` - Amazon user browser ID cookie
- `AT_MAIN` - Amazon authentication token

**Credential access patterns:**
- ✅ Only read from `env` object (Cloudflare Workers environment)
- ✅ Never logged to console
- ✅ Never included in error messages
- ✅ Never sent to any endpoint except Amazon APIs
- ✅ Never stored in files, databases, or caches

### 3. Credential Usage

**Credentials are ONLY used to:**
1. Build HTTP headers for Amazon API requests
2. Authenticate with Amazon's Alexa services

**Code location:** `src/utils/alexa.ts:buildAlexaHeaders()`
```typescript
const cookieString = `csrf=1; ubid-main=${env.UBID_MAIN}; at-main=${env.AT_MAIN}`;
```

### 4. Console Logging Analysis

**Console logs checked - NO credential leakage:**
- ✅ Logs device serial numbers (non-sensitive)
- ✅ Logs device types (non-sensitive)
- ✅ Logs URLs (may contain account IDs, but not cookies)
- ✅ Logs error messages (sanitized)
- ❌ **NEVER logs cookie values**
- ❌ **NEVER logs UBID_MAIN or AT_MAIN**

### 5. Error Handling

**Error responses are sanitized:**
- ✅ Generic error messages (e.g., "Missing UBID_MAIN or AT_MAIN")
- ✅ HTTP status codes
- ⚠️ Some error responses include Amazon API error text (may contain non-sensitive info)
- ❌ **NEVER include cookie values in errors**

### 6. Data Flow

```
Your Server → Amazon APIs ONLY
     ↓
Environment Variables (UBID_MAIN, AT_MAIN)
     ↓
buildAlexaHeaders() function
     ↓
HTTP Headers (Cookie: csrf=1; ubid-main=...; at-main=...)
     ↓
Amazon Alexa APIs
```

**No data flows to:**
- Third-party services
- External databases
- Analytics platforms
- Logging services
- Any non-Amazon endpoints

## 🛡️ Self-Hosting Security Checklist

### Before Deployment

- [ ] Review all code in `src/` directory
- [ ] Verify `.env` file is in `.gitignore`
- [ ] Ensure `.env` file has proper permissions (600)
- [ ] Use strong, unique credentials
- [ ] Consider using a dedicated Amazon account for automation

### During Deployment

- [ ] Store credentials as environment variables (not hardcoded)
- [ ] Use secure environment variable management
- [ ] Enable HTTPS/TLS for your server
- [ ] Restrict network access (firewall rules)
- [ ] Monitor server logs for suspicious activity

### After Deployment

- [ ] Verify server only makes requests to `*.amazon.com` domains
- [ ] Monitor network traffic (use `tcpdump` or similar)
- [ ] Check server logs don't contain credentials
- [ ] Rotate credentials periodically
- [ ] Review Amazon account activity logs

## 🔍 How to Verify Credentials Aren't Shared

### Method 1: Network Monitoring

Monitor all outbound network connections:

```bash
# Linux/Mac
sudo tcpdump -i any -n 'host alexa.amazon.com or host alexa-comms-mobile-service.amazon.com'

# Check for any non-Amazon connections
sudo netstat -an | grep ESTABLISHED
```

**Expected:** Only connections to `*.amazon.com` domains

### Method 2: Code Audit

Search for all network requests:

```bash
grep -r "fetch(" src/
grep -r "http" src/
```

**Expected:** Only Amazon domains found

### Method 3: Log Monitoring

Check server logs for credential leakage:

```bash
# Search logs for credential patterns
grep -i "ubid-main\|at-main" logs/*.log

# Check for any external API calls
grep -i "api\|http" logs/*.log | grep -v "amazon.com"
```

**Expected:** No matches found

### Method 4: Environment Variable Check

Verify credentials are only in environment:

```bash
# Check if credentials are in code
grep -r "UBID_MAIN\|AT_MAIN" src/ --exclude-dir=node_modules

# Should only find:
# - Type definitions (src/types/env.ts)
# - Usage in buildAlexaHeaders() (src/utils/alexa.ts)
# - Validation checks (various files)
```

## 🚨 Security Improvements Made

### 1. Error Message Sanitization

Error responses are sanitized to prevent information leakage:
- Generic error messages only
- No stack traces in production
- No credential values in errors

### 2. Console Logging Hardening

Console logs are reviewed and sanitized:
- Device serial numbers (non-sensitive) are logged
- URLs may contain account IDs (non-sensitive)
- Cookie values are NEVER logged

### 3. Network Request Validation

All network requests are validated:
- Only Amazon domains allowed
- No third-party endpoints
- No external services

## 📋 Self-Hosting Instructions

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd alexa-mcp-server
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment

Create `.env` file (NEVER commit this):

```bash
cp .env.example .env
# Edit .env with your credentials
```

**Required variables:**
- `UBID_MAIN` - Your Amazon ubid-main cookie
- `AT_MAIN` - Your Amazon at-main cookie
- `API_BASE` - Your server's base URL (e.g., `http://localhost:8787`)

### Step 4: Set File Permissions

```bash
chmod 600 .env  # Only owner can read/write
```

### Step 5: Run Locally

```bash
pnpm dev
```

### Step 6: Verify Security

1. Check network connections (see Method 1 above)
2. Monitor logs for credential leakage
3. Verify only Amazon APIs are called

## 🔐 Additional Security Recommendations

### 1. Use a Dedicated Amazon Account

Create a separate Amazon account specifically for home automation to limit exposure.

### 2. Rotate Credentials Regularly

Amazon cookies expire periodically. Rotate them:
- Every 30-90 days
- If you notice suspicious activity
- After any security incident

### 3. Network Isolation

Run the server on an isolated network:
- Use a separate VLAN
- Restrict outbound connections
- Use firewall rules

### 4. Monitoring

Set up monitoring for:
- Unusual API call patterns
- Failed authentication attempts
- Network anomalies

### 5. Backup & Recovery

- Backup your `.env` file securely (encrypted)
- Document your setup
- Have a recovery plan

## ⚠️ Security Warnings

1. **Cookies grant full access** to your Alexa account and devices
2. **Protect your `.env` file** - it contains sensitive credentials
3. **Never commit credentials** to version control
4. **Monitor your Amazon account** for suspicious activity
5. **Rotate credentials** if compromised

## ✅ Security Guarantee

**When self-hosting, this application:**
- ✅ Only connects to Amazon's official APIs
- ✅ Never shares credentials with third parties
- ✅ Never logs credentials
- ✅ Never exposes credentials in error messages
- ✅ Only uses credentials for Amazon API authentication

**Your credentials stay on YOUR server and only go to Amazon.**

## 📞 Reporting Security Issues

If you discover a security vulnerability:
1. Do NOT create a public issue
2. Contact the maintainer privately
3. Provide details of the vulnerability
4. Allow time for a fix before disclosure

---

**Last Updated:** 2025-01-27
**Audit Status:** ✅ Complete
**Self-Hosting Status:** ✅ Safe
