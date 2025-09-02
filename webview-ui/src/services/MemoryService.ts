// aincrok_change - enhanced file for grey screen bug fix (Phase 1 Critical)
import { telemetryClient } from "../utils/TelemetryClient"
import { TelemetryEventName } from "@roo-code/types"
import { createSampledFunction } from "../utils/sampling"

interface PerformanceMemory {
	usedJSHeapSize?: number
	totalJSHeapSize?: number
}

export type MemoryPressureLevel = "normal" | "moderate" | "high" | "critical"

export interface MemoryUsageInfo {
	heapUsedMb: number
	heapTotalMb: number
	pressureLevel: MemoryPressureLevel
	timestamp: number
}

export interface MemoryPressureCallback {
	level: MemoryPressureLevel
	callback: (info: MemoryUsageInfo) => void | Promise<void>
}

/**
 * Enhanced MemoryService with pressure detection and cleanup triggers
 *
 * Features:
 * - Memory pressure threshold detection (50MB, 100MB, 150MB)
 * - Configurable cleanup callbacks for different pressure levels
 * - Telemetry reporting for hypothesis testing
 * - Emergency cleanup triggers for critical memory states
 *
 * Part of H2: Memory Pressure Hypothesis testing framework
 */
export class MemoryService {
	private intervalId: number | null = null
	private readonly intervalMs: number = 30 * 1000 // 30 seconds (more frequent for pressure detection) // aincrok_change

	// Memory pressure thresholds in bytes (aincrok_change - enhanced thresholds)
	private readonly thresholds = {
		moderate: 50 * 1024 * 1024, // 50MB - start gentle cleanup
		high: 100 * 1024 * 1024, // 100MB - aggressive cleanup
		critical: 150 * 1024 * 1024, // 150MB - emergency cleanup
	}

	private pressureCallbacks: MemoryPressureCallback[] = []
	private lastPressureLevel: MemoryPressureLevel = "normal"
	private consecutiveHighPressureCount = 0
	private readonly sampledTelemetryCapture = createSampledFunction(
		telemetryClient.capture.bind(telemetryClient),
		0.01, // 1% sampling rate
	)

	public start(): void {
		if (this.intervalId) {
			return
		}
		this.checkMemoryPressure()

		this.intervalId = window.setInterval(() => {
			this.checkMemoryPressure()
		}, this.intervalMs)
	}

	public stop(): void {
		if (this.intervalId) {
			window.clearInterval(this.intervalId)
			this.intervalId = null
		}
	}

	/**
	 * Register callback for specific memory pressure levels
	 */
	public onMemoryPressure(
		level: MemoryPressureLevel,
		callback: (info: MemoryUsageInfo) => void | Promise<void>,
	): void {
		this.pressureCallbacks.push({ level, callback })
	}

	/**
	 * Manually trigger cleanup for specific pressure level
	 */
	public async triggerCleanup(level: MemoryPressureLevel): Promise<void> {
		const memoryInfo = this.getCurrentMemoryInfo()
		const callbacks = this.pressureCallbacks.filter((cb) => cb.level === level)

		console.log(`[MemoryService] Triggering ${level} cleanup (${callbacks.length} callbacks)`)

		for (const { callback } of callbacks) {
			try {
				await callback(memoryInfo)
			} catch (error) {
				console.error(`[MemoryService] Cleanup callback failed:`, error)
			}
		}
	}

	/**
	 * Get current memory usage and pressure level
	 */
	public getCurrentMemoryInfo(): MemoryUsageInfo {
		const memory = (performance as Performance & { memory?: PerformanceMemory }).memory
		const heapUsedBytes = memory?.usedJSHeapSize || 0
		const heapTotalBytes = memory?.totalJSHeapSize || 0

		return {
			heapUsedMb: this.bytesToMegabytes(heapUsedBytes),
			heapTotalMb: this.bytesToMegabytes(heapTotalBytes),
			pressureLevel: this.calculatePressureLevel(heapUsedBytes),
			timestamp: Date.now(),
		}
	}

