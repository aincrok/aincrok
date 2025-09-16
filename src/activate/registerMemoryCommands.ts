// aincrok_change - new file
import * as vscode from "vscode"
import { ClineProvider } from "../core/webview/ClineProvider"

export const registerMemoryCommands = (context: vscode.ExtensionContext) => {
	// Memory context management commands
	context.subscriptions.push(
		vscode.commands.registerCommand("aincrok.memory.switchContext", async () => {
			const visibleProvider = ClineProvider.getVisibleInstance()
			if (!visibleProvider) {
				vscode.window.showWarningMessage("No active Aincrok instance found")
				return
			}

			// Show quick pick to select memory context
			const contexts = await getAvailableContexts(visibleProvider)
			const selected = await vscode.window.showQuickPick(contexts, {
				placeHolder: "Select memory context to switch to",
			})

			if (selected) {
				await visibleProvider.switchMemoryContext(selected)
				vscode.window.showInformationMessage(`Switched to memory context: ${selected}`)
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("aincrok.memory.showCurrentContext", async () => {
			const visibleProvider = ClineProvider.getVisibleInstance()
			if (!visibleProvider) {
				vscode.window.showWarningMessage("No active Aincrok instance found")
				return
			}

			const currentContext = await visibleProvider.getCurrentMemoryContext()
			vscode.window.showInformationMessage(`Current memory context: ${currentContext || "Default"}`)
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("aincrok.memory.toggleContextSwitching", async () => {
			const visibleProvider = ClineProvider.getVisibleInstance()
			if (!visibleProvider) {
				vscode.window.showWarningMessage("No active Aincrok instance found")
				return
			}

			const isEnabled = await visibleProvider.toggleMemoryContextSwitching()
			vscode.window.showInformationMessage(`Memory context switching ${isEnabled ? "enabled" : "disabled"}`)
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("aincrok.memory.showContextInsights", async () => {
			const visibleProvider = ClineProvider.getVisibleInstance()
			if (!visibleProvider) {
				vscode.window.showWarningMessage("No active Aincrok instance found")
				return
			}

			// Navigate to memory dashboard
			visibleProvider.postMessageToWebview({
				type: "action",
				action: "memoryDashboardButtonClicked",
			})
			// The memory dashboard will automatically show insights view
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("aincrok.memory.cleanupContexts", async () => {
			const visibleProvider = ClineProvider.getVisibleInstance()
			if (!visibleProvider) {
				vscode.window.showWarningMessage("No active Aincrok instance found")
				return
			}

			const confirm = await vscode.window.showWarningMessage(
				"This will remove unused memory contexts. Continue?",
				"Yes",
				"No",
			)

			if (confirm === "Yes") {
				const cleaned = await visibleProvider.cleanupMemoryContexts()
				vscode.window.showInformationMessage(`Cleaned up ${cleaned} unused memory contexts`)
			}
		}),
	)
}

// Helper function to get available memory contexts
async function getAvailableContexts(provider: ClineProvider): Promise<string[]> {
	// This would interface with the memory provider to get available contexts
	// For now, return a placeholder list
	try {
		const contexts = await provider.getAvailableMemoryContexts()
		return contexts || ["Default", "Project", "Workspace"]
	} catch {
		return ["Default", "Project", "Workspace"]
	}
}
