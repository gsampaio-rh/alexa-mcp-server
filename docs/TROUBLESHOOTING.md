# Troubleshooting Guide

## 401/403 Authentication Errors

If you're getting `401` or `403` errors, here are the most common causes and solutions:

### Issue 1: Cookies Expired

**Symptoms:**
- `401 Unauthorized` errors
- `403 Forbidden` errors
- "Failed to fetch account info: 401"

**Solution:**
1. Go to Amazon (or your regional Amazon site)
2. Make sure you're logged in
3. Get fresh cookies from DevTools
4. Update your `.dev.vars` file with new values
5. Restart the server

### Issue 2: Wrong Cookie Names vs Values

**Important:** Amazon's Alexa API (`alexa.amazon.com`) **always requires** cookie names to be:
- `ubid-main` (not `ubid-acbbr` or other regional variants)
- `at-main` (not `at-acbbr` or other regional variants)

However, the **cookie values** can come from any Amazon site (regional or US).

**What to do:**
- The code automatically uses `ubid-main` and `at-main` as cookie names
- You just need to provide the cookie **values** in `UBID_MAIN` and `AT_MAIN`
- The `COOKIE_SUFFIX` variable is not needed for Alexa API (it was for regional Amazon sites)

### Issue 3: Regional Cookies May Not Work

**Problem:** Some regional Amazon cookies may not work with Alexa API.

**Solution:** Try getting cookies from `amazon.com` (US site) instead:

1. Visit `https://www.amazon.com` (US site)
2. Log in with your Amazon account
3. Open DevTools → Network tab
4. Find any request and copy cookies:
   - `ubid-main` value → `UBID_MAIN`
   - `at-main` value → `AT_MAIN`
5. Update `.dev.vars` and restart

### Issue 4: Cookie Values Not Copied Correctly

**Common mistakes:**
- Copying cookie names instead of values
- Including extra spaces or quotes
- Copying only part of the value

**How to verify:**
```bash
# Check your .dev.vars file
cat .dev.vars

# UBID_MAIN should be something like: REDACTED_UBID
# AT_MAIN should be a long token starting with: Atza|...
```

### Issue 5: Server Not Reading Environment Variables

**Check:**
1. Is `.dev.vars` in the project root?
2. Did you restart the server after changing `.dev.vars`?
3. Are the variable names correct? (`UBID_MAIN`, `AT_MAIN`)

## Debugging Steps

### Step 1: Check Server Logs

Look for these log messages:
```
[Alexa] Connecting to Amazon Alexa API...
[Alexa] ✅ Successfully authenticated! Customer ID: ...
```

If you see errors, check the error details.

### Step 2: Test Connection

```bash
curl http://localhost:8787/api/status
```

This will test the connection and show detailed error messages.

### Step 3: Verify Cookies

1. Open Amazon in your browser
2. Open DevTools (F12)
3. Go to Application → Cookies
4. Find `ubid-main` and `at-main` cookies
5. Copy the **values** (not names)
6. Make sure they're not expired

### Step 4: Try Fresh Cookies

Sometimes cookies expire quickly. Get fresh ones:
1. Log out of Amazon
2. Log back in
3. Get fresh cookies immediately
4. Update `.dev.vars`
5. Restart server

## Common Error Messages

### "Failed to fetch account info: 401"
- **Cause:** Authentication failed
- **Fix:** Get fresh cookies, make sure values are correct

### "Failed to fetch devices: 401"
- **Cause:** Same as above, but during device discovery
- **Fix:** Check account info first, then try devices

### "Missing UBID_MAIN or AT_MAIN"
- **Cause:** Environment variables not set
- **Fix:** Check `.dev.vars` file exists and has correct values

## Still Not Working?

1. **Check server logs** - Look for detailed error messages
2. **Try US cookies** - Get cookies from `amazon.com` (US site)
3. **Verify cookie format** - Make sure no extra characters
4. **Check cookie expiration** - Get fresh cookies
5. **Restart server** - After changing `.dev.vars`

## Getting Help

If you're still having issues, check:
1. Server console logs for detailed error messages
2. The `/api/status` endpoint response
3. That cookies are fresh and not expired
4. That you're using the cookie **values**, not names
