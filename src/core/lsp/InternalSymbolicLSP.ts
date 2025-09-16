// aincrok_change - enhanced file
// Internal Symbolic LSP Layer for Aincrok VS Code Extension
// Enhanced semantic code understanding using VS Code's native Language Server Protocol APIs
// Replaces multilspy and Solid-LSP with TypeScript-native implementation

import * as vscode from "vscode"
import {
	SymbolicEntity,
	SymbolRelationship,
	CodeContext,
	SemanticContext,
	SymbolicEdit,
	EditResult,
	EditValidation,
	SymbolicEnhancement,
	SemanticPromptContext,
	LanguageServerConfig,
	CodeSnippet,
	TypeInformation,
	ImportInfo,
} from "./types"

/**
 * Internal Symbolic LSP Layer for Aincrok VS Code Extension
 *
 * This class provides semantic code understanding capabilities within the VS Code extension,
 * inspired by Serena's Solid-LSP approach but designed for internal use in Aincrok's AI workflows.
 *
 * Key features:
 * - Symbol-level code operations instead of text-based analysis
 * - Deterministic LSP operations for predictable behavior
 * - Integration with existing Aincrok tool system
 * - Graceful fallback to text-based operations when LSP is unavailable
 */
export class InternalSymbolicLSP {
	private static instance: InternalSymbolicLSP | undefined
	private isInitialized = false
	private supportedLanguages = new Set<string>()
	private symbolCache = new Map<string, SymbolicEntity[]>()
	private relationshipCache = new Map<string, SymbolRelationship[]>()

	// Language server configurations
	private languageServerConfigs: Record<string, LanguageServerConfig> = {}

	private constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Get or create the singleton instance
	 */
	static getInstance(context: vscode.ExtensionContext): InternalSymbolicLSP {
		if (!InternalSymbolicLSP.instance) {
			InternalSymbolicLSP.instance = new InternalSymbolicLSP(context)
		}
		return InternalSymbolicLSP.instance
	}

	/**
	 * Initialize the symbolic analysis system
	 */
	async initializeSymbolicAnalysis(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		// Initialize language server configurations
		await this.setupLanguageServers()

		// Set up supported languages
		this.supportedLanguages.add("typescript")
		this.supportedLanguages.add("javascript")
		this.supportedLanguages.add("python")
		this.supportedLanguages.add("rust")
		this.supportedLanguages.add("go")
		this.supportedLanguages.add("php")
		this.supportedLanguages.add("java")
		this.supportedLanguages.add("cpp")
		this.supportedLanguages.add("c")

		// Set up workspace change listeners for cache invalidation
		// These can throw errors that should be propagated
		vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this)
		vscode.workspace.onDidDeleteFiles(this.onFilesDeleted, this)
		vscode.workspace.onDidRenameFiles(this.onFilesRenamed, this)

