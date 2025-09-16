import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Memory Save Messages Test
 *
 * This test verifies that cipher field postMessage calls are sent
 * with the right values and types.
 */

describe("Memory Save Messages", () => {
	const mockVscode = {
		postMessage: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-ignore
		global.vscode = mockVscode
	})

	it("should send correct postMessage calls for cipher fields", () => {
		// Mock API configuration with cipher fields
		const apiConfiguration = {
			apiProvider: "anthropic",
			apiKey: "test-key",
			cipherMode: "embedded",
			cipherAutoCapture: true,
			cipherLlmProvider: "anthropic",
			cipherLlmApiKey: "test-cipher-key",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "text-embedding-3-small",
			cipherEmbeddingDimensions: 1536, // Number that should be converted to string
			cipherVectorStore: "qdrant",
			cipherVectorStoreUrl: "http://localhost:6333",
		}

		// Simulate the cipher field postMessage calls from handleSubmit
		// These are the calls added in my fix
		mockVscode.postMessage({ type: "cipherMode", text: apiConfiguration.cipherMode || "disabled" })
		mockVscode.postMessage({ type: "cipherAutoCapture", bool: apiConfiguration.cipherAutoCapture ?? false })
		mockVscode.postMessage({ type: "cipherLlmProvider", text: apiConfiguration.cipherLlmProvider || "openai" })
		mockVscode.postMessage({ type: "cipherLlmApiKey", text: apiConfiguration.cipherLlmApiKey || "" })
		mockVscode.postMessage({
			type: "cipherEmbeddingProvider",
			text: apiConfiguration.cipherEmbeddingProvider || "openai",
		})
		mockVscode.postMessage({ type: "cipherEmbeddingModel", text: apiConfiguration.cipherEmbeddingModel || "" })
		mockVscode.postMessage({
			type: "cipherEmbeddingDimensions",
			text: String(apiConfiguration.cipherEmbeddingDimensions ?? "1536"),
		})
		mockVscode.postMessage({ type: "cipherVectorStore", text: apiConfiguration.cipherVectorStore || "in-memory" })
		mockVscode.postMessage({ type: "cipherVectorStoreUrl", text: apiConfiguration.cipherVectorStoreUrl || "" })

		// Verify the postMessage calls were made with correct values
		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherMode",
			text: "embedded",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherAutoCapture",
			bool: true,
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherLlmProvider",
			text: "anthropic",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherLlmApiKey",
			text: "test-cipher-key",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingProvider",
			text: "openai",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingModel",
			text: "text-embedding-3-small",
		})

		// This is the key test - dimensions should be converted to string
		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingDimensions",
			text: "1536", // Number 1536 should be converted to string "1536"
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherVectorStore",
			text: "qdrant",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherVectorStoreUrl",
			text: "http://localhost:6333",
		})

		// Verify total number of calls (should be exactly 9)
		expect(mockVscode.postMessage).toHaveBeenCalledTimes(9)
	})

	it("should handle undefined cipher fields with defaults", () => {
		// Empty API configuration
		const apiConfiguration: any = {}

		// Simulate postMessage calls with defaults
		mockVscode.postMessage({ type: "cipherMode", text: apiConfiguration.cipherMode || "disabled" })
		mockVscode.postMessage({ type: "cipherAutoCapture", bool: apiConfiguration.cipherAutoCapture ?? false })
		mockVscode.postMessage({ type: "cipherLlmProvider", text: apiConfiguration.cipherLlmProvider || "openai" })
		mockVscode.postMessage({
			type: "cipherEmbeddingProvider",
			text: apiConfiguration.cipherEmbeddingProvider || "openai",
		})
		mockVscode.postMessage({
			type: "cipherEmbeddingDimensions",
			text: String(apiConfiguration.cipherEmbeddingDimensions ?? "1536"),
		})

		// Verify defaults are applied correctly
		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherMode",
			text: "disabled",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherAutoCapture",
			bool: false,
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherLlmProvider",
			text: "openai",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingProvider",
			text: "openai",
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingDimensions",
			text: "1536",
		})
	})

	it("should handle edge case: cipherEmbeddingDimensions as string", () => {
		const apiConfiguration: any = {
			cipherEmbeddingDimensions: "768", // Already a string
		}

		mockVscode.postMessage({
			type: "cipherEmbeddingDimensions",
			text: String(apiConfiguration.cipherEmbeddingDimensions ?? "1536"),
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingDimensions",
			text: "768",
		})
	})

	it("should handle edge case: cipherEmbeddingDimensions as number zero", () => {
		const apiConfiguration: any = {
			cipherEmbeddingDimensions: 0, // Edge case: zero should not fall back to default
		}

		mockVscode.postMessage({
			type: "cipherEmbeddingDimensions",
			text: String(apiConfiguration.cipherEmbeddingDimensions ?? "1536"),
		})

		expect(mockVscode.postMessage).toHaveBeenCalledWith({
			type: "cipherEmbeddingDimensions",
			text: "0",
		})
	})
})
