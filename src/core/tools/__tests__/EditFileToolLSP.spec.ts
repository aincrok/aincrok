// aincrok_change - new file
import { describe, it, expect, vi, beforeEach } from "vitest"
import { EditFileToolLSP } from "../EditFileToolLSP"
import { editFileTool } from "../editFileTool"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

// Mock the original editFileTool
vi.mock("../editFileTool", () => ({
	editFileTool: vi.fn(),
}))

// Mock VS Code and LSP components
vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn((key: string) => {
				switch (key) {
					case "enableLSPEditing":
						return true
					case "enablePreciseEditing":
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
			findDefinition: vi.fn(() =>
				Promise.resolve({
					uri: "test.ts",
					range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
				}),
			),
			getReferences: vi.fn(() =>
				Promise.resolve([
					{ uri: "test.ts", range: { start: { line: 3, character: 5 }, end: { line: 3, character: 15 } } },
				]),
			),
		})),
	},
}))

describe("EditFileToolLSP", () => {
	let mockCline: Partial<Task>
	let mockBlock: ToolUse
	let mockAskApproval: AskApproval
	let mockHandleError: HandleError
	let mockPushToolResult: PushToolResult
	let mockRemoveClosingTag: RemoveClosingTag
	let lspTool: EditFileToolLSP

	beforeEach(() => {
		vi.clearAllMocks()

		// Mock Cline instance
		mockCline = {
			cwd: "/test/workspace",
			api: {
				getModel: vi.fn(() => ({ info: { supportsImages: true } })),
			} as any,
		}

		// Mock tool parameters for file editing
		mockBlock = {
			partial: false,
			params: {
				path: "test.ts",
				diff: `--- test.ts
+++ test.ts
@@ -1,3 +1,4 @@
 class TestClass {
+  constructor() {}
   testMethod() {
     console.log("test")
   }
 }`,
			},
		} as ToolUse

		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn()

		lspTool = new EditFileToolLSP()
	})

	describe("LSP Edit Detection", () => {
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

	describe("Symbol-Aware Editing", () => {
		it("should analyze edit context with symbols", async () => {
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

			const result = await lspTool["analyzeEditContext"]("/test/test.ts", "constructor() {}", 1, mockSymbols)

			expect(result).toMatchObject({
				insertionPoint: { line: 1, character: 0 },
				targetSymbol: "TestClass",
				editType: "insertion",
				symbolContext: ["TestClass"],
			})
		})

		it("should detect symbol modifications", async () => {
			const mockSymbols = [
				{
					name: "testMethod",
					kind: 6,
					range: { start: { line: 2, character: 2 }, end: { line: 8, character: 2 } },
				},
			]

			const result = await lspTool["analyzeEditContext"](
				"/test/test.ts",
				"console.log('modified')",
				4,
				mockSymbols,
			)

			expect(result.editType).toBe("modification")
			expect(result.targetSymbol).toBe("testMethod")
		})

		it("should provide safe edit suggestions", async () => {
			const mockSymbols = [
				{
					name: "TestClass",
					kind: 5,
					range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
				},
			]

			const suggestions = await lspTool["generateSafeEditSuggestions"](
				"/test/test.ts",
				"private field: string;",
				2,
				mockSymbols,
			)

			expect(suggestions).toContain("Add private field inside TestClass")
			expect(suggestions).toContain("Line 2 is within TestClass scope")
		})
	})

	describe("Precise Diff Processing", () => {
		it("should process diff with symbol awareness", async () => {
			const diffContent = `--- test.ts
+++ test.ts
@@ -1,3 +1,4 @@
 class TestClass {
+  private name: string;
   testMethod() {`

			const result = await lspTool["processDiffWithSymbols"]("/test/test.ts", diffContent)

			expect(result.symbolChanges).toHaveLength(1)
			expect(result.symbolChanges[0]).toMatchObject({
				symbol: "TestClass",
				changeType: "field_addition",
				description: "Added field within TestClass",
			})
		})

		it("should detect risky edits", async () => {
			const diffContent = `--- test.ts
+++ test.ts
@@ -1,3 +1,3 @@
-class TestClass {
+class TestClassRenamed {`

			const result = await lspTool["processDiffWithSymbols"]("/test/test.ts", diffContent)

			expect(result.riskLevel).toBe("high")
			expect(result.warnings).toContain("Symbol rename detected")
		})
	})

	describe("Integration with Original Tool", () => {
		it("should call original tool for non-LSP supported files", async () => {
			mockBlock.params.path = "test.txt"

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(editFileTool).toHaveBeenCalledWith(
				mockCline,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)
		})

		it("should provide LSP context for TypeScript files", async () => {
			// Mock original tool to return basic content
			vi.mocked(editFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult(`File test.ts has been edited successfully.`)
			})

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining("LSP Context:"))
		})

		it("should handle LSP errors gracefully", async () => {
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
			expect(editFileTool).toHaveBeenCalled()
		})
	})

	describe("Performance Metrics", () => {
		it("should track edit precision statistics", async () => {
			// Mock original tool
			vi.mocked(editFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult(`File test.ts has been edited successfully.`)
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
			expect(stats.totalEdits).toBe(1)
			expect(stats.lspEdits).toBeGreaterThan(0)
		})

		it("should track symbol-aware edit success rate", async () => {
			// Mock successful symbol-aware edit
			vi.mocked(editFileTool).mockImplementation(async (cline, block, askApproval, handleError, pushResult) => {
				pushResult(`File test.ts has been edited successfully with 2 symbol changes.`)
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
			expect(stats.symbolAwareEdits).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid file paths", async () => {
			mockBlock.params.path = ""

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(editFileTool).toHaveBeenCalled()
		})

		it("should handle missing diff content", async () => {
			mockBlock.params.diff = undefined

			await lspTool.execute(
				mockCline as Task,
				mockBlock,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(editFileTool).toHaveBeenCalled()
		})
	})
})
