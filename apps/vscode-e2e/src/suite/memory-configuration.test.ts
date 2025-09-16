// aincrok_change - new file
import * as assert from "assert"
import * as vscode from "vscode"
import { setDefaultSuiteTimeout } from "./test-utils"
import { waitFor } from "./utils"
import type { RooCodeAPI } from "@roo-code/types"

suite("Memory Configuration", function () {
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

	suite("Configuration Persistence", () => {
		test("should save memory configuration fields correctly", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Configure memory settings
			const testConfiguration = {
				cipherMode: "embedded",
				cipherLlmProvider: "openai",
				cipherLlmModel: "gpt-4",
				cipherLlmApiKey: "test-key-123",
				cipherVectorStore: "qdrant",
				cipherVectorStoreUrl: "http://localhost:6333",
				cipherEmbeddingProvider: "openai",
				cipherEmbeddingModel: "text-embedding-3-small",
				cipherEmbeddingDimensions: "1536",
			}

			// Apply configuration through API
			await api.setConfiguration(testConfiguration as any)

			// Get configuration
			const config = vscode.workspace.getConfiguration("aincrok")

			// Verify configuration values
			assert.strictEqual(config.get("cipherMode"), "embedded")
			assert.strictEqual(config.get("cipherLlmProvider"), "openai")
			assert.strictEqual(config.get("cipherLlmModel"), "gpt-4")
			assert.strictEqual(config.get("cipherVectorStore"), "qdrant")
			assert.strictEqual(config.get("cipherVectorStoreUrl"), "http://localhost:6333")
		})

		test("should load saved configuration on startup", async () => {
			// Set configuration
			const testConfig = {
				cipherMode: "mcp",
				cipherMcpCommand: "node",
				cipherMcpArgs: "server.js",
				cipherMcpTimeout: "45000",
				cipherMcpConnectionType: "stdio",
			}

			// Save configuration
			await api.setConfiguration(testConfig as any)

			// Get configuration
			const config = vscode.workspace.getConfiguration("aincrok")

			// Verify all fields
			assert.strictEqual(config.get("cipherMode"), "mcp")
			assert.strictEqual(config.get("cipherMcpCommand"), "node")
			assert.strictEqual(config.get("cipherMcpArgs"), "server.js")
			assert.strictEqual(config.get("cipherMcpTimeout"), "45000")
			assert.strictEqual(config.get("cipherMcpConnectionType"), "stdio")
		})

		test("should handle configuration updates correctly", async () => {
			// Initial configuration
			await api.setConfiguration({
				cipherMode: "api",
				cipherApiUrl: "https://api.example.com",
				cipherApiKey: "initial-key",
			} as any)

			// Verify initial values
			let config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "api")
			assert.strictEqual(config.get("cipherApiUrl"), "https://api.example.com")

			// Update configuration
			await api.setConfiguration({
				cipherApiUrl: "https://api.updated.com",
				cipherApiKey: "updated-key",
				cipherApiTimeout: "60000",
			} as any)

			// Verify updated values
			config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherApiUrl"), "https://api.updated.com")
			assert.strictEqual(config.get("cipherApiTimeout"), "60000")
		})

		test("should validate cipher field structure", async () => {
			// Get configuration schema
			const config = vscode.workspace.getConfiguration("aincrok")

			// Check that cipher fields exist
			assert.ok(config.has("cipherMode"))
			assert.ok(config.has("cipherLlmProvider"))
			assert.ok(config.has("cipherVectorStore"))
			assert.ok(config.has("cipherEmbeddingProvider"))
		})

		test("should persist configuration profiles", async () => {
			const testConfiguration = {
				apiProvider: "openai" as const,
				openAiApiKey: "test-key",
				cipherMode: "embedded",
				cipherLlmProvider: "openai",
				cipherLlmModel: "gpt-4",
				cipherVectorStore: "in-memory",
				cipherMaxSessions: "10",
				cipherSessionTTL: "7200",
			}

			// Save configuration
			await api.setConfiguration(testConfiguration as any)

			// Verify fields are saved
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.strictEqual(config.get("cipherMode"), "embedded")
			assert.strictEqual(config.get("cipherLlmProvider"), "openai")
			assert.strictEqual(config.get("cipherMaxSessions"), "10")
			assert.strictEqual(config.get("cipherSessionTTL"), "7200")
		})
	})
})
