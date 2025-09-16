import * as path from "path"
import { runTests } from "@vscode/test-electron"

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, "../../../src")
		const extensionTestsPath = path.resolve(__dirname, "./suite/minimal")

		console.log("Running minimal test without extension activation...")
		console.log("Extension path:", extensionDevelopmentPath)
		console.log("Tests path:", extensionTestsPath)

		// Run with minimal launch args - don't disable extensions to see if extension loads
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ["--disable-gpu", "--no-sandbox"],
		})
	} catch (error) {
		console.error("Failed to run minimal tests", error)
		process.exit(1)
	}
}

main()
