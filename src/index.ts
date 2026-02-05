import { Hono } from "hono";
import { cors } from "hono/cors";
import { announceHandler } from "@/api/v1/announce";
// Import API route handlers
import { bedroomHandler } from "@/api/v1/bedroom";
import { lightsApp } from "@/api/v1/lights";
import { musicHandler } from "@/api/v1/music";
import { musicControlHandler, playMusicHandler, musicTextCommandHandler } from "@/api/v1/music-control";
import { volumeApp } from "@/api/v1/volume";
import { sensorsApp } from "@/api/v1/sensors";
import { dndApp } from "@/api/v1/dnd";
import { HomeIOMCP } from "@/mcp/server";
import type { Env } from "@/types/env";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use("*", cors());

// Health check
app.get("/", (c) => {
	return c.json({
		name: "Alexa MCP Server",
		version: "1.0.0",
		endpoints: {
			api: "/api",
			bedroom: "/api/bedroom",
			announce: "/api/announce",
			music: "/api/music",
			lights: "/api/lights",
			volume: "/api/volume",
			sensors: "/api/sensors",
			dnd: "/api/dnd",
			mcp: "/mcp",
			sse: "/sse",
			health: "/health",
		},
	});
});

// Health endpoint
app.get("/health", (c) => {
	return c.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
	});
});

// Status endpoint - shows connection status and devices
app.get("/api/status", async (c) => {
	const { UBID_MAIN, AT_MAIN } = c.env;
	
	console.log("[Status] Checking connection status...");
	
	if (!UBID_MAIN || !AT_MAIN) {
		console.error("[Status] ❌ Missing authentication credentials");
		return c.json({
			connected: false,
			error: "Missing authentication credentials",
			timestamp: new Date().toISOString(),
		}, 500);
	}

	try {
		const { getAccountInfo, getAlexaDevices, getCustomerSmartHomeEndpoints } = await import("@/utils/alexa-dynamic");
		
		// Test connection and get account info
		console.log("[Status] Testing Alexa connection...");
		const accountInfo = await getAccountInfo(c.env);
		
		// Get all devices (handle errors gracefully)
		let devices: any[] = [];
		let endpoints: any[] = [];
		
		try {
			console.log("[Status] Discovering devices...");
			devices = await getAlexaDevices(c.env);
		} catch (deviceError) {
			console.warn("[Status] ⚠️  Device discovery failed:", deviceError instanceof Error ? deviceError.message : "Unknown error");
			// Continue even if device discovery fails
		}
		
		try {
			endpoints = await getCustomerSmartHomeEndpoints(c.env);
		} catch (endpointError) {
			console.warn("[Status] ⚠️  Endpoint discovery failed:", endpointError instanceof Error ? endpointError.message : "Unknown error");
			// Continue even if endpoint discovery fails
		}
		
		// Format device list (handle missing fields gracefully)
		const deviceList = devices.map((device: any) => ({
			name: device.accountName || device.deviceName || device.friendlyName || "Unknown",
			type: device.deviceType || device.deviceFamily || "Unknown",
			family: device.deviceFamily || "Unknown",
			online: device.online ?? false,
			serialNumber: device.serialNumber ? `${device.serialNumber.substring(0, 8)}...` : "N/A",
		}));

		const onlineDevices = devices.filter((d: any) => d.online).length;
		const offlineDevices = devices.length - onlineDevices;

		console.log(`[Status] ✅ Connection successful! Found ${devices.length} devices (${onlineDevices} online, ${offlineDevices} offline)`);

		return c.json({
			connected: true,
			account: {
				customerId: accountInfo.customerId ? `${accountInfo.customerId.substring(0, 8)}...` : "Unknown",
			},
			devices: {
				total: devices.length,
				online: onlineDevices,
				offline: offlineDevices,
				list: deviceList,
			},
			endpoints: {
				total: endpoints.length,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Status] ❌ Error:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		
		// Try to provide more helpful error messages
		if (errorMessage.includes("401") || errorMessage.includes("403")) {
			return c.json({
				connected: false,
				error: "Authentication failed. Please check your cookies - they may have expired.",
				details: errorMessage,
				timestamp: new Date().toISOString(),
			}, 401);
		}
		
		return c.json({
			connected: false,
			error: errorMessage,
			timestamp: new Date().toISOString(),
		}, 500);
	}
});

// API v1 routes
app.get("/api/bedroom", bedroomHandler);
app.post("/api/announce", announceHandler);
app.get("/api/music", musicHandler);
app.post("/api/music/control", musicControlHandler);
app.post("/api/music/play", playMusicHandler);
app.post("/api/music/text-command", musicTextCommandHandler);

// Light control routes
app.route("/api/lights", lightsApp);

// Volume control routes
app.route("/api/volume", volumeApp);

// Sensor routes
app.route("/api/sensors", sensorsApp);

// DND routes
app.route("/api/dnd", dndApp);

// Track if we've logged startup
let startupLogged = false;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Log startup on first request
		if (!startupLogged) {
			console.log("=".repeat(60));
			console.log("🚀 Alexa MCP Server Starting...");
			console.log(`📡 Server URL: ${url.origin}`);
			console.log(`🔐 Authentication: ${env.UBID_MAIN ? "✅ Configured" : "❌ Missing"}`);
			console.log(`🌍 Cookie Region: ${env.COOKIE_SUFFIX || "-main (US)"}`);
			console.log("=".repeat(60));
			startupLogged = true;
		}

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return HomeIOMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return HomeIOMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Handle all other routes with Hono app
		return app.fetch(request, env, ctx);
	},
};

export { HomeIOMCP };
