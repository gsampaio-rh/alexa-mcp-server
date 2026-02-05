# iPhone Tutorial: Capturing Alexa App Cookies

This guide will help you capture the `ubid-main` and `at-main` cookies from the Alexa mobile app on your iPhone. These cookies are required for the announcements API to work.

## ⚠️ Prerequisites

- iPhone with Alexa app installed
- Mac computer (for running proxy software)
- Both devices on the same Wi-Fi network
- 15-20 minutes

## 🎯 Which Tool Should I Use?

| Tool | Cost | Ease of Use | Best For |
|------|------|-------------|----------|
| **HTTP Toolkit** ⭐ | **FREE** | ⭐⭐⭐⭐⭐ Very Easy | **Everyone - Start here!** |
| Proxyman | Paid ($49) | ⭐⭐⭐⭐⭐ Very Easy | If you need advanced features |
| Charles Proxy | Paid ($50) | ⭐⭐⭐ Moderate | If you're already using it |

**Recommendation: Start with HTTP Toolkit** - it's free, easy, and perfect for this task!

---

## Method 1: Using HTTP Toolkit (FREE & Easiest - Recommended) ⭐

HTTP Toolkit is **100% free**, open-source, and designed to be user-friendly. It's actually easier than Proxyman for this use case!

### Why HTTP Toolkit?
- ✅ **Completely free** (no trial, no limits)
- ✅ **Very easy to use** - guided setup wizard
- ✅ **Works great** for iOS cookie capture
- ✅ **Open source** - you can see the code
- ✅ **Cross-platform** (Mac, Windows, Linux)

### Step 1: Install HTTP Toolkit

1. Download from: https://httptoolkit.tech/
2. Install and open HTTP Toolkit
3. Click **"Intercept"** in the top menu

### Step 2: Set Up iPhone Connection

1. HTTP Toolkit will show you a setup wizard
2. Select **"iPhone"** from the device list
3. Follow the on-screen instructions:
   - It will show you your Mac's IP address
   - Configure iPhone Wi-Fi proxy (Settings → Wi-Fi → ⓘ → HTTP Proxy)
   - Enter the IP and port shown (usually port 8000)
   - Install the certificate (HTTP Toolkit provides a QR code!)

### Step 3: Install SSL Certificate

HTTP Toolkit makes this super easy:

1. On your iPhone, open Safari
2. Go to the URL shown in HTTP Toolkit (or scan the QR code)
3. Tap **"Allow"** to download profile
4. Go to **Settings** → **General** → **VPN & Device Management**
5. Tap on **HTTP Toolkit Certificate**
6. Tap **Install** (enter passcode if needed)
7. Go to **Settings** → **General** → **About** → **Certificate Trust Settings**
8. Enable trust for **HTTP Toolkit CA**

### Step 4: Capture Alexa App Traffic

1. In HTTP Toolkit, you should see "Waiting for connections..."
2. On your iPhone, open the **Alexa app**
3. Make sure you're logged in
4. Try to send an announcement or browse the app
5. HTTP Toolkit will automatically show all requests!

### Step 5: Find the Cookies

1. In HTTP Toolkit, you'll see a list of requests
2. Look for requests to:
   - `alexa-comms-mobile-service.amazon.com`
   - `alexa.amazon.com`
3. Click on one of these requests
4. Look at the **Headers** section
5. Find the **Cookie** header
6. Look for:
   - `ubid-main=132-6488982-5103466` (your value)
   - `at-main=Atza|...` (long token)

### Step 6: Extract Cookie Values

Right-click on the Cookie header → **Copy value**, or manually extract:
- `ubid-main` value: Everything after `ubid-main=` until `;` or end
- `at-main` value: Everything after `at-main=` until `;` or end

---

## Method 2: Using Proxyman (Paid - Alternative)

Proxyman is a macOS app specifically designed for iOS debugging. It's easy but requires a paid license after trial.

### Step 1: Install Proxyman

1. Download Proxyman from: https://proxyman.io/
2. Install and open Proxyman
3. Proxyman will automatically start listening on port 9090

