import { Page, Browser, BrowserContext, chromium } from "@playwright/test"
import * as path from "path"
import * as fs from "fs"

/**
 * Manages page lifecycle for Playwright tests to prevent "Target closed" errors
 */
export class PageLifecycleManager {
	private static instances = new Map<string, PageLifecycleManager>()
	private browser: Browser | null = null
	private context: BrowserContext | null = null
	private page: Page | null = null
	private isClosing = false

	constructor(private testId: string) {}

	/**
	 * Get or create a lifecycle manager for a test
	 */
	static getInstance(testId: string): PageLifecycleManager {
		if (!this.instances.has(testId)) {
			this.instances.set(testId, new PageLifecycleManager(testId))
		}
		return this.instances.get(testId)!
	}

	/**
	 * Launch VS Code and create a new page
	 */
	async launchVSCode(): Promise<Page> {
		if (this.page && !this.isClosing) {
			console.log(`Reusing existing page for test ${this.testId}`)
			return this.page
		}

		console.log(`Launching VS Code for test ${this.testId}...`)

		// Get VS Code executable path
		const vscodePath = process.env.VSCODE_EXECUTABLE_PATH
		if (!vscodePath) {
			throw new Error("VSCODE_EXECUTABLE_PATH not set. Run global setup first.")
		}

		// Get extension path
		const extensionPath = path.resolve(__dirname, "../../../src")
		if (!fs.existsSync(extensionPath)) {
			throw new Error(`Extension path not found: ${extensionPath}`)
		}

		// Launch browser with VS Code
		this.browser = await chromium.launch({
			headless: false,
			executablePath: vscodePath,
			args: [
				`--extensionDevelopmentPath=${extensionPath}`,
				"--new-window",
				"--disable-extensions",
				"--disable-gpu",
				"--no-sandbox",
				"--disable-dev-shm-usage",
				`--user-data-dir=/tmp/vscode-test-${Date.now()}`,
			],
			timeout: 60000,
		})

		// Create context with proper viewport
		this.context = await this.browser.newContext({
			viewport: { width: 1280, height: 720 },
			ignoreHTTPSErrors: true,
		})

		// Set up context event handlers
		this.context.on("close", () => {
			console.log(`Context closed for test ${this.testId}`)
			this.handleContextClose()
		})

		// Create page
		this.page = await this.context.newPage()

		// Set up page event handlers
		this.page.on("close", () => {
			console.log(`Page closed for test ${this.testId}`)
			this.handlePageClose()
		})

		this.page.on("crash", () => {
			console.error(`Page crashed for test ${this.testId}`)
			this.handlePageCrash()
		})

		// Set default timeout
		this.page.setDefaultTimeout(30000)

		console.log(`VS Code launched successfully for test ${this.testId}`)
		return this.page
	}

	/**
	 * Get the current page, launching if necessary
	 */
	async getPage(): Promise<Page> {
		if (!this.page || this.isClosing) {
			return await this.launchVSCode()
		}
		return this.page
	}

	/**
	 * Safely close the page without errors
	 */
	async closePage(): Promise<void> {
		if (this.isClosing) {
			console.log(`Already closing page for test ${this.testId}`)
			return
		}

		this.isClosing = true
		console.log(`Closing page for test ${this.testId}...`)

		try {
			if (this.page && !this.page.isClosed()) {
				// Remove event listeners before closing
				this.page.removeAllListeners()
				await this.page.close()
			}
			this.page = null
		} catch (error) {
			console.warn(`Error closing page for test ${this.testId}:`, error)
		}

		this.isClosing = false
	}

	/**
	 * Close context and browser
	 */
	async closeAll(): Promise<void> {
		console.log(`Closing all resources for test ${this.testId}...`)

		await this.closePage()

		try {
			if (this.context) {
				this.context.removeAllListeners()
				await this.context.close()
				this.context = null
			}
		} catch (error) {
			console.warn(`Error closing context for test ${this.testId}:`, error)
		}

		try {
			if (this.browser) {
				await this.browser.close()
				this.browser = null
			}
		} catch (error) {
			console.warn(`Error closing browser for test ${this.testId}:`, error)
		}

		// Remove from instances map
		PageLifecycleManager.instances.delete(this.testId)
	}

	/**
	 * Handle unexpected page close
	 */
	private handlePageClose(): void {
		if (!this.isClosing) {
			console.warn(`Unexpected page close for test ${this.testId}`)
			this.page = null
		}
	}

	/**
	 * Handle page crash
	 */
	private handlePageCrash(): void {
		console.error(`Page crashed for test ${this.testId}, resetting...`)
		this.page = null
		this.isClosing = false
	}

	/**
	 * Handle context close
	 */
	private handleContextClose(): void {
		if (!this.isClosing) {
			console.warn(`Unexpected context close for test ${this.testId}`)
			this.context = null
			this.page = null
		}
	}

	/**
	 * Clean up all instances (for global teardown)
	 */
	static async cleanupAll(): Promise<void> {
		console.log("Cleaning up all page lifecycle managers...")
		const promises = Array.from(this.instances.values()).map((manager) => manager.closeAll())
		await Promise.all(promises)
		this.instances.clear()
	}

	/**
	 * Check if page is valid and not closed
	 */
	isPageValid(): boolean {
		return this.page !== null && !this.page.isClosed() && !this.isClosing
	}

	/**
	 * Wait for VS Code to be ready
	 */
	async waitForVSCodeReady(page?: Page): Promise<void> {
		const targetPage = page || this.page
		if (!targetPage) {
			throw new Error("No page available")
		}

		console.log("Waiting for VS Code to be ready...")

		// Wait for VS Code workbench to load
		await targetPage.waitForSelector(".monaco-workbench", {
			timeout: 30000,
			state: "visible",
		})

		// Wait for activity bar
		await targetPage.waitForSelector(".activitybar", {
			timeout: 10000,
			state: "visible",
		})

		console.log("VS Code is ready")
	}

	/**
	 * Get test-specific storage path
	 */
	getStoragePath(): string {
		return `/tmp/vscode-test-${this.testId}`
	}

	/**
	 * Clean up test storage
	 */
	async cleanupStorage(): Promise<void> {
		const storagePath = this.getStoragePath()
		try {
			if (fs.existsSync(storagePath)) {
				fs.rmSync(storagePath, { recursive: true, force: true })
				console.log(`Cleaned up storage for test ${this.testId}`)
			}
		} catch (error) {
			console.warn(`Error cleaning up storage for test ${this.testId}:`, error)
		}
	}
}
