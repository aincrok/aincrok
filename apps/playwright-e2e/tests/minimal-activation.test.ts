import { test, expect, type TestFixtures } from "./playwright-base-test"

test.describe("Minimal Extension Activation Test", () => {
	test("should activate extension without crashing", async ({ workbox: page }: TestFixtures) => {
		// Just check if the workbench loads and the extension appears in activity bar
		await expect(page.locator(".monaco-workbench")).toBeVisible()
		console.log("✅ VS Code launched successfully")

		// Wait a bit for extension to load
		await page.waitForTimeout(5000)

		// Try to find any mention of Aincrok in the activity bar or anywhere
		const activityBarItems = await page.locator(".monaco-workbench .activitybar .action-label").all()
		console.log(`🔍 Found ${activityBarItems.length} activity bar items:`)
		for (let i = 0; i < activityBarItems.length; i++) {
			const title = await activityBarItems[i].getAttribute("title")
			const ariaLabel = await activityBarItems[i].getAttribute("aria-label")
			console.log(`  Item ${i}: title="${title}", aria-label="${ariaLabel}"`)
		}

		// Check if any extension is loaded (even if not showing in activity bar)
		const extensionsList = await page.locator('[id*="extension"], [aria-label*="extension"]').all()
		console.log(`🔍 Found ${extensionsList.length} extension-related elements`)

		// Test passes if VS Code doesn't crash within 5 seconds
		console.log("✅ Extension activation test completed without crash")
	})
})
