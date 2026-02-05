# API Reference

Complete API reference for the Alexa MCP Server.

## Base URL

- **Local Development**: `http://localhost:8787`
- **Production**: Your Cloudflare Workers URL

## Authentication

All API requests require authentication via Amazon cookies configured in environment variables:
- `UBID_MAIN` - Amazon ubid-main cookie value
- `AT_MAIN` - Amazon at-main authentication token

See [Setup Guide](../SETUP.md) for cookie configuration details.

## Endpoints

### Core Endpoints

#### `GET /`
Get server information and available endpoints.

**Response:**
```json
{
  "name": "Alexa MCP Server",
  "version": "1.0.0",
  "endpoints": {
    "api": "/api",
    "bedroom": "/api/bedroom",
    "announce": "/api/announce",
    "music": "/api/music",
    "lights": "/api/lights",
    "volume": "/api/volume",
    "sensors": "/api/sensors",
    "dnd": "/api/dnd",
    "mcp": "/mcp",
    "sse": "/sse",
    "health": "/health"
  }
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T18:30:00.000Z"
}
```

#### `GET /api/status`
Get connection status and device list.

**Response:**
```json
{
  "connected": true,
  "account": {
    "customerId": "amzn1.ac..."
  },
  "devices": {
    "total": 3,
    "online": 2,
    "offline": 1,
    "list": [
      {
        "name": "Kitchen Echo",
        "type": "A2H4LV5GIZ1JFT",
        "family": "ECHO",
        "online": true,
        "serialNumber": "G091JJ14..."
      }
    ]
  },
  "endpoints": {
    "total": 5
  },
  "timestamp": "2026-02-03T18:30:00.000Z"
}
```

### Music Control

#### `GET /api/music`
Get current music playback status.

**Response:**
```json
{
  "isPlaying": true,
  "trackName": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "coverUrl": "https://...",
  "provider": "SPOTIFY",
  "mediaProgress": 120,
  "mediaLength": 240,
  "timeOfSample": "2026-02-03T18:30:00.000Z"
}
```

#### `POST /api/music/control`
Control music playback.

**Request Body:**
```json
{
  "command": "play"  // "play", "pause", "next", "prev", "forward", "rewind"
}
```

**Response:**
```json
{
  "success": true,
  "command": "play"
}
```

#### `POST /api/music/play`
Play music by search phrase.

**Request Body:**
```json
{
  "searchPhrase": "jazz music",
  "provider": "SPOTIFY"  // "SPOTIFY", "AMAZON_MUSIC", "TUNEIN", "APPLE_MUSIC", "DEEZER", "I_HEART_RADIO"
}
```

**Response:**
```json
{
  "success": true,
  "searchPhrase": "jazz music",
  "provider": "SPOTIFY"
}
```

#### `POST /api/music/text-command`
Send natural language command to Alexa (most flexible option).

**Request Body:**
```json
{
  "text": "play jazz music on Spotify"
}
```

**Response:**
```json
{
  "success": true,
  "text": "play jazz music on Spotify"
}
```

**Examples:**
```bash
# Play music
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "play the 1975"}'

# Pause
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "pause music"}'

# Skip track
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "next song"}'
```

**Note**: This uses the `behaviors/preview` endpoint with `Alexa.TextCommand`, making it the most flexible way to control music. You can send any command Alexa understands naturally.

**Valid commands for `/api/music/control`:**
- `play`, `pause`, `next`, `prev`, `previous`, `forward`, `fwd`, `rewind`, `rwd`

**Valid providers for `/api/music/play`:**
- `SPOTIFY`, `AMAZON_MUSIC`, `TUNEIN`, `APPLE_MUSIC`, `DEEZER`, `I_HEART_RADIO`

**How It Works:**
- **Playback Controls**: Uses `/api/np/command` endpoint for fast, reliable control
- **Music Search**: Uses `behaviors/preview` with `Alexa.Music.PlaySearchPhrase`
- **Text Commands**: Uses `behaviors/preview` with `Alexa.TextCommand` (most flexible)

**Test Script:**
```bash
# Check current status
python3 scripts/test-music-playback.py status

# Control playback
python3 scripts/test-music-playback.py play
python3 scripts/test-music-playback.py pause

# Search and play
python3 scripts/test-music-playback.py search "jazz music"

# Send text command
python3 scripts/test-music-playback.py text "play relaxing music on Spotify"
```

#### `POST /api/music/text-command` (Detailed)
Send natural language command to Alexa.

**Request Body:**
```json
{
  "text": "play jazz music on Spotify"
}
```

