// aincrok_change - new file
// Unit tests for Internal Symbolic LSP

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as vscode from "vscode"
import { InternalSymbolicLSP } from "../InternalSymbolicLSP"

// Mock VS Code API
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
		Variable: 13,
		5: "Class",
		12: "Function",
		6: "Method",
		13: "Variable",
	},
	commands: {
		executeCommand: vi.fn(),
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/test/workspace" } }],
		onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
		onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
		onDidCloseTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
		onDidDeleteFiles: vi.fn(() => ({ dispose: vi.fn() })),
		onDidRenameFiles: vi.fn(() => ({ dispose: vi.fn() })),
		openTextDocument: vi.fn(),
	},
	window: {
		showErrorMessage: vi.fn(),
		showWarningMessage: vi.fn(),
	},
	Disposable: {
		from: vi.fn(() => ({ dispose: vi.fn() })),
	},
}))

describe("InternalSymbolicLSP", () => {
	let mockContext: any
	let lsp: InternalSymbolicLSP

	beforeEach(() => {
		mockContext = {
			subscriptions: [],
			extensionPath: "/test/extension",
			globalStorageUri: { fsPath: "/test/storage" },
		}

		// Reset the singleton instance
		;(InternalSymbolicLSP as any)._instance = undefined
		lsp = InternalSymbolicLSP.getInstance(mockContext)

		// Clear all mocks
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("initialization", () => {
		it("should initialize successfully", async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidOpenTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidDeleteFiles).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidRenameFiles).mockReturnValue({ dispose: vi.fn() })

			await expect(lsp.initializeSymbolicAnalysis()).resolves.not.toThrow()
		})

		it("should handle initialization errors gracefully", async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockImplementation(() => {
				throw new Error("Initialization failed")
			})

			await expect(lsp.initializeSymbolicAnalysis()).rejects.toThrow("Initialization failed")
		})

		it("should be a singleton", () => {
			const instance1 = InternalSymbolicLSP.getInstance(mockContext)
			const instance2 = InternalSymbolicLSP.getInstance(mockContext)
			expect(instance1).toBe(instance2)
		})
	})

	describe("symbol finding", () => {
		beforeEach(async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidOpenTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidDeleteFiles).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidRenameFiles).mockReturnValue({ dispose: vi.fn() })
			await lsp.initializeSymbolicAnalysis()
		})

		it("should find symbols by name", async () => {
			const mockSymbolInformation: vscode.SymbolInformation[] = [
				{
					name: "TestFunction",
					kind: vscode.SymbolKind.Function,
					location: {
						uri: vscode.Uri.file("/test/file.ts"),
						range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
					},
					containerName: "",
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbolInformation)

			const result = await lsp.findSymbolByName("TestFunction")

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe("TestFunction")
			expect(result[0].kind).toBe(vscode.SymbolKind.Function)
		})

		it("should return empty array when no symbols found", async () => {
			vi.mocked(vscode.commands.executeCommand).mockResolvedValue([])

			const result = await lsp.findSymbolByName("NonExistentSymbol")

			expect(result).toHaveLength(0)
		})

		it("should handle search errors gracefully", async () => {
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("Search failed"))

			await expect(lsp.findSymbolByName("TestFunction")).rejects.toThrow("Search failed")
		})
	})

	describe("semantic context retrieval", () => {
		beforeEach(async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidOpenTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidDeleteFiles).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidRenameFiles).mockReturnValue({ dispose: vi.fn() })
			await lsp.initializeSymbolicAnalysis()
		})

		it("should retrieve semantic context for query", async () => {
			const mockSymbols: vscode.SymbolInformation[] = [
				{
					name: "TestClass",
					kind: vscode.SymbolKind.Class,
					location: {
						uri: vscode.Uri.file("/test/file.ts"),
						range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 0)),
					},
					containerName: "",
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbols)

			const result = await lsp.retrieveSemanticContext("TestClass", 2)

			expect(result.relevantSymbols).toHaveLength(1)
			expect(result.relevantSymbols[0].name).toBe("TestClass")
		})

		it("should handle context retrieval errors", async () => {
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("Context retrieval failed"))

			await expect(lsp.retrieveSemanticContext("TestClass", 2)).rejects.toThrow("Context retrieval failed")
		})
	})

	describe("symbol editing", () => {
		beforeEach(async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidOpenTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidDeleteFiles).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidRenameFiles).mockReturnValue({ dispose: vi.fn() })
			await lsp.initializeSymbolicAnalysis()
		})

		it("should perform replace edit successfully", async () => {
			const mockSymbol = {
				id: "test:symbol",
				name: "TestFunction",
				kind: vscode.SymbolKind.Function,
				filePath: "/test/file.ts",
				range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
				selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
			}

			const edit = {
				type: "replace" as const,
				symbol: mockSymbol,
				newContent: "function NewTestFunction() { return 42; }",
			}

			vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({
				getText: vi.fn().mockReturnValue("function TestFunction() { return 0; }"),
				save: vi.fn().mockResolvedValue(true),
			} as any)

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(true)
			expect(result.modifiedFiles).toContain("/test/file.ts")
		})

		it("should handle rename edit with references", async () => {
			const mockSymbol = {
				id: "test:symbol",
				name: "TestFunction",
				kind: vscode.SymbolKind.Function,
				filePath: "/test/file.ts",
				range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
				selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
			}

			const edit = {
				type: "rename" as const,
				symbol: mockSymbol,
				newName: "NewTestFunction",
				updateReferences: true,
			}

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue([
				{
					uri: vscode.Uri.file("/test/file.ts"),
					range: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
				},
			])

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(true)
		})

		it("should validate edit safety", async () => {
			const mockSymbol = {
				id: "test:symbol",
				name: "TestFunction",
				kind: vscode.SymbolKind.Function,
				filePath: "/test/file.ts",
				range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
				selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
			}

			const edit = {
				type: "delete" as const,
				symbol: mockSymbol,
			}

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue([
				{
					uri: vscode.Uri.file("/test/file.ts"),
					range: new vscode.Range(new vscode.Position(10, 0), new vscode.Position(10, 12)),
				},
			])

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			// Should detect that symbol has references and warn about unsafe deletion
			expect(result.warnings).toBeDefined()
		})

		it("should handle edit errors gracefully", async () => {
			const mockSymbol = {
				id: "test:symbol",
				name: "TestFunction",
				kind: vscode.SymbolKind.Function,
				filePath: "/test/file.ts",
				range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(5, 0)),
				selectionRange: new vscode.Range(new vscode.Position(0, 9), new vscode.Position(0, 21)),
			}

			const edit = {
				type: "replace" as const,
				symbol: mockSymbol,
				newContent: "invalid syntax {{{",
			}

			vi.mocked(vscode.workspace.openTextDocument).mockRejectedValue(new Error("File not found"))

			const result = await lsp.editSymbolPrecisely(mockSymbol, edit)

			expect(result.success).toBe(false)
			expect(result.errors).toBeDefined()
			expect(result.errors![0]).toContain("File not found")
		})
	})

	describe("prompt optimization", () => {
		beforeEach(async () => {
			vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidOpenTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidDeleteFiles).mockReturnValue({ dispose: vi.fn() })
			vi.mocked(vscode.workspace.onDidRenameFiles).mockReturnValue({ dispose: vi.fn() })
			await lsp.initializeSymbolicAnalysis()
		})

		it("should provide prompt optimization context", async () => {
			const userRequest = "Find all classes that implement UserService"

			const mockSymbols: vscode.SymbolInformation[] = [
				{
					name: "UserServiceImpl",
					kind: vscode.SymbolKind.Class,
					location: {
						uri: vscode.Uri.file("/test/services.ts"),
						range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(20, 0)),
					},
					containerName: "",
				},
			]

			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(mockSymbols)

			const result = await lsp.getSemanticContextForPrompt(userRequest)

			expect(result.userRequest).toBe(userRequest)
			expect(result.semanticContext.relevantSymbols).toHaveLength(1)
			expect(result.enhancedPrompt).toContain("UserServiceImpl")
			expect(result.tokenOptimization.before).toBeGreaterThan(0)
		})

		it("should handle prompt optimization errors", async () => {
			vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("Prompt optimization failed"))

			await expect(lsp.getSemanticContextForPrompt("test request")).rejects.toThrow("Prompt optimization failed")
		})
	})
})
