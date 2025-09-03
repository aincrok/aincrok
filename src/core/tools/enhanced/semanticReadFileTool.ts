// aincrok_change - new file
// Semantic-enhanced version of readFileTool using Internal Symbolic LSP
// Provides symbol-level understanding instead of just text-based file reading

import * as path from "path"
import * as vscode from "vscode"
import { InternalSymbolicLSP } from "../../lsp/InternalSymbolicLSP"
import { SymbolicEntity, CodeSnippet, SemanticContext } from "../../lsp/types"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult } from "../../../shared/ExtensionMessage"
import { getReadablePath, isPathOutsideWorkspace } from "../helpers/path"
import type { ClineSayTool } from "../../../shared/ExtensionMessage"
import { extractTextFromFile } from "../../../utils/fs"

interface SemanticReadOptions {
	/** Enable semantic symbol analysis */
	enableSemanticAnalysis: boolean
	/** Maximum number of symbols to analyze */
	maxSymbols: number
	/** Include symbol relationships */
	includeRelationships: boolean
	/** Include related imports */
	includeImports: boolean
	/** Fallback to text-based reading if LSP fails */
	fallbackToTextBased: boolean
	/** Symbol kinds to focus on */
	symbolKinds?: vscode.SymbolKind[]
}

interface SemanticFileResult {
	/** File path */
	path: string
	/** Semantic symbols found */
	symbols: SymbolicEntity[]
	/** Code snippets with semantic context */
	snippets: CodeSnippet[]
	/** Related imports */
	imports?: string[]
	/** Full text content (fallback) */
	textContent?: string
	/** Whether semantic analysis was successful */
	semanticAnalysisSucceeded: boolean
	/** Error message if semantic analysis failed */
	semanticError?: string
}

/**
 * Enhanced read file tool with semantic understanding capabilities
 *
 * This tool leverages Aincrok's Internal Symbolic LSP to provide:
 * - Symbol-level code understanding instead of raw text
 * - Semantic relationships between code entities
 * - Precise context extraction for AI operations
 * - Graceful fallback to text-based reading when needed
 */
export async function semanticReadFileTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: (tag: string, content?: string) => string,
	options: SemanticReadOptions = {
		enableSemanticAnalysis: true,
		maxSymbols: 20,
		includeRelationships: true,
		includeImports: true,
		fallbackToTextBased: true,
	},
): Promise<void> {
	const filePath: string | undefined = block.params.path
	const symbolQuery: string | undefined = block.params.symbol_query // New parameter for semantic search
	const symbolKinds: string[] | undefined = block.params.symbol_kinds // Filter by symbol kinds

	if (!filePath) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("semantic_read_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("semantic_read_file", "path"))
		return
	}

	const absolutePath = path.resolve(cline.cwd, filePath)
	const isOutsideWorkspace = isPathOutsideWorkspace(absolutePath)

	// Initialize LSP if not already done
	const lsp = InternalSymbolicLSP.getInstance(cline.context)

	try {
		await lsp.initializeSymbolicAnalysis()
	} catch (error) {
		console.warn("[Aincrok] LSP initialization failed, falling back to text-based reading:", error)
		if (options.fallbackToTextBased) {
			return await fallbackToTextBasedReading(
				cline,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
				filePath,
				absolutePath,
				isOutsideWorkspace,
			)
		} else {
			await handleError(
				"initializing semantic analysis",
				error instanceof Error ? error : new Error(String(error)),
			)
			return
		}
	}

	const sharedMessageProps: ClineSayTool = {
		tool: "semantic_read_file",
		path: getReadablePath(cline.cwd, filePath),
		isOutsideWorkspace,
	}

	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({
				...sharedMessageProps,
				content: "Analyzing file with semantic understanding...",
			} satisfies ClineSayTool)
			await cline.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		}

		// Perform semantic analysis
		const semanticResult = await performSemanticFileAnalysis(
			lsp,
			absolutePath,
			filePath,
			symbolQuery,
			symbolKinds,
			options,
		)

		// Generate semantic content description
		const semanticContent = formatSemanticResult(semanticResult, options)

		const completeMessage = JSON.stringify({
			...sharedMessageProps,
			content: semanticContent,
			semanticAnalysis: semanticResult.semanticAnalysisSucceeded,
		} satisfies ClineSayTool)

		const didApprove = await askApproval("tool", completeMessage)
		if (!didApprove) {
			cline.didRejectTool = true
			return
		}

		// Track file context for Aincrok's system
		await cline.fileContextTracker.trackFileContext(filePath, "semantic_read_tool" as any)

		pushToolResult(semanticContent)
	} catch (error) {
		console.error("[Aincrok] Semantic read file error:", error)

		if (options.fallbackToTextBased) {
			console.log("[Aincrok] Falling back to text-based reading")
			return await fallbackToTextBasedReading(
				cline,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
				filePath,
				absolutePath,
				isOutsideWorkspace,
			)
		} else {
			await handleError("semantic file analysis", error instanceof Error ? error : new Error(String(error)))
			return
		}
	}
}

