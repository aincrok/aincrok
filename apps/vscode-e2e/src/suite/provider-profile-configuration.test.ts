// aincrok_change - E2E test for provider/profile configuration changes
import * as assert from "assert"
import * as vscode from "vscode"

// Type definitions for test messages
interface ApiConfiguration {
	apiProvider: string
	apiModelId: string
	apiKey?: string
	openAiApiKey?: string
	openAiBaseUrl?: string
	includeMaxTokens?: boolean
	maxTokens?: number
	temperature?: number
	topP?: number
	reasoningEffort?: string
}

interface ApiConfigMessage {
	type: "upsertApiConfiguration"
	text: string
	apiConfiguration: ApiConfiguration
}

interface ProfileThresholds {
	low?: number
	medium?: number
	high?: number
	critical?: number
	warning?: number
	error?: number
	lowThreshold?: number
	mediumThreshold?: number
	highThreshold?: number
}

interface GhostServiceSettings {
	enabled: boolean | string
	endpoint: string | number
	apiKey?: string
	timeout?: number | string
	retryAttempts?: number
}

interface SupportPrompts {
	default?: string
	error?: string
	help?: string
	debug?: string
}

type SettingsMessage =
	| { type: "profileThresholds"; values: ProfileThresholds }
	| { type: "ghostServiceSettings"; values: GhostServiceSettings }
	| { type: "updateSupportPrompt"; values: SupportPrompts }
	| { type: string; bool: boolean }
	| { type: string; value: number }
	| { type: string; text: string }

type WebviewMessage = ApiConfigMessage | SettingsMessage

