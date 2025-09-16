// aincrok_change - new file
/**
 * Abstract memory provider interface for Aincrok's memory system
 * Provides vendor-agnostic interface for different memory backends (Cipher, future providers)
 */

export interface IMemoryProvider {
	// Core memory operations
	store(message: string, content: string, type?: MemoryType): Promise<string> // aincrok_change - Generic store method for onboarding
	storeKnowledge(content: string, metadata?: any): Promise<string>
	storeReasoning(steps: ReasoningStep[]): Promise<string>
	searchRelevantMemories(query: string, limit?: number): Promise<Memory[]>
	getContextMemories(fileContext: string): Promise<Memory[]>
	getRecentMemories(limit: number): Promise<Memory[]>

	// Knowledge graph operations (based on Cipher documentation)
	addGraphNode?(label: string, properties: Record<string, any>): Promise<string>
	addGraphEdge?(
		fromNodeId: string,
		toNodeId: string,
		relationship: string,
		properties?: Record<string, any>,
	): Promise<string>
	searchGraph?(query: GraphQuery): Promise<GraphSearchResult[]>
	queryGraph?(cypherQuery: string): Promise<any[]>
	getNodeRelationships?(nodeId: string): Promise<GraphRelationship[]>

	// Workspace operations (optional - not all providers support team features)
	shareWithWorkspace?(memories: Memory[]): Promise<void>
	getWorkspaceMemories?(query: string): Promise<Memory[]>

	// Lifecycle management
	initialize(config?: any): Promise<void>
	isHealthy(): Promise<boolean>
	dispose(): Promise<void>
}

export interface Memory {
	id: string
	type: "knowledge" | "reasoning" | "pattern" | "business_rule"
	content: string
	metadata?: Record<string, any>
	timestamp: number
	relevanceScore?: number
	timeAgo?: string // Human-readable time difference
	// Backward compatibility properties
	task_id?: string
	file_context?: string[]
}

// Knowledge graph types based on Cipher documentation and academic research
export interface GraphQuery {
	nodeLabels?: string[]
	relationshipTypes?: string[]
	properties?: Record<string, any>
	limit?: number
}

export interface GraphSearchResult {
	nodeId: string
	label: string
	properties: Record<string, any>
	relationships?: GraphRelationship[]
	relevanceScore?: number
}

export interface GraphRelationship {
	id: string
	fromNodeId: string
	toNodeId: string
	type: string
	properties?: Record<string, any>
	timestamp?: number
}

// Node types for structured knowledge representation
export interface KnowledgeNode {
	id: string
	label: "code_symbol" | "file" | "concept" | "task" | "pattern" | "error" | "solution"
	properties: Record<string, any>
	createdAt: number
	updatedAt?: number
}

export interface ReasoningStep {
	step: number
	action: string
	thought: string
	result?: string
	error?: string
}

export type MemoryType = "knowledge" | "reasoning" | "pattern" | "business_rule"

// Backward compatibility enum-like object
export const MemoryTypeEnum = {
	SEMANTIC: "knowledge" as const,
	PROCEDURAL: "pattern" as const,
	EPISODIC: "business_rule" as const,
	WORKING: "reasoning" as const,
}

export interface SearchOptions {
	limit?: number
	threshold?: number
	types?: MemoryType[]
	timeRange?: {
		start?: number
		end?: number
	}
}
