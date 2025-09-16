// aincrok_change - E2E test for settings configuration message handling
import * as assert from "assert"
import * as vscode from "vscode"
import * as path from "path"

// Define proper types for webview messages
interface ApiConfiguration {
	apiProvider: string
	apiKey?: string
	apiModelId: string
	openAiApiKey?: string
	openAiBaseUrl?: string
}

interface ProfileThresholds {
	lowThreshold?: number
	mediumThreshold?: number
	highThreshold?: number
	low?: number
	medium?: number
	high?: number
	critical?: number
	warning?: number
	error?: number
}

interface GhostServiceSettings {
	enabled: boolean
	endpoint: string
	timeout?: number
	apiKey?: string
}

interface SupportPrompts {
	default?: string
	error?: string
	help?: string
}

interface LegacyConfig {
	id: string
	name: string
	settings: ApiConfiguration
}

interface TestWebviewMessage {
	type: string
	text?: string
	values?: ProfileThresholds | GhostServiceSettings | SupportPrompts
	value?: number
	apiConfiguration?: ApiConfiguration
	bool?: boolean
}

suite("Settings Configuration E2E Tests", function () {
	this.timeout(30000)

	let extensionContext: vscode.ExtensionContext
	let webviewPanel: vscode.WebviewPanel | undefined
	let originalShowErrorMessage: typeof vscode.window.showErrorMessage
	let errorMessages: string[] = []

	suiteSetup(async function () {
		// Activate the extension
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		if (extension && !extension.isActive) {
			await extension.activate()
		}

		// Store original method and replace with tracking version
		originalShowErrorMessage = vscode.window.showErrorMessage
		;(vscode.window as any).showErrorMessage = (message: string, ...args: any[]) => {
			errorMessages.push(message)
			return originalShowErrorMessage(message, ...args)
		}
	})

	suiteTeardown(function () {
		if (webviewPanel) {
			webviewPanel.dispose()
		}
		// Restore original method
		;(vscode.window as any).showErrorMessage = originalShowErrorMessage
	})

	setup(function () {
		// Clear message arrays before each test
		errorMessages = []
	})

	suite("Message Property Handling", () => {
		test("should handle upsertApiConfiguration with apiConfiguration property", async function () {
			// Create a test message with the new format
			const testMessage: TestWebviewMessage = {
				type: "upsertApiConfiguration",
				text: "test-config-name", // Configuration name
				apiConfiguration: {
					apiProvider: "anthropic",
					apiKey: "test-key",
					apiModelId: "claude-3-opus-20240229",
				},
			}

			// Send the message through the command
			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)

			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 500))

			// Verify no error was shown
			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle profileThresholds with values property", async function () {
			const testMessage: TestWebviewMessage = {
				type: "profileThresholds",
				values: {
					lowThreshold: 30,
					mediumThreshold: 60,
					highThreshold: 90,
				},
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle ghostServiceSettings with values property", async function () {
			const testMessage: TestWebviewMessage = {
				type: "ghostServiceSettings",
				values: {
					enabled: true,
					endpoint: "https://ghost-service.example.com",
					timeout: 5000,
				},
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle boolean settings with bool property", async function () {
			const booleanMessages: TestWebviewMessage[] = [
				{
					type: "alwaysAllowFollowupQuestions",
					bool: true,
				},
				{
					type: "systemNotificationsEnabled",
					bool: false,
				},
				{
					type: "includeTaskHistoryInEnhance",
					bool: true,
				},
			]

			for (const message of booleanMessages) {
				await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
				await new Promise((resolve) => setTimeout(resolve, 200))
			}

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle numeric settings with value property", async function () {
			const testMessage: TestWebviewMessage = {
				type: "followupAutoApproveTimeoutMs",
				value: 3000,
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle updateSupportPrompt with values property", async function () {
			const testMessage: TestWebviewMessage = {
				type: "updateSupportPrompt",
				values: {
					default: "Default support prompt",
					error: "Error support prompt",
					help: "Help support prompt",
				},
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})
	})

	suite("Backward Compatibility", () => {
		test("should still handle JSON string format for backward compatibility", async function () {
			const testMessage: TestWebviewMessage = {
				type: "upsertApiConfiguration",
				text: JSON.stringify({
					id: "config-123",
					name: "legacy-config",
					settings: {
						apiProvider: "openai",
						apiKey: "sk-test",
						apiModelId: "gpt-4",
					},
				}),
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle text-based boolean settings", async function () {
			const testMessage: TestWebviewMessage = {
				type: "alwaysAllowFollowupQuestions",
				text: "true",
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle text-based numeric settings", async function () {
			const testMessage: TestWebviewMessage = {
				type: "followupAutoApproveTimeoutMs",
				text: "5000",
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})
	})

	suite("Error Handling", () => {
		test("should show error message for invalid upsertApiConfiguration data", async function () {
			const testMessage: TestWebviewMessage = {
				type: "upsertApiConfiguration",
				// Missing both text and apiConfiguration
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			// Should show an error message
			assert.ok(errorMessages.length > 0, "Expected an error message")
			const errorMessage = errorMessages[0]
			assert.ok(errorMessage, "Error message should exist")
			assert.ok(
				errorMessage.includes("Failed to update configuration"),
				`Expected error about configuration, got: ${errorMessage}`,
			)
		})

		test("should not crash when receiving 'sonnet' as text for upsertApiConfiguration", async function () {
			// This was the original error case
			const testMessage: TestWebviewMessage = {
				type: "upsertApiConfiguration",
				text: "sonnet", // Just a string, not valid JSON
				apiConfiguration: {
					apiProvider: "anthropic",
					apiKey: "test-key",
					apiModelId: "claude-3-sonnet-20240229",
				},
			}

			// This should work now with the fix
			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", testMessage)
			await new Promise((resolve) => setTimeout(resolve, 500))

			// Should NOT show an error with the fix
			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})

		test("should handle undefined values gracefully", async function () {
			const testMessages: TestWebviewMessage[] = [
				{
					type: "profileThresholds",
					// values is undefined, should use default
				},
				{
					type: "alwaysAllowFollowupQuestions",
					// bool is undefined, should use text fallback or default
				},
				{
					type: "followupAutoApproveTimeoutMs",
					// value is undefined, should use text fallback or default
				},
			]

			for (const message of testMessages) {
				errorMessages = []
				await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
				await new Promise((resolve) => setTimeout(resolve, 200))

				// Should handle gracefully without errors
				assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
			}
		})
	})

	suite("Complex Settings", () => {
		test("should handle all property types in a single save operation", async function () {
			// Simulate what happens when user clicks Save in settings
			const messages: TestWebviewMessage[] = [
				{ type: "alwaysAllowFollowupQuestions", bool: true },
				{ type: "followupAutoApproveTimeoutMs", value: 3000 },
				{ type: "updateCondensingPrompt", text: "Custom condensing prompt" },
				{ type: "updateSupportPrompt", values: { default: "Support prompt" } },
				{ type: "includeTaskHistoryInEnhance", bool: true },
				{
					type: "upsertApiConfiguration",
					text: "sonnet",
					apiConfiguration: {
						apiProvider: "anthropic",
						apiKey: "sk-ant-test",
						apiModelId: "claude-3-sonnet-20240229",
					},
				},
				{ type: "profileThresholds", values: { low: 25, high: 75 } },
				{ type: "systemNotificationsEnabled", bool: true },
				{
					type: "ghostServiceSettings",
					values: {
						enabled: false,
						endpoint: "",
						timeout: 10000,
					},
				},
			]

			// Send all messages as would happen on save
			for (const message of messages) {
				await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
				await new Promise((resolve) => setTimeout(resolve, 100))
			}

			// Verify no errors occurred
			assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
		})
	})
})
