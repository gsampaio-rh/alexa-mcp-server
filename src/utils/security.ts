/**
 * Security utilities for preventing credential leakage
 */

/**
 * Sanitizes error messages to prevent credential leakage.
 * Removes any potential credential patterns from error text.
 * 
 * @param errorText - Raw error text that may contain sensitive information
 * @returns Sanitized error text safe for logging/returning
 */
export function sanitizeError(errorText: string): string {
	if (!errorText) return "Unknown error";

	// Remove potential credential patterns (case-insensitive)
	let sanitized = errorText;

	// Remove cookie patterns
	sanitized = sanitized.replace(/ubid-main[=:]\s*[^\s;,"']+/gi, "ubid-main=***");
	sanitized = sanitized.replace(/at-main[=:]\s*[^\s;,"']+/gi, "at-main=***");
	sanitized = sanitized.replace(/Cookie[=:]\s*[^\s;,"']+/gi, "Cookie=***");

	// Remove any long tokens that might be credentials (20+ chars)
	sanitized = sanitized.replace(/[A-Za-z0-9_-]{20,}/g, (match) => {
		// Keep common patterns like URLs, timestamps, etc.
		if (
			match.startsWith("http") ||
			match.includes(".") ||
			match.match(/^\d+$/) ||
			match.length < 30
		) {
			return match;
		}
		return "***";
	});

	return sanitized;
}

/**
 * Validates that a URL is an Amazon domain.
 * Used to ensure credentials are only sent to Amazon APIs.
 * 
 * @param url - URL to validate
 * @returns true if URL is an Amazon domain, false otherwise
 */
export function isAmazonDomain(url: string): boolean {
	try {
		const urlObj = new URL(url);
		return (
			urlObj.hostname === "alexa.amazon.com" ||
			urlObj.hostname === "alexa-comms-mobile-service.amazon.com" ||
			urlObj.hostname.endsWith(".amazon.com")
		);
	} catch {
		return false;
	}
}

/**
 * Sanitizes an error response to prevent credential leakage.
 * 
 * @param status - HTTP status code
 * @param errorText - Raw error text
 * @returns Sanitized error object safe for returning to clients
 */
export function createSafeErrorResponse(status: number, errorText?: string): {
	error: string;
	status: number;
} {
	return {
		error: sanitizeError(errorText || "Unknown error"),
		status,
	};
}
