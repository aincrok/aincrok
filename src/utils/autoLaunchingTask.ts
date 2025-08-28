import * as vscode from "vscode"

/**
 * Checks for a file in .aincrok/launchPrompt.md and runs it immediately if it exists.
 */
export async function checkAndRunAutoLaunchingTask(context: vscode.ExtensionContext): Promise<void> {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return
	}

	const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri
	const promptFilePath = vscode.Uri.joinPath(workspaceFolderUri, ".aincrok", "launchPrompt.md")

	try {
		const fileContent = await vscode.workspace.fs.readFile(promptFilePath)
		const prompt = Buffer.from(fileContent).toString("utf8")
		console.log(`🚀 Auto-launching task from '${promptFilePath}' with content:\n${prompt}`)

		await new Promise((resolve) => setTimeout(resolve, 500))
		await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")

		vscode.commands.executeCommand("aincrok.newTask", { prompt })
	} catch (error) {
		if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") {
			return // File not found, which is expected if no launchPrompt.md exists
		}
		console.error(`Error running .aincrok/launchPrompt.md: ${error}`)
	}
}
