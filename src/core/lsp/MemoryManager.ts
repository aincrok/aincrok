// aincrok_change - new file
// Mem0 Node.js SDK Integration for Aincrok VS Code Extension
// Provides intelligent memory management for code context and AI interactions

import * as vscode from "vscode"
// Temporary placeholder for Mem0 client - will be implemented based on actual API
interface MemoryClient {
	add(params: { messages: any[]; metadata: any; userId: string }): Promise<{ id: string }>
	search(params: { query: string; userId: string; limit: number; threshold: number }): Promise<any[]>
	deleteAll(params: { userId: string }): Promise<void>
}
import { SemanticContext, SymbolicEntity, CodeContext } from "./types"

/**
 * Configuration for the Mem0 memory client
 */
interface MemoryConfig {
	apiKey?: string
	baseUrl?: string
	userId: string
	enablePersistence: boolean
	maxMemorySize: number
	searchThreshold: number
}

/**
 * Memory entry for code-related information
 */
interface CodeMemory {
	id: string
	content: string
	metadata: {
		type: "code_context" | "user_preference" | "project_pattern" | "symbol_relationship"
		filePath?: string
		language?: string
		symbolName?: string
		timestamp: number
		relevanceScore?: number
		tags?: string[]
	}
}

/**
 * Manages intelligent memory for code context and user interactions
 * using Mem0's Node.js SDK with in-memory vector database
 */
export class MemoryManager {
	private static instance: MemoryManager | undefined
	private memoryClient: MemoryClient | undefined
	private config: MemoryConfig
	private isInitialized = false
	private memoryCache = new Map<string, CodeMemory>()

	private constructor(private context: vscode.ExtensionContext) {
		this.config = this.loadConfiguration()
	}

	/**
	 * Get or create the singleton instance
	 */
	static getInstance(context: vscode.ExtensionContext): MemoryManager {
		if (!MemoryManager.instance) {
			MemoryManager.instance = new MemoryManager(context)
		}
		return MemoryManager.instance
	}

