import type { Context } from "hono";
import { type Env, EnvSchema } from "@/types/env";
import { buildAlexaHeadersWithCsrf } from "@/utils/alexa";
import { getCustomerSmartHomeEndpoints } from "@/utils/alexa-dynamic";

/**
 * POST /api/music/control - Control music playback (play, pause, next, prev, etc.)
 * Uses the /api/np/command endpoint like the reference script
 */
export async function musicControlHandler(c: Context<{ Bindings: Env }>) {
	console.log("[Music Control] ========================================");
	console.log("[Music Control] 🎵 Received music control request");

	// Validate environment
	let env: Env;
	try {
		env = EnvSchema.parse(c.env);
	} catch (error) {
		console.error("[Music Control] ❌ Environment validation failed:", error);
		return c.json({
			error: "Environment validation failed",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	const { UBID_MAIN, AT_MAIN } = env;
	if (!UBID_MAIN || !AT_MAIN) {
		return c.json({ error: "Missing UBID_MAIN or AT_MAIN in environment." }, 500);
	}

	// Parse request body
	let parsed: { command?: string } = {};
	try {
		parsed = await c.req.json();
	} catch (error) {
		return c.json({
			error: "Invalid JSON body.",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 400);
	}

	const command = parsed.command?.toLowerCase().trim();
	if (!command) {
		return c.json({ error: 'Missing "command" field. Valid commands: play, pause, next, prev, forward, rewind' }, 400);
	}

	// Map command to Alexa command type
	const commandMap: Record<string, string> = {
		play: "PlayCommand",
		pause: "PauseCommand",
		next: "NextCommand",
		prev: "PreviousCommand",
		previous: "PreviousCommand",
		forward: "ForwardCommand",
		fwd: "ForwardCommand",
		rewind: "RewindCommand",
		rwd: "RewindCommand",
	};

	const commandType = commandMap[command];
	if (!commandType) {
		return c.json({
			error: `Invalid command "${command}". Valid commands: ${Object.keys(commandMap).join(", ")}`,
		}, 400);
	}

	// Get device information
	let deviceType: string;
	let deviceSerialNumber: string;
	try {
		const endpoints = await getCustomerSmartHomeEndpoints(env);
		const echoDevice = endpoints.find((endpoint: any) => {
			const primaryCategory = endpoint.displayCategories?.primary?.value;
			return primaryCategory === "ALEXA_VOICE_ENABLED";
		});

		if (!echoDevice) {
			throw new Error("No Echo device found");
		}

		deviceType = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceType?.value?.text;
		deviceSerialNumber = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceSerialNumber?.value?.text;

		if (!deviceType || !deviceSerialNumber) {
			throw new Error("Missing deviceType or deviceSerialNumber");
		}
	} catch (error) {
		console.error("[Music Control] ❌ Failed to get device info:", error);
		return c.json({
			error: "Failed to get device information",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	// Get customer ID
	let customerId: string;
	try {
		const usersMeResponse = await fetch("https://alexa.amazon.com/api/users/me", {
			method: "GET",
			headers: await buildAlexaHeadersWithCsrf(env),
		});

		if (!usersMeResponse.ok) {
			throw new Error(`Failed to get user ID: ${usersMeResponse.status}`);
		}

		const usersMeData = await usersMeResponse.json() as { id?: string };
		if (!usersMeData.id) {
			throw new Error("No 'id' field in /api/users/me response");
		}
		customerId = usersMeData.id;
	} catch (error) {
		console.error("[Music Control] ❌ Failed to get customer ID:", error);
		return c.json({
			error: "Failed to get customer ID",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	// Map command type to text command (since /api/np/command returns 404)
	const textCommandMap: Record<string, string> = {
		PlayCommand: "resume music",
		PauseCommand: "pause music",
		NextCommand: "next song",
		PreviousCommand: "previous song",
		ForwardCommand: "fast forward",
		RewindCommand: "rewind",
	};

	const textCommand = textCommandMap[commandType] || commandType.toLowerCase().replace("Command", "");

	console.log(`[Music Control] 🎮 Sending ${commandType} (as text: "${textCommand}") to device ${deviceSerialNumber.substring(0, 8)}...`);

	// Use behaviors/preview with Alexa.TextCommand (like reference script line 441-444)
	const locale = "en-US";
	const textEscaped = textCommand.replace(/"/g, "'");

	const operationNode = {
		"@type": "com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode",
		"type": "Alexa.TextCommand",
		"operationPayload": {
			deviceType: deviceType,
			deviceSerialNumber: deviceSerialNumber,
			customerId: customerId,
			locale: locale,
			skillId: "amzn1.ask.1p.tellalexa",
			text: textEscaped,
		},
	};

	const sequenceJson = {
		"@type": "com.amazon.alexa.behaviors.model.Sequence",
		"startNode": {
			"@type": "com.amazon.alexa.behaviors.model.ParallelNode",
			"nodesToExecute": [operationNode],
		},
	};

	const behaviorCommand = {
		behaviorId: "PREVIEW",
		sequenceJson: JSON.stringify(sequenceJson),
		status: "ENABLED",
	};

	// Use behaviors/preview endpoint (like announcements)
	const url = "https://alexa.amazon.com/api/behaviors/preview";
	const headers = await buildAlexaHeadersWithCsrf(env, {
		"Content-Type": "application/json; charset=UTF-8",
		"Referer": "https://alexa.amazon.com/spa/index.html",
		"Origin": "https://alexa.amazon.com",
		"DNT": "1",
		"Connection": "keep-alive",
	});

	const res = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(behaviorCommand),
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => "");
		console.error(`[Music Control] ❌ Request failed: ${res.status} - ${errorText}`);
		return c.json({
			error: `Music control failed: ${res.status}`,
			details: errorText.substring(0, 200),
		}, res.status as any);
	}

	const result = await res.json().catch(() => ({}));

	console.log("[Music Control] ✅ Command sent successfully");
	return c.json({
		success: true,
		command: commandType,
		textCommand: textCommand,
		device: {
			type: deviceType,
			serialNumber: deviceSerialNumber.substring(0, 8) + "...",
		},
		response: result,
	});
}

/**
 * POST /api/music/play - Play music by search phrase
 * Uses Alexa.Music.PlaySearchPhrase sequence command
 */
export async function playMusicHandler(c: Context<{ Bindings: Env }>) {
	console.log("[Play Music] ========================================");
	console.log("[Play Music] 🎵 Received play music request");

	// Validate environment
	let env: Env;
	try {
		env = EnvSchema.parse(c.env);
	} catch (error) {
		return c.json({
			error: "Environment validation failed",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	const { UBID_MAIN, AT_MAIN } = env;
	if (!UBID_MAIN || !AT_MAIN) {
		return c.json({ error: "Missing UBID_MAIN or AT_MAIN in environment." }, 500);
	}

	// Parse request body
	let parsed: { searchPhrase?: string; provider?: string } = {};
	try {
		parsed = await c.req.json();
	} catch (error) {
		return c.json({ error: "Invalid JSON body." }, 400);
	}

	const searchPhrase = parsed.searchPhrase?.trim();
	const provider = parsed.provider || "SPOTIFY"; // Default to Spotify

	if (!searchPhrase) {
		return c.json({
			error: 'Missing "searchPhrase" field. Example: "jazz music", "The Beatles", etc.',
		}, 400);
	}

	// Valid providers
	const validProviders = ["SPOTIFY", "AMAZON_MUSIC", "TUNEIN", "APPLE_MUSIC", "DEEZER", "I_HEART_RADIO"];
	if (!validProviders.includes(provider.toUpperCase())) {
		return c.json({
			error: `Invalid provider "${provider}". Valid providers: ${validProviders.join(", ")}`,
		}, 400);
	}

	// Get device information
	let deviceType: string;
	let deviceSerialNumber: string;
	let customerId: string;
	try {
		// Get customer ID from /api/users/me
		const usersMeResponse = await fetch("https://alexa.amazon.com/api/users/me", {
			method: "GET",
			headers: await buildAlexaHeadersWithCsrf(env),
		});

		if (!usersMeResponse.ok) {
			throw new Error(`Failed to get user ID: ${usersMeResponse.status}`);
		}

		const usersMeData = await usersMeResponse.json() as { id?: string };
		if (!usersMeData.id) {
			throw new Error("No 'id' field in /api/users/me response");
		}
		customerId = usersMeData.id;

		// Get Echo device
		const endpoints = await getCustomerSmartHomeEndpoints(env);
		const echoDevice = endpoints.find((endpoint: any) => {
			const primaryCategory = endpoint.displayCategories?.primary?.value;
			return primaryCategory === "ALEXA_VOICE_ENABLED";
		});

		if (!echoDevice) {
			throw new Error("No Echo device found");
		}

		deviceType = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceType?.value?.text;
		deviceSerialNumber = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceSerialNumber?.value?.text;

		if (!deviceType || !deviceSerialNumber) {
			throw new Error("Missing deviceType or deviceSerialNumber");
		}
	} catch (error) {
		console.error("[Play Music] ❌ Failed to get device info:", error);
		return c.json({
			error: "Failed to get device information",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	// Build sequence command (like reference script line 478-483)
	const locale = "en-US";
	const searchPhraseEscaped = searchPhrase.replace(/"/g, "'");

	const operationNode = {
		"@type": "com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode",
		"type": "Alexa.Music.PlaySearchPhrase",
		"operationPayload": {
			deviceType: deviceType,
			deviceSerialNumber: deviceSerialNumber,
			customerId: customerId,
			locale: locale,
			musicProviderId: provider.toUpperCase(),
			searchPhrase: searchPhraseEscaped,
		},
	};

	const sequenceJson = {
		"@type": "com.amazon.alexa.behaviors.model.Sequence",
		"startNode": {
			"@type": "com.amazon.alexa.behaviors.model.ParallelNode",
			"nodesToExecute": [operationNode],
		},
	};

	const behaviorCommand = {
		behaviorId: "PREVIEW",
		sequenceJson: JSON.stringify(sequenceJson),
		status: "ENABLED",
	};

	console.log(`[Play Music] 🎮 Playing "${searchPhrase}" on ${provider}`);

	// Use behaviors/preview endpoint
	const url = "https://alexa.amazon.com/api/behaviors/preview";
	const headers = await buildAlexaHeadersWithCsrf(env, {
		"Content-Type": "application/json; charset=UTF-8",
		"Referer": "https://alexa.amazon.com/spa/index.html",
		"Origin": "https://alexa.amazon.com",
		"DNT": "1",
		"Connection": "keep-alive",
	});

	const res = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(behaviorCommand),
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => "");
		console.error(`[Play Music] ❌ Request failed: ${res.status} - ${errorText}`);
		return c.json({
			error: `Play music failed: ${res.status}`,
			details: errorText.substring(0, 200),
		}, res.status as any);
	}

	const result = await res.json().catch(() => ({}));

	console.log("[Play Music] ✅ Music playback started");
	return c.json({
		success: true,
		searchPhrase,
		provider: provider.toUpperCase(),
		device: {
			type: deviceType,
			serialNumber: deviceSerialNumber.substring(0, 8) + "...",
		},
		response: result,
	});
}

/**
 * POST /api/music/text-command - Send text command to Alexa (like "play jazz music")
 * Uses Alexa.TextCommand sequence command
 */
export async function musicTextCommandHandler(c: Context<{ Bindings: Env }>) {
	console.log("[Music Text Command] ========================================");
	console.log("[Music Text Command] 💬 Received text command request");

	// Validate environment
	let env: Env;
	try {
		env = EnvSchema.parse(c.env);
	} catch (error) {
		return c.json({
			error: "Environment validation failed",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	const { UBID_MAIN, AT_MAIN } = env;
	if (!UBID_MAIN || !AT_MAIN) {
		return c.json({ error: "Missing UBID_MAIN or AT_MAIN in environment." }, 500);
	}

	// Parse request body
	let parsed: { text?: string } = {};
	try {
		parsed = await c.req.json();
	} catch (error) {
		return c.json({ error: "Invalid JSON body." }, 400);
	}

	const text = parsed.text?.trim();
	if (!text) {
		return c.json({
			error: 'Missing "text" field. Example: "play jazz music", "pause music", etc.',
		}, 400);
	}

	// Get device information
	let deviceType: string;
	let deviceSerialNumber: string;
	let customerId: string;
	try {
		// Get customer ID from /api/users/me
		const usersMeResponse = await fetch("https://alexa.amazon.com/api/users/me", {
			method: "GET",
			headers: await buildAlexaHeadersWithCsrf(env),
		});

		if (!usersMeResponse.ok) {
			throw new Error(`Failed to get user ID: ${usersMeResponse.status}`);
		}

		const usersMeData = await usersMeResponse.json() as { id?: string };
		if (!usersMeData.id) {
			throw new Error("No 'id' field in /api/users/me response");
		}
		customerId = usersMeData.id;

		// Get Echo device
		const endpoints = await getCustomerSmartHomeEndpoints(env);
		const echoDevice = endpoints.find((endpoint: any) => {
			const primaryCategory = endpoint.displayCategories?.primary?.value;
			return primaryCategory === "ALEXA_VOICE_ENABLED";
		});

		if (!echoDevice) {
			throw new Error("No Echo device found");
		}

		deviceType = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceType?.value?.text;
		deviceSerialNumber = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceSerialNumber?.value?.text;

		if (!deviceType || !deviceSerialNumber) {
			throw new Error("Missing deviceType or deviceSerialNumber");
		}
	} catch (error) {
		console.error("[Music Text Command] ❌ Failed to get device info:", error);
		return c.json({
			error: "Failed to get device information",
			details: error instanceof Error ? error.message : "Unknown error",
		}, 500);
	}

	// Build sequence command (like reference script line 441-444)
	const locale = "en-US";
	const textEscaped = text.replace(/"/g, "'"); // Escape quotes like reference script

	const operationNode = {
		"@type": "com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode",
		"type": "Alexa.TextCommand",
		"operationPayload": {
			deviceType: deviceType,
			deviceSerialNumber: deviceSerialNumber,
			customerId: customerId,
			locale: locale,
			skillId: "amzn1.ask.1p.tellalexa",
			text: textEscaped,
		},
	};

	const sequenceJson = {
		"@type": "com.amazon.alexa.behaviors.model.Sequence",
		"startNode": {
			"@type": "com.amazon.alexa.behaviors.model.ParallelNode",
			"nodesToExecute": [operationNode],
		},
	};

	const behaviorCommand = {
		behaviorId: "PREVIEW",
		sequenceJson: JSON.stringify(sequenceJson),
		status: "ENABLED",
	};

	console.log(`[Music Text Command] 💬 Sending text: "${text}"`);

	// Use behaviors/preview endpoint
	const url = "https://alexa.amazon.com/api/behaviors/preview";
	const headers = await buildAlexaHeadersWithCsrf(env, {
		"Content-Type": "application/json; charset=UTF-8",
		"Referer": "https://alexa.amazon.com/spa/index.html",
		"Origin": "https://alexa.amazon.com",
		"DNT": "1",
		"Connection": "keep-alive",
	});

	const res = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(behaviorCommand),
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => "");
		console.error(`[Music Text Command] ❌ Request failed: ${res.status} - ${errorText}`);
		return c.json({
			error: `Text command failed: ${res.status}`,
			details: errorText.substring(0, 200),
		}, res.status as any);
	}

	const result = await res.json().catch(() => ({}));

	console.log("[Music Text Command] ✅ Text command sent successfully");
	return c.json({
		success: true,
		text,
		device: {
			type: deviceType,
			serialNumber: deviceSerialNumber.substring(0, 8) + "...",
		},
		response: result,
	});
}
