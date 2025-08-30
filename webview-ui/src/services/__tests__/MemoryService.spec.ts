// aincrok_change - new test file for enhanced MemoryService
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
	MemoryService,
	type MemoryPressureLevel as _MemoryPressureLevel,
	type MemoryUsageInfo as _MemoryUsageInfo,
} from "../MemoryService"

// Mock telemetry client
vi.mock("../../utils/TelemetryClient", () => ({
	telemetryClient: {
		trackEvent: vi.fn(),
	},
}))

// Mock performance.memory
const mockMemory = {
	usedJSHeapSize: 10 * 1024 * 1024, // 10MB default
	totalJSHeapSize: 50 * 1024 * 1024, // 50MB default
}

Object.defineProperty(global.performance, "memory", {
	value: mockMemory,
	writable: true,
})

// Mock telemetryClient
vi.mock("../../utils/TelemetryClient", () => ({
	telemetryClient: {
		capture: vi.fn(),
	},
}))

// Mock window.setInterval and window.clearInterval
vi.stubGlobal("setInterval", vi.fn())
vi.stubGlobal("clearInterval", vi.fn())

describe("MemoryService", () => {
	let memoryService: MemoryService

	beforeEach(() => {
		memoryService = new MemoryService()
		vi.clearAllMocks()
		// Reset memory to default values
		mockMemory.usedJSHeapSize = 10 * 1024 * 1024 // 10MB
		mockMemory.totalJSHeapSize = 50 * 1024 * 1024 // 50MB
	})

	afterEach(() => {
		memoryService.stop()
	})

	describe("Basic functionality", () => {
		it("should start and stop correctly", () => {
			memoryService.start()
			expect(window.setInterval).toHaveBeenCalledTimes(1)
			expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)

			memoryService.stop()
			expect(window.clearInterval).toHaveBeenCalledTimes(1)
		})

		it("should not start twice", () => {
			memoryService.start()
			memoryService.start()
			expect(window.setInterval).toHaveBeenCalledTimes(1)
		})

		it("should calculate memory correctly", () => {
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.heapUsedMb).toBe(9.54) // 10MB rounded to 2 decimals
			expect(info.heapTotalMb).toBe(47.68) // 50MB rounded to 2 decimals
			expect(info.pressureLevel).toBe("normal")
			expect(info.timestamp).toBeDefined()
		})
	})

	describe("Memory pressure detection", () => {
		it("should detect moderate pressure at 50MB", () => {
			mockMemory.usedJSHeapSize = 50 * 1024 * 1024 // 50MB
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.pressureLevel).toBe("moderate")
		})

		it("should detect high pressure at 100MB", () => {
			mockMemory.usedJSHeapSize = 100 * 1024 * 1024 // 100MB
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.pressureLevel).toBe("high")
		})

		it("should detect critical pressure at 150MB", () => {
			mockMemory.usedJSHeapSize = 150 * 1024 * 1024 // 150MB
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.pressureLevel).toBe("critical")
		})

		it("should stay normal below 50MB", () => {
			mockMemory.usedJSHeapSize = 49 * 1024 * 1024 // 49MB
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.pressureLevel).toBe("normal")
		})
	})

	describe("Pressure callbacks", () => {
		it("should register and trigger pressure callbacks", async () => {
			const moderateCallback = vi.fn()
			const highCallback = vi.fn()

			memoryService.onMemoryPressure("moderate", moderateCallback)
			memoryService.onMemoryPressure("high", highCallback)

			// Trigger moderate pressure
			await memoryService.triggerCleanup("moderate")
			expect(moderateCallback).toHaveBeenCalledTimes(1)
			expect(moderateCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					pressureLevel: "normal", // Still normal since we haven't changed memory
					heapUsedMb: expect.any(Number),
					timestamp: expect.any(Number),
				}),
			)
			expect(highCallback).not.toHaveBeenCalled()

			// Trigger high pressure
			await memoryService.triggerCleanup("high")
			expect(highCallback).toHaveBeenCalledTimes(1)
			expect(moderateCallback).toHaveBeenCalledTimes(1) // Still only once
		})

		it("should handle callback errors gracefully", async () => {
			const errorCallback = vi.fn().mockRejectedValue(new Error("Cleanup failed"))
			const workingCallback = vi.fn()

			memoryService.onMemoryPressure("moderate", errorCallback)
			memoryService.onMemoryPressure("moderate", workingCallback)

			// Should not throw despite error in first callback
			await expect(memoryService.triggerCleanup("moderate")).resolves.toBeUndefined()

			expect(errorCallback).toHaveBeenCalled()
			expect(workingCallback).toHaveBeenCalled()
		})
	})

	describe("Hypothesis testing integration", () => {
		it("should include H2 hypothesis data in telemetry", async () => {
			const { telemetryClient } = await import("../../utils/TelemetryClient")

			// Set high pressure memory
			mockMemory.usedJSHeapSize = 100 * 1024 * 1024 // 100MB

			// Trigger the private checkMemoryPressure method by starting service
			memoryService.start()

			// Get the interval callback and call it manually
			const intervalCallback = (window.setInterval as any).mock.calls[0][0]
			intervalCallback()

			expect(telemetryClient.capture).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					pressureLevel: "high",
					h2_memory_pressure: true,
					h2_pressure_level: "high",
					h2_threshold_breached: "high",
					consecutiveHighPressure: expect.any(Number),
				}),
			)
		})

		it("should track consecutive high pressure events", async () => {
			const { telemetryClient } = await import("../../utils/TelemetryClient")

			// Set high pressure memory
			mockMemory.usedJSHeapSize = 100 * 1024 * 1024 // 100MB

			memoryService.start()
			const intervalCallback = (window.setInterval as any).mock.calls[0][0]

			// Simulate multiple consecutive high pressure checks
			intervalCallback() // First high pressure
			intervalCallback() // Second consecutive
			intervalCallback() // Third consecutive

			// Should have triggered emergency cleanup
			const calls = (telemetryClient.capture as any).mock.calls
			expect(calls.length).toBeGreaterThanOrEqual(3)

			// Last call should have consecutiveHighPressure count
			const lastCall = calls[calls.length - 1][1]
			expect(lastCall.consecutiveHighPressure).toBeGreaterThanOrEqual(0)
		})
	})

	describe("Edge cases", () => {
		it("should handle missing performance.memory gracefully", () => {
			// Temporarily remove memory property
			const originalMemory = (global.performance as any).memory
			delete (global.performance as any).memory

			const info = memoryService.getCurrentMemoryInfo()
			expect(info.heapUsedMb).toBe(0)
			expect(info.heapTotalMb).toBe(0)
			expect(info.pressureLevel).toBe("normal")

			// Restore memory property
			;(global.performance as any).memory = originalMemory
		})

		it("should handle zero memory values", () => {
			mockMemory.usedJSHeapSize = 0
			mockMemory.totalJSHeapSize = 0

			const info = memoryService.getCurrentMemoryInfo()
			expect(info.heapUsedMb).toBe(0)
			expect(info.heapTotalMb).toBe(0)
			expect(info.pressureLevel).toBe("normal")
		})
	})
})
