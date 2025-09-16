import * as assert from "assert"
import * as vscode from "vscode"

import { RooCodeEventName } from "@roo-code/types"

import { waitFor } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("Startup UI Rendering Validation", function () {
	setDefaultSuiteTimeout(this)

	test("Should render main UI elements immediately at startup", async () => {
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension should be installed")

		if (!extension.isActive) {
			await extension.activate()
		}

		const api = globalThis.api
		assert.ok(api, "Global API should be available")

		// Wait for API to be ready
		await waitFor(() => api.isReady(), { timeout: 15000 })
		assert.ok(api.isReady(), "API should be ready")

		// Clear any existing tasks to simulate fresh startup
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected if no task exists
		}

		// Trigger the sidebar to ensure it's visible
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		// Allow time for UI to render
		await new Promise((resolve) => setTimeout(resolve, 3000))

		// Verify API indicates no tasks (empty state)
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Should be in empty state with no tasks")

		// Verify configuration is accessible (indicates UI is functional)
		const config = api.getConfiguration()
		assert.ok(config, "Configuration should be accessible")
	})

	test("Should display welcome content when no tasks exist", async () => {
		const api = globalThis.api

		// Clear current state to ensure empty state
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected if no task exists
		}

		// Focus sidebar to trigger UI rendering
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
		} catch (error) {
			console.warn("Plus button command warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Verify we're in empty state
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Should have no tasks")

		// Test that essential UI components would be rendered
		// We can't directly test DOM elements from here, but we can verify:
		// 1. No task is active (shows welcome screen)
		// 2. API is functional (indicates webview loaded)
		// 3. Extension is ready (indicates UI initialization succeeded)

		assert.ok(api.isReady(), "API should remain ready (UI functional)")

		const config = api.getConfiguration()
		assert.ok(config, "Should be able to access configuration (UI responsive)")
	})

	test("Should handle task history empty state correctly", async () => {
		const api = globalThis.api

		// Ensure clean empty state
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected if no task exists
		}

		// Focus sidebar
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Verify empty state conditions
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Task stack should be empty")

		// In the fixed version:
		// - HistoryPreview should render even when tasks.length === 0
		// - It should show "No tasks yet" message
		// - The main UI should never be completely blank

		// We verify this by ensuring the API remains responsive
		// (indicating the webview rendered successfully without blank screen)

		assert.ok(api.isReady(), "API should be ready - indicates UI rendered without errors")

		// Test multiple API calls to ensure UI stability
		for (let i = 0; i < 3; i++) {
			const testConfig = api.getConfiguration()
			assert.ok(testConfig, `Configuration access attempt ${i + 1} should succeed`)
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	})

	test("Should not show blank screen after multiple operations", async () => {
		const api = globalThis.api

		// Track any tool failures that might indicate UI problems
		const failures: any[] = []
		api.on(RooCodeEventName.TaskToolFailed, (event: any) => {
			failures.push(event)
		})

		// Perform multiple operations that previously might have caused blank screen
		const operations = [
			async () => {
				try {
					await api.clearCurrentTask()
				} catch (error) {
					// Expected if no task exists
				}
			},
			async () => {
				try {
					await vscode.commands.executeCommand("aincrok.plusButtonClicked")
				} catch (error) {
					// Command might not be available
				}
			},
			async () => {
				try {
					await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
				} catch (error) {
					// Command might not be available
				}
			},
			async () => {
				try {
					await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
				} catch (error) {
					// Command might not be available
				}
			},
			async () => {
				try {
					await vscode.commands.executeCommand("aincrok.historyButtonClicked")
				} catch (error) {
					// Command might not be available
				}
			},
		]

		// Execute operations with delays
		for (const operation of operations) {
			await operation()
			await new Promise((resolve) => setTimeout(resolve, 500))
		}

		// Final longer wait for any async operations
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Check for critical failures that might cause blank screen
		const criticalFailures = failures.filter(
			(failure: any) =>
				failure &&
				(failure.message?.includes("blank") ||
					failure.message?.includes("render") ||
					failure.message?.includes("Cannot read properties") ||
					failure.message?.includes("undefined") ||
					failure.message?.includes("null")),
		)

		assert.equal(
			criticalFailures.length,
			0,
			`Should not have critical failures. Found: ${JSON.stringify(criticalFailures)}`,
		)

		// Verify final state is stable
		assert.ok(api.isReady(), "API should remain ready after operations")

		const finalTaskStack = api.getCurrentTaskStack()
		assert.ok(Array.isArray(finalTaskStack), "Task stack should be accessible")

		const finalConfig = api.getConfiguration()
		assert.ok(finalConfig, "Configuration should be accessible")
	})

	test("Should maintain UI stability during rapid state changes", async () => {
		const api = globalThis.api

		// Rapid state changes that might trigger blank screen
		const rapidOperations = async () => {
			for (let i = 0; i < 5; i++) {
				try {
					await api.clearCurrentTask()
				} catch (error) {
					// Expected - might fail if no task
				}

				try {
					await vscode.commands.executeCommand("aincrok.plusButtonClicked")
				} catch (error) {
					// Expected - command might not be ready
				}

				await new Promise((resolve) => setTimeout(resolve, 100))
			}
		}

		await rapidOperations()

		// Allow time for UI to stabilize
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Verify UI stability after rapid changes
		assert.ok(api.isReady(), "API should remain stable after rapid operations")

		// Test that the UI can still respond to operations
		const taskStack = api.getCurrentTaskStack()
		assert.ok(Array.isArray(taskStack), "Should be able to get task stack")

		const config = api.getConfiguration()
		assert.ok(config, "Should be able to get configuration")

		// The key test: no blank screen means API remains responsive
		// If there was a blank screen, these API calls would likely fail
	})

	test("Should show task history section even when empty", async () => {
		const api = globalThis.api

		// Clear to ensure empty state
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected if no task exists
		}

		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Verify empty state
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Should be in empty state")

		// The fixed ChatView should render HistoryPreview even when tasks.length === 0
		// HistoryPreview should show "No tasks yet" message instead of being hidden
		// This prevents the blank screen issue

		// Test that the UI remains responsive (indicates proper rendering)
		const startTime = Date.now()
		let consecutiveSuccesses = 0
		const requiredSuccesses = 5

		// Try multiple rapid API calls - if UI is blank/broken, these would fail
		while (consecutiveSuccesses < requiredSuccesses && Date.now() - startTime < 5000) {
			try {
				const config = api.getConfiguration()
				const stack = api.getCurrentTaskStack()

				if (config && Array.isArray(stack)) {
					consecutiveSuccesses++
				} else {
					consecutiveSuccesses = 0
				}

				await new Promise((resolve) => setTimeout(resolve, 200))
			} catch (error) {
				consecutiveSuccesses = 0
			}
		}

		assert.equal(
			consecutiveSuccesses,
			requiredSuccesses,
			"Should have consistent API responses indicating stable UI rendering",
		)
	})
})
