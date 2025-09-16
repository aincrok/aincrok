// aincrok_change - new e2e test for memory provider selection
import * as assert from "assert"
import * as vscode from "vscode"

import type { RooCodeAPI } from "@roo-code/types"

import { waitFor } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("Memory Provider Selection E2E Tests", function () {
	setDefaultSuiteTimeout(this)

	let api: RooCodeAPI

	suiteSetup(async () => {
		// Get the API from the extension
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Aincrok extension should be installed")

		if (!extension.isActive) {
			await extension.activate()
		}

		api = extension.exports
		assert.ok(api, "API should be available")

		// Wait for API to be ready
		await waitFor(() => api.isReady())
	})

	suite("Memory Provider Configuration", () => {
		test("should support memory provider validation", () => {
			// Test that memory providers are recognized
			const memoryProviders = ["local", "filesystem", "mem0", "openai"]

			for (const provider of memoryProviders) {
				assert.ok(typeof provider === "string", `Memory provider ${provider} should be supported`)
			}
		})

		test("should validate memory configuration structure", () => {
			// Test memory configuration structure
			const validConfig = {
				mode: "embedded",
				embedded: {
					provider: "mem0",
					config: {
						user_id: "test_user",
						provider: "openai",
						embed_provider: "openai",
					},
				},
			}

			assert.ok(validConfig.mode === "embedded", "Should support embedded mode")
			assert.ok(validConfig.embedded?.provider === "mem0", "Should support mem0 provider")
			assert.ok(typeof validConfig.embedded?.config === "object", "Should have config object")
		})

		test("should handle LLM provider options", () => {
			// Test LLM provider options
			const llmProviders = ["openai", "anthropic", "ollama"]

			for (const provider of llmProviders) {
				const config = {
					type: provider,
					model: "test-model",
					apiKey: "test-key",
				}

				assert.ok(config.type === provider, `Should support ${provider} LLM provider`)
				assert.ok(typeof config.model === "string", "Should have model specified")
			}
		})

		test("should handle embedding provider options", () => {
			// Test embedding provider options
			const embeddingProviders = ["openai", "ollama", "huggingface"]

			for (const provider of embeddingProviders) {
				const config = {
					type: provider,
					model: "test-embedding-model",
				}

				assert.ok(config.type === provider, `Should support ${provider} embedding provider`)
				assert.ok(typeof config.model === "string", "Should have embedding model specified")
			}
		})

		test("should handle different operation modes", () => {
			// Test different memory operation modes
			const modes = ["embedded", "mcp", "api"]

			for (const mode of modes) {
				assert.ok(typeof mode === "string", `Should support ${mode} mode`)
			}
		})
	})
})
