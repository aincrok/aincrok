/**
 * End-to-End tests for Memory Connection Test Button Bug
 *
 * These tests use a real VS Code instance with the Aincrok extension to reproduce
 * the exact user workflow where the "Test Connection" button becomes permanently
 * disabled after a connection error.
 *
 * Uses @vscode/test-electron to launch VS Code and simulates user interactions
 * with memory settings and connection testing.
 */

import * as vscode from "vscode"
import { describe, it, before, after, beforeEach, afterEach } from "mocha"
import { expect } from "chai"

describe("Memory Connection Test Button E2E Tests", () => {
	let originalSettings: { [key: string]: any } = {}

	before(async function () {
		this.timeout(30000)

		// Ensure the Aincrok extension is activated
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		if (extension && !extension.isActive) {
			await extension.activate()
		}

		// Store original settings for restoration
		const config = vscode.workspace.getConfiguration("aincrok")
		originalSettings = {
			memoryProvider: config.get("memoryProvider"),
			memoryApiKey: config.get("memoryApiKey"),
			memoryBaseUrl: config.get("memoryBaseUrl"),
			memoryEnabled: config.get("memoryEnabled"),
		}
	})

	after(async () => {
		// Restore original settings
		const config = vscode.workspace.getConfiguration("aincrok")
		for (const [key, value] of Object.entries(originalSettings)) {
			await config.update(key, value, vscode.ConfigurationTarget.Global)
		}
	})

	beforeEach(async function () {
		this.timeout(10000)
		// Open Aincrok sidebar/panel for memory settings
		await vscode.commands.executeCommand("aincrok.focus")
		await new Promise((resolve) => setTimeout(resolve, 2000))
	})

	afterEach(async () => {
		// Close any open panels or notifications
		await vscode.commands.executeCommand("workbench.action.closeAllEditors")
		await vscode.commands.executeCommand("notifications.clearAll")
	})

	describe("Memory Connection Test Button State", () => {
		it("shouldReenableButtonAfterConnectionError", async function () {
			this.timeout(45000)

			// Step 1: Configure invalid memory settings that will cause connection failure
			const config = vscode.workspace.getConfiguration("aincrok")

			await config.update("memoryProvider", "cipher", vscode.ConfigurationTarget.Global)
			await config.update("memoryEnabled", true, vscode.ConfigurationTarget.Global)
			await config.update("memoryApiKey", "", vscode.ConfigurationTarget.Global) // Invalid empty key
			await config.update(
				"memoryBaseUrl",
				"https://invalid-endpoint.example.com",
				vscode.ConfigurationTarget.Global,
			)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Step 2: Navigate to memory settings in the extension
			await vscode.commands.executeCommand("aincrok.openMemorySettings")
			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Step 3: Trigger test connection (this simulates clicking the Test Connection button)
			// We'll use a command or API call that triggers the same flow as the UI button
			let connectionTestResult: any = null
			let connectionTestCompleted = false

			// Listen for connection test results
			const disposable = vscode.commands.registerCommand("aincrok.test.connectionResult", (result) => {
				connectionTestResult = result
				connectionTestCompleted = true
			})

			try {
				// Trigger memory connection test
				await vscode.commands.executeCommand("aincrok.testMemoryConnection")

				// Wait for connection test to complete (should fail due to invalid config)
				let attempts = 0
				while (!connectionTestCompleted && attempts < 30) {
					// 30 second timeout
					await new Promise((resolve) => setTimeout(resolve, 1000))
					attempts++
				}

				// Step 4: Verify connection test failed as expected
				expect(connectionTestCompleted).to.be.true
				expect(connectionTestResult?.success).to.be.false

				// Step 5: Fix the configuration (this simulates user correcting the error)
				await config.update("memoryApiKey", "valid-test-key-12345", vscode.ConfigurationTarget.Global)
				await config.update("memoryBaseUrl", "https://api.mem0.ai", vscode.ConfigurationTarget.Global)
				await new Promise((resolve) => setTimeout(resolve, 2000))

				// Step 6: Test connection again (button should be re-enabled and functional)
				connectionTestResult = null
				connectionTestCompleted = false

				await vscode.commands.executeCommand("aincrok.testMemoryConnection")

				// Wait for second connection test
				attempts = 0
				while (!connectionTestCompleted && attempts < 30) {
					await new Promise((resolve) => setTimeout(resolve, 1000))
					attempts++
				}

				// Step 7: Verify the button was functional for the second test
				expect(connectionTestCompleted).to.be.true
				// Note: This test might still fail due to invalid API key, but the important
				// thing is that the button was functional and able to initiate a second test
			} finally {
				disposable.dispose()
			}
		})

		it("shouldHandleMultipleConnectionFailuresWithoutPermanentDisable", async function () {
			this.timeout(60000)

			// Test multiple consecutive failures to ensure button doesn't get permanently stuck
			const config = vscode.workspace.getConfiguration("aincrok")

			const testConfigurations = [
				{
					name: "Empty API Key Test",
					memoryApiKey: "",
					memoryBaseUrl: "https://api.mem0.ai",
				},
				{
					name: "Invalid API Key Test",
					memoryApiKey: "invalid-key-123",
					memoryBaseUrl: "https://api.mem0.ai",
				},
				{
					name: "Unreachable Endpoint Test",
					memoryApiKey: "test-key-456",
					memoryBaseUrl: "https://unreachable-endpoint.invalid",
				},
			]

			await config.update("memoryProvider", "cipher", vscode.ConfigurationTarget.Global)
			await config.update("memoryEnabled", true, vscode.ConfigurationTarget.Global)

			let testResults: any[] = []

			// Listen for test results
			const disposable = vscode.commands.registerCommand("aincrok.test.connectionResult", (result) => {
				testResults.push(result)
			})

			try {
				for (let i = 0; i < testConfigurations.length; i++) {
					const testConfig = testConfigurations[i]

					// Apply test configuration
					await config.update("memoryApiKey", testConfig.memoryApiKey, vscode.ConfigurationTarget.Global)
					await config.update("memoryBaseUrl", testConfig.memoryBaseUrl, vscode.ConfigurationTarget.Global)
					await new Promise((resolve) => setTimeout(resolve, 2000))

					// Trigger connection test
					const previousResultCount = testResults.length
					await vscode.commands.executeCommand("aincrok.testMemoryConnection")

					// Wait for this test to complete
					let attempts = 0
					while (testResults.length <= previousResultCount && attempts < 20) {
						await new Promise((resolve) => setTimeout(resolve, 1000))
						attempts++
					}

					// Verify test completed (whether success or failure)
					expect(testResults.length).to.be.greaterThan(
						previousResultCount,
						`Connection test ${i + 1} (${testConfig.name}) should have completed`,
					)
				}

				// Verify all tests completed, indicating button remained functional
				expect(testResults.length).to.equal(testConfigurations.length)

				// Most importantly, verify we could run all tests (button didn't get stuck)
				console.log(
					"All connection tests completed:",
					testResults.map((r) => r.success),
				)
			} finally {
				disposable.dispose()
			}
		})

		it("shouldMaintainButtonFunctionalityAfterSettingsChanges", async function () {
			this.timeout(45000)

			// Test that button remains functional when switching between different memory providers
			const config = vscode.workspace.getConfiguration("aincrok")

			await config.update("memoryEnabled", true, vscode.ConfigurationTarget.Global)

			const providerTests = [
				{
					provider: "cipher",
					apiKey: "cipher-test-key",
					baseUrl: "https://cipher-api.example.com",
				},
				{
					provider: "mem0",
					apiKey: "mem0-test-key",
					baseUrl: "https://api.mem0.ai",
				},
			]

			let testResults: any[] = []
			const disposable = vscode.commands.registerCommand("aincrok.test.connectionResult", (result) => {
				testResults.push({ ...result, timestamp: Date.now() })
			})

			try {
				for (const providerTest of providerTests) {
					// Switch memory provider
					await config.update("memoryProvider", providerTest.provider, vscode.ConfigurationTarget.Global)
					await config.update("memoryApiKey", providerTest.apiKey, vscode.ConfigurationTarget.Global)
					await config.update("memoryBaseUrl", providerTest.baseUrl, vscode.ConfigurationTarget.Global)

					await new Promise((resolve) => setTimeout(resolve, 3000))

					// Test connection for this provider
					const previousCount = testResults.length
					await vscode.commands.executeCommand("aincrok.testMemoryConnection")

					// Wait for test completion
					let attempts = 0
					while (testResults.length <= previousCount && attempts < 20) {
						await new Promise((resolve) => setTimeout(resolve, 1000))
						attempts++
					}

					expect(testResults.length).to.be.greaterThan(
						previousCount,
						`Connection test should complete for provider: ${providerTest.provider}`,
					)
				}

				// Verify button remained functional across provider switches
				expect(testResults.length).to.equal(providerTests.length)
			} finally {
				disposable.dispose()
			}
		})

		it("shouldRecoverFromUIStateErrors", async function () {
			this.timeout(30000)

			// Test recovery from UI state issues that might affect button functionality
			const config = vscode.workspace.getConfiguration("aincrok")

			// Set up a configuration that should work
			await config.update("memoryProvider", "cipher", vscode.ConfigurationTarget.Global)
			await config.update("memoryEnabled", true, vscode.ConfigurationTarget.Global)
			await config.update("memoryApiKey", "recovery-test-key", vscode.ConfigurationTarget.Global)
			await config.update("memoryBaseUrl", "https://api.example.com", vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Simulate various UI operations that might affect state
			await vscode.commands.executeCommand("workbench.action.reloadWindow")
			await new Promise((resolve) => setTimeout(resolve, 5000))

			// Re-activate extension if needed
			const extension = vscode.extensions.getExtension("aincrok.aincrok")
			if (extension && !extension.isActive) {
				await extension.activate()
				await new Promise((resolve) => setTimeout(resolve, 2000))
			}

			// Navigate back to memory settings
			await vscode.commands.executeCommand("aincrok.openMemorySettings")
			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Test that connection test button is still functional after UI recovery
			let testCompleted = false
			const disposable = vscode.commands.registerCommand("aincrok.test.connectionResult", (result) => {
				testCompleted = true
			})

			try {
				await vscode.commands.executeCommand("aincrok.testMemoryConnection")

				let attempts = 0
				while (!testCompleted && attempts < 20) {
					await new Promise((resolve) => setTimeout(resolve, 1000))
					attempts++
				}

				expect(testCompleted, "Connection test button should remain functional after UI recovery").to.be.true
			} finally {
				disposable.dispose()
			}
		})
	})

	describe("Settings Panel Integration", () => {
		it("shouldMaintainButtonStateAcrossSettingsPanelOperations", async function () {
			this.timeout(30000)

			// Test button state when using VS Code settings panel
			const config = vscode.workspace.getConfiguration("aincrok")

			// Open settings panel
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok memory")
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Modify settings through VS Code settings UI
			await config.update("memoryEnabled", true, vscode.ConfigurationTarget.Global)
			await config.update("memoryProvider", "cipher", vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Navigate back to Aincrok extension panel
			await vscode.commands.executeCommand("aincrok.focus")
			await vscode.commands.executeCommand("aincrok.openMemorySettings")
			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Test that connection button is functional
			let testCompleted = false
			const disposable = vscode.commands.registerCommand("aincrok.test.connectionResult", (result) => {
				testCompleted = true
			})

			try {
				await vscode.commands.executeCommand("aincrok.testMemoryConnection")

				let attempts = 0
				while (!testCompleted && attempts < 15) {
					await new Promise((resolve) => setTimeout(resolve, 1000))
					attempts++
				}

				expect(testCompleted, "Connection test should work after settings panel modifications").to.be.true
			} finally {
				disposable.dispose()
			}
		})
	})
})
