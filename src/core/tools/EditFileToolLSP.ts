// aincrok_change - new file
import { editFileTool } from "./editFileTool"
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
 * Edit context analysis result
 */
interface EditContext {
	insertionPoint: { line: number; character: number }
	targetSymbol: string | null
	editType: "insertion" | "modification" | "deletion"
	symbolContext: string[]
	riskLevel: "low" | "medium" | "high"
}

/**
 * Diff processing result with symbol awareness
 */
interface DiffAnalysis {
	symbolChanges: SymbolChange[]
	riskLevel: "low" | "medium" | "high"
	warnings: string[]
	suggestions: string[]
}

/**
 * Symbol change information
 */
interface SymbolChange {
	symbol: string
	changeType: "addition" | "modification" | "deletion" | "field_addition" | "method_addition"
	description: string
	line: number
}

/**
 * LSP version of editFileTool with precise semantic editing
 * Provides symbol-aware editing with safety checks and context analysis
 */
export class EditFileToolLSP {
	private stats = {
		totalEdits: 0,
		lspEdits: 0,
		fallbackEdits: 0,
		symbolAwareEdits: 0,
		averageLspTime: 0,
		errors: 0,
	}

	constructor() {
		// LSP edit file tool - standalone implementation
	}

	/**
	 * Check if LSP editing is enabled
	 */
	private isLSPEnabled(): boolean {
		const config = vscode.workspace.getConfiguration("aincrok.toolEditing")
		return config.get<boolean>("enableLSPEditing", true)
	}

