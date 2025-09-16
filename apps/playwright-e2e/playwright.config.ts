// kilocode_change - new file
import { defineConfig } from "@playwright/test"
import { TestOptions } from "./tests/playwright-base-test"
import * as dotenv from "dotenv"
import * as path from "path"
import { fileURLToPath } from "url"

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, ".env")
dotenv.config({ path: envPath })

export default defineConfig<void, TestOptions>({
	timeout: 300_000, // 5 minutes for VS Code extension tests
	expect: { timeout: 60_000 }, // 1 minute for assertions
	reporter: process.env.CI ? "html" : [["list", { printSteps: false }]], // aincrok_change - reduce verbosity
	workers: 1,
	retries: process.env.CI ? 2 : 0, // Retry in CI, never locally
	globalSetup: "./playwright.globalSetup",
	testDir: "./tests",
	testIgnore: "**/helpers/__tests__/**",
	outputDir: "./test-results",
	projects: [
		// { name: "VSCode insiders", use: { vscodeVersion: "insiders" } },
		{ name: "VSCode stable", use: { vscodeVersion: "stable" } },
	],
	use: {
		trace: process.env.CI ? "on-first-retry" : "off", // aincrok_change - disable trace locally
		video: process.env.CI ? "retry-with-video" : "off", // aincrok_change - disable video locally
		screenshot: "only-on-failure", // aincrok_change - only capture screenshots on failure
	},
})
