# Official Amazon API vs Our Implementation

## Official Amazon Documentation

Amazon provides official documentation for the **Alexa Smart Properties Communications API**:

**Reference:** [Alexa Smart Properties Communications API](https://developer.amazon.com/en-US/docs/alexa/alexa-smart-properties/communications-api.html)

## Comparison: Official API vs Our Endpoint

### Official Smart Properties API

**Endpoint:**
```
https://api.amazonalexa.com/v1/communications/profile
```

**Authentication:**
- Uses **LWA (Login with Amazon) tokens**
- Requires OAuth 2.0 flow
- Access token in `Authorization: Bearer {token}` header

**Use Case:**
- Enterprise/commercial properties
- Healthcare facilities
- Hospitality (hotels)
- Senior living facilities
- Requires partner registration

**Documentation:**
- ✅ Fully documented
- ✅ Official API reference
- ✅ Supported by Amazon

**Operations:**
- Create/update communication profiles
- Manage calling settings
- Drop-in preferences
- Blocking rules
- **NOT for sending announcements to consumer devices**

### Our Consumer Endpoint (What We're Using)

**Endpoint:**
```
POST https://alexa-comms-mobile-service.amazon.com/users/{accountId}/announcements
```

**Authentication:**
- Uses **cookies** (`ubid-main`, `at-main`)
- No OAuth required
- Cookie-based session authentication

**Use Case:**
- Consumer/home use
- Personal Alexa devices
- Home automation
- No partner registration needed

**Documentation:**
- ❌ Not officially documented
- ❌ Reverse-engineered from Android app
- ⚠️ Can break without notice

**Operations:**
- Send text-to-speech announcements
- Consumer device control

## Why They're Different

1. **Target Audience:**
   - **Official API:** Enterprise/commercial properties
   - **Our Endpoint:** Consumer/home users

2. **Authentication:**
   - **Official API:** OAuth 2.0 / LWA tokens
   - **Our Endpoint:** Session cookies

3. **Purpose:**
   - **Official API:** Manage communication profiles for rooms/units
   - **Our Endpoint:** Send announcements to Echo devices

4. **Access:**
   - **Official API:** Requires partner registration
   - **Our Endpoint:** Works with any Amazon account

## Conclusion

The official Amazon documentation is for a **completely different API** designed for enterprise use. Our endpoint is for consumer/home use and is **not officially documented**.

This explains why:
- We can't find official docs for our endpoint
- It requires different authentication (cookies vs OAuth)
- It's reverse-engineered from the mobile app
- It may not work reliably (500 errors)

## What This Means

1. **No Official Support:** Amazon doesn't officially support consumer announcement APIs
2. **Use at Your Own Risk:** The endpoint can break anytime
3. **Cookie Requirements:** Need Alexa app cookies (not amazon.com cookies)
4. **Alternative:** Consider using official Smart Properties API if building enterprise solution

## References

- **Official API Docs:** https://developer.amazon.com/en-US/docs/alexa/alexa-smart-properties/communications-api.html
- **Our Implementation:** `src/api/v1/announce.ts`
- **Project README:** Mentions endpoint was discovered via Burp Suite
