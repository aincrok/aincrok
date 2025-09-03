// aincrok_change - new file
// Unit tests for semantic read file tool

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as vscode from "vscode"
import { semanticReadFileTool } from "../semanticReadFileTool"
import { InternalSymbolicLSP } from "../../../lsp/InternalSymbolicLSP"

// Mock VS Code API and dependencies
vi.mock("vscode", () => ({
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path, path })),
	},
	Range: vi.fn((start: any, end: any) => ({ start, end })),
	Position: vi.fn((line: number, character: number) => ({ line, character })),
	SymbolKind: {
		Class: 5,
		Function: 12,
		Method: 6,
		5: "Class",
		12: "Function",
		6: "Method",
	},
	commands: {
		executeCommand: vi.fn(),
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/test/workspace" } }],
		openTextDocument: vi.fn(),
	},
}))

vi.mock("../../../lsp/InternalSymbolicLSP", () => ({
	InternalSymbolicLSP: {
		getInstance: vi.fn(() => ({
			initializeSymbolicAnalysis: vi.fn(),
		})),
	},
}))

vi.mock("../../../../utils/fs", () => ({
	extractTextFromFile: vi.fn(),
}))

vi.mock("../../helpers/path", () => ({
	getReadablePath: vi.fn((cwd: string, path: string) => path),
	isPathOutsideWorkspace: vi.fn(() => false),
}))

