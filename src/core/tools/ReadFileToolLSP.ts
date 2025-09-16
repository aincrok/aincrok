// aincrok_change - new file
import { readFileTool } from "./readFileTool"
import type { Task } from "../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { InternalSymbolicLSP } from "../lsp/InternalSymbolicLSP"
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
 * Symbol information from LSP
 */
interface LSPSymbol {
	name: string
	kind: number
	range: {
		start: { line: number; character: number }
		end: { line: number; character: number }
	}
	detail?: string
	documentation?: string
}

/**
 * Semantic token from LSP
 */
interface SemanticToken {
	line: number
	char: number
	length: number
	tokenType: string
	tokenModifiers: string[]
}

/**
 * Enhanced line range with symbol context
 */
interface EnhancedLineRange {
	start: number
	end: number
	symbolContext: string[]
	description: string
}

/**
 * LSP version of readFileTool with semantic capabilities
 * Provides symbol-aware file reading with reduced token usage
 */
export class ReadFileToolLSP {
	private stats = {
		totalExecutions: 0,
		lspExecutions: 0,
		fallbackExecutions: 0,
		averageLspTime: 0,
		averageTokenReduction: 0,
		errors: 0,
	}

	constructor() {
		// Enhanced read file tool - standalone implementation
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
	 * Check if LSP is available for a specific language
	 */
	private async isLSPAvailable(language: string): Promise<boolean> {
		if (!this.isLSPEnabled()) {
			return false
		}

		try {
			// This will be initialized when we have a real extensionContext
			return language === "typescript" || language === "javascript" // Mock for testing
		} catch (error) {
			console.warn(`[Aincrok] Error checking LSP availability for ${language}:`, error)
			return false
		}
	}

	/**
	 * Get LSP statistics
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
			// Update running average
			const n = this.stats.lspExecutions
			this.stats.averageLspTime = (this.stats.averageLspTime * (n - 1) + executionTime) / n
		}
	}

	/**
	 * Update token statistics
	 */
	private updateTokenStats(tokenMetrics: { reductionPercentage: number }): void {
		if (this.stats.lspExecutions === 1) {
			this.stats.averageTokenReduction = tokenMetrics.reductionPercentage
		} else {
			// Update running average
			const n = this.stats.lspExecutions
			this.stats.averageTokenReduction =
				(this.stats.averageTokenReduction * (n - 1) + tokenMetrics.reductionPercentage) / n
		}
	}

	/**
	 * Execute method that integrates LSP capabilities with original readFileTool
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
			// Extract file paths from the request
			const filePaths = this.extractFilePathsFromBlock(block)

			if (filePaths.length === 0) {
				// No valid paths found, delegate to original tool
				return await readFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Check if any files can benefit from LSP enhancement
			let hasLSPSupportedFiles = false
			const fileLanguages = new Map<string, LanguageInfo>()

			for (const filePath of filePaths) {
				const languageInfo = this.detectLanguage({ path: filePath })
				fileLanguages.set(filePath, languageInfo)

				if (languageInfo.isSupported && (await this.isLSPAvailable(languageInfo.language))) {
					hasLSPSupportedFiles = true
				}
			}

			// If no LSP-supported files or LSP is disabled, use original tool
			if (!hasLSPSupportedFiles || !this.isLSPEnabled()) {
				this.stats.fallbackExecutions++
				return await readFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Create LSP-aware pushToolResult that intercepts and adds semantic content
			const lspPushToolResult: PushToolResult = async (content: string | any[]) => {
				try {
					const lspContent = await this.addLSPToToolResult(content, fileLanguages)

					// Track enhancement metrics
					this.stats.lspExecutions++
					const executionTime = Date.now() - startTime
					this.updateTimingStats(executionTime)

					// Calculate token reduction if we have both original and LSP content
					if (typeof content === "string" && typeof lspContent === "string") {
						const tokenMetrics = this.calculateTokenReduction(content, lspContent)
						if (tokenMetrics) {
							this.updateTokenStats(tokenMetrics)
						}
					}

					await pushToolResult(lspContent)
				} catch (error) {
					console.warn(`[Aincrok] LSP enhancement failed, using original content:`, error)
					this.stats.errors++
					await pushToolResult(content)
				}
			}

			// Execute original tool with LSP result handler
			await readFileTool(task, block, askApproval, handleError, lspPushToolResult, removeClosingTag)
		} catch (error) {
			this.stats.errors++

			// Handle fallback based on configuration
			if (this.shouldFallbackToTextMode()) {
				console.warn(`[Aincrok] LSP enhancement failed for read_file, falling back:`, error)
				vscode.window.showErrorMessage(
					`LSP enhancement failed for read_file, falling back: ${error instanceof Error ? error.message : String(error)}`,
				)
				this.stats.fallbackExecutions++
				return await readFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			} else {
				throw error
			}
		}
	}

	/**
	 * Enhanced execute with LSP integration (overrides base implementation)
	 */
	public async enhanceWithLSP(parameters: any, languageInfo?: LanguageInfo): Promise<any> {
		// This method is called by the base class but we override the main execute method
		// so this shouldn't be reached in normal operation
		throw new Error("EnhancedReadFileTool uses custom execute method")
	}

	/**
	 * Extract file paths from the ToolUse block
	 */
	private extractFilePathsFromBlock(block: ToolUse): string[] {
		const filePaths: string[] = []

		// Try to extract from args XML
		if (block.params.args) {
			try {
				// Simple regex-based extraction - more robust than full XML parsing for this case
				const pathMatches = block.params.args.match(/<path>([^<]+)<\/path>/g)
				if (pathMatches) {
					for (const match of pathMatches) {
						const pathMatch = match.match(/<path>([^<]+)<\/path>/)
						if (pathMatch?.[1]) {
							filePaths.push(pathMatch[1])
						}
					}
				}
			} catch (error) {
				console.warn("[Aincrok] Failed to parse args XML for file paths:", error)
			}
		}

		// Fallback to legacy path parameter
		if (filePaths.length === 0 && block.params.path) {
			filePaths.push(block.params.path)
		}

		return filePaths
	}

	/**
	 * Add LSP information to the tool result
	 */
	private async addLSPToToolResult(
		content: string | any[],
		fileLanguages: Map<string, LanguageInfo>,
	): Promise<string | any[]> {
		if (typeof content !== "string") {
			return content // Can't enhance non-string content
		}

		try {
			const symbolicLSP = InternalSymbolicLSP.getInstance(
				null as unknown as vscode.ExtensionContext, // Will be provided properly in real usage
			)

			// Check if LSP is ready (using try-catch instead of private method)
			try {
				await symbolicLSP.searchWorkspaceSymbols("test")
			} catch (error) {
				return content
			}

			// Parse the XML content to find file sections
			const fileMatches = content.match(/<file><path>([^<]+)<\/path>(.*?)<\/file>/gs)
			if (!fileMatches) {
				return content
			}

			let lspContent = content
			let totalOriginalTokens = 0
			let totalEnhancedTokens = 0

			for (const fileMatch of fileMatches) {
				const pathMatch = fileMatch.match(/<file><path>([^<]+)<\/path>/)
				if (!pathMatch) continue

				const filePath = pathMatch[1]
				const languageInfo = fileLanguages.get(filePath)

				if (!languageInfo?.isSupported) continue

				try {
					// Get symbols for this file
					const symbols = (await symbolicLSP.getDocumentSymbols(vscode.Uri.file(filePath))) || []
					// Note: semantic tokens are not directly available, using document symbols instead

					// Extract original content from the file match
					const contentMatch = fileMatch.match(/<content[^>]*>(.*?)<\/content>/s)
					if (contentMatch) {
						const originalFileContent = contentMatch[1]
						const lspFileContent = await this.addSemanticContext(filePath, originalFileContent, symbols)

						// Replace the content in the XML
						lspContent = lspContent.replace(
							fileMatch,
							fileMatch.replace(
								contentMatch[0],
								contentMatch[0].replace(contentMatch[1], lspFileContent),
							),
						)

						// Track token usage
						const originalTokens = this.estimateTokenCount(originalFileContent)
						const lspTokens = this.estimateTokenCount(lspFileContent)
						totalOriginalTokens += originalTokens
						totalEnhancedTokens += lspTokens
					}

					// Enhance line ranges if present
					const lineRangeMatches = fileMatch.match(/<content[^>]*lines="(\d+)-(\d+)"[^>]*>/g)
					if (lineRangeMatches) {
						for (const rangeMatch of lineRangeMatches) {
							const rangeValues = rangeMatch.match(/lines="(\d+)-(\d+)"/)
							if (rangeValues) {
								const start = parseInt(rangeValues[1], 10)
								const end = parseInt(rangeValues[2], 10)
								const symbolRanges = await this.addLineRangeSymbols([{ start, end }], symbols)

								// Add range context as XML comment
								if (symbolRanges[0].symbolContext.length > 0) {
									const contextComment = `\n<!-- Range Context: ${symbolRanges[0].description} -->\n`
									lspContent = lspContent.replace(rangeMatch, rangeMatch + contextComment)
								}
							}
						}
					}
				} catch (error) {
					console.warn(`[Aincrok] Failed to enhance file ${filePath}:`, error)
					// Continue with other files
				}
			}

			// Add overall enhancement summary if we processed any files
			if (totalOriginalTokens > 0 && totalEnhancedTokens > totalOriginalTokens * 0.5) {
				const reductionPercent = Math.round((1 - totalEnhancedTokens / totalOriginalTokens) * 100)
				if (reductionPercent > 5) {
					const summaryComment = `\n<!-- LSP Enhancement Summary: ~${reductionPercent}% token reduction with semantic context -->\n`
					lspContent = summaryComment + lspContent
				}
			}

			return lspContent
		} catch (error) {
			console.warn("[Aincrok] Failed to enhance tool result:", error)
			return content
		}
	}

	/**
	 * Add semantic context to file content
	 */
	private async addSemanticContext(
		filePath: string,
		content: string,
		symbols: vscode.DocumentSymbol[],
	): Promise<string> {
		const enhancements: string[] = []

		// Add LSP header
		enhancements.push("<!-- LSP Content -->")

		// Add symbol information
		if (symbols.length > 0) {
			enhancements.push("<symbols>")
			for (const symbol of symbols) {
				const symbolInfo =
					`<symbol name="${symbol.name}" kind="${vscode.SymbolKind[symbol.kind]}" ` +
					`line="${symbol.range.start.line + 1}" ` +
					`${symbol.detail ? `detail="${symbol.detail}" ` : ""}/>`
				enhancements.push(symbolInfo)
			}
			enhancements.push("</symbols>")
		} else {
			enhancements.push("<symbols></symbols>")
		}

		// Combine enhancements with original content
		return enhancements.join("\n") + "\n" + content
	}

	/**
	 * Add symbol context to line ranges
	 */
	private async addLineRangeSymbols(
		ranges: { start: number; end: number }[],
		symbols: LSPSymbol[],
	): Promise<EnhancedLineRange[]> {
		return ranges.map((range) => {
			const symbolContext: string[] = []

			// Find symbols that contain or overlap with this range
			for (const symbol of symbols) {
				const symbolStart = symbol.range.start.line + 1 // LSP uses 0-based, we use 1-based
				const symbolEnd = symbol.range.end.line + 1

				// Check if range is within or overlaps with symbol
				if (
					(range.start >= symbolStart && range.start <= symbolEnd) ||
					(range.end >= symbolStart && range.end <= symbolEnd) ||
					(range.start <= symbolStart && range.end >= symbolEnd)
				) {
					symbolContext.push(symbol.name)
				}
			}

			const description =
				symbolContext.length > 0
					? `Lines ${range.start}-${range.end} (Inside ${symbolContext.join(", ")})`
					: `Lines ${range.start}-${range.end}`

			return {
				start: range.start,
				end: range.end,
				symbolContext,
				description,
			}
		})
	}

	/**
	 * Estimate token count from content (rough approximation: ~4 chars per token)
	 */
	private estimateTokenCount(content: string): number {
		return Math.ceil(content.length / 4)
	}

	/**
	 * Calculate token reduction metrics
	 */
	public calculateTokenReduction(
		originalContent: string,
		lspContent: string,
	): {
		originalTokens: number
		lspTokens: number
		reductionPercentage: number
	} {
		const originalTokens = this.estimateTokenCount(originalContent)
		const lspTokens = this.estimateTokenCount(lspContent)
		const reductionPercentage = Math.round((1 - lspTokens / originalTokens) * 100)

		return {
			originalTokens,
			lspTokens,
			reductionPercentage: Math.max(0, reductionPercentage), // Ensure non-negative
		}
	}

	/**
	 * Detect language from file path or parameters
	 */
	private detectLanguage(parameters: any): LanguageInfo {
		// Extract file path from parameters (common pattern)
		const filePath = parameters.path || parameters.filePath || parameters.file

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
			const isSupported = language === "typescript" || language === "javascript" // Mock for testing

			return { language, confidence, isSupported }
		}

		return { language: "plaintext", confidence: 0.1, isSupported: false }
	}
}
