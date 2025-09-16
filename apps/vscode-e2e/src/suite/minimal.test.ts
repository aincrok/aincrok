import * as assert from "assert"
import * as vscode from "vscode"

suite("Minimal Test Suite", () => {
	test("Extension should be activated", async () => {
		console.log("Running minimal extension test...")

		// Check if extension exists
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Extension aincrok.aincrok should be found")
		console.log("Extension found:", extension?.id)

		// Try to activate extension
		try {
			await extension.activate()
			console.log("Extension activated successfully")
			assert.ok(extension.isActive, "Extension should be active")
		} catch (error) {
			console.error("Extension activation failed:", error)
			throw error
		}
	})
})
