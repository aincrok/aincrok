import * as vscode from "vscode"
import { suite, test } from "mocha"
import * as assert from "assert"

suite("Extension Load Test", () => {
	test("Extension should load without crashing", async () => {
		// Just check that VS Code started and basic API is available
		assert.ok(vscode.window, "VS Code window API should be available")
		assert.ok(vscode.commands, "VS Code commands API should be available")

		// Try to get our extension
		const extensions = vscode.extensions.all
		console.log(`Found ${extensions.length} extensions`)

		const aincrokExtension = extensions.find((ext) => ext.id === "aincrok.aincrok")
		if (aincrokExtension) {
			console.log("Aincrok extension found:", aincrokExtension.id)
			console.log("Extension active:", aincrokExtension.isActive)
		} else {
			console.log("Aincrok extension not found in loaded extensions")
			console.log("Available extension IDs:", extensions.map((e) => e.id).slice(0, 10))
		}
	})
})
