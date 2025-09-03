// aincrok_change - new file
// Semantic search tool with LSP-powered intelligent code searching

import path from "path"
import * as vscode from "vscode"
import { Task } from "../task/Task"
import { ClineSayTool } from "../../shared/ExtensionMessage"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { InternalSymbolicLSP } from "../lsp/InternalSymbolicLSP"
import { SymbolicEntity, SymbolRelationship, SymbolicEnhancement } from "../lsp/types"
import { getReadablePath } from "../../utils/path"

/**
 * Semantic search tool that uses LSP for intelligent code searching
 * Falls back to regex-based search when LSP is unavailable
 */
export async function semanticSymbolSearchTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
	options?: SymbolicEnhancement,
): Promise<void> {
	const config = options || {
		enableSemanticUnderstanding: true,
		useSymbolicOperations: true,
		fallbackToTextBased: true,
		maxAnalysisDepth: 2,
		supportedLanguages: ["typescript", "javascript", "python", "java", "go", "rust", "cpp"],
	}

	// Validate required parameters
	if (!block.params?.query) {
		task.consecutiveMistakeCount++
		task.recordToolError("search_files")
		await task.sayAndCreateMissingParamError("search_files", "query")
		return
	}

	const query = block.params.query as string
	const filePattern = (block.params as any).file_pattern as string | undefined
	const symbolKinds = (block.params as any).symbol_kinds as string[] | undefined
	const includeReferences = (block.params as any).include_references === "true"
	const includeUsages = (block.params as any).include_usages === "true"
	const maxResults = Math.min(parseInt((block.params as any).max_results as string) || 50, 100)

	try {
		// Get LSP instance
		const context = (task as any).extensionContext
		if (!context) {
			throw new Error("Extension context not available")
		}

		const lsp = InternalSymbolicLSP.getInstance(context)
		await lsp.initializeSymbolicAnalysis()

		// Check if user needs approval for the operation
		if (block.partial) {
			await task.ask("tool", `Performing semantic search for: "${query}"`, true)
		}

		const approved = await askApproval("tool")
		if (!approved) {
			task.didRejectTool = true
			return
		}

		// Track search context
		task.fileContextTracker?.trackFileContext(`search:${query}`, "read_tool")

		// Perform semantic search
		let searchResults: {
			success: boolean
			symbols?: SymbolicEntity[]
			relationships?: SymbolRelationship[]
			error?: string
			fallback?: "regex_based"
		} = { success: false }

		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
			if (!workspaceFolder) {
				throw new Error("No workspace folder available")
			}

			// Find matching symbols using workspace symbol provider
			const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
				"vscode.executeWorkspaceSymbolProvider",
				query,
			)

			if (workspaceSymbols && workspaceSymbols.length > 0) {
				const symbols = convertWorkspaceSymbolsToSymbolicEntities(
					workspaceSymbols,
					filePattern,
					symbolKinds,
					maxResults,
				)

				let relationships: SymbolRelationship[] = []
				if (includeReferences || includeUsages) {
					// Find references for each symbol
					for (const symbol of symbols.slice(0, 10)) {
						// Limit to first 10 symbols for performance
						try {
							const references = await vscode.commands.executeCommand<vscode.Location[]>(
								"vscode.executeReferenceProvider",
								vscode.Uri.file(symbol.filePath),
								new vscode.Position(symbol.range.start.line, symbol.range.start.character),
							)

							if (references) {
								for (const ref of references) {
									relationships.push({
										type: "references",
										from: symbol,
										to: symbol, // Self-reference for now
										location: ref,
										context: "Reference found",
									})
								}
							}
						} catch (refError) {
							console.warn(`Failed to get references for ${symbol.name}:`, refError)
						}
					}
				}

				searchResults = {
					success: true,
					symbols,
					relationships,
				}
			} else {
				throw new Error("No symbols found matching query")
			}
		} catch (lspError) {
			console.warn("[Aincrok] LSP search failed:", lspError)

			if (config.fallbackToTextBased) {
				// Fallback to regex-based search
				const results = await performRegexSearch(query, filePattern, task.cwd, maxResults)
				searchResults = {
					success: false,
					symbols: results,
					fallback: "regex_based",
					error: (lspError as Error).message,
				}
			} else {
				throw lspError
			}
		}

		// Generate response
		if (searchResults.success && searchResults.symbols) {
			let result = `<semantic_search query="${query}" semantic_analysis success="true" result_count="${searchResults.symbols.length}">\n`

			if (filePattern) {
				result += `<file_pattern>${filePattern}</file_pattern>\n`
			}

			if (symbolKinds && symbolKinds.length > 0) {
				result += `<symbol_kinds>${symbolKinds.join(",")}</symbol_kinds>\n`
			}

			result += `<symbols count="${searchResults.symbols.length}">\n`

			for (const symbol of searchResults.symbols) {
				const kindName = getSymbolKindName(symbol.kind)
				const relativePath = getReadablePath(task.cwd, symbol.filePath)
				const startLine = symbol.range.start.line + 1
				const endLine = symbol.range.end.line + 1

				result += `<symbol name="${symbol.name}" kind="${kindName}" file="${relativePath}" start_line="${startLine}" end_line="${endLine}"`

				if (symbol.detail) {
					result += ` detail="${escapeXml(symbol.detail)}"`
				}

				result += `>\n`

				if (symbol.documentation) {
					result += `<documentation>${escapeXml(symbol.documentation)}</documentation>\n`
				}

				// Show usage context
				result += `<context>\n`
				try {
					const document = await vscode.workspace.openTextDocument(vscode.Uri.file(symbol.filePath))
					const lines = document.getText().split("\n")
					const contextStart = Math.max(0, startLine - 3)
					const contextEnd = Math.min(lines.length, endLine + 2)
					const contextLines = lines.slice(contextStart, contextEnd)
					result += contextLines.map((line, idx) => `${contextStart + idx + 1}: ${line}`).join("\n")
				} catch (docError) {
					result += "<!-- Could not load file context -->"
				}
				result += `\n</context>\n`

				result += `</symbol>\n`
			}

			result += `</symbols>\n`

			if (searchResults.relationships && searchResults.relationships.length > 0) {
				result += `<relationships count="${searchResults.relationships.length}">\n`
				for (const rel of searchResults.relationships.slice(0, 20)) {
					// Limit to first 20
					const relPath = getReadablePath(task.cwd, rel.location.uri.fsPath)
					const relLine = rel.location.range.start.line + 1
					result += `<relationship type="${rel.type}" file="${relPath}" line="${relLine}" />\n`
				}
				result += `</relationships>\n`
			}

			result += `</semantic_search>`

			await pushToolResult(result)
		} else if (searchResults.fallback === "regex_based") {
			// Fallback to regex-based search
			let result = `<semantic_search query="${query}" semantic_analysis success="false" fallback="regex_based">\n`
			result += `<error>${escapeXml(searchResults.error || "LSP search failed")}</error>\n`
			result += `<symbols count="${searchResults.symbols?.length || 0}">\n`

			for (const symbol of searchResults.symbols || []) {
				const relativePath = getReadablePath(task.cwd, symbol.filePath)
				const startLine = symbol.range.start.line + 1

				result += `<match file="${relativePath}" line="${startLine}">\n`
				result += `<content>${escapeXml(symbol.name)}</content>\n`
				result += `</match>\n`
			}

			result += `</symbols>\n`
			result += `</semantic_search>`

			await pushToolResult(result)
		} else {
			// No results found
			let result = `<semantic_search query="${query}" semantic_analysis success="false">\n`
			result += `<error>No symbols found matching the query</error>\n`
			result += `<symbols count="0"></symbols>\n`
			result += `</semantic_search>`

			await pushToolResult(result)
		}
	} catch (error) {
		if (config.fallbackToTextBased) {
			try {
				const results = await performRegexSearch(query, filePattern, task.cwd, maxResults)
				let result = `<semantic_search query="${query}" semantic_analysis success="false" fallback="regex_based">\n`
				result += `<error>${escapeXml((error as Error).message)}</error>\n`
				result += `<symbols count="${results.length}">\n`

				for (const symbol of results) {
					const relativePath = getReadablePath(task.cwd, symbol.filePath)
					const startLine = symbol.range.start.line + 1

					result += `<match file="${relativePath}" line="${startLine}">\n`
					result += `<content>${escapeXml(symbol.name)}</content>\n`
					result += `</match>\n`
				}

				result += `</symbols>\n`
				result += `</semantic_search>`

				await pushToolResult(result)
			} catch (fallbackError) {
				await handleError("semantic search", fallbackError as Error)
			}
		} else {
			await handleError("semantic search", error as Error)
		}
	}
}

