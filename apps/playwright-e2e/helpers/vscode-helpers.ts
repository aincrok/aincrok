import { type Page, expect } from "@playwright/test"

const modifier = process.platform === "darwin" ? "Meta" : "Control"

export async function verifyExtensionInstalled(page: Page) {
	try {
		// Debug: list all activity bar items to see what's available
		const allActivityBarItems = await page.locator(".monaco-workbench .activitybar .action-label").all()
		console.log(`🔍 Found ${allActivityBarItems.length} activity bar items:`)
		for (let i = 0; i < allActivityBarItems.length; i++) {
			const title = await allActivityBarItems[i].getAttribute("title")
			const ariaLabel = await allActivityBarItems[i].getAttribute("aria-label")
			console.log(`  Item ${i}: title="${title}", aria-label="${ariaLabel}"`)
		}

		// Look for Aincrok extension in activity bar
		const activityBarIcon = page
			.locator('[aria-label*="Aincrok"], [title*="Aincrok"], [aria-label*="aincrok"], [title*="aincrok"]')
			.first()
		await expect(activityBarIcon).toBeVisible({ timeout: 5000 })
		console.log("✅ Extension installed!")
	} catch (error) {
		console.log("❌ Extension not found in activity bar:", error.message)
		throw new Error("Failed to find the installed extension! Check if the build failed and try again.")
	}
}

export async function closeAllTabs(page: Page): Promise<void> {
	const tabs = page.locator(".tab a.label-name")
	const count = await tabs.count()
	if (count > 0) {
		// Close all editor tabs using the default keyboard command [Cmd+K Cmd+W]
		await page.keyboard.press(`${modifier}+K`)
		await page.keyboard.press(`${modifier}+W`)

		const dismissedTabs = page.locator(".tab a.label-name")
		await expect(dismissedTabs).not.toBeVisible()
	}
}

export async function waitForAllExtensionActivation(page: Page): Promise<void> {
	try {
		const activatingStatus = page.locator("text=Activating Extensions")
		const activatingStatusCount = await activatingStatus.count()
		if (activatingStatusCount > 0) {
			console.log("⌛️ Waiting for `Activating Extensions` to go away...")
			await activatingStatus.waitFor({ state: "hidden", timeout: 10000 })
		}
	} catch {
		// noop
	}
}

export async function switchToTheme(page: Page, themeName: string): Promise<void> {
	await page.keyboard.press(`${modifier}+K`)
	await page.waitForTimeout(100)
	await page.keyboard.press(`${modifier}+T`)
	await page.waitForTimeout(100)

	await page.keyboard.type(themeName)
	await page.waitForTimeout(100)

	await page.keyboard.press("Enter")
	await page.waitForTimeout(100)
}
