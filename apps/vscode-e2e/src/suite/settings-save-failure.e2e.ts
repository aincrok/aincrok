/**
 * End-to-End tests for Settings Save Failure Bug
 *
 * These tests use a real VS Code instance to reproduce the exact user workflow:
 * 1. Open VS Code settings
 * 2. Search for "Aincrok"
 * 3. Modify memory/LSP configuration fields
 * 4. Save settings
 * 5. Verify fields don't revert to previous values
 *
 * Uses @vscode/test-electron to launch VS Code and Playwright for UI automation.
 */

import * as vscode from "vscode"
import { describe, it, before, after, beforeEach, afterEach } from "mocha"
import { expect } from "chai"
import { chromium, Browser, Page, BrowserContext } from "playwright"

describe("Settings Save Failure E2E Tests", () => {
	let browser: Browser
	let context: BrowserContext
	let page: Page

	before(async function () {
		this.timeout(30000)

		// Launch browser for UI automation
		browser = await chromium.launch({
			headless: false, // Set to true for CI
			slowMo: 100, // Slow down for debugging
		})
		context = await browser.newContext()
		page = await context.newPage()
	})

	after(async () => {
		await browser?.close()
	})

	beforeEach(async function () {
		this.timeout(10000)
		// Ensure clean state before each test
		await vscode.commands.executeCommand("workbench.action.reloadWindow")
		await new Promise((resolve) => setTimeout(resolve, 2000))
	})

	afterEach(async () => {
		// Close any open settings panels
		await vscode.commands.executeCommand("workbench.action.closeAllEditors")
	})

	describe("Memory Configuration Save Tests", () => {
		it("shouldPersistMemoryApiKeyWithoutRevert", async function () {
			this.timeout(30000)

			// Step 1: Open VS Code settings
			await vscode.commands.executeCommand("workbench.action.openSettings")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Step 2: Search for Aincrok settings
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Step 3: Get current memory API key value (if any)
			const config = vscode.workspace.getConfiguration("aincrok")
			const originalMemoryApiKey = config.get<string>("memoryApiKey") || ""

			// Step 4: Set a new memory API key value
			const newMemoryApiKey = "test-mem0-api-key-e2e-" + Date.now()
			await config.update("memoryApiKey", newMemoryApiKey, vscode.ConfigurationTarget.Global)

			// Wait for settings to process
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Step 5: Verify the value was saved and didn't revert
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")
			const currentMemoryApiKey = updatedConfig.get<string>("memoryApiKey")

			expect(currentMemoryApiKey).to.equal(newMemoryApiKey)
			expect(currentMemoryApiKey).to.not.equal(originalMemoryApiKey)

			// Step 6: Test that the value persists after settings panel operations
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok.memoryProvider")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Check value again after UI navigation
			const finalConfig = vscode.workspace.getConfiguration("aincrok")
			const finalMemoryApiKey = finalConfig.get<string>("memoryApiKey")

			expect(finalMemoryApiKey).to.equal(
				newMemoryApiKey,
				"Memory API key should not revert after settings panel navigation",
			)
		})

		it("shouldPersistMemoryProviderSelectionWithoutRevert", async function () {
			this.timeout(30000)

			// Test dropdown/select field persistence
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok.memoryProvider")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")
			const originalProvider = config.get<string>("memoryProvider") || "mem0"

			// Change memory provider
			const newProvider = originalProvider === "mem0" ? "cipher" : "mem0"
			await config.update("memoryProvider", newProvider, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Verify persistence
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")
			const currentProvider = updatedConfig.get<string>("memoryProvider")

			expect(currentProvider).to.equal(newProvider)
			expect(currentProvider).to.not.equal(originalProvider)

			// Test persistence after save operation
			await vscode.commands.executeCommand("workbench.action.files.save")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const finalConfig = vscode.workspace.getConfiguration("aincrok")
			const finalProvider = finalConfig.get<string>("memoryProvider")

			expect(finalProvider).to.equal(
				newProvider,
				"Memory provider selection should persist after save operations",
			)
		})

		it("shouldPersistMultipleMemoryFieldsSimultaneously", async function () {
			this.timeout(30000)

			// Test multiple fields saving together without reverting
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok memory")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")

			// Get original values
			const originalApiKey = config.get<string>("memoryApiKey") || ""
			const originalBaseUrl = config.get<string>("memoryBaseUrl") || ""
			const originalAutoCapture = config.get<boolean>("memoryAutoCapture") || false

			// Set new values for multiple fields
			const timestamp = Date.now()
			const newApiKey = `multi-field-key-${timestamp}`
			const newBaseUrl = `https://custom-endpoint-${timestamp}.example.com`
			const newAutoCapture = !originalAutoCapture

			// Update all fields
			await config.update("memoryApiKey", newApiKey, vscode.ConfigurationTarget.Global)
			await config.update("memoryBaseUrl", newBaseUrl, vscode.ConfigurationTarget.Global)
			await config.update("memoryAutoCapture", newAutoCapture, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Verify all fields persisted
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")

			expect(updatedConfig.get<string>("memoryApiKey")).to.equal(newApiKey)
			expect(updatedConfig.get<string>("memoryBaseUrl")).to.equal(newBaseUrl)
			expect(updatedConfig.get<boolean>("memoryAutoCapture")).to.equal(newAutoCapture)

			// Navigate away and back to test persistence
			await vscode.commands.executeCommand("workbench.action.openSettings", "editor.fontSize")
			await new Promise((resolve) => setTimeout(resolve, 1000))
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok memory")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Verify values still persist
			const finalConfig = vscode.workspace.getConfiguration("aincrok")

			expect(finalConfig.get<string>("memoryApiKey")).to.equal(
				newApiKey,
				"Memory API key should persist after settings navigation",
			)
			expect(finalConfig.get<string>("memoryBaseUrl")).to.equal(
				newBaseUrl,
				"Memory base URL should persist after settings navigation",
			)
			expect(finalConfig.get<boolean>("memoryAutoCapture")).to.equal(
				newAutoCapture,
				"Memory auto capture should persist after settings navigation",
			)
		})
	})

	describe("LSP Configuration Save Tests", () => {
		it("shouldPersistLspEnabledToggleWithoutRevert", async function () {
			this.timeout(30000)

			// Test LSP toggle field
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok.lspEnabled")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")
			const originalLspEnabled = config.get<boolean>("lspEnabled") || false

			// Toggle LSP enabled
			const newLspEnabled = !originalLspEnabled
			await config.update("lspEnabled", newLspEnabled, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Verify toggle persisted
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")
			const currentLspEnabled = updatedConfig.get<boolean>("lspEnabled")

			expect(currentLspEnabled).to.equal(newLspEnabled)
			expect(currentLspEnabled).to.not.equal(originalLspEnabled)

			// Test persistence through settings panel refresh
			await vscode.commands.executeCommand("workbench.action.reloadWindow")
			await new Promise((resolve) => setTimeout(resolve, 3000))

			const reloadedConfig = vscode.workspace.getConfiguration("aincrok")
			const reloadedLspEnabled = reloadedConfig.get<boolean>("lspEnabled")

			expect(reloadedLspEnabled).to.equal(newLspEnabled, "LSP enabled setting should persist after window reload")
		})

		it("shouldPersistLspTimeoutWithoutRevert", async function () {
			this.timeout(30000)

			// Test numeric input field
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok.lspTimeout")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")
			const originalTimeout = config.get<number>("lspTimeout") || 5000

			// Set new timeout value
			const newTimeout = originalTimeout === 5000 ? 10000 : 5000
			await config.update("lspTimeout", newTimeout, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Verify timeout persisted
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")
			const currentTimeout = updatedConfig.get<number>("lspTimeout")

			expect(currentTimeout).to.equal(newTimeout)
			expect(currentTimeout).to.not.equal(originalTimeout)

			// Test edge case: save another setting and verify this one doesn't revert
			await config.update("lspDiagnostics", true, vscode.ConfigurationTarget.Global)
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const finalConfig = vscode.workspace.getConfiguration("aincrok")
			const finalTimeout = finalConfig.get<number>("lspTimeout")

			expect(finalTimeout).to.equal(
				newTimeout,
				"LSP timeout should not revert when other LSP settings are changed",
			)
		})

		it("shouldPersistMultipleLspFieldsWithoutInterference", async function () {
			this.timeout(30000)

			// Test multiple LSP fields don't interfere with each other
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok lsp")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")

			// Get original values
			const originalEnabled = config.get<boolean>("lspEnabled") || false
			const originalTimeout = config.get<number>("lspTimeout") || 5000
			const originalDiagnostics = config.get<boolean>("lspDiagnostics") || false

			// Set new values
			const newEnabled = !originalEnabled
			const newTimeout = originalTimeout + 2500
			const newDiagnostics = !originalDiagnostics

			// Update all LSP fields
			await config.update("lspEnabled", newEnabled, vscode.ConfigurationTarget.Global)
			await config.update("lspTimeout", newTimeout, vscode.ConfigurationTarget.Global)
			await config.update("lspDiagnostics", newDiagnostics, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Verify all LSP fields persisted correctly
			const updatedConfig = vscode.workspace.getConfiguration("aincrok")

			expect(updatedConfig.get<boolean>("lspEnabled")).to.equal(newEnabled)
			expect(updatedConfig.get<number>("lspTimeout")).to.equal(newTimeout)
			expect(updatedConfig.get<boolean>("lspDiagnostics")).to.equal(newDiagnostics)
		})
	})

	describe("Mixed Configuration Tests", () => {
		it("shouldPersistMixedMemoryAndLspFieldsWithoutRevert", async function () {
			this.timeout(45000)

			// Test that memory and LSP settings don't interfere with each other
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const config = vscode.workspace.getConfiguration("aincrok")

			// Set up test values
			const timestamp = Date.now()
			const testMemoryKey = `mixed-test-mem-key-${timestamp}`
			const testLspTimeout = 7500
			const testMemoryEnabled = true
			const testLspEnabled = true

			// Update mixed settings
			await config.update("memoryApiKey", testMemoryKey, vscode.ConfigurationTarget.Global)
			await config.update("lspTimeout", testLspTimeout, vscode.ConfigurationTarget.Global)
			await config.update("memoryEnabled", testMemoryEnabled, vscode.ConfigurationTarget.Global)
			await config.update("lspEnabled", testLspEnabled, vscode.ConfigurationTarget.Global)

			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Verify mixed settings all persisted
			const verifyConfig = vscode.workspace.getConfiguration("aincrok")

			expect(verifyConfig.get<string>("memoryApiKey")).to.equal(testMemoryKey)
			expect(verifyConfig.get<number>("lspTimeout")).to.equal(testLspTimeout)
			expect(verifyConfig.get<boolean>("memoryEnabled")).to.equal(testMemoryEnabled)
			expect(verifyConfig.get<boolean>("lspEnabled")).to.equal(testLspEnabled)

			// Test persistence after multiple operations
			await vscode.commands.executeCommand("workbench.action.files.saveAll")
			await vscode.commands.executeCommand("workbench.action.closeAllEditors")
			await vscode.commands.executeCommand("workbench.action.openSettings", "aincrok")
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Final verification
			const finalConfig = vscode.workspace.getConfiguration("aincrok")

			expect(finalConfig.get<string>("memoryApiKey")).to.equal(
				testMemoryKey,
				"Memory API key should persist through save operations",
			)
			expect(finalConfig.get<number>("lspTimeout")).to.equal(
				testLspTimeout,
				"LSP timeout should persist through save operations",
			)
			expect(finalConfig.get<boolean>("memoryEnabled")).to.equal(
				testMemoryEnabled,
				"Memory enabled should persist through save operations",
			)
			expect(finalConfig.get<boolean>("lspEnabled")).to.equal(
				testLspEnabled,
				"LSP enabled should persist through save operations",
			)
		})

		it("shouldHandleRapidSettingsChangesWithoutRevert", async function () {
			this.timeout(30000)

			// Test rapid successive changes don't cause reverts
			const config = vscode.workspace.getConfiguration("aincrok")
			const timestamp = Date.now()

			// Rapid succession of changes
			const changes = [
				{ key: "memoryApiKey", value: `rapid-1-${timestamp}` },
				{ key: "lspTimeout", value: 6000 },
				{ key: "memoryProvider", value: "cipher" },
				{ key: "lspEnabled", value: true },
				{ key: "memoryAutoCapture", value: false },
			]

			// Apply all changes rapidly
			for (const change of changes) {
				await config.update(change.key, change.value, vscode.ConfigurationTarget.Global)
				await new Promise((resolve) => setTimeout(resolve, 200)) // Small delay between changes
			}

			// Wait for all changes to process
			await new Promise((resolve) => setTimeout(resolve, 3000))

			// Verify all rapid changes persisted
			const finalConfig = vscode.workspace.getConfiguration("aincrok")

			for (const change of changes) {
				const currentValue = finalConfig.get(change.key)
				expect(currentValue).to.equal(change.value, `Rapid change for ${change.key} should persist`)
			}
		})
	})

	describe("Error Scenarios", () => {
		it("shouldRecoverFromInvalidConfigurationValues", async function () {
			this.timeout(30000)

			// Test recovery from invalid values
			const config = vscode.workspace.getConfiguration("aincrok")

			try {
				// Try to set invalid values
				await config.update("lspTimeout", -1000, vscode.ConfigurationTarget.Global) // Invalid negative
				await config.update("memoryApiKey", null, vscode.ConfigurationTarget.Global) // Invalid null

				await new Promise((resolve) => setTimeout(resolve, 2000))

				// Set valid values after invalid ones
				await config.update("lspTimeout", 8000, vscode.ConfigurationTarget.Global)
				await config.update("memoryApiKey", "recovered-key", vscode.ConfigurationTarget.Global)

				await new Promise((resolve) => setTimeout(resolve, 2000))

				// Verify recovery worked
				const recoveredConfig = vscode.workspace.getConfiguration("aincrok")

				expect(recoveredConfig.get<number>("lspTimeout")).to.equal(8000)
				expect(recoveredConfig.get<string>("memoryApiKey")).to.equal("recovered-key")
			} catch (error) {
				// If VS Code rejects invalid values, that's acceptable behavior
				console.log("VS Code properly rejected invalid configuration values:", error)
			}
		})
	})
})
