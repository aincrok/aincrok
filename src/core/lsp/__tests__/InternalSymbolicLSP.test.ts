// aincrok_change - new file
// Unit tests for Internal Symbolic LSP Layer

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as vscode from "vscode"
import { InternalSymbolicLSP } from "../InternalSymbolicLSP"
import { SymbolicEntity, SymbolicEdit } from "../types"

// Mock VS Code API
vi.mock("vscode", () => ({
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path, path })),
	},
	Range: vi.fn((start: any, end: any) => ({ start, end })),
	Position: vi.fn((line: number, character: number) => ({ line, character })),
	SymbolKind: {
		File: 1,
		Module: 2,
		Namespace: 3,
		Package: 4,
		Class: 5,
		Method: 6,
		Property: 7,
		Field: 8,
		Constructor: 9,
		Enum: 10,
		Interface: 11,
		Function: 12,
		Variable: 13,
		Constant: 14,
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
	},
	commands: {
		executeCommand: vi.fn(),
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/test/workspace" } }],
		openTextDocument: vi.fn(),
		applyEdit: vi.fn(),
		onDidChangeTextDocument: vi.fn(),
		onDidDeleteFiles: vi.fn(),
		onDidRenameFiles: vi.fn(),
	},
	WorkspaceEdit: vi.fn(() => ({
		replace: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
		entries: vi.fn(() => []),
	})),
}))

