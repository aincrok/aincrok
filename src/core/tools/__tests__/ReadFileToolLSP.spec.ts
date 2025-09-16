// aincrok_change - new file
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ReadFileToolLSP } from "../ReadFileToolLSP"
import { readFileTool } from "../readFileTool"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

// Mock the original readFileTool
vi.mock("../readFileTool", () => ({
	readFileTool: vi.fn(),
}))

// Mock VS Code and LSP components
vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn((key: string) => {
				switch (key) {
					case "enableLSPEnhancements":
						return true
					case "enableSemanticMode":
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
	},
}))

// Mock LSP Client Manager
vi.mock("../../lsp/LSPClientManager", () => ({
	LSPClientManager: {
		getInstance: vi.fn(() => ({
			isLanguageSupported: vi.fn(() => true),
		})),
	},
}))

// Mock Memory Manager
vi.mock("../../lsp/MemoryManager", () => ({
	MemoryManager: {
		getInstance: vi.fn(() => ({})),
	},
}))

vi.mock("../../lsp/InternalSymbolicLSP", () => ({
	InternalSymbolicLSP: {
		getInstance: vi.fn(() => ({
			isInitialized: vi.fn(() => Promise.resolve(true)),
			getSymbols: vi.fn(() =>
				Promise.resolve([
					{
						name: "TestClass",
						kind: 5,
						range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
					},
					{
						name: "testMethod",
						kind: 6,
						range: { start: { line: 2, character: 2 }, end: { line: 8, character: 2 } },
					},
				]),
			),
			getSemanticTokens: vi.fn(() =>
				Promise.resolve([
					{ line: 1, char: 0, length: 5, tokenType: "keyword", tokenModifiers: [] },
					{ line: 1, char: 6, length: 9, tokenType: "class", tokenModifiers: [] },
				]),
			),
		})),
	},
}))

