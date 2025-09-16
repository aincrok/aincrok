import * as assert from "assert"
import * as vscode from "vscode"

suite("Basic Test Suite", () => {
	test("VS Code should start", () => {
		console.log("VS Code started successfully")
		console.log("Version:", vscode.version)
		assert.ok(vscode.version, "VS Code version should be available")
	})

	test("List all extensions", () => {
		const allExtensions = vscode.extensions.all.map((ext) => ext.id)
		console.log("All available extensions:", allExtensions.join(", "))

		const aincrokExtension = allExtensions.find((id) => id.includes("aincrok"))
		console.log("Aincrok extension found:", aincrokExtension)

		assert.ok(aincrokExtension, "Aincrok extension should be available")
	})
})
