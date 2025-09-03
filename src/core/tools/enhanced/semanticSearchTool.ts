// aincrok_change - new file
// Semantic-enhanced search tool using Internal Symbolic LSP
// Provides symbol-based searching instead of regex-based text matching

import * as path from "path"
import * as vscode from "vscode"
import { InternalSymbolicLSP } from "../../lsp/InternalSymbolicLSP"
import { SymbolicEntity, SymbolRelationship, CodeContext } from "../../lsp/types"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult } from "../../../shared/ExtensionMessage"
import { getReadablePath, isPathOutsideWorkspace } from "../helpers/path"
import type { ClineSayTool } from "../../../shared/ExtensionMessage"
import { regexSearchFiles } from "../../../utils/search"

interface SemanticSearchOptions {
	/** Enable semantic symbol search */
	enableSemanticSearch: boolean
	/** Maximum number of results to return */
	maxResults: number
	/** Include symbol relationships */
	includeRelationships: boolean
	/** Include usage examples */
	includeUsageExamples: boolean
	/** Fallback to regex search if semantic fails */
	fallbackToRegex: boolean
	/** Search depth for relationships */
	relationshipDepth: number
}

interface SemanticSearchResult {
	/** Search query */
	query: string
	/** Symbols found */
	symbols: SymbolicEntity[]
	/** Symbol relationships */
	relationships: SymbolRelationship[]
	/** Usage examples */
	usageExamples: CodeUsage[]
	/** Whether semantic search succeeded */
	semanticSearchSucceeded: boolean
	/** Error message if semantic search failed */
	semanticError?: string
	/** Fallback regex results if used */
	regexResults?: string
}

interface CodeUsage {
	/** Symbol being used */
	symbol: SymbolicEntity
	/** File where it's used */
	filePath: string
	/** Line number */
	lineNumber: number
	/** Context around the usage */
	context: string
	/** Type of usage (call, reference, etc.) */
	usageType: "call" | "reference" | "declaration" | "import"
}

/**
 * Enhanced search tool with semantic understanding capabilities
 *
 * This tool leverages Aincrok's Internal Symbolic LSP to provide:
 * - Symbol-based searching instead of regex pattern matching
 * - Understanding of code relationships and dependencies
 * - Contextual usage examples
 * - Graceful fallback to regex search when needed
 */
export async function semanticSearchTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: (tag: string, content?: string) => string,
	options: SemanticSearchOptions = {
		enableSemanticSearch: true,
		maxResults: 50,
		includeRelationships: true,
		includeUsageExamples: true,
		fallbackToRegex: true,
		relationshipDepth: 1,
	},
): Promise<void> {
	const searchQuery: string | undefined = block.params.query || block.params.regex // Support both semantic and legacy regex
	const searchPath: string | undefined = block.params.path
	const symbolKind: string | undefined = block.params.symbol_kind // Filter by symbol type
	const includeTests: boolean = block.params.include_tests !== "false" // Include test files

	if (!searchQuery) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("semantic_search")
		pushToolResult(await cline.sayAndCreateMissingParamError("semantic_search", "query"))
		return
	}

	const absolutePath = searchPath ? path.resolve(cline.cwd, searchPath) : cline.cwd
	const isOutsideWorkspace = isPathOutsideWorkspace(absolutePath)

	// Initialize LSP if not already done
	const lsp = InternalSymbolicLSP.getInstance(cline.context)

	try {
		await lsp.initializeSymbolicAnalysis()
	} catch (error) {
		console.warn("[Aincrok] LSP initialization failed, falling back to regex search:", error)
		if (options.fallbackToRegex) {
			return await fallbackToRegexSearch(
				cline,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
				searchQuery,
				searchPath || "",
				absolutePath,
				isOutsideWorkspace,
			)
		} else {
			await handleError("initializing semantic search", error instanceof Error ? error : new Error(String(error)))
			return
		}
	}

	const sharedMessageProps: ClineSayTool = {
		tool: "semantic_search",
		path: getReadablePath(cline.cwd, searchPath || ""),
		query: searchQuery,
		isOutsideWorkspace,
	}

	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({
				...sharedMessageProps,
				content: "Performing semantic code search...",
			} satisfies ClineSayTool)
			await cline.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		}

		// Create search context
		const searchContext: CodeContext = {
			workspaceFolder: vscode.workspace.workspaceFolders?.[0],
		}

		// Perform semantic search
		const semanticResult = await performSemanticSearch(
			lsp,
			searchQuery,
			absolutePath,
			symbolKind,
			includeTests,
			searchContext,
			options,
		)

		// Generate semantic search results
		const semanticContent = formatSemanticSearchResult(semanticResult, options)

		const completeMessage = JSON.stringify({
			...sharedMessageProps,
			content: semanticContent,
			semanticSearch: semanticResult.semanticSearchSucceeded,
			resultsCount: semanticResult.symbols.length,
		} satisfies ClineSayTool)

		const didApprove = await askApproval("tool", completeMessage)
		if (!didApprove) {
			cline.didRejectTool = true
			return
		}

		pushToolResult(semanticContent)
	} catch (error) {
		console.error("[Aincrok] Semantic search error:", error)

		if (options.fallbackToRegex) {
			console.log("[Aincrok] Falling back to regex search")
			return await fallbackToRegexSearch(
				cline,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
				searchQuery,
				searchPath || "",
				absolutePath,
				isOutsideWorkspace,
			)
		} else {
			await handleError("semantic search", error instanceof Error ? error : new Error(String(error)))
			return
		}
	}
}

