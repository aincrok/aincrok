// aincrok_change - new file
import * as vscode from "vscode"

/**
 * Wrapper for VS Code's built-in language services
 * Instead of spawning external language servers, we use VS Code's existing language features
 */
export class VSCodeLanguageService {
	/**
	 * Get document symbols using VS Code's built-in language services
	 */
	static async getDocumentSymbols(uri: vscode.Uri): Promise<vscode.DocumentSymbol[] | undefined> {
		try {
			const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				"vscode.executeDocumentSymbolProvider",
				uri,
			)
			return symbols
		} catch (error) {
			console.error(`[Aincrok] Failed to get document symbols for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get definitions for a position in a document
	 */
	static async getDefinitions(
		uri: vscode.Uri,
		position: vscode.Position,
	): Promise<vscode.Location | vscode.Location[] | vscode.LocationLink[] | undefined> {
		try {
			const definitions = await vscode.commands.executeCommand<
				vscode.Location | vscode.Location[] | vscode.LocationLink[]
			>("vscode.executeDefinitionProvider", uri, position)
			return definitions
		} catch (error) {
			console.error(`[Aincrok] Failed to get definitions for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get references for a position in a document
	 */
	static async getReferences(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location[] | undefined> {
		try {
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				"vscode.executeReferenceProvider",
				uri,
				position,
			)
			return references
		} catch (error) {
			console.error(`[Aincrok] Failed to get references for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get hover information for a position in a document
	 */
	static async getHover(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Hover[] | undefined> {
		try {
			const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
				"vscode.executeHoverProvider",
				uri,
				position,
			)
			return hovers
		} catch (error) {
			console.error(`[Aincrok] Failed to get hover for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get completions for a position in a document
	 */
	static async getCompletions(
		uri: vscode.Uri,
		position: vscode.Position,
	): Promise<vscode.CompletionList | undefined> {
		try {
			const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
				"vscode.executeCompletionItemProvider",
				uri,
				position,
			)
			return completions
		} catch (error) {
			console.error(`[Aincrok] Failed to get completions for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get workspace symbols matching a query
	 */
	static async getWorkspaceSymbols(query: string): Promise<vscode.SymbolInformation[] | undefined> {
		try {
			const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
				"vscode.executeWorkspaceSymbolProvider",
				query,
			)
			return symbols
		} catch (error) {
			console.error(`[Aincrok] Failed to get workspace symbols for query "${query}":`, error)
			return undefined
		}
	}

	/**
	 * Format a document
	 */
	static async formatDocument(uri: vscode.Uri): Promise<vscode.TextEdit[] | undefined> {
		try {
			const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
				"vscode.executeFormatDocumentProvider",
				uri,
			)
			return edits
		} catch (error) {
			console.error(`[Aincrok] Failed to format document ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Get code actions for a range in a document
	 */
	static async getCodeActions(
		uri: vscode.Uri,
		range: vscode.Range | vscode.Selection,
	): Promise<vscode.CodeAction[] | undefined> {
		try {
			const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
				"vscode.executeCodeActionProvider",
				uri,
				range,
			)
			return actions
		} catch (error) {
			console.error(`[Aincrok] Failed to get code actions for ${uri.fsPath}:`, error)
			return undefined
		}
	}

	/**
	 * Check if language services are available for a document
	 */
	static async isLanguageServiceAvailable(uri: vscode.Uri): Promise<boolean> {
		try {
			// Try to get document symbols as a test
			const symbols = await this.getDocumentSymbols(uri)
			return symbols !== undefined
		} catch {
			return false
		}
	}
}
