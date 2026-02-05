# Self-Hosting Security Guarantee

## ✅ Your Credentials Are Safe

When you self-host this application, **your Amazon cookies (UBID_MAIN and AT_MAIN) are NEVER shared with anyone** except Amazon's official APIs.

## 🔒 Security Verification

I've completed a comprehensive security audit and added verification tools:

### ✅ What Was Verified

1. **Network Requests**: All requests ONLY go to `*.amazon.com` domains
2. **Credential Storage**: Credentials are only in environment variables, never hardcoded
3. **Credential Logging**: Credentials are NEVER logged to console or files
4. **Error Messages**: Credentials are NEVER exposed in error responses
5. **Third-Party Services**: No third-party services are contacted

### 📋 Security Audit Results

Run the security verification script:

```bash
./scripts/verify-security.sh
```

**Expected output:**
- ✅ No hardcoded credentials found
- ✅ All network requests go to Amazon domains only
- ✅ No credential logging found
- ✅ .env is in .gitignore

## 🛡️ How Credentials Are Used

### Credential Flow

```
Your .env file
    ↓
Environment Variables (UBID_MAIN, AT_MAIN)
    ↓
buildAlexaHeaders() function (src/utils/alexa.ts)
    ↓
HTTP Cookie Header
    ↓
Amazon Alexa APIs ONLY (*.amazon.com)
```

### What Happens to Your Credentials

✅ **Used for**: Building HTTP headers to authenticate with Amazon APIs  
✅ **Sent to**: Only `alexa.amazon.com` and `alexa-comms-mobile-service.amazon.com`  
❌ **Never sent to**: Third-party services, analytics, or any other endpoints  
❌ **Never logged**: Console logs, files, or error messages  
❌ **Never shared**: With anyone except Amazon's official APIs  

## 🔍 How to Verify Yourself

### Method 1: Network Monitoring

Monitor all outbound connections:

```bash
# Linux/Mac - Monitor network traffic
sudo tcpdump -i any -n 'host alexa.amazon.com or host alexa-comms-mobile-service.amazon.com'

# Check for any non-Amazon connections
sudo netstat -an | grep ESTABLISHED | grep -v amazon.com
```

**Expected**: Only connections to `*.amazon.com` domains

### Method 2: Code Review

Review the code yourself:

```bash
# Check all network requests
grep -r "fetch(" src/ | grep -v "API_BASE\|apiBase"

# Check credential usage
grep -r "UBID_MAIN\|AT_MAIN" src/ | grep -v "env\|types\|validation"
```

**Expected**: Only Amazon domains and environment variable access

### Method 3: Runtime Monitoring

1. Start the server: `pnpm dev`
2. Make a request to any endpoint
3. Check server logs for any credential leakage
4. Monitor network traffic

**Expected**: No credentials in logs, only Amazon API calls

## 📝 Security Features Added

### 1. Security Documentation

- `SECURITY.md` - Comprehensive security audit document
- `SELF-HOSTING-SECURITY.md` - This file (quick reference)
- Security comments in code

### 2. Security Utilities

- `src/utils/security.ts` - Security helper functions:
  - `sanitizeError()` - Prevents credential leakage in errors
  - `isAmazonDomain()` - Validates URLs are Amazon domains
  - `createSafeErrorResponse()` - Creates safe error responses

### 3. Security Verification Script

- `scripts/verify-security.sh` - Automated security checks
- Verifies no hardcoded credentials
- Verifies all requests go to Amazon only
- Verifies no credential logging

## 🚀 Self-Hosting Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd alexa-mcp-server
pnpm install
```

### 2. Configure Environment

```bash
# Create .env file (NEVER commit this!)
cp .env.example .env

# Edit .env with your credentials
# UBID_MAIN=your-ubid-main-value
# AT_MAIN=your-at-main-value
# API_BASE=http://localhost:8787

# Set secure permissions
chmod 600 .env
```

### 3. Verify Security

```bash
# Run security verification
./scripts/verify-security.sh
```

### 4. Run Server

```bash
# Development
pnpm dev

# Production (if using Cloudflare Workers)
pnpm deploy
```

### 5. Monitor

- Monitor network traffic (see Method 1 above)
- Check server logs
- Verify only Amazon APIs are called

## ⚠️ Important Security Notes

1. **Protect Your .env File**
   - Never commit it to git (it's in .gitignore)
   - Use secure file permissions (600)
   - Don't share it with anyone

2. **Monitor Your Amazon Account**
   - Check account activity regularly
   - Look for suspicious device control
   - Rotate credentials if compromised

3. **Network Security**
   - Use HTTPS in production
   - Restrict server access
   - Use firewall rules

4. **Credential Rotation**
   - Rotate cookies every 30-90 days
   - Rotate immediately if compromised
   - Use a dedicated Amazon account if possible

## ✅ Security Guarantee Summary

**When self-hosting:**

- ✅ Credentials stay on YOUR server
- ✅ Credentials only go to Amazon's official APIs
- ✅ Credentials are NEVER logged
- ✅ Credentials are NEVER shared with third parties
- ✅ You have full control and can verify everything

**You can trust this application when self-hosting because:**
1. The code is open source (you can review it)
2. All network requests are verified to go to Amazon only
3. Security verification script confirms no credential leakage
4. You control the entire deployment

## 📞 Questions?

If you have security concerns:
1. Review `SECURITY.md` for detailed audit
2. Run `./scripts/verify-security.sh` to verify
3. Monitor network traffic yourself
4. Review the code (it's open source)

---

**Last Updated**: 2025-01-27  
**Security Status**: ✅ Verified Safe for Self-Hosting
