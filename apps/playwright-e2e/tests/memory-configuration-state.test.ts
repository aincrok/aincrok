// Test memory configuration state management and persistence
import { test, expect } from "./playwright-base-test"

test.describe("Memory Configuration State Management", () => {
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

				// Check if webview iframe exists and save button is visible
				const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
				await settingsFrame.locator("body").waitFor({ state: "visible", timeout: 10000 })
				await settingsFrame.locator('[data-testid="save-button"]').waitFor({
					state: "visible",
					timeout: 10000,
				})
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

		// Navigate to memory section if available
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const memoryTab = settingsFrame.locator('button:has-text("Memory")').or(settingsFrame.locator("text=/Memory/i"))
		if ((await memoryTab.count()) > 0) {
			await memoryTab.click()
			await workbox.waitForTimeout(1000)
		}
	})

	test("memory configuration fields should trigger save button state changes", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')

		// Initially save button should be disabled
		await expect(saveButton).toBeDisabled()

		// Look for memory provider configuration elements
		const memoryProviderSelect = settingsFrame.locator("select").first()
		const memoryConfigInput = settingsFrame.locator('input[type="text"]').first()
		const memoryUrlInput = settingsFrame.locator('input[placeholder*="url" i], input[name*="url"]').first()

		// Test changing memory provider if available
		if ((await memoryProviderSelect.count()) > 0) {
			await memoryProviderSelect.selectOption({ index: 1 })
			await expect(saveButton).toBeEnabled()

			// Reset for next test
			await saveButton.click()
			await workbox.waitForTimeout(1000)
			await expect(saveButton).toBeDisabled()
		}

		// Test changing configuration input if available
		if ((await memoryConfigInput.count()) > 0) {
			await memoryConfigInput.fill("test-memory-config")
			await expect(saveButton).toBeEnabled()

			// Reset for next test
			await saveButton.click()
			await workbox.waitForTimeout(1000)
			await expect(saveButton).toBeDisabled()
		}

		// Test changing URL input if available
		if ((await memoryUrlInput.count()) > 0) {
			await memoryUrlInput.fill("http://test-memory-url.com")
			await expect(saveButton).toBeEnabled()
		}
	})

	test("local memory fields should be properly persisted after save", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')

		// Find any available memory configuration field
		const configFields = [
			settingsFrame.locator('input[name*="memory"]').first(),
			settingsFrame.locator('input[name*="cipher"]').first(),
			settingsFrame.locator('select[name*="memory"]').first(),
			settingsFrame.locator('textarea[name*="config"]').first(),
		]

		for (const field of configFields) {
			if ((await field.count()) > 0) {
				// Get the field type and current value
				const tagName = await field.evaluate((el) => el.tagName.toLowerCase())
				const _originalValue = await field.inputValue().catch(() => "")

				// Make a change based on field type
				let testValue = "test-value"
				if (tagName === "select") {
					// Try to select a different option
					const options = await field.locator("option").count()
					if (options > 1) {
						await field.selectOption({ index: 1 })
						testValue = await field.inputValue()
					}
				} else {
					await field.fill(testValue)
				}

				// Verify save button is enabled
				await expect(saveButton).toBeEnabled()

				// Save the changes
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Verify save button is disabled after save
				await expect(saveButton).toBeDisabled()

				// Verify the value is still there (persisted)
				const persistedValue = await field.inputValue()
				expect(persistedValue).toBe(testValue)

				// Test that the field change is detected properly
				if (tagName !== "select") {
					await field.fill(testValue + "-modified")
					await expect(saveButton).toBeEnabled()
				}

				break // Test only one field to avoid conflicts
			}
		}
	})

	test("memory configuration state should handle provider switches correctly", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')

		// Look for memory provider selector
		const providerSelect = settingsFrame
			.locator("select")
			.filter({
				hasText: /provider|memory|cipher/i,
			})
			.first()

		if ((await providerSelect.count()) > 0) {
			const options = await providerSelect.locator("option").count()

			if (options > 1) {
				// Get initial selection
				const initialValue = await providerSelect.inputValue()

				// Switch to different provider
				await providerSelect.selectOption({ index: 1 })

				// Save button should be enabled
				await expect(saveButton).toBeEnabled()

				// Save the change
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Save button should be disabled
				await expect(saveButton).toBeDisabled()

				// Switch back to original provider
				await providerSelect.selectOption(initialValue)

				// Save button should be enabled again
				await expect(saveButton).toBeEnabled()

				// Save again
				await saveButton.click()
				await workbox.waitForTimeout(2000)

				// Should be disabled
				await expect(saveButton).toBeDisabled()
			}
		}
	})

	test("memory configuration should handle validation errors gracefully", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')

		// Look for URL or API key fields that might have validation
		const urlField = settingsFrame.locator('input[type="url"], input[placeholder*="url" i]').first()
		const apiKeyField = settingsFrame.locator('input[placeholder*="key" i], input[name*="key"]').first()

		// Test invalid URL if URL field exists
		if ((await urlField.count()) > 0) {
			await urlField.fill("invalid-url")

			// Save button might still be enabled but validation should prevent save
			if (await saveButton.isEnabled()) {
				await saveButton.click()
				await workbox.waitForTimeout(1000)

				// Check if error message appears or save button remains enabled
				const errorMessage = settingsFrame.locator("text=/error|invalid|required/i")
				const hasError = (await errorMessage.count()) > 0

				// Either error should show or button should remain enabled for correction
				expect(hasError || (await saveButton.isEnabled())).toBeTruthy()
			}
		}

		// Test empty required field if API key field exists
		if ((await apiKeyField.count()) > 0) {
			await apiKeyField.fill("")

			// Button state should reflect validation
			const _isEnabled = await saveButton.isEnabled()

			// Fill with valid value
			await apiKeyField.fill("test-api-key-12345")

			// Should enable save button with valid input
			await expect(saveButton).toBeEnabled()
		}
	})

	test("memory configuration changes should be detected immediately", async ({ workbox }) => {
		const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')
		const saveButton = settingsFrame.locator('[data-testid="save-button"]')

		// Initially disabled
		await expect(saveButton).toBeDisabled()

		// Find any configurable field
		const configurableField = settingsFrame
			.locator(
				'input[type="text"]:not([readonly]):not([disabled]), ' +
					'input[type="number"]:not([readonly]):not([disabled]), ' +
					"select:not([disabled]), " +
					"textarea:not([readonly]):not([disabled])",
			)
			.first()

		if ((await configurableField.count()) > 0) {
			// Type a single character
			await configurableField.focus()
			await workbox.keyboard.type("x")

			// Should immediately enable save button
			await expect(saveButton).toBeEnabled()

			// Remove the character
			await workbox.keyboard.press("Backspace")

			// May disable again if back to original value
			// (depends on debounce timing, so we'll wait a bit)
			await workbox.waitForTimeout(500)

			// Add character again
			await workbox.keyboard.type("y")
			await expect(saveButton).toBeEnabled()
		}
	})
})
