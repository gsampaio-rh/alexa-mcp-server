# Alexa MCP Server Integration Guide for LangGraph & LangChain

## Table of Contents

1. [Overview](#overview)
2. [What is MCP?](#what-is-mcp)
3. [Quick Start](#quick-start)
4. [LangGraph Integration](#langgraph-integration)
5. [LangChain Integration](#langchain-integration)
6. [Available Tools](#available-tools)
7. [Example Agent Workflows](#example-agent-workflows)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The **Alexa MCP Server** provides a Model Context Protocol (MCP) interface to control Amazon Alexa devices and smart home systems. This guide shows LangGraph and LangChain developers how to integrate this server into their AI agent applications.

### Key Features

- 🎤 **Voice Announcements** - Send text-to-speech announcements to Alexa devices
- 💡 **Smart Light Control** - Control brightness, color, and power state
- 🌡️ **Sensor Monitoring** - Access temperature, illuminance, and motion sensors
- 🎵 **Music Status** - Get current playback information from Alexa/Spotify
- 🔊 **Volume Control** - Adjust device volumes programmatically
- 🏠 **Device Discovery** - List and manage all smart home devices
- 🔕 **Do Not Disturb** - Control DND mode on devices

### Why Use MCP?

- **Standardized Protocol**: MCP is an open protocol for connecting AI agents to external tools
- **Type Safety**: Full TypeScript/Zod schema validation
- **Agent-Friendly**: Tools are designed with AI agent usage in mind
- **Real-time Context**: Access live sensor data and device states
- **Production Ready**: Built on Cloudflare Workers for scalability

---

## What is MCP?

**Model Context Protocol (MCP)** is a standardized way for AI applications to interact with external tools and data sources. Think of it as a universal adapter that lets your LangGraph/LangChain agents seamlessly control real-world devices.

### MCP Architecture

```
┌─────────────────┐         MCP Protocol         ┌──────────────────┐
│                 │ ◄──────────────────────────► │                  │
│  LangGraph/     │    (SSE or HTTP)             │  Alexa MCP       │
│  LangChain      │                              │  Server          │
│  Agent          │                              │                  │
└─────────────────┘                              └──────────────────┘
                                                          │
                                                          │ HTTP API
                                                          ▼
                                                  ┌──────────────────┐
                                                  │  Amazon Alexa    │
                                                  │  API             │
                                                  └──────────────────┘
```

### Transport Methods

The server supports two transport methods:

1. **Server-Sent Events (SSE)** - `/sse` endpoint (recommended)
2. **HTTP** - `/mcp` endpoint

---

## Quick Start

> **Note**: For local development, the server runs at `http://localhost:8787`. All code examples in this guide default to localhost. Change to your production Cloudflare Workers URL when deploying.

### Prerequisites

- Node.js 18+ or Python 3.9+
- An Amazon Alexa account with at least one Echo device
- Alexa cookies (`ubid-main` and `at-main`) - see [SETUP.md](../SETUP.md)

### 1. Deploy the MCP Server

**For Local Development:**

```bash
# Clone the repository
git clone <repository-url>
cd alexa-mcp-server

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Alexa cookies (UBID_MAIN and AT_MAIN)

# Start local development server
pnpm run dev

# Server will run at: http://localhost:8787
```

**For Production (Cloudflare Workers):**

```bash
# After local setup above, deploy to Cloudflare Workers
pnpm run deploy
```

### 2. Get Your Server URL

**For Local Development:**
```bash
# Start local development server
pnpm run dev

# Server runs at:
http://localhost:8787
```

**For Production (Cloudflare Workers):**
After deployment, you'll get a URL like:
```
https://alexa-mcp-server.your-username.workers.dev
```

### 3. Test the Connection

**Local:**
```bash
curl http://localhost:8787/health
```

**Production:**
```bash
curl https://your-server-url.workers.dev/health
```

---

## LangGraph Integration

### Installation

```bash
pip install langgraph langchain langchain-openai
```

### Basic Setup

```python
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import httpx
import json

# MCP Server Configuration
# For local development, use: http://localhost:8787
# For production, use your Cloudflare Workers URL
MCP_SERVER_URL = "http://localhost:8787"  # Change to your production URL when deployed
MCP_SSE_ENDPOINT = f"{MCP_SERVER_URL}/sse"

class AlexaAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.mcp_client = httpx.AsyncClient()
        
    async def call_mcp_tool(self, tool_name: str, args: dict):
        """Call an MCP tool via HTTP"""
        response = await self.mcp_client.post(
            f"{MCP_SERVER_URL}/api/{tool_name}",
            json=args
        )
        return response.json()
    
    async def list_available_tools(self):
        """Get list of available MCP tools"""
        # In production, use MCP protocol to discover tools
        # For now, we'll use direct API calls
        return [
            "alexa_announce",
            "list_lights",
            "set_light_power",
            "set_light_brightness",
            "set_light_color",
            "get_bedroom_state",
            "get_music_status",
            "get_device_volumes",
            "set_device_volume",
            "get_all_sensor_data",
            "list_smarthome_devices",
            "get_dnd_status",
            "set_dnd_status",
        ]

# Define the agent state
from typing import TypedDict, List, Annotated
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[List, add_messages]
    tool_calls: List[dict]
    tool_results: List[dict]

# Create the graph
def create_alexa_agent():
    agent = AlexaAgent()
    
    def should_use_tool(state: AgentState) -> str:
        """Determine if we should use a tool or respond"""
        last_message = state["messages"][-1]
        if isinstance(last_message, HumanMessage):
            content = last_message.content.lower()
            # Check if user wants to control Alexa
            alexa_keywords = ["alexa", "light", "announce", "volume", "music", "sensor"]
            if any(keyword in content for keyword in alexa_keywords):
                return "use_tool"
        return "respond"
    
    async def use_tool(state: AgentState) -> AgentState:
        """Use MCP tools to interact with Alexa"""
        last_message = state["messages"][-1]
        content = last_message.content
        
        # Parse user intent and call appropriate tool
        # This is simplified - in production, use LLM to determine tool and args
        if "turn on light" in content.lower():
            result = await agent.call_mcp_tool("set_light_power", {"on": True})
            state["tool_results"].append(result)
        elif "announce" in content.lower():
            # Extract message from user input
            message = content.replace("announce", "").strip()
            result = await agent.call_mcp_tool("alexa_announce", {
                "name": "Assistant",
                "message": message
            })
            state["tool_results"].append(result)
        
        return state
    
    async def respond(state: AgentState) -> AgentState:
        """Generate response using LLM"""
        messages = state["messages"]
        if state["tool_results"]:
            # Include tool results in context
            tool_context = "\n".join([
                f"Tool Result: {json.dumps(r)}" for r in state["tool_results"]
            ])
            messages.append(SystemMessage(content=f"Tool Results:\n{tool_context}"))
        
        response = await agent.llm.ainvoke(messages)
        state["messages"].append(response)
        return state
    
    # Build the graph
    workflow = StateGraph(AgentState)
    workflow.add_node("use_tool", use_tool)
    workflow.add_node("respond", respond)
    
    workflow.set_entry_point("use_tool")
    workflow.add_conditional_edges(
        "use_tool",
        should_use_tool,
        {
            "use_tool": "use_tool",
            "respond": "respond"
        }
    )
    workflow.add_edge("respond", END)
    
    return workflow.compile()

# Usage
async def main():
    agent = create_alexa_agent()
    
    result = await agent.ainvoke({
        "messages": [HumanMessage(content="Turn on the lights")],
        "tool_calls": [],
        "tool_results": []
    })
    
    print(result["messages"][-1].content)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Advanced: Using MCP Protocol Directly

For production use, connect via MCP protocol for better tool discovery:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

async def connect_to_mcp():
    """Connect to MCP server via SSE"""
    # MCP SSE client implementation
    # This requires an MCP client library
    async with ClientSession() as session:
        # List available tools
        tools = await session.list_tools()
        print(f"Available tools: {[t.name for t in tools.tools]}")
        
        # Call a tool
        result = await session.call_tool(
            "alexa_announce",
            arguments={
                "name": "Assistant",
                "message": "Hello from LangGraph!"
            }
        )
        return result
```

---

## LangChain Integration

### Installation

```bash
pip install langchain langchain-openai langchain-community
```

### Using LangChain Tools

```python
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
import httpx
import json

# MCP Server URL
# For local development: http://localhost:8787
# For production: https://your-server-url.workers.dev
MCP_SERVER_URL = "http://localhost:8787"  # Change to production URL when deployed

# Create HTTP client
mcp_client = httpx.Client()

def create_mcp_tool(name: str, description: str, endpoint: str):
    """Create a LangChain tool wrapper for MCP endpoints"""
    def tool_func(**kwargs):
        # Map tool name to API endpoint
        api_endpoint = f"{MCP_SERVER_URL}/api/{endpoint}"
        response = mcp_client.post(api_endpoint, json=kwargs)
        return json.dumps(response.json())
    
    return Tool(
        name=name,
        func=tool_func,
        description=description
    )

# Create tools
alexa_tools = [
    create_mcp_tool(
        "alexa_announce",
        "Send voice announcements to Alexa devices. Input: name (device name), message (text to announce)",
        "announce"
    ),
    create_mcp_tool(
        "list_lights",
        "List all available smart lights and their capabilities",
        "lights"
    ),
    create_mcp_tool(
        "set_light_power",
        "Turn smart light on or off. Input: on (boolean), id (optional light ID)",
        "lights/power"
    ),
    create_mcp_tool(
        "set_light_brightness",
        "Set smart light brightness 0-100%. Input: level (0-100), id (optional)",
        "lights/brightness"
    ),
    create_mcp_tool(
        "get_bedroom_state",
        "Get bedroom temperature, illuminance, and light status",
        "bedroom"
    ),
    create_mcp_tool(
        "get_music_status",
        "Get current music playback status from Alexa/Spotify",
        "music"
    ),
    create_mcp_tool(
        "set_device_volume",
        "Set volume level 0-100 for Alexa device. Input: volume (0-100)",
        "volume/set"
    ),
]

# Initialize agent
llm = ChatOpenAI(model="gpt-4", temperature=0)

agent = initialize_agent(
    tools=alexa_tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)

# Use the agent
response = agent.run("Turn on the lights and announce that dinner is ready")
print(response)
```

### Using LangChain's MCP Integration (Coming Soon)

LangChain is adding native MCP support. When available:

```python
from langchain.agents import AgentExecutor
from langchain_mcp import MCPToolkit
from langchain_openai import ChatOpenAI

# Connect to MCP server
# For local: http://localhost:8787/sse
# For production: https://your-server-url.workers.dev/sse
toolkit = MCPToolkit.from_mcp_server(
    server_url="http://localhost:8787/sse"  # Change to production URL when deployed
)

# Get tools
tools = toolkit.get_tools()

# Create agent
llm = ChatOpenAI(model="gpt-4")
agent = AgentExecutor.from_agent_and_tools(
    agent=create_openai_functions_agent(llm, tools),
    tools=tools,
    verbose=True
)

# Use agent
response = agent.invoke({
    "input": "Check the bedroom temperature and turn on the lights if it's cold"
})
```

---

## Available Tools

### 1. Announcements

**Tool**: `alexa_announce`

Send voice announcements to Alexa devices with smart suppression (won't announce at night if lights are off).

```python
# LangChain
result = agent.run("Announce 'Dinner is ready' to the kitchen")

# Direct API
POST /api/announce
{
  "name": "Kitchen",
  "message": "Dinner is ready",
  "ssml": "<speak>Dinner is <break time='500ms'/> ready</speak>"  # Optional
}
```

**Parameters**:
- `name` (string, required): Device name or location
- `message` (string, required): Text to announce (max 145 chars)
- `ssml` (string, optional): SSML-formatted text (max 500 chars)

**Response**:
```json
{
  "success": true,
  "playbackStatus": "PLAYING",
  "deliveredTime": "2026-02-03T22:30:00Z"
}
```

### 2. Light Control

#### List Lights
**Tool**: `list_lights`

```python
result = agent.run("What lights do I have?")
```

#### Set Light Power
**Tool**: `set_light_power`

```python
# Turn on
result = agent.run("Turn on the lights")

# Turn off
result = agent.run("Turn off the bedroom light")
```

**Parameters**:
- `on` (boolean, required): True to turn on, false to turn off
- `id` (string, optional): Light ID (auto-detected if only one light)

#### Set Brightness
**Tool**: `set_light_brightness`

```python
result = agent.run("Set lights to 75% brightness")
```

**Parameters**:
- `level` (number, required): Brightness 0-100
- `id` (string, optional): Light ID
- `transitionMs` (number, optional): Transition duration in milliseconds

#### Set Color
**Tool**: `set_light_color`

```python
# By color name
result = agent.run("Set lights to blue")

# By Kelvin temperature
result = agent.run("Set lights to warm white (3000K)")
```

**Parameters**:
- `mode` (string, required): `"name"`, `"hex"`, `"hsv"`, or `"kelvin"`
- `value` (string/number, required): Color value based on mode
- `id` (string, optional): Light ID
- `transitionMs` (number, optional): Transition duration

**Supported Colors**:
- Names: `red`, `blue`, `green`, `yellow`, `purple`, `pink`, `orange`, `white`, `warm_white`, `cool_white`, etc.
- Kelvin: 2000-6500K

### 3. Bedroom Monitoring

**Tool**: `get_bedroom_state`

Get temperature, illuminance, and light status for context-aware decisions.

```python
result = agent.run("What's the bedroom temperature and light status?")
```

**Response**:
```json
{
  "temperature": {
    "value": 22.5,
    "unit": "celsius"
  },
  "illuminance": {
    "value": 150,
    "unit": "lux"
  },
  "light": {
    "on": true,
    "brightness": 75
  }
}
```

### 4. Music Status

**Tool**: `get_music_status`

Get current playback information from Alexa/Spotify.

```python
result = agent.run("What's playing on Alexa?")
```

**Response**:
```json
{
  "isPlaying": true,
  "trackName": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "provider": "spotify",
  "coverUrl": "https://...",
  "mediaProgress": 120,
  "mediaLength": 240
}
```

### 5. Volume Control

#### Get Volumes
**Tool**: `get_device_volumes`

```python
result = agent.run("What are the current volume levels?")
```

#### Set Volume
**Tool**: `set_device_volume`

```python
result = agent.run("Set volume to 50%")
```

**Parameters**:
- `volume` (number, required): 0-100
- `deviceType` (string, optional): Device type (auto-detected)
- `dsn` (string, optional): Device serial number (auto-detected)

#### Adjust Volume
**Tool**: `adjust_device_volume`

```python
result = agent.run("Turn volume up by 10")
```

**Parameters**:
- `amount` (number, required): -100 to +100
- `deviceType` (string, optional)
- `dsn` (string, optional)

### 6. Sensors

**Tool**: `get_all_sensor_data`

Get comprehensive sensor readings.

```python
result = agent.run("Get all sensor readings")
```

**Response**:
```json
{
  "sensors": [
    {
      "entityId": "...",
      "friendlyName": "Echo Dot",
      "temperature": 22.5,
      "illuminance": 150,
      "motion": false
    }
  ]
}
```

### 7. Device Discovery

**Tool**: `list_smarthome_devices`

List all smart home devices with capabilities.

```python
result = agent.run("List all my smart home devices")
```

### 8. Do Not Disturb

#### Get DND Status
**Tool**: `get_dnd_status`

```python
result = agent.run("Check Do Not Disturb status")
```

#### Set DND Status
**Tool**: `set_dnd_status`

```python
# Enable DND
result = agent.run("Enable Do Not Disturb")

# Disable DND
result = agent.run("Turn off Do Not Disturb")
```

**Parameters**:
- `enabled` (boolean, required): True to enable, false to disable
- `deviceSerialNumber` (string, optional): Device serial (uses primary device if not specified)
- `deviceType` (string, optional): Device type

---

## Example Agent Workflows

### 1. Smart Home Assistant

An agent that monitors your home and takes actions based on context.

```python
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import httpx

class SmartHomeAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.mcp_client = httpx.AsyncClient()
        # For local development: http://localhost:8787
        # For production: https://your-server-url.workers.dev
        self.api_base = "http://localhost:8787"
    
    async def get_bedroom_state(self):
        """Get bedroom sensor data"""
        response = await self.mcp_client.get(f"{self.api_base}/api/bedroom")
        return response.json()
    
    async def control_lights(self, on: bool, brightness: int = None):
        """Control lights"""
        data = {"on": on}
        if brightness is not None:
            data["level"] = brightness
        response = await self.mcp_client.post(
            f"{self.api_base}/api/lights/power",
            json=data
        )
        return response.json()
    
    async def announce(self, message: str):
        """Send announcement"""
        response = await self.mcp_client.post(
            f"{self.api_base}/api/announce",
            json={"name": "Home", "message": message}
        )
        return response.json()
    
    async def run(self, user_input: str):
        """Run the agent workflow"""
        # Get context
        bedroom = await self.get_bedroom_state()
        temp = bedroom.get("temperature", {}).get("value", 0)
        
        # Decision logic
        if temp < 18:
            await self.control_lights(on=True, brightness=80)
            await self.announce("It's getting cold. I've turned on the lights.")
        
        # Use LLM for complex reasoning
        messages = [
            SystemMessage(content=f"Bedroom temp: {temp}°C"),
            HumanMessage(content=user_input)
        ]
        response = await self.llm.ainvoke(messages)
        return response.content

# Usage
agent = SmartHomeAgent()
result = await agent.run("It feels cold in here")
```

### 2. Morning Routine Agent

An agent that helps with morning routines.

```python
class MorningRoutineAgent:
    def __init__(self):
        self.mcp_client = httpx.AsyncClient()
        # For local development: http://localhost:8787
        # For production: https://your-server-url.workers.dev
        self.api_base = "http://localhost:8787"
    
    async def execute_morning_routine(self):
        """Execute morning routine"""
        # 1. Check bedroom state
        bedroom = await self.mcp_client.get(f"{self.api_base}/api/bedroom")
        bedroom_data = bedroom.json()
        
        # 2. Gradually increase light brightness
        for brightness in [20, 40, 60, 80, 100]:
            await self.mcp_client.post(
                f"{self.api_base}/api/lights/brightness",
                json={"level": brightness}
            )
            await asyncio.sleep(2)
        
        # 3. Check music status
        music = await self.mcp_client.get(f"{self.api_base}/api/music")
        music_data = music.json()
        
        # 4. Announce morning greeting
        temp = bedroom_data.get("temperature", {}).get("value", 0)
        greeting = f"Good morning! It's {temp} degrees. "
        if music_data.get("isPlaying"):
            greeting += f"Currently playing: {music_data.get('trackName')}"
        
        await self.mcp_client.post(
            f"{self.api_base}/api/announce",
            json={"name": "Bedroom", "message": greeting}
        )
        
        return "Morning routine completed"

# Usage
agent = MorningRoutineAgent()
await agent.execute_morning_routine()
```

### 3. Context-Aware Announcement Agent

An agent that makes smart decisions about when to announce.

```python
class SmartAnnouncementAgent:
    def __init__(self):
        self.mcp_client = httpx.AsyncClient()
        # For local development: http://localhost:8787
        # For production: https://your-server-url.workers.dev
        self.api_base = "http://localhost:8787"
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    async def should_announce(self, message: str, urgency: str = "medium"):
        """Determine if announcement should be made"""
        # Get current context
        bedroom = await self.mcp_client.get(f"{self.api_base}/api/bedroom")
        bedroom_data = bedroom.json()
        
        music = await self.mcp_client.get(f"{self.api_base}/api/music")
        music_data = music.json()
        
        # Check if it's night time (lights off)
        lights_on = bedroom_data.get("light", {}).get("on", False)
        is_playing = music_data.get("isPlaying", False)
        
        # Decision logic
        if urgency == "high":
            return True  # Always announce urgent messages
        
        if not lights_on:
            # Night time - only announce if urgent
            return urgency == "high"
        
        if is_playing:
            # Music is playing - might want to lower volume first
            return urgency in ["high", "medium"]
        
        return True
    
    async def announce(self, message: str, urgency: str = "medium"):
        """Make smart announcement"""
        should = await self.should_announce(message, urgency)
        
        if not should:
            return {"skipped": True, "reason": "Context not suitable for announcement"}
        
        # Adjust volume if needed
        if urgency == "high":
            # Ensure volume is audible
            await self.mcp_client.post(
                f"{self.api_base}/api/volume/set",
                json={"volume": 70}
            )
        
        # Make announcement
        response = await self.mcp_client.post(
            f"{self.api_base}/api/announce",
            json={"name": "Home", "message": message}
        )
        
        return response.json()

# Usage
agent = SmartAnnouncementAgent()
await agent.announce("Dinner is ready", urgency="high")
```

### 4. Multi-Step Workflow with LangGraph

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage

class WorkflowState(TypedDict):
    messages: Annotated[List, add_messages]
    bedroom_state: dict
    lights_state: dict
    action_taken: bool

def create_smart_home_workflow():
    mcp_client = httpx.AsyncClient()
    # For local development: http://localhost:8787
    # For production: https://your-server-url.workers.dev
    api_base = "http://localhost:8787"
    
    async def check_bedroom(state: WorkflowState) -> WorkflowState:
        """Check bedroom state"""
        response = await mcp_client.get(f"{api_base}/api/bedroom")
        state["bedroom_state"] = response.json()
        return state
    
    async def check_lights(state: WorkflowState) -> WorkflowState:
        """Check light state"""
        response = await mcp_client.get(f"{api_base}/api/lights")
        state["lights_state"] = response.json()
        return state
    
    async def decide_action(state: WorkflowState) -> WorkflowState:
        """Decide what action to take"""
        temp = state["bedroom_state"].get("temperature", {}).get("value", 0)
        lights_on = state["bedroom_state"].get("light", {}).get("on", False)
        
        if temp < 18 and not lights_on:
            # Turn on lights if cold and dark
            await mcp_client.post(
                f"{api_base}/api/lights/power",
                json={"on": True, "level": 75}
            )
            state["action_taken"] = True
            state["messages"].append(
                AIMessage(content="Turned on lights because it's cold and dark")
            )
        
        return state
    
    # Build graph
    workflow = StateGraph(WorkflowState)
    workflow.add_node("check_bedroom", check_bedroom)
    workflow.add_node("check_lights", check_lights)
    workflow.add_node("decide_action", decide_action)
    
    workflow.set_entry_point("check_bedroom")
    workflow.add_edge("check_bedroom", "check_lights")
    workflow.add_edge("check_lights", "decide_action")
    workflow.add_edge("decide_action", END)
    
    return workflow.compile()

# Usage
workflow = create_smart_home_workflow()
result = await workflow.ainvoke({
    "messages": [HumanMessage(content="Check the home and adjust if needed")],
    "bedroom_state": {},
    "lights_state": {},
    "action_taken": False
})
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```python
async def safe_mcp_call(tool_name: str, args: dict):
    """Safely call MCP tool with error handling"""
    try:
        response = await mcp_client.post(
            f"{api_base}/api/{tool_name}",
            json=args,
            timeout=10.0
        )
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### 2. Rate Limiting

Respect rate limits and add delays between requests:

```python
import asyncio

async def controlled_sequence(actions: List[callable]):
    """Execute actions with rate limiting"""
    for action in actions:
        await action()
        await asyncio.sleep(1)  # 1 second delay between actions
```

### 3. Caching

Cache device states to reduce API calls:

```python
from functools import lru_cache
from datetime import datetime, timedelta

class CachedMCPClient:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = timedelta(seconds=30)
    
    async def get_bedroom_state(self):
        """Get bedroom state with caching"""
        cache_key = "bedroom_state"
        if cache_key in self.cache:
            cached_time, cached_data = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                return cached_data
        
        # Fetch fresh data
        response = await mcp_client.get(f"{api_base}/api/bedroom")
        data = response.json()
        self.cache[cache_key] = (datetime.now(), data)
        return data
```

### 4. Context Awareness

Always check context before taking actions:

```python
async def smart_light_control(desired_state: bool):
    """Smart light control that checks context"""
    # Get current state
    bedroom = await get_bedroom_state()
    current_state = bedroom.get("light", {}).get("on", False)
    
    # Only change if different
    if current_state != desired_state:
        await set_light_power(desired_state)
        return f"Lights turned {'on' if desired_state else 'off'}"
    else:
        return f"Lights already {'on' if desired_state else 'off'}"
```

### 5. User Feedback

Always provide feedback to users:

```python
async def announce_with_feedback(message: str):
    """Announce and confirm"""
    result = await alexa_announce("Home", message)
    
    if result.get("success"):
        return f"✅ Announced: {message}"
    else:
        return f"❌ Failed to announce: {result.get('error')}"
```

### 6. Tool Selection

Let the LLM choose tools dynamically:

```python
from langchain.tools import StructuredTool
from pydantic import BaseModel

class AnnounceInput(BaseModel):
    message: str
    urgency: str = "medium"

announce_tool = StructuredTool.from_function(
    func=lambda m, u="medium": alexa_announce("Home", m, u),
    name="alexa_announce",
    description="Send announcement to Alexa. Use for important messages.",
    args_schema=AnnounceInput
)

# Agent will intelligently choose when to use this tool
agent = initialize_agent(
    tools=[announce_tool, ...],
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS
)
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Errors

**Problem**: Cannot connect to MCP server

**Solutions**:
- Verify server URL is correct
  - Local: `http://localhost:8787`
  - Production: `https://your-server-url.workers.dev`
- Check if server is running
  - Local: `pnpm run dev` should be running
  - Production: Verify deployment status
- Test with:
  - Local: `curl http://localhost:8787/health`
  - Production: `curl https://your-server-url.workers.dev/health`

#### 2. Authentication Errors

**Problem**: 401/403 errors

**Solutions**:
- Check that cookies are set correctly in `.env`
- Cookies may have expired - get fresh ones from Amazon
- Verify `UBID_MAIN` and `AT_MAIN` are correct

#### 3. Tool Not Found

**Problem**: Tool doesn't exist or wrong name

**Solutions**:
- Check available tools: `GET /api/status`
- Verify tool name matches exactly (case-sensitive)
- Check tool documentation above

#### 4. Rate Limiting

**Problem**: Too many requests

**Solutions**:
- Add delays between requests
- Implement caching
- Batch operations when possible

#### 5. Device Not Found

**Problem**: Device ID not found

**Solutions**:
- List devices first: `list_smarthome_devices`
- Use auto-detection (don't specify ID if only one device)
- Verify device is online

### Debug Mode

Enable verbose logging:

```python
import logging

logging.basicConfig(level=logging.DEBUG)

# LangChain verbose mode
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True  # Enable verbose output
)
```

### Testing Individual Tools

Test tools independently before integrating:

```python
# Test announcement
# For local: api_base = "http://localhost:8787"
# For production: api_base = "https://your-server-url.workers.dev"
api_base = "http://localhost:8787"

response = await mcp_client.post(
    f"{api_base}/api/announce",
    json={"name": "Test", "message": "Hello"}
)
print(response.json())

# Test light control
response = await mcp_client.get(f"{api_base}/api/lights")
print(response.json())
```

---

## Additional Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **LangGraph Documentation**: https://langchain-ai.github.io/langgraph/
- **LangChain Documentation**: https://python.langchain.com
- **Server API Docs**: See [TEST_COMMANDS.md](../TEST_COMMANDS.md)
- **Setup Guide**: See [SETUP.md](../SETUP.md)

---

## Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
2. Review server logs
3. Test with direct API calls first
4. Open an issue on GitHub

---

**Happy Building! 🚀**

This MCP server enables your AI agents to control real-world devices, making them truly useful assistants for smart home automation.