describe("semanticReadFileTool", () => {
	let mockTask: any
	let mockBlock: any
	let mockAskApproval: any
	let mockHandleError: any
	let mockPushToolResult: any
	let mockRemoveClosingTag: any
	let mockLsp: any

	beforeEach(() => {
		mockTask = {
			context: {},
			consecutiveMistakeCount: 0,
			recordToolError: vi.fn(),
			sayAndCreateMissingParamError: vi.fn().mockResolvedValue("Missing parameter error"),
			fileContextTracker: {
				trackFileContext: vi.fn(),
			},
			ask: vi.fn(),
			didRejectTool: false,
		}

		mockBlock = {
			params: {
				path: "test.ts",
			},
			partial: false,
		}

		mockAskApproval = vi.fn().mockResolvedValue(true)
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn((tag: string, content?: string) => content || "")

		mockLsp = {
			initializeSymbolicAnalysis: vi.fn().mockResolvedValue(undefined),
		}

		vi.mocked(InternalSymbolicLSP.getInstance).mockReturnValue(mockLsp as any)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("parameter validation", () => {
		it("should handle missing path parameter", async () => {
			mockBlock.params.path = undefined

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(mockTask.recordToolError).toHaveBeenCalledWith("semantic_read_file")
			expect(mockTask.sayAndCreateMissingParamError).toHaveBeenCalledWith("semantic_read_file", "path")
		})
	})

	describe("LSP initialization", () => {
		it("should initialize LSP successfully", async () => {
			const mockDocumentSymbols: vscode.DocumentSymbol[] = [
				{
					name: "TestClass",
					kind: vscode.SymbolKind.Class,
					range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 0)),
					selectionRange: new vscode.Range(new vscode.Position(0, 6), new vscode.Position(0, 15)),
					children: [],
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockDocumentSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("class TestClass {}"),
				languageId: "typescript",
			} as any)

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockLsp.initializeSymbolicAnalysis).toHaveBeenCalled()
			expect(mockAskApproval).toHaveBeenCalled()
			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining('semantic_analysis success="true"'))
		})

		it("should fallback to text-based reading when LSP fails", async () => {
			mockLsp.initializeSymbolicAnalysis.mockRejectedValue(new Error("LSP failed"))

			const { extractTextFromFile } = await import("../../../../utils/fs")
			vi.mocked(extractTextFromFile).mockResolvedValue("file content")

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				{ fallbackToTextBased: true } as any,
			)

			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining('semantic_analysis success="false" fallback="text_based"'),
			)
		})
	})

	describe("semantic analysis", () => {
		beforeEach(() => {
			mockLsp.initializeSymbolicAnalysis.mockResolvedValue(undefined)
		})

		it("should analyze symbols successfully", async () => {
			const mockDocumentSymbols: vscode.DocumentSymbol[] = [
				{
					name: "TestFunction",
					kind: vscode.SymbolKind.Function,
					range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
					selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
					children: [],
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockDocumentSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("function TestFunction() {}"),
				languageId: "typescript",
			} as any)

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining('<symbol name="TestFunction" kind="Function"'),
			)
		})

		it("should handle symbol filtering by query", async () => {
			mockBlock.params.symbol_query = "Test"

			const mockDocumentSymbols: vscode.DocumentSymbol[] = [
				{
					name: "TestFunction",
					kind: vscode.SymbolKind.Function,
					range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
					selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
					children: [],
				},
				{
					name: "OtherFunction",
					kind: vscode.SymbolKind.Function,
					range: new vscode.Range(new vscode.Position(6, 0), new vscode.Position(10, 0)),
					selectionRange: new vscode.Range(new vscode.Position(6, 9), new vscode.Position(6, 22)),
					children: [],
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockDocumentSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("function TestFunction() {}"),
				languageId: "typescript",
			} as any)

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const result = mockPushToolResult.mock.calls[0][0]
			expect(result).toContain("TestFunction")
			// Should only contain the filtered symbol
			expect(result).toContain('count="1"')
		})

		it("should handle symbol filtering by kind", async () => {
			mockBlock.params.symbol_kinds = ["12"] // Function kind

			const mockDocumentSymbols: vscode.DocumentSymbol[] = [
				{
					name: "TestClass",
					kind: vscode.SymbolKind.Class,
					range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 0)),
					selectionRange: new vscode.Range(new vscode.Position(0, 6), new vscode.Position(0, 15)),
					children: [],
				},
				{
					name: "TestFunction",
					kind: vscode.SymbolKind.Function,
					range: new vscode.Range(new vscode.Position(11, 0), new vscode.Position(15, 0)),
					selectionRange: new vscode.Range(new vscode.Position(11, 9), new vscode.Position(11, 21)),
					children: [],
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockDocumentSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("function TestFunction() {}"),
				languageId: "typescript",
			} as any)

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const result = mockPushToolResult.mock.calls[0][0]
			expect(result).toContain("TestFunction")
			expect(result).not.toContain("TestClass")
		})

		it("should handle files with no symbols", async () => {
			vi.mocked(vscode.commands.executeCommand).mockResolvedValue([])

			const { extractTextFromFile } = await import("../../../../utils/fs")
			vi.mocked(extractTextFromFile).mockResolvedValue("// empty file")

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const result = mockPushToolResult.mock.calls[0][0]
			expect(result).toContain('semantic_analysis success="false"')
			expect(result).toContain("No symbols found in file")
		})
	})

	describe("partial requests", () => {
		it("should handle partial requests correctly", async () => {
			mockBlock.partial = true

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockTask.ask).toHaveBeenCalledWith(
				"tool",
				expect.stringContaining("Analyzing file with semantic understanding"),
				true,
			)
		})
	})

	describe("approval workflow", () => {
		it("should handle approval rejection", async () => {
			mockAskApproval.mockResolvedValue(false)

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockTask.didRejectTool).toBe(true)
			expect(mockPushToolResult).not.toHaveBeenCalled()
		})

		it("should proceed when approved", async () => {
			const mockDocumentSymbols: vscode.DocumentSymbol[] = []
			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockDocumentSymbols)

			const { extractTextFromFile } = await import("../../../../utils/fs")
			vi.mocked(extractTextFromFile).mockResolvedValue("file content")

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockAskApproval).toHaveBeenCalled()
			expect(mockTask.fileContextTracker.trackFileContext).toHaveBeenCalledWith("test.ts", "semantic_read_tool")
			expect(mockPushToolResult).toHaveBeenCalled()
		})
	})

	describe("error handling", () => {
		it("should handle semantic analysis errors with fallback enabled", async () => {
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("LSP error"))

			const { extractTextFromFile } = await import("../../../../utils/fs")
			vi.mocked(extractTextFromFile).mockResolvedValue("file content")

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				{ fallbackToTextBased: true } as any,
			)

			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining('fallback="text_based"'))
		})

		it("should handle semantic analysis errors without fallback", async () => {
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("LSP error"))

			await semanticReadFileTool(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				{ fallbackToTextBased: false } as any,
			)

			expect(mockHandleError).toHaveBeenCalledWith("semantic file analysis", expect.any(Error))
		})
	})
})
