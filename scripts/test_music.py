#!/usr/bin/env python3
"""
Test script for Alexa music playback functionality.

This script tests various music control features:
- Get current music status
- Basic playback controls (play, pause, next, prev)
- Music search and playback
- Text commands to Alexa

Usage:
    python scripts/test_music.py [command] [args...]

Examples:
    python scripts/test_music.py status
    python scripts/test_music.py play
    python scripts/test_music.py pause
    python scripts/test_music.py next
    python scripts/test_music.py prev
    python scripts/test_music.py search SPOTIFY "jazz music"
    python scripts/test_music.py text "play jazz music on Spotify"
"""

import sys
import json
import httpx
import asyncio
from typing import Optional

# Configuration
API_BASE = "http://localhost:8787"  # Change to production URL when deployed

class AlexaMusicTester:
    def __init__(self, api_base: str = API_BASE):
        self.api_base = api_base
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_music_status(self):
        """Get current music playback status"""
        print("🎵 Getting music status...")
        try:
            response = await self.client.get(f"{self.api_base}/api/music")
            response.raise_for_status()
            data = response.json()
            
            print("\n📊 Music Status:")
            print(f"  Playing: {'✅ Yes' if data.get('isPlaying') else '❌ No'}")
            if data.get('isPlaying'):
                print(f"  Track: {data.get('trackName', 'Unknown')}")
                print(f"  Artist: {data.get('artist', 'Unknown')}")
                print(f"  Album: {data.get('album', 'Unknown')}")
                print(f"  Provider: {data.get('provider', 'Unknown')}")
                if data.get('mediaProgress') and data.get('mediaLength'):
                    progress = (data.get('mediaProgress', 0) / data.get('mediaLength', 1)) * 100
                    print(f"  Progress: {data.get('mediaProgress')}s / {data.get('mediaLength')}s ({progress:.1f}%)")
            return data
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    async def send_text_command(self, text: str):
        """Send a text command to Alexa (like speaking to it)"""
        print(f"💬 Sending text command: '{text}'")
        
        # This uses the behaviors/preview endpoint with Alexa.TextCommand
        # We need to get device info first
        try:
            # Get device info
            status_response = await self.client.get(f"{self.api_base}/api/status")
            status_response.raise_for_status()
            status_data = status_response.json()
            
            if not status_data.get('connected'):
                print("❌ Not connected to Alexa")
                return None
            
            # Get first device
            devices = status_data.get('devices', {}).get('list', [])
            if not devices:
                print("❌ No devices found")
                return None
            
            device = devices[0]
            device_type = device.get('type')
            device_serial = device.get('serialNumber', '').replace('...', '')
            
            print(f"📱 Using device: {device.get('name')} ({device_type})")
            
            # Get customer ID (we'll need to call /api/users/me or use account info)
            # For now, we'll use the behaviors/preview endpoint
            # This requires implementing a new endpoint, so let's use a workaround
            
            print("⚠️  Text command requires new API endpoint implementation")
            print("   This feature needs to be added to the server")
            return None
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    async def play_music_search(self, provider: str, search_phrase: str):
        """Play music using search phrase"""
        print(f"🔍 Searching for: '{search_phrase}' on {provider}")
        
        # This uses Alexa.Music.PlaySearchPhrase via behaviors/preview
        # We need to implement this endpoint first
        print("⚠️  Music search requires new API endpoint implementation")
        print("   This feature needs to be added to the server")
        return None
    
    async def control_playback(self, command: str):
        """Control music playback (play, pause, next, prev)"""
        print(f"🎮 Sending playback command: {command}")
        
        # These commands use /api/np/command endpoint
        # We need device info
        try:
            status_response = await self.client.get(f"{self.api_base}/api/status")
            status_response.raise_for_status()
            status_data = status_response.json()
            
            if not status_data.get('connected'):
                print("❌ Not connected to Alexa")
                return None
            
            devices = status_data.get('devices', {}).get('list', [])
            if not devices:
                print("❌ No devices found")
                return None
            
            device = devices[0]
            device_type = device.get('type')
            device_serial = device.get('serialNumber', '').replace('...', '')
            
            print(f"📱 Using device: {device.get('name')} ({device_type})")
            
            # Map command to JSON
            command_map = {
                'play': {'type': 'PlayCommand'},
                'pause': {'type': 'PauseCommand'},
                'next': {'type': 'NextCommand'},
                'prev': {'type': 'PreviousCommand'},
                'forward': {'type': 'ForwardCommand'},
                'rewind': {'type': 'RewindCommand'},
            }
            
            if command.lower() not in command_map:
                print(f"❌ Unknown command: {command}")
                print(f"   Available: {', '.join(command_map.keys())}")
                return None
            
            command_json = command_map[command.lower()]
            
            # This endpoint needs to be implemented
            print("⚠️  Playback control requires new API endpoint implementation")
            print(f"   Would send: {json.dumps(command_json)}")
            print("   Endpoint: /api/music/control")
            return None
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

async def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\n📋 Available commands:")
        print("  status                    - Get current music status")
        print("  play                      - Play music")
        print("  pause                     - Pause music")
        print("  next                      - Next track")
        print("  prev                      - Previous track")
        print("  search <provider> <query> - Search and play music")
        print("  text <command>            - Send text command to Alexa")
        print("\nExample providers: SPOTIFY, AMAZON_MUSIC, TUNEIN")
        sys.exit(1)
    
    tester = AlexaMusicTester()
    command = sys.argv[1].lower()
    
    try:
        if command == "status":
            await tester.get_music_status()
        
        elif command in ["play", "pause", "next", "prev", "forward", "rewind"]:
            await tester.control_playback(command)
        
        elif command == "search":
            if len(sys.argv) < 4:
                print("❌ Usage: search <provider> <query>")
                print("   Example: search SPOTIFY 'jazz music'")
                sys.exit(1)
            provider = sys.argv[2]
            query = " ".join(sys.argv[3:])
            await tester.play_music_search(provider, query)
        
        elif command == "text":
            if len(sys.argv) < 3:
                print("❌ Usage: text <command>")
                print("   Example: text 'play jazz music on Spotify'")
                sys.exit(1)
            text = " ".join(sys.argv[2:])
            await tester.send_text_command(text)
        
        else:
            print(f"❌ Unknown command: {command}")
            print(__doc__)
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.client.aclose()

if __name__ == "__main__":
    asyncio.run(main())
