// aincrok_change - new file
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ListCodeDefinitionNamesToolLSP } from "../ListCodeDefinitionNamesToolLSP"
import * as vscode from "vscode"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

// Mock listCodeDefinitionNamesTool
vi.mock("../listCodeDefinitionNamesTool", () => ({
	listCodeDefinitionNamesTool: vi.fn(() => Promise.resolve()),
}))

// Mock VS Code
vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn((key: string) => {
				switch (key) {
					case "enableLSPEnhancements":
						return true
					case "fallbackToTextMode":
						return true
					default:
						return undefined
				}
			}),
		})),
	},
	window: {
		showErrorMessage: vi.fn(),
	},
	Uri: {
		file: vi.fn((path: string) => ({ path, fsPath: path })),
	},
	SymbolKind: {
		File: 0,
		Module: 1,
		Namespace: 2,
		Package: 3,
		Class: 4,
		Method: 5,
		Property: 6,
		Field: 7,
		Constructor: 8,
		Enum: 9,
		Interface: 10,
		Function: 11,
		Variable: 12,
		Constant: 13,
		0: "File",
		1: "Module",
		2: "Namespace",
		3: "Package",
		4: "Class",
		5: "Method",
		6: "Property",
		7: "Field",
		8: "Constructor",
		9: "Enum",
		10: "Interface",
		11: "Function",
		12: "Variable",
		13: "Constant",
	},
}))

// Mock listCodeDefinitionNamesTool
vi.mock("../listCodeDefinitionNamesTool", () => ({
	listCodeDefinitionNamesTool: vi.fn(() => Promise.resolve()),
}))

// Mock LSP components
vi.mock("../../lsp/InternalSymbolicLSP", () => ({
	InternalSymbolicLSP: {
		getInstance: vi.fn(() => ({
			searchWorkspaceSymbols: vi.fn(() => Promise.resolve([])),
			getDocumentSymbols: vi.fn(() =>
				Promise.resolve([
					{
						name: "TestClass",
						kind: 4, // Class
						detail: "Main test class",
						range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } },
						selectionRange: { start: { line: 0, character: 6 }, end: { line: 0, character: 15 } },
						children: [
							{
								name: "constructor",
								kind: 8, // Constructor
								detail: "(value: string)",
								range: { start: { line: 2, character: 4 }, end: { line: 4, character: 4 } },
								selectionRange: { start: { line: 2, character: 4 }, end: { line: 2, character: 15 } },
								children: [],
							},
							{
								name: "getValue",
								kind: 5, // Method
								detail: "(): string",
								range: { start: { line: 6, character: 4 }, end: { line: 8, character: 4 } },
								selectionRange: { start: { line: 6, character: 4 }, end: { line: 6, character: 12 } },
								children: [],
							},
							{
								name: "value",
								kind: 6, // Property
								detail: "string",
								range: { start: { line: 1, character: 4 }, end: { line: 1, character: 17 } },
								selectionRange: { start: { line: 1, character: 4 }, end: { line: 1, character: 9 } },
								children: [],
							},
						],
					},
					{
						name: "testFunction",
						kind: 11, // Function
						detail: "(param: string): boolean",
						range: { start: { line: 22, character: 0 }, end: { line: 24, character: 0 } },
						selectionRange: { start: { line: 22, character: 9 }, end: { line: 22, character: 21 } },
						children: [],
					},
					{
						name: "TEST_CONSTANT",
						kind: 13, // Constant
						detail: "string",
						range: { start: { line: 26, character: 0 }, end: { line: 26, character: 13 } },
						selectionRange: { start: { line: 26, character: 6 }, end: { line: 26, character: 19 } },
						children: [],
					},
				]),
			),
		})),
	},
}))

