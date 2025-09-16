// aincrok_change - Memory connection testing service
import * as vscode from "vscode"
import axios from "axios"
import neo4j from "neo4j-driver"
import { spawn } from "child_process"
import { MemoryConfigPayload, MemoryConnectionTestResultPayload } from "../../shared/WebviewMessage"
import { CipherAdapter, CipherConfig } from "../../core/memory/adapters/CipherAdapter"

export class MemoryConnectionTester {
	constructor(private outputChannel?: vscode.OutputChannel) {}

	/**
	 * Test memory connection based on configuration
	 */
	async testConnection(config: MemoryConfigPayload): Promise<MemoryConnectionTestResultPayload> {
		const results: MemoryConnectionTestResultPayload = {
			success: false,
			message: "Testing memory connection...",
			details: {},
		}

		try {
			switch (config.mode) {
				case "embedded":
					return await this.testEmbeddedMode(config)
				case "mcp":
					return await this.testMCPMode(config)
				case "api":
					return await this.testAPIMode(config)
				default:
					return {
						success: false,
						error: "Invalid memory mode",
						message: "Invalid memory mode specified",
					}
			}
		} catch (error) {
			this.log(`Connection test failed: ${error}`)
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				message: "Connection test failed",
			}
		}
	}

	/**
	 * Test all components in parallel before creating CipherAdapter
	 */
	private async validateAllComponentsBeforeCipher(
		config: MemoryConfigPayload,
	): Promise<MemoryConnectionTestResultPayload> {
		this.log("Validating all components before Cipher initialization...")

		const componentTests: Promise<{
			component: string
			result: { success: boolean; message: string; error?: string }
		}>[] = []

		// Test LLM provider if configured
		if (config.llm?.provider) {
			componentTests.push(this.testLLMProvider(config.llm).then((result) => ({ component: "llm", result })))
		}

		// Test embedding provider if configured
		if (config.embedding?.type) {
			componentTests.push(
				this.testEmbeddingProvider(config.embedding).then((result) => ({ component: "embedding", result })),
			)
		}

		// Test vector store if not in-memory
		if (config.vectorStore?.type && config.vectorStore.type !== "in-memory") {
			componentTests.push(
				this.testVectorStore(config.vectorStore).then((result) => ({ component: "vectorStore", result })),
			)
		}

		// Test knowledge graph if Neo4j
		if (config.knowledgeGraph?.enabled && config.knowledgeGraph.type === "neo4j") {
			componentTests.push(
				this.testNeo4j(config.knowledgeGraph).then((result) => ({ component: "knowledgeGraph", result })),
			)
		}

		// Run all component tests in parallel
		const componentResults = await Promise.all(componentTests)

		// Aggregate results
		const details: any = {}
		let allComponentsValid = true
		const failedComponents: string[] = []

		// Add results for configured components
		for (const { component, result } of componentResults) {
			details[component] = result
			if (!result.success) {
				allComponentsValid = false
				failedComponents.push(component)
			}
		}

		// Add success results for in-memory components
		if (config.vectorStore?.type === "in-memory") {
			details.vectorStore = { success: true, message: "In-memory vector store ready" }
		}
		if (config.knowledgeGraph?.enabled && config.knowledgeGraph.type === "in-memory") {
			details.knowledgeGraph = { success: true, message: "In-memory knowledge graph ready" }
		}

		// If any components failed, don't proceed to CipherAdapter testing
		if (!allComponentsValid) {
			return {
				success: false,
				message: `Component validation failed: ${failedComponents.join(", ")}`,
				error: "One or more components failed validation before Cipher initialization",
				details,
			}
		}

		this.log("All components validated successfully, proceeding with Cipher integration test...")
		return {
			success: true,
			message: "All components validated successfully",
			details,
		}
	}

	/**
	 * Test embedded mode with proper component pre-validation
	 */
	private async testEmbeddedMode(config: MemoryConfigPayload): Promise<MemoryConnectionTestResultPayload> {
		try {
			this.log("Testing Cipher embedded mode connection...")

			// STEP 1: Validate all individual components FIRST
			const componentValidation = await this.validateAllComponentsBeforeCipher(config)

			// If any component failed, return immediately with detailed errors
			if (!componentValidation.success) {
				return {
					...componentValidation,
					message: "Embedded mode component validation failed",
					details: {
						embedded: {
							success: false,
							message: "Component validation failed before Cipher initialization",
						},
						...componentValidation.details,
					},
				}
			}

			// STEP 2: Only create CipherAdapter AFTER all components are validated
			const cipherConfig: Partial<CipherConfig> = {
				mode: "embedded" as const,
				autoCapture: config.autoCapture || false,
				reasoningExtraction: config.extractReasoning || config.reasoningExtraction || false,
				workspace: {
					enabled: config.teamSharing || config.workspace?.enabled || false,
				},
				session: {
					maxSessions: 10,
					sessionTTL: 3600000, // 1 hour
					maxIterations: config.maxMemorySize || 1000,
				},
				llm: config.llm,
				embedding: config.embedding,
				vectorStore: config.vectorStore?.type
					? {
							type: config.vectorStore.type as "in-memory" | "qdrant" | "milvus",
							url: config.vectorStore.url,
							apiKey: config.vectorStore.apiKey,
						}
					: {
							type: "in-memory",
						},
				knowledgeGraph: config.knowledgeGraph?.enabled
					? {
							enabled: true,
							type: (config.knowledgeGraph.type as "in-memory" | "neo4j") || "in-memory",
							...(config.knowledgeGraph.type === "neo4j" && {
								neo4j: {
									host: config.knowledgeGraph.host,
									port: config.knowledgeGraph.port?.toString(),
									username: config.knowledgeGraph.username,
									password: config.knowledgeGraph.password,
									database: config.knowledgeGraph.database,
								},
							}),
							...(config.knowledgeGraph.type === "in-memory" && {
								inMemory: {
									maxNodes: config.knowledgeGraph.maxNodes || 1000,
									maxEdges: config.knowledgeGraph.maxEdges || 5000,
								},
							}),
						}
					: {
							enabled: false,
							type: "in-memory",
						},
			}

			// STEP 3: Test CipherAdapter integration
			const adapter = new CipherAdapter(cipherConfig)

			try {
				// Initialize the adapter
				await adapter.initialize()

				// Test the connection using isHealthy
				const isHealthy = await adapter.isHealthy()

				if (isHealthy) {
					return {
						success: true,
						message: "Cipher embedded mode and all components are working correctly",
						details: {
							embedded: { success: true, message: "Cipher integration successful" },
							...componentValidation.details,
						},
					}
				} else {
					return {
						success: false,
						error: "Cipher integration health check failed",
						message: "Components validated but Cipher integration failed",
						details: {
							embedded: { success: false, message: "Cipher integration health check failed" },
							...componentValidation.details,
						},
					}
				}
			} finally {
				// Clean up the adapter
				await adapter.dispose()
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				message: "Embedded mode test failed",
				details: {
					embedded: {
						success: false,
						message: "Failed to test embedded mode",
						error: error instanceof Error ? error.message : String(error),
					},
				},
			}
		}
	}

	/**
	 * Validate MCP command and arguments before testing Cipher
	 */
	private async validateMCPCommand(
		config: MemoryConfigPayload,
	): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			if (!config.mcpCommand) {
				return {
					success: false,
					message: "MCP command is required",
					error: "No MCP command specified",
				}
			}

			// Test if the command exists and is executable
			const { spawn } = require("child_process")

			return new Promise((resolve) => {
				const testProcess = spawn(config.mcpCommand, ["--help"], {
					stdio: "pipe",
					timeout: 5000,
				})

				let resolved = false

				testProcess.on("spawn", () => {
					if (!resolved) {
						resolved = true
						testProcess.kill()
						resolve({
							success: true,
							message: "MCP command is executable",
						})
					}
				})

				testProcess.on("error", (error: any) => {
					if (!resolved) {
						resolved = true
						resolve({
							success: false,
							message: "MCP command not found or not executable",
							error: `Command '${config.mcpCommand}' failed: ${error.message}`,
						})
					}
				})

				// Timeout fallback
				setTimeout(() => {
					if (!resolved) {
						resolved = true
						testProcess.kill()
						resolve({
							success: false,
							message: "MCP command test timed out",
							error: "Command validation took too long",
						})
					}
				}, 5000)
			})
		} catch (error) {
			return {
				success: false,
				message: "Failed to validate MCP command",
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	/**
	 * Test MCP server connection with pre-validation
	 */
	private async testMCPMode(config: MemoryConfigPayload): Promise<MemoryConnectionTestResultPayload> {
		try {
			this.log("Testing Cipher MCP server connection...")

			// STEP 1: Validate MCP command FIRST
			const mcpValidation = await this.validateMCPCommand(config)

			if (!mcpValidation.success) {
				return {
					success: false,
					message: "MCP command validation failed",
					error: mcpValidation.error,
					details: {
						mcp: mcpValidation,
					},
				}
			}

			// STEP 2: Create CipherAdapter only after command validation
			const cipherConfig: Partial<CipherConfig> = {
				mode: "mcp" as const,
				autoCapture: config.autoCapture || false,
				reasoningExtraction: config.extractReasoning || config.reasoningExtraction || false,
				workspace: {
					enabled: config.teamSharing || config.workspace?.enabled || false,
				},
				session: {
					maxSessions: 10,
					sessionTTL: 3600000, // 1 hour
					maxIterations: config.maxMemorySize || 1000,
				},
				mcp: {
					connectionType: "stdio",
					command: config.mcpCommand,
					args: config.mcpArgs || "",
					timeout: 30000,
					strictMode: false,
				},
			}

			const adapter = new CipherAdapter(cipherConfig)

			try {
				// Initialize the adapter
				await adapter.initialize()

				// Test the connection using isHealthy
				const isHealthy = await adapter.isHealthy()

				if (isHealthy) {
					return {
						success: true,
						message: "Cipher MCP server connection successful",
						details: {
							mcp: { success: true, message: "MCP server is responding and healthy" },
						},
					}
				} else {
					return {
						success: false,
						error: "MCP server health check failed",
						message: "MCP server is not responding properly",
						details: {
							mcp: { success: false, message: "MCP server health check failed" },
						},
					}
				}
			} finally {
				// Clean up the adapter
				await adapter.dispose()
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				message: "MCP server test failed",
				details: {
					mcp: {
						success: false,
						message: "Failed to test MCP server",
						error: error instanceof Error ? error.message : String(error),
					},
				},
			}
		}
	}

	/**
	 * Validate API endpoint before testing Cipher
	 */
	private async validateAPIEndpoint(
		config: MemoryConfigPayload,
	): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			if (!config.apiUrl) {
				return {
					success: false,
					message: "API URL is required",
					error: "No API URL specified",
				}
			}

			if (!config.apiKey) {
				return {
					success: false,
					message: "API key is required",
					error: "No API key specified",
				}
			}

			// Test basic connectivity to the API endpoint
			const headers: any = {
				"Content-Type": "application/json",
			}

			if (config.apiKey) {
				headers["Authorization"] = `Bearer ${config.apiKey}`
			}

			// Try multiple common endpoints to test connectivity
			const testEndpoints = ["/health", "/api/health", "/status", "/ping", "/api/status"]
			let lastError: any = null

			for (const endpoint of testEndpoints) {
				try {
					const response = await axios.get(config.apiUrl + endpoint, {
						headers,
						timeout: 5000,
						validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
					})

					if (response.status < 400) {
						return {
							success: true,
							message: `API endpoint is reachable (${endpoint})`,
						}
					} else if (response.status === 401) {
						return {
							success: false,
							message: "Invalid API key",
							error: "Authentication failed (401): Check your API key",
						}
					} else if (response.status === 403) {
						return {
							success: false,
							message: "API access forbidden",
							error: "Access forbidden (403): Check API key permissions",
						}
					}
				} catch (error: any) {
					lastError = error
					continue
				}
			}

			// If none of the endpoints worked, check if it's a connectivity issue
			try {
				// Try a basic request to the root URL
				const response = await axios.get(config.apiUrl, {
					headers,
					timeout: 5000,
					validateStatus: () => true, // Accept any status
				})

				return {
					success: true,
					message: "API endpoint is reachable (root endpoint responded)",
				}
			} catch (error: any) {
				if (error.code === "ECONNREFUSED") {
					return {
						success: false,
						message: "Cannot connect to API",
						error: `Connection refused: Check if the URL ${config.apiUrl} is correct and accessible`,
					}
				}
				if (error.code === "ETIMEDOUT") {
					return {
						success: false,
						message: "API request timed out",
						error: "Request timeout: The server took too long to respond",
					}
				}
				if (error.code === "ENOTFOUND") {
					return {
						success: false,
						message: "API URL not found",
						error: `DNS resolution failed: Check if the URL ${config.apiUrl} is correct`,
					}
				}

				return {
					success: false,
					message: "Failed to connect to API",
					error: error.message || String(error),
				}
			}
		} catch (error) {
			return {
				success: false,
				message: "Failed to validate API endpoint",
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	/**
	 * Test external API connection with pre-validation
	 */
	private async testAPIMode(config: MemoryConfigPayload): Promise<MemoryConnectionTestResultPayload> {
		try {
			this.log("Testing Cipher API mode connection...")

			// STEP 1: Validate API endpoint FIRST
			const apiValidation = await this.validateAPIEndpoint(config)

			if (!apiValidation.success) {
				return {
					success: false,
					message: "API endpoint validation failed",
					error: apiValidation.error,
					details: {
						api: apiValidation,
					},
				}
			}

			// STEP 2: Create CipherAdapter only after endpoint validation
			const cipherConfig: Partial<CipherConfig> = {
				mode: "api" as const,
				autoCapture: config.autoCapture || false,
				reasoningExtraction: config.extractReasoning || config.reasoningExtraction || false,
				workspace: {
					enabled: config.teamSharing || config.workspace?.enabled || false,
				},
				session: {
					maxSessions: 10,
					sessionTTL: 3600000, // 1 hour
					maxIterations: config.maxMemorySize || 1000,
				},
				api: {
					url: config.apiUrl,
					apiKey: config.apiKey,
					timeout: 30000,
					retries: 3,
					verifySSL: true,
				},
			}

			const adapter = new CipherAdapter(cipherConfig)

			try {
				// Initialize the adapter
				await adapter.initialize()

				// Test the connection using isHealthy
				const isHealthy = await adapter.isHealthy()

				if (isHealthy) {
					return {
						success: true,
						message: "Cipher API connection successful",
						details: {
							api: { success: true, message: "Cipher API integration successful" },
						},
					}
				} else {
					return {
						success: false,
						error: "API connection health check failed",
						message: "API endpoint validated but Cipher integration failed",
						details: {
							api: { success: false, message: "Cipher API integration health check failed" },
						},
					}
				}
			} finally {
				// Clean up the adapter
				await adapter.dispose()
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				message: "API connection test failed",
				details: {
					api: {
						success: false,
						message: "Failed to test API connection",
						error: error instanceof Error ? error.message : String(error),
					},
				},
			}
		}
	}

	/**
	 * Test LLM provider connection
	 */
	async testLLMProvider(llmConfig: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			this.log(`Testing LLM provider: ${llmConfig.provider}`)

			switch (llmConfig.provider) {
				case "openai":
				case "openai-compatible":
					return await this.testOpenAIConnection(llmConfig)
				case "anthropic":
					return await this.testAnthropicConnection(llmConfig)
				case "ollama":
					return await this.testOllamaConnection(llmConfig)
				default:
					return {
						success: false,
						message: `Unsupported LLM provider: ${llmConfig.provider}`,
					}
			}
		} catch (error) {
			return {
				success: false,
				message: "LLM provider test failed",
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	/**
	 * Test OpenAI API connection
	 */
	private async testOpenAIConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "https://api.openai.com/v1"
			const url = `${baseUrl}/models`

			// aincrok_change start - Add debug logging
			this.log(`Testing OpenAI connection: GET ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			this.log(`API Key: ${config.apiKey ? "***" + config.apiKey.slice(-4) : "missing"}`)
			// aincrok_change end

			const response = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${config.apiKey}`,
				},
				timeout: 5000,
			})

			if (response.status === 200) {
				this.log(`OpenAI connection successful (status: ${response.status})`)
				return { success: true, message: "OpenAI API connection successful" }
			}
			return {
				success: false,
				message: `OpenAI API returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "OpenAI")
			this.log(`OpenAI connection failed: ${errorDetails.fullError}`)

			if (error.response?.status === 401) {
				return {
					success: false,
					message: "Invalid OpenAI API key",
					error: `Authentication failed (401): Check your API key`,
				}
			}
			if (error.response?.status === 403) {
				return {
					success: false,
					message: "OpenAI API access forbidden",
					error: `Access forbidden (403): ${error.response?.data?.error?.message || "Check API key permissions"}`,
				}
			}
			if (error.code === "ECONNREFUSED") {
				return {
					success: false,
					message: "Cannot connect to OpenAI API",
					error: `Connection refused: Check if the URL ${config.baseUrl || "https://api.openai.com/v1"} is correct`,
				}
			}
			if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
				return {
					success: false,
					message: "OpenAI API request timed out",
					error: `Request timeout: The server took too long to respond`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to OpenAI API",
				error: errorDetails.userError,
			}
			// aincrok_change end
		}
	}

	/**
	 * Test Anthropic API connection
	 */
	private async testAnthropicConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "https://api.anthropic.com"
			const url = `${baseUrl}/v1/complete`

			// aincrok_change start - Add debug logging
			this.log(`Testing Anthropic connection: POST ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			this.log(`Model: ${config.model || "claude-3-haiku-20240307"}`)
			this.log(`API Key: ${config.apiKey ? "***" + config.apiKey.slice(-4) : "missing"}`)
			// aincrok_change end

			// Anthropic doesn't have a models endpoint, so we'll make a minimal completion request
			const response = await axios.post(
				url,
				{
					model: config.model || "claude-3-haiku-20240307",
					prompt: "\n\nHuman: Test\n\nAssistant:",
					max_tokens_to_sample: 1,
					temperature: 0,
				},
				{
					headers: {
						"x-api-key": config.apiKey,
						"anthropic-version": "2023-06-01",
						"content-type": "application/json",
					},
					timeout: 5000,
				},
			)

			if (response.status === 200) {
				this.log(`Anthropic connection successful (status: ${response.status})`)
				return { success: true, message: "Anthropic API connection successful" }
			}
			return {
				success: false,
				message: `Anthropic API returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "Anthropic")
			this.log(`Anthropic connection failed: ${errorDetails.fullError}`)

			if (error.response?.status === 401) {
				return {
					success: false,
					message: "Invalid Anthropic API key",
					error: `Authentication failed (401): Check your API key`,
				}
			}
			if (error.response?.status === 400) {
				return {
					success: false,
					message: "Invalid request to Anthropic API",
					error: `Bad request (400): ${error.response?.data?.error?.message || "Check model name and parameters"}`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to Anthropic API",
				error: errorDetails.userError,
			}
			// aincrok_change end
		}
	}

	/**
	 * Test Ollama connection
	 */
	private async testOllamaConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "http://localhost:11434"
			const url = `${baseUrl}/api/tags`

			// aincrok_change start - Add debug logging
			this.log(`Testing Ollama connection: GET ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			// aincrok_change end

			const response = await axios.get(url, {
				timeout: 5000,
			})

			if (response.status === 200) {
				this.log(`Ollama connection successful (status: ${response.status})`)
				return { success: true, message: "Ollama connection successful" }
			}
			return {
				success: false,
				message: `Ollama returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "Ollama")
			this.log(`Ollama connection failed: ${errorDetails.fullError}`)

			if (error.code === "ECONNREFUSED") {
				return {
					success: false,
					message: "Cannot connect to Ollama",
					error: `Connection refused: Make sure Ollama is running at ${config.baseUrl || "http://localhost:11434"}`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to Ollama",
				error: errorDetails.userError,
			}
			// aincrok_change end
		}
	}

	/**
	 * Test embedding provider connection
	 */
	async testEmbeddingProvider(embeddingConfig: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			this.log(`Testing embedding provider: ${embeddingConfig.type}`)

			// aincrok_change - Reuse the same test function as LLM provider
			switch (embeddingConfig.type) {
				case "openai":
				case "openai-compatible":
					// Use the same testOpenAIConnection as LLM provider (GET /models)
					return await this.testOpenAIConnection(embeddingConfig)
				case "ollama":
					return await this.testOllamaEmbedding(embeddingConfig)
				default:
					return {
						success: false,
						message: `Unsupported embedding provider: ${embeddingConfig.type}`,
					}
			}
		} catch (error) {
			return {
				success: false,
				message: "Embedding provider test failed",
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	/**
	 * Test OpenAI embedding
	 * @deprecated No longer used - embedding providers now use testOpenAIConnection (same as LLM)
	 */
	private async testOpenAIEmbedding(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "https://api.openai.com/v1"
			const url = `${baseUrl}/embeddings`

			// aincrok_change start - Add debug logging
			this.log(`Testing OpenAI Embedding: POST ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			this.log(`Model: ${config.model || "text-embedding-ada-002"}`)
			this.log(`API Key: ${config.apiKey ? "***" + config.apiKey.slice(-4) : "missing"}`)
			// aincrok_change end

			const response = await axios.post(
				url,
				{
					model: config.model || "text-embedding-ada-002",
					input: "test",
				},
				{
					headers: {
						Authorization: `Bearer ${config.apiKey}`,
						"Content-Type": "application/json",
					},
					timeout: 5000,
				},
			)

			if (response.status === 200) {
				this.log(`OpenAI embedding connection successful (status: ${response.status})`)
				return { success: true, message: "OpenAI embedding connection successful" }
			}
			return {
				success: false,
				message: `OpenAI embedding returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "OpenAI Embedding")
			this.log(`OpenAI embedding connection failed: ${errorDetails.fullError}`)

			if (error.response?.status === 401) {
				return {
					success: false,
					message: "Invalid OpenAI API key for embeddings",
					error: `Authentication failed (401): Check your API key`,
				}
			}
			if (error.response?.status === 404) {
				return {
					success: false,
					message: "OpenAI embedding model not found",
					error: `Model not found (404): ${config.model || "text-embedding-ada-002"} may not be available`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to OpenAI embedding API",
				error: errorDetails.userError,
			}
			// aincrok_change end
		}
	}

	/**
	 * Test OpenAI-compatible embedding provider using the same method as LLM
	 * aincrok_change - Use models endpoint for compatibility
	 * @deprecated No longer used - embedding providers now use testOpenAIConnection (same as LLM)
	 */
	private async testOpenAICompatibleEmbedding(
		config: any,
	): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "https://api.openai.com/v1"
			const url = `${baseUrl}/models`

			// aincrok_change - Add debug logging
			this.log(`Testing OpenAI-compatible Embedding: GET ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			this.log(`API Key: ${config.apiKey ? "***" + config.apiKey.slice(-4) : "missing"}`)

			const response = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${config.apiKey}`,
				},
				timeout: 5000,
			})

			if (response.status === 200) {
				this.log(`OpenAI-compatible embedding connection successful (status: ${response.status})`)
				return { success: true, message: "OpenAI-compatible embedding API connection successful" }
			}
			return {
				success: false,
				message: `OpenAI-compatible embedding API returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "OpenAI-compatible Embedding")
			this.log(`OpenAI-compatible embedding connection failed: ${errorDetails.fullError}`)

			if (error.response?.status === 401) {
				return {
					success: false,
					message: "Invalid API key for OpenAI-compatible embeddings",
					error: `Authentication failed (401): Check your API key`,
				}
			}
			if (error.response?.status === 403) {
				return {
					success: false,
					message: "OpenAI-compatible embedding API access forbidden",
					error: `Access forbidden (403): ${error.response?.data?.error?.message || "Check API key permissions"}`,
				}
			}
			if (error.code === "ECONNREFUSED") {
				return {
					success: false,
					message: "Cannot connect to OpenAI-compatible embedding API",
					error: `Connection refused: Check if the URL ${config.baseUrl || "https://api.openai.com/v1"} is correct`,
				}
			}
			if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
				return {
					success: false,
					message: "OpenAI-compatible embedding API request timed out",
					error: `Request timeout: The server took too long to respond`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to OpenAI-compatible embedding API",
				error: errorDetails.userError,
			}
		}
	}

	/**
	 * Test Ollama embedding
	 */
	private async testOllamaEmbedding(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const baseUrl = config.baseUrl || "http://localhost:11434"
			const url = `${baseUrl}/api/embeddings`

			// aincrok_change start - Add debug logging
			this.log(`Testing Ollama Embedding: POST ${url}`)
			this.log(`Using base URL: ${baseUrl}`)
			this.log(`Model: ${config.model || "nomic-embed-text"}`)
			// aincrok_change end

			const response = await axios.post(
				url,
				{
					model: config.model || "nomic-embed-text",
					prompt: "test",
				},
				{
					timeout: 5000,
				},
			)

			if (response.status === 200) {
				this.log(`Ollama embedding connection successful (status: ${response.status})`)
				return { success: true, message: "Ollama embedding connection successful" }
			}
			return {
				success: false,
				message: `Ollama embedding returned unexpected status: ${response.status}`,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "Ollama Embedding")
			this.log(`Ollama embedding connection failed: ${errorDetails.fullError}`)

			if (error.code === "ECONNREFUSED") {
				return {
					success: false,
					message: "Cannot connect to Ollama embedding",
					error: `Connection refused: Make sure Ollama is running at ${config.baseUrl || "http://localhost:11434"}`,
				}
			}
			if (error.response?.status === 404) {
				return {
					success: false,
					message: "Ollama embedding model not found",
					error: `Model not found (404): ${config.model || "nomic-embed-text"} may not be pulled`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to Ollama embedding",
				error: errorDetails.userError,
			}
			// aincrok_change end
		}
	}

	/**
	 * Test vector store connection
	 */
	async testVectorStore(vectorConfig: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			this.log(`Testing vector store: ${vectorConfig.type}`)

			switch (vectorConfig.type) {
				case "qdrant":
					return await this.testQdrantConnection(vectorConfig)
				case "milvus":
					return await this.testMilvusConnection(vectorConfig)
				case "chroma":
					return await this.testChromaConnection(vectorConfig)
				default:
					return {
						success: false,
						message: `Unsupported vector store: ${vectorConfig.type}`,
					}
			}
		} catch (error) {
			return {
				success: false,
				message: "Vector store test failed",
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	/**
	 * Test Qdrant connection
	 */
	private async testQdrantConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const url = config.url || "http://localhost:6333"
			const headers: any = {
				"Content-Type": "application/json",
			}

			if (config.apiKey) {
				headers["api-key"] = config.apiKey
			}

			const response = await axios.get(`${url}/collections`, {
				headers,
				timeout: 5000,
			})

			if (response.status === 200) {
				return { success: true, message: "Qdrant connection successful" }
			}
			return { success: false, message: "Qdrant returned unexpected status" }
		} catch (error: any) {
			return {
				success: false,
				message: "Failed to connect to Qdrant",
				error: error.message || String(error),
			}
		}
	}

	/**
	 * Test Milvus connection
	 */
	private async testMilvusConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const url = config.url || "http://localhost:19530"
			const response = await axios.get(`${url}/v1/vector/collections`, {
				headers: {
					"Content-Type": "application/json",
					...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
				},
				timeout: 5000,
			})

			if (response.status === 200) {
				return { success: true, message: "Milvus connection successful" }
			}
			return { success: false, message: "Milvus returned unexpected status" }
		} catch (error: any) {
			return {
				success: false,
				message: "Failed to connect to Milvus",
				error: error.message || String(error),
			}
		}
	}

	/**
	 * Test Chroma connection
	 */
	private async testChromaConnection(config: any): Promise<{ success: boolean; message: string; error?: string }> {
		try {
			const url = config.url || "http://localhost:8000"
			const response = await axios.get(`${url}/api/v1/heartbeat`, {
				headers: {
					...(config.apiKey && { "X-Chroma-Token": config.apiKey }),
				},
				timeout: 5000,
			})

			if (response.status === 200) {
				return { success: true, message: "Chroma connection successful" }
			}
			return { success: false, message: "Chroma returned unexpected status" }
		} catch (error: any) {
			return {
				success: false,
				message: "Failed to connect to Chroma",
				error: error.message || String(error),
			}
		}
	}

	/**
	 * Test Neo4j connection
	 * aincrok_change - Updated to use neo4j-driver with Bolt protocol
	 */
	async testNeo4j(graphConfig: any): Promise<{ success: boolean; message: string; error?: string }> {
		let driver = null
		try {
			const host = graphConfig.host || "localhost"
			const port = graphConfig.port || 7687
			const username = graphConfig.username || "neo4j"
			const password = graphConfig.password
			const database = graphConfig.database || "neo4j"

			// aincrok_change start - Add debug logging
			this.log(`Testing Neo4j connection: ${host}:${port}`)
			this.log(`Database: ${database}, Username: ${username}`)
			// aincrok_change end

			if (!password) {
				return {
					success: false,
					message: "Neo4j password is required",
					error: "Missing password: Please provide a password for Neo4j authentication",
				}
			}

			// aincrok_change - Use neo4j-driver with Bolt protocol
			const uri = `neo4j://${host}:${port}`
			this.log(`Testing Neo4j Bolt connection: ${uri}`)

			// Create driver with authentication
			driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

			// Test connection using getServerInfo (recommended method)
			const serverInfo = await driver.getServerInfo()

			this.log(`Neo4j connection successful`)
			this.log(`Server info: ${JSON.stringify(serverInfo)}`)

			return {
				success: true,
				message: `Neo4j connection successful`,
			}
		} catch (error: any) {
			// aincrok_change start - Enhanced error reporting
			const errorDetails = this.formatErrorDetails(error, "Neo4j")
			this.log(`Neo4j connection failed: ${errorDetails.fullError}`)

			// Handle specific Neo4j error codes
			if (error.code === "Neo.ClientError.Security.Unauthorized") {
				return {
					success: false,
					message: "Neo4j authentication failed",
					error: "Invalid username or password",
				}
			}

			if (error.code === "ServiceUnavailable" || error.code === "ECONNREFUSED") {
				return {
					success: false,
					message: "Cannot connect to Neo4j",
					error: `Connection refused: Make sure Neo4j is running at ${graphConfig.host || "localhost"}:${graphConfig.port || 7687}`,
				}
			}

			return {
				success: false,
				message: "Failed to connect to Neo4j",
				error: errorDetails.userError,
			}
			// aincrok_change end
		} finally {
			// Always close the driver to free resources
			if (driver) {
				try {
					await driver.close()
					this.log("Neo4j driver closed")
				} catch (closeError) {
					this.log(`Error closing Neo4j driver: ${closeError}`)
				}
			}
		}
	}

	/**
	 * Log message to output channel
	 */
	private log(message: string) {
		if (this.outputChannel) {
			this.outputChannel.appendLine(`[MemoryConnectionTester] ${message}`)
		}
		console.log(`[MemoryConnectionTester] ${message}`)
	}

	// aincrok_change start - Add error formatting helper
	/**
	 * Format error details for better debugging
	 */
	private formatErrorDetails(error: any, service: string): { userError: string; fullError: string } {
		let userError = ""
		let fullError = ""

		if (error.response) {
			// Server responded with error
			const status = error.response.status
			const statusText = error.response.statusText
			const data = error.response.data

			userError = `HTTP ${status}: ${statusText}`
			if (data?.error?.message) {
				userError += ` - ${data.error.message}`
			} else if (data?.message) {
				userError += ` - ${data.message}`
			} else if (typeof data === "string") {
				userError += ` - ${data}`
			}

			fullError = `HTTP ${status} ${statusText} - Response: ${JSON.stringify(data)}`
		} else if (error.request) {
			// Request made but no response
			if (error.code === "ECONNREFUSED") {
				userError = `Connection refused - Cannot reach ${service} server`
			} else if (error.code === "ETIMEDOUT") {
				userError = `Request timeout - ${service} server did not respond`
			} else if (error.code === "ENOTFOUND") {
				userError = `Server not found - Check the URL`
			} else {
				userError = `No response from ${service} server: ${error.code || "Unknown error"}`
			}
			fullError = `Request error: ${error.code} - ${error.message}`
		} else {
			// Something else happened
			userError = error.message || `Unknown error connecting to ${service}`
			fullError = error.stack || error.toString()
		}

		return { userError, fullError }
	}
	// aincrok_change end
}
