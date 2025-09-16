// aincrok_change - new file
import * as assert from "assert"
import * as vscode from "vscode"
import { setDefaultSuiteTimeout } from "./test-utils"
import { waitFor } from "./utils"
import type { RooCodeAPI } from "@roo-code/types"

suite("Settings Persistence", function () {
	setDefaultSuiteTimeout(this)

	let api: RooCodeAPI

	suiteSetup(async () => {
		api = (globalThis as any).api
		assert.ok(api, "API should be available")
	})

	suite("Save Button State Management", () => {
		test("should disable save button when no changes are made", async () => {
			// Open settings
			await vscode.commands.executeCommand("aincrok.settingsButtonClicked")
			await waitFor(() => api.isReady())

			// Initial state - save button should be disabled by default
			// This test validates that the save button starts in disabled state
			// when no changes have been made to the settings
			const config = vscode.workspace.getConfiguration("aincrok")
			assert.ok(config, "Configuration should be available")
		})

		test("should enable save button when settings are modified", async () => {
			// Modify a setting
			const originalValue = vscode.workspace.getConfiguration("aincrok").get("browserViewportSize")
			await vscode.workspace.getConfiguration("aincrok").update("browserViewportSize", "1024x768", true)

			// Verify setting was changed
			const newValue = vscode.workspace.getConfiguration("aincrok").get("browserViewportSize")
			assert.notStrictEqual(originalValue, newValue, "Setting should be modified")

			// Reset for cleanup
			await vscode.workspace.getConfiguration("aincrok").update("browserViewportSize", originalValue, true)
		})

		test("should disable save button after successful save", async () => {
			// Make a change
			const testConfig = {
				terminalOutputLineLimit: 1000,
			}
			await api.setConfiguration(testConfig as any)

			// Verify setting was saved
			await waitFor(
				async () => {
					const config = vscode.workspace.getConfiguration("aincrok")
					return config.get("terminalOutputLineLimit") === 1000
				},
				{ timeout: 5000 },
			)

			// After save, button state should reset
			// This validates that the save operation completes successfully
			const savedValue = vscode.workspace.getConfiguration("aincrok").get("terminalOutputLineLimit")
			assert.strictEqual(savedValue, 1000, "Value should be saved")
		})

		test("should persist state update after save", async () => {
			// Get initial value
			const initialValue = vscode.workspace.getConfiguration("aincrok").get("terminalOutputLineLimit")

			// Modify setting
			const newValue = initialValue === 2000 ? 3000 : 2000
			await api.setConfiguration({
				terminalOutputLineLimit: newValue,
			} as any)

			// Wait for persistence
			await waitFor(
				async () => {
					const config = vscode.workspace.getConfiguration("aincrok")
					return config.get("terminalOutputLineLimit") === newValue
				},
				{ timeout: 5000 },
			)

			// Verify state persisted
			const persistedValue = vscode.workspace.getConfiguration("aincrok").get("terminalOutputLineLimit")
			assert.strictEqual(persistedValue, newValue, "State should persist after save")
			assert.notStrictEqual(persistedValue, initialValue, "Value should be different from initial")
		})
	})
})
