// aincrok_change - new file
/**
 * Utility functions for conditional logging based on verbosity settings
 */

/**
 * Check if verbose logging is enabled
 */
export const isVerbose = (): boolean => {
	return process.env.PLAYWRIGHT_VERBOSE_LOGS === "true"
}

/**
 * Check if running in CI environment
 */
export const isCI = (): boolean => {
	return process.env.CI === "true"
}

/**
 * Log a message only in verbose mode
 */
export const verboseLog = (message: string): void => {
	if (isVerbose()) {
		console.log(message)
	}
}

/**
 * Log an error (always shown)
 */
export const errorLog = (message: string): void => {
	console.log(message)
}

/**
 * Log a warning (shown in CI or verbose mode)
 */
export const warnLog = (message: string): void => {
	if (isVerbose() || isCI()) {
		console.log(message)
	}
}

/**
 * Log debug info (only in verbose mode)
 */
export const debugLog = (message: string): void => {
	if (isVerbose()) {
		console.log(message)
	}
}