describe("ReadFileToolLSP", () => {
	let mockCline: Partial<Task>
	let mockBlock: ToolUse
	let mockAskApproval: AskApproval
	let mockHandleError: HandleError
	let mockPushToolResult: PushToolResult
	let mockRemoveClosingTag: RemoveClosingTag
	let lspTool: ReadFileToolLSP

	beforeEach(() => {
		vi.clearAllMocks()

		// Mock Task instance
		mockCline = {
			cwd: "/test/workspace",
			api: {
				getModel: vi.fn(() => ({ info: { supportsImages: true } })),
			} as any,
		} as any

		// Mock tool parameters
		mockBlock = {
			partial: false,
			params: {
				args: "<file><path>test.ts</path></file>",
			},
		} as ToolUse

		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn()

		lspTool = new ReadFileToolLSP()
	})

	describe("LSP Enhancement Detection", () => {
		it("should detect TypeScript files as LSP-supported", async () => {
			const languageInfo = lspTool["detectLanguage"]({ path: "test.ts" })
			expect(languageInfo.language).toBe("typescript")
			expect(languageInfo.isSupported).toBe(true)
			expect(languageInfo.confidence).toBe(0.9)
		})

		it("should detect unsupported files correctly", async () => {
			const languageInfo = lspTool["detectLanguage"]({ path: "test.txt" })
			expect(languageInfo.language).toBe("plaintext")
			expect(languageInfo.isSupported).toBe(false)
			expect(languageInfo.confidence).toBe(0.1)
		})
	})

	describe("Semantic Enhancement", () => {
		it("should enhance file read with symbol information", async () => {
			const mockSymbols = [
				{
					name: "TestClass",
					kind: 5,
					range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
				},
				{
					name: "testMethod",
					kind: 6,
					range: { start: { line: 2, character: 2 }, end: { line: 8, character: 2 } },
				},
			]

			const result = await lspTool["addSemanticContext"](
				"/test/test.ts",
				"class TestClass {}",
				mockSymbols as any,
			)

			expect(result).toContain("<!-- LSP Content -->")
			expect(result).toContain("<symbols>")
			expect(result).toContain('<symbol name="TestClass" kind="Method"')
			expect(result).toContain('<symbol name="testMethod" kind="Property"')
			expect(result).toContain("class TestClass {}")
		})

		it("should calculate token reduction accurately", async () => {
			const originalContent = "a ".repeat(500) // 1000 characters
			const enhancedContent = "a ".repeat(300) // 600 characters

			const reduction = lspTool.calculateTokenReduction(originalContent, enhancedContent)

			expect(reduction.originalTokens).toBe(250) // ~1000/4
			expect(reduction.lspTokens).toBe(150) // ~600/4
			expect(reduction.reductionPercentage).toBe(40)
		})

		it("should handle empty symbol arrays gracefully", async () => {
			const result = await lspTool["addSemanticContext"]("/test/test.ts", "console.log('hello')", [])

			expect(result).toContain("<!-- LSP Content -->")
			expect(result).toContain("<symbols></symbols>")
			expect(result).toContain("console.log('hello')")
		})
	})

	describe("Line Range Enhancement", () => {
		it("should enhance line ranges with symbol context", async () => {
			const mockSymbols = [
				{
					name: "TestClass",
					kind: 5,
					range: { start: { line: 5, character: 0 }, end: { line: 15, character: 0 } },
				},
			]

			const result = await lspTool["addLineRangeSymbols"]([{ start: 6, end: 12 }], mockSymbols)

			expect(result).toHaveLength(1)
			expect(result[0].symbolContext).toEqual(["TestClass"])
			expect(result[0].description).toContain("Inside TestClass")
		})

		it("should handle line ranges outside symbol boundaries", async () => {
			const mockSymbols = [
				{
					name: "TestClass",
					kind: 5,
					range: { start: { line: 5, character: 0 }, end: { line: 15, character: 0 } },
				},
			]

			const result = await lspTool["addLineRangeSymbols"]([{ start: 1, end: 3 }], mockSymbols)

			expect(result).toHaveLength(1)
			expect(result[0].symbolContext).toEqual([])
			expect(result[0].description).toBe("Lines 1-3")
		})
	})

	describe("Integration with Original Tool", () => {
		it("should call original tool for non-LSP supported files", async () => {
			// Mock configuration to enable LSP
			vi.doMock("vscode", () => ({
				workspace: {
					getConfiguration: vi.fn(() => ({
						get: vi.fn((key: string) => key === "enableLSPEnhancements"),
					})),
				},
			}))

			mockBlock.params.args = "<file><path>test.txt</path></file>"

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(readFileTool).toHaveBeenCalledWith(
				mockCline,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)
		})

		it("should enhance TypeScript files with LSP data", async () => {
			// Mock configuration to enable LSP
			vi.doMock("vscode", () => ({
				workspace: {
					getConfiguration: vi.fn(() => ({
						get: vi.fn((key: string) => key === "enableLSPEnhancements"),
					})),
				},
			}))

			// Mock original tool to return basic content
			vi.mocked(readFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult("<files><file><path>test.ts</path><content>class TestClass {}</content></file></files>")
			})

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining("<!-- LSP Content -->"))
			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining("<symbols>"))
		})

		it("should handle LSP enhancement errors gracefully", async () => {
			// Mock LSP to throw error
			vi.doMock("../../lsp/InternalSymbolicLSP", () => ({
				InternalSymbolicLSP: {
					getInstance: vi.fn(() => ({
						isInitialized: vi.fn(() => Promise.resolve(true)),
						getSymbols: vi.fn(() => Promise.reject(new Error("LSP error"))),
					})),
				},
			}))

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Should fallback to original tool
			expect(readFileTool).toHaveBeenCalled()
		})
	})

	describe("Performance Metrics", () => {
		it("should track enhancement statistics", async () => {
			// Mock original tool
			vi.mocked(readFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult("<files><file><path>test.ts</path><content>class TestClass {}</content></file></files>")
			})

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = lspTool.getStats()
			expect(stats.totalExecutions).toBe(1)
			expect(stats.lspExecutions).toBeGreaterThan(0)
		})

		it("should track token reduction metrics", async () => {
			// Mock original tool with long content
			const longContent = "// ".repeat(1000) // Very long content
			vi.mocked(readFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult(`<files><file><path>test.ts</path><content>${longContent}</content></file></files>`)
			})

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = lspTool.getStats()
			expect(stats.averageTokenReduction).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid file paths", async () => {
			mockBlock.params.args = "<file><path></path></file>"

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(readFileTool).toHaveBeenCalled()
		})

		it("should handle malformed XML args", async () => {
			mockBlock.params.args = "<file><path>test.ts</path>" // Missing closing tag

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(readFileTool).toHaveBeenCalled()
		})
	})
})