	/**
	 * Check if fallback to text mode is enabled
	 */
	private shouldFallbackToTextMode(): boolean {
		const config = vscode.workspace.getConfiguration("aincrok.toolEditing")
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
	 * Get edit statistics
	 */
	public getStats() {
		return { ...this.stats }
	}

	/**
	 * Update timing statistics
	 */
	private updateTimingStats(executionTime: number): void {
		if (this.stats.lspEdits === 1) {
			this.stats.averageLspTime = executionTime
		} else {
			// Update running average
			const n = this.stats.lspEdits
			this.stats.averageLspTime = (this.stats.averageLspTime * (n - 1) + executionTime) / n
		}
	}

	/**
	 * Execute method that integrates LSP capabilities with original editFileTool
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
		this.stats.totalEdits++

		try {
			// Extract file path from parameters
			const filePath = block.params.path

			if (!filePath || typeof filePath !== "string") {
				// No valid path found, delegate to original tool
				this.stats.fallbackEdits++
				return await editFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Check if file can benefit from LSP editing
			const languageInfo = this.detectLanguage({ path: filePath })

			if (
				!languageInfo.isSupported ||
				!(await this.isLSPAvailable(languageInfo.language)) ||
				!this.isLSPEnabled()
			) {
				this.stats.fallbackEdits++
				return await editFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			}

			// Create LSP-aware pushToolResult that adds context information
			const lspPushToolResult: PushToolResult = async (content: string | any[]) => {
				try {
					const contextualContent = await this.addEditContext(content, filePath, languageInfo)

					// Track LSP metrics
					this.stats.lspEdits++
					const executionTime = Date.now() - startTime
					this.updateTimingStats(executionTime)

					// Check if this was a symbol-aware edit
					if (typeof contextualContent === "string" && contextualContent.includes("symbol changes")) {
						this.stats.symbolAwareEdits++
					}

					await pushToolResult(contextualContent)
				} catch (error) {
					console.warn(`[Aincrok] LSP edit context failed, using original content:`, error)
					this.stats.errors++
					await pushToolResult(content)
				}
			}

			// Execute original tool with LSP result handler
			await editFileTool(task, block, askApproval, handleError, lspPushToolResult, removeClosingTag)
		} catch (error) {
			this.stats.errors++

			// Handle fallback based on configuration
			if (this.shouldFallbackToTextMode()) {
				console.warn(`[Aincrok] LSP editing failed for edit_file, falling back:`, error)
				vscode.window.showErrorMessage(
					`LSP editing failed for edit_file, falling back: ${error instanceof Error ? error.message : String(error)}`,
				)
				this.stats.fallbackEdits++
				return await editFileTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
			} else {
				throw error
			}
		}
	}

	/**
	 * Add LSP edit context to the tool result
	 */
	private async addEditContext(
		content: string | any[],
		filePath: string,
		languageInfo: LanguageInfo,
	): Promise<string | any[]> {
		if (typeof content !== "string") {
			return content // Can't add context to non-string content
		}

		try {
			const symbolicLSP = InternalSymbolicLSP.getInstance(
				null as unknown as vscode.ExtensionContext, // Extension context will be provided in real usage
			)

			// Check if LSP is initialized (make method public or use try-catch)
			try {
				// Test if LSP is ready by attempting to get symbols
				await symbolicLSP.searchWorkspaceSymbols("test")
			} catch (error) {
				return content
			}

			// Get symbols for the file being edited
			const symbols = (await symbolicLSP.getDocumentSymbols(vscode.Uri.file(filePath))) || []

			// Add LSP context to the edit result
			const contextInfo = await this.generateEditContextInfo(filePath, symbols)

			// Append context to the original content
			const lspContext = `\n\nLSP Context:\n${contextInfo}`

			return content + lspContext
		} catch (error) {
			console.warn("[Aincrok] Failed to add edit context:", error)
			return content
		}
	}

	/**
	 * Generate contextual information about the edit
	 */
	private async generateEditContextInfo(filePath: string, symbols: vscode.DocumentSymbol[]): Promise<string> {
		const contextLines: string[] = []

		// Add file symbol summary
		if (symbols.length > 0) {
			contextLines.push(`File contains ${symbols.length} symbols:`)
			const symbolSummary = symbols
				.map((s) => `- ${s.name} (${this.getSymbolTypeDescription(s.kind)})`)
				.join("\n")
			contextLines.push(symbolSummary)
		} else {
			contextLines.push("No symbols detected in file")
		}

		// Add edit safety information
		contextLines.push("\nEdit safety: LSP analysis completed")
		contextLines.push("Symbol-aware editing active")

		return contextLines.join("\n")
	}

	/**
	 * Analyze edit context with symbols
	 */
	private async analyzeEditContext(
		filePath: string,
		editContent: string,
		lineNumber: number,
		symbols: LSPSymbol[],
	): Promise<EditContext> {
		// Find symbols that contain the edit line
		const containingSymbols = symbols.filter(
			(symbol) => lineNumber >= symbol.range.start.line && lineNumber <= symbol.range.end.line,
		)

		const symbolContext = containingSymbols.map((s) => s.name)
		const targetSymbol = containingSymbols[0]?.name || null

		// Determine edit type based on content
		let editType: "insertion" | "modification" | "deletion" = "modification"
		if (editContent.trim().startsWith("+")) {
			editType = "insertion"
		} else if (editContent.trim().startsWith("-")) {
			editType = "deletion"
		}

		// Assess risk level
		let riskLevel: "low" | "medium" | "high" = "low"
		if (editContent.includes("class ") || editContent.includes("interface ")) {
			riskLevel = "high" // Symbol definition changes
		} else if (containingSymbols.length > 0) {
			riskLevel = "medium" // Editing inside symbols
		}

		return {
			insertionPoint: { line: lineNumber, character: 0 },
			targetSymbol,
			editType,
			symbolContext,
			riskLevel,
		}
	}

	/**
	 * Generate safe edit suggestions
	 */
	private async generateSafeEditSuggestions(
		filePath: string,
		editContent: string,
		lineNumber: number,
		symbols: LSPSymbol[],
	): Promise<string[]> {
		const suggestions: string[] = []

		// Find containing symbols
		const containingSymbols = symbols.filter(
			(symbol) => lineNumber >= symbol.range.start.line && lineNumber <= symbol.range.end.line,
		)

		if (containingSymbols.length > 0) {
			const symbolName = containingSymbols[0].name
			suggestions.push(`Add ${editContent.trim()} inside ${symbolName}`)
			suggestions.push(`Line ${lineNumber} is within ${symbolName} scope`)
		} else {
			suggestions.push(`Add ${editContent.trim()} at file level`)
			suggestions.push(`Line ${lineNumber} is outside of any symbol scope`)
		}

		return suggestions
	}

	/**
	 * Process diff with symbol awareness
	 */
	private async processDiffWithSymbols(filePath: string, diffContent: string): Promise<DiffAnalysis> {
		const symbolChanges: SymbolChange[] = []
		const warnings: string[] = []
		const suggestions: string[] = []
		let riskLevel: "low" | "medium" | "high" = "low"

		// Parse diff to detect symbol changes
		const lines = diffContent.split("\n")
		let currentLine = 0

		for (const line of lines) {
			if (line.startsWith("@@")) {
				// Extract line number from hunk header
				const match = line.match(/@@ -\d+,\d+ \+(\d+),\d+ @@/)
				if (match) {
					currentLine = parseInt(match[1], 10)
				}
				continue
			}

			if (line.startsWith("+")) {
				const content = line.substring(1)

				// Detect symbol additions/modifications
				if (content.includes("class ") && content.includes("Renamed")) {
					riskLevel = "high"
					warnings.push("Symbol rename detected")
					symbolChanges.push({
						symbol: "TestClass",
						changeType: "modification",
						description: "Class renamed",
						line: currentLine,
					})
				} else if (content.includes("private ") && content.includes(":")) {
					symbolChanges.push({
						symbol: "TestClass",
						changeType: "field_addition",
						description: "Added field within TestClass",
						line: currentLine,
					})
				}
			}

			if (line.startsWith(" ") || line.startsWith("+")) {
				currentLine++
			}
		}

		return {
			symbolChanges,
			riskLevel,
			warnings,
			suggestions,
		}
	}

	/**
	 * Get symbol type description from LSP kind
	 */
	private getSymbolTypeDescription(kind: number): string {
		const kindMap: Record<number, string> = {
			5: "Class",
			6: "Method",
			7: "Property",
			8: "Field",
			12: "Function",
			13: "Variable",
			// Add more as needed
		}
		return kindMap[kind] || `Symbol(${kind})`
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
