import * as vscode from "vscode"
import * as assert from "assert"
import { waitFor } from "./utils"

/**
 * Helper for reliable extension activation in test environment
 */
export class ExtensionActivationHelper {
	private static readonly EXTENSION_ID = "aincrok.aincrok"
	private static readonly ACTIVATION_TIMEOUT = 30000
	private static readonly API_READY_TIMEOUT = 15000

	/**
	 * Ensures the extension is activated and ready
	 */
	static async ensureExtensionActivated(): Promise<vscode.Extension<any>> {
		const extension = vscode.extensions.getExtension(this.EXTENSION_ID)
		assert.ok(extension, `Extension ${this.EXTENSION_ID} should be installed`)

		// Activate if not already active
		if (!extension.isActive) {
			console.log(`Activating extension ${this.EXTENSION_ID}...`)
			await extension.activate()
			console.log(`Extension ${this.EXTENSION_ID} activated`)
		}

		assert.ok(extension.isActive, `Extension ${this.EXTENSION_ID} should be active`)
		return extension
	}

	/**
	 * Waits for the global API to be ready
	 */
	static async waitForApiReady(): Promise<any> {
		const api = globalThis.api
		assert.ok(api, "Global API should be available")

		console.log("Waiting for API to be ready...")
		await waitFor(() => api.isReady(), {
			timeout: this.API_READY_TIMEOUT,
			interval: 500,
		})

		assert.ok(api.isReady(), "API should be ready")
		console.log("API is ready")

		return api
	}

	/**
	 * Full initialization sequence for tests
	 */
	static async initialize(): Promise<{ extension: vscode.Extension<any>; api: any }> {
		const extension = await this.ensureExtensionActivated()
		const api = await this.waitForApiReady()

		// Clear any existing tasks for clean test state
		try {
			await api.clearCurrentTask()
			console.log("Cleared existing tasks")
		} catch (error) {
			// Expected if no task exists
			console.log("No existing tasks to clear")
		}

		return { extension, api }
	}

	/**
	 * Focus the sidebar and wait for it to be ready
	 */
	static async focusSidebar(): Promise<void> {
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
			console.log("Sidebar focused")
			// Wait for sidebar to initialize
			await new Promise((resolve) => setTimeout(resolve, 2000))
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}
	}

	/**
	 * Execute plus button click to open new task
	 */
	static async openNewTask(): Promise<void> {
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
			console.log("Plus button clicked")
			// Wait for command to process
			await new Promise((resolve) => setTimeout(resolve, 1000))
		} catch (error) {
			console.warn("Plus button command warning:", error)
		}
	}

	/**
	 * Verify extension commands are registered
	 */
	static async verifyCommands(): Promise<void> {
		const commands = await vscode.commands.getCommands(true)

		const requiredCommands = [
			"aincrok.SidebarProvider.focus",
			"aincrok.plusButtonClicked",
			"aincrok.settingsButtonClicked",
			"aincrok.historyButtonClicked",
		]

		for (const cmd of requiredCommands) {
			assert.ok(commands.includes(cmd), `Required command '${cmd}' should be registered`)
		}

		console.log("All required commands are registered")
	}

	/**
	 * Check if PostHog is configured (for CloudService)
	 */
	static isPostHogConfigured(): boolean {
		return !!(process.env.POSTHOG_API_KEY && process.env.POSTHOG_HOST)
	}

	/**
	 * Set up test environment variables if needed
	 */
	static setupTestEnvironment(): void {
		// Set test environment flag
		process.env.IS_TEST_ENVIRONMENT = "true"

		// Set PostHog config if not present (prevents CloudService errors)
		if (!process.env.POSTHOG_API_KEY) {
			process.env.POSTHOG_API_KEY = "test-posthog-key"
			process.env.POSTHOG_HOST = "https://app.posthog.com"
			console.log("Set default PostHog configuration for testing")
		}

		// Disable telemetry in tests
		process.env.SKIP_TELEMETRY = "true"
		process.env.DISABLE_ANALYTICS = "true"
	}
}
