import * as vscode from "vscode"
import type { RooCodeAPI } from "@roo-code/types"

// Global types declaration is in global.d.ts

/**
 * Initialize the extension and set up global API
 */
export async function setupTestEnvironment(): Promise<void> {
	console.log("[TEST SETUP] Initializing test environment...")

	// Set test environment flag
	process.env.IS_TEST_ENVIRONMENT = "true"

	// Get the extension
	const extension = vscode.extensions.getExtension("aincrok.aincrok")
	if (!extension) {
		throw new Error("Extension aincrok.aincrok not found")
	}

	console.log("[TEST SETUP] Found extension:", extension.id)

	// Activate and get API
	if (!extension.isActive) {
		console.log("[TEST SETUP] Activating extension...")
		const api = await extension.activate()

		// Set global API
		globalThis.api = api
		console.log("[TEST SETUP] Extension activated, API set globally")
	} else {
		console.log("[TEST SETUP] Extension already active")
		// Try to get exports as API
		globalThis.api = extension.exports
	}

	// Verify API is available
	if (!globalThis.api) {
		throw new Error("API not available after extension activation")
	}

	console.log("[TEST SETUP] Test environment ready")
}

/**
 * Clean up test environment
 */
export async function teardownTestEnvironment(): Promise<void> {
	console.log("[TEST SETUP] Cleaning up test environment...")

	// Clear any active tasks
	try {
		if (globalThis.api?.clearCurrentTask) {
			await globalThis.api.clearCurrentTask()
		}
	} catch (error) {
		// Expected if no task exists
	}

	console.log("[TEST SETUP] Test environment cleaned up")
}
