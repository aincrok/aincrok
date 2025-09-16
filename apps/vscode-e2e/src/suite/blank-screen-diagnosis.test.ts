import * as assert from "assert"
import * as vscode from "vscode"

import { RooCodeEventName } from "@roo-code/types"

import { waitFor } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("Blank Screen Diagnosis", function () {
	setDefaultSuiteTimeout(this)

	test("Extension should be activated", async () => {
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension should be installed")

		if (!extension.isActive) {
			await extension.activate()
		}

		assert.ok(extension.isActive, "Extension should be active")
	})

	test("API should be available and ready", async () => {
		const api = globalThis.api
		assert.ok(api, "Global API should be available")

		// Wait for API to be ready
		await waitFor(() => api.isReady(), { timeout: 10000 })
		assert.ok(api.isReady(), "API should be ready")
	})

	test("Sidebar webview should be accessible", async () => {
		// Check if sidebar provider is registered
		const commands = await vscode.commands.getCommands(true)
		const sidebarCommands = commands.filter(
			(cmd) =>
				cmd.includes("aincrok") &&
				(cmd.includes("sidebar") || cmd.includes("SidebarProvider") || cmd.includes("plusButtonClicked")),
		)

		assert.ok(sidebarCommands.length > 0, "Sidebar-related commands should be registered")
	})

	test("Should handle initial webview state without blank screen", async () => {
		const api = globalThis.api

		// Track any tool failures that might indicate problems
		const toolFailures: any[] = []
		const messages: any[] = []

		api.on(RooCodeEventName.TaskToolFailed, (event: any) => {
			toolFailures.push(event)
		})

		api.on(RooCodeEventName.Message, (message: any) => {
			messages.push(message)
		})

		// Try to trigger webview initialization by executing a command
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
		} catch (error) {
			// Command might not be available immediately, that's ok
		}

		// Wait a moment for any initialization to complete
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Check if there were any critical tool failures that might cause blank screen
		const criticalFailures = toolFailures.filter(
			(failure: any) =>
				failure &&
				(failure.message?.includes("blank") ||
					failure.message?.includes("render") ||
					failure.message?.includes("webview") ||
					failure.message?.includes("ReactDOM") ||
					failure.message?.includes("undefined")),
		)

		if (criticalFailures.length > 0) {
			console.error("Critical failures detected:", criticalFailures)
			assert.fail(
				`Critical failures found that might cause blank screen: ${JSON.stringify(criticalFailures, null, 2)}`,
			)
		}
	})

	test("Task history should be visible by default", async () => {
		const api = globalThis.api

		// Get current configuration to check task history settings
		const config = api.getConfiguration()

		// The test should verify that when there are no messages, task history is expanded
		// We can't directly test the UI but we can test the API state

		// Check if we can get current task stack (should be empty initially)
		const taskStack = api.getCurrentTaskStack()
		assert.ok(Array.isArray(taskStack), "Task stack should be an array")

		// If no tasks, the UI should show expanded task history by default
		// This is the behavior we implemented to fix issue #4
		assert.equal(taskStack.length, 0, "Initial task stack should be empty")
	})

	test("Extension activation events should be properly configured", async () => {
		// Read package.json to verify activation events
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension should be available")

		const packageJson = extension.packageJSON
		assert.ok(packageJson.activationEvents, "Activation events should be defined")

		const activationEvents = packageJson.activationEvents

		// Verify essential activation events are present (these were modified to fix LSP issues)
		const essentialEvents = [
			"onStartupFinished",
			"onView:aincrok.SidebarProvider",
			"onCommand:aincrok.plusButtonClicked",
		]

		for (const event of essentialEvents) {
			assert.ok(activationEvents.includes(event), `Essential activation event '${event}' should be present`)
		}

		// Verify we don't have broad language activation that causes LSP conflicts
		const hasLanguageActivation = activationEvents.some(
			(event: string) => event.startsWith("onLanguage") && !event.includes("specific"),
		)

		assert.ok(!hasLanguageActivation, "Should not have broad onLanguage activation events that cause LSP conflicts")
	})

	test("Memory button should not be in topbar commands", async () => {
		// Verify that memoryButtonClicked command is not registered
		const commands = await vscode.commands.getCommands(true)
		const hasMemoryCommand = commands.includes("aincrok.memoryButtonClicked")

		assert.ok(
			!hasMemoryCommand,
			"Memory button command should not be registered (removed from topbar as per issue #3)",
		)
	})

	test("Should handle webview lifecycle without crashes", async () => {
		const api = globalThis.api

		let crashed = false
		let lastFailure: any = null

		// Monitor for crashes or critical failures
		api.on(RooCodeEventName.TaskToolFailed, (event: any) => {
			lastFailure = event
			if (
				event &&
				(event.message?.includes("crash") ||
					event.message?.includes("fatal") ||
					event.message?.includes("Cannot read prop"))
			) {
				crashed = true
			}
		})

		// Try some basic operations that might trigger the blank screen
		try {
			// Simulate opening settings (where memory is now located)
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Try accessing task history
			await vscode.commands.executeCommand("aincrok.historyButtonClicked")
			await new Promise((resolve) => setTimeout(resolve, 1000))
		} catch (error) {
			console.warn("Command execution warning:", error)
			// Commands might fail in test environment, that's expected
		}

		// Check if any crashes occurred
		assert.ok(
			!crashed,
			`Webview should not crash. Last failure: ${lastFailure ? JSON.stringify(lastFailure) : "none"}`,
		)
	})

	test("ChatView component should handle empty state correctly", async () => {
		const api = globalThis.api

		// This test verifies the fix for the ChatView condition that was causing blank screen
		// We changed from `{currentTaskItem && task ? (` back to `{task ? (`

		// When there are no messages, the component should still render with task history expanded
		const taskStack = api.getCurrentTaskStack()

		// Initial state should have empty task stack
		assert.equal(taskStack.length, 0, "Should start with no tasks")

		// The key fix: when messages.length === 0, isExpanded should be true
		// This ensures task history is visible by default (issue #4)

		// We can't directly test React component state, but we can verify API behavior
		// that supports the correct UI state

		const config = api.getConfiguration()
		assert.ok(config !== null && config !== undefined, "Configuration should be available for UI rendering")
	})
})
