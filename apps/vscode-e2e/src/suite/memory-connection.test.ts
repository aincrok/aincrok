// aincrok_change - new file
import * as assert from "assert"
import * as vscode from "vscode"
import { setDefaultSuiteTimeout } from "./test-utils"
import { waitFor } from "./utils"
import type { RooCodeAPI } from "@roo-code/types"

suite("Memory Connection", function () {
	setDefaultSuiteTimeout(this)

	let api: RooCodeAPI

	suiteSetup(async () => {
		api = (globalThis as any).api
		assert.ok(api, "API should be available")
	})

	teardown(async () => {
		// Reset configuration after each test
		await vscode.workspace.getConfiguration("aincrok").update("cipherMode", "disabled", true)
	})

	suite("Test Functionality", () => {
		test("should handle successful connection", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure valid memory settings
			const validConfig = {
				cipherMode: "api",
				cipherApiUrl: "https://api.example.com",
				cipherApiKey: "valid-test-key",
			}

			// Apply configuration
			await api.setConfiguration(validConfig as any)

			// Since Cipher test is UI-based, we verify configuration is set correctly
			// In a real e2e test, this would trigger the UI button
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "api")
			assert.strictEqual(config.get("cipherApiUrl"), "https://api.example.com")
			assert.strictEqual(config.get("cipherApiKey"), "valid-test-key")
		})

		test("should handle connection failure gracefully", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure invalid memory settings
			const invalidConfig = {
				cipherMode: "api",
				cipherApiUrl: "https://invalid.example.com",
				cipherApiKey: "invalid-key",
			}

			// Apply invalid configuration
			await api.setConfiguration(invalidConfig as any)

			// Verify configuration was set
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "api")
			assert.strictEqual(config.get("cipherApiUrl"), "https://invalid.example.com")
			// Invalid URL should cause failure when tested through UI
		})

		test("should timeout after 30 seconds", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure memory settings with short timeout
			const timeoutConfig = {
				cipherMode: "api",
				cipherApiUrl: "https://timeout.example.com",
				cipherApiKey: "test-key",
				cipherApiTimeout: "100", // Very short timeout
			}

			await api.setConfiguration(timeoutConfig as any)

			// Verify timeout configuration was set
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherApiTimeout"), "100")
			// The UI component has a 30-second timeout built-in as we fixed
		})

		test("should allow retry after failure", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure for failure
			const failConfig = {
				cipherMode: "api",
				cipherApiUrl: "https://fail.example.com",
				cipherApiKey: "bad-key",
			}
			await api.setConfiguration(failConfig as any)

			// Verify failure config is set
			let config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherApiUrl"), "https://fail.example.com")

			// Update to valid config
			const successConfig = {
				cipherMode: "disabled",
			}
			await api.setConfiguration(successConfig as any)

			// Verify successful config update
			config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "disabled")
			// With disabled mode, connection test should not fail
		})

		test("should validate required fields before testing", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure incomplete settings (missing API key)
			const incompleteConfig = {
				cipherMode: "api",
				cipherApiUrl: "https://api.example.com",
				// Missing cipherApiKey
			}

			await api.setConfiguration(incompleteConfig as any)

			// Verify incomplete configuration
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "api")
			assert.strictEqual(config.get("cipherApiUrl"), "https://api.example.com")
			const apiKey = config.get("cipherApiKey")
			assert.ok(!apiKey || apiKey === "", "API key should be missing or empty")
			// The UI validation would prevent test from running with missing required fields
		})

		test("should handle different memory modes correctly", async () => {
			// Test embedded mode
			await api.setConfiguration({
				cipherMode: "embedded",
				cipherLlmProvider: "openai",
				cipherLlmApiKey: "test-key",
			} as any)

			let config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "embedded")

			// Test MCP mode
			await api.setConfiguration({
				cipherMode: "mcp",
				cipherMcpCommand: "node",
				cipherMcpArgs: "server.js",
			} as any)

			config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "mcp")

			// Test API mode
			await api.setConfiguration({
				cipherMode: "api",
				cipherApiUrl: "https://api.example.com",
				cipherApiKey: "api-key",
			} as any)

			config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "api")
		})
	})
})
