// aincrok_change - new file
/**
 * Incremental Message Processing Service
 *
 * Handles large message streams by breaking them into smaller chunks
 * to prevent UI freezing and grey screen issues during heavy message processing
 */

export interface MessageChunk {
	id: string
	content: string
	isComplete: boolean
	chunkIndex: number
	totalChunks: number
}

export interface ProcessingStats {
	totalMessages: number
	processedMessages: number
	pendingChunks: number
	processingTimeMs: number
	lastProcessedAt: number
}

export interface IncrementalProcessorConfig {
	/** Maximum chunk size in characters */
	maxChunkSize: number
	/** Processing interval in milliseconds */
	processingIntervalMs: number
	/** Maximum messages to process per interval */
	maxMessagesPerInterval: number
	/** Enable debug logging */
	debugMode?: boolean
}

export class IncrementalMessageProcessor {
	private static instance: IncrementalMessageProcessor | null = null

	private config: IncrementalProcessorConfig
	private messageQueue: MessageChunk[] = []
	private processingTimer: NodeJS.Timeout | null = null
	private isProcessing = false
	private stats: ProcessingStats = {
		totalMessages: 0,
		processedMessages: 0,
		pendingChunks: 0,
		processingTimeMs: 0,
		lastProcessedAt: 0,
	}

	private processors = new Map<string, (chunk: MessageChunk) => Promise<void>>()

	private constructor(config: IncrementalProcessorConfig) {
		this.config = config
	}

	public static getInstance(config?: IncrementalProcessorConfig): IncrementalMessageProcessor {
		if (!IncrementalMessageProcessor.instance) {
			const defaultConfig: IncrementalProcessorConfig = {
				maxChunkSize: 1000, // 1KB chunks
				processingIntervalMs: 16, // ~60fps
				maxMessagesPerInterval: 5,
				debugMode: false,
			}

			IncrementalMessageProcessor.instance = new IncrementalMessageProcessor({
				...defaultConfig,
				...config,
			})
		}
		return IncrementalMessageProcessor.instance
	}

	/**
	 * Start the message processor
	 */
	public start(): void {
		if (this.processingTimer) {
			return
		}

		this.processingTimer = setInterval(() => {
			this.processMessageBatch()
		}, this.config.processingIntervalMs)

		if (this.config.debugMode) {
			console.log("[IncrementalProcessor] Started with config:", this.config)
		}
	}

	/**
	 * Stop the message processor
	 */
	public stop(): void {
		if (this.processingTimer) {
			clearInterval(this.processingTimer)
			this.processingTimer = null
		}

		this.messageQueue = []
		this.isProcessing = false

		if (this.config.debugMode) {
			console.log("[IncrementalProcessor] Stopped")
		}
	}

	/**
	 * Add a message to the processing queue, automatically chunking if necessary
	 */
	public queueMessage(messageId: string, content: string): void {
		const chunks = this.createChunks(messageId, content)
		this.messageQueue.push(...chunks)
		this.stats.totalMessages++
		this.stats.pendingChunks = this.messageQueue.length

		if (this.config.debugMode) {
			console.log(`[IncrementalProcessor] Queued message ${messageId} (${chunks.length} chunks)`)
		}
	}

	/**
	 * Register a processor function for specific message types
	 */
	public registerProcessor(messageType: string, processor: (chunk: MessageChunk) => Promise<void>): void {
		this.processors.set(messageType, processor)

		if (this.config.debugMode) {
			console.log(`[IncrementalProcessor] Registered processor for type: ${messageType}`)
		}
	}

	/**
	 * Remove a processor
	 */
	public unregisterProcessor(messageType: string): void {
		this.processors.delete(messageType)

		if (this.config.debugMode) {
			console.log(`[IncrementalProcessor] Unregistered processor for type: ${messageType}`)
		}
	}

	/**
	 * Get current processing statistics
	 */
	public getStats(): ProcessingStats {
		return { ...this.stats }
	}

	/**
	 * Clear all queued messages
	 */
	public clearQueue(): void {
		this.messageQueue = []
		this.stats.pendingChunks = 0

		if (this.config.debugMode) {
			console.log("[IncrementalProcessor] Queue cleared")
		}
	}

	/**
	 * Check if processor is currently processing messages
	 */
	public isCurrentlyProcessing(): boolean {
		return this.isProcessing
	}

	/**
	 * Update processor configuration
	 */
	public updateConfig(newConfig: Partial<IncrementalProcessorConfig>): void {
		this.config = { ...this.config, ...newConfig }

		if (this.config.debugMode) {
			console.log("[IncrementalProcessor] Config updated:", this.config)
		}
	}

	private createChunks(messageId: string, content: string): MessageChunk[] {
		if (content.length <= this.config.maxChunkSize) {
			return [
				{
					id: `${messageId}_0`,
					content,
					isComplete: true,
					chunkIndex: 0,
					totalChunks: 1,
				},
			]
		}

		const chunks: MessageChunk[] = []
		const totalChunks = Math.ceil(content.length / this.config.maxChunkSize)

		for (let i = 0; i < totalChunks; i++) {
			const start = i * this.config.maxChunkSize
			const end = start + this.config.maxChunkSize
			const chunkContent = content.slice(start, end)

			chunks.push({
				id: `${messageId}_${i}`,
				content: chunkContent,
				isComplete: i === totalChunks - 1,
				chunkIndex: i,
				totalChunks,
			})
		}

		return chunks
	}

	private async processMessageBatch(): Promise<void> {
		if (this.isProcessing || this.messageQueue.length === 0) {
			return
		}

		this.isProcessing = true
		const startTime = performance.now()

		try {
			const batchSize = Math.min(this.config.maxMessagesPerInterval, this.messageQueue.length)
			const batch = this.messageQueue.splice(0, batchSize)

			for (const chunk of batch) {
				await this.processChunk(chunk)
				this.stats.processedMessages++
			}

			this.stats.pendingChunks = this.messageQueue.length
			this.stats.processingTimeMs = performance.now() - startTime
			this.stats.lastProcessedAt = Date.now()

			if (this.config.debugMode && batch.length > 0) {
				console.log(
					`[IncrementalProcessor] Processed ${batch.length} chunks in ${this.stats.processingTimeMs.toFixed(2)}ms`,
				)
			}
		} catch (error) {
			console.error("[IncrementalProcessor] Error processing batch:", error)
		} finally {
			this.isProcessing = false
		}
	}

	private async processChunk(chunk: MessageChunk): Promise<void> {
		// Extract message type from chunk ID
		const messageType = chunk.id.split("_")[0]
		const processor = this.processors.get(messageType) || this.processors.get("default")

		if (processor) {
			try {
				await processor(chunk)
			} catch (error) {
				console.error(`[IncrementalProcessor] Error processing chunk ${chunk.id}:`, error)
			}
		} else if (this.config.debugMode) {
			console.warn(`[IncrementalProcessor] No processor found for message type: ${messageType}`)
		}
	}
}

// Default configurations for different scenarios
export const INCREMENTAL_CONFIGS = {
	/** High performance - for fast hardware */
	HIGH_PERFORMANCE: {
		maxChunkSize: 2000,
		processingIntervalMs: 8,
		maxMessagesPerInterval: 10,
	},

	/** Balanced - default for most situations */
	BALANCED: {
		maxChunkSize: 1000,
		processingIntervalMs: 16,
		maxMessagesPerInterval: 5,
	},

	/** Conservative - for slower hardware or high memory pressure */
	CONSERVATIVE: {
		maxChunkSize: 500,
		processingIntervalMs: 33,
		maxMessagesPerInterval: 3,
	},
} as const
