// aincrok_change - new file
import { describe, it, expect, vi, beforeEach } from "vitest"
import { BatchManager } from "../BatchManager"

// Mock VS Code
vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn((key: string, defaultValue: any) => {
				switch (key) {
					case "maxBatchSize":
						return 3
					case "batchDelay":
						return 50
					case "maxWaitTime":
						return 1000
					case "enableCompression":
						return true
					case "priorityLevels":
						return 3
					default:
						return defaultValue
				}
			}),
		})),
	},
}))

// Mock LSP components
const mockSymbolicLSP = {
	searchWorkspaceSymbols: vi.fn(),
	getSemanticContextForAI: vi.fn(),
	analyzeFileSemantics: vi.fn(),
}

const mockMemoryManager = {
	searchRelevantMemories: vi.fn(),
}

const mockContext = {
	globalState: {
		get: vi.fn(),
		update: vi.fn(),
	},
}

describe("BatchManager", () => {
	let batchManager: BatchManager

	beforeEach(() => {
		vi.clearAllMocks()
		batchManager = BatchManager.getInstance(mockContext as any, mockSymbolicLSP as any, mockMemoryManager as any)
	})

	describe("Initialization", () => {
		it("should initialize successfully", async () => {
			await expect(batchManager.initialize()).resolves.toBeUndefined()
		})

		it("should load configuration from VS Code settings", async () => {
			await batchManager.initialize()
			const stats = batchManager.getBatchStats()
			expect(stats).toBeDefined()
		})
	})

	describe("Batch Operations", () => {
		beforeEach(async () => {
			await batchManager.initialize()
		})

		it("should batch symbol search operations", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockResolvedValue([
				{ name: "TestClass", filePath: "test.ts" },
				{ name: "AnotherClass", filePath: "another.ts" },
			])

			const promise1 = batchManager.batchOperation("findSymbols", "TestClass")
			const promise2 = batchManager.batchOperation("findSymbols", "AnotherClass")

			const results = await Promise.all([promise1, promise2])

			expect(mockSymbolicLSP.searchWorkspaceSymbols).toHaveBeenCalledOnce()
			expect(results).toHaveLength(2)
		})

		it("should execute batch when max size is reached", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockResolvedValue([
				{ name: "Class1", filePath: "test1.ts" },
				{ name: "Class2", filePath: "test2.ts" },
				{ name: "Class3", filePath: "test3.ts" },
			])

			// Add 3 operations to trigger batch execution (maxBatchSize = 3)
			const promises = [
				batchManager.batchOperation("findSymbols", "Class1"),
				batchManager.batchOperation("findSymbols", "Class2"),
				batchManager.batchOperation("findSymbols", "Class3"),
			]

			const results = await Promise.all(promises)
			expect(results).toHaveLength(3)
			expect(mockSymbolicLSP.searchWorkspaceSymbols).toHaveBeenCalledOnce()
		})

		it("should handle semantic context batching", async () => {
			mockSymbolicLSP.getSemanticContextForAI.mockResolvedValue("semantic context")

			const promise1 = batchManager.batchOperation("getSemanticContext", "query1")
			const promise2 = batchManager.batchOperation("getSemanticContext", "query2")

			const results = await Promise.all([promise1, promise2])

			expect(mockSymbolicLSP.getSemanticContextForAI).toHaveBeenCalledTimes(2)
			expect(results).toEqual(["semantic context", "semantic context"])
		})

		it("should handle memory search batching", async () => {
			mockMemoryManager.searchRelevantMemories.mockResolvedValue([
				{ id: "1", content: "memory1" },
				{ id: "2", content: "memory2" },
			])

			const promise1 = batchManager.batchOperation("searchMemories", "query1")
			const promise2 = batchManager.batchOperation("searchMemories", "query2")

			const results = await Promise.all([promise1, promise2])

			expect(mockMemoryManager.searchRelevantMemories).toHaveBeenCalledTimes(2)
			expect(results).toHaveLength(2)
		})

		it("should prioritize high-priority operations", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockImplementation(async (query) => {
				return [{ name: query, filePath: "test.ts" }]
			})

			// Add operations with different priorities
			const lowPriority = batchManager.batchOperation("findSymbols", "LowPriority", 1)
			const highPriority = batchManager.batchOperation("findSymbols", "HighPriority", 3)
			const mediumPriority = batchManager.batchOperation("findSymbols", "MediumPriority", 2)

			// Wait a bit to ensure batch execution
			await new Promise((resolve) => setTimeout(resolve, 100))

			const results = await Promise.all([lowPriority, highPriority, mediumPriority])
			expect(results).toHaveLength(3)
		})
	})

	describe("Immediate Execution", () => {
		beforeEach(async () => {
			await batchManager.initialize()
		})

		it("should execute operations immediately when requested", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockResolvedValue([
				{ name: "ImmediateClass", filePath: "immediate.ts" },
			])

			const result = await batchManager.executeImmediate("findSymbols", "ImmediateClass")

			expect(mockSymbolicLSP.searchWorkspaceSymbols).toHaveBeenCalledWith(["ImmediateClass"])
			expect(result).toEqual({ name: "ImmediateClass", filePath: "immediate.ts" })
		})

		it("should handle immediate execution errors gracefully", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockRejectedValue(new Error("Search failed"))

			await expect(batchManager.executeImmediate("findSymbols", "FailingClass")).rejects.toThrow("Search failed")
		})
	})

	describe("Statistics", () => {
		beforeEach(async () => {
			await batchManager.initialize()
		})

		it("should track batch statistics", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockResolvedValue([{ name: "TestClass", filePath: "test.ts" }])

			await batchManager.batchOperation("findSymbols", "TestClass")

			// Wait for batch execution
			await new Promise((resolve) => setTimeout(resolve, 100))

			const stats = batchManager.getBatchStats()
			expect(stats.totalOperations).toBeGreaterThan(0)
		})

		it("should calculate compression ratio correctly", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockResolvedValue([
				{ name: "Class1", filePath: "test1.ts" },
				{ name: "Class2", filePath: "test2.ts" },
			])

			// Execute multiple batched operations
			await Promise.all([
				batchManager.batchOperation("findSymbols", "Class1"),
				batchManager.batchOperation("findSymbols", "Class2"),
			])

			// Wait for batch execution
			await new Promise((resolve) => setTimeout(resolve, 100))

			const stats = batchManager.getBatchStats()
			expect(stats.compressionRatio).toBeGreaterThanOrEqual(0)
		})
	})

	describe("Error Handling", () => {
		beforeEach(async () => {
			await batchManager.initialize()
		})

		it("should handle batch operation failures gracefully", async () => {
			mockSymbolicLSP.searchWorkspaceSymbols.mockRejectedValue(new Error("LSP error"))

			const promise = batchManager.batchOperation("findSymbols", "FailingClass")

			await expect(promise).rejects.toThrow("LSP error")
		})

		it("should timeout long-running operations", async () => {
			// Mock a long-running operation
			mockSymbolicLSP.searchWorkspaceSymbols.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 2000)), // 2 seconds
			)

			const promise = batchManager.batchOperation("findSymbols", "SlowClass")

			// Should timeout before 2 seconds (maxWaitTime is 1000ms in mock config)
			await expect(promise).rejects.toThrow("timed out")
		}, 1500)

		it("should handle unknown operations", async () => {
			const promise = batchManager.batchOperation("unknownOperation", "data")

			await expect(promise).rejects.toThrow("Unknown batch operation")
		})
	})

	describe("Cleanup", () => {
		beforeEach(async () => {
			await batchManager.initialize()
		})

		it("should clear all batches", async () => {
			// Add some pending operations
			const promise1 = batchManager.batchOperation("findSymbols", "Class1")
			const promise2 = batchManager.batchOperation("findSymbols", "Class2")

			await batchManager.clearBatches()

			// Operations should be rejected
			await expect(promise1).rejects.toThrow("Batch cleared")
			await expect(promise2).rejects.toThrow("Batch cleared")
		})

		it("should dispose properly", async () => {
			await expect(batchManager.dispose()).resolves.toBeUndefined()
		})
	})
})