	private async checkMemoryPressure(): Promise<void> {
		const memoryInfo = this.getCurrentMemoryInfo()
		const currentLevel = memoryInfo.pressureLevel

		// Track consecutive high pressure events
		if (currentLevel === "high" || currentLevel === "critical") {
			this.consecutiveHighPressureCount++
		} else {
			this.consecutiveHighPressureCount = 0
		}

		// Log pressure changes
		if (currentLevel !== this.lastPressureLevel) {
			console.log(
				`[MemoryService] Memory pressure changed: ${this.lastPressureLevel} → ${currentLevel} (${memoryInfo.heapUsedMb}MB)`,
			)

			// Trigger cleanup callbacks for the new pressure level
			await this.triggerCleanupCallbacks(currentLevel, memoryInfo)

			this.lastPressureLevel = currentLevel
		}

		// Emergency cleanup for sustained high pressure
		if (this.consecutiveHighPressureCount >= 3) {
			// 90 seconds of high pressure
			console.warn("[MemoryService] Sustained high memory pressure detected - triggering emergency cleanup")
			await this.triggerCleanup("critical")
			this.consecutiveHighPressureCount = 0 // Reset after emergency cleanup
		}

		// Enhanced telemetry reporting with pressure context
		telemetryClient.capture(TelemetryEventName.WEBVIEW_MEMORY_USAGE, {
			...memoryInfo,
			pressureLevel: currentLevel,
			consecutiveHighPressure: this.consecutiveHighPressureCount,
			// For H2 hypothesis testing
			h2_memory_pressure: currentLevel !== "normal",
			h2_pressure_level: currentLevel,
			h2_threshold_breached: currentLevel,
		})
	}

	private calculatePressureLevel(heapUsedBytes: number): MemoryPressureLevel {
		if (heapUsedBytes >= this.thresholds.critical) {
			return "critical"
		} else if (heapUsedBytes >= this.thresholds.high) {
			return "high"
		} else if (heapUsedBytes >= this.thresholds.moderate) {
			return "moderate"
		} else {
			return "normal"
		}
	}

	private async triggerCleanupCallbacks(level: MemoryPressureLevel, memoryInfo: MemoryUsageInfo): Promise<void> {
		const callbacks = this.pressureCallbacks.filter((cb) => cb.level === level)

		if (callbacks.length > 0) {
			console.log(`[MemoryService] Executing ${callbacks.length} cleanup callbacks for ${level} pressure`)

			for (const { callback } of callbacks) {
				try {
					await callback(memoryInfo)
				} catch (error) {
					console.error(`[MemoryService] Cleanup callback failed for ${level} level:`, error)
				}
			}
		}
		this.sampledTelemetryCapture(TelemetryEventName.WEBVIEW_MEMORY_USAGE, memoryInfo)
	}

	private bytesToMegabytes(bytes: number): number {
		return Math.round((bytes / 1024 / 1024) * 100) / 100
	}

	// aincrok_change: Advanced integration methods for Phase 2 enhancements

	/**
	 * Force DOM cleanup - clear cached DOM references, event listeners, etc.
	 */
	public clearDomCaches(): void {
		try {
			// Clear any cached query results (React Query, etc.)
			if ("queryClient" in window) {
				;(window as any).queryClient?.clear?.()
			}

			// Clear image caches if available
			if ("caches" in window) {
				caches.keys().then((cacheNames) => {
					cacheNames.forEach((cacheName) => {
						if (cacheName.includes("image") || cacheName.includes("asset")) {
							caches.delete(cacheName)
						}
					})
				})
			}

			// Force garbage collection if available (dev mode)
			if ("gc" in window && typeof (window as any).gc === "function") {
				;(window as any).gc()
			}

			console.log("[MemoryService] DOM caches cleared")
		} catch (error) {
			console.error("[MemoryService] Error clearing DOM caches:", error)
		}
	}

	/**
	 * Get memory statistics for debugging and telemetry
	 */
	public getMemoryStats() {
		const memoryInfo = this.getCurrentMemoryInfo()

		return {
			...memoryInfo,
			isMonitoring: this.intervalId !== null,
			callbackCount: this.pressureCallbacks.length,
			consecutiveHighPressure: this.consecutiveHighPressureCount,
			thresholds: {
				moderate: this.bytesToMegabytes(this.thresholds.moderate),
				high: this.bytesToMegabytes(this.thresholds.high),
				critical: this.bytesToMegabytes(this.thresholds.critical),
			},
		}
	}

	/**
	 * Emergency cleanup method - for critical memory situations
	 */
	public async performEmergencyCleanup(): Promise<void> {
		console.warn("[MemoryService] Performing emergency cleanup")

		// Clear DOM caches
		this.clearDomCaches()

		// Trigger all critical cleanup callbacks
		await this.triggerCleanup("critical")

		// Force a final GC if available
		setTimeout(() => {
			if ("gc" in window && typeof (window as any).gc === "function") {
				;(window as any).gc()
			}
		}, 100)
	}
}
