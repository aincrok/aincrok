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
		capture: vi.fn(),
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

// Mock window.setInterval and window.clearInterval with proper return value
let intervalId = 1
vi.stubGlobal(
	"setInterval",
	vi.fn(() => intervalId++),
)
vi.stubGlobal("clearInterval", vi.fn())

describe("MemoryService", () => {
	let memoryService: MemoryService

	beforeEach(() => {
		memoryService = new MemoryService()
		vi.clearAllMocks()
		// Reset interval ID counter
		intervalId = 1
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
			expect(window.clearInterval).toHaveBeenCalledWith(1) // First interval ID
		})

		it("should not start twice", () => {
			memoryService.start()
			memoryService.start() // Should be ignored
			expect(window.setInterval).toHaveBeenCalledTimes(1)
		})

		it("should calculate memory correctly", () => {
			const info = memoryService.getCurrentMemoryInfo()
			expect(info.heapUsedMb).toBe(10) // 10MB exactly
			expect(info.heapTotalMb).toBe(50) // 50MB exactly
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

			// Call checkMemoryPressure manually (it's private but available via start())
			memoryService.start()

			// Wait a tick for async operations
			await new Promise((resolve) => setTimeout(resolve, 0))

			expect(telemetryClient.capture).toHaveBeenCalledWith(
				"Webview Memory Usage",
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

			// Start service and manually call checkMemoryPressure multiple times
			memoryService.start()

			// Wait for each check
			await new Promise((resolve) => setTimeout(resolve, 0))
			await new Promise((resolve) => setTimeout(resolve, 0))
			await new Promise((resolve) => setTimeout(resolve, 0))

			// Should have triggered telemetry calls
			const calls = (telemetryClient.capture as any).mock.calls
			expect(calls.length).toBeGreaterThanOrEqual(1)

			// Check that telemetry was called with memory data
			expect(telemetryClient.capture).toHaveBeenCalledWith(
				"Webview Memory Usage",
				expect.objectContaining({
					consecutiveHighPressure: expect.any(Number),
				}),
			)
		})
	})

	describe("Edge cases", () => {
		it("should handle missing performance.memory gracefully", () => {
			// Create a new performance object without memory property for this test
			const originalPerformance = global.performance
			const mockPerformanceNoMemory = {} as Performance

			// Temporarily replace global performance
			global.performance = mockPerformanceNoMemory

			const info = memoryService.getCurrentMemoryInfo()
			expect(info.heapUsedMb).toBe(0)
			expect(info.heapTotalMb).toBe(0)
			expect(info.pressureLevel).toBe("normal")

			// Restore original performance
			global.performance = originalPerformance
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
