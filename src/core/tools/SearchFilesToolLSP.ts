// aincrok_change - new file
import { searchFilesTool } from "./searchFilesTool"
import type { Task } from "../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { InternalSymbolicLSP } from "../lsp/InternalSymbolicLSP"
import { SymbolicEntity } from "../lsp/types"
import * as vscode from "vscode"

/**
 * Language detection result
 */
interface LanguageInfo {
	language: string
	confidence: number
	isSupported: boolean
}

/**
 * Semantic search result with LSP context
 */
interface SemanticSearchResult {
	filePath: string
	matches: SearchMatch[]
	symbols: vscode.DocumentSymbol[]
}

/**
 * Individual search match with semantic context
 */
interface SearchMatch {
	line: number
	column: number
	content: string
	symbolContext: string[]
	relevanceScore: number
}

/**
 * LSP version of searchFilesTool with semantic search capabilities
 * Provides symbol-aware search with context understanding
 */
export class SearchFilesToolLSP {
	private stats = {
		totalSearches: 0,
		lspSearches: 0,
		fallbackSearches: 0,
		averageLspTime: 0,
		averageResultQuality: 0,
		errors: 0,
	}

	constructor() {
		// LSP search files tool - standalone implementation
	}

	/**
	 * Check if LSP search enhancement is enabled
	 */
	private isLSPEnabled(): boolean {
		const config = vscode.workspace.getConfiguration("aincrok.toolEnhancement")
		return config.get<boolean>("enableLSPEnhancements", true)
	}

	/**
	 * Check if fallback to text mode is enabled
	 */
	private shouldFallbackToTextMode(): boolean {
		const config = vscode.workspace.getConfiguration("aincrok.toolEnhancement")
		return config.get<boolean>("fallbackToTextMode", true)
	}

	/**
	 * Check if LSP is available for search enhancement
	 */
	private async isLSPAvailable(): Promise<boolean> {
		if (!this.isLSPEnabled()) {
			return false
		}

		try {
			const symbolicLSP = InternalSymbolicLSP.getInstance(null as unknown as vscode.ExtensionContext)

			// Test if LSP is ready
			try {
				await symbolicLSP.searchWorkspaceSymbols("test")
				return true
			} catch (error) {
				return false
			}
		} catch (error) {
			console.warn("[Aincrok] Error checking LSP availability for search:", error)
			return false
		}
	}

	/**
	 * Get search statistics
	 */
	public getStats() {
		return { ...this.stats }
	}

	/**
	 * Update timing statistics
	 */
	private updateTimingStats(executionTime: number): void {
		if (this.stats.lspSearches === 1) {
			this.stats.averageLspTime = executionTime
		} else {
			const n = this.stats.lspSearches
			this.stats.averageLspTime = (this.stats.averageLspTime * (n - 1) + executionTime) / n
		}
	}

