// Test settings save button state management and memory configuration persistence
import { test, expect } from "./playwright-base-test"

test.describe("Settings Save Button Functionality", () => {
	test.beforeEach(async ({ workbox }) => {
		// Wait for Monaco workbench to be ready
		await workbox.waitForSelector(".monaco-workbench", { timeout: 30000 })
		await workbox.waitForTimeout(3000) // Give extension time to activate

		// Try to open settings - with retry logic
		let settingsOpened = false
		for (let i = 0; i < 3; i++) {
			try {
				await workbox.keyboard.press("Control+Shift+P")
				await workbox.waitForTimeout(1000)
				await workbox.keyboard.type("Settings")
				await workbox.keyboard.press("Enter")
				await workbox.waitForTimeout(3000)

				// Check if webview iframe exists
				const iframe = workbox.frameLocator('iframe[title="Aincrok"]')
				await iframe.locator("body").waitFor({ state: "visible", timeout: 10000 })
				settingsOpened = true
				break
			} catch (error) {
				console.log(`Attempt ${i + 1} to open settings failed:`, error.message)
				if (i === 2) throw error
				await workbox.waitForTimeout(2000)
			}
		}

		if (!settingsOpened) {
			throw new Error("Could not open Aincrok settings after 3 attempts")
		}
	})

	test("save button should be disabled when no changes are made", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		// Check save button state - should be disabled initially
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')
		await expect(saveButton).toBeVisible()

		// Button should be disabled
		await expect(saveButton).toBeDisabled()

		// Verify button has disabled styling
		const hasDisabledClass = await saveButton.evaluate((el) => {
			return (
				el.classList.contains("cursor-not-allowed") ||
				el.classList.contains("bg-gray-300") ||
				el.hasAttribute("disabled")
			)
		})
		expect(hasDisabledClass).toBeTruthy()
	})

	test("save button should enable when memory configuration is changed", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		// Navigate to memory tab if it exists
		const memoryTab = settingsFrame.locator("text=/Memory/i")
		if ((await memoryTab.count()) > 0) {
			await memoryTab.click()
			await workbox.waitForTimeout(1000)
		}

		// Modify a memory setting - try to find cipher mode selector
		const cipherModeSelector = settingsFrame
			.locator("select")
			.filter({ hasText: /cipher|memory/i })
			.first()
		if ((await cipherModeSelector.count()) > 0) {
			await cipherModeSelector.selectOption({ index: 1 })
		} else {
			// Fallback: modify any available input in memory section
			const memoryInput = settingsFrame.locator('input[type="text"]').first()
			if ((await memoryInput.count()) > 0) {
				await memoryInput.fill("test-value")
			}
		}

		// Check that save button is now enabled
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')
		await expect(saveButton).toBeEnabled()

		// Verify button has enabled styling
		const hasEnabledClass = await saveButton.evaluate((el) => {
			return el.classList.contains("bg-blue-600") || !el.hasAttribute("disabled")
		})
		expect(hasEnabledClass).toBeTruthy()
	})

	test("save button should disable after successful save", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		// Navigate to API settings section
		const apiTab = settingsFrame.locator("text=/API/i").or(settingsFrame.locator("text=/Providers/i"))
		if ((await apiTab.count()) > 0) {
			await apiTab.click()
			await workbox.waitForTimeout(1000)
		}

		// Make a simple change - modify max requests if available
		const maxRequestsInput = settingsFrame.locator('input[type="number"]').first()
		if ((await maxRequestsInput.count()) > 0) {
			const currentValue = await maxRequestsInput.inputValue()
			const newValue = currentValue === "10" ? "15" : "10"
			await maxRequestsInput.fill(newValue)
		} else {
			// Fallback: modify terminal settings
			const terminalInput = settingsFrame
				.locator("input")
				.filter({ hasText: /terminal|output/i })
				.first()
			if ((await terminalInput.count()) > 0) {
				await terminalInput.fill("1000")
			}
		}

		// Verify save button becomes enabled
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')
		await expect(saveButton).toBeEnabled()

		// Click save button
		await saveButton.click()

		// Wait for save operation to complete
		await workbox.waitForTimeout(2000)

		// Verify save button is disabled again after save
		await expect(saveButton).toBeDisabled()

		// Verify button styling reflects disabled state
		const hasDisabledClass = await saveButton.evaluate((el) => {
			return (
				el.classList.contains("cursor-not-allowed") ||
				el.classList.contains("bg-gray-300") ||
				el.hasAttribute("disabled")
			)
		})
		expect(hasDisabledClass).toBeTruthy()
	})

	test("save button should remain disabled after save without re-enabling", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		// Make a change to enable save button
		const anyInput = settingsFrame.locator('input[type="text"], input[type="number"]').first()
		if ((await anyInput.count()) > 0) {
			await anyInput.fill("test-change")
		}

		// Verify save button is enabled
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')
		await expect(saveButton).toBeEnabled()

		// Click save
		await saveButton.click()

		// Wait for save and potential state updates
		await workbox.waitForTimeout(3000)

		// Button should remain disabled (not re-enable after a few seconds)
		await expect(saveButton).toBeDisabled()

		// Wait additional time to ensure it doesn't re-enable
		await workbox.waitForTimeout(5000)
		await expect(saveButton).toBeDisabled()
	})

	test("save button state should reflect actual changes in memory configuration", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		// Navigate to memory section if available
		const memoryTab = settingsFrame.locator("text=/Memory/i")
		if ((await memoryTab.count()) > 0) {
			await memoryTab.click()
			await workbox.waitForTimeout(1000)

			// Try to modify memory-specific settings
			const cipherFields = ['input[name*="cipher"]', 'select[name*="cipher"]', 'textarea[name*="cipher"]']

			let fieldModified = false
			for (const selector of cipherFields) {
				const field = settingsFrame.locator(selector).first()
				if ((await field.count()) > 0) {
					const tagName = await field.evaluate((el) => el.tagName.toLowerCase())

					if (tagName === "input") {
						await field.fill("test-memory-value")
					} else if (tagName === "select") {
						await field.selectOption({ index: 1 })
					} else if (tagName === "textarea") {
						await field.fill("test memory configuration")
					}

					fieldModified = true
					break
				}
			}

			if (fieldModified) {
				// Verify save button becomes enabled for memory changes
				const saveButton = settingsFrame.locator('[data-testid="save-button"]')
				await expect(saveButton).toBeEnabled()

				// Save the changes
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Verify button is disabled after save
				await expect(saveButton).toBeDisabled()
			}
		}
	})

	test("save button should handle multiple rapid changes correctly", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

		// Wait for settings to load
		await settingsFrame.locator('[data-testid="save-button"]').waitFor({
			state: "visible",
			timeout: 10000,
		})

		const saveButton = settingsFrame.locator('[data-testid="save-button"]')
		const testInput = settingsFrame.locator('input[type="text"], input[type="number"]').first()

		if ((await testInput.count()) > 0) {
			// Make rapid changes
			await testInput.fill("change1")
			await workbox.waitForTimeout(100)
			await testInput.fill("change2")
			await workbox.waitForTimeout(100)
			await testInput.fill("change3")

			// Save button should be enabled
			await expect(saveButton).toBeEnabled()

			// Save
			await saveButton.click()
			await workbox.waitForTimeout(1000)

			// Should be disabled after save
			await expect(saveButton).toBeDisabled()

			// Make another change immediately
			await testInput.fill("change4")

			// Should enable again
			await expect(saveButton).toBeEnabled()
		}
	})
})