### Step 2: Configure iPhone

1. On your iPhone, go to **Settings** → **Wi-Fi**
2. Tap the **ⓘ** icon next to your Wi-Fi network
3. Scroll down to **HTTP Proxy** section
4. Select **Manual**
5. Enter:
   - **Server**: Your Mac's IP address (shown in Proxyman, usually something like `192.168.1.XXX`)
   - **Port**: `9090`
6. Tap **Save**

### Step 3: Install SSL Certificate

1. On your iPhone, open Safari (not Chrome)
2. Go to: `http://proxy.man/ssl` (Proxyman will show this URL)
3. Tap **Allow** when prompted to download profile
4. Go to **Settings** → **General** → **VPN & Device Management**
5. Tap on **Proxyman Certificate**
6. Tap **Install** (you may need to enter your passcode)
7. Go to **Settings** → **General** → **About** → **Certificate Trust Settings**
8. Enable trust for **Proxyman Certificate**

### Step 4: Capture Alexa App Traffic

1. In Proxyman, make sure it's running and showing "Waiting for connections..."
2. On your iPhone, open the **Alexa app**
3. Make sure you're logged in
4. Try to send an announcement or do something that triggers API calls:
   - Go to **Communicate** tab
   - Try to send a message/announcement
   - Or just browse around the app (it makes API calls automatically)

### Step 5: Find the Cookies

1. In Proxyman, you'll see a list of requests
2. Look for requests to:
   - `alexa-comms-mobile-service.amazon.com`
   - `alexa.amazon.com`
   - `alexa-comms-mobile-service.amazon.com/users/.../announcements`
3. Click on one of these requests
4. In the **Headers** tab, find the **Cookie** header
5. Look for:
   - `ubid-main=132-6488982-5103466` (your value will be different)
   - `at-main=Atza|...` (long token starting with `Atza|`)

### Step 6: Extract Cookie Values

1. Copy the **entire Cookie header value**
2. Or copy just the values:
   - `ubid-main` value: Everything after `ubid-main=` until the next `;` or end
   - `at-main` value: Everything after `at-main=` until the next `;` or end

**Example:**
```
Cookie: csrf=1; ubid-main=132-6488982-5103466; at-main=Atza|gQDk9A7AAwEBAExa3TkcQId4dlGHgSDAU6cWkW2thGcefuLiFFKiTUWcR0ETUCAwnTpCFmnqYIESNz-j8tg3X4fOpxO0u6WtfWoLbntpc8VEaJqVpr7p3bSgPI597rY4276LntfSMdLeQfzPaHOS6pLbofEjzS2CIfWA4gjqni4FSxxJnfPju46QCu3DXhJH65QKEQoglydqCp2TdSf3_lBTJuXR-skcNaxEudGPwf86Sktba6CAkmiDclfMpgjsCIkcvc34ysN-U-xAFNLcFgIbk4AJ3w1-gj11UithI9QHELMBykL8DCNEvZ3H3thf7UXIifOZYoIqrFt2sXaFYziiujuOp9LOcdgE4w
```

Extract:
- `UBID_MAIN=132-6488982-5103466`
- `AT_MAIN=Atza|gQDk9A7AAwEBAExa3TkcQId4dlGHgSDAU6cWkW2thGcefuLiFFKiTUWcR0ETUCAwnTpCFmnqYIESNz-j8tg3X4fOpxO0u6WtfWoLbntpc8VEaJqVpr7p3bSgPI597rY4276LntfSMdLeQfzPaHOS6pLbofEjzS2CIfWA4gjqni4FSxxJnfPju46QCu3DXhJH65QKEQoglydqCp2TdSf3_lBTJuXR-skcNaxEudGPwf86Sktba6CAkmiDclfMpgjsCIkcvc34ysN-U-xAFNLcFgIbk4AJ3w1-gj11UithI9QHELMBykL8DCNEvZ3H3thf7UXIifOZYoIqrFt2sXaFYziiujuOp9LOcdgE4w`

### Step 7: Update Your Server

