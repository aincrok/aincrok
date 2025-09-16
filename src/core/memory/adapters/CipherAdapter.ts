// aincrok_change - new file
/**
 * Cipher memory provider adapter implementing the abstract IMemoryProvider interface
 * Supports embedded mode (zero-config), MCP mode, and API mode
 */

import * as vscode from "vscode"
import { IMemoryProvider, Memory, ReasoningStep, MemoryType } from "../IMemoryProvider"
import { spawn } from "child_process"

export interface CipherConfig {
	mode: "disabled" | "embedded" | "mcp" | "api"
	autoCapture: boolean
	reasoningExtraction: boolean
	workspace?: {
		enabled: boolean
		syncInterval?: number
	}
	llm?: {
		provider?: string
		model?: string
		apiKey?: string
		baseUrl?: string
	}
	embedding?: {
		provider?: string
		model?: string
		apiKey?: string
		baseUrl?: string
	}
	vectorStore?: {
		type: "in-memory" | "qdrant" | "milvus"
		url?: string
		apiKey?: string
	}
	knowledgeGraph?: {
		enabled: boolean
		type: "in-memory" | "neo4j"
		neo4j?: {
			host?: string
			port?: string
			username?: string
			password?: string
			database?: string
		}
		inMemory?: {
			maxNodes: number
			maxEdges: number
		}
	}
	session?: {
		maxSessions: number
		sessionTTL: number
		maxIterations: number
	}
	mcp?: {
		connectionType: "stdio" | "sse" | "http"
		command?: string
		args?: string
		timeout: number
		strictMode: boolean
	}
	api?: {
		url?: string
		apiKey?: string
		timeout: number
		retries: number
		verifySSL: boolean
	}
}

export class CipherAdapter implements IMemoryProvider {
	private config: CipherConfig
	private mcpProcess?: ReturnType<typeof spawn>
	private embeddedStore: Map<string, Memory> = new Map()
	private initialized = false

	constructor(config?: Partial<CipherConfig>) {
		this.config = {
			mode: "embedded",
			autoCapture: true,
			reasoningExtraction: true,
			workspace: { enabled: false },
			...config,
		}
	}

	async initialize(config?: any): Promise<void> {
		if (this.initialized) return

		switch (this.config.mode) {
			case "disabled":
				await this.initializeDisabled()
				break
			case "mcp":
				await this.initializeMCP()
				break
			case "api":
				await this.initializeAPI()
				break
			case "embedded":
			default:
				await this.initializeEmbedded()
				break
		}

		this.initialized = true
	}

	private async initializeDisabled(): Promise<void> {
		// Memory system is completely disabled
		console.log("[Cipher] Memory system disabled - no operations will be performed")
	}

	private async initializeEmbedded(): Promise<void> {
		// Use in-memory store for zero-config operation
		console.log("[Cipher] Initialized in embedded mode - zero configuration")
	}

	private async initializeMCP(): Promise<void> {
		try {
			// Start Cipher as MCP server
			this.mcpProcess = spawn("npx", ["@byterover/cipher", "--mode", "mcp"], {
				env: {
					...process.env,
					MCP_SERVER_MODE: "aggregator",
					CIPHER_AUTO_CAPTURE: String(this.config.autoCapture),
					CIPHER_REASONING: String(this.config.reasoningExtraction),
				},
			})

			this.mcpProcess.on("error", (error) => {
				console.error("[Cipher] MCP server error:", error)
			})

			console.log("[Cipher] MCP server started")
		} catch (error) {
			console.error("[Cipher] Failed to start MCP server, falling back to embedded", error)
			await this.initializeEmbedded()
		}
	}

	private async initializeAPI(): Promise<void> {
		// Initialize API client for external Cipher instance
		console.log("[Cipher] Initialized in API mode")
	}

