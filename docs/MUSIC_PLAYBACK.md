# Music Playback Control

The Alexa MCP Server now supports music playback control! You can play, pause, skip tracks, search for music, and send text commands to Alexa.

## Available Endpoints

### 1. Get Music Status
**GET** `/api/music`

Get current playback status (what's playing, artist, progress, etc.)

```bash
curl http://localhost:8787/api/music
```

### 2. Control Playback
**POST** `/api/music/control`

Control playback: play, pause, next, prev, forward, rewind

```bash
# Play/Resume
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "play"}'

# Pause
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "pause"}'

# Next track
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "next"}'

# Previous track
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "prev"}'
```

**Valid commands**: `play`, `pause`, `next`, `prev`, `previous`, `forward`, `fwd`, `rewind`, `rwd`

### 3. Play Music by Search
**POST** `/api/music/play`

Search and play music from various providers

```bash
# Play jazz music on Spotify
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{
    "searchPhrase": "jazz music",
    "provider": "SPOTIFY"
  }'

# Play on Amazon Music
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{
    "searchPhrase": "The Beatles",
    "provider": "AMAZON_MUSIC"
  }'
```

**Valid providers**: `SPOTIFY`, `AMAZON_MUSIC`, `TUNEIN`, `APPLE_MUSIC`, `DEEZER`, `I_HEART_RADIO`

**Parameters**:
- `searchPhrase` (string, required): What to search for (e.g., "jazz music", "The Beatles", "relaxing piano")
- `provider` (string, optional): Music provider (defaults to `SPOTIFY`)

### 4. Send Text Command
**POST** `/api/music/text-command`

Send any text command to Alexa (most flexible option)

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

# Play specific artist
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "play The Beatles"}'
```

**Parameters**:
- `text` (string, required): The command to send to Alexa (as if you were speaking to it)

## Test Script

Use the provided test script to try all features:

```bash
# Check current status
python3 scripts/test-music-playback.py status

# Control playback
python3 scripts/test-music-playback.py play
python3 scripts/test-music-playback.py pause
python3 scripts/test-music-playback.py next
python3 scripts/test-music-playback.py prev

# Search and play
python3 scripts/test-music-playback.py search "jazz music"

# Send text command
python3 scripts/test-music-playback.py text "play relaxing music on Spotify"
```

## How It Works

### Playback Controls (play, pause, etc.)

Uses the `/api/np/command` endpoint (like reference script line 786):
- Sends commands like `{"type": "PlayCommand"}` directly to Alexa
- Fast and reliable for basic playback control

### Music Search

Uses the `behaviors/preview` endpoint with `Alexa.Music.PlaySearchPhrase`:
- Similar to how announcements work
- Supports multiple music providers
- Searches and plays automatically

### Text Commands

Uses the `behaviors/preview` endpoint with `Alexa.TextCommand`:
- Most flexible - can send any command Alexa understands
- Works like speaking to Alexa naturally
- Supports complex requests

## Examples

### Play a Genre
```bash
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{"searchPhrase": "classical music", "provider": "SPOTIFY"}'
```

### Play an Artist
```bash
curl -X POST http://localhost:8787/api/music/play \
  -H "Content-Type: application/json" \
  -d '{"searchPhrase": "The Beatles", "provider": "AMAZON_MUSIC"}'
```

### Play a Playlist
```bash
curl -X POST http://localhost:8787/api/music/text-command \
  -H "Content-Type: application/json" \
  -d '{"text": "play my Discover Weekly playlist"}'
```

### Control Playback
```bash
# Start playing
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "play"}'

# Check what's playing
curl http://localhost:8787/api/music

# Skip to next
curl -X POST http://localhost:8787/api/music/control \
  -H "Content-Type: application/json" \
  -d '{"command": "next"}'
```

## Integration with LangGraph/LangChain

These endpoints can be used in your AI agents:

```python
# Play music based on user request
response = await agent.run("Play some relaxing music")
# Agent calls: POST /api/music/play with {"searchPhrase": "relaxing music"}

# Control playback
response = await agent.run("Pause the music")
# Agent calls: POST /api/music/control with {"command": "pause"}
```

## Troubleshooting

### "No routes found" Error
- Make sure the server is running: `pnpm run dev`
- Restart the server after adding new endpoints

### "No Echo device found"
- Ensure you have at least one Alexa device registered and online
- Check `/api/status` to see available devices

### Music doesn't play
- Check that your Alexa device is online
- Verify you have a music subscription (Spotify, Amazon Music, etc.)
- Try using text commands for more natural requests

### 401/403 Errors
- Your cookies may have expired - get fresh ones from Amazon
- Check that `UBID_MAIN` and `AT_MAIN` are set correctly

## Reference

Based on the `alexa-remote-control` reference script:
- Playback controls: Lines 405-410
- Music search: Lines 478-483
- Text commands: Lines 441-444
- NP command endpoint: Line 786
