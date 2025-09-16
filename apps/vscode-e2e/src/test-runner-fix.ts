import * as path from "path"
import { runTests } from "@vscode/test-electron"

async function main() {
	try {
		// Use absolute paths
		const extensionDevelopmentPath = path.resolve(__dirname, "../../../src")
		const extensionTestsPath = path.resolve(__dirname, "./suite/index")

		console.log("Extension path:", extensionDevelopmentPath)
		console.log("Tests path:", extensionTestsPath)

		// Check if paths exist
		const fs = require("fs")
		if (!fs.existsSync(extensionDevelopmentPath)) {
			throw new Error(`Extension path does not exist: ${extensionDevelopmentPath}`)
		}

		const packageJsonPath = path.join(extensionDevelopmentPath, "package.json")
		if (!fs.existsSync(packageJsonPath)) {
			throw new Error(`Package.json not found at: ${packageJsonPath}`)
		}

		// Read package.json to verify extension ID
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
		console.log(`Extension ID: ${packageJson.publisher}.${packageJson.name}`)

		// Run with minimal configuration
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				"--disable-extensions", // Disable other extensions
				"--skip-welcome",
				"--skip-release-notes",
				"--disable-telemetry",
				"--disable-updates",
				"--disable-workspace-trust",
			],
		})
	} catch (error) {
		console.error("Test runner failed:", error)
		process.exit(1)
	}
}

main()
