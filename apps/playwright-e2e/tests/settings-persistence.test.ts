// aincrok_change - new Playwright test for settings persistence
import { test, expect } from "./playwright-base-test"

test.describe("Settings Persistence", () => {
	test.beforeEach(async ({ workbox }) => {
		// Open settings tab
		await workbox.keyboard.press("Control+Shift+P")
		await workbox.waitForTimeout(500)
		await workbox.keyboard.type("Aincrok: Settings")
		await workbox.keyboard.press("Enter")
		await workbox.waitForTimeout(2000)
	})

	test("should disable save button when no changes are made", async ({ workbox }) => {
		// Check that save button is initially disabled
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

		// Check save button state
		const saveButton = settingsFrame.locator('button:has-text("Save")')
		await expect(saveButton).toBeVisible()

		// Initially button should be disabled (check for disabled attribute or class)
		const isDisabled = await saveButton.evaluate((el) => {
			return el.hasAttribute("disabled") || el.classList.contains("disabled")
		})
		expect(isDisabled).toBeTruthy()
	})

	test("should enable save button when settings are modified", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

		// Modify a setting - change terminal output line limit
		const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
		if ((await terminalLimitInput.count()) > 0) {
			await terminalLimitInput.clear()
			await terminalLimitInput.type("2000")
		} else {
			// Try alternative selector
			const input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
			await input.clear()
			await input.type("2000")
		}

		// Check that save button is now enabled
		const saveButton = settingsFrame.locator('button:has-text("Save")')
		await workbox.waitForTimeout(500)

		const isEnabled = await saveButton.evaluate((el) => {
			return !el.hasAttribute("disabled") && !el.classList.contains("disabled")
		})
		expect(isEnabled).toBeTruthy()
	})

	test("should disable save button after successful save", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

		// Modify a setting
		const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
		if ((await terminalLimitInput.count()) > 0) {
			await terminalLimitInput.clear()
			await terminalLimitInput.type("3000")
		} else {
			const input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
			await input.clear()
			await input.type("3000")
		}

		// Click save button
		const saveButton = settingsFrame.locator('button:has-text("Save")')
		await saveButton.click()

		// Wait for save to complete
		await workbox.waitForTimeout(2000)

		// Check that save button is disabled again
		const isDisabled = await saveButton.evaluate((el) => {
			return el.hasAttribute("disabled") || el.classList.contains("disabled")
		})
		expect(isDisabled).toBeTruthy()
	})

	test("should persist state update after save", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

		// Get initial value
		const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
		let input = terminalLimitInput
		if ((await terminalLimitInput.count()) === 0) {
			input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
		}

		const initialValue = await input.inputValue()
		const newValue = initialValue === "2000" ? "3000" : "2000"

		// Modify the setting
		await input.clear()
		await input.type(newValue)

		// Save the setting
		const saveButton = settingsFrame.locator('button:has-text("Save")')
		await saveButton.click()
		await workbox.waitForTimeout(2000)

		// Close and reopen settings to verify persistence
		await workbox.keyboard.press("Control+W")
		await workbox.waitForTimeout(1000)

		// Reopen settings
		await workbox.keyboard.press("Control+Shift+P")
		await workbox.waitForTimeout(500)
		await workbox.keyboard.type("Aincrok: Settings")
		await workbox.keyboard.press("Enter")
		await workbox.waitForTimeout(2000)

		// Check that the value persisted
		const settingsFrameNew = workbox.frameLocator('iframe[title="Aincrok"]')
		await settingsFrameNew.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

		const terminalLimitInputNew = settingsFrameNew.locator('input[name="terminalOutputLineLimit"]').first()
		let inputNew = terminalLimitInputNew
		if ((await terminalLimitInputNew.count()) === 0) {
			inputNew = settingsFrameNew.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
		}

		const persistedValue = await inputNew.inputValue()
		expect(persistedValue).toBe(newValue)
	})
})