	// aincrok_change - Generic store method for onboarding workflow
	async store(message: string, content: string, type: MemoryType = "knowledge"): Promise<string> {
		if (this.config.mode === "disabled") {
			return "disabled"
		}

		const memory: Memory = {
			id: `cipher_s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type,
			content: `${message}\n\n${content}`,
			metadata: { message, originalContent: content },
			timestamp: Date.now(),
		}

		if (this.config.mode === "embedded") {
			this.embeddedStore.set(memory.id, memory)
		} else {
			await this.invokeCipherTool("cipher_store_memory", { message, content, type })
		}

		return memory.id
	}

	async storeKnowledge(content: string, metadata?: any): Promise<string> {
		if (this.config.mode === "disabled") {
			return "disabled"
		}

		const memory: Memory = {
			id: `cipher_k_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: "knowledge",
			content,
			metadata,
			timestamp: Date.now(),
		}

		if (this.config.mode === "embedded") {
			this.embeddedStore.set(memory.id, memory)
		} else {
			// Send to MCP or API using VS Code tool invocation
			await this.invokeCipherTool("cipher_extract_and_operate_memory", { content, metadata })
		}

		return memory.id
	}

	async storeReasoning(steps: ReasoningStep[]): Promise<string> {
		if (this.config.mode === "disabled") {
			return "disabled"
		}

		const memory: Memory = {
			id: `cipher_r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: "reasoning",
			content: JSON.stringify(steps),
			metadata: {
				stepCount: steps.length,
				timestamp: Date.now(),
			},
			timestamp: Date.now(),
		}

		if (this.config.mode === "embedded") {
			this.embeddedStore.set(memory.id, memory)
		} else {
			await this.invokeCipherTool("cipher_store_reasoning_memory", { steps })
		}

		return memory.id
	}

	async searchRelevantMemories(query: string, limit = 5): Promise<Memory[]> {
		if (this.config.mode === "disabled") {
			return []
		}

		if (this.config.mode === "embedded") {
			// Simple keyword matching for embedded mode (fallback; consider in-memory vector for better relevance)
			const results: Memory[] = []
			const queryLower = query.toLowerCase()

			for (const memory of this.embeddedStore.values()) {
				if (memory.content.toLowerCase().includes(queryLower)) {
					results.push({
						...memory,
						relevanceScore: this.calculateRelevance(query, memory.content),
						timeAgo: this.formatTimeAgo(memory.timestamp),
					})
				}
			}

			return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)).slice(0, limit)
		} else {
			// Use vector search via MCP/API
			return await this.invokeCipherTool("cipher_memory_search", { query, limit })
		}
	}

	async getContextMemories(fileContext: string): Promise<Memory[]> {
		// Get memories relevant to current file/context
		const fileName = fileContext.split("/").pop() || ""
		return this.searchRelevantMemories(fileName, 10)
	}

	async getRecentMemories(limit: number): Promise<Memory[]> {
		if (this.config.mode === "disabled") {
			return []
		}

		if (this.config.mode === "embedded") {
			return Array.from(this.embeddedStore.values())
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, limit)
				.map((memory) => ({
					...memory,
					timeAgo: this.formatTimeAgo(memory.timestamp),
				}))
		} else {
			return await this.invokeCipherTool("cipher_memory_search", { query: "", limit, sort: "recent" })
		}
	}

	async shareWithWorkspace(memories: Memory[]): Promise<void> {
		if (!this.config.workspace?.enabled) {
			throw new Error("Workspace sharing is not enabled")
		}

		await this.invokeCipherTool("cipher_store_workspace_memory", { memories })
	}

	async getWorkspaceMemories(query: string): Promise<Memory[]> {
		if (!this.config.workspace?.enabled) {
			return []
		}

		return await this.invokeCipherTool("cipher_workspace_search", { query })
	}

	// aincrok_change start - Knowledge graph operations based on Cipher documentation
	async addGraphNode(label: string, properties: Record<string, any>): Promise<string> {
		if (this.config.mode === "disabled") {
			return "disabled"
		}

		const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

		if (this.config.mode === "embedded") {
			// Simple in-memory graph storage for embedded mode
			const graphData = this.embeddedStore.get("__graph_nodes__")
			const nodes = graphData ? JSON.parse(graphData.content) : []
			nodes.push({ id: nodeId, label, properties, createdAt: Date.now() })

			this.embeddedStore.set("__graph_nodes__", {
				id: "__graph_nodes__",
				type: "knowledge",
				content: JSON.stringify(nodes),
				timestamp: Date.now(),
			})
		} else {
			await this.invokeCipherTool("cipher_add_node", { id: nodeId, label, properties })
		}

		return nodeId
	}

	async addGraphEdge(
		fromNodeId: string,
		toNodeId: string,
		relationship: string,
		properties?: Record<string, any>,
	): Promise<string> {
		if (this.config.mode === "disabled") {
			return "disabled"
		}

		const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

		if (this.config.mode === "embedded") {
			// Simple in-memory graph storage for embedded mode
			const graphData = this.embeddedStore.get("__graph_edges__")
			const edges = graphData ? JSON.parse(graphData.content) : []
			edges.push({ id: edgeId, fromNodeId, toNodeId, relationship, properties, createdAt: Date.now() })

			this.embeddedStore.set("__graph_edges__", {
				id: "__graph_edges__",
				type: "knowledge",
				content: JSON.stringify(edges),
				timestamp: Date.now(),
			})
		} else {
			await this.invokeCipherTool("cipher_add_edge", {
				id: edgeId,
				fromNodeId,
				toNodeId,
				relationship,
				properties,
			})
		}

		return edgeId
	}

	async searchGraph(query: any): Promise<any[]> {
		if (this.config.mode === "disabled") {
			return []
		}

		if (this.config.mode === "embedded") {
			// Simple graph search for embedded mode
			const nodesData = this.embeddedStore.get("__graph_nodes__")
			const edgesData = this.embeddedStore.get("__graph_edges__")

			const nodes = nodesData ? JSON.parse(nodesData.content) : []
			const edges = edgesData ? JSON.parse(edgesData.content) : []

			// Basic filtering based on query
			let results = nodes
			if (query.nodeLabels?.length) {
				results = results.filter((node: any) => query.nodeLabels.includes(node.label))
			}
			if (query.properties) {
				results = results.filter((node: any) =>
					Object.entries(query.properties).every(([key, value]) => node.properties[key] === value),
				)
			}

			return results.slice(0, query.limit || 10)
		} else {
			return await this.invokeCipherTool("cipher_search_graph", query)
		}
	}

	async queryGraph(cypherQuery: string): Promise<any[]> {
		if (this.config.mode === "disabled") {
			return []
		}

		if (this.config.mode === "embedded") {
			// Embedded mode doesn't support full Cypher queries
			console.warn("[Cipher] Cypher queries not supported in embedded mode, use searchGraph instead")
			return []
		} else {
			return await this.invokeCipherTool("cipher_query_graph", { query: cypherQuery })
		}
	}

	async getNodeRelationships(nodeId: string): Promise<any[]> {
		if (this.config.mode === "disabled") {
			return []
		}

		if (this.config.mode === "embedded") {
			const edgesData = this.embeddedStore.get("__graph_edges__")
			const edges = edgesData ? JSON.parse(edgesData.content) : []

			return edges.filter((edge: any) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
		} else {
			return await this.invokeCipherTool("cipher_get_node_relationships", { nodeId })
		}
	}
	// aincrok_change end

	async isHealthy(): Promise<boolean> {
		if (this.config.mode === "disabled" || this.config.mode === "embedded") {
			return true
		}

		try {
			const result = await this.invokeCipherTool("cipher_health_check", {})
			return result.healthy === true
		} catch {
			return false
		}
	}

	async dispose(): Promise<void> {
		if (this.mcpProcess) {
			this.mcpProcess.kill()
			this.mcpProcess = undefined
		}

		this.embeddedStore.clear()
		this.initialized = false
	}

	private calculateRelevance(query: string, content: string): number {
		// Simple relevance scoring for embedded mode
		const queryWords = query.toLowerCase().split(/\s+/)
		const contentLower = content.toLowerCase()
		let score = 0

		for (const word of queryWords) {
			if (contentLower.includes(word)) {
				score += 1
			}
		}

		return score / queryWords.length
	}

	private formatTimeAgo(timestamp: number): string {
		const now = Date.now()
		const diff = now - timestamp

		const seconds = Math.floor(diff / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
		if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
		return "just now"
	}

	private async invokeCipherTool(toolName: string, params: any): Promise<any> {
		// Use VS Code MCP API for tool invocation
		try {
			const result = await vscode.commands.executeCommand("vscode.executeMcpTool", toolName, params)
			return result
		} catch (error) {
			console.error(`[Cipher] Tool invocation failed for ${toolName}:`, error)
			throw error
		}
	}
}
