// Verify that settings save functionality works correctly
const fs = require("fs")
const path = require("path")

// Read the SettingsView.tsx file
const settingsViewPath = path.join(__dirname, "webview-ui/src/components/settings/SettingsView.tsx")
const content = fs.readFileSync(settingsViewPath, "utf8")

// Check that we're always sending the current apiConfiguration
const hasCorrectApiConfigSave = content.includes(
	'vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })',
)

// Check that we're not conditionally sending different apiConfiguration
const hasConditionalBug = content.includes("providersTabActive ? apiConfiguration : extensionState.apiConfiguration")

// Check that cipher fields are being sent
const hasCipherFields =
	content.includes('type: "cipherMode"') &&
	content.includes('type: "cipherLlmProvider"') &&
	content.includes('type: "cipherEmbeddingProvider"')

console.log("Settings Save Fix Verification:")
console.log("================================")
console.log("✓ Always sends current apiConfiguration:", hasCorrectApiConfigSave)
console.log("✓ No conditional apiConfiguration bug:", !hasConditionalBug)
console.log("✓ Sends cipher/memory fields:", hasCipherFields)
console.log("")

if (hasCorrectApiConfigSave && !hasConditionalBug && hasCipherFields) {
	console.log("✅ Settings save fix is correctly applied!")
	process.exit(0)
} else {
	console.log("❌ Settings save fix may not be complete")
	process.exit(1)
}