suite("Provider/Profile Configuration E2E Tests", function () {
	this.timeout(30000)

	let originalShowErrorMessage: typeof vscode.window.showErrorMessage
	let originalShowInformationMessage: typeof vscode.window.showInformationMessage
	let errorMessages: string[] = []
	let infoMessages: string[] = []

	// Helper function to send message and wait
	async function sendMessageAndWait(message: WebviewMessage, delayMs: number = 500): Promise<void> {
		await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
		await new Promise((resolve) => setTimeout(resolve, delayMs))
	}

	// Helper function to verify no errors
	function expectNoErrors(): void {
		assert.strictEqual(errorMessages.length, 0, "Expected no error messages")
	}

	// Helper function to verify error occurred
	function expectError(expectedText?: string): void {
		assert.ok(errorMessages.length > 0, "Expected at least one error message")
		if (expectedText) {
			const errorMessage = errorMessages[0]
			assert.ok(errorMessage, "Error message should exist")
			assert.ok(
				errorMessage.includes(expectedText),
				`Expected error to include "${expectedText}", got "${errorMessage}"`,
			)
		}
	}

	// Helper function to create API configuration message
	function createApiConfigMessage(
		name: string,
		provider: string,
		modelId: string,
		additionalSettings: Partial<ApiConfiguration> = {},
	): ApiConfigMessage {
		const baseConfig: ApiConfiguration = {
			apiProvider: provider,
			apiModelId: modelId,
			includeMaxTokens: true,
			maxTokens: 4096,
			temperature: 0.7,
		}

		// Add provider-specific keys
		if (provider === "anthropic") {
			baseConfig.apiKey = additionalSettings.apiKey || "sk-ant-test-key"
		} else if (provider === "openai") {
			baseConfig.openAiApiKey = additionalSettings.openAiApiKey || "sk-test-openai-key"
			baseConfig.openAiBaseUrl = additionalSettings.openAiBaseUrl || "https://api.openai.com/v1"
		}

		return {
			type: "upsertApiConfiguration",
			text: name,
			apiConfiguration: { ...baseConfig, ...additionalSettings },
		}
	}

	suiteSetup(async function () {
		// Activate the extension
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		if (extension && !extension.isActive) {
			await extension.activate()
		}

		// Store original methods and replace with tracking versions
		originalShowErrorMessage = vscode.window.showErrorMessage
		originalShowInformationMessage = vscode.window.showInformationMessage
		;(vscode.window as any).showErrorMessage = (message: string, ...args: any[]) => {
			errorMessages.push(message)
			return originalShowErrorMessage(message, ...args)
		}
		;(vscode.window as any).showInformationMessage = (message: string, ...args: any[]) => {
			infoMessages.push(message)
			return originalShowInformationMessage(message, ...args)
		}
	})

	suiteTeardown(function () {
		// Restore original methods
		;(vscode.window as any).showErrorMessage = originalShowErrorMessage
		;(vscode.window as any).showInformationMessage = originalShowInformationMessage
	})

	setup(function () {
		// Clear message arrays before each test
		errorMessages = []
		infoMessages = []
	})

	suite("Changing Provider Configuration", () => {
		test("should successfully update Anthropic provider configuration", async function () {
			const configMessage = createApiConfigMessage("anthropic-claude", "anthropic", "claude-3-opus-20240229", {
				apiKey: "sk-ant-test-key-123",
				maxTokens: 8192,
				topP: 0.95,
			})

			await sendMessageAndWait(configMessage, 1000)
			expectNoErrors()
		})

		test("should successfully update OpenAI provider configuration", async function () {
			const configMessage = createApiConfigMessage("openai-gpt4", "openai", "gpt-4", {
				temperature: 0.5,
			})

			await sendMessageAndWait(configMessage, 1000)
			expectNoErrors()
		})

		test("should handle the 'sonnet' configuration name without error", async function () {
			// This is the specific case that was failing
			const configMessage = createApiConfigMessage("sonnet", "anthropic", "claude-3-sonnet-20240229", {
				apiKey: "sk-ant-sonnet-key",
			})

			await sendMessageAndWait(configMessage, 1000)
			expectNoErrors() // Should NOT show the "Cannot access 'apiConfiguration' before initialization" error
		})

		test("should handle updating an existing configuration", async function () {
			// First create a configuration
			const createMessage = createApiConfigMessage("test-config", "anthropic", "claude-3-opus-20240229", {
				apiKey: "sk-initial-key",
			})

			await sendMessageAndWait(createMessage)

			// Then update it with the same name
			const updateMessage = createApiConfigMessage("test-config", "anthropic", "claude-3-sonnet-20240229", {
				apiKey: "sk-updated-key",
			})

			await sendMessageAndWait(updateMessage)
			expectNoErrors()
		})
	})

	// Helper to create settings messages
	function createSettingsMessage(
		type: string,
		data: ProfileThresholds | GhostServiceSettings | SupportPrompts | boolean | number | string,
	): SettingsMessage {
		// Type guards to properly construct messages
		if (typeof data === "boolean") {
			return { type, bool: data } as SettingsMessage
		}
		if (typeof data === "number") {
			return { type, value: data } as SettingsMessage
		}
		if (typeof data === "string") {
			return { type, text: data } as SettingsMessage
		}

		// For object types, cast based on the type string
		if (type === "profileThresholds") {
			return { type, values: data as ProfileThresholds } as SettingsMessage
		}
		if (type === "ghostServiceSettings") {
			return { type, values: data as GhostServiceSettings } as SettingsMessage
		}
		if (type === "updateSupportPrompt") {
			return { type, values: data as SupportPrompts } as SettingsMessage
		}

		// Default fallback
		return { type, text: String(data) } as SettingsMessage
	}

	suite("Changing Profile Settings", () => {
		interface ProfileSettingsTest {
			name: string
			type: string
			data: ProfileThresholds | GhostServiceSettings | SupportPrompts
		}

		const profileSettingsTests: ProfileSettingsTest[] = [
			{
				name: "profile thresholds",
				type: "profileThresholds",
				data: { low: 25, medium: 50, high: 75, critical: 90 },
			},
			{
				name: "ghost service settings",
				type: "ghostServiceSettings",
				data: {
					enabled: true,
					endpoint: "https://ghost.example.com",
					apiKey: "ghost-key-123",
					timeout: 10000,
					retryAttempts: 3,
				},
			},
			{
				name: "support prompts",
				type: "updateSupportPrompt",
				data: {
					default: "Default support prompt",
					error: "Error prompt",
					help: "Help prompt",
					debug: "Debug prompt",
				},
			},
		]

		profileSettingsTests.forEach((testData) => {
			test(`should update ${testData.name}`, async function () {
				const message = createSettingsMessage(testData.type, testData.data)
				await sendMessageAndWait(message)
				expectNoErrors()
			})
		})
	})

	suite("Complete Settings Save Flow", () => {
		test("should handle a complete settings save like the UI does", async function () {
			// This simulates all the messages sent when user clicks Save in settings
			const messages = [
				// Toggle settings
				createSettingsMessage("alwaysAllowFollowupQuestions", true),
				createSettingsMessage("systemNotificationsEnabled", true),
				createSettingsMessage("includeTaskHistoryInEnhance", false),

				// Numeric settings
				createSettingsMessage("followupAutoApproveTimeoutMs", 5000),
				{ type: "memoryPressure", text: "512" }, // Some might still come as text

				// String settings
				createSettingsMessage("currentApiConfigName", "claude-sonnet"),
				createSettingsMessage("updateCondensingPrompt", "Please condense the following conversation"),

				// Object settings
				createSettingsMessage("updateSupportPrompt", {
					default: "How can I help?",
					error: "I encountered an error",
				}),
				createSettingsMessage("profileThresholds", { warning: 50, error: 80 }),
				createSettingsMessage("ghostServiceSettings", { enabled: false, endpoint: "", apiKey: "" }),

				// The main configuration update
				createApiConfigMessage("claude-sonnet", "anthropic", "claude-3-5-sonnet-20241022", {
					apiKey: "sk-ant-api-key-here",
					maxTokens: 8192,
					topP: 0.95,
					reasoningEffort: "medium",
				}),
			]

			// Send all messages as the UI would
			for (const message of messages) {
				await sendMessageAndWait(message, 100)
			}

			// Wait for all async processing
			await new Promise((resolve) => setTimeout(resolve, 1000))
			expectNoErrors()
		})

		test("should handle rapid configuration changes without errors", async function () {
			// Test that rapid changes don't cause race conditions
			const configs = [
				{ name: "config1", model: "claude-3-opus-20240229" },
				{ name: "config2", model: "claude-3-sonnet-20240229" },
				{ name: "config3", model: "claude-3-haiku-20240307" },
			]

			// Send configurations rapidly
			const promises = configs.map((config) =>
				vscode.commands.executeCommand(
					"aincrok.sendWebviewMessage",
					createApiConfigMessage(config.name, "anthropic", config.model),
				),
			)

			await Promise.all(promises)
			await new Promise((resolve) => setTimeout(resolve, 1000))
			expectNoErrors()
		})
	})

	suite("Error Cases", () => {
		test("should show error for missing configuration data", async function () {
			const message = {
				type: "upsertApiConfiguration",
				// Missing both text and apiConfiguration
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
			await new Promise((resolve) => setTimeout(resolve, 500))

			// Should show an error
			assert.ok(errorMessages.length > 0, "Expected an error message")
			const errorMessage = errorMessages[0]
			assert.ok(errorMessage, "Error message should exist")
			assert.ok(
				errorMessage.includes("Failed to update configuration"),
				`Expected error about configuration, got: ${errorMessage}`,
			)
		})

		test("should handle invalid ghost service settings gracefully", async function () {
			const message = {
				type: "ghostServiceSettings",
				values: {
					enabled: "not-a-boolean", // Invalid type
					endpoint: 123, // Should be string
					timeout: "not-a-number", // Should be number
				},
			}

			await vscode.commands.executeCommand("aincrok.sendWebviewMessage", message)
			await new Promise((resolve) => setTimeout(resolve, 500))

			// May show error depending on schema validation
			// But should not crash the extension
		})
	})
})
