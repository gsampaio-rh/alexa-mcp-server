#!/usr/bin/env python3
"""
Test script for Alexa music playback functionality.

This script tests various music playback commands using the Alexa MCP server.
It uses the behaviors/preview endpoint similar to how announcements work.

Usage:
    python scripts/test-music-playback.py [command] [args...]

Commands:
    status          - Get current music playback status
    play            - Resume/start playback
    pause           - Pause playback
    next            - Skip to next track
    prev            - Go to previous track
    search <query>  - Search and play music (e.g., "jazz music")
    text <command>  - Send text command to Alexa (e.g., "play jazz on Spotify")
    help            - Show this help message

Examples:
    python scripts/test-music-playback.py status
    python scripts/test-music-playback.py play
    python scripts/test-music-playback.py search "jazz music"
    python scripts/test-music-playback.py text "play relaxing music on Spotify"
"""

#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.parse
from typing import Optional, Dict, Any

# Configuration
API_BASE = "http://localhost:8787"
ALEXA_API_BASE = "https://alexa.amazon.com"

class AlexaMusicTester:
    def __init__(self, api_base: str = API_BASE):
        self.api_base = api_base
    
    def _make_request(self, method: str, url: str, data: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request using urllib"""
        if headers is None:
            headers = {}
        
        if data:
            headers.setdefault("Content-Type", "application/json")
            data_bytes = json.dumps(data).encode('utf-8')
        else:
            data_bytes = None
        
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                response_text = response.read().decode('utf-8')
                if response_text:
                    return json.loads(response_text)
                return {}
        except urllib.error.HTTPError as e:
            error_text = e.read().decode('utf-8') if e.fp else str(e)
            return {"error": f"HTTP {e.code}: {error_text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_device_info(self) -> Dict[str, Any]:
        """Get device information needed for commands"""
        data = self._make_request("GET", f"{self.api_base}/api/status")
        
        if "error" in data:
            raise Exception(f"Failed to get device info: {data['error']}")
        
        if not data.get("connected"):
            raise Exception("Not connected to Alexa")
        
        # Get first Echo device
        devices = data.get("devices", {}).get("list", [])
        echo_device = next((d for d in devices if d.get("family") == "ECHO"), None)
        
        if not echo_device:
            raise Exception("No Echo device found")
        
        return {
            "deviceType": echo_device.get("type"),
            "deviceSerialNumber": echo_device.get("serialNumber", "").replace("...", ""),
            "friendlyName": echo_device.get("name")
        }
    
    def get_customer_id(self) -> str:
        """Get customer ID from /api/users/me"""
        # This would need to be implemented via the server
        # For now, we'll get it from status endpoint if available
        # In production, this should call /api/users/me
        return "amzn1.account.placeholder"  # Placeholder
    
    def get_csrf_token(self) -> str:
        """Get CSRF token - this would need server support"""
        # The server should handle CSRF token fetching
        # For testing, we'll use "1" as fallback
        return "1"
    
    def send_behavior_command(
        self,
        sequence_cmd: str,
        sequence_val: str = "",
        device_type: Optional[str] = None,
        device_serial: Optional[str] = None,
        customer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a behavior command using behaviors/preview endpoint"""
        
        # Get device info if not provided
        if not device_type or not device_serial:
            device_info = self.get_device_info()
            device_type = device_type or device_info["deviceType"]
            device_serial = device_serial or device_info["deviceSerialNumber"]
        
        if not customer_id:
            customer_id = self.get_customer_id()
        
        # Build operation node (like reference script's node() function)
        locale = "en-US"
        operation_payload = {
            "deviceType": device_type,
            "deviceSerialNumber": device_serial,
            "customerId": customer_id,
            "locale": locale
        }
        
        # Add sequence-specific values
        if sequence_val:
            # Parse sequence_val (it's a string like ',"textToSpeak":"..."')
            # For music commands, it might be ',"musicProviderId":"SPOTIFY","searchPhrase":"..."'
            import re
            # Extract key-value pairs from sequence_val
            if sequence_val.startswith(","):
                sequence_val = sequence_val[1:]  # Remove leading comma
            
            # Simple parsing - in production, use proper JSON parsing
            if "musicProviderId" in sequence_val:
                # Extract provider and search phrase
                provider_match = re.search(r'"musicProviderId":"([^"]+)"', sequence_val)
                search_match = re.search(r'"searchPhrase":"([^"]+)"', sequence_val)
                if provider_match:
                    operation_payload["musicProviderId"] = provider_match.group(1)
                if search_match:
                    operation_payload["searchPhrase"] = search_match.group(1)
            elif "textToSpeak" in sequence_val:
                text_match = re.search(r'"textToSpeak":"([^"]+)"', sequence_val)
                if text_match:
                    operation_payload["textToSpeak"] = text_match.group(1)
            elif "text" in sequence_val:
                text_match = re.search(r'"text":"([^"]+)"', sequence_val)
                if text_match:
                    operation_payload["text"] = text_match.group(1)
        
        operation_node = {
            "@type": "com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode",
            "type": sequence_cmd,
            "operationPayload": operation_payload
        }
        
        # Build sequence JSON
        sequence_json = {
            "@type": "com.amazon.alexa.behaviors.model.Sequence",
            "startNode": {
                "@type": "com.amazon.alexa.behaviors.model.ParallelNode",
                "nodesToExecute": [operation_node]
            }
        }
        
        # Build behavior command
        behavior_command = {
            "behaviorId": "PREVIEW",
            "sequenceJson": json.dumps(sequence_json),
            "status": "ENABLED"
        }
        
        # Send via server's announce endpoint (which uses behaviors/preview)
        # Or we could create a dedicated music endpoint
        # For now, let's use a workaround via the server
        
        print(f"📤 Sending command: {sequence_cmd}")
        print(f"   Device: {device_info.get('friendlyName', 'Unknown')} ({device_type})")
        print(f"   Payload: {json.dumps(operation_payload, indent=2)}")
        
        # Note: This would need a new endpoint on the server
        # This method is kept for future use with direct behavior commands
        # Currently, we use the dedicated endpoints instead
        print(f"📤 Would send behavior command: {sequence_cmd}")
        print("   Note: Using dedicated endpoints instead (control, play, text-command)")
        return {"status": "use_dedicated_endpoints"}
    
    def send_text_command(self, text: str) -> Dict[str, Any]:
        """Send a text command to Alexa via the server"""
        print(f"💬 Sending text command: {text}")
        return self._make_request(
            "POST",
            f"{self.api_base}/api/music/text-command",
            data={"text": text}
        )
        print("   This would send the command to Alexa via behaviors/preview endpoint.")
        
        return {
            "status": "not_implemented",
            "message": "Music control endpoints need to be added to the server",
            "command": text,
            "note": "See TODO: Add /api/music/control endpoint"
        }
    
    def send_np_command(self, command_type: str) -> Dict[str, Any]:
        """Send a now-playing command (play, pause, next, prev)"""
        device_info = self.get_device_info()
        
        command_map = {
            "play": {"type": "PlayCommand"},
            "pause": {"type": "PauseCommand"},
            "next": {"type": "NextCommand"},
            "prev": {"type": "PreviousCommand"},
            "forward": {"type": "ForwardCommand"},
            "rewind": {"type": "RewindCommand"},
        }
        
        if command_type not in command_map:
            raise ValueError(f"Unknown command: {command_type}")
        
        command_json = command_map[command_type]
        
        # Use /api/np/command endpoint (like reference script line 786)
        url = f"{ALEXA_API_BASE}/api/np/command"
        params = {
            "deviceSerialNumber": device_info["deviceSerialNumber"],
            "deviceType": device_info["deviceType"]
        }
        
        print(f"📤 Sending {command_type} command to {device_info['friendlyName']}")
        
        # Use the music control endpoint
        return self._make_request(
            "POST",
            f"{self.api_base}/api/music/control",
            data={"command": command_type}
        )
    
    def get_music_status(self) -> Dict[str, Any]:
        """Get current music playback status"""
        return self._make_request("GET", f"{self.api_base}/api/music")
    
    def play_music_search(self, search_phrase: str, provider: str = "SPOTIFY") -> Dict[str, Any]:
        """Play music using search phrase"""
        print(f"🔍 Searching for: {search_phrase}")
        print(f"📻 Provider: {provider}")
        return self._make_request(
            "POST",
            f"{self.api_base}/api/music/play",
            data={
                "searchPhrase": search_phrase,
                "provider": provider
            }
        )
    
    def close(self):
        """Close the HTTP client (no-op for urllib)"""
        pass

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    tester = AlexaMusicTester()
    
    try:
        if command == "status":
            print("🎵 Getting music status...")
            status = tester.get_music_status()
            print(json.dumps(status, indent=2))
            
        elif command in ["play", "pause", "next", "prev", "forward", "rewind"]:
            print(f"🎮 Sending {command} command...")
            result = tester.send_np_command(command)
            print(json.dumps(result, indent=2))
            
        elif command == "search":
            if len(sys.argv) < 3:
                print("❌ Error: Please provide a search phrase")
                print("Usage: python test-music-playback.py search 'jazz music'")
                sys.exit(1)
            
            search_phrase = " ".join(sys.argv[2:])
            provider = "SPOTIFY"  # Default provider
            
            print(f"🔍 Searching for: {search_phrase}")
            print(f"📻 Provider: {provider}")
            result = tester.play_music_search(search_phrase, provider)
            print(json.dumps(result, indent=2))
            
        elif command == "text":
            if len(sys.argv) < 3:
                print("❌ Error: Please provide a text command")
                print("Usage: python test-music-playback.py text 'play jazz music'")
                sys.exit(1)
            
            text = " ".join(sys.argv[2:])
            print(f"💬 Sending text command: {text}")
            result = tester.send_text_command(text)
            print(json.dumps(result, indent=2))
            
        elif command == "help":
            print(__doc__)
            
        else:
            print(f"❌ Unknown command: {command}")
            print(__doc__)
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        tester.close()

if __name__ == "__main__":
    main()
