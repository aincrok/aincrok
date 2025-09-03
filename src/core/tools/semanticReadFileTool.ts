// aincrok_change - new file
// Semantic read file tool with LSP-powered understanding

import path from "path"
import * as vscode from "vscode"
import { Task } from "../task/Task"
import { ClineSayTool } from "../../shared/ExtensionMessage"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { InternalSymbolicLSP } from "../lsp/InternalSymbolicLSP"
import { SymbolicEntity, SymbolicEnhancement } from "../lsp/types"
import { extractTextFromFile } from "../../integrations/misc/extract-text"
import { getReadablePath } from "../../utils/path"

/**
 * Semantic read file tool that uses LSP for intelligent code understanding
 * Falls back to text-based reading when LSP is unavailable
 */
export async function semanticReadFileTool(
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
		maxAnalysisDepth: 3,
		supportedLanguages: ["typescript", "javascript", "python", "java", "go", "rust", "cpp"],
	}

	// Validate required parameters
	if (!block.params?.path) {
		task.consecutiveMistakeCount++
		task.recordToolError("read_file")
		await task.sayAndCreateMissingParamError("read_file", "path")
		return
	}

	const filePath = block.params.path as string
	const symbolQuery = (block.params as any).symbol_query as string | undefined
	const symbolKinds = (block.params as any).symbol_kinds as string[] | undefined
	const includeRelationships = (block.params as any).include_relationships === "true"
	const maxDepth = Math.min(parseInt((block.params as any).max_depth as string) || 1, config.maxAnalysisDepth)

	try {
		// Get LSP instance
		const context = (task as any).extensionContext
		if (!context) {
			throw new Error("Extension context not available")
		}

		// Check if user needs approval for the operation
		if (block.partial) {
			await task.ask(
				"tool",
				`Analyzing file with semantic understanding: ${getReadablePath(task.cwd, filePath)}`,
				true,
			)
		}

		const approved = await askApproval("tool")
		if (!approved) {
			task.didRejectTool = true
			return
		}

		// Track file context
		task.fileContextTracker?.trackFileContext(getReadablePath(task.cwd, filePath), "read_tool")

		// Perform semantic analysis
		let analysis: {
			success: boolean
			symbols?: SymbolicEntity[]
			content?: string
			language?: string
			error?: string
			fallback?: "text_based"
		} = { success: false }

		try {
			// Get LSP instance and initialize
			const lsp = InternalSymbolicLSP.getInstance(context)
			await lsp.initializeSymbolicAnalysis()
			const fileUri = vscode.Uri.file(path.resolve(task.cwd, filePath))
			const document = await vscode.workspace.openTextDocument(fileUri)

			// Get document symbols using LSP
			const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				"vscode.executeDocumentSymbolProvider",
				fileUri,
			)

			if (documentSymbols && documentSymbols.length > 0) {
				const symbols = convertDocumentSymbolsToSymbolicEntities(
					documentSymbols,
					document,
					symbolQuery,
					symbolKinds,
					maxDepth,
				)

				analysis = {
					success: true,
					symbols,
					content: document.getText(),
					language: document.languageId,
				}
			} else {
				// No symbols found - fall back or report empty
				if (config.fallbackToTextBased) {
					throw new Error("No symbols found in file")
				} else {
					analysis = {
						success: false,
						content: document.getText(),
						language: document.languageId,
						error: "No symbols found in file",
					}
				}
			}
		} catch (lspError) {
			console.warn("[Aincrok] LSP analysis failed:", lspError)

			if (config.fallbackToTextBased) {
				const content = await extractTextFromFile(filePath)
				analysis = {
					success: false,
					content,
					fallback: "text_based",
					error: (lspError as Error).message,
				}
			} else {
				throw lspError
			}
		}

		// Generate response
		if (analysis.success && analysis.symbols) {
			const symbolCount = analysis.symbols.length
			const filteredCount = symbolQuery
				? analysis.symbols.filter((s) => s.name.toLowerCase().includes(symbolQuery.toLowerCase())).length
				: symbolCount

			let result = `<semantic_read_file path="${filePath}" semantic_analysis success="true" language="${analysis.language}" symbol_count="${symbolCount}" filtered_count="${filteredCount}">\n`

			if (symbolQuery) {
				result += `<symbol_query>${symbolQuery}</symbol_query>\n`
			}

			if (symbolKinds && symbolKinds.length > 0) {
				result += `<symbol_kinds>${symbolKinds.join(",")}</symbol_kinds>\n`
			}

			result += `<symbols count="${filteredCount}">\n`

			for (const symbol of analysis.symbols) {
				if (symbolQuery && !symbol.name.toLowerCase().includes(symbolQuery.toLowerCase())) {
					continue
				}

				const kindName = getSymbolKindName(symbol.kind)
				const startLine = symbol.range.start.line + 1
				const endLine = symbol.range.end.line + 1

				result += `<symbol name="${symbol.name}" kind="${kindName}" start_line="${startLine}" end_line="${endLine}"`

				if (symbol.detail) {
					result += ` detail="${escapeXml(symbol.detail)}"`
				}

				if (symbol.signature) {
					result += ` signature="${escapeXml(symbol.signature)}"`
				}

				if (symbol.deprecated) {
					result += ` deprecated="true"`
				}

				if (symbol.tags && symbol.tags.length > 0) {
					result += ` tags="${(symbol.tags as readonly vscode.SymbolTag[]).join(",")}"`
				}

				result += `>\n`

				if (symbol.documentation) {
					result += `<documentation>${escapeXml(symbol.documentation)}</documentation>\n`
				}

				// Extract symbol content
				const lines = analysis.content!.split("\n")
				const symbolContent = lines.slice(startLine - 1, endLine).join("\n")
				result += `<content>\n${symbolContent}\n</content>\n`

				if (symbol.children && symbol.children.length > 0 && maxDepth > 1) {
					result += `<children count="${symbol.children.length}">\n`
					for (const child of symbol.children) {
						const childKind = getSymbolKindName(child.kind)
						const childStart = child.range.start.line + 1
						const childEnd = child.range.end.line + 1
						result += `<symbol name="${child.name}" kind="${childKind}" start_line="${childStart}" end_line="${childEnd}" />\n`
					}
					result += `</children>\n`
				}

				result += `</symbol>\n`
			}

			result += `</symbols>\n`

			if (includeRelationships) {
				result += `<relationships>\n`
				// TODO: Implement relationship analysis
				result += `<!-- Relationship analysis not yet implemented -->\n`
				result += `</relationships>\n`
			}

			result += `</semantic_read_file>`

			await pushToolResult(result)
		} else if (analysis.fallback === "text_based") {
			// Fallback to text-based reading
			let result = `<semantic_read_file path="${filePath}" semantic_analysis success="false" fallback="text_based">\n`
			result += `<error>${escapeXml(analysis.error || "LSP analysis failed")}</error>\n`
			result += `<content>\n${analysis.content}\n</content>\n`
			result += `</semantic_read_file>`

			await pushToolResult(result)
		} else {
			// No fallback - report failure
			let result = `<semantic_read_file path="${filePath}" semantic_analysis success="false">\n`
			result += `<error>${escapeXml(analysis.error || "No symbols found in file")}</error>\n`

			if (analysis.content) {
				result += `<content>\n${analysis.content}\n</content>\n`
			} else if (config.fallbackToTextBased) {
				const content = await extractTextFromFile(filePath)
				result += `<content>\n${content}\n</content>\n`
			}

			result += `</semantic_read_file>`

			await pushToolResult(result)
		}
	} catch (error) {
		if (config.fallbackToTextBased) {
			try {
				const content = await extractTextFromFile(filePath)
				let result = `<semantic_read_file path="${filePath}" semantic_analysis success="false" fallback="text_based">\n`
				result += `<error>${escapeXml((error as Error).message)}</error>\n`
				result += `<content>\n${content}\n</content>\n`
				result += `</semantic_read_file>`

				await pushToolResult(result)
			} catch (fallbackError) {
				await handleError("semantic file analysis", fallbackError as Error)
			}
		} else {
			await handleError("semantic file analysis", error as Error)
		}
	}
}

