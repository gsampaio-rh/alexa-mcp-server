import { z } from "zod";

// Environment validation schema for Cloudflare Workers
export const EnvSchema = z.object({
	/** Amazon ubid-main cookie value (or regional variant like ubid-acbbr) */
	UBID_MAIN: z.string().min(1, "UBID_MAIN is required"),

	/** Amazon at-main authentication token (or regional variant like at-acbbr) */
	AT_MAIN: z.string().min(1, "AT_MAIN is required"),

	/** Optional: Cookie name suffix for regional variants (e.g., '-acbbr' for Brazil).
	 * If not provided, defaults to '-main' for US region.
	 * Common values: '-main' (US), '-acbbr' (Brazil), '-acbau' (Australia), etc. */
	COOKIE_SUFFIX: z.string().optional(),

	/** API key for MCP client authentication */
	API_KEY: z.string().optional(),

	/** Base URL for the Alexa API service */
	API_BASE: z.string().url("API_BASE must be a valid URL"),

	/** IANA timezone (e.g. 'America/New_York') for announcement scheduling */
	TZ: z.string().optional(),

	/** Spotify Bearer Token for Web API access */
	SPOTIFY_TOKEN: z.string().optional(),

	/** Spotify Client ID for OAuth */
	SPOTIFY_CLIENT_ID: z.string().optional(),

	/** Spotify Client Secret for OAuth */
	SPOTIFY_CLIENT_SECRET: z.string().optional(),

	/** Spotify Refresh Token for OAuth */
	SPOTIFY_REFRESH_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
