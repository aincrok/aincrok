// aincrok_change - new file
/**
 * Factory for creating memory providers with clean abstraction
 * Makes it easy to swap memory backends in the future
 */

import { IMemoryProvider } from "./IMemoryProvider"
import { CipherAdapter } from "./adapters/CipherAdapter"
import type { MemoryConfiguration } from "../../shared/ExtensionMessage"

export type MemoryProviderType = "cipher" | "future-provider"

export class MemoryProviderFactory {
	private static instance?: IMemoryProvider

	/**
	 * Create or get existing memory provider instance
	 * Uses singleton pattern to ensure consistent memory access across the application
	 */
	static create(type: MemoryProviderType = "cipher", memoryConfig?: MemoryConfiguration): IMemoryProvider {
		if (!this.instance) {
			switch (type) {
				case "cipher":
					this.instance = new CipherAdapter(this.createCipherConfig(memoryConfig))
					break
				// Easy to add new providers in future:
				// case 'future-provider':
				//   this.instance = new FutureProviderAdapter(config)
				//   break
				default:
					// Default to Cipher for unknown providers
					this.instance = new CipherAdapter(this.createCipherConfig(memoryConfig))
			}
		}
		return this.instance
	}

	/**
	 * Convert MemoryConfiguration to Cipher configuration format
	 */
	private static createCipherConfig(memoryConfig?: MemoryConfiguration) {
		if (!memoryConfig) {
			return { mode: "embedded" as const }
		}

		return {
			mode: memoryConfig.mode || "embedded",
			autoCapture: memoryConfig.autoCapture ?? true,
			reasoningExtraction: memoryConfig.extractReasoning ?? true,
			workspace: {
				enabled: memoryConfig.teamSharing ?? false,
			},
			llm: {
				provider: memoryConfig.llmProvider,
				model: memoryConfig.llmModel,
				apiKey: memoryConfig.llmApiKey,
				baseUrl: memoryConfig.llmBaseUrl,
			},
			embedding: {
				provider: memoryConfig.embeddingProvider,
				model: memoryConfig.embeddingModel,
				apiKey: memoryConfig.embeddingApiKey,
				baseUrl: memoryConfig.embeddingBaseUrl,
			},
			vectorStore: {
				type: memoryConfig.vectorStore || "in-memory",
				url: memoryConfig.vectorStoreUrl,
				apiKey: memoryConfig.vectorStoreApiKey,
			},
			knowledgeGraph: {
				enabled: memoryConfig.knowledgeGraphEnabled ?? false,
				type: memoryConfig.knowledgeGraphType || "in-memory",
				neo4j: {
					host: memoryConfig.neo4jHost,
					port: memoryConfig.neo4jPort,
					username: memoryConfig.neo4jUsername,
					password: memoryConfig.neo4jPassword,
					database: memoryConfig.neo4jDatabase,
				},
				inMemory: {
					maxNodes:
						typeof memoryConfig.inMemoryMaxNodes === "number"
							? memoryConfig.inMemoryMaxNodes
							: parseInt(memoryConfig.inMemoryMaxNodes || "10000"),
					maxEdges:
						typeof memoryConfig.inMemoryMaxEdges === "number"
							? memoryConfig.inMemoryMaxEdges
							: parseInt(memoryConfig.inMemoryMaxEdges || "50000"),
				},
			},
			session: {
				maxSessions:
					typeof memoryConfig.maxSessions === "number"
						? memoryConfig.maxSessions
						: parseInt(memoryConfig.maxSessions || "100"),
				sessionTTL:
					typeof memoryConfig.sessionTTL === "number"
						? memoryConfig.sessionTTL
						: parseInt(memoryConfig.sessionTTL || "3600"),
				maxIterations:
					typeof memoryConfig.maxIterations === "number"
						? memoryConfig.maxIterations
						: parseInt(memoryConfig.maxIterations || "50"),
			},
			mcp: {
				connectionType: memoryConfig.mcpConnectionType || "stdio",
				command: memoryConfig.mcpCommand,
				args: memoryConfig.mcpArgs,
				timeout: parseInt(memoryConfig.mcpTimeout || "30"),
				strictMode: memoryConfig.mcpStrictMode ?? false,
			},
			api: {
				url: memoryConfig.apiUrl,
				apiKey: memoryConfig.apiKey,
				timeout: parseInt(memoryConfig.apiTimeout || "30"),
				retries: parseInt(memoryConfig.apiRetries || "3"),
				verifySSL: memoryConfig.apiVerifySSL ?? true,
			},
		}
	}

	/**
	 * Get existing instance without creating new one
	 * Returns undefined if no instance exists
	 */
	static getInstance(): IMemoryProvider | undefined {
		return this.instance
	}

	/**
	 * Dispose of current instance and clean up resources
	 * Next create() call will create fresh instance
	 */
	static async dispose(): Promise<void> {
		if (this.instance) {
			await this.instance.dispose()
			this.instance = undefined
		}
	}

	/**
	 * Reset factory - mainly for testing
	 */
	static reset(): void {
		this.instance = undefined
	}

	/**
	 * Check if provider is initialized and healthy
	 */
	static async isHealthy(): Promise<boolean> {
		if (!this.instance) {
			return false
		}

		try {
			return await this.instance.isHealthy()
		} catch {
			return false
		}
	}
}
