# Test Commands for Alexa MCP Server

## Base URL
```bash
BASE_URL="http://localhost:8787"
```

## 1. Health & Status Endpoints

### Health Check
```bash
curl http://localhost:8787/health | jq
```

### Server Info (List all endpoints)
```bash
curl http://localhost:8787/ | jq
```

### Connection Status
```bash
curl http://localhost:8787/api/status | jq
```

## 2. Music Endpoints

### Get Current Music Status
```bash
curl http://localhost:8787/api/music | jq
```

### Control Music Playback
```bash
# Play/Resume
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "play"}' | jq

# Pause
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "pause"}' | jq

# Next Track
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "next"}' | jq

# Previous Track
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "prev"}' | jq

# Forward
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "forward"}' | jq

# Rewind
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "rewind"}' | jq
```

### Play Music by Search
```bash
# Search and play music (defaults to Spotify)
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{
    "searchPhrase": "jazz music",
    "provider": "SPOTIFY"
  }' | jq

# Play on Amazon Music
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{
    "searchPhrase": "The Beatles",
    "provider": "AMAZON_MUSIC"
  }' | jq

# Available providers: SPOTIFY, AMAZON_MUSIC, TUNEIN, APPLE_MUSIC, DEEZER, I_HEART_RADIO
```

### Send Text Command to Alexa
```bash
# Send any text command (like talking to Alexa)
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{
    "text": "play jazz music on Spotify"
  }' | jq

# Examples:
# "play relaxing music"
# "pause music"
# "next song"
# "play The Beatles on Amazon Music"
# "turn up the volume"
```

## 3. Bedroom/Sensor Endpoints

### Get Bedroom State (Temperature, Illuminance, Light Status)
```bash
curl http://localhost:8787/api/bedroom | jq
```

## 4. Lights Endpoints

### List All Lights
```bash
curl http://localhost:8787/api/lights | jq
```

### Get Light State
```bash
curl http://localhost:8787/api/lights/state | jq
```

### Turn Light On
```bash
curl -X POST http://localhost:8787/api/lights/power \
  -H "Content-Type: application/json" \
  -d '{"on": true}' | jq
```

### Turn Light Off
```bash
curl -X POST http://localhost:8787/api/lights/power \
  -H "Content-Type: application/json" \
  -d '{"on": false}' | jq
```

### Set Brightness (0-100)
```bash
curl -X POST http://localhost:8787/api/lights/brightness \
  -H "Content-Type: application/json" \
  -d '{"level": 75}' | jq
```

### Set Color by Name
```bash
curl -X POST http://localhost:8787/api/lights/color \
  -H "Content-Type: application/json" \
  -d '{"mode": "name", "value": "blue"}' | jq
```

### Set Color by Hex
```bash
curl -X POST http://localhost:8787/api/lights/color \
  -H "Content-Type: application/json" \
  -d '{"mode": "hex", "value": "#FF5733"}' | jq
```

### Set Color Temperature (Kelvin)
```bash
curl -X POST http://localhost:8787/api/lights/color \
  -H "Content-Type: application/json" \
  -d '{"mode": "kelvin", "value": 3000}' | jq
```

## 5. Volume Endpoints

### Get All Device Volumes
```bash
curl http://localhost:8787/api/volume | jq
```

### Set Volume (0-100)
```bash
curl -X POST http://localhost:8787/api/volume/set \
  -H "Content-Type: application/json" \
  -d '{"volume": 50}' | jq
```

### Set Volume for Specific Device
```bash
curl -X POST http://localhost:8787/api/volume/set \
  -H "Content-Type: application/json" \
  -d '{"deviceType": "A2H4LV5GIZ1JFT", "dsn": "G091JJ14...", "volume": 75}' | jq
```

## 6. Sensors Endpoints

### List All Sensors
```bash
curl http://localhost:8787/api/sensors | jq
```

### Get All Sensor Data
```bash
curl http://localhost:8787/api/sensors/all | jq
```

### Get Temperature
```bash
curl http://localhost:8787/api/sensors/temperature | jq
```

### Get Illuminance
```bash
curl http://localhost:8787/api/sensors/illuminance | jq
```

### Get Motion
```bash
curl http://localhost:8787/api/sensors/motion | jq
```

### Get Acoustic
```bash
curl http://localhost:8787/api/sensors/acoustic | jq
```

## 7. Do Not Disturb (DND) Endpoints

### Get DND Status for All Devices
```bash
curl http://localhost:8787/api/dnd | jq
```

### Enable DND for a Device
```bash
curl -X PUT http://localhost:8787/api/dnd \
  -H "Content-Type: application/json" \
  -d '{
    "deviceSerialNumber": "G091JJ14...",
    "deviceType": "A2H4LV5GIZ1JFT",
    "enabled": true
  }' | jq
```

### Disable DND for a Device
```bash
curl -X PUT http://localhost:8787/api/dnd \
  -H "Content-Type: application/json" \
  -d '{
    "deviceSerialNumber": "G091JJ14...",
    "deviceType": "A2H4LV5GIZ1JFT",
    "enabled": false
  }' | jq
```

## 8. Announcements Endpoint

### Send Announcement
```bash
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kitchen",
    "message": "Dinner is ready!"
  }' | jq
```

### Send Announcement with SSML
```bash
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room",
    "message": "Hello world",
    "ssml": "<speak>Hello <break time=\"500ms\"/> world</speak>"
  }' | jq
```

## Quick Test Script

Save this as `test-all.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8787"

echo "=== Health Check ==="
curl -s "$BASE_URL/health" | jq

echo -e "\n=== Status ==="
curl -s "$BASE_URL/api/status" | jq

echo -e "\n=== Music ==="
curl -s "$BASE_URL/api/music" | jq

echo -e "\n=== Bedroom ==="
curl -s "$BASE_URL/api/bedroom" | jq

echo -e "\n=== Lights ==="
curl -s "$BASE_URL/api/lights" | jq

echo -e "\n=== Volume ==="
curl -s "$BASE_URL/api/volume" | jq

echo -e "\n=== Sensors ==="
curl -s "$BASE_URL/api/sensors" | jq

echo -e "\n=== DND ==="
curl -s "$BASE_URL/api/dnd" | jq
```

Make it executable and run:
```bash
chmod +x test-all.sh
./test-all.sh
```
