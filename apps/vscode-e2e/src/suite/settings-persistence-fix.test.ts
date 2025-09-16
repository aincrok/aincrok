import * as assert from "assert"
import * as vscode from "vscode"
import { before, after, test, suite } from "mocha"

suite("Settings Persistence E2E Tests", () => {
	let extensionContext: vscode.ExtensionContext

	before(async function () {
		this.timeout(30000)

		// Ensure extension is activated
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension should be available")

		if (!extension.isActive) {
			await extension.activate()
		}

		extensionContext = extension.exports.context
	})

	after(async () => {
		// Clean up test configuration
		const config = vscode.workspace.getConfiguration("aincrok")
		await config.update("memory.apiKey", undefined, vscode.ConfigurationTarget.Global)
		await config.update("memory.mode", undefined, vscode.ConfigurationTarget.Global)
	})

	test("Settings should persist after save", async function () {
		this.timeout(20000)

		// Open settings
		await vscode.commands.executeCommand("aincrok.openSettings")
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Get the webview
		const panels = (vscode.window as any).visibleWebviewPanels
		assert.ok(panels && panels.length > 0, "Settings webview should be open")

		const settingsPanel = panels[0]

		// Change memory settings via configuration API
		const config = vscode.workspace.getConfiguration("aincrok")
		const testApiKey = "test-key-" + Date.now()

		// Set the values
		await config.update("memory.apiKey", testApiKey, vscode.ConfigurationTarget.Global)
		await config.update("memory.mode", "api", vscode.ConfigurationTarget.Global)

		// Wait for update to propagate
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Read back the values
		const savedKey = config.get("memory.apiKey")
		const savedMode = config.get("memory.mode")

		// Bug: Values revert to original
		// After fix: Should match what we set
		assert.strictEqual(savedKey, testApiKey, "API key should persist")
		assert.strictEqual(savedMode, "api", "Memory mode should persist")

		// Close and reopen settings to verify persistence
		await vscode.commands.executeCommand("workbench.action.closeActiveEditor")
		await new Promise((resolve) => setTimeout(resolve, 500))

		await vscode.commands.executeCommand("aincrok.openSettings")
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Verify values still persisted
		const configAfterReopen = vscode.workspace.getConfiguration("aincrok")
		assert.strictEqual(configAfterReopen.get("memory.apiKey"), testApiKey, "API key should persist after reopen")
		assert.strictEqual(configAfterReopen.get("memory.mode"), "api", "Mode should persist after reopen")
	})

	test("Test connection button should re-enable after error", async function () {
		this.timeout(30000)

		// Open settings if not already open
		await vscode.commands.executeCommand("aincrok.openSettings")
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Configure invalid connection settings
		const config = vscode.workspace.getConfiguration("aincrok")
		await config.update("memory.mode", "api", vscode.ConfigurationTarget.Global)
		await config.update("memory.apiUrl", "http://invalid.test.url", vscode.ConfigurationTarget.Global)
		await config.update("memory.apiKey", "invalid-key", vscode.ConfigurationTarget.Global)

		// Send test connection command
		const result = await vscode.commands.executeCommand("aincrok.testMemoryConnection")

		// Should fail with invalid URL
		assert.ok(!result || (result as any).success === false, "Connection test should fail")

		// Wait a moment for UI update
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Try to test again (button should be enabled)
		const secondResult = await vscode.commands.executeCommand("aincrok.testMemoryConnection")

		// Bug: Command fails because button is disabled
		// After fix: Should execute normally (even if connection fails)
		assert.ok(secondResult !== undefined, "Should be able to test connection again")
	})

	test("Multiple rapid saves should not cause race conditions", async function () {
		this.timeout(20000)

		const config = vscode.workspace.getConfiguration("aincrok")
		const updates = []

		// Rapidly update multiple settings
		for (let i = 0; i < 5; i++) {
			updates.push(config.update(`memory.testField${i}`, `value${i}`, vscode.ConfigurationTarget.Global))
		}

		// Wait for all updates
		await Promise.all(updates)

		// Verify all values persisted
		for (let i = 0; i < 5; i++) {
			const value = config.get(`memory.testField${i}`)
			assert.strictEqual(value, `value${i}`, `Field ${i} should have correct value`)
		}

		// Clean up
		for (let i = 0; i < 5; i++) {
			await config.update(`memory.testField${i}`, undefined, vscode.ConfigurationTarget.Global)
		}
	})
})