		this.isInitialized = true
		console.log("[Aincrok] Internal Symbolic LSP initialized successfully")
	}

	/**
	 * Find symbols by name with semantic understanding
	 */
	async findSymbolByName(query: string, context?: CodeContext): Promise<SymbolicEntity[]> {
		if (!this.isInitialized) {
			await this.initializeSymbolicAnalysis()
		}

		const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
			"vscode.executeWorkspaceSymbolProvider",
			query,
		)

		if (!workspaceSymbols) {
			return []
		}

		const entities: SymbolicEntity[] = []
		for (const symbol of workspaceSymbols) {
			const entity = await this.convertToSymbolicEntity(symbol)
			if (entity && this.isRelevantSymbol(entity, context)) {
				entities.push(entity)
			}
		}

		// Cache the results
		const cacheKey = `findSymbolByName:${query}`
		this.symbolCache.set(cacheKey, entities)

		return entities
	}

	/**
	 * Get relationships for a symbol
	 */
	async getSymbolRelations(symbol: SymbolicEntity): Promise<SymbolRelationship[]> {
		const cacheKey = `relations:${symbol.id}`
		if (this.relationshipCache.has(cacheKey)) {
			return this.relationshipCache.get(cacheKey)!
		}

		try {
			const relationships: SymbolRelationship[] = []

			// Find references to this symbol
			const references = await this.findReferences(symbol)
			relationships.push(...references)

			// Find symbols this symbol calls or uses
			const usages = await this.findSymbolUsages(symbol)
			relationships.push(...usages)

			// Cache the results
			this.relationshipCache.set(cacheKey, relationships)

			return relationships
		} catch (error) {
			console.error("[Aincrok] Error getting symbol relations:", error)
			return []
		}
	}

	/**
	 * Retrieve semantic context for AI operations
	 */
	async retrieveSemanticContext(query: string, depth: number = 1): Promise<SemanticContext> {
		const symbols = await this.findSymbolByName(query)
		const relevantSymbols = symbols.slice(0, 10) // Limit to top 10 most relevant

		const relationships: SymbolRelationship[] = []
		const codeSnippets: CodeSnippet[] = []

		for (const symbol of relevantSymbols) {
			if (depth > 0) {
				const symbolRelations = await this.getSymbolRelations(symbol)
				relationships.push(...symbolRelations)
			}

			// Get code snippet for this symbol
			const snippet = await this.getSymbolCodeSnippet(symbol)
			if (snippet) {
				codeSnippets.push(snippet)
			}
		}

		return {
			relevantSymbols,
			relationships,
			codeSnippets,
			imports: await this.getRelevantImports(relevantSymbols),
		}
	}

	/**
	 * Edit symbol with precision
	 */
	async editSymbolPrecisely(symbol: SymbolicEntity, changes: SymbolicEdit): Promise<EditResult> {
		try {
			// Validate the edit first
			const validation = await this.validateSymbolicEditSafety(changes)
			if (!validation.safe) {
				return {
					success: false,
					modifiedFiles: [],
					appliedEdits: [],
					errors: validation.errors,
				}
			}

			const workspaceEdit = new vscode.WorkspaceEdit()

			switch (changes.type) {
				case "replace":
					if (changes.newContent) {
						workspaceEdit.replace(vscode.Uri.file(symbol.filePath), symbol.range, changes.newContent)
					}
					break

				case "insert":
					if (changes.newContent && changes.insertPosition) {
						workspaceEdit.insert(
							vscode.Uri.file(symbol.filePath),
							changes.insertPosition,
							changes.newContent,
						)
					}
					break

				case "delete":
					workspaceEdit.delete(vscode.Uri.file(symbol.filePath), symbol.range)
					break

				case "rename":
					if (changes.newName && changes.updateReferences) {
						// Use VS Code's rename functionality
						const renameResult = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
							"vscode.executeDocumentRenameProvider",
							vscode.Uri.file(symbol.filePath),
							symbol.selectionRange.start,
							changes.newName,
						)
						if (renameResult) {
							return {
								success: true,
								modifiedFiles: this.getModifiedFilesFromEdit(renameResult),
								appliedEdits: [renameResult],
							}
						}
					}
					break
			}

			const success = await vscode.workspace.applyEdit(workspaceEdit)
			return {
				success,
				modifiedFiles: success ? [symbol.filePath] : [],
				appliedEdits: success ? [workspaceEdit] : [],
				warnings: validation.warnings,
			}
		} catch (error) {
			console.error("[Aincrok] Error editing symbol:", error)
			return {
				success: false,
				modifiedFiles: [],
				appliedEdits: [],
				errors: [error instanceof Error ? error.message : String(error)],
			}
		}
	}

	/**
	 * Enhance existing Aincrok tool with semantic capabilities
	 */
	enhanceExistingTool(toolName: string, symbolicCapabilities: SymbolicEnhancement): void {
		// This method would integrate with Aincrok's existing tool system
		// For now, we'll register the enhancement configuration
		console.log(`[Aincrok] Enhanced tool ${toolName} with semantic capabilities:`, symbolicCapabilities)
	}

	/**
	 * Get semantic context for prompt enhancement
	 */
	async getSemanticContextForPrompt(userRequest: string): Promise<SemanticPromptContext> {
		const semanticContext = await this.retrieveSemanticContext(userRequest, 2)

		// Build enhanced prompt with semantic information
		let enhancedPrompt = userRequest

		if (semanticContext.relevantSymbols.length > 0) {
			enhancedPrompt += "\n\nRelevant code symbols:"
			for (const symbol of semanticContext.relevantSymbols.slice(0, 5)) {
				enhancedPrompt += `\n- ${symbol.name} (${vscode.SymbolKind[symbol.kind]}) in ${symbol.filePath}`
				if (symbol.detail) {
					enhancedPrompt += `: ${symbol.detail}`
				}
			}
		}

		if (semanticContext.codeSnippets.length > 0) {
			enhancedPrompt += "\n\nRelevant code context:"
			for (const snippet of semanticContext.codeSnippets.slice(0, 3)) {
				enhancedPrompt += `\n\nFrom ${snippet.filePath}:\n\`\`\`${snippet.language}\n${snippet.content}\n\`\`\``
			}
		}

		// Calculate token optimization (simplified)
		const beforeTokens = this.estimateTokenCount(userRequest)
		const afterTokens = this.estimateTokenCount(enhancedPrompt)

		return {
			userRequest,
			semanticContext,
			enhancedPrompt,
			tokenOptimization: {
				before: beforeTokens,
				after: afterTokens,
				reduction: beforeTokens > afterTokens ? ((beforeTokens - afterTokens) / beforeTokens) * 100 : 0,
			},
		}
	}

	/**
	 * Validate if a symbolic edit is safe to perform
	 */
	async validateSymbolicEditSafety(edit: SymbolicEdit): Promise<EditValidation> {
		const warnings: string[] = []
		const errors: string[] = []

		try {
			// Check if the target file is writable
			const document = await vscode.workspace.openTextDocument(edit.symbol.filePath)
			if (document.isUntitled || document.uri.scheme === "untitled") {
				errors.push("Cannot edit untitled documents")
			}

			// Check if the symbol still exists at the expected location
			const currentText = document.getText(edit.symbol.range)
			if (!currentText.includes(edit.symbol.name)) {
				warnings.push("Symbol may have been modified since analysis")
			}

			// Validate the new content for basic syntax if it's a replacement
			if (edit.type === "replace" && edit.newContent) {
				// Basic syntax validation could be added here
				// For now, we'll just check it's not empty
				if (edit.newContent.trim().length === 0) {
					warnings.push("Replacement content is empty")
				}
			}

			// Check for references when deleting
			if (edit.type === "delete") {
				try {
					const references = await vscode.commands.executeCommand<vscode.Location[]>(
						"vscode.executeReferenceProvider",
						vscode.Uri.file(edit.symbol.filePath),
						edit.symbol.selectionRange.start,
					)

					if (references && references.length > 0) {
						warnings.push(`Symbol has ${references.length} references - deletion may break code`)
					}
				} catch (error) {
					// Ignore reference check errors - they're not critical for validation
				}
			}

			return {
				safe: errors.length === 0,
				warnings,
				errors,
			}
		} catch (error) {
			errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`)
			return {
				safe: false,
				warnings,
				errors,
			}
		}
	}

	// Private helper methods

	private async setupLanguageServers(): Promise<void> {
		// aincrok_change - Use VS Code's built-in language services instead of spawning servers
		// VS Code already has language servers for most common languages
		this.languageServerConfigs = {
			typescript: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			python: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			javascript: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			rust: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			go: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			php: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			java: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
			cpp: {
				enabled: true,
				initializationOptions: {},
			} as LanguageServerConfig,
		}
	}

	private async convertToSymbolicEntity(symbol: vscode.SymbolInformation): Promise<SymbolicEntity | null> {
		try {
			return {
				id: `${symbol.location.uri.fsPath}:${symbol.location.range.start.line}:${symbol.location.range.start.character}`,
				name: symbol.name,
				kind: symbol.kind,
				filePath: symbol.location.uri.fsPath,
				range: symbol.location.range,
				selectionRange: symbol.location.range,
				detail: symbol.containerName,
			}
		} catch (error) {
			console.error("[Aincrok] Error converting symbol to entity:", error)
			return null
		}
	}

	private isRelevantSymbol(entity: SymbolicEntity, context?: CodeContext): boolean {
		// Simple relevance check - can be enhanced with more sophisticated logic
		if (!context) return true

		if (context.language && entity.filePath) {
			const fileExtension = entity.filePath.split(".").pop()?.toLowerCase()
			const languageExtensions: Record<string, string[]> = {
				typescript: ["ts", "tsx"],
				javascript: ["js", "jsx"],
				python: ["py"],
				rust: ["rs"],
				go: ["go"],
			}

			const expectedExtensions = languageExtensions[context.language]
			if (expectedExtensions && fileExtension && !expectedExtensions.includes(fileExtension)) {
				return false
			}
		}

		return true
	}

	private async findReferences(symbol: SymbolicEntity): Promise<SymbolRelationship[]> {
		try {
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				"vscode.executeReferenceProvider",
				vscode.Uri.file(symbol.filePath),
				symbol.selectionRange.start,
			)

			if (!references) return []

			return references.map((ref) => ({
				type: "references" as const,
				from: symbol,
				to: symbol, // Self-reference for now
				location: ref,
			}))
		} catch (error) {
			console.error("[Aincrok] Error finding references:", error)
			return []
		}
	}

	private async findSymbolUsages(symbol: SymbolicEntity): Promise<SymbolRelationship[]> {
		// This would analyze what symbols this symbol uses/calls
		// For now, return empty array - could be enhanced with AST analysis
		return []
	}

	private async getSymbolCodeSnippet(symbol: SymbolicEntity): Promise<CodeSnippet | null> {
		try {
			const document = await vscode.workspace.openTextDocument(symbol.filePath)
			const content = document.getText(symbol.range)

			return {
				content,
				filePath: symbol.filePath,
				range: symbol.range,
				language: document.languageId,
				symbols: [symbol],
				relevance: 1.0,
			}
		} catch (error) {
			console.error("[Aincrok] Error getting symbol code snippet:", error)
			return null
		}
	}

	private async getRelevantImports(symbols: SymbolicEntity[]): Promise<ImportInfo[]> {
		// This would analyze imports related to the symbols
		// For now, return empty array - could be enhanced with import analysis
		return []
	}

	private getModifiedFilesFromEdit(edit: vscode.WorkspaceEdit): string[] {
		const files: string[] = []
		edit.entries().forEach(([uri]) => {
			files.push(uri.fsPath)
		})
		return files
	}

	private estimateTokenCount(text: string): number {
		// Simplified token estimation - roughly 4 characters per token
		return Math.ceil(text.length / 4)
	}

	private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
		// Invalidate caches for the changed document
		const filePath = event.document.uri.fsPath
		for (const [key] of this.symbolCache) {
			if (key.includes(filePath)) {
				this.symbolCache.delete(key)
			}
		}
		for (const [key] of this.relationshipCache) {
			if (key.includes(filePath)) {
				this.relationshipCache.delete(key)
			}
		}
	}

	private onFilesDeleted(event: vscode.FileDeleteEvent): void {
		// Clear caches for deleted files
		for (const file of event.files) {
			const filePath = file.fsPath
			for (const [key] of this.symbolCache) {
				if (key.includes(filePath)) {
					this.symbolCache.delete(key)
				}
			}
			for (const [key] of this.relationshipCache) {
				if (key.includes(filePath)) {
					this.relationshipCache.delete(key)
				}
			}
		}
	}

	private onFilesRenamed(event: vscode.FileRenameEvent): void {
		// Update caches for renamed files
		for (const file of event.files) {
			const oldPath = file.oldUri.fsPath
			const newPath = file.newUri.fsPath

			// Update symbol cache
			for (const [key, value] of this.symbolCache) {
				if (key.includes(oldPath)) {
					this.symbolCache.delete(key)
					const newKey = key.replace(oldPath, newPath)
					const updatedValue = value.map((symbol) => ({
						...symbol,
						filePath: symbol.filePath.replace(oldPath, newPath),
					}))
					this.symbolCache.set(newKey, updatedValue)
				}
			}

			// Update relationship cache
			for (const [key, value] of this.relationshipCache) {
				if (key.includes(oldPath)) {
					this.relationshipCache.delete(key)
					const newKey = key.replace(oldPath, newPath)
					const updatedValue = value.map((rel) => ({
						...rel,
						from: { ...rel.from, filePath: rel.from.filePath.replace(oldPath, newPath) },
						to: { ...rel.to, filePath: rel.to.filePath.replace(oldPath, newPath) },
					}))
					this.relationshipCache.set(newKey, updatedValue)
				}
			}
		}
	}

	/**
	 * Analyze file semantics - compatibility method for tests
	 */
	async analyzeFileSemantics(filePath: string, options?: any): Promise<any> {
		try {
			const fileUri = vscode.Uri.file(filePath)
			const document = await vscode.workspace.openTextDocument(fileUri)

			const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				"vscode.executeDocumentSymbolProvider",
				fileUri,
			)

			if (!documentSymbols || documentSymbols.length === 0) {
				return null
			}

			const symbols: SymbolicEntity[] = []
			for (const docSymbol of documentSymbols) {
				const entity = await this.convertToSymbolicEntity({
					name: docSymbol.name,
					kind: docSymbol.kind,
					location: {
						uri: fileUri,
						range: docSymbol.range,
					},
					containerName: "",
				})
				if (entity) {
					symbols.push(entity)
				}
			}

			return {
				symbols,
				language: document.languageId,
				filePath,
			}
		} catch (error) {
			console.error("[Aincrok] analyzeFileSemantics error:", error)
			return null
		}
	}

	/**
	 * Search workspace symbols - compatibility method for tests
	 */
	async searchWorkspaceSymbols(query: string, options?: any): Promise<SymbolicEntity[]> {
		try {
			const symbolInfo = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
				"vscode.executeWorkspaceSymbolProvider",
				query,
			)

			if (!symbolInfo || symbolInfo.length === 0) {
				return []
			}

			const symbols: SymbolicEntity[] = []
			for (const info of symbolInfo) {
				const entity = await this.convertToSymbolicEntity(info)
				if (entity) {
					symbols.push(entity)
				}
			}

			return symbols
		} catch (error) {
			console.error("[Aincrok] searchWorkspaceSymbols error:", error)
			return []
		}
	}

	/**
	 * Get document symbols for a specific file using VS Code's native LSP
	 */
	async getDocumentSymbols(uri: vscode.Uri): Promise<vscode.DocumentSymbol[]> {
		try {
			const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				"vscode.executeDocumentSymbolProvider",
				uri,
			)

			return documentSymbols || []
		} catch (error) {
			console.error("[Aincrok] getDocumentSymbols error:", error)
			return []
		}
	}

	/**
	 * Get symbol definitions using VS Code's definition provider
	 */
	async getSymbolDefinitions(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location[]> {
		try {
			const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
				"vscode.executeDefinitionProvider",
				uri,
				position,
			)

			return definitions || []
		} catch (error) {
			console.error("[Aincrok] getSymbolDefinitions error:", error)
			return []
		}
	}

	/**
	 * Get symbol references using VS Code's reference provider
	 */
	async getSymbolReferences(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location[]> {
		try {
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				"vscode.executeReferenceProvider",
				uri,
				position,
			)

			return references || []
		} catch (error) {
			console.error("[Aincrok] getSymbolReferences error:", error)
			return []
		}
	}

	/**
	 * Get hover information for a symbol using VS Code's hover provider
	 */
	async getSymbolHover(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Hover | null> {
		try {
			const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
				"vscode.executeHoverProvider",
				uri,
				position,
			)

			return hover && hover.length > 0 ? hover[0] : null
		} catch (error) {
			console.error("[Aincrok] getSymbolHover error:", error)
			return null
		}
	}

	/**
	 * Get completion items at a position using VS Code's completion provider
	 */
	async getCompletionItems(uri: vscode.Uri, position: vscode.Position): Promise<vscode.CompletionList | null> {
		try {
			const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
				"vscode.executeCompletionItemProvider",
				uri,
				position,
			)

			return completions || null
		} catch (error) {
			console.error("[Aincrok] getCompletionItems error:", error)
			return null
		}
	}

	/**
	 * Get signature help for a position using VS Code's signature help provider
	 */
	async getSignatureHelp(uri: vscode.Uri, position: vscode.Position): Promise<vscode.SignatureHelp | null> {
		try {
			const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
				"vscode.executeSignatureHelpProvider",
				uri,
				position,
			)

			return signatureHelp || null
		} catch (error) {
			console.error("[Aincrok] getSignatureHelp error:", error)
			return null
		}
	}

	/**
	 * Enhanced tool integration methods for Aincrok's existing tools
	 */
	async enhanceReadFileTool(semanticCapabilities: boolean): Promise<void> {
		if (semanticCapabilities && this.isInitialized) {
			console.log("[Aincrok] Enhanced readFileTool with semantic understanding enabled")
			// This would integrate with existing tools/readFileTool.ts
			// Implementation would be added when integrating with tool system
		}
	}

	async enhanceSearchFilesTool(semanticCapabilities: boolean): Promise<void> {
		if (semanticCapabilities && this.isInitialized) {
			console.log("[Aincrok] Enhanced searchFilesTool with semantic understanding enabled")
			// This would integrate with existing tools/searchFilesTool.ts
			// Implementation would be added when integrating with tool system
		}
	}

	/**
	 * Get enhanced semantic context optimized for AI prompts
	 */
	async getSemanticContextForAI(userRequest: string, maxTokens: number = 4000): Promise<string> {
		try {
			const semanticContext = await this.retrieveSemanticContext(userRequest, 2)

			// Build optimized context string for AI
			let contextString = ""

			if (semanticContext.relevantSymbols.length > 0) {
				contextString += "Relevant symbols:\n"
				for (const symbol of semanticContext.relevantSymbols.slice(0, 5)) {
					contextString += `- ${symbol.name} (${vscode.SymbolKind[symbol.kind]}) in ${symbol.filePath}\n`
				}
				contextString += "\n"
			}

			if (semanticContext.codeSnippets.length > 0) {
				contextString += "Relevant code:\n"
				for (const snippet of semanticContext.codeSnippets.slice(0, 3)) {
					// Truncate snippets to fit within token limit
					const truncatedContent =
						snippet.content.length > 200 ? snippet.content.substring(0, 200) + "..." : snippet.content

					contextString += `\nFrom ${snippet.filePath}:\n\`\`\`${snippet.language}\n${truncatedContent}\n\`\`\`\n`
				}
			}

			// Ensure we don't exceed token limit (rough estimation)
			if (this.estimateTokenCount(contextString) > maxTokens) {
				// Truncate to approximately fit within limit
				const targetLength = Math.floor(maxTokens * 3.5) // Rough char to token ratio
				contextString = contextString.substring(0, targetLength) + "..."
			}

			return contextString
		} catch (error) {
			console.error("[Aincrok] getSemanticContextForAI error:", error)
			return "" // Return empty string on error
		}
	}
}
