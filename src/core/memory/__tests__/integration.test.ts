// aincrok_change - new file
/**
 * Integration tests for Cipher memory system
 * Tests the connection between provider settings and memory system
 */

import { describe, it, expect, beforeEach } from "vitest"
import { MemoryProviderFactory } from "../MemoryProviderFactory"
import type { MemoryConfiguration } from "../../../shared/ExtensionMessage"

describe("Memory System Integration", () => {
	beforeEach(() => {
		// Reset factory state before each test
		MemoryProviderFactory.reset()
	})

	it("should create cipher provider with embedded mode by default", async () => {
		const provider = MemoryProviderFactory.create("cipher")
		expect(provider).toBeDefined()

		await provider.initialize()
		expect(await provider.isHealthy()).toBe(true)
	})

	it("should create cipher provider with settings from MemoryConfiguration", async () => {
		const memoryConfig: MemoryConfiguration = {
			mode: "embedded",
			autoCapture: true,
			extractReasoning: false,
			teamSharing: false,
			vectorStore: "in-memory",
			knowledgeGraphEnabled: true,
			knowledgeGraphType: "in-memory",
		}

		const provider = MemoryProviderFactory.create("cipher", memoryConfig)
		await provider.initialize()

		expect(await provider.isHealthy()).toBe(true)
	})

	it("should handle disabled mode correctly", async () => {
		const memoryConfig: MemoryConfiguration = {
			mode: "disabled",
		}

		const provider = MemoryProviderFactory.create("cipher", memoryConfig)
		await provider.initialize()

		// Disabled mode should still be healthy but return empty results
		expect(await provider.isHealthy()).toBe(true)

		// Test that disabled mode returns appropriate empty responses
		const knowledgeId = await provider.storeKnowledge("test content")
		expect(knowledgeId).toBe("disabled")

		const reasoningId = await provider.storeReasoning([{ step: 1, action: "test", thought: "test" }])
		expect(reasoningId).toBe("disabled")

		const memories = await provider.searchRelevantMemories("test")
		expect(memories).toEqual([])

		const recentMemories = await provider.getRecentMemories(5)
		expect(recentMemories).toEqual([])
	})

	it("should store and retrieve memories in embedded mode", async () => {
		const provider = MemoryProviderFactory.create("cipher")
		await provider.initialize()

		// Store some knowledge
		const knowledgeId = await provider.storeKnowledge("This is a test memory", { type: "knowledge" })
		expect(knowledgeId).toMatch(/^cipher_k_/)

		// Store some reasoning
		const reasoningSteps = [
			{ step: 1, action: "analyze", thought: "analyzing the problem" },
			{ step: 2, action: "plan", thought: "creating solution plan" },
		]
		const reasoningId = await provider.storeReasoning(reasoningSteps)
		expect(reasoningId).toMatch(/^cipher_r_/)

		// Search for memories
		const memories = await provider.searchRelevantMemories("test", 10)
		expect(memories.length).toBeGreaterThan(0)
		expect(memories[0].content).toContain("test")

		// Get recent memories
		const recentMemories = await provider.getRecentMemories(10)
		expect(recentMemories.length).toBe(2) // knowledge + reasoning
	})

	it("should configure Neo4j settings properly", async () => {
		const memoryConfig: MemoryConfiguration = {
			mode: "embedded",
			knowledgeGraphEnabled: true,
			knowledgeGraphType: "neo4j",
			neo4jHost: "localhost",
			neo4jPort: "7687",
			neo4jUsername: "neo4j",
			neo4jPassword: "test-password",
			neo4jDatabase: "cipher_test",
		}

		// This mainly tests the configuration transformation
		const provider = MemoryProviderFactory.create("cipher", memoryConfig)
		expect(provider).toBeDefined()
		await provider.initialize()
	})

	it("should configure vector store settings properly", async () => {
		const memoryConfig: MemoryConfiguration = {
			mode: "embedded",
			vectorStore: "qdrant",
			vectorStoreUrl: "http://localhost:6333",
			vectorStoreApiKey: "test-key",
		}

		const provider = MemoryProviderFactory.create("cipher", memoryConfig)
		expect(provider).toBeDefined()
		await provider.initialize()
	})
})
