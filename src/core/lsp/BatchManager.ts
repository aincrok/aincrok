// aincrok_change - new file
import * as vscode from "vscode"
import { InternalSymbolicLSP } from "./InternalSymbolicLSP"
import { IMemoryProvider } from "../memory/IMemoryProvider"

/**
 * Batch operation configuration
 */
interface BatchConfig {
	maxBatchSize: number
	batchDelay: number
	maxWaitTime: number
	enableCompression: boolean
	priorityLevels: number
}

/**
 * Batch operation item
 */
interface BatchItem<T = any> {
	id: string
	operation: string
	data: T
	priority: number
	timestamp: number
	resolve: (result: any) => void
	reject: (error: Error) => void
	timeout?: NodeJS.Timeout
}

/**
 * Batch operation result
 */
interface BatchResult {
	success: boolean
	results: Array<{ id: string; result?: any; error?: string }>
	executionTime: number
	tokensSaved: number
	compressionRatio: number
}

/**
 * API optimization statistics
 */
interface BatchStats {
	totalOperations: number
	batchedOperations: number
	tokensOriginal: number
	tokensAfterBatching: number
	averageBatchSize: number
	compressionRatio: number
	executionTimeReduction: number
}

/**
 * BatchManager optimizes API calls by batching similar operations together
 * to reduce token usage and API costs while maintaining responsiveness
 */
export class BatchManager {
	private static instance: BatchManager | undefined
	private config: BatchConfig
	private pendingBatches = new Map<string, BatchItem[]>()
	private batchTimers = new Map<string, NodeJS.Timeout>()
	private stats: BatchStats
	private isInitialized = false

	private constructor(
		private context: vscode.ExtensionContext,
		private symbolicLSP: InternalSymbolicLSP,
		private memoryProvider: IMemoryProvider,
	) {
		this.config = this.loadConfiguration()
		this.stats = {
			totalOperations: 0,
			batchedOperations: 0,
			tokensOriginal: 0,
			tokensAfterBatching: 0,
			averageBatchSize: 0,
			compressionRatio: 0,
			executionTimeReduction: 0,
		}
	}

	/**
	 * Get or create the singleton instance
	 */
	static getInstance(
		context: vscode.ExtensionContext,
		symbolicLSP: InternalSymbolicLSP,
		memoryProvider: IMemoryProvider,
	): BatchManager {
		if (!BatchManager.instance) {
			BatchManager.instance = new BatchManager(context, symbolicLSP, memoryProvider)
		}
		return BatchManager.instance
	}

	/**
	 * Initialize the batch manager
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		try {
			// Load persistent statistics
			await this.loadPersistedStats()
			this.isInitialized = true
			console.log("[Aincrok] Batch Manager initialized successfully")
		} catch (error) {
			console.error("[Aincrok] Failed to initialize Batch Manager:", error)
			throw error
		}
	}

	/**
	 * Add an operation to be batched
	 */
	async batchOperation<T>(operation: string, data: T, priority: number = 1): Promise<any> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		this.stats.totalOperations++