	/**
	 * Execute method that integrates LSP capabilities with original searchFilesTool
	 */
	async execute(
		task: Task,
		block: ToolUse,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): Promise<void> {
		const startTime = Date.now()
		this.stats.totalSearches++

		try {
			// Extract search parameters
			const relDirPath = block.params.path
			const regex = block.params.regex
			const filePattern = block.params.file_pattern

			if (!relDirPath || !regex) {
				// Missing required params, delegate to original tool
				this.stats.fallbackSearches++
				return await searchFilesTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Check if LSP search enhancement is available
			if (!(await this.isLSPAvailable()) || !this.isLSPEnabled()) {
				this.stats.fallbackSearches++
				return await searchFilesTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Create LSP-aware pushToolResult that adds semantic context
			const lspPushToolResult: PushToolResult = async (content: string | unknown[]) => {
				try {
					const enhancedContent = await this.addSemanticSearchContext(content, relDirPath, regex, filePattern)

					// Track LSP metrics
					this.stats.lspSearches++
					const executionTime = Date.now() - startTime
					this.updateTimingStats(executionTime)

					await pushToolResult(enhancedContent as string)
				} catch (error) {
					console.warn("[Aincrok] LSP search enhancement failed, using original content:", error)
					this.stats.errors++
					await pushToolResult(content as string)
				}
			}

			// Execute original tool with LSP result handler
			await searchFilesTool(task, block, askApproval, handleError, lspPushToolResult, removeClosingTag)
		} catch (error) {
			this.stats.errors++

			// Handle fallback based on configuration
			if (this.shouldFallbackToTextMode()) {
				console.warn("[Aincrok] LSP search failed, falling back:", error)
				vscode.window.showErrorMessage(
					`LSP search enhancement failed, falling back: ${error instanceof Error ? error.message : String(error)}`,
				)
				this.stats.fallbackSearches++
				return await searchFilesTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			} else {
				throw error
			}
		}
	}

	/**
	 * Add semantic search context to the tool result
	 */
	private async addSemanticSearchContext(
		content: string | unknown[],
		relDirPath: string,
		regex: string,
		filePattern: string | undefined,
	): Promise<string | unknown[]> {
		if (typeof content !== "string") {
			return content // Can't enhance non-string content
		}

		try {
			const symbolicLSP = InternalSymbolicLSP.getInstance(null as unknown as vscode.ExtensionContext)

			// Check if LSP is ready
			try {
				await symbolicLSP.searchWorkspaceSymbols("test")
			} catch (error) {
				return content
			}

			// Perform semantic search to complement the text-based search
			const semanticResults = await this.performSemanticSearch(symbolicLSP, regex, relDirPath, filePattern)

			// Add semantic context to the search results
			const semanticContext = this.generateSemanticContext(semanticResults)

			// Append context to the original content
			const lspContext = `\n\nSemantic Search Context:\n${semanticContext}`

			return content + lspContext
		} catch (error) {
			console.warn("[Aincrok] Failed to add semantic search context:", error)
			return content
		}
	}

	/**
	 * Perform semantic search using LSP symbols
	 */
	private async performSemanticSearch(
		symbolicLSP: InternalSymbolicLSP,
		regex: string,
		relDirPath: string,
		filePattern: string | undefined,
	): Promise<SemanticSearchResult[]> {
		const results: SemanticSearchResult[] = []

		try {
			// Search for workspace symbols that might match the pattern
			const workspaceSymbols = await symbolicLSP.searchWorkspaceSymbols(regex)

			// Group symbols by file
			const symbolsByFile = new Map<string, SymbolicEntity[]>()

			for (const symbol of workspaceSymbols) {
				const filePath = symbol.filePath || ""
				if (filePath) {
					if (!symbolsByFile.has(filePath)) {
						symbolsByFile.set(filePath, [])
					}
					symbolsByFile.get(filePath)!.push(symbol)
				}
			}

			// Process each file with matching symbols
			for (const [filePath, symbols] of symbolsByFile) {
				try {
					// Get document symbols for more detailed information
					const documentSymbols = (await symbolicLSP.getDocumentSymbols(vscode.Uri.file(filePath))) || []

					// Create search matches for each symbol
					const matches: SearchMatch[] = symbols.map((symbol) => ({
						line: symbol.range.start.line + 1,
						column: symbol.range.start.character + 1,
						content: `Symbol: ${symbol.name} (${vscode.SymbolKind[symbol.kind] || "unknown"})`,
						symbolContext: this.getSymbolContextFromEntity(symbol, documentSymbols),
						relevanceScore: this.calculateEntityRelevance(symbol, regex),
					}))

					results.push({
						filePath,
						matches,
						symbols: documentSymbols,
					})
				} catch (error) {
					console.warn(`[Aincrok] Failed to process file ${filePath}:`, error)
				}
			}
		} catch (error) {
			console.warn("[Aincrok] Workspace symbol search failed:", error)
		}

		return results
	}

	/**
	 * Generate semantic context information
	 */
	private generateSemanticContext(results: SemanticSearchResult[]): string {
		const contextLines: string[] = []

		if (results.length === 0) {
			contextLines.push("No semantic symbols found matching the search pattern")
			return contextLines.join("\n")
		}

		contextLines.push(`Found ${results.length} files with semantic matches:`)

		for (const result of results) {
			contextLines.push(`\nFile: ${result.filePath}`)
			contextLines.push(`  Symbols found: ${result.matches.length}`)

			// Show top matches by relevance
			const topMatches = result.matches.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)

			for (const match of topMatches) {
				contextLines.push(`  - Line ${match.line}: ${match.content}`)
				if (match.symbolContext.length > 0) {
					contextLines.push(`    Context: ${match.symbolContext.join(" → ")}`)
				}
			}
		}

		contextLines.push("\nSemantic search completed - Results include symbol-level matches")

		return contextLines.join("\n")
	}

	/**
	 * Get symbol context hierarchy from SymbolicEntity
	 */
	private getSymbolContextFromEntity(symbol: SymbolicEntity, documentSymbols: vscode.DocumentSymbol[]): string[] {
		const context: string[] = []

		// Use the SymbolicEntity's hierarchy information if available
		if (symbol.parent) {
			context.push(symbol.parent.name)
		}
		context.push(symbol.name)

		return context
	}

	/**
	 * Calculate SymbolicEntity relevance score for search
	 */
	private calculateEntityRelevance(symbol: SymbolicEntity, regex: string): number {
		let score = 0

		// Exact name match
		if (symbol.name.toLowerCase() === regex.toLowerCase()) {
			score += 10
		}

		// Name contains search term
		if (symbol.name.toLowerCase().includes(regex.toLowerCase())) {
			score += 5
		}

		// Symbol type relevance based on VSCode SymbolKind
		switch (symbol.kind) {
			case vscode.SymbolKind.Function:
			case vscode.SymbolKind.Method:
			case vscode.SymbolKind.Class:
				score += 3
				break
			case vscode.SymbolKind.Variable:
			case vscode.SymbolKind.Property:
				score += 2
				break
			default:
				score += 1
		}

		return score
	}

	/**
	 * Detect language from file path
	 */
	private detectLanguage(parameters: { path?: string }): LanguageInfo {
		const filePath = parameters.path

		if (filePath && typeof filePath === "string") {
			const extension = filePath.split(".").pop()?.toLowerCase()

			const languageMap: Record<string, string> = {
				ts: "typescript",
				tsx: "typescriptreact",
				js: "javascript",
				jsx: "javascriptreact",
				py: "python",
				rs: "rust",
				go: "go",
				php: "php",
				cpp: "cpp",
				c: "c",
				h: "c",
				hpp: "cpp",
				java: "java",
				cs: "csharp",
				rb: "ruby",
				swift: "swift",
				kt: "kotlin",
			}

			const language = languageMap[extension || ""] || "plaintext"
			const confidence = extension && languageMap[extension] ? 0.9 : 0.1
			const isSupported = language === "typescript" || language === "javascript"

			return { language, confidence, isSupported }
		}

		return { language: "plaintext", confidence: 0.1, isSupported: false }
	}
}