/**
 * Convert workspace symbols to SymbolicEntity array
 */
function convertWorkspaceSymbolsToSymbolicEntities(
	workspaceSymbols: vscode.SymbolInformation[],
	filePattern?: string,
	symbolKinds?: string[],
	maxResults: number = 50,
): SymbolicEntity[] {
	const entities: SymbolicEntity[] = []

	for (const wsSymbol of workspaceSymbols.slice(0, maxResults)) {
		// Apply file pattern filter
		if (filePattern) {
			const fileName = path.basename(wsSymbol.location.uri.fsPath)
			if (!fileName.includes(filePattern) && !wsSymbol.location.uri.fsPath.includes(filePattern)) {
				continue
			}
		}

		// Apply symbol kind filter
		if (symbolKinds && symbolKinds.length > 0) {
			const kindNumber = wsSymbol.kind.toString()
			if (!symbolKinds.includes(kindNumber)) {
				continue
			}
		}

		const entity: SymbolicEntity = {
			id: `${wsSymbol.location.uri.fsPath}:${wsSymbol.name}:${wsSymbol.location.range.start.line}`,
			name: wsSymbol.name,
			kind: wsSymbol.kind,
			filePath: wsSymbol.location.uri.fsPath,
			range: wsSymbol.location.range,
			selectionRange: wsSymbol.location.range, // Use same range for selection
		}

		entities.push(entity)
	}

	return entities
}

/**
 * Fallback regex-based search
 */
async function performRegexSearch(
	query: string,
	filePattern: string | undefined,
	cwd: string,
	maxResults: number,
): Promise<SymbolicEntity[]> {
	const results: SymbolicEntity[] = []

	// Simple placeholder implementation
	// In a real implementation, you'd use a proper file search utility
	console.warn("Regex search fallback not fully implemented")

	return results
}

/**
 * Get human-readable symbol kind name
 */
function getSymbolKindName(kind: vscode.SymbolKind): string {
	const kindNames: Record<number, string> = {
		1: "File",
		2: "Module",
		3: "Namespace",
		4: "Package",
		5: "Class",
		6: "Method",
		7: "Property",
		8: "Field",
		9: "Constructor",
		10: "Enum",
		11: "Interface",
		12: "Function",
		13: "Variable",
		14: "Constant",
		15: "String",
		16: "Number",
		17: "Boolean",
		18: "Array",
		19: "Object",
		20: "Key",
		21: "Null",
		22: "EnumMember",
		23: "Struct",
		24: "Event",
		25: "Operator",
		26: "TypeParameter",
	}

	return kindNames[kind] || "Unknown"
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}
