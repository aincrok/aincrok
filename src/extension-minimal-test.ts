import * as vscode from "vscode"

console.log("[DEBUG] Extension file loading...")

// Minimal extension just to test basic loading
export async function activate(context: vscode.ExtensionContext) {
	console.log("[DEBUG] Minimal extension activation starting...")
	const outputChannel = vscode.window.createOutputChannel("Aincrok")
	context.subscriptions.push(outputChannel)
	outputChannel.appendLine("Minimal Aincrok extension activated!")
	outputChannel.show()
	console.log("[DEBUG] Minimal extension activation completed!")
	return { isReady: () => true }
}

export function deactivate() {
	console.log("[DEBUG] Extension deactivated")
}
