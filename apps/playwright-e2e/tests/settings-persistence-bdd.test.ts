// aincrok_change - new Playwright BDD-style test for settings persistence
import { test, expect } from "./playwright-base-test"

test.describe("Settings Persistence BDD Tests", () => {
	test.describe("Given the settings page is open", () => {
		test.beforeEach(async ({ workbox }) => {
			// Open settings tab
			await workbox.keyboard.press("Control+Shift+P")
			await workbox.waitForTimeout(500)
			await workbox.keyboard.type("Aincrok: Settings")
			await workbox.keyboard.press("Enter")
			await workbox.waitForTimeout(2000)
		})

		test.describe("When no changes have been made", () => {
			test("Then the save button should be disabled", async ({ workbox }) => {
				const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

				const saveButton = settingsFrame.locator('button:has-text("Save")')
				await expect(saveButton).toBeVisible()

				const isDisabled = await saveButton.evaluate((el) => {
					return el.hasAttribute("disabled") || el.classList.contains("disabled")
				})
				expect(isDisabled).toBeTruthy()
			})
		})

		test.describe("When a setting is modified", () => {
			test("Then the save button should become enabled", async ({ workbox }) => {
				const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

				// Modify a setting
				const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
				let input = terminalLimitInput
				if ((await terminalLimitInput.count()) === 0) {
					input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
				}

				await input.clear()
				await input.type("2500")
				await workbox.waitForTimeout(500)

				const saveButton = settingsFrame.locator('button:has-text("Save")')
				const isEnabled = await saveButton.evaluate((el) => {
					return !el.hasAttribute("disabled") && !el.classList.contains("disabled")
				})
				expect(isEnabled).toBeTruthy()
			})
		})

		test.describe("When settings are saved", () => {
			test("Then the save button should become disabled again", async ({ workbox }) => {
				const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

				// Modify a setting
				const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
				let input = terminalLimitInput
				if ((await terminalLimitInput.count()) === 0) {
					input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
				}

				await input.clear()
				await input.type("3500")
				await workbox.waitForTimeout(500)

				// Save the settings
				const saveButton = settingsFrame.locator('button:has-text("Save")')
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Check button is disabled again
				const isDisabled = await saveButton.evaluate((el) => {
					return el.hasAttribute("disabled") || el.classList.contains("disabled")
				})
				expect(isDisabled).toBeTruthy()
			})

			test("Then the changes should persist when reopening settings", async ({ workbox }) => {
				const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

				// Get initial value
				const terminalLimitInput = settingsFrame.locator('input[name="terminalOutputLineLimit"]').first()
				let input = terminalLimitInput
				if ((await terminalLimitInput.count()) === 0) {
					input = settingsFrame.locator("text=/Terminal Output Line Limit/").locator("xpath=../..//input")
				}

				const initialValue = await input.inputValue()
				const newValue = initialValue === "4000" ? "5000" : "4000"

				// Modify and save
				await input.clear()
				await input.type(newValue)

				const saveButton = settingsFrame.locator('button:has-text("Save")')
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Close and reopen settings
				await workbox.keyboard.press("Control+W")
				await workbox.waitForTimeout(1000)

				await workbox.keyboard.press("Control+Shift+P")
				await workbox.waitForTimeout(500)
				await workbox.keyboard.type("Aincrok: Settings")
				await workbox.keyboard.press("Enter")
				await workbox.waitForTimeout(2000)

				// Verify persisted value
				const settingsFrameNew = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrameNew.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

				const terminalLimitInputNew = settingsFrameNew.locator('input[name="terminalOutputLineLimit"]').first()
				let inputNew = terminalLimitInputNew
				if ((await terminalLimitInputNew.count()) === 0) {
					inputNew = settingsFrameNew
						.locator("text=/Terminal Output Line Limit/")
						.locator("xpath=../..//input")
				}

				const persistedValue = await inputNew.inputValue()
				expect(persistedValue).toBe(newValue)
			})
		})
	})
})