/**
 * Convert VS Code DocumentSymbol to SymbolicEntity
 */
function convertDocumentSymbolsToSymbolicEntities(
	documentSymbols: vscode.DocumentSymbol[],
	document: vscode.TextDocument,
	symbolQuery?: string,
	symbolKinds?: string[],
	maxDepth: number = 1,
): SymbolicEntity[] {
	const entities: SymbolicEntity[] = []

	for (const docSymbol of documentSymbols) {
		const entity = convertDocumentSymbolToSymbolicEntity(docSymbol, document, maxDepth)

		// Apply filters
		if (symbolKinds && symbolKinds.length > 0) {
			const kindNumber = entity.kind.toString()
			if (!symbolKinds.includes(kindNumber)) {
				continue
			}
		}

		entities.push(entity)
	}

	return entities
}

/**
 * Convert a single DocumentSymbol to SymbolicEntity
 */
function convertDocumentSymbolToSymbolicEntity(
	docSymbol: vscode.DocumentSymbol,
	document: vscode.TextDocument,
	maxDepth: number,
	parent?: SymbolicEntity,
): SymbolicEntity {
	const entity: SymbolicEntity = {
		id: `${document.uri.fsPath}:${docSymbol.name}:${docSymbol.range.start.line}`,
		name: docSymbol.name,
		kind: docSymbol.kind,
		filePath: document.uri.fsPath,
		range: docSymbol.range,
		selectionRange: docSymbol.selectionRange,
		parent,
		detail: docSymbol.detail,
	}

	// Add children if within depth limit
	if (docSymbol.children && docSymbol.children.length > 0 && maxDepth > 1) {
		entity.children = docSymbol.children.map((child) =>
			convertDocumentSymbolToSymbolicEntity(child, document, maxDepth - 1, entity),
		)
	}

	return entity
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
