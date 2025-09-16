// kilocode_change - new file
import { type Page, type FrameLocator, expect } from "@playwright/test"
import type { WebviewMessage } from "../../../src/shared/WebviewMessage"
import { ProviderSettings } from "@roo-code/types"
import { verboseLog, debugLog, warnLog } from "./logging-utils" // aincrok_change

const defaultPlaywrightApiConfig = {
	apiProvider: "openai" as const,
	openAiApiKey: process.env.GITHUB_COPILOT_KEY,
	openAiModelId: "gpt-5-mini",
	openAiBaseUrl: process.env.GITHUB_COPILOT_URL,
}

export async function findWebview(workbox: Page): Promise<FrameLocator> {
	// Try to activate the extension by clicking on it in the activity bar
	verboseLog("🔍 Trying to activate Aincrok extension...") // aincrok_change
	try {
		const aincrokButton = workbox
			.locator('[aria-label*="Aincrok"], [title*="Aincrok"], [aria-label*="aincrok"], [title*="aincrok"]')
			.first()
		await aincrokButton.click({ timeout: 2000 })
		verboseLog("✅ Clicked Aincrok extension in activity bar") // aincrok_change
		await workbox.waitForTimeout(2000) // Wait for webview to load
	} catch (error) {
		warnLog(`⚠️ Could not find/click Aincrok in activity bar: ${error.message}`) // aincrok_change
	}

	// First, let's debug what iframes exist
	// aincrok_change start - conditional logging
	debugLog("🔍 Looking for webview iframe...")
	if (process.env.PLAYWRIGHT_VERBOSE_LOGS === "true") {
		const allIframes = await workbox.locator("iframe").all()
		debugLog(`Found ${allIframes.length} iframes total`)

		for (let i = 0; i < allIframes.length; i++) {
			const src = await allIframes[i].getAttribute("src")
			debugLog(`  Iframe ${i}: src="${src}"`)
		}
	}
	// aincrok_change end

	// Updated to use correct extension ID
	const webviewFrameEl = workbox.frameLocator(
		'iframe[src*="extensionId=aincrok.aincrok"][src*="purpose=webviewView"]',
	)

	// Wait for the active frame with better error handling
	try {
		await webviewFrameEl.locator("#active-frame").waitFor({
			timeout: 10000,
			state: "attached",
		})
	} catch (error) {
		console.error("Failed to find #active-frame, trying alternative selectors...")

		// Try alternative selectors if the first one fails
		const alternativeSelectors = [
			'iframe[src*="aincrok"][src*="webview"]',
			'iframe[id*="aincrok"]',
			"iframe.webview",
		]

		for (const selector of alternativeSelectors) {
			try {
				const altFrame = workbox.frameLocator(selector)
				await altFrame.locator("body").waitFor({ timeout: 5000 })
				verboseLog(`✅ Found webview using alternative selector: ${selector}`) // aincrok_change
				return altFrame
			} catch (e) {
				continue
			}
		}

		throw new Error("Could not find webview iframe with any selector")
	}

	return webviewFrameEl.frameLocator("#active-frame")
}

export async function waitForWebviewText(page: Page, text: string, timeout: number = 30000): Promise<void> {
	const webviewFrame = await findWebview(page)
	await expect(webviewFrame.locator("body")).toContainText(text, { timeout })
}

export async function postWebviewMessage(page: Page, message: WebviewMessage): Promise<void> {
	const webviewFrame = await findWebview(page)

	// Retry mechanism for VSCode API availability
	const maxRetries = 3
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			await webviewFrame.locator("body").evaluate((element, msg) => {
				if (!window.vscode) {
					throw new Error("Global vscode API not found")
				}

				window.vscode.postMessage(msg)
			}, message)
			return // Success - exit the retry loop
		} catch (error) {
			if (attempt === maxRetries) {
				throw error // Re-throw on final attempt
			}
			await page.waitForTimeout(1000)
		}
	}
}

export async function upsertApiConfiguration(page: Page, apiConfiguration?: Partial<ProviderSettings>): Promise<void> {
	await postWebviewMessage(page, {
		type: "upsertApiConfiguration",
		text: "default",
		apiConfiguration: apiConfiguration ?? defaultPlaywrightApiConfig,
	})
	await postWebviewMessage(page, { type: "currentApiConfigName", text: "default" })
}

export async function configureApiKeyThroughUI(page: Page): Promise<void> {
	const webviewFrame = await findWebview(page)
	verboseLog("✅ Webview found!") // aincrok_change

	// Click "Use your own API key" button
	const useOwnKeyButton = webviewFrame.locator('button:has-text("Use your own API key")')
	await useOwnKeyButton.waitFor()
	await useOwnKeyButton.click()

	// Wait for the provider selection dropdown to appear
	const providerDropdown = webviewFrame.locator('[role="combobox"]').first()
	await providerDropdown.waitFor()
	await providerDropdown.click()

	// Select OpenAI from the dropdown
	const openAiOption = webviewFrame.locator('[role="option"]:has-text("OpenAI")')
	await openAiOption.waitFor()
	await openAiOption.click()

	// Fill in the OpenAI API key (password field)
	const apiKeyInput = webviewFrame.locator('input[type="password"]').first()
	await apiKeyInput.waitFor()
	await apiKeyInput.fill(process.env.GITHUB_COPILOT_KEY || "")
	verboseLog("✅ Filled in OpenAI key!") // aincrok_change

	// Submit the configuration by clicking "Let's go!" button
	const submitButton = webviewFrame.locator('button:has-text("Let\'s go!")')
	await submitButton.waitFor()
	await submitButton.click()
	verboseLog("✅ Provider configured!") // aincrok_change
}
