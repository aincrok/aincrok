// aincrok_change - new file
// Webview types for memory configuration - mirrors ExtensionMessage types from main extension

export type MemoryConfiguration = {
	mode?: "disabled" | "embedded" | "mcp" | "api"
	autoCapture?: boolean
	extractReasoning?: boolean
	teamSharing?: boolean
	llmProvider?: "openai" | "anthropic" | "ollama" | "openrouter" | "gemini"
	llmModel?: string
	llmApiKey?: string
	llmBaseUrl?: string
	embeddingProvider?: "openai" | "ollama" | "gemini" | "bedrock" | "azure" | "voyage" | "qwen"
	embeddingModel?: string
	embeddingApiKey?: string
	embeddingBaseUrl?: string
	embeddingDimensions?: number
	vectorStore?: "in-memory" | "qdrant" | "milvus"
	vectorStoreUrl?: string
	vectorStoreApiKey?: string
	knowledgeGraphEnabled?: boolean
	knowledgeGraphType?: "in-memory" | "neo4j"
	neo4jHost?: string
	neo4jPort?: string
	neo4jUsername?: string
	neo4jPassword?: string
	neo4jDatabase?: string
	inMemoryMaxNodes?: number
	inMemoryMaxEdges?: number
	sessionTTL?: number
	maxSessions?: number
	maxIterations?: number
	mcpConnectionType?: "stdio" | "sse" | "http"
	mcpCommand?: string
	mcpArgs?: string
	apiUrl?: string
	apiKey?: string
}