describe("InternalSymbolicLSP", () => {
	let lsp: InternalSymbolicLSP
	let mockContext: any

	beforeEach(() => {
		mockContext = {
			subscriptions: [],
		}

		// Reset the singleton instance
		// @ts-ignore - accessing private static member for testing
		InternalSymbolicLSP.instance = undefined

		lsp = InternalSymbolicLSP.getInstance(mockContext)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("initialization", () => {
		it("should create singleton instance", () => {
			const instance1 = InternalSymbolicLSP.getInstance(mockContext)
			const instance2 = InternalSymbolicLSP.getInstance(mockContext)

			expect(instance1).toBe(instance2)
		})

		it("should initialize successfully", async () => {
			const spy = vi.spyOn(console, "log")

			await lsp.initializeSymbolicAnalysis()

			expect(spy).toHaveBeenCalledWith("[Aincrok] Internal Symbolic LSP initialized successfully")
		})

		it("should handle initialization errors gracefully", async () => {
			const spy = vi.spyOn(console, "error")

			// Mock workspace to throw error
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockImplementation(() => {
				throw new Error("Test error")
			})

			await expect(lsp.initializeSymbolicAnalysis()).rejects.toThrow("Test error")
			expect(spy).toHaveBeenCalledWith("[Aincrok] Failed to initialize symbolic analysis:", expect.any(Error))
		})
	})

	describe("symbol finding", () => {
		beforeEach(async () => {
			await lsp.initializeSymbolicAnalysis()
		})

		it("should find symbols by name", async () => {
			const mockSymbols: vscode.SymbolInformation[] = [
				{
					name: "TestClass",
					kind: vscode.SymbolKind.Class,
					location: {
						uri: vscode.Uri.file("/test/file.ts"),
						range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 0)),
					},
					containerName: "TestModule",
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbols)

			const result = await lsp.findSymbolByName("TestClass")

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe("TestClass")
			expect(result[0].kind).toBe(vscode.SymbolKind.Class)
			expect(result[0].filePath).toBe("/test/file.ts")
		})

		it("should return empty array when no symbols found", async () => {
			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(null)

			const result = await lsp.findSymbolByName("NonExistentSymbol")

			expect(result).toEqual([])
		})

		it("should handle search errors gracefully", async () => {
			const spy = vi.spyOn(console, "error")
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("LSP error"))

			const result = await lsp.findSymbolByName("TestClass")

			expect(result).toEqual([])
			expect(spy).toHaveBeenCalledWith("[Aincrok] Error finding symbols by name:", expect.any(Error))
		})
	})

	describe("semantic context retrieval", () => {
		beforeEach(async () => {
			await lsp.initializeSymbolicAnalysis()
		})

		it("should retrieve semantic context for query", async () => {
			const mockSymbols: vscode.SymbolInformation[] = [
				{
					name: "testFunction",
					kind: vscode.SymbolKind.Function,
					location: {
						uri: vscode.Uri.file("/test/file.ts"),
						range: new vscode.Range(new vscode.Position(5, 0), new vscode.Position(15, 0)),
					},
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("function testFunction() { return 42; }"),
				languageId: "typescript",
			} as any)

			const result = await lsp.retrieveSemanticContext("testFunction", 1)

			expect(result.relevantSymbols).toHaveLength(1)
			expect(result.relevantSymbols[0].name).toBe("testFunction")
			expect(result.codeSnippets).toHaveLength(1)
			expect(result.codeSnippets[0].content).toBe("function testFunction() { return 42; }")
		})

		it("should handle context retrieval errors", async () => {
			const spy = vi.spyOn(console, "error")
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("Context error"))

			const result = await lsp.retrieveSemanticContext("test", 1)

			expect(result.relevantSymbols).toEqual([])
			expect(result.relationships).toEqual([])
			expect(result.codeSnippets).toEqual([])
			expect(spy).toHaveBeenCalledWith("[Aincrok] Error retrieving semantic context:", expect.any(Error))
		})
	})

	describe("symbol editing", () => {
		let mockSymbol: SymbolicEntity

		beforeEach(async () => {
			await lsp.initializeSymbolicAnalysis()

			mockSymbol = {
				id: "test-symbol",
				name: "testFunction",
				kind: vscode.SymbolKind.Function,
				filePath: "/test/file.ts",
				range: new vscode.Range(new vscode.Position(5, 0), new vscode.Position(15, 0)),
				selectionRange: new vscode.Range(new vscode.Position(5, 9), new vscode.Position(5, 21)),
			}
		})

		it("should perform replace edit successfully", async () => {
			const mockDocument = {
				isUntitled: false,
				uri: { scheme: "file" },
				getText: vi.fn().mockReturnValue("function testFunction() { return 42; }"),
			}

			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDocument as any)
			vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true)

			const edit: SymbolicEdit = {
				type: "replace",
				symbol: mockSymbol,
				newContent: "function testFunction() { return 100; }",
			}

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(true)
			expect(result.modifiedFiles).toContain("/test/file.ts")
			expect(vscode.workspace.applyEdit).toHaveBeenCalled()
		})

		it("should handle rename edit with references", async () => {
			const mockRenameEdit = new vscode.WorkspaceEdit()

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockRenameEdit)

			const edit: SymbolicEdit = {
				type: "rename",
				symbol: mockSymbol,
				newName: "newTestFunction",
				updateReferences: true,
			}

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(true)
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"vscode.executeDocumentRenameProvider",
				expect.any(Object),
				expect.any(Object),
				"newTestFunction",
			)
		})

		it("should validate edit safety", async () => {
			const mockDocument = {
				isUntitled: false,
				uri: { scheme: "file" },
				getText: vi.fn().mockReturnValue("function testFunction() { return 42; }"),
			}

			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDocument as any)

			const edit: SymbolicEdit = {
				type: "replace",
				symbol: mockSymbol,
				newContent: "",
			}

			const validation = await lsp.validateSymbolicEditSafety(edit)

			expect(validation.safe).toBe(false)
			expect(validation.warnings).toContain("Replacement content is empty")
		})

		it("should handle edit errors gracefully", async () => {
			const spy = vi.spyOn(console, "error")
			vi.mocked(vscode.workspace.openTextDocument).mockRejectedValue(new Error("File not found"))

			const edit: SymbolicEdit = {
				type: "replace",
				symbol: mockSymbol,
				newContent: "new content",
			}

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(false)
			expect(result.errors).toHaveLength(1)
			expect(spy).toHaveBeenCalledWith("[Aincrok] Error editing symbol:", expect.any(Error))
		})
	})

	describe("prompt enhancement", () => {
		beforeEach(async () => {
			await lsp.initializeSymbolicAnalysis()
		})

		it("should enhance prompt with semantic context", async () => {
			const mockSymbols: vscode.SymbolInformation[] = [
				{
					name: "TestClass",
					kind: vscode.SymbolKind.Class,
					location: {
						uri: vscode.Uri.file("/test/file.ts"),
						range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 0)),
					},
					containerName: "TestModule",
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbols)
			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("class TestClass {}"),
				languageId: "typescript",
			} as any)

			const result = await lsp.getSemanticContextForPrompt("help me understand TestClass")

			expect(result.enhancedPrompt).toContain("TestClass")
			expect(result.enhancedPrompt).toContain("Relevant code symbols")
			expect(result.semanticContext.relevantSymbols).toHaveLength(1)
			expect(result.tokenOptimization.before).toBeGreaterThan(0)
		})

		it("should handle prompt enhancement errors", async () => {
			const spy = vi.spyOn(console, "error")
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("Enhancement error"))

			const result = await lsp.getSemanticContextForPrompt("test prompt")

			expect(result.enhancedPrompt).toBe("test prompt")
			expect(result.tokenOptimization.reduction).toBe(0)
			expect(spy).toHaveBeenCalledWith("[Aincrok] Error getting semantic context for prompt:", expect.any(Error))
		})
	})
})
