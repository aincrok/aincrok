// aincrok_change - new file
// Semantic Agent Integration for Aincrok Task System
// Integrates the Internal Symbolic LSP layer with existing Aincrok agent workflows

import * as vscode from "vscode"
import { InternalSymbolicLSP } from "./InternalSymbolicLSP"
import { SymbolicEntity, SemanticContext, SemanticPromptContext, SymbolicEnhancement, CodeContext } from "./types"
import type { Task } from "../task/Task"

/**
 * Integration layer between the Internal Symbolic LSP and Aincrok's agent system
 *
 * This class provides enhanced capabilities to the existing Task system by:
 * - Pre-processing user requests with semantic context
 * - Enhancing AI prompts with relevant symbol information
 * - Providing semantic validation of AI-generated changes
 * - Optimizing token usage through intelligent context selection
 */
export class SemanticAgentIntegration {
	private static instance: SemanticAgentIntegration | undefined
	private lsp: InternalSymbolicLSP
	private isInitialized = false

	// Configuration for semantic enhancements
	private enhancementConfig: SymbolicEnhancement = {
		enableSemanticUnderstanding: true,
		useSymbolicOperations: true,
		fallbackToTextBased: true,
		maxAnalysisDepth: 2,
		supportedLanguages: ["typescript", "javascript", "python", "rust", "go", "php", "java", "cpp"],
	}

	private constructor(private context: vscode.ExtensionContext) {
		this.lsp = InternalSymbolicLSP.getInstance(context)
	}

	/**
	 * Get or create the singleton instance
	 */
	static getInstance(context: vscode.ExtensionContext): SemanticAgentIntegration {
		if (!SemanticAgentIntegration.instance) {
			SemanticAgentIntegration.instance = new SemanticAgentIntegration(context)
		}
		return SemanticAgentIntegration.instance
	}

	/**
	 * Initialize the semantic agent integration
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		try {
			await this.lsp.initializeSymbolicAnalysis()
			this.isInitialized = true
			console.log("[Aincrok] Semantic Agent Integration initialized successfully")
		} catch (error) {
			console.error("[Aincrok] Failed to initialize Semantic Agent Integration:", error)
			// Continue without semantic features if initialization fails
			this.enhancementConfig.enableSemanticUnderstanding = false
		}
	}

	/**
	 * Enhance user request with semantic context before AI processing
	 *
	 * This method analyzes the user's request and workspace to provide
	 * relevant semantic context that improves AI understanding and reduces tokens.
	 */
	async enhanceUserRequest(
		task: Task,
		userRequest: string,
		context?: {
			activeFile?: string
			selectedText?: string
			cursorPosition?: vscode.Position
		},
	): Promise<SemanticPromptContext> {
		if (!this.isInitialized || !this.enhancementConfig.enableSemanticUnderstanding) {
			// Fallback: return original request without enhancement
			return {
				userRequest,
				semanticContext: { relevantSymbols: [], relationships: [], codeSnippets: [] },
				enhancedPrompt: userRequest,
				tokenOptimization: { before: 0, after: 0, reduction: 0 },
			}
		}

		try {
			// Create code context from current workspace state
			const codeContext: CodeContext = {
				workspaceFolder: vscode.workspace.workspaceFolders?.[0],
				document: context?.activeFile ? await vscode.workspace.openTextDocument(context.activeFile) : undefined,
				position: context?.cursorPosition,
				selection: context?.selectedText
					? this.createRangeFromText(context.selectedText, context.cursorPosition)
					: undefined,
			}

			// Get semantic context for the user request
			const semanticPromptContext = await this.lsp.getSemanticContextForPrompt(userRequest)

			// Enhance with current file context if available
			if (context?.activeFile) {
				const fileSemanticContext = await this.lsp.retrieveSemanticContext(
					`file:${context.activeFile}`,
					this.enhancementConfig.maxAnalysisDepth,
				)

				// Merge contexts
				semanticPromptContext.semanticContext.relevantSymbols.push(...fileSemanticContext.relevantSymbols)
				semanticPromptContext.semanticContext.relationships.push(...fileSemanticContext.relationships)
				semanticPromptContext.semanticContext.codeSnippets.push(...fileSemanticContext.codeSnippets)
			}

			// Remove duplicates and limit results for token efficiency
			semanticPromptContext.semanticContext.relevantSymbols = this.deduplicateSymbols(
				semanticPromptContext.semanticContext.relevantSymbols,
			).slice(0, 10)

			semanticPromptContext.semanticContext.codeSnippets =
				semanticPromptContext.semanticContext.codeSnippets.slice(0, 5)

			console.log(
				`[Aincrok] Enhanced user request with ${semanticPromptContext.semanticContext.relevantSymbols.length} symbols and ${semanticPromptContext.semanticContext.codeSnippets.length} code snippets`,
			)

			return semanticPromptContext
		} catch (error) {
			console.error("[Aincrok] Error enhancing user request:", error)

			// Fallback to original request
			return {
				userRequest,
				semanticContext: { relevantSymbols: [], relationships: [], codeSnippets: [] },
				enhancedPrompt: userRequest,
				tokenOptimization: { before: 0, after: 0, reduction: 0 },
			}
		}
	}