**Response:**
```json
{
  "success": true,
  "text": "play jazz music on Spotify"
}
```

**Examples:**
```bash
# Play a genre
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{"searchPhrase": "classical music", "provider": "SPOTIFY"}'

# Control playback
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "play"}'

# Send text command
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "play my Discover Weekly playlist"}'
```

**Test Script:**
```bash
python3 scripts/test-music-playback.py status
python3 scripts/test-music-playback.py play
python3 scripts/test-music-playback.py search "jazz music"
```

### Smart Home

#### `GET /api/bedroom`
Get bedroom sensor data.

**Response:**
```json
{
  "temperature": 22.5,
  "illuminance": 150,
  "lightOn": true,
  "timestamp": "2026-02-03T18:30:00.000Z"
}
```

#### `GET /api/lights`
List all lights.

**Response:**
```json
{
  "lights": [
    {
      "name": "Bedroom Light",
      "on": true,
      "brightness": 75,
      "color": {
        "hue": 240,
        "saturation": 100,
        "brightness": 100
      }
    }
  ]
}
```

#### `POST /api/lights/power`
Turn lights on/off.

**Request Body:**
```json
{
  "on": true
}
```

#### `POST /api/lights/brightness`
Set brightness (0-100).

**Request Body:**
```json
{
  "level": 75
}
```

#### `POST /api/lights/color`
Set color.

**Request Body:**
```json
{
  "mode": "name",  // "name", "hex", or "kelvin"
  "value": "blue"  // Color name, hex code, or kelvin temperature
}
```

#### `GET /api/sensors`
List all sensors.

**Response:**
```json
{
  "sensors": [
    {
      "name": "Bedroom Sensor",
      "type": "TEMPERATURE",
      "value": 22.5,
      "unit": "celsius"
    }
  ]
}
```

#### `GET /api/volume`
Get device volumes.

**Response:**
```json
{
  "devices": [
    {
      "name": "Kitchen Echo",
      "volume": 50,
      "muted": false
    }
  ]
}
```

#### `POST /api/volume/set`
Set volume (0-100).

**Request Body:**
```json
{
  "volume": 50,
  "deviceType": "A2H4LV5GIZ1JFT",  // Optional
  "dsn": "G091JJ14..."  // Optional
}
```

#### `GET /api/dnd`
Get DND status for all devices.

**Response:**
```json
{
  "devices": [
    {
      "deviceSerialNumber": "G091JJ14...",
      "deviceType": "A2H4LV5GIZ1JFT",
      "enabled": false
    }
  ]
}
```

#### `PUT /api/dnd`
Enable/disable DND.

**Request Body:**
```json
{
  "deviceSerialNumber": "G091JJ14...",
  "deviceType": "A2H4LV5GIZ1JFT",
  "enabled": true
}
```

### Announcements

#### `POST /api/announce`
Send voice announcement to device.

**Request Body:**
```json
{
  "name": "Kitchen",  // Device name
  "message": "Dinner is ready!",  // Text message (max 500 chars)
  "ssml": "<speak>Hello <break time=\"500ms\"/> world</speak>"  // Optional SSML (max 500 chars)
}
```

**Note**: If both `message` and `ssml` are provided, `ssml` takes precedence.

**Response:**
```json
{
  "success": true,
  "deviceName": "Kitchen",
  "message": "Dinner is ready!"
}
```

**Important**: Announcements require Alexa mobile app cookies, not Amazon.com cookies. See [Setup Guide](../SETUP.md) for details.

### MCP Endpoints

#### `GET /sse`
MCP Server-Sent Events endpoint for MCP clients.

#### `POST /mcp`
MCP HTTP endpoint for MCP clients.

See [LangGraph/LangChain Integration Guide](./LANGGRAPH_LANGCHAIN_INTEGRATION.md) for usage.

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication failed (check cookies)
- `403 Forbidden` - Access denied
- `404 Not Found` - Endpoint or resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Rate Limiting

The server implements caching to reduce API calls:
- Device discovery: 5-minute cache
- Account info: 5-minute cache
- Sensor data: Real-time (no cache)

## Notes

1. **Unofficial API**: This server uses reverse-engineered endpoints from the Alexa mobile app. Amazon can change or break these at any time.

2. **Cookie Requirements**: 
   - Most features work with Amazon.com cookies
   - Announcements require Alexa mobile app cookies

3. **Cookie Expiration**: Amazon cookies expire periodically. If you get 401/403 errors, get fresh cookies.

4. **Regional Support**: The server supports regional Amazon cookies. See [Setup Guide](../SETUP.md) for details.