/**
 * Perform semantic analysis on a file using LSP
 */
async function performSemanticFileAnalysis(
	lsp: InternalSymbolicLSP,
	absolutePath: string,
	filePath: string,
	symbolQuery?: string,
	symbolKinds?: string[],
	options: SemanticReadOptions = {} as SemanticReadOptions,
): Promise<SemanticFileResult> {
	try {
		// Get document symbols for the file
		const uri = vscode.Uri.file(absolutePath)
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			"vscode.executeDocumentSymbolProvider",
			uri,
		)

		if (!symbols || symbols.length === 0) {
			// No symbols found, fallback to text content
			const textContent = await extractTextFromFile(absolutePath)
			return {
				path: filePath,
				symbols: [],
				snippets: [],
				textContent,
				semanticAnalysisSucceeded: false,
				semanticError: "No symbols found in file",
			}
		}

		// Convert VS Code symbols to our SymbolicEntity format
		const symbolicEntities = await convertDocumentSymbolsToEntities(symbols, absolutePath)

		// Filter symbols if query is provided
		let filteredSymbols = symbolicEntities
		if (symbolQuery) {
			filteredSymbols = symbolicEntities.filter(
				(symbol) =>
					symbol.name.toLowerCase().includes(symbolQuery.toLowerCase()) ||
					(symbol.detail && symbol.detail.toLowerCase().includes(symbolQuery.toLowerCase())),
			)
		}

		// Filter by symbol kinds if specified
		if (symbolKinds && symbolKinds.length > 0) {
			const kindNumbers = symbolKinds
				.map((kind) => {
					const kindNum = parseInt(kind)
					return isNaN(kindNum) ? getSymbolKindFromString(kind) : kindNum
				})
				.filter((kind) => kind !== undefined)

			if (kindNumbers.length > 0) {
				filteredSymbols = filteredSymbols.filter((symbol) => kindNumbers.includes(symbol.kind))
			}
		}

		// Limit number of symbols
		const limitedSymbols = filteredSymbols.slice(0, options.maxSymbols || 20)

		// Generate code snippets for each symbol
		const snippets: CodeSnippet[] = []
		for (const symbol of limitedSymbols) {
			try {
				const snippet = await generateCodeSnippetForSymbol(symbol)
				if (snippet) {
					snippets.push(snippet)
				}
			} catch (error) {
				console.warn(`[Aincrok] Failed to generate snippet for symbol ${symbol.name}:`, error)
			}
		}

		// Get related imports if requested
		let imports: string[] | undefined
		if (options.includeImports) {
			imports = await extractImportsFromFile(absolutePath)
		}

		return {
			path: filePath,
			symbols: limitedSymbols,
			snippets,
			imports,
			semanticAnalysisSucceeded: true,
		}
	} catch (error) {
		console.error("[Aincrok] Semantic analysis failed:", error)

		// Try to get text content as fallback
		let textContent: string | undefined
		try {
			textContent = await extractTextFromFile(absolutePath)
		} catch (textError) {
			console.error("[Aincrok] Failed to read text content:", textError)
		}

		return {
			path: filePath,
			symbols: [],
			snippets: [],
			textContent,
			semanticAnalysisSucceeded: false,
			semanticError: error instanceof Error ? error.message : String(error),
		}
	}
}

/**
 * Convert VS Code DocumentSymbol[] to SymbolicEntity[]
 */
async function convertDocumentSymbolsToEntities(
	symbols: vscode.DocumentSymbol[],
	filePath: string,
	parent?: SymbolicEntity,
): Promise<SymbolicEntity[]> {
	const entities: SymbolicEntity[] = []

	for (const symbol of symbols) {
		const entity: SymbolicEntity = {
			id: `${filePath}:${symbol.range.start.line}:${symbol.range.start.character}:${symbol.name}`,
			name: symbol.name,
			kind: symbol.kind,
			filePath,
			range: symbol.range,
			selectionRange: symbol.selectionRange,
			detail: symbol.detail,
			parent,
			deprecated: symbol.tags?.includes(vscode.SymbolTag.Deprecated),
			tags: symbol.tags,
		}

		// Recursively process children
		if (symbol.children && symbol.children.length > 0) {
			entity.children = await convertDocumentSymbolsToEntities(symbol.children, filePath, entity)
		}

		entities.push(entity)
	}

	return entities
}

/**
 * Generate a code snippet for a symbol
 */
async function generateCodeSnippetForSymbol(symbol: SymbolicEntity): Promise<CodeSnippet | null> {
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
			context: `Symbol: ${symbol.name} (${vscode.SymbolKind[symbol.kind]})`,
		}
	} catch (error) {
		console.error("[Aincrok] Error generating code snippet:", error)
		return null
	}
}

/**
 * Extract import statements from a file
 */
