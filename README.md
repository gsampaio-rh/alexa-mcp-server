# Alexa MCP Server

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI agents to control Amazon Alexa devices and smart home systems. Built with TypeScript and Hono.js.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 Overview

Transform your Amazon Alexa ecosystem into an AI-controllable smart home system. This server exposes Alexa devices, smart home controls, and sensor data through a standardized MCP interface, making it easy to integrate with LangGraph, LangChain, Claude Desktop, and other AI agent frameworks.

## ✨ Features

### 🎤 Voice & Communication
- **Voice Announcements** - Send text-to-speech announcements to any Alexa device
- **SSML Support** - Advanced speech synthesis with pauses, emphasis, and more

### 🎵 Music Control
- **Playback Control** - Play, pause, skip tracks, adjust volume
- **Music Search** - Search and play music from Spotify, Amazon Music, Apple Music, and more
- **Natural Language Commands** - Send text commands like "play jazz on Spotify"

### 🏠 Smart Home
- **Light Control** - Turn lights on/off, adjust brightness, set colors (name, hex, or Kelvin)
- **Sensor Monitoring** - Real-time access to temperature, illuminance, motion, and acoustic sensors
- **Device Management** - Discover and manage all Alexa devices and smart home endpoints
- **Volume Control** - Adjust volume levels across all devices
- **Do Not Disturb** - Control DND mode on individual devices

### 🤖 AI Agent Ready
- **Full MCP Protocol Support** - Works with any MCP-compatible client
- **Type-Safe Tools** - All tools validated with Zod schemas
- **REST API** - Direct HTTP access for custom integrations
- **Real-time Context** - Live sensor data and device states for intelligent decision-making

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Amazon account with Alexa devices
- Cookies from Amazon (see [Setup Guide](./SETUP.md))

### Installation

```bash
# Clone the repository
git clone https://github.com/gsampaio-rh/alexa-mcp-server.git
cd alexa-mcp-server

# Install dependencies
npm install
# or
pnpm install

# Copy environment template
cp .env.example .env
```

### Configuration

1. **Get your Amazon cookies** (see [Setup Guide](./SETUP.md) for detailed instructions):
   - Open Amazon.com in your browser
   - Open DevTools (F12) → Network tab
   - Copy `ubid-main` and `at-main` cookie **values**

2. **Edit `.env`**:
   ```bash
   UBID_MAIN="your-ubid-value"
   AT_MAIN="your-at-token-value"
   ```

### Running Locally

```bash
npm run dev
# Server runs at http://localhost:8787
```

### Testing

```bash
# Health check
curl http://localhost:8787/health

# Get server status and devices
curl http://localhost:8787/api/status

# Test announcement
curl -X POST http://localhost:8787/api/announce \
  -H "Content-Type: application/json" \
  -d '{"name": "Kitchen", "message": "Hello from MCP server!"}'
```

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Complete setup instructions and cookie configuration
- **[API Reference](./docs/API-REFERENCE.md)** - Complete REST API documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design
- **[Security](./docs/SECURITY.md)** - Security audit and best practices
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🔌 API Endpoints

### Core
- `GET /` - Server information
- `GET /health` - Health check
- `GET /api/status` - Connection status and device list

### Music
- `GET /api/music` - Get current playback status
- `POST /api/music/control` - Control playback (play, pause, next, prev)
- `POST /api/music/play` - Play music by search phrase
- `POST /api/music/text-command` - Send natural language commands

### Smart Home
- `GET /api/bedroom` - Bedroom sensor data
- `GET /api/lights` - List all lights
- `POST /api/lights/power` - Turn lights on/off
- `POST /api/lights/brightness` - Set brightness (0-100)
- `POST /api/lights/color` - Set color (name, hex, or kelvin)
- `GET /api/sensors` - List all sensors
- `GET /api/volume` - Get device volumes
- `POST /api/volume/set` - Set volume (0-100)
- `GET /api/dnd` - Get DND status
- `PUT /api/dnd` - Enable/disable DND

### Announcements
- `POST /api/announce` - Send voice announcement to device

### MCP Endpoints
- `GET /sse` - MCP Server-Sent Events endpoint
- `POST /mcp` - MCP HTTP endpoint

See [API Reference](./docs/API-REFERENCE.md) for complete documentation.

## 🤖 MCP Tools

The server exposes the following MCP tools for AI agents:

- `alexa_announce` - Send voice announcements
- `alexa_get_music_status` - Get current music playback info
- `alexa_control_music` - Control music playback
- `alexa_play_music` - Play music by search
- `alexa_get_bedroom_state` - Get bedroom sensor data
- `alexa_list_devices` - List all Alexa devices
- `alexa_control_lights` - Control smart lights
- `alexa_get_sensors` - Get sensor data
- `alexa_control_volume` - Adjust device volume
- `alexa_control_dnd` - Control Do Not Disturb mode

## 🚢 Deployment

Deploy to your preferred hosting platform. The server is a standard Node.js application that can run on any platform supporting Node.js 18+.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UBID_MAIN` | Yes | Amazon ubid-main cookie value |
| `AT_MAIN` | Yes | Amazon at-main authentication token |
| `COOKIE_SUFFIX` | No | Regional cookie suffix (e.g., `-acbbr` for Brazil) |
| `API_BASE` | No | Base URL for the deployed server |

## 🔒 Security

- **Credentials are never logged** or exposed in error messages
- **All requests go directly to Amazon APIs** - no third-party services
- **Self-hosting keeps credentials on your server** - they never leave your infrastructure
- See [Security Documentation](./docs/SECURITY.md) for complete audit

## 🛠️ Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## 📝 Project Structure

```
alexa-mcp-server/
├── src/
│   ├── api/v1/          # API route handlers
│   ├── mcp/             # MCP server and tools
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.ts           # Hono application definition
│   └── server.ts        # Node.js server entry point
├── docs/                # Documentation
└── package.json
```

## ⚠️ Important Notes

1. **Unofficial API**: This project uses reverse-engineered endpoints from the Alexa mobile app. Amazon can change or break these at any time.

2. **Cookie Requirements**: 
   - Most features work with Amazon.com cookies
   - Announcements require Alexa mobile app cookies (see [Setup Guide](./SETUP.md))

3. **Cookie Expiration**: Amazon cookies expire periodically. If you get 401/403 errors, get fresh cookies.

4. **Regional Support**: The server supports regional Amazon cookies. See [Setup Guide](./SETUP.md) for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Model Context Protocol](https://modelcontextprotocol.io/)
- Inspired by reverse-engineering efforts from the open-source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/gsampaio-rh/alexa-mcp-server/issues)
- **Documentation**: See the [docs](./docs/) folder
- **Troubleshooting**: See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

Made with ❤️ for the AI agent community
