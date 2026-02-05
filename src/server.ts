import { serve } from "@hono/node-server";
import { app } from "./app";
import { HomeIOMCP } from "./mcp/server";
import { EnvSchema, type Env } from "./types/env";
import { config } from "dotenv";

// Load environment variables from .env (or .dev.vars for backwards compatibility)
config(); // Load .env by default
config({ path: ".dev.vars" }); // Fallback to .dev.vars if .env doesn't exist

// Parse and validate environment variables
let env: Env;
try {
	env = EnvSchema.parse({
		UBID_MAIN: process.env.UBID_MAIN,
		AT_MAIN: process.env.AT_MAIN,
		COOKIE_SUFFIX: process.env.COOKIE_SUFFIX,
		API_KEY: process.env.API_KEY,
		API_BASE: process.env.API_BASE,
		TZ: process.env.TZ,
		SPOTIFY_TOKEN: process.env.SPOTIFY_TOKEN,
		SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
		SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
		SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN,
	});
} catch (error) {
	console.error("❌ Environment validation failed:", error);
		console.error("Please check your .env file");
	process.exit(1);
}

// Initialize MCP server with env
// Note: McpAgent constructor requires AgentContext (Cloudflare Workers specific)
// We create a minimal mock context for Node.js compatibility
const mockContext = {} as any;
const mcpServer = new HomeIOMCP(mockContext, env);
mcpServer.env = env;
await mcpServer.init();

// Create a wrapper that injects env into requests
const server = {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Handle MCP endpoints (using static methods)
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return HomeIOMCP.serveSSE("/sse").fetch(request, env, undefined as any);
		}

		if (url.pathname === "/mcp") {
			return HomeIOMCP.serve("/mcp").fetch(request, env, undefined as any);
		}

		// Handle all other routes with Hono app (env is injected via Bindings)
		return app.fetch(request, env);
	},
};

// Start the server
const port = Number(process.env.PORT) || 8787;

console.log("=".repeat(60));
console.log("🚀 Alexa MCP Server Starting...");
console.log(`📡 Server URL: http://localhost:${port}`);
console.log(`🔐 Authentication: ${env.UBID_MAIN ? "✅ Configured" : "❌ Missing"}`);
console.log(`🌍 Cookie Region: ${env.COOKIE_SUFFIX || "-main (US)"}`);
console.log("=".repeat(60));

serve({
	fetch: server.fetch,
	port,
}, (info) => {
	console.log(`✅ Server running on http://localhost:${info.port}`);
});