async function extractImportsFromFile(filePath: string): Promise<string[]> {
	try {
		const document = await vscode.workspace.openTextDocument(filePath)
		const text = document.getText()
		const lines = text.split("\n")

		const imports: string[] = []
		for (const line of lines.slice(0, 50)) {
			// Check first 50 lines for imports
			const trimmed = line.trim()
			if (
				trimmed.startsWith("import ") ||
				trimmed.startsWith("from ") ||
				trimmed.startsWith("require(") ||
				(trimmed.startsWith("const ") && trimmed.includes("require("))
			) {
				imports.push(trimmed)
			}
		}

		return imports
	} catch (error) {
		console.error("[Aincrok] Error extracting imports:", error)
		return []
	}
}

/**
 * Format semantic analysis results for output
 */
function formatSemanticResult(result: SemanticFileResult, options: SemanticReadOptions): string {
	if (!result.semanticAnalysisSucceeded) {
		let output = `<file path="${result.path}">\n`
		output += `<semantic_analysis_error>${result.semanticError || "Unknown error"}</semantic_analysis_error>\n`

		if (result.textContent) {
			output += `<text_content>\n${result.textContent}\n</text_content>\n`
		}

		output += `</file>`
		return output
	}

	let output = `<file path="${result.path}">\n`
	output += `<semantic_analysis success="true">\n`

	// Add imports if available
	if (result.imports && result.imports.length > 0) {
		output += `<imports>\n`
		for (const importLine of result.imports) {
			output += `  <import>${importLine}</import>\n`
		}
		output += `</imports>\n`
	}

	// Add symbols
	if (result.symbols.length > 0) {
		output += `<symbols count="${result.symbols.length}">\n`
		for (const symbol of result.symbols) {
			output += formatSymbolForOutput(symbol)
		}
		output += `</symbols>\n`
	}

	// Add code snippets
	if (result.snippets.length > 0) {
		output += `<code_snippets>\n`
		for (const snippet of result.snippets) {
			output += `<snippet symbol="${snippet.symbols?.[0]?.name || "unknown"}" language="${snippet.language}">\n`
			output += `${snippet.content}\n`
			output += `</snippet>\n`
		}
		output += `</code_snippets>\n`
	}

	output += `</semantic_analysis>\n`
	output += `</file>`

	return output
}

/**
 * Format a symbol for output
 */
function formatSymbolForOutput(symbol: SymbolicEntity, indent: string = "  "): string {
	let output = `${indent}<symbol name="${symbol.name}" kind="${vscode.SymbolKind[symbol.kind]}" line="${symbol.range.start.line + 1}">\n`

	if (symbol.detail) {
		output += `${indent}  <detail>${symbol.detail}</detail>\n`
	}

	if (symbol.deprecated) {
		output += `${indent}  <deprecated>true</deprecated>\n`
	}

	if (symbol.children && symbol.children.length > 0) {
		output += `${indent}  <children>\n`
		for (const child of symbol.children) {
			output += formatSymbolForOutput(child, indent + "    ")
		}
		output += `${indent}  </children>\n`
	}

	output += `${indent}</symbol>\n`
	return output
}

/**
 * Get SymbolKind number from string
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
		string: vscode.SymbolKind.String,
		number: vscode.SymbolKind.Number,
		boolean: vscode.SymbolKind.Boolean,
		array: vscode.SymbolKind.Array,
		object: vscode.SymbolKind.Object,
		key: vscode.SymbolKind.Key,
		null: vscode.SymbolKind.Null,
		enummember: vscode.SymbolKind.EnumMember,
		struct: vscode.SymbolKind.Struct,
		event: vscode.SymbolKind.Event,
		operator: vscode.SymbolKind.Operator,
		typeparameter: vscode.SymbolKind.TypeParameter,
	}

	return kindMap[kindString.toLowerCase()]
}

/**
 * Fallback to text-based reading when semantic analysis fails
 */
async function fallbackToTextBasedReading(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: (tag: string, content?: string) => string,
	filePath: string,
	absolutePath: string,
	isOutsideWorkspace: boolean,
): Promise<void> {
	console.log("[Aincrok] Using fallback text-based reading for:", filePath)

	try {
		const textContent = await extractTextFromFile(absolutePath)

		const fallbackContent = `<file path="${filePath}">\n<semantic_analysis success="false" fallback="text_based">\nSemantic analysis unavailable, showing text content:\n</semantic_analysis>\n<content>\n${textContent}\n</content>\n</file>`

		const sharedMessageProps: ClineSayTool = {
			tool: "semantic_read_file_fallback",
			path: getReadablePath(cline.cwd, filePath),
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

		await cline.fileContextTracker.trackFileContext(filePath, "semantic_read_tool_fallback" as any)
		pushToolResult(fallbackContent)
	} catch (error) {
		await handleError("fallback text reading", error instanceof Error ? error : new Error(String(error)))
	}
}
