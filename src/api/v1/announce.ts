import type { Context } from "hono";
import { type Env, EnvSchema } from "@/types/env";
import { buildAlexaHeadersWithCsrf, getAccountId, isAnyLightOn } from "@/utils/alexa";
import { getCustomerSmartHomeEndpoints } from "@/utils/alexa-dynamic";

export async function announceHandler(c: Context<{ Bindings: Env }>) {
	const startTime = Date.now();
	console.log("[Announce] ========================================");
	console.log("[Announce] 📢 Received announcement request");
	console.log("[Announce] Timestamp:", new Date().toISOString());
	
	// Validate environment
	let env: Env;
	try {
		env = EnvSchema.parse(c.env);
		console.log("[Announce] ✅ Environment validation passed");
	} catch (error) {
		console.error("[Announce] ❌ Environment validation failed:", error);
		return c.json({ 
			error: "Environment validation failed",
			details: error instanceof Error ? error.message : "Unknown error"
		}, 500);
	}
	
	const { UBID_MAIN, AT_MAIN } = env;

	if (!UBID_MAIN || !AT_MAIN) {
		console.error("[Announce] ❌ Missing credentials");
		console.error("[Announce] UBID_MAIN present:", !!UBID_MAIN);
		console.error("[Announce] AT_MAIN present:", !!AT_MAIN);
		return c.json({ error: "Missing UBID_MAIN or AT_MAIN in environment." }, 500);
	}

	// Log credential info (without exposing values)
	console.log("[Announce] 🔐 Credentials check:");
	console.log("[Announce]   UBID_MAIN length:", UBID_MAIN.length, "chars");
	console.log("[Announce]   AT_MAIN length:", AT_MAIN.length, "chars");
	console.log("[Announce]   UBID_MAIN format:", UBID_MAIN.match(/^\d+-\d+-\d+$/) ? "✅ Valid format" : "⚠️ Unexpected format");
	console.log("[Announce]   AT_MAIN starts with:", AT_MAIN.substring(0, 5) === "Atza|" ? "✅ Valid (Atza|)" : "⚠️ Unexpected prefix");

	let parsed: { name?: string; message?: string; ssml?: string } = {};
	try {
		parsed = await c.req.json();
		console.log("[Announce] 📝 Parsed request body:");
		console.log("[Announce]   Name:", parsed.name);
		console.log("[Announce]   Message length:", parsed.message?.length, "chars");
		console.log("[Announce]   SSML provided:", !!parsed.ssml);
		console.log("[Announce]   Message preview:", parsed.message?.substring(0, 50) + (parsed.message && parsed.message.length > 50 ? "..." : ""));
	} catch (error) {
		console.error("[Announce] ❌ Failed to parse JSON:", error);
		return c.json({ 
			error: "Invalid JSON body.",
			details: error instanceof Error ? error.message : "Unknown error"
		}, 400);
	}

	const name = (parsed.name ?? "").trim();
	// Use SSML if provided, otherwise use message
	const textToSpeakRaw = parsed.ssml?.trim() || parsed.message?.trim() || "";

	console.log("[Announce] ✂️ Validated input:");
	console.log("[Announce]   Name (trimmed):", name, `(${name.length} chars)`);
	console.log("[Announce]   Text to speak (trimmed):", textToSpeakRaw.substring(0, 50) + (textToSpeakRaw.length > 50 ? "..." : ""), `(${textToSpeakRaw.length} chars)`);
	console.log("[Announce]   Using SSML:", !!parsed.ssml);

	if (!name || !textToSpeakRaw) {
		console.error("[Announce] ❌ Validation failed: missing name or message/ssml");
		return c.json({ error: 'Both "name" and "message" (or "ssml") are required.' }, 400);
	}
	if (name.length > 40) {
		console.error("[Announce] ❌ Validation failed: name too long (", name.length, "chars, max 40)");
		return c.json({ error: "Name must be 40 characters or fewer." }, 400);
	}
	if (textToSpeakRaw.length > 500) {
		console.error("[Announce] ❌ Validation failed: text too long (", textToSpeakRaw.length, "chars, max 500)");
		return c.json({ error: "Message/SSML must be 500 characters or fewer." }, 400);
	}

	// Determine whether it's day (10 ≤ hour < 22) or night in configured TZ
	const tz = env.TZ || "America/New_York";
	const now = new Date();
	const hourTz = Number(
		new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(
			now,
		),
	);
	const isDay = hourTz >= 10 && hourTz < 22;
	
	console.log("[Announce] 🌅 Time check:");
	console.log("[Announce]   Timezone:", tz);
	console.log("[Announce]   Current hour (local):", hourTz);
	console.log("[Announce]   Is day (10-22):", isDay);

	// At night we require any light to be ON, during the day we ignore light state
	if (!isDay) {
		console.log("[Announce] 🌙 Night time - checking light status...");
		const lightOn = await isAnyLightOn(env);
		console.log("[Announce]   Light status:", lightOn === null ? "unknown" : lightOn ? "ON ✅" : "OFF ❌");
		if (lightOn === false) {
			console.error("[Announce] ❌ Announcement blocked: all lights off at night");
			return c.json(
				{ error: "All lights are off – announcement suppressed for night time." },
				403,
			);
		}
	} else {
		console.log("[Announce] ☀️ Day time - skipping light check");
	}

	// Get device information for behaviors/preview endpoint
	console.log("[Announce] 🔍 Step 1: Getting device information...");
	const deviceInfoStartTime = Date.now();
	let deviceType: string;
	let deviceSerialNumber: string;
	let customerId: string;
	let echoDevice: any;
	let deviceInfoDuration = 0;
	
	try {
		// Get customer ID from /api/users/me (like reference script line 577)
		// Reference script: MEDIAOWNERCUSTOMERID=$(${CURL} ... https://${ALEXA}/api/users/me | ${JQ} -r '.id')
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
		
		// Get Echo device from smart home endpoints
		const endpoints = await getCustomerSmartHomeEndpoints(env);
		echoDevice = endpoints.find((endpoint: any) => {
			const primaryCategory = endpoint.displayCategories?.primary?.value;
			return primaryCategory === "ALEXA_VOICE_ENABLED";
		});
		
		if (!echoDevice) {
			throw new Error("No Echo device found. Make sure you have at least one Alexa device registered.");
		}
		
		deviceType = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceType?.value?.text;
		deviceSerialNumber = echoDevice.legacyIdentifiers?.dmsIdentifier?.deviceSerialNumber?.value?.text;
		
		if (!deviceType || !deviceSerialNumber) {
			throw new Error("Missing deviceType or deviceSerialNumber in Echo device data");
		}
		
		deviceInfoDuration = Date.now() - deviceInfoStartTime;
		console.log(`[Announce] ✅ Device info retrieved in ${deviceInfoDuration}ms`);
		console.log(`[Announce]   Device: ${echoDevice.friendlyName}`);
		console.log(`[Announce]   Device Type: ${deviceType}`);
		console.log(`[Announce]   Serial Number: ${deviceSerialNumber.substring(0, 8)}...`);
		console.log(`[Announce]   Customer ID: ${customerId.substring(0, 12)}...`);
	} catch (error) {
		deviceInfoDuration = Date.now() - deviceInfoStartTime;
		console.error(`[Announce] ❌ Failed to get device info after ${deviceInfoDuration}ms:`, error);
		const errorMsg = error instanceof Error ? error.message : "Unknown error";
		
		return c.json({
			error: "Failed to get device information",
			details: errorMsg,
			suggestion: "Make sure you have at least one Alexa device registered and online",
		}, 500);
	}

	// Build behavior sequence JSON (using Alexa.Speak like alexa-remote-control)
	// Use en-US as default locale (reference script uses TTS_LOCALE env var, defaults to de-DE but we'll use en-US)
	const locale = "en-US";
	// Escape quotes like the reference script does (sed s/\"/\'/g)
	// Reference script line 447: TTS=$(echo ${COMMAND##speak:} | sed s/\"/\'/g)
	const textToSpeak = textToSpeakRaw.replace(/"/g, "'");
	
	// Build the operation node exactly like the reference script's node() function (line 657-659)
	// The node() function outputs: {"@type":"...","type":"Alexa.Speak","operationPayload":{...}}
	const operationNode = {
		"@type": "com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode",
		"type": "Alexa.Speak",
		"operationPayload": {
			deviceType: deviceType,
			deviceSerialNumber: deviceSerialNumber,
			customerId: customerId,
			locale: locale,
			textToSpeak: textToSpeak,
		},
	};
	
	// Build the sequence JSON object (reference script line 769)
	const sequenceJsonObj = {
		"@type": "com.amazon.alexa.behaviors.model.Sequence",
		"startNode": {
			"@type": "com.amazon.alexa.behaviors.model.ParallelNode",
			"nodesToExecute": [operationNode],
		},
	};
	
	// Build the behavior command
	// Reference script line 769: sequenceJson is a STRING containing JSON
	// When JSON.stringify is called on behaviorCommand, it will properly escape the sequenceJson string
	const behaviorCommand = {
		behaviorId: "PREVIEW",
		sequenceJson: JSON.stringify(sequenceJsonObj), // This becomes a string field in the final JSON
		status: "ENABLED",
	};
	
	const url = "https://alexa.amazon.com/api/behaviors/preview";
	console.log("[Announce] 🌐 Step 2: Preparing API request...");
	console.log(`[Announce]   URL: ${url}`);
	console.log(`[Announce]   Method: POST`);
	console.log(`[Announce]   Using behaviors/preview endpoint (like alexa-remote-control)`);
	
	// Use buildAlexaHeadersWithCsrf to get real CSRF token (required for behaviors/preview)
	const headers = await buildAlexaHeadersWithCsrf(env, {
		"Content-Type": "application/json; charset=UTF-8",
		"Referer": "https://alexa.amazon.com/spa/index.html",
		"Origin": "https://alexa.amazon.com",
		"DNT": "1",
		"Connection": "keep-alive",
	});
	
	console.log("[Announce] 📋 Request headers:");
	console.log(`[Announce]   Cookie: csrf=1; ubid-main=*** (${env.UBID_MAIN.length} chars); at-main=*** (${env.AT_MAIN.length} chars)`);
	console.log(`[Announce]   csrf: ${headers.csrf || headers.Csrf || "not set"}`);
	console.log(`[Announce]   Content-Type: ${headers["Content-Type"]}`);
	console.log(`[Announce]   Referer: ${headers.Referer}`);
	console.log(`[Announce]   Origin: ${headers.Origin}`);
	
	const requestBody = JSON.stringify(behaviorCommand);
	console.log("[Announce] 📤 Request body:");
	console.log(`[Announce]   Size: ${requestBody.length} bytes`);
	console.log(`[Announce]   Behavior ID: PREVIEW`);
	console.log(`[Announce]   Sequence type: Alexa.Speak`);
	console.log(`[Announce]   Message: ${textToSpeak.substring(0, 50)}${textToSpeak.length > 50 ? "..." : ""}`);
	console.log(`[Announce]   Full request body (first 500 chars): ${requestBody.substring(0, 500)}`);
	console.log(`[Announce]   sequenceJson type: ${typeof behaviorCommand.sequenceJson}`);
	console.log(`[Announce]   sequenceJson preview: ${behaviorCommand.sequenceJson.substring(0, 200)}...`);

	console.log("[Announce] 🚀 Step 3: Sending request to Amazon API...");
	const fetchStartTime = Date.now();
	const res = await fetch(url, {
		method: "POST",
		headers,
		body: requestBody,
	});
	const fetchDuration = Date.now() - fetchStartTime;
	
	console.log(`[Announce] 📥 Response received in ${fetchDuration}ms`);
	console.log(`[Announce]   Status: ${res.status} ${res.statusText}`);
	console.log(`[Announce]   OK: ${res.ok}`);
	
	// Log response headers
	const responseHeaders: Record<string, string> = {};
	res.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});
	console.log("[Announce] 📋 Response headers:");
	console.log(`[Announce]   Content-Type: ${responseHeaders["content-type"] || "not set"}`);
	console.log(`[Announce]   Content-Length: ${responseHeaders["content-length"] || "not set"}`);
	console.log(`[Announce]   Total headers: ${Object.keys(responseHeaders).length}`);

	if (!res.ok) {
		console.error(`[Announce] ❌ Request failed with status ${res.status}`);
		const text = await res.text().catch(() => "");
		console.error(`[Announce] 📄 Response body (${text.length} chars):`);
		console.error(`[Announce]   ${text.substring(0, 500)}${text.length > 500 ? "..." : ""}`);
		
		// Try to parse error response
		let errorBody: any = {};
		try {
			errorBody = JSON.parse(text);
			console.log("[Announce]   Parsed as JSON:", JSON.stringify(errorBody, null, 2));
		} catch {
			console.error("[Announce]   Failed to parse as JSON, treating as raw text");
			errorBody = { raw: text };
		}
		
		const totalDuration = Date.now() - startTime;
		console.error(`[Announce] ⏱️ Total request duration: ${totalDuration}ms`);
		console.error("[Announce] 🔍 Debugging info:");
		console.error(`[Announce]   - Customer ID: ${customerId.substring(0, 12)}...`);
		console.error(`[Announce]   - Device Type: ${deviceType}`);
		console.error(`[Announce]   - Device Serial: ${deviceSerialNumber.substring(0, 8)}...`);
		console.error(`[Announce]   - URL: ${url}`);
		console.error(`[Announce]   - Status: ${res.status} ${res.statusText}`);
		console.error(`[Announce]   - Response size: ${text.length} bytes`);
		
		// Provide helpful message for 500 errors
		if (res.status === 500) {
			console.error("[Announce] 💡 500 Error Analysis:");
			console.error("[Announce]   - This usually means the API received the request but rejected it");
			console.error("[Announce]   - Possible causes:");
			console.error("[Announce]     1. Wrong cookie type (need Alexa app cookies, not amazon.com)");
			console.error("[Announce]     2. Missing required parameters");
			console.error("[Announce]     3. Account ID format issue");
			console.error("[Announce]     4. API changes or regional restrictions");
			return c.json({
				error: "Amazon API returned 500 error",
				message: "The announcements API may require Alexa app cookies, not amazon.com cookies.",
				details: errorBody,
				suggestion: "Try getting cookies from the Alexa mobile app instead of amazon.com",
				debug: {
					customerId: `${customerId.substring(0, 12)}...`,
					deviceType: deviceType,
					url: url,
					status: res.status,
					responseSize: text.length,
					duration: fetchDuration,
				}
			}, 500);
		}
		
		return new Response(
			JSON.stringify({ 
				error: "Alexa API error", 
				status: res.status, 
				statusText: res.statusText,
				body: errorBody,
				rawResponse: text.substring(0, 500),
				debug: {
					customerId: `${customerId.substring(0, 12)}...`,
					deviceType: deviceType,
					url: url,
					duration: fetchDuration,
				}
			}),
			{
				status: res.status,
				headers: { "content-type": "application/json" },
			},
		);
	}

	console.log("[Announce] ✅ Request successful! Parsing response...");

	let responseData: any;
	try {
		const responseText = await res.text();
		console.log(`[Announce] 📄 Response body (${responseText.length} chars):`);
		console.log(`[Announce]   ${responseText.substring(0, 200)}${responseText.length > 200 ? "..." : ""}`);
		
		if (responseText.trim()) {
			responseData = JSON.parse(responseText);
			console.log("[Announce] ✅ Response parsed successfully");
		} else {
			responseData = {};
			console.log("[Announce] ✅ Empty response (successful)");
		}
	} catch (error) {
		console.error("[Announce] ❌ Failed to parse response:", error);
		console.error("[Announce]   Error type:", error instanceof Error ? error.constructor.name : typeof error);
		console.error("[Announce]   Error message:", error instanceof Error ? error.message : String(error));
		// Don't fail if response parsing fails - the request was successful
		responseData = {};
	}

	const totalDuration = Date.now() - startTime;

	console.log("[Announce] 🎉 Announcement completed successfully!");
	console.log(`[Announce] ⏱️ Total duration: ${totalDuration}ms`);
	console.log(`[Announce]   - Device info retrieval: ${deviceInfoDuration}ms`);
	console.log(`[Announce]   - API request: ${fetchDuration}ms`);
	console.log("[Announce] ========================================");

	return c.json({
		success: true,
		message: `Announcement sent from "${name}"`,
		text: textToSpeakRaw.substring(0, 100) + (textToSpeakRaw.length > 100 ? "..." : ""),
		method: "behaviors/preview",
		device: {
			name: echoDevice?.friendlyName || "Unknown",
			type: deviceType,
		},
		response: responseData,
	});
}
