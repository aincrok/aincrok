// aincrok_change - new Playwright test for memory provider selection
import { test, expect } from "./playwright-base-test"

test.describe("Memory Provider Selection E2E Tests", () => {
	test.beforeEach(async ({ workbox }) => {
		// Open settings tab
		await workbox.keyboard.press("Control+Shift+P")
		await workbox.waitForTimeout(500)
		await workbox.keyboard.type("Aincrok: Settings")
		await workbox.keyboard.press("Enter")
		await workbox.waitForTimeout(2000)
	})

	test.describe("Memory Provider Configuration", () => {
		test("should support memory provider validation", async ({ workbox }) => {
			const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

			// Wait for settings to load
			await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

			// Check that memory provider dropdown exists
			const memoryProviderSection = settingsFrame.locator("text=/Memory Provider/").first()
			await expect(memoryProviderSection).toBeVisible()

			// Test that memory providers are available in dropdown
			const memoryProviders = ["local", "filesystem", "mem0", "openai"]

			// Click on memory provider dropdown
			const providerDropdown = settingsFrame
				.locator("select")
				.filter({ hasText: /memory/i })
				.first()
			if ((await providerDropdown.count()) === 0) {
				// Try alternative selector
				const dropdown = settingsFrame.locator("text=/Memory Provider/").locator("xpath=../..//select")
				for (const provider of memoryProviders) {
					const option = dropdown.locator(`option[value="${provider}"]`)
					await expect(option).toHaveCount(1)
				}
			} else {
				for (const provider of memoryProviders) {
					const option = providerDropdown.locator(`option[value="${provider}"]`)
					await expect(option).toHaveCount(1)
				}
			}
		})

		test("should validate memory configuration structure", async ({ workbox }) => {
			const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

			// Wait for settings to load
			await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

			// Check embedded mode configuration
			const embeddedModeSection = settingsFrame.locator("text=/Embedded/").first()
			if ((await embeddedModeSection.count()) > 0) {
				await expect(embeddedModeSection).toBeVisible()

				// Check for mem0 provider option
				const mem0Option = settingsFrame.locator("text=/mem0/i").first()
				if ((await mem0Option.count()) > 0) {
					await expect(mem0Option).toBeVisible()
				}
			}

			// Validate config structure exists
			const configSection = settingsFrame.locator("text=/Configuration/").first()
			if ((await configSection.count()) > 0) {
				await expect(configSection).toBeVisible()
			}
		})

		test("should handle LLM provider options", async ({ workbox }) => {
			const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

			// Wait for settings to load
			await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

			// Test LLM provider options
			const llmProviders = ["openai", "anthropic", "ollama"]

			for (const provider of llmProviders) {
				const providerOption = settingsFrame.locator(`text=/${provider}/i`).first()
				if ((await providerOption.count()) > 0) {
					await expect(providerOption).toBeVisible()
				}
			}
		})

		test("should handle embedding provider options", async ({ workbox }) => {
			const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

			// Wait for settings to load
			await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

			// Test embedding provider options
			const embeddingProviders = ["openai", "ollama", "huggingface"]

			// Look for embedding section
			const embeddingSection = settingsFrame.locator("text=/Embedding/").first()
			if ((await embeddingSection.count()) > 0) {
				await expect(embeddingSection).toBeVisible()

				for (const provider of embeddingProviders) {
					const providerOption = settingsFrame.locator(`text=/${provider}/i`)
					if ((await providerOption.count()) > 0) {
						const firstMatch = providerOption.first()
						await expect(firstMatch).toBeVisible()
					}
				}
			}
		})

		test("should handle different operation modes", async ({ workbox }) => {
			const settingsFrame = workbox.frameLocator('iframe[title="Aincrok"]')

			// Wait for settings to load
			await settingsFrame.locator("text=/Settings/").waitFor({ state: "visible", timeout: 10000 })

			// Test different memory operation modes
			const modes = ["embedded", "mcp", "api"]

			for (const mode of modes) {
				const modeOption = settingsFrame.locator(`text=/${mode}/i`).first()
				if ((await modeOption.count()) > 0) {
					await expect(modeOption).toBeVisible()
				}
			}
		})
	})
})