1. Update your `.dev.vars` file:
   ```bash
   UBID_MAIN=<value you copied>
   AT_MAIN=<value you copied>
   ```

2. Restart your server

3. Test the announcement endpoint again

---

## Method 3: Using Charles Proxy (Paid - Alternative)

Charles Proxy is another popular option, though slightly more complex. Has a free trial but requires license after.

### Step 1: Install Charles Proxy

1. Download from: https://www.charlesproxy.com/
2. Install and open Charles
3. Charles will prompt you to allow network access - click **Allow**

### Step 2: Find Your Mac's IP Address

1. In Charles, go to **Help** → **Local IP Address**
2. Note the IP address (e.g., `192.168.1.100`)

### Step 3: Configure iPhone

1. On iPhone: **Settings** → **Wi-Fi** → Tap **ⓘ** next to your network
2. Scroll to **HTTP Proxy** → **Manual**
3. Enter:
   - **Server**: Your Mac's IP (from Step 2)
   - **Port**: `8888` (Charles default)
4. Tap **Save**

### Step 4: Install SSL Certificate

1. On iPhone, open Safari
2. Go to: `chls.pro/ssl` (Charles will show this)
3. Tap **Allow** to download profile
4. Go to **Settings** → **General** → **VPN & Device Management**
5. Install the Charles Proxy certificate
6. Go to **Settings** → **General** → **About** → **Certificate Trust Settings**
7. Enable trust for **Charles Proxy SSL Proxying Certificate**

### Step 5: Enable SSL Proxying

1. In Charles, go to **Proxy** → **SSL Proxying Settings**
2. Check **Enable SSL Proxying**
3. Click **Add**
4. Enter: `*.amazon.com` (to capture all Amazon domains)
5. Click **OK**

### Step 6: Capture Traffic

1. Open Alexa app on iPhone
2. Use the app (send announcement, browse, etc.)
3. In Charles, you'll see requests appear
4. Look for `alexa-comms-mobile-service.amazon.com` requests
5. Click on a request → **Headers** tab → Find **Cookie** header
6. Extract `ubid-main` and `at-main` values

---

---

## Troubleshooting

### Certificate Not Trusted

- Make sure you installed the certificate AND enabled trust in **Certificate Trust Settings**
- Try restarting your iPhone
- Make sure you're using Safari, not Chrome, to download the certificate

### No Traffic Appearing

- Check that iPhone proxy is set correctly
- Make sure both devices are on the same Wi-Fi network
- Try restarting the proxy software
- Make sure the proxy is running before opening the Alexa app

### Can't Find Cookies

- Make sure you're looking at requests to `alexa-comms-mobile-service.amazon.com` or `alexa.amazon.com`
- Try sending an announcement from the Alexa app (this will definitely trigger the API)
- Look in the **Headers** tab, not the **Body** tab
- Cookies might be in the **Request Headers** section

### Wrong Cookies

- Make sure you're copying the **values** only, not the entire cookie string
- `ubid-main` should look like: `132-6488982-5103466` (numbers and dashes)
- `at-main` should start with: `Atza|` (long token)

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **These cookies are sensitive** - they give full access to your Alexa account
2. **Never share them** publicly or commit them to git
3. **They expire** - you may need to refresh them periodically (usually every few weeks/months)
4. **Revoke if compromised** - if you suspect they're leaked, change your Amazon password
5. **Use environment variables** - store them in `.dev.vars` (which is gitignored)

---

## Quick Reference

**What you're looking for:**
- Cookie header in requests to `alexa-comms-mobile-service.amazon.com`
- Values: `ubid-main=XXX` and `at-main=Atza|XXX`

**Where to put them:**
- `.dev.vars` file:
  ```
  UBID_MAIN=<value>
  AT_MAIN=<value>
  ```

**How to test:**
```bash
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "message": "Hello"}'
```

---

## Need Help?

If you're stuck:
1. Check the server logs - they'll show detailed information about what's happening
2. Verify cookies are correct format (see troubleshooting above)
3. Make sure server is restarted after updating `.dev.vars`
4. Check that cookies haven't expired (try getting fresh ones)

Good luck! 🎉