	/**
	 * Initialize the memory manager with Mem0 client
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		try {
			// TODO: Initialize Mem0 client when the actual package API is available
			// For now, use local memory cache only
			this.memoryClient = undefined

			await this.loadPersistedMemories()
			this.isInitialized = true
			console.log("[Aincrok] Memory Manager initialized successfully")
		} catch (error) {
			console.error("[Aincrok] Failed to initialize Memory Manager:", error)
			// Fallback to local memory cache only
			this.isInitialized = true
		}
	}

	/**
	 * Store code context information in memory
	 */
	async storeCodeContext(
		context: CodeContext,
		semanticContext: SemanticContext,
		userQuery?: string,
	): Promise<string | undefined> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		try {
			const memoryContent = this.formatCodeContextForMemory(context, semanticContext, userQuery)
			const metadata = {
				type: "code_context" as const,
				filePath: context.document?.fileName,
				language: context.language,
				timestamp: Date.now(),
				tags: this.extractTagsFromContext(context, semanticContext),
			}

			let memoryId: string

			if (this.memoryClient) {
				// Use Mem0 client for persistent storage
				const result = await this.memoryClient.add({
					messages: [{ role: "user", content: memoryContent }],
					metadata,
					userId: this.config.userId,
				})
				memoryId = result.id || this.generateLocalId()
			} else {
				// Fallback to local cache
				memoryId = this.generateLocalId()
			}

			// Always cache locally for faster access
			this.memoryCache.set(memoryId, {
				id: memoryId,
				content: memoryContent,
				metadata,
			})

			return memoryId
		} catch (error) {
			console.error("[Aincrok] Error storing code context:", error)
			return undefined
		}
	}

	/**
	 * Store user preferences and patterns
	 */
	async storeUserPreference(
		preference: string,
		context?: { language?: string; projectType?: string },
	): Promise<string | undefined> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		try {
			const metadata = {
				type: "user_preference" as const,
				language: context?.language,
				timestamp: Date.now(),
				tags: context?.projectType ? [context.projectType] : [],
			}

			let memoryId: string

			if (this.memoryClient) {
				const result = await this.memoryClient.add({
					messages: [{ role: "user", content: preference }],
					metadata,
					userId: this.config.userId,
				})
				memoryId = result.id || this.generateLocalId()
			} else {
				memoryId = this.generateLocalId()
			}

			this.memoryCache.set(memoryId, {
				id: memoryId,
				content: preference,
				metadata,
			})

			return memoryId
		} catch (error) {
			console.error("[Aincrok] Error storing user preference:", error)
			return undefined
		}
	}

	/**
	 * Search for relevant memories based on query and context
	 */
	async searchRelevantMemories(query: string, context?: CodeContext, limit: number = 5): Promise<CodeMemory[]> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		try {
			let results: CodeMemory[] = []

			if (this.memoryClient) {
				// Search using Mem0's semantic search
				const searchResults = await this.memoryClient.search({
					query,
					userId: this.config.userId,
					limit,
					threshold: this.config.searchThreshold,
				})

				results = searchResults.map((result: any) => ({
					id: result.id,
					content: result.memory,
					metadata: result.metadata as CodeMemory["metadata"],
				}))
			}

			// Also search local cache for additional results
			const localResults = this.searchLocalCache(query, context, limit)

			// Combine and deduplicate results
			const combined = [...results, ...localResults]
			const unique = combined.filter(
				(item, index, self) => self.findIndex((other) => other.id === item.id) === index,
			)

			// Sort by relevance (if available) and timestamp
			return unique
				.sort((a, b) => {
					if (a.metadata.relevanceScore && b.metadata.relevanceScore) {
						return b.metadata.relevanceScore - a.metadata.relevanceScore
					}
					return b.metadata.timestamp - a.metadata.timestamp
				})
				.slice(0, limit)
		} catch (error) {
			console.error("[Aincrok] Error searching memories:", error)
			return this.searchLocalCache(query, context, limit)
		}
	}

	/**
	 * Get memory statistics
	 */
	getMemoryStats(): {
		totalMemories: number
		cacheSize: number
		isOnline: boolean
		lastSync?: number
	} {
		return {
			totalMemories: this.memoryCache.size,
			cacheSize: this.memoryCache.size,
			isOnline: this.memoryClient !== undefined,
			lastSync: undefined, // TODO: Implement sync tracking
		}
	}

	/**
	 * Clear all memories (with confirmation)
	 */
	async clearAllMemories(): Promise<boolean> {
		try {
			if (this.memoryClient) {
				// Clear from Mem0 service
				await this.memoryClient.deleteAll({ userId: this.config.userId })
			}

			// Clear local cache
			this.memoryCache.clear()

			console.log("[Aincrok] All memories cleared successfully")
			return true
		} catch (error) {
			console.error("[Aincrok] Error clearing memories:", error)
			return false
		}
	}

	/**
	 * Dispose of the memory manager
	 */
	async dispose(): Promise<void> {
		if (this.config.enablePersistence) {
			await this.persistMemories()
		}

		this.memoryCache.clear()
		this.isInitialized = false
	}

	// Private helper methods

	private loadConfiguration(): MemoryConfig {
		const config = vscode.workspace.getConfiguration("aincrok.memory")

		return {
			apiKey: config.get<string>("apiKey"),
			baseUrl: config.get<string>("baseUrl"),
			userId: config.get<string>("userId") || "default-user",
			enablePersistence: config.get<boolean>("enablePersistence", true),
			maxMemorySize: config.get<number>("maxMemorySize", 1000),
			searchThreshold: config.get<number>("searchThreshold", 0.7),
		}
	}

	private formatCodeContextForMemory(
		context: CodeContext,
		semanticContext: SemanticContext,
		userQuery?: string,
	): string {
		const parts: string[] = []

		if (userQuery) {
			parts.push(`User Query: ${userQuery}`)
		}

		if (context.document) {
			parts.push(`File: ${context.document.fileName}`)
			parts.push(`Language: ${context.language || context.document.languageId}`)
		}

		if (semanticContext.relevantSymbols.length > 0) {
			const symbolNames = semanticContext.relevantSymbols.map((s) => s.name).join(", ")
			parts.push(`Relevant Symbols: ${symbolNames}`)
		}

		if (semanticContext.codeSnippets.length > 0) {
			const snippet = semanticContext.codeSnippets[0]
			parts.push(`Code Context: ${snippet.content.substring(0, 200)}...`)
		}

		if (context.projectContext?.type) {
			parts.push(`Project Type: ${context.projectContext.type}`)
		}

		return parts.join("\n")
	}

	private extractTagsFromContext(context: CodeContext, semanticContext: SemanticContext): string[] {
		const tags: string[] = []

		if (context.language) {
			tags.push(context.language)
		}

		if (context.projectContext?.type) {
			tags.push(context.projectContext.type)
		}

		// Add symbol kinds as tags
		semanticContext.relevantSymbols.forEach((symbol) => {
			const kindName = vscode.SymbolKind[symbol.kind].toLowerCase()
			if (!tags.includes(kindName)) {
				tags.push(kindName)
			}
		})

		return tags
	}

	private searchLocalCache(query: string, context?: CodeContext, limit: number = 5): CodeMemory[] {
		const results: (CodeMemory & { score: number })[] = []
		const queryLower = query.toLowerCase()

		for (const memory of this.memoryCache.values()) {
			let score = 0

			// Content similarity (simple text search)
			if (memory.content.toLowerCase().includes(queryLower)) {
				score += 2
			}

			// Context matching
			if (context?.language && memory.metadata.language === context.language) {
				score += 1
			}

			if (context?.document?.fileName && memory.metadata.filePath === context.document.fileName) {
				score += 3
			}

			// Tag matching
			if (memory.metadata.tags) {
				const contextTags = this.extractTagsFromContext(context || {}, {
					relevantSymbols: [],
					relationships: [],
					codeSnippets: [],
				})
				const commonTags = memory.metadata.tags.filter(
					(tag) => contextTags.includes(tag) || queryLower.includes(tag.toLowerCase()),
				)
				score += commonTags.length
			}

			if (score > 0) {
				results.push({ ...memory, score })
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit)
	}

	private generateLocalId(): string {
		return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	private async loadPersistedMemories(): Promise<void> {
		if (!this.config.enablePersistence) {
			return
		}

		try {
			// TODO: Implement persistence to VS Code global state or file system
			const globalState = this.context.globalState
			const persistedMemories = globalState.get<CodeMemory[]>("aincrok.memories", [])

			for (const memory of persistedMemories) {
				this.memoryCache.set(memory.id, memory)
			}

			console.log(`[Aincrok] Loaded ${persistedMemories.length} persisted memories`)
		} catch (error) {
			console.error("[Aincrok] Error loading persisted memories:", error)
		}
	}

	private async persistMemories(): Promise<void> {
		if (!this.config.enablePersistence) {
			return
		}

		try {
			const memories = Array.from(this.memoryCache.values())
			await this.context.globalState.update("aincrok.memories", memories)
			console.log(`[Aincrok] Persisted ${memories.length} memories`)
		} catch (error) {
			console.error("[Aincrok] Error persisting memories:", error)
		}
	}
}
