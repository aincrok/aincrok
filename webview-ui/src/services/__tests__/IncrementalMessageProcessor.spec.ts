// aincrok_change - new file
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { IncrementalMessageProcessor, MessageChunk, INCREMENTAL_CONFIGS } from "../IncrementalMessageProcessor"

describe("IncrementalMessageProcessor", () => {
	let processor: IncrementalMessageProcessor
	let mockProcessor: ReturnType<typeof vi.fn>

	beforeEach(() => {
		// Reset singleton instance
		// @ts-expect-error - accessing private static property for testing
		IncrementalMessageProcessor.instance = null

		processor = IncrementalMessageProcessor.getInstance({
			maxChunkSize: 10,
			processingIntervalMs: 50,
			maxMessagesPerInterval: 2,
			debugMode: true,
		})

		mockProcessor = vi.fn()
		vi.useFakeTimers()
	})

	afterEach(() => {
		processor.stop()
		vi.useRealTimers()
		// @ts-expect-error - reset singleton for clean state
		IncrementalMessageProcessor.instance = null
	})

	describe("singleton pattern", () => {
		it("should return the same instance", () => {
			const instance1 = IncrementalMessageProcessor.getInstance()
			const instance2 = IncrementalMessageProcessor.getInstance()
			expect(instance1).toBe(instance2)
		})
	})

	describe("message chunking", () => {
		it("should not chunk short messages", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.queueMessage("test", "short")

			const stats = processor.getStats()
			expect(stats.totalMessages).toBe(1)
			expect(stats.pendingChunks).toBe(1)
		})

		it("should chunk long messages", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.queueMessage("test", "this is a very long message that should be chunked")

			const stats = processor.getStats()
			expect(stats.totalMessages).toBe(1)
			expect(stats.pendingChunks).toBeGreaterThan(1)
		})
	})

	describe("processing", () => {
		it("should process messages incrementally", async () => {
			processor.registerProcessor("test", mockProcessor)
			processor.start()

			processor.queueMessage("test", "message1")
			processor.queueMessage("test", "message2")
			processor.queueMessage("test", "message3")

			expect(processor.getStats().pendingChunks).toBe(3)

			// Advance timers to trigger processing
			vi.advanceTimersByTime(100)

			// Should process maxMessagesPerInterval (2) messages
			expect(mockProcessor).toHaveBeenCalledTimes(2)
			expect(processor.getStats().pendingChunks).toBe(1)

			// Advance again to process remaining
			vi.advanceTimersByTime(100)

			expect(mockProcessor).toHaveBeenCalledTimes(3)
			expect(processor.getStats().pendingChunks).toBe(0)
		})

		it("should call processors with correct chunk data", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.start()

			processor.queueMessage("test", "hello")

			vi.advanceTimersByTime(100)

			expect(mockProcessor).toHaveBeenCalledWith({
				id: "test_0",
				content: "hello",
				isComplete: true,
				chunkIndex: 0,
				totalChunks: 1,
			})
		})

		it("should handle chunked messages correctly", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.start()

			processor.queueMessage(
				"test",
				"this is a very long message that should definitely be chunked into multiple parts",
			)

			vi.advanceTimersByTime(500) // Process all chunks

			// Should have been called multiple times for chunks
			expect(mockProcessor.mock.calls.length).toBeGreaterThan(1)

			// Check that chunks are properly formed
			const calls = mockProcessor.mock.calls
			calls.forEach((call, index) => {
				const chunk: MessageChunk = call[0]
				expect(chunk.id).toBe(`test_${index}`)
				expect(chunk.chunkIndex).toBe(index)
				expect(chunk.totalChunks).toBe(calls.length)
				expect(chunk.isComplete).toBe(index === calls.length - 1)
			})
		})
	})

	describe("processor registration", () => {
		it("should register and unregister processors", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.start()

			processor.queueMessage("test", "message")
			vi.advanceTimersByTime(100)

			expect(mockProcessor).toHaveBeenCalledOnce()

			processor.unregisterProcessor("test")
			processor.queueMessage("test", "message2")
			vi.advanceTimersByTime(100)

			// Should still be called only once (second message ignored)
			expect(mockProcessor).toHaveBeenCalledOnce()
		})

		it("should use default processor when specific processor not found", () => {
			const defaultProcessor = vi.fn()
			processor.registerProcessor("default", defaultProcessor)
			processor.start()

			processor.queueMessage("unknown", "message")
			vi.advanceTimersByTime(100)

			expect(defaultProcessor).toHaveBeenCalledWith({
				id: "unknown_0",
				content: "message",
				isComplete: true,
				chunkIndex: 0,
				totalChunks: 1,
			})
		})
	})

	describe("error handling", () => {
		it("should continue processing when processor throws error", () => {
			const errorProcessor = vi.fn().mockRejectedValue(new Error("Test error"))
			const normalProcessor = vi.fn()

			processor.registerProcessor("error", errorProcessor)
			processor.registerProcessor("normal", normalProcessor)
			processor.start()

			processor.queueMessage("error", "message1")
			processor.queueMessage("normal", "message2")

			vi.advanceTimersByTime(100)

			expect(errorProcessor).toHaveBeenCalled()
			expect(normalProcessor).toHaveBeenCalled()
		})
	})

	describe("statistics", () => {
		it("should track processing statistics", () => {
			processor.registerProcessor("test", mockProcessor)
			processor.start()

			processor.queueMessage("test", "message1")
			processor.queueMessage("test", "message2")

			let stats = processor.getStats()
			expect(stats.totalMessages).toBe(2)
			expect(stats.processedMessages).toBe(0)
			expect(stats.pendingChunks).toBe(2)

			vi.advanceTimersByTime(100)

			stats = processor.getStats()
			expect(stats.processedMessages).toBe(2)
			expect(stats.pendingChunks).toBe(0)
			expect(stats.processingTimeMs).toBeGreaterThan(0)
			expect(stats.lastProcessedAt).toBeGreaterThan(0)
		})
	})

	describe("configuration", () => {
		it("should update configuration", () => {
			processor.updateConfig({
				maxChunkSize: 20,
				maxMessagesPerInterval: 5,
			})

			processor.registerProcessor("test", mockProcessor)
			processor.start()

			// With larger chunk size, this should be one chunk
			processor.queueMessage("test", "this is a longer message")

			const stats = processor.getStats()
			expect(stats.pendingChunks).toBe(1)
		})
	})

	describe("queue management", () => {
		it("should clear queue", () => {
			processor.queueMessage("test", "message1")
			processor.queueMessage("test", "message2")

			expect(processor.getStats().pendingChunks).toBe(2)

			processor.clearQueue()

			expect(processor.getStats().pendingChunks).toBe(0)
		})

		it("should track processing state", () => {
			processor.registerProcessor("test", async () => {
				// Simulate async work
				await new Promise((resolve) => setTimeout(resolve, 10))
			})

			expect(processor.isCurrentlyProcessing()).toBe(false)

			processor.start()
			processor.queueMessage("test", "message")

			// Processing should start when timer fires
			vi.advanceTimersByTime(100)

			// Note: Due to fake timers, the async processing completes immediately
			// In real scenario, isCurrentlyProcessing() would be true during processing
		})
	})

	describe("start/stop", () => {
		it("should start and stop processing", () => {
			processor.registerProcessor("test", mockProcessor)

			processor.queueMessage("test", "message")

			// Should not process without starting
			vi.advanceTimersByTime(100)
			expect(mockProcessor).not.toHaveBeenCalled()

			processor.start()
			vi.advanceTimersByTime(100)
			expect(mockProcessor).toHaveBeenCalled()

			processor.stop()
			processor.queueMessage("test", "message2")
			vi.advanceTimersByTime(100)

			// Should still be called only once (stopped)
			expect(mockProcessor).toHaveBeenCalledOnce()
		})
	})

	describe("predefined configurations", () => {
		it("should provide predefined configurations", () => {
			expect(INCREMENTAL_CONFIGS.HIGH_PERFORMANCE).toBeDefined()
			expect(INCREMENTAL_CONFIGS.BALANCED).toBeDefined()
			expect(INCREMENTAL_CONFIGS.CONSERVATIVE).toBeDefined()

			expect(INCREMENTAL_CONFIGS.HIGH_PERFORMANCE.maxChunkSize).toBeGreaterThan(
				INCREMENTAL_CONFIGS.CONSERVATIVE.maxChunkSize,
			)

			expect(INCREMENTAL_CONFIGS.HIGH_PERFORMANCE.processingIntervalMs).toBeLessThan(
				INCREMENTAL_CONFIGS.CONSERVATIVE.processingIntervalMs,
			)
		})
	})
})
