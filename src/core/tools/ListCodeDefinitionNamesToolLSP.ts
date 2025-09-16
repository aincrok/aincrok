// aincrok_change - new file
import { listCodeDefinitionNamesTool } from "./listCodeDefinitionNamesTool"
import type { Task } from "../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { InternalSymbolicLSP } from "../lsp/InternalSymbolicLSP"
import * as vscode from "vscode"
import path from "path"

/**
 * Language detection result
 */
interface LanguageInfo {
	language: string
	confidence: number
	isSupported: boolean
}

/**
 * Enhanced symbol information
 */
interface EnhancedSymbolInfo {
	name: string
	kind: string
	detail?: string
	line: number
	filePath: string
	containerName?: string
	documentation?: string
}

/**
 * LSP version of listCodeDefinitionNamesTool with semantic symbol discovery
 * Provides native symbol provider results with relationships
 */
export class ListCodeDefinitionNamesToolLSP {
	private stats = {
		totalExecutions: 0,
		lspExecutions: 0,
		fallbackExecutions: 0,
		averageLspTime: 0,
		averageSymbolCount: 0,
		errors: 0,
	}

	constructor() {
		// LSP list code definitions tool - standalone implementation
	}

	/**
	 * Check if LSP enhancements are enabled
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
	 * Check if LSP is available for symbol discovery
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
			console.warn("[Aincrok] Error checking LSP availability:", error)
			return false
		}
	}

	/**
	 * Get symbol discovery statistics
	 */
	public getStats() {
		return { ...this.stats }
	}

	/**
	 * Update timing statistics
	 */
	private updateTimingStats(executionTime: number): void {
		if (this.stats.lspExecutions === 1) {
			this.stats.averageLspTime = executionTime
		} else {
			const n = this.stats.lspExecutions
			this.stats.averageLspTime = (this.stats.averageLspTime * (n - 1) + executionTime) / n
		}
	}

	/**
	 * Update symbol count statistics
	 */
	private updateSymbolStats(symbolCount: number): void {
		if (this.stats.lspExecutions === 1) {
			this.stats.averageSymbolCount = symbolCount
		} else {
			const n = this.stats.lspExecutions
			this.stats.averageSymbolCount = (this.stats.averageSymbolCount * (n - 1) + symbolCount) / n
		}
	}

