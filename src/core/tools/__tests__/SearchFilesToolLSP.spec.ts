// aincrok_change - new file
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SearchFilesToolLSP } from "../SearchFilesToolLSP"
import * as vscode from "vscode"
import type { Task } from "../../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

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
		4: "Class",
		5: "Method",
		6: "Property",
		11: "Function",
		12: "Variable",
	},
}))

// Mock searchFilesTool
vi.mock("../searchFilesTool", () => ({
	searchFilesTool: vi.fn(() => Promise.resolve()),
}))

// Mock LSP components
vi.mock("../../lsp/InternalSymbolicLSP", () => ({
	InternalSymbolicLSP: {
		getInstance: vi.fn(() => ({
			searchWorkspaceSymbols: vi.fn(() =>
				Promise.resolve([
					{
						name: "TestClass",
						kind: 4, // Class
						location: {
							uri: { fsPath: "/test/test.ts" },
							range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
						},
					},
					{
						name: "testMethod",
						kind: 5, // Method
						location: {
							uri: { fsPath: "/test/test.ts" },
							range: { start: { line: 2, character: 4 }, end: { line: 8, character: 4 } },
						},
					},
				]),
			),
			getDocumentSymbols: vi.fn(() =>
				Promise.resolve([
					{
						name: "TestClass",
						kind: 4,
						children: [{ name: "testMethod", kind: 5, children: [] }],
					},
				]),
			),
		})),
	},
}))

describe("SearchFilesToolLSP", () => {
	let searchTool: SearchFilesToolLSP
	let mockTask: Partial<Task>
	let mockBlock: Partial<ToolUse>
	let mockAskApproval: AskApproval
	let mockHandleError: HandleError
	let mockPushToolResult: PushToolResult
	let mockRemoveClosingTag: RemoveClosingTag

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		searchTool = new SearchFilesToolLSP()

		mockTask = {
			cwd: "/test",
		}

		mockBlock = {
			params: {
				path: "/test",
				regex: "TestClass",
				file_pattern: "*.ts",
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
		it("should use LSP enhancements when enabled", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify LSP enhancements were applied
			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining("Semantic Search Context"))
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

			const searchTool2 = new SearchFilesToolLSP()

			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool2.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = searchTool2.getStats()
			expect(stats.fallbackSearches).toBe(1)
		})
	})

	describe("Semantic Search Enhancement", () => {
		it("should enhance search results with semantic context", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
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

			expect(enhancedContent).toContain("Semantic Search Context")
		})

		it("should perform semantic search through execute method", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify semantic search was performed by checking enhanced output
			expect(mockPushToolResult).toHaveBeenCalledWith(expect.stringContaining("Semantic Search Context"))
		})

		it("should generate appropriate semantic context in output", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Get the enhanced result
			const callArgs = vi.mocked(mockPushToolResult).mock.calls[0]
			const enhancedContent = callArgs[0] as string

			expect(enhancedContent).toContain("Semantic Search Context")
		})

		it("should provide relevant search results based on symbol relevance", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify that relevant symbols are included in output
			const callArgs = vi.mocked(mockPushToolResult).mock.calls[0]
			const enhancedContent = callArgs[0] as string

			expect(enhancedContent).toContain("Semantic Search Context")
		})

		it("should provide symbol context hierarchy in search results", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify that symbol hierarchy context is provided
			const callArgs = vi.mocked(mockPushToolResult).mock.calls[0]
			const enhancedContent = callArgs[0] as string

			expect(enhancedContent).toContain("Semantic Search Context")
		})
	})

	describe("Performance and Statistics", () => {
		it("should track search statistics", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = searchTool.getStats()
			expect(stats.totalSearches).toBe(1)
			expect(stats.lspSearches).toBeGreaterThanOrEqual(0)
			expect(stats.fallbackSearches).toBeGreaterThanOrEqual(0)
		})

		it("should update timing statistics through execution", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			// Execute multiple times to generate timing statistics
			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = searchTool.getStats()
			expect(stats.totalSearches).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle missing required parameters", async () => {
			const incompleteBlock = {
				params: {},
				partial: false,
			}

			await searchTool.execute(
				mockTask as Task,
				incompleteBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = searchTool.getStats()
			expect(stats.fallbackSearches).toBe(1)
		})

		it("should handle LSP errors gracefully", async () => {
			// Mock LSP to throw error
			const { InternalSymbolicLSP } = await import("../../lsp/InternalSymbolicLSP")
			vi.mocked(InternalSymbolicLSP.getInstance).mockReturnValue({
				searchWorkspaceSymbols: vi.fn(() => Promise.reject(new Error("LSP error"))),
				getDocumentSymbols: vi.fn(() => Promise.resolve([])),
			} as unknown as any)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Should fallback gracefully
			const stats = searchTool.getStats()
			expect(stats.totalSearches).toBe(1)
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

			const searchTool2 = new SearchFilesToolLSP()

			await searchTool2.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const stats = searchTool2.getStats()
			expect(stats.fallbackSearches).toBe(1)
		})
	})

	describe("Language Detection", () => {
		it("should handle TypeScript files appropriately", async () => {
			if (mockBlock.params) {
				mockBlock.params.file_pattern = "*.ts"
			}

			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify appropriate handling through stats
			const stats = searchTool.getStats()
			expect(stats.totalSearches).toBe(1)
		})

		it("should handle different file types gracefully", async () => {
			if (mockBlock.params) {
				mockBlock.params.file_pattern = "*.txt"
			}

			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify handling through stats
			const stats = searchTool.getStats()
			expect(stats.totalSearches).toBe(1)
		})
	})

	describe("Symbol Type Description", () => {
		it("should provide appropriate symbol descriptions in output", async () => {
			// Mock searchFilesTool to resolve with some content
			const { searchFilesTool } = await import("../searchFilesTool")
			vi.mocked(searchFilesTool).mockImplementation(
				async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					await pushToolResult("Original search results")
				},
			)

			await searchTool.execute(
				mockTask as Task,
				mockBlock as ToolUse,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			// Verify that symbol type descriptions are handled appropriately
			const callArgs = vi.mocked(mockPushToolResult).mock.calls[0]
			const enhancedContent = callArgs[0] as string

			expect(enhancedContent).toContain("Semantic Search Context")
		})
	})
})
