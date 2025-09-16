// kilocode_change - new file
import { type Page } from "@playwright/test"
import { waitForWebviewText, configureApiKeyThroughUI } from "./webview-helpers"
import { verifyExtensionInstalled } from "./vscode-helpers"

export async function setupTestEnvironment(page: Page): Promise<void> {
	await verifyExtensionInstalled(page)

	// Wait a bit for extension to fully activate after being detected
	console.log("⌛️ Waiting for extension to fully activate...")
	await page.waitForTimeout(3000)

	// Try to manually trigger the extension sidebar view
	try {
		console.log("🔧 Trying to trigger Aincrok sidebar view...")
		await page.keyboard.press("Control+Shift+P")
		await page.waitForTimeout(500)
		await page.keyboard.type("Aincrok: Focus Chat Input")
		await page.keyboard.press("Enter")
		await page.waitForTimeout(2000)
		console.log("✅ Triggered Aincrok sidebar view command")
	} catch (error) {
		console.log("⚠️ Could not trigger sidebar command:", error.message)
	}

	await waitForWebviewText(page, "Welcome to Aincrok!")
	await configureApiKeyThroughUI(page)
	await waitForWebviewText(page, "Generate, refactor, and debug code with AI assistance")
}