	/**
	 * Execute method that integrates LSP capabilities with original listCodeDefinitionNamesTool
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
		this.stats.totalExecutions++

		try {
			// Extract file path from parameters
			const relPath = block.params.path

			// Check if LSP symbol discovery is available
			if (!relPath || !(await this.isLSPAvailable()) || !this.isLSPEnabled()) {
				this.stats.fallbackExecutions++
				return await listCodeDefinitionNamesTool(
					task,
					block,
					askApproval,
					handleError,
					pushToolResult,
					removeClosingTag,
				)
			}

			// Determine if this is a supported file type
			const languageInfo = this.detectLanguage({ path: relPath })

			if (!languageInfo.isSupported) {
				this.stats.fallbackExecutions++
				return await listCodeDefinitionNamesTool(
					task,
					block,
					askApproval,
					handleError,
					pushToolResult,
					removeClosingTag,
				)
			}

			// Create LSP-aware pushToolResult that adds symbol discovery
			const lspPushToolResult: PushToolResult = async (content: string | unknown[]) => {
				try {
					const enhancedContent = await this.addLSPSymbolDiscovery(content, relPath, task.cwd, languageInfo)

					// Track LSP metrics
					this.stats.lspExecutions++
					const executionTime = Date.now() - startTime
					this.updateTimingStats(executionTime)

					await pushToolResult(enhancedContent as string)
				} catch (error) {
					console.warn("[Aincrok] LSP symbol discovery failed, using original content:", error)
					this.stats.errors++
					await pushToolResult(content as string)
				}
			}

			// Execute original tool with LSP result handler
			await listCodeDefinitionNamesTool(
				task,
				block,
				askApproval,
				handleError,
				lspPushToolResult,
				removeClosingTag,
			)
		} catch (error) {
			this.stats.errors++

			// Handle fallback based on configuration
			if (this.shouldFallbackToTextMode()) {
				console.warn("[Aincrok] LSP symbol discovery failed, falling back:", error)
				vscode.window.showErrorMessage(
					`LSP symbol discovery failed, falling back: ${error instanceof Error ? error.message : String(error)}`,
				)
				this.stats.fallbackExecutions++
				return await listCodeDefinitionNamesTool(
					task,
					block,
					askApproval,
					handleError,
					pushToolResult,
					removeClosingTag,
				)
			} else {
				throw error
			}
		}
	}

	/**
	 * Add LSP symbol discovery to the tool result
	 */
	private async addLSPSymbolDiscovery(
		content: string | unknown[],
		relPath: string,
		cwd: string,
		languageInfo: LanguageInfo,
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

			const absolutePath = path.resolve(cwd, relPath)
			const fileUri = vscode.Uri.file(absolutePath)

			// Get document symbols for the specified file
			const symbols = (await symbolicLSP.getDocumentSymbols(fileUri)) || []

			// Convert to enhanced symbol information
			const enhancedSymbols = this.processDocumentSymbols(symbols, absolutePath)

			// Update symbol count statistics
			this.updateSymbolStats(enhancedSymbols.length)

			// Generate LSP symbol context
			const lspSymbolContext = this.generateSymbolContext(enhancedSymbols, languageInfo)

			// Append context to the original content
			const lspContext = `\n\nLSP Symbol Discovery:\n${lspSymbolContext}`

			return content + lspContext
		} catch (error) {
			console.warn("[Aincrok] Failed to add LSP symbol discovery:", error)
			return content
		}
	}

	/**
	 * Process document symbols into enhanced format
	 */
	private processDocumentSymbols(
		symbols: vscode.DocumentSymbol[],
		filePath: string,
		containerName?: string,
	): EnhancedSymbolInfo[] {
		const result: EnhancedSymbolInfo[] = []

		for (const symbol of symbols) {
			// Add the main symbol
			result.push({
				name: symbol.name,
				kind: this.getSymbolTypeDescription(symbol.kind),
				detail: symbol.detail,
				line: symbol.range.start.line + 1,
				filePath,
				containerName,
				documentation: symbol.detail,
			})

			// Recursively process child symbols
			if (symbol.children.length > 0) {
				const childSymbols = this.processDocumentSymbols(symbol.children, filePath, symbol.name)
				result.push(...childSymbols)
			}
		}

		return result
	}

	/**
	 * Generate symbol context information
	 */
	private generateSymbolContext(symbols: EnhancedSymbolInfo[], languageInfo: LanguageInfo): string {
		const contextLines: string[] = []

		if (symbols.length === 0) {
			contextLines.push("No symbols found via LSP")
			return contextLines.join("\n")
		}

		contextLines.push(`Found ${symbols.length} symbols via LSP (${languageInfo.language})`)

		// Group symbols by kind
		const symbolsByKind = new Map<string, EnhancedSymbolInfo[]>()

		for (const symbol of symbols) {
			if (!symbolsByKind.has(symbol.kind)) {
				symbolsByKind.set(symbol.kind, [])
			}
			symbolsByKind.get(symbol.kind)!.push(symbol)
		}

		// Sort kinds by importance
		const kindOrder = ["Class", "Interface", "Function", "Method", "Property", "Variable", "Constant"]
		const sortedKinds = Array.from(symbolsByKind.keys()).sort((a, b) => {
			const aIndex = kindOrder.indexOf(a)
			const bIndex = kindOrder.indexOf(b)
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex
			}
			if (aIndex !== -1) return -1
			if (bIndex !== -1) return 1
			return a.localeCompare(b)
		})

		// Generate organized output
		for (const kind of sortedKinds) {
			const kindSymbols = symbolsByKind.get(kind)!
			contextLines.push(`\n${kind}s (${kindSymbols.length}):`)

			// Sort symbols within kind by line number
			kindSymbols.sort((a, b) => a.line - b.line)

			for (const symbol of kindSymbols.slice(0, 10)) {
				// Limit to first 10 per kind
				let symbolDesc = `  - ${symbol.name} (line ${symbol.line})`

				if (symbol.containerName) {
					symbolDesc += ` in ${symbol.containerName}`
				}

				if (symbol.detail) {
					symbolDesc += ` - ${symbol.detail}`
				}

				contextLines.push(symbolDesc)
			}

			// Show count if there are more
			if (kindSymbols.length > 10) {
				contextLines.push(`  ... and ${kindSymbols.length - 10} more`)
			}
		}

		contextLines.push("\nLSP symbol discovery completed - Results include native LSP symbol information")

		return contextLines.join("\n")
	}

	/**
	 * Get symbol type description from LSP kind
	 */
	private getSymbolTypeDescription(kind: vscode.SymbolKind): string {
		return vscode.SymbolKind[kind] || `Unknown(${kind})`
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