/**
 * Perform semantic search using LSP
 */
async function performSemanticSearch(
	lsp: InternalSymbolicLSP,
	query: string,
	searchPath: string,
	symbolKind?: string,
	includeTests: boolean = true,
	context?: CodeContext,
	options: SemanticSearchOptions = {} as SemanticSearchOptions,
): Promise<SemanticSearchResult> {
	try {
		// Use LSP to find symbols by name
		const symbols = await lsp.findSymbolByName(query, context)

		if (symbols.length === 0) {
			return {
				query,
				symbols: [],
				relationships: [],
				usageExamples: [],
				semanticSearchSucceeded: true, // No results is still a successful search
			}
		}

		// Filter symbols by kind if specified
		let filteredSymbols = symbols
		if (symbolKind) {
			const kindEnum = getSymbolKindFromString(symbolKind)
			if (kindEnum !== undefined) {
				filteredSymbols = symbols.filter((symbol) => symbol.kind === kindEnum)
			}
		}

		// Filter out test files if not requested
		if (!includeTests) {
			filteredSymbols = filteredSymbols.filter((symbol) => !isTestFile(symbol.filePath))
		}

		// Limit results
		const limitedSymbols = filteredSymbols.slice(0, options.maxResults || 50)

		// Get relationships if requested
		let relationships: SymbolRelationship[] = []
		if (options.includeRelationships && options.relationshipDepth > 0) {
			for (const symbol of limitedSymbols.slice(0, 10)) {
				// Limit relationship analysis
				try {
					const symbolRelations = await lsp.getSymbolRelations(symbol)
					relationships.push(...symbolRelations)
				} catch (error) {
					console.warn(`[Aincrok] Failed to get relationships for ${symbol.name}:`, error)
				}
			}
		}

		// Get usage examples if requested
		let usageExamples: CodeUsage[] = []
		if (options.includeUsageExamples) {
			usageExamples = await findUsageExamples(limitedSymbols.slice(0, 5)) // Limit usage analysis
		}

		return {
			query,
			symbols: limitedSymbols,
			relationships,
			usageExamples,
			semanticSearchSucceeded: true,
		}
	} catch (error) {
		console.error("[Aincrok] Semantic search failed:", error)

		return {
			query,
			symbols: [],
			relationships: [],
			usageExamples: [],
			semanticSearchSucceeded: false,
			semanticError: error instanceof Error ? error.message : String(error),
		}
	}
}