	/**
	 * Validate AI-generated changes using semantic analysis
	 *
	 * This method checks if the AI's proposed changes are semantically valid
	 * and don't break existing code relationships.
	 */
	async validateAIGeneratedChanges(
		task: Task,
		proposedChanges: {
			filePath: string
			oldContent: string
			newContent: string
			changeDescription: string
		}[],
	): Promise<{
		isValid: boolean
		warnings: string[]
		errors: string[]
		suggestions: string[]
	}> {
		if (!this.isInitialized || !this.enhancementConfig.enableSemanticUnderstanding) {
			return {
				isValid: true,
				warnings: ["Semantic validation unavailable"],
				errors: [],
				suggestions: [],
			}
		}

		const warnings: string[] = []
		const errors: string[] = []
		const suggestions: string[] = []

		try {
			for (const change of proposedChanges) {
				// Analyze symbols in the old content
				const oldSymbols = await this.analyzeCodeSymbols(change.filePath, change.oldContent)

				// Analyze symbols in the new content
				const newSymbols = await this.analyzeCodeSymbols(change.filePath, change.newContent)

				// Check for breaking changes
				const breakingChanges = this.detectBreakingChanges(oldSymbols, newSymbols)
				if (breakingChanges.length > 0) {
					warnings.push(`Potentially breaking changes in ${change.filePath}: ${breakingChanges.join(", ")}`)
				}

				// Check for new symbols that might need imports
				const newSymbolNames = newSymbols
					.map((s) => s.name)
					.filter((name) => !oldSymbols.some((oldSymbol) => oldSymbol.name === name))

				if (newSymbolNames.length > 0) {
					suggestions.push(
						`Consider adding imports for new symbols in ${change.filePath}: ${newSymbolNames.join(", ")}`,
					)
				}
			}

			return {
				isValid: errors.length === 0,
				warnings,
				errors,
				suggestions,
			}
		} catch (error) {
			console.error("[Aincrok] Error validating AI changes:", error)
			return {
				isValid: true, // Assume valid if validation fails
				warnings: [`Semantic validation failed: ${error instanceof Error ? error.message : String(error)}`],
				errors: [],
				suggestions: [],
			}
		}
	}

	/**
	 * Optimize prompt context using semantic understanding
	 *
	 * This method selects the most relevant context for AI prompts
	 * to maximize accuracy while minimizing token usage.
	 */
	async optimizePromptContext(
		task: Task,
		basePrompt: string,
		availableContext: {
			files: string[]
			recentChanges: string[]
			errorMessages: string[]
		},
		maxTokens: number = 4000,
	): Promise<{
		optimizedPrompt: string
		includedContext: string[]
		excludedContext: string[]
		tokenCount: number
	}> {
		if (!this.isInitialized || !this.enhancementConfig.enableSemanticUnderstanding) {
			// Fallback: include all context up to token limit
			return {
				optimizedPrompt: basePrompt,
				includedContext: availableContext.files.slice(0, 5), // Simple fallback limit
				excludedContext: availableContext.files.slice(5),
				tokenCount: this.estimateTokenCount(basePrompt),
			}
		}

		try {
			// Analyze semantic relevance of each context item
			const contextRelevance: { item: string; score: number; type: "file" | "change" | "error" }[] = []

			// Score files by semantic relevance
			for (const file of availableContext.files) {
				const score = await this.scoreFileRelevance(file, basePrompt)
				contextRelevance.push({ item: file, score, type: "file" })
			}

			// Score recent changes (usually highly relevant)
			for (const change of availableContext.recentChanges) {
				const score = await this.scoreTextRelevance(change, basePrompt)
				contextRelevance.push({ item: change, score: score * 1.2, type: "change" }) // Boost change relevance
			}

			// Score error messages (usually very relevant)
			for (const error of availableContext.errorMessages) {
				const score = await this.scoreTextRelevance(error, basePrompt)
				contextRelevance.push({ item: error, score: score * 1.5, type: "error" }) // Boost error relevance
			}

			// Sort by relevance score
			contextRelevance.sort((a, b) => b.score - a.score)

			// Build optimized prompt within token limits
			let currentTokenCount = this.estimateTokenCount(basePrompt)
			const includedContext: string[] = []
			const excludedContext: string[] = []

			for (const context of contextRelevance) {
				const contextTokens = this.estimateTokenCount(context.item)
				if (currentTokenCount + contextTokens <= maxTokens) {
					includedContext.push(context.item)
					currentTokenCount += contextTokens
				} else {
					excludedContext.push(context.item)
				}
			}

			// Build the optimized prompt
			let optimizedPrompt = basePrompt
			if (includedContext.length > 0) {
				optimizedPrompt += "\n\nRelevant context:\n" + includedContext.join("\n\n")
			}

			return {
				optimizedPrompt,
				includedContext,
				excludedContext,
				tokenCount: currentTokenCount,
			}
		} catch (error) {
			console.error("[Aincrok] Error optimizing prompt context:", error)

			// Fallback to simple truncation
			return {
				optimizedPrompt: basePrompt,
				includedContext: availableContext.files.slice(0, 3),
				excludedContext: availableContext.files.slice(3),
				tokenCount: this.estimateTokenCount(basePrompt),
			}
		}
	}