describe("ListCodeDefinitionNamesToolLSP", () => {
	let listTool: ListCodeDefinitionNamesToolLSP
	let mockTask: Partial<Task>
	let mockBlock: Partial<ToolUse>
	let mockAskApproval: AskApproval
	let mockHandleError: HandleError
	let mockPushToolResult: PushToolResult
	let mockRemoveClosingTag: RemoveClosingTag

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		listTool = new ListCodeDefinitionNamesToolLSP()

		mockTask = {
			cwd: "/test",
		}

		mockBlock = {
			params: {
				path: "test.ts",
			},
			partial: false,
		}

		mockAskApproval = vi.fn(() => Promise.resolve(true))
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn((tag, content) => content)

		// Mock configuration
		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string) => {
				switch (key) {
					case "enableLSPEnhancements":
						return true
					case "fallbackToTextMode":
						return true
					default:
						return undefined
				}
			}),
			has: vi.fn(() => true),
			inspect: vi.fn(() => ({
				key: "test",
				defaultValue: undefined,
				globalValue: undefined,
				workspaceValue: undefined,
			})),
			update: vi.fn(() => Promise.resolve()),
		} as vscode.WorkspaceConfiguration)
	})

	describe("LSP Enhancement Detection", () => {
		it("should detect when LSP enhancements are enabled", () => {
			expect(listTool["isLSPEnabled"]()).toBe(true)
		})

		it("should detect when fallback is enabled", () => {
			expect(listTool["shouldFallbackToTextMode"]()).toBe(true)
		})

		it("should detect LSP availability", async () => {
			const isAvailable = await listTool["isLSPAvailable"]()
			expect(isAvailable).toBe(true)
		})

		it("should handle LSP unavailability", async () => {
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				get: vi.fn(() => false), // Disable LSP
				has: vi.fn(() => true),
				inspect: vi.fn(() => ({
					key: "test",
					defaultValue: undefined,
					globalValue: undefined,
					workspaceValue: undefined,
				})),
				update: vi.fn(() => Promise.resolve()),
			} as vscode.WorkspaceConfiguration)

			const listTool2 = new ListCodeDefinitionNamesToolLSP()
			const isAvailable = await listTool2["isLSPAvailable"]()
			expect(isAvailable).toBe(false)
		})
	})

	describe("LSP Symbol Discovery", () => {
		it("should enhance code definitions with LSP symbol discovery", async () => {
			// Mock listCodeDefinitionNamesTool to resolve with some content
			const { listCodeDefinitionNamesTool } = await import("../listCodeDefinitionNamesTool")
			vi.mocked(listCodeDefinitionNamesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original code definitions")
				},
			)

			await listTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockPushToolResult).toHaveBeenCalled()

			// Get the enhanced result
			const callArgs = vi.mocked(mockPushToolResult).mock.calls[0]
			const enhancedContent = callArgs[0] as string

			expect(enhancedContent).toContain("LSP Symbol Discovery")
		})

		it("should process document symbols correctly", () => {
			const mockSymbols = [
				{
					name: "TestClass",
					kind: 4, // Class
					detail: "Main test class",
					range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } },
					selectionRange: { start: { line: 0, character: 6 }, end: { line: 0, character: 15 } },
					children: [
						{
							name: "getValue",
							kind: 5, // Method
							detail: "(): string",
							range: { start: { line: 6, character: 4 }, end: { line: 8, character: 4 } },
							selectionRange: { start: { line: 6, character: 4 }, end: { line: 6, character: 12 } },
							children: [],
						},
					],
				},
			]

			const result = listTool["processDocumentSymbols"](
				mockSymbols as unknown as vscode.DocumentSymbol[],
				"/test/test.ts",
			)

			expect(result).toHaveLength(2) // TestClass + getValue
			expect(result[0].name).toBe("TestClass")
			expect(result[0].kind).toBe("Class")
			expect(result[1].name).toBe("getValue")
			expect(result[1].kind).toBe("Method")
			expect(result[1].containerName).toBe("TestClass")
		})

		it("should generate comprehensive symbol context", () => {
			const mockEnhancedSymbols = [
				{
					name: "TestClass",
					kind: "Class",
					detail: "Main test class",
					line: 1,
					filePath: "/test/test.ts",
				},
				{
					name: "getValue",
					kind: "Method",
					detail: "(): string",
					line: 7,
					filePath: "/test/test.ts",
					containerName: "TestClass",
				},
				{
					name: "testFunction",
					kind: "Function",
					detail: "(param: string): boolean",
					line: 23,
					filePath: "/test/test.ts",
				},
			]

			const languageInfo = { language: "typescript", confidence: 0.9, isSupported: true }
			const context = listTool["generateSymbolContext"](mockEnhancedSymbols, languageInfo)

			expect(context).toContain("Found 3 symbols via LSP (typescript)")
			expect(context).toContain("Class")
			expect(context).toContain("TestClass")
			expect(context).toContain("Method")
			expect(context).toContain("getValue")
			expect(context).toContain("Function")
			expect(context).toContain("testFunction")
		})

		it("should organize symbols by kind with proper ordering", () => {
			const mockEnhancedSymbols = [
				{ name: "testVar", kind: "Variable", line: 30, filePath: "/test/test.ts" },
				{ name: "TestClass", kind: "Class", line: 1, filePath: "/test/test.ts" },
				{ name: "testFunction", kind: "Function", line: 23, filePath: "/test/test.ts" },
				{ name: "getValue", kind: "Method", line: 7, filePath: "/test/test.ts" },
			]

			const languageInfo = { language: "typescript", confidence: 0.9, isSupported: true }
			const context = listTool["generateSymbolContext"](mockEnhancedSymbols, languageInfo)

			// Should organize in proper order: Class, Function, Method, Variable
			const classIndex = context.indexOf("Class")
			const functionIndex = context.indexOf("Function")
			const methodIndex = context.indexOf("Method")
			const variableIndex = context.indexOf("Variable")

			expect(classIndex).toBeLessThan(functionIndex)
			expect(functionIndex).toBeLessThan(methodIndex)
			expect(methodIndex).toBeLessThan(variableIndex)
		})

		it("should handle empty symbol arrays gracefully", () => {
			const languageInfo = { language: "typescript", confidence: 0.9, isSupported: true }
			const context = listTool["generateSymbolContext"]([], languageInfo)

			expect(context).toContain("No symbols found via LSP")
		})

		it("should limit symbols per kind to avoid overwhelming output", () => {
			// Create 15 methods (more than the 10 limit)
			const manyMethods = Array.from({ length: 15 }, (_, i) => ({
				name: `method${i}`,
				kind: "Method",
				line: i + 1,
				filePath: "/test/test.ts",
			}))

			const languageInfo = { language: "typescript", confidence: 0.9, isSupported: true }
			const context = listTool["generateSymbolContext"](manyMethods, languageInfo)

			expect(context).toContain("Methods (15)")
			expect(context).toContain("... and 5 more")
		})
	})

	describe("Performance and Statistics", () => {
		it("should track symbol discovery statistics", async () => {
			await listTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = listTool.getStats()
			expect(stats.totalExecutions).toBe(1)
			expect(stats.lspExecutions).toBeGreaterThanOrEqual(0)
			expect(stats.fallbackExecutions).toBeGreaterThanOrEqual(0)
		})

		it("should update timing statistics", () => {
			// Simulate LSP executions first to initialize timing stats properly
			listTool["stats"].lspExecutions = 1
			listTool["updateTimingStats"](150)
			listTool["stats"].lspExecutions = 2
			listTool["updateTimingStats"](250)

			const stats = listTool.getStats()
			expect(stats.averageLspTime).toBeGreaterThan(0)
		})

		it("should update symbol count statistics", () => {
			// Simulate LSP executions first to initialize symbol stats properly
			listTool["stats"].lspExecutions = 1
			listTool["updateSymbolStats"](5)
			listTool["stats"].lspExecutions = 2
			listTool["updateSymbolStats"](10)

			const stats = listTool.getStats()
			expect(stats.averageSymbolCount).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle missing file path parameter", async () => {
			const incompleteBlock = {
				params: {},
				partial: false,
			}

			await listTool.execute(
				mockTask as Task,
				incompleteBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = listTool.getStats()
			expect(stats.fallbackExecutions).toBe(1)
		})

		it("should handle LSP errors gracefully", async () => {
			// Mock LSP to throw error
			const { InternalSymbolicLSP } = await import("../../lsp/InternalSymbolicLSP")
			vi.mocked(InternalSymbolicLSP.getInstance).mockReturnValue({
				searchWorkspaceSymbols: vi.fn(() => Promise.reject(new Error("LSP error"))),
				getDocumentSymbols: vi.fn(() => Promise.reject(new Error("LSP error"))),
			} as unknown as any)

			await listTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Should fallback gracefully
			const stats = listTool.getStats()
			expect(stats.totalExecutions).toBe(1)
		})

		it("should fallback for unsupported file types", async () => {
			const unsupportedBlock = {
				params: {
					path: "test.txt", // Unsupported file type
				},
				partial: false,
			}

			await listTool.execute(
				mockTask as Task,
				unsupportedBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = listTool.getStats()
			expect(stats.fallbackExecutions).toBe(1)
		})

		it("should fallback when LSP is disabled", async () => {
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				get: vi.fn((key: string) => {
					if (key === "enableLSPEnhancements") return false
					return true
				}),
				has: vi.fn(() => true),
				inspect: vi.fn(() => ({
					key: "test",
					defaultValue: undefined,
					globalValue: undefined,
					workspaceValue: undefined,
				})),
				update: vi.fn(() => Promise.resolve()),
			} as vscode.WorkspaceConfiguration)

			const listTool2 = new ListCodeDefinitionNamesToolLSP()

			await listTool2.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = listTool2.getStats()
			expect(stats.fallbackExecutions).toBe(1)
		})
	})

	describe("Language Detection", () => {
		it("should detect TypeScript files", () => {
			const languageInfo = listTool["detectLanguage"]({ path: "test.ts" })
			expect(languageInfo.language).toBe("typescript")
			expect(languageInfo.isSupported).toBe(true)
			expect(languageInfo.confidence).toBe(0.9)
		})

		it("should detect JavaScript files", () => {
			const languageInfo = listTool["detectLanguage"]({ path: "test.js" })
			expect(languageInfo.language).toBe("javascript")
			expect(languageInfo.isSupported).toBe(true)
			expect(languageInfo.confidence).toBe(0.9)
		})

		it("should handle unsupported file types", () => {
			const languageInfo = listTool["detectLanguage"]({ path: "test.py" })
			expect(languageInfo.language).toBe("python")
			expect(languageInfo.isSupported).toBe(false) // Mock only supports TS/JS
		})

		it("should handle missing file paths", () => {
			const languageInfo = listTool["detectLanguage"]({})
			expect(languageInfo.language).toBe("plaintext")
			expect(languageInfo.isSupported).toBe(false)
		})
	})

	describe("Symbol Type Descriptions", () => {
		it("should get correct symbol type descriptions", () => {
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Class)).toBe("Class")
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Method)).toBe("Method")
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Function)).toBe("Function")
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Variable)).toBe("Variable")
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Property)).toBe("Property")
			expect(listTool["getSymbolTypeDescription"](vscode.SymbolKind.Constructor)).toBe("Constructor")
		})

		it("should handle unknown symbol kinds", () => {
			const result = listTool["getSymbolTypeDescription"](999 as vscode.SymbolKind)
			expect(result).toContain("Unknown")
		})
	})

	describe("Integration with Original Tool", () => {
		it("should call original tool for non-LSP supported scenarios", async () => {
			const { listCodeDefinitionNamesTool } = await import("../listCodeDefinitionNamesTool")

			// Disable LSP
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				get: vi.fn(() => false),
				has: vi.fn(() => true),
				inspect: vi.fn(() => ({
					key: "test",
					defaultValue: undefined,
					globalValue: undefined,
					workspaceValue: undefined,
				})),
				update: vi.fn(() => Promise.resolve()),
			} as vscode.WorkspaceConfiguration)

			const listTool2 = new ListCodeDefinitionNamesToolLSP()

			await listTool2.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(listCodeDefinitionNamesTool).toHaveBeenCalled()
		})

		it("should preserve all original tool functionality", async () => {
			const { listCodeDefinitionNamesTool } = await import("../listCodeDefinitionNamesTool")

			await listTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Original tool should be called as part of the process
			expect(listCodeDefinitionNamesTool).toHaveBeenCalledWith(
				mockTask,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				expect.any(Function), // LSP-enhanced pushToolResult
				mockRemoveClosingTag,
			)
		})
	})
})