/**
 * Find usage examples for symbols
 */
async function findUsageExamples(symbols: SymbolicEntity[]): Promise<CodeUsage[]> {
	const usageExamples: CodeUsage[] = []

	for (const symbol of symbols) {
		try {
			// Find references to this symbol
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				"vscode.executeReferenceProvider",
				vscode.Uri.file(symbol.filePath),
				symbol.selectionRange.start,
			)

			if (references) {
				for (const ref of references.slice(0, 3)) {
					// Limit to 3 examples per symbol
					try {
						const document = await vscode.workspace.openTextDocument(ref.uri)
						const line = document.lineAt(ref.range.start.line)
						const context = getContextAroundLine(document, ref.range.start.line, 2)

						usageExamples.push({
							symbol,
							filePath: ref.uri.fsPath,
							lineNumber: ref.range.start.line + 1,
							context,
							usageType: determineUsageType(line.text, symbol.name),
						})
					} catch (error) {
						console.warn(`[Aincrok] Failed to get usage context for ${symbol.name}:`, error)
					}
				}
			}
		} catch (error) {
			console.warn(`[Aincrok] Failed to find references for ${symbol.name}:`, error)
		}
	}

	return usageExamples
}

/**
 * Get context lines around a specific line
 */
function getContextAroundLine(document: vscode.TextDocument, lineNumber: number, contextLines: number): string {
	const startLine = Math.max(0, lineNumber - contextLines)
	const endLine = Math.min(document.lineCount - 1, lineNumber + contextLines)

	const lines: string[] = []
	for (let i = startLine; i <= endLine; i++) {
		const prefix = i === lineNumber ? "→ " : "  "
		lines.push(`${prefix}${i + 1}: ${document.lineAt(i).text}`)
	}

	return lines.join("\n")
}

/**
 * Determine the type of usage from the line content
 */
function determineUsageType(lineContent: string, symbolName: string): CodeUsage["usageType"] {
	const line = lineContent.toLowerCase()
	const name = symbolName.toLowerCase()

	if (line.includes("import") && line.includes(name)) {
		return "import"
	} else if (line.includes("function") || line.includes("class") || line.includes("const") || line.includes("let")) {
		return "declaration"
	} else if (line.includes(name + "(")) {
		return "call"
	} else {
		return "reference"
	}
}

/**
 * Check if a file is a test file
 */
function isTestFile(filePath: string): boolean {
	const fileName = path.basename(filePath).toLowerCase()
	const testPatterns = [".test.", ".spec.", "test_", "_test.", "/test/", "/tests/", "/spec/", "/specs/", "__tests__"]

	return testPatterns.some((pattern) => fileName.includes(pattern) || filePath.toLowerCase().includes(pattern))
}

/**
 * Get SymbolKind from string
 */
function getSymbolKindFromString(kindString: string): vscode.SymbolKind | undefined {
	const kindMap: Record<string, vscode.SymbolKind> = {
		file: vscode.SymbolKind.File,
		module: vscode.SymbolKind.Module,
		namespace: vscode.SymbolKind.Namespace,
		package: vscode.SymbolKind.Package,
		class: vscode.SymbolKind.Class,
		method: vscode.SymbolKind.Method,
		property: vscode.SymbolKind.Property,
		field: vscode.SymbolKind.Field,
		constructor: vscode.SymbolKind.Constructor,
		enum: vscode.SymbolKind.Enum,
		interface: vscode.SymbolKind.Interface,
		function: vscode.SymbolKind.Function,
		variable: vscode.SymbolKind.Variable,
		constant: vscode.SymbolKind.Constant,
	}

	return kindMap[kindString.toLowerCase()]
}

/**
 * Format semantic search results for output
 */
