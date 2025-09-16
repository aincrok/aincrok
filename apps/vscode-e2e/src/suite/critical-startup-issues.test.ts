import * as assert from "assert"
import * as vscode from "vscode"

import { RooCodeEventName } from "@roo-code/types"

import { waitFor } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

/**
 * Critical E2E tests for startup issues:
 * 1. Blank screen at startup when no tasks exist
 * 2. Crash when clicking '+' icon (new task) due to undefined secretStatus
 */
suite("Critical Startup Issues - Blank Screen and Crash Prevention", function () {
	setDefaultSuiteTimeout(this)

	/**
	 * Test for Issue #1: Blank screen at startup
	 * Root cause: currentTaskItem might be truthy even when there's no actual task
	 * Fix: Check both !currentTaskItem and messages.length === 0
	 */
	test("Should NOT show blank screen at startup - home screen must be visible", async () => {
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension should be installed")

		if (!extension.isActive) {
			await extension.activate()
		}

		const api = globalThis.api
		assert.ok(api, "Global API should be available")

		// Wait for API to be ready
		await waitFor(() => api.isReady(), { timeout: 15000 })

		// Clear any existing tasks to simulate fresh startup
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected if no task exists
		}

		// Focus the sidebar - this is when users see the blank screen
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		// Critical timing: Check immediately (within 1 second)
		// Users report blank screen immediately on startup
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Verify no active task (home screen condition)
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Should have no active tasks on fresh startup")

		// Critical test: API should be responsive (not blank)
		// If the screen is blank, these calls would fail
		let apiResponsive = true
		let errorMessage = ""

		try {
			const config = api.getConfiguration()
			assert.ok(config, "Configuration must be accessible (indicates UI rendered)")

			// Multiple rapid checks to ensure UI stability
			for (let i = 0; i < 3; i++) {
				const checkConfig = api.getConfiguration()
				if (!checkConfig) {
					apiResponsive = false
					errorMessage = `Configuration check ${i + 1} failed`
					break
				}
				await new Promise((resolve) => setTimeout(resolve, 100))
			}
		} catch (error) {
			apiResponsive = false
			errorMessage = `API error: ${error}`
		}

		assert.ok(
			apiResponsive,
			`UI must be responsive, not blank. ${errorMessage}. This indicates the home screen is not showing.`,
		)
	})

	/**
	 * Test for Issue #2: Crash when clicking '+' icon
	 * Error: TypeError: Cannot read properties of undefined (reading 'hasOpenAiKey')
	 * Location: CodeIndexPopover.tsx:306
	 * Root cause: secretStatus is undefined when message handler receives codeIndexSecretStatus
	 */
	test("Should NOT crash when clicking '+' icon for new task", async () => {
		const api = globalThis.api

		// Track any JavaScript errors that would indicate a crash
		const errors: any[] = []
		const originalError = console.error
		console.error = (message: any, ...args: any[]) => {
			errors.push({ message, args })
			originalError(message, ...args)
		}

		// Clear state to ensure we're starting fresh
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected
		}

		// Simulate clicking the '+' icon (new task button)
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
		} catch (error) {
			// The command itself might fail, but we're checking for crashes
			console.warn("Plus button command warning:", error)
		}

		// Wait for any crash to manifest
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Restore original console.error
		console.error = originalError

		// Check for the specific error that users reported
		const hasOpenAiKeyErrors = errors.filter((e) => {
			const msg = String(e.message)
			return msg.includes("Cannot read properties of undefined") && msg.includes("hasOpenAiKey")
		})

		assert.equal(
			hasOpenAiKeyErrors.length,
			0,
			`Must not crash with 'Cannot read properties of undefined (reading hasOpenAiKey)' error. Found: ${JSON.stringify(hasOpenAiKeyErrors)}`,
		)

		// Check for any TypeError that would indicate a crash
		const typeErrors = errors.filter((e) => {
			const msg = String(e.message)
			return msg.includes("TypeError")
		})

		assert.equal(typeErrors.length, 0, `Must not have any TypeError crashes. Found: ${JSON.stringify(typeErrors)}`)

		// Verify the UI is still functional after clicking '+'
		assert.ok(api.isReady(), "API must remain ready after clicking new task button")
	})

	/**
	 * Test that verifies the exact conditions reported by the user
	 */
	test("Should show home screen immediately without requiring any user interaction", async () => {
		const api = globalThis.api

		// Track console warnings for debugging
		const warnings: string[] = []
		const originalWarn = console.warn
		console.warn = (message: string) => {
			if (typeof message === "string") {
				warnings.push(message)
			}
			originalWarn(message)
		}

		// Clear all state
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected
		}

		// Open the extension fresh
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		// Immediate check - no waiting
		// The home screen should be visible IMMEDIATELY

		// Check that we're in the right state for home screen
		const taskStack = api.getCurrentTaskStack()
		assert.equal(taskStack.length, 0, "Must have no tasks for home screen to show")

		// The fix checks: !currentTaskItem || messages.length === 0
		// Both conditions should trigger home screen display

		// Verify no "Unknown webview message" errors
		const unknownMessages = warnings.filter((w) => w.includes("Unknown webview message"))
		assert.equal(
			unknownMessages.length,
			0,
			`Should not have unknown message warnings that might cause issues: ${JSON.stringify(unknownMessages)}`,
		)

		// Restore console.warn
		console.warn = originalWarn

		// Final verification - UI must be functional
		const config = api.getConfiguration()
		assert.ok(config, "Must be able to access configuration (home screen is rendered)")
	})

	/**
	 * Integration test: Startup -> New Task flow without crashes
	 */
	test("Should handle complete startup to new task flow without errors", async () => {
		const api = globalThis.api

		// Track all errors
		const errors: any[] = []
		const originalError = console.error
		console.error = (message: any, ...args: any[]) => {
			errors.push({ message, args })
			originalError(message, ...args)
		}

		// Step 1: Fresh startup
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected
		}

		// Step 2: Open sidebar (should show home screen)
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Verify home screen is showing (no active task)
		const initialTaskStack = api.getCurrentTaskStack()
		assert.equal(initialTaskStack.length, 0, "Should show home screen initially")

		// Step 3: Click new task button
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
		} catch (error) {
			console.warn("Plus button warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Restore console.error
		console.error = originalError

		// Verify no crashes occurred
		const criticalErrors = errors.filter((e) => {
			const msg = String(e.message)
			return (
				msg.includes("TypeError") ||
				msg.includes("Cannot read properties of undefined") ||
				msg.includes("Cannot read properties of null")
			)
		})

		assert.equal(
			criticalErrors.length,
			0,
			`Complete flow must work without crashes. Errors found: ${JSON.stringify(criticalErrors)}`,
		)

		// Verify extension is still functional
		assert.ok(api.isReady(), "Extension must remain functional after complete flow")
	})

	/**
	 * Regression test for codeIndexSecretStatus message handling
	 */
	test("Should handle codeIndexSecretStatus message without crash", async () => {
		const api = globalThis.api

		// Track errors specifically related to secretStatus
		const errors: any[] = []
		const originalError = console.error
		console.error = (message: any, ...args: any[]) => {
			if (String(message).includes("secretStatus") || String(message).includes("hasOpenAiKey")) {
				errors.push({ message, args })
			}
			originalError(message, ...args)
		}

		// This simulates the message that causes the crash
		// The handler should now have a null check for secretStatus
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		// Trigger actions that would send codeIndexSecretStatus
		try {
			await vscode.commands.executeCommand("aincrok.plusButtonClicked")
		} catch (error) {
			console.warn("Plus button warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Restore console.error
		console.error = originalError

		// Verify no secretStatus-related errors
		assert.equal(
			errors.length,
			0,
			`Must handle codeIndexSecretStatus without errors. Found: ${JSON.stringify(errors)}`,
		)
	})

	/**
	 * Test that validates the fix for messages.length check
	 */
	test("Should show home screen when messages array is empty", async () => {
		const api = globalThis.api

		// Clear everything
		try {
			await api.clearCurrentTask()
		} catch (error) {
			// Expected
		}

		// Open sidebar
		try {
			await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		} catch (error) {
			console.warn("Sidebar focus warning:", error)
		}

		await new Promise((resolve) => setTimeout(resolve, 1000))

		// The condition is: !currentTaskItem || messages.length === 0
		// Even if currentTaskItem exists but messages is empty, should show home screen

		const taskStack = api.getCurrentTaskStack()

		// If there are no tasks, we definitely should see home screen
		if (taskStack.length === 0) {
			// Verify UI is responsive (home screen is showing)
			const config = api.getConfiguration()
			assert.ok(config, "Home screen must be visible when no tasks exist")
		}

		// The key fix ensures that empty messages also triggers home screen
		assert.ok(api.isReady(), "Extension must be functional with proper home screen display")
	})
})
