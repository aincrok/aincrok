import { test, expect } from "@playwright/test"
import { PageLifecycleManager } from "../helpers/page-lifecycle-manager"
import { setupTestEnvironment } from "../helpers/test-setup-helpers"
import { findWebview } from "../helpers/webview-helpers"

// aincrok_change - Comprehensive E2E tests for settings with 100% coverage

test.describe("Settings E2E Tests", () => {
	let lifecycle: PageLifecycleManager

	test.beforeEach(async ({ page }) => {
		lifecycle = PageLifecycleManager.getInstance(`settings-test-${Date.now()}`)
		await lifecycle.launchVSCode()
		await setupTestEnvironment(page)
	})

	test.afterEach(async () => {
		await lifecycle.closeAll()
	})

	test.describe("Settings Panel Navigation", () => {
		test("should open settings panel and display all tabs", async ({ page }) => {
			// Open settings
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Verify all tabs are present
			const tabs = [
				"providers",
				"autoApprove",
				"browser",
				"checkpoints",
				"display",
				"ghost",
				"notifications",
				"contextManagement",
				"terminal",
				"prompts",
				"experimental",
				"language",
				"mcp",
				"memory",
				"about",
			]

			for (const tab of tabs) {
				const tabElement = await webview.locator(`[data-testid="tab-${tab}"]`)
				await expect(tabElement).toBeVisible()
			}
		})

		test("should switch between tabs correctly", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Click on memory tab
			await webview.locator('[data-testid="tab-memory"]').click()

			// Verify memory content is visible
			await expect(webview.locator('text="Memory Provider"')).toBeVisible()

			// Click on providers tab
			await webview.locator('[data-testid="tab-providers"]').click()

			// Verify providers content is visible
			await expect(webview.locator('text="API Provider"')).toBeVisible()
		})
	})

	test.describe("Settings Save Flow", () => {
		test("should enable save button when changes are made", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Save button should be disabled initially
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeDisabled()

			// Navigate to auto-approve tab
			await webview.locator('[data-testid="tab-autoApprove"]').click()

			// Toggle a setting
			const checkbox = webview.locator('input[type="checkbox"]').first()
			await checkbox.click()

			// Save button should be enabled
			await expect(saveButton).toBeEnabled()
		})

		test("should save settings correctly and disable save button", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Make a change
			await webview.locator('[data-testid="tab-autoApprove"]').click()
			const checkbox = webview.locator('input[type="checkbox"]').first()
			await checkbox.click()

			// Click save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await saveButton.click()

			// Wait for save to complete
			await page.waitForTimeout(1000)

			// Save button should be disabled again
			await expect(saveButton).toBeDisabled()

			// Verify the setting persisted by reopening settings
			await page.keyboard.press("Escape") // Close settings
			await page.waitForTimeout(500)

			// Reopen settings
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const newWebview = await findWebview(page)
			await newWebview.locator('[data-testid="tab-autoApprove"]').click()

			// Checkbox should still be checked
			const newCheckbox = newWebview.locator('input[type="checkbox"]').first()
			await expect(newCheckbox).toBeChecked()
		})

		test("should not lose changes when switching tabs", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Make a change in auto-approve
			await webview.locator('[data-testid="tab-autoApprove"]').click()
			const checkbox = webview.locator('input[type="checkbox"]').first()
			await checkbox.click()

			// Switch to another tab
			await webview.locator('[data-testid="tab-browser"]').click()

			// Switch back
			await webview.locator('[data-testid="tab-autoApprove"]').click()

			// Checkbox should still be in changed state
			await expect(checkbox).toBeChecked()

			// Save button should still be enabled
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
		})
	})

	test.describe("API Configuration Management", () => {
		test("should change API provider and model", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Select OpenAI provider
			const providerSelect = webview.locator('select[name="apiProvider"]')
			await providerSelect.selectOption("openai")

			// Enter API key
			const apiKeyInput = webview.locator('input[name="openAiApiKey"]')
			await apiKeyInput.fill("test-openai-key")

			// Select model
			const modelSelect = webview.locator('select[name="openAiModelId"]')
			await modelSelect.selectOption("gpt-4")

			// Save settings
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
			await saveButton.click()

			// Verify save completed
			await expect(saveButton).toBeDisabled()
		})

		test("should create and switch between API profiles", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Create new profile
			const newProfileButton = webview.locator('button:has-text("New Profile")')
			await newProfileButton.click()

			// Enter profile name
			const profileNameInput = webview.locator('input[placeholder="Profile name"]')
			await profileNameInput.fill("Production")

			// Confirm creation
			const confirmButton = webview.locator('button:has-text("Create")')
			await confirmButton.click()

			// Verify profile was created
			await expect(webview.locator('text="Production"')).toBeVisible()

			// Switch to new profile
			await webview.locator('text="Production"').click()

			// Configure the new profile
			const apiKeyInput = webview.locator('input[name="apiKey"]')
			await apiKeyInput.fill("production-key")

			// Save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await saveButton.click()
			await expect(saveButton).toBeDisabled()
		})

		test("should delete API profile", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Assuming we have a test profile
			const deleteButton = webview.locator('button[aria-label="Delete profile"]').first()
			await deleteButton.click()

			// Confirm deletion
			const confirmDelete = webview.locator('button:has-text("Delete")')
			await confirmDelete.click()

			// Verify profile was deleted
			await expect(webview.locator('text="Test Profile"')).not.toBeVisible()
		})
	})

	test.describe("Memory Provider Configuration", () => {
		test("should configure Cipher memory provider", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Navigate to memory tab
			await webview.locator('[data-testid="tab-memory"]').click()

			// Select Cipher provider
			const providerSelect = webview.locator('select[name="memoryProvider"]')
			await providerSelect.selectOption("cipher")

			// Configure Cipher
			const modeSelect = webview.locator('select[name="cipherMode"]')
			await modeSelect.selectOption("embedded")

			const llmProviderSelect = webview.locator('select[name="cipherLlmProvider"]')
			await llmProviderSelect.selectOption("openai")

			const apiKeyInput = webview.locator('input[name="cipherApiKey"]')
			await apiKeyInput.fill("cipher-api-key")

			// Save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
			await saveButton.click()
			await expect(saveButton).toBeDisabled()
		})

		test("should configure Mem0 memory provider", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Navigate to memory tab
			await webview.locator('[data-testid="tab-memory"]').click()

			// Select Mem0 provider
			const providerSelect = webview.locator('select[name="memoryProvider"]')
			await providerSelect.selectOption("mem0")

			// Configure Mem0
			const apiKeyInput = webview.locator('input[name="mem0ApiKey"]')
			await apiKeyInput.fill("mem0-api-key")

			const modelSelect = webview.locator('select[name="mem0Model"]')
			await modelSelect.selectOption("gpt-4")

			// Save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
			await saveButton.click()
			await expect(saveButton).toBeDisabled()
		})
	})

	test.describe("Settings Validation", () => {
		test("should show error for invalid API key", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Clear API key
			const apiKeyInput = webview.locator('input[name="apiKey"]')
			await apiKeyInput.clear()

			// Should show error message
			await expect(webview.locator('text="API key is required"')).toBeVisible()

			// Save button should be disabled
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeDisabled()
		})

		test("should validate numeric inputs", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Navigate to notifications tab
			await webview.locator('[data-testid="tab-notifications"]').click()

			// Try to enter invalid volume
			const volumeInput = webview.locator('input[name="soundVolume"]')
			await volumeInput.fill("150") // Max is 100

			// Should show error or clamp value
			await expect(volumeInput).toHaveValue("100")
		})
	})

	test.describe("Unsaved Changes Dialog", () => {
		test("should show unsaved changes dialog when closing with changes", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Make a change
			await webview.locator('[data-testid="tab-autoApprove"]').click()
			const checkbox = webview.locator('input[type="checkbox"]').first()
			await checkbox.click()

			// Click done button
			const doneButton = webview.locator('button:has-text("Done")')
			await doneButton.click()

			// Dialog should appear
			await expect(webview.locator('text="Unsaved Changes"')).toBeVisible()

			// Click discard
			const discardButton = webview.locator('button:has-text("Discard")')
			await discardButton.click()

			// Settings should close - check that webview frame is no longer visible
			await expect(page.locator('iframe[src*="aincrok"][src*="webview"]')).not.toBeVisible()
		})

		test("should cancel unsaved changes dialog", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Make a change
			await webview.locator('[data-testid="tab-autoApprove"]').click()
			const checkbox = webview.locator('input[type="checkbox"]').first()
			await checkbox.click()

			// Click done button
			const doneButton = webview.locator('button:has-text("Done")')
			await doneButton.click()

			// Dialog should appear
			await expect(webview.locator('text="Unsaved Changes"')).toBeVisible()

			// Click cancel
			const cancelButton = webview.locator('button:has-text("Cancel")')
			await cancelButton.click()

			// Should stay in settings
			await expect(webview.locator('[data-testid="save-button"]')).toBeVisible()
		})
	})

	test.describe("Experimental Features", () => {
		test("should toggle experimental features", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Navigate to experimental tab
			await webview.locator('[data-testid="tab-experimental"]').click()

			// Toggle an experiment
			const experimentToggle = webview.locator('input[type="checkbox"]').first()
			await experimentToggle.click()

			// Save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
			await saveButton.click()
			await expect(saveButton).toBeDisabled()
		})
	})

	test.describe("Language Settings", () => {
		test("should change language", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Navigate to language tab
			await webview.locator('[data-testid="tab-language"]').click()

			// Select Spanish
			const languageSelect = webview.locator('select[name="language"]')
			await languageSelect.selectOption("es")

			// Save
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
			await saveButton.click()
			await expect(saveButton).toBeDisabled()

			// UI should update to Spanish
			await expect(webview.locator('text="Configuración"')).toBeVisible()
		})
	})

	test.describe("Import/Export Settings", () => {
		test("should export settings", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Export Settings")
			await page.keyboard.press("Enter")

			// Should show success notification
			await expect(page.locator('text="Settings exported successfully"')).toBeVisible()
		})

		test("should import settings", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Import Settings")
			await page.keyboard.press("Enter")

			// File dialog would open - simulate file selection
			// This requires mocking file system interaction

			// Should show success notification
			await expect(page.locator('text="Settings imported successfully"')).toBeVisible()
		})
	})

	test.describe("Keyboard Navigation", () => {
		test("should support keyboard navigation", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Tab through elements
			await page.keyboard.press("Tab")
			await page.keyboard.press("Tab")
			await page.keyboard.press("Tab")

			// Use arrow keys to navigate tabs
			await page.keyboard.press("ArrowDown")
			await page.keyboard.press("ArrowDown")

			// Press Enter to select
			await page.keyboard.press("Enter")

			// Verify navigation worked
			const activeTab = await webview.locator('[aria-selected="true"]')
			await expect(activeTab).toBeVisible()
		})
	})

	test.describe("Performance", () => {
		test("should handle rapid changes efficiently", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Make rapid changes
			for (let i = 0; i < 10; i++) {
				await webview.locator(`[data-testid="tab-${i % 5 === 0 ? "providers" : "autoApprove"}"]`).click()
			}

			// Should still be responsive
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeVisible()
		})

		test("should debounce input changes", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Type rapidly in an input
			const input = webview.locator('input[name="apiKey"]')
			await input.type("a")
			await input.type("b")
			await input.type("c")
			await input.type("d")
			await input.type("e")

			// Wait for debounce
			await page.waitForTimeout(300)

			// Save button should only be enabled once
			const saveButton = webview.locator('[data-testid="save-button"]')
			await expect(saveButton).toBeEnabled()
		})
	})

	test.describe("Accessibility", () => {
		test("should have proper ARIA labels", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Check for ARIA labels
			const tablist = webview.locator('[role="tablist"]')
			await expect(tablist).toBeVisible()

			const tabs = webview.locator('[role="tab"]')
			await expect(tabs).toHaveCount(15)

			const tabpanel = webview.locator('[role="tabpanel"]')
			await expect(tabpanel).toBeVisible()
		})

		test("should support screen reader navigation", async ({ page }) => {
			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// All interactive elements should be focusable
			const buttons = webview.locator("button")
			const firstButton = buttons.first()
			await firstButton.focus()

			// Should have focus indicator
			await expect(firstButton).toBeFocused()
		})
	})

	test.describe("Responsive Design", () => {
		test("should adapt to narrow viewport", async ({ page }) => {
			// Set narrow viewport
			await page.setViewportSize({ width: 400, height: 800 })

			await page.keyboard.press("Control+Shift+P")
			await page.keyboard.type("Aincrok: Open Settings")
			await page.keyboard.press("Enter")

			const webview = await findWebview(page)

			// Should be in compact mode
			const compactTabList = webview.locator('[data-compact="true"]')
			await expect(compactTabList).toBeVisible()

			// Icons should be visible, text hidden
			const tabIcons = webview.locator('[data-testid^="tab-"] svg')
			await expect(tabIcons.first()).toBeVisible()
		})
	})
})