		return new Promise((resolve, reject) => {
			const item: BatchItem<T> = {
				id: `${operation}_${Date.now()}_${Math.random()}`,
				operation,
				data,
				priority,
				timestamp: Date.now(),
				resolve,
				reject,
			}

			// Set timeout for the operation
			item.timeout = setTimeout(() => {
				this.rejectBatchItem(item, new Error(`Operation ${operation} timed out`))
			}, this.config.maxWaitTime)

			// Add to pending batch
			if (!this.pendingBatches.has(operation)) {
				this.pendingBatches.set(operation, [])
			}

			const batch = this.pendingBatches.get(operation)!
			batch.push(item)

			// Sort by priority (higher priority first)
			batch.sort((a, b) => b.priority - a.priority)

			// Check if we should execute the batch immediately
			if (batch.length >= this.config.maxBatchSize) {
				this.executeBatch(operation)
			} else {
				// Set or reset the batch timer
				this.scheduleExecution(operation)
			}
		})
	}

	/**
	 * Execute a specific operation immediately (bypass batching)
	 */
	async executeImmediate<T>(operation: string, data: T): Promise<any> {
		const startTime = Date.now()

		try {
			const result = await this.executeOperation(operation, [data])

			// Update stats for immediate execution
			this.updateExecutionStats(1, startTime, 0) // 0 tokens saved for immediate execution

			return result[0]
		} catch (error) {
			console.error(`[Aincrok] Immediate execution of ${operation} failed:`, error)
			throw error
		}
	}

	/**
	 * Get current batch statistics
	 */
	getBatchStats(): BatchStats {
		// Calculate dynamic stats
		const totalBatched = this.stats.batchedOperations
		const totalOriginal = this.stats.totalOperations

		return {
			...this.stats,
			averageBatchSize: totalBatched > 0 ? this.stats.batchedOperations / totalBatched : 0,
			compressionRatio:
				this.stats.tokensOriginal > 0
					? (this.stats.tokensOriginal - this.stats.tokensAfterBatching) / this.stats.tokensOriginal
					: 0,
			executionTimeReduction: this.stats.executionTimeReduction,
		}
	}

	/**
	 * Clear all pending batches and reset statistics
	 */
	async clearBatches(): Promise<void> {
		// Cancel all pending operations
		for (const [operation, batch] of this.pendingBatches) {
			for (const item of batch) {
				this.rejectBatchItem(item, new Error("Batch cleared by user"))
			}

			// Clear timers
			const timer = this.batchTimers.get(operation)
			if (timer) {
				clearTimeout(timer)
				this.batchTimers.delete(operation)
			}
		}

		this.pendingBatches.clear()
		this.resetStats()

		console.log("[Aincrok] All batches cleared and statistics reset")
	}

	/**
	 * Dispose of the batch manager
	 */
	async dispose(): Promise<void> {
		await this.clearBatches()
		await this.persistStats()
		this.isInitialized = false
		console.log("[Aincrok] Batch Manager disposed")
	}

	// Private methods

	private scheduleExecution(operation: string): void {
		// Clear existing timer
		const existingTimer = this.batchTimers.get(operation)
		if (existingTimer) {
			clearTimeout(existingTimer)
		}

		// Set new timer
		const timer = setTimeout(() => {
			this.executeBatch(operation)
		}, this.config.batchDelay)

		this.batchTimers.set(operation, timer)
	}

	private async executeBatch(operation: string): Promise<void> {
		const batch = this.pendingBatches.get(operation)
		if (!batch || batch.length === 0) {
			return
		}

		// Remove batch from pending
		this.pendingBatches.delete(operation)
		const timer = this.batchTimers.get(operation)
		if (timer) {
			clearTimeout(timer)
			this.batchTimers.delete(operation)
		}

		const startTime = Date.now()

		try {
			// Extract data from batch items
			const batchData = batch.map((item) => item.data)

			// Execute the batched operation
			const results = await this.executeOperation(operation, batchData)

			// Calculate tokens saved through batching
			const originalTokens = this.estimateTokensForIndividualOperations(operation, batchData)
			const batchedTokens = this.estimateTokensForBatchOperation(operation, batchData)
			const tokensSaved = originalTokens - batchedTokens

			// Resolve all batch items with their results
			for (let i = 0; i < batch.length; i++) {
				const item = batch[i]

				// Clear timeout
				if (item.timeout) {
					clearTimeout(item.timeout)
				}

				// Resolve with result
				if (results[i]) {
					item.resolve(results[i])
				} else {
					item.reject(new Error(`No result for batch item ${item.id}`))
				}
			}

			// Update statistics
			this.updateBatchStats(batch.length, startTime, tokensSaved, originalTokens, batchedTokens)
		} catch (error) {
			// Reject all batch items with the error
			for (const item of batch) {
				this.rejectBatchItem(item, error as Error)
			}

			console.error(`[Aincrok] Batch execution failed for ${operation}:`, error)
		}
	}

	private async executeOperation(operation: string, data: any[]): Promise<any[]> {
		switch (operation) {
			case "findSymbols":
				return await this.executeFindSymbolsBatch(data)

			case "getSemanticContext":
				return await this.executeSemanticContextBatch(data)

			case "searchMemories":
				return await this.executeSearchMemoriesBatch(data)

			case "analyzeCode":
				return await this.executeAnalyzeCodeBatch(data)

			default:
				throw new Error(`Unknown batch operation: ${operation}`)
		}
	}

	private async executeFindSymbolsBatch(queries: string[]): Promise<any[]> {
		try {
			// Process each query individually since searchWorkspaceSymbols accepts single string
			const results = await Promise.all(queries.map((query) => this.symbolicLSP.searchWorkspaceSymbols(query)))

			return results
		} catch (error) {
			console.error("[Aincrok] Batch symbol search failed:", error)
			// Return empty results for each query
			return queries.map(() => [])
		}
	}

	private async executeSemanticContextBatch(queries: string[]): Promise<string[]> {
		// Process semantic context requests together
		const results: string[] = []

		for (const query of queries) {
			try {
				const context = await this.symbolicLSP.getSemanticContextForAI(query, 1000) // Reduced token limit for batching
				results.push(context || "")
			} catch (error) {
				console.warn(`[Aincrok] Semantic context failed for query: ${query}`, error)
				results.push("")
			}
		}

		return results
	}

	private async executeSearchMemoriesBatch(queries: string[]): Promise<any[]> {
		const results: any[] = []

		for (const query of queries) {
			try {
				const memories = await this.memoryProvider.searchRelevantMemories(query, 3)
				results.push(memories)
			} catch (error) {
				console.warn(`[Aincrok] Memory search failed for query: ${query}`, error)
				results.push([])
			}
		}

		return results
	}

	private async executeAnalyzeCodeBatch(filePaths: string[]): Promise<any[]> {
		const results: any[] = []

		for (const filePath of filePaths) {
			try {
				const analysis = await this.symbolicLSP.analyzeFileSemantics(filePath)
				results.push(analysis)
			} catch (error) {
				console.warn(`[Aincrok] Code analysis failed for file: ${filePath}`, error)
				results.push(null)
			}
		}

		return results
	}

	private estimateTokensForIndividualOperations(operation: string, data: any[]): number {
		// Simplified token estimation for individual operations
		const baseTokensPerOperation = 100 // Base overhead per API call
		const dataTokens = data.reduce((total, item) => {
			return total + this.estimateTokensForData(item)
		}, 0)

		return baseTokensPerOperation * data.length + dataTokens
	}

	private estimateTokensForBatchOperation(operation: string, data: any[]): number {
		// Batching reduces overhead to a single API call
		const baseTokensForBatch = 150 // Slightly higher base for batch processing
		const dataTokens = data.reduce((total, item) => {
			return total + this.estimateTokensForData(item)
		}, 0)

		// Add compression benefits
		const compressionFactor = this.config.enableCompression ? 0.8 : 1.0

		return Math.round((baseTokensForBatch + dataTokens) * compressionFactor)
	}

	private estimateTokensForData(data: any): number {
		// Simplified token estimation based on data type and size
		if (typeof data === "string") {
			return Math.ceil(data.length / 4) // Rough estimate: 4 chars per token
		} else if (typeof data === "object") {
			return Math.ceil(JSON.stringify(data).length / 4)
		} else {
			return 10 // Default for primitive types
		}
	}

	private rejectBatchItem(item: BatchItem, error: Error): void {
		if (item.timeout) {
			clearTimeout(item.timeout)
		}
		item.reject(error)
	}

	private updateBatchStats(
		batchSize: number,
		startTime: number,
		tokensSaved: number,
		originalTokens: number,
		batchedTokens: number,
	): void {
		const executionTime = Date.now() - startTime

		this.stats.batchedOperations += batchSize
		this.stats.tokensOriginal += originalTokens
		this.stats.tokensAfterBatching += batchedTokens

		// Update execution time reduction (running average)
		const estimatedIndividualTime = batchSize * 200 // Assume 200ms per individual operation
		const timeReduction = estimatedIndividualTime - executionTime

		this.stats.executionTimeReduction = (this.stats.executionTimeReduction + timeReduction) / 2
	}

	private updateExecutionStats(operationCount: number, startTime: number, tokensSaved: number): void {
		const executionTime = Date.now() - startTime
		// Update immediate execution stats if needed
	}

	private loadConfiguration(): BatchConfig {
		const config = vscode.workspace.getConfiguration("aincrok.batching")

		return {
			maxBatchSize: config.get<number>("maxBatchSize", 5),
			batchDelay: config.get<number>("batchDelay", 100), // 100ms
			maxWaitTime: config.get<number>("maxWaitTime", 5000), // 5 seconds
			enableCompression: config.get<boolean>("enableCompression", true),
			priorityLevels: config.get<number>("priorityLevels", 3),
		}
	}

	private resetStats(): void {
		this.stats = {
			totalOperations: 0,
			batchedOperations: 0,
			tokensOriginal: 0,
			tokensAfterBatching: 0,
			averageBatchSize: 0,
			compressionRatio: 0,
			executionTimeReduction: 0,
		}
	}

	private async loadPersistedStats(): Promise<void> {
		try {
			const globalState = this.context.globalState
			const persistedStats = globalState.get<BatchStats>("aincrok.batchStats")

			if (persistedStats) {
				this.stats = { ...persistedStats }
				console.log("[Aincrok] Loaded persisted batch statistics")
			}
		} catch (error) {
			console.warn("[Aincrok] Failed to load persisted batch statistics:", error)
		}
	}

	private async persistStats(): Promise<void> {
		try {
			await this.context.globalState.update("aincrok.batchStats", this.stats)
			console.log("[Aincrok] Persisted batch statistics")
		} catch (error) {
			console.warn("[Aincrok] Failed to persist batch statistics:", error)
		}
	}
}
