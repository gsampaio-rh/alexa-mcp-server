# Alexa Announcements API Documentation

## ⚠️ Important Note

**This endpoint is NOT officially documented by Amazon.** According to the README:

> "alexa doesn't have a direct `/announce` endpoint for general use, so this implementation uses an endpoint discovered by intercepting traffic from the android alexa app using burp suite."

This means:
- ❌ No official documentation exists for consumer/home announcements
- ❌ Amazon can change/break it at any time
- ❌ It's an internal/undocumented API
- ✅ It was reverse-engineered from the Android Alexa app

## Official Amazon Documentation (Different API)

Amazon DOES have official documentation for a **Communications API**, but it's for **Alexa Smart Properties** (enterprise/commercial use):

**Reference:** [Alexa Smart Properties Communications API](https://developer.amazon.com/en-US/docs/alexa/alexa-smart-properties/communications-api.html)

### Key Differences:

| Feature | Our Endpoint (Consumer) | Official Smart Properties API |
|---------|----------------------|------------------------------|
| **Endpoint** | `alexa-comms-mobile-service.amazon.com` | `api.amazonalexa.com` |
| **Authentication** | Cookies (`ubid-main`, `at-main`) | LWA (Login with Amazon) tokens |
| **Use Case** | Home/consumer announcements | Enterprise properties (healthcare, hospitality) |
| **Documentation** | ❌ Undocumented | ✅ Officially documented |
| **Access** | Consumer accounts | Registered Smart Properties partners only |

**Important:** The official Smart Properties API is:
- Only for registered partners
- Requires LWA authentication (not cookies)
- For commercial properties, not home use
- Different endpoint and format

**Our endpoint** (`alexa-comms-mobile-service.amazon.com`) is:
- For consumer/home use
- Uses cookie authentication
- Undocumented/reverse-engineered
- What we're trying to use

## Endpoint Details

### URL
```
POST https://alexa-comms-mobile-service.amazon.com/users/{accountId}/announcements
```

### Authentication
- **Required Cookies:**
  - `ubid-main` (or regional variant like `ubid-acbbr`)
  - `at-main` (or regional variant like `at-acbbr`)
  - `csrf=1` (added automatically)

- **Required Headers:**
  ```
  Cookie: csrf=1; ubid-main={UBID_MAIN}; at-main={AT_MAIN}
  Csrf: 1
  Content-Type: application/json; charset=utf-8
  Accept: application/json; charset=utf-8
  Accept-Language: en-US
  User-Agent: PitanguiBridge/2.2.629941.0-[PLATFORM=Android]...
  ```

### Request Body Format

```json
{
  "type": "announcement/text",
  "messageText": "Your message here",
  "senderFirstName": "Sender Name",
  "senderLastName": "",
  "announcementPrefix": ""
}
```

### Parameters

| Parameter | Type | Required | Max Length | Description |
|-----------|------|----------|-----------|-------------|
| `type` | string | Yes | - | Always `"announcement/text"` |
| `messageText` | string | Yes | 145 chars | The message to announce |
| `senderFirstName` | string | Yes | 40 chars | Name of the sender |
| `senderLastName` | string | No | - | Last name (usually empty) |
| `announcementPrefix` | string | No | - | Prefix text (usually empty) |

### Account ID

The `accountId` in the URL is obtained from:
```
GET https://alexa-comms-mobile-service.amazon.com/accounts
```

Response contains `directedId` which is used as the `accountId`.

## Current Implementation

### Request Flow

1. **Get Account ID:**
   ```typescript
   GET https://alexa-comms-mobile-service.amazon.com/accounts
   → Extract `directedId` from response
   ```

2. **Send Announcement:**
   ```typescript
   POST https://alexa-comms-mobile-service.amazon.com/users/{accountId}/announcements
   Body: {
     type: "announcement/text",
     messageText: "...",
     senderFirstName: "...",
     senderLastName: "",
     announcementPrefix: ""
   }
   ```

### Expected Response

**Success (200 OK):**
```json
{
  "statuses": [
    {
      "playbackStatus": "DELIVERED",
      "deliveredTime": "2026-02-03T18:30:00.000Z"
    }
  ]
}
```

**Error (500):**
```json
{
  "status": 500,
  "message": "Something went wrong"
}
```

## Known Issues & Limitations

### 1. Cookie Requirements

**Problem:** The endpoint requires **Alexa app cookies**, not amazon.com cookies.

**Evidence:**
- Amazon.com cookies work for other endpoints (`/api/status`, `/api/music`, etc.)
- Announcements endpoint returns 401/500 with amazon.com cookies
- SETUP.md confirms: "Announcements | ❌ | ✅" (amazon.com | Alexa app)

**Solution:** Get cookies from the Alexa mobile app, not amazon.com.

### 2. 500 Internal Server Error

**Current Status:** Getting 500 error from Amazon's API.

**Possible Causes:**
1. **Wrong cookie type** - Need Alexa app cookies, not amazon.com
2. **Missing parameters** - API might require additional fields
3. **Account ID format** - Might need different format
4. **API changes** - Amazon may have changed the endpoint
5. **Regional restrictions** - Might not work with regional cookies

### 3. Authentication Scope

The `alexa-comms-mobile-service.amazon.com` domain appears to be:
- Part of Alexa's mobile communication service
- Requires mobile app authentication tokens
- Different from web-based APIs (`alexa.amazon.com`)

## Alternative Approaches

### Option 1: Use Alexa App Cookies

1. Install Alexa app on phone
2. Intercept traffic (Burp Suite, HTTP Toolkit, Charles Proxy)
3. Extract `ubid-main` and `at-main` cookies
4. Use those cookies instead of amazon.com cookies

### Option 2: Try Different Request Format

The API might require additional parameters. Possible variations:

```json
{
  "type": "announcement/text",
  "messageText": "...",
  "senderFirstName": "...",
  "senderLastName": "",
  "announcementPrefix": "",
  "targetDeviceNames": ["Echo Dot de Gabriel"],  // Try specifying device
  "expirationTimeInSeconds": 300  // Try adding expiration
}
```

### Option 3: Use Official Smart Home Skill API

If building a proper integration, use Amazon's official Smart Home Skill API:
- Documented and supported
- Requires skill development
- More complex setup

## Debugging Steps

### 1. Check Server Logs

The code now logs detailed information:
```
[Announce] Getting account ID...
[Announce] Account ID: amzn1.ac...
[Announce] Sending announcement to: https://...
[Announce] Request body: {...}
[Announce] Request headers: Cookie, Csrf, Content-Type, ...
[Announce] ❌ Failed: 500 Internal Server Error
[Announce] Error response: {...}
```

### 2. Verify Account ID

Test if account ID retrieval works:
```bash
# This should work with your current cookies
curl http://localhost:8787/api/status
# Check if account.customerId is returned
```

### 3. Test with Different Cookies

Try getting cookies from:
- Alexa mobile app (recommended for announcements)
- Different Amazon site (amazon.com vs amazon.com.br)
- Different browser/device

### 4. Check Request Format

Compare your request with what the Alexa app sends:
- Use Burp Suite/HTTP Toolkit to intercept
- Compare headers, body format, URL structure
- Look for any differences

## References

- **Project README:** Mentions endpoint was discovered via Burp Suite interception
- **SETUP.md:** Confirms announcements require Alexa app cookies
- **Current Implementation:** `src/api/v1/announce.ts`
- **Account Info Endpoint:** `src/utils/alexa-dynamic.ts` - `getAccountInfo()`

## Next Steps

1. **Get Alexa app cookies** - This is the most likely solution
2. **Intercept Alexa app traffic** - See what the app actually sends
3. **Compare request formats** - Check if anything is missing
4. **Try alternative endpoints** - There might be other announcement endpoints

## Current Status

✅ **Working:**
- Account ID retrieval (with amazon.com cookies)
- Request format appears correct
- Headers are properly formatted

❌ **Not Working:**
- Announcement delivery (500 error)
- Likely due to cookie type mismatch

## Recommendation

**For now, use other features that work:**
- Device status and control
- Sensor monitoring
- Music status
- Volume control
- DND control

**For announcements:**
- Get Alexa app cookies (requires traffic interception)
- Or wait for someone to document the correct format
- Or use official Smart Home Skill API for a proper solution