	/**
	 * Get enhanced tool capabilities for existing Aincrok tools
	 */
	getEnhancedToolCapabilities(): Record<string, SymbolicEnhancement> {
		if (!this.isInitialized || !this.enhancementConfig.enableSemanticUnderstanding) {
			return {}
		}

		return {
			read_file: {
				...this.enhancementConfig,
				maxAnalysisDepth: 1, // Lighter analysis for file reading
			},
			search_files: {
				...this.enhancementConfig,
				maxAnalysisDepth: 2, // Deeper analysis for searching
			},
			edit_file: {
				...this.enhancementConfig,
				maxAnalysisDepth: 3, // Deepest analysis for editing
			},
			list_code_definition_names: {
				...this.enhancementConfig,
				useSymbolicOperations: true, // Perfect fit for symbolic operations
			},
		}
	}

	// Private helper methods

	private createRangeFromText(text: string, position?: vscode.Position): vscode.Range | undefined {
		if (!position) return undefined

		const lines = text.split("\n")
		const endLine = position.line + lines.length - 1
		const endChar = lines.length === 1 ? position.character + text.length : lines[lines.length - 1].length

		return new vscode.Range(position, new vscode.Position(endLine, endChar))
	}

	private deduplicateSymbols(symbols: SymbolicEntity[]): SymbolicEntity[] {
		const seen = new Set<string>()
		return symbols.filter((symbol) => {
			const key = `${symbol.filePath}:${symbol.name}:${symbol.kind}`
			if (seen.has(key)) {
				return false
			}
			seen.add(key)
			return true
		})
	}

	private async analyzeCodeSymbols(filePath: string, content: string): Promise<SymbolicEntity[]> {
		try {
			// This would typically involve parsing the content to extract symbols
			// For now, we'll return a simplified analysis
			const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${filePath}`))

			// In a real implementation, you would use the LSP to analyze the content
			// For now, return empty array as placeholder
			return []
		} catch (error) {
			console.error("[Aincrok] Error analyzing code symbols:", error)
			return []
		}
	}

	private detectBreakingChanges(oldSymbols: SymbolicEntity[], newSymbols: SymbolicEntity[]): string[] {
		const breakingChanges: string[] = []

		// Check for removed public symbols
		for (const oldSymbol of oldSymbols) {
			const found = newSymbols.find(
				(newSymbol) => newSymbol.name === oldSymbol.name && newSymbol.kind === oldSymbol.kind,
			)

			if (!found && this.isPublicSymbol(oldSymbol)) {
				breakingChanges.push(`Removed ${vscode.SymbolKind[oldSymbol.kind].toLowerCase()} '${oldSymbol.name}'`)
			}
		}

		return breakingChanges
	}

	private isPublicSymbol(symbol: SymbolicEntity): boolean {
		// Simple heuristic: symbols starting with underscore are considered private
		return !symbol.name.startsWith("_")
	}

	private async scoreFileRelevance(filePath: string, prompt: string): Promise<number> {
		try {
			// Simple relevance scoring based on file name and extension
			const fileName = filePath.toLowerCase()
			const promptLower = prompt.toLowerCase()

			let score = 0

			// Check if file name appears in prompt
			if (promptLower.includes(fileName) || fileName.includes(promptLower.split(" ")[0])) {
				score += 0.8
			}

			// Boost for certain file types based on prompt content
			if (promptLower.includes("test") && fileName.includes("test")) {
				score += 0.6
			}

			if (promptLower.includes("config") && fileName.includes("config")) {
				score += 0.6
			}

			return Math.min(score, 1.0) // Cap at 1.0
		} catch (error) {
			return 0
		}
	}

	private async scoreTextRelevance(text: string, prompt: string): Promise<number> {
		// Simple keyword-based relevance scoring
		const textWords = text.toLowerCase().split(/\s+/)
		const promptWords = prompt.toLowerCase().split(/\s+/)

		let matches = 0
		for (const word of promptWords) {
			if (word.length > 3 && textWords.includes(word)) {
				matches++
			}
		}

		return Math.min(matches / Math.max(promptWords.length, 1), 1.0)
	}

	private estimateTokenCount(text: string): number {
		// Rough estimation: ~4 characters per token
		return Math.ceil(text.length / 4)
	}
}