function formatSemanticSearchResult(result: SemanticSearchResult, options: SemanticSearchOptions): string {
	if (!result.semanticSearchSucceeded) {
		let output = `<semantic_search query="${result.query}">\n`
		output += `<semantic_search_error>${result.semanticError || "Unknown error"}</semantic_search_error>\n`

		if (result.regexResults) {
			output += `<regex_fallback_results>\n${result.regexResults}\n</regex_fallback_results>\n`
		}

		output += `</semantic_search>`
		return output
	}

	let output = `<semantic_search query="${result.query}" results_count="${result.symbols.length}">\n`

	if (result.symbols.length === 0) {
		output += `<no_results>No symbols found matching query "${result.query}"</no_results>\n`
	} else {
		// Add symbols
		output += `<symbols>\n`
		for (const symbol of result.symbols) {
			output += formatSymbolResult(symbol)
		}
		output += `</symbols>\n`

		// Add relationships if available
		if (result.relationships.length > 0) {
			output += `<relationships>\n`
			for (const relationship of result.relationships.slice(0, 20)) {
				// Limit relationships shown
				output += `  <relationship type="${relationship.type}" from="${relationship.from.name}" to="${relationship.to.name}" file="${getRelativePath(relationship.location.uri.fsPath)}" line="${relationship.location.range.start.line + 1}"/>\n`
			}
			output += `</relationships>\n`
		}

		// Add usage examples if available
		if (result.usageExamples.length > 0) {
			output += `<usage_examples>\n`
			for (const usage of result.usageExamples) {
				output += `  <usage symbol="${usage.symbol.name}" type="${usage.usageType}" file="${getRelativePath(usage.filePath)}" line="${usage.lineNumber}">\n`
				output += `    <context>\n${usage.context}\n    </context>\n`
				output += `  </usage>\n`
			}
			output += `</usage_examples>\n`
		}
	}

	output += `</semantic_search>`
	return output
}

/**
 * Format a symbol for output
 */
function formatSymbolResult(symbol: SymbolicEntity): string {
	let output = `  <symbol name="${symbol.name}" kind="${vscode.SymbolKind[symbol.kind]}" file="${getRelativePath(symbol.filePath)}" line="${symbol.range.start.line + 1}">\n`

	if (symbol.detail) {
		output += `    <detail>${symbol.detail}</detail>\n`
	}

	if (symbol.deprecated) {
		output += `    <deprecated>true</deprecated>\n`
	}

	output += `  </symbol>\n`
	return output
}

/**
 * Get relative path for display
 */
function getRelativePath(filePath: string): string {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
	if (workspaceFolder) {
		return path.relative(workspaceFolder.uri.fsPath, filePath)
	}
	return path.basename(filePath)
}

/**
 * Fallback to regex search when semantic search fails
 */
async function fallbackToRegexSearch(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: (tag: string, content?: string) => string,
	searchQuery: string,
	searchPath: string,
	absolutePath: string,
	isOutsideWorkspace: boolean,
): Promise<void> {
	console.log("[Aincrok] Using fallback regex search for:", searchQuery)

	try {
		const regexResults = await regexSearchFiles(
			cline.cwd,
			absolutePath,
			searchQuery,
			undefined, // file pattern
			cline.rooIgnoreController,
		)

		const fallbackContent = `<semantic_search query="${searchQuery}" semantic_search="false" fallback="regex">\n<semantic_search_error>Semantic search unavailable, using regex search</semantic_search_error>\n<regex_results>\n${regexResults}\n</regex_results>\n</semantic_search>`

		const sharedMessageProps: ClineSayTool = {
			tool: "semantic_search_fallback",
			path: getReadablePath(cline.cwd, searchPath),
			query: searchQuery,
			isOutsideWorkspace,
		}

		const completeMessage = JSON.stringify({
			...sharedMessageProps,
			content: fallbackContent,
		} satisfies ClineSayTool)

		const didApprove = await askApproval("tool", completeMessage)
		if (!didApprove) {
			cline.didRejectTool = true
			return
		}

		pushToolResult(fallbackContent)
	} catch (error) {
		await handleError("fallback regex search", error instanceof Error ? error : new Error(String(error)))
	}
}
