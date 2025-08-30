// aincrok_change - new file
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { TimerService, TimerConfig, UI_TIMERS } from "../TimerService"

describe("TimerService", () => {
	let timerService: TimerService
	let mockCallback: ReturnType<typeof vi.fn>

	beforeEach(() => {
		// Reset singleton instance
		// @ts-expect-error - accessing private static property for testing
		TimerService.instance = null
		timerService = TimerService.getInstance()
		mockCallback = vi.fn()
		vi.useFakeTimers()
	})

	afterEach(() => {
		timerService.clearAllTimers()
		vi.useRealTimers()
		// @ts-expect-error - reset singleton for clean state
		TimerService.instance = null
	})

	describe("singleton pattern", () => {
		it("should return the same instance", () => {
			const instance1 = TimerService.getInstance()
			const instance2 = TimerService.getInstance()
			expect(instance1).toBe(instance2)
		})
	})

	describe("startTimer", () => {
		it("should start a timer with basic configuration", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			const timerId = timerService.startTimer(config)

			expect(timerId).toMatch(/^timer_\d+$/)
			expect(timerService.hasTimer(timerId)).toBe(true)
		})

		it("should execute callback when timer expires", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			timerService.startTimer(config)

			expect(mockCallback).not.toHaveBeenCalled()

			vi.advanceTimersByTime(1000)

			expect(mockCallback).toHaveBeenCalledOnce()
		})

		it("should auto-restart timer if configured", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
				autoRestart: true,
			}

			const timerId = timerService.startTimer(config)

			vi.advanceTimersByTime(1000)
			expect(mockCallback).toHaveBeenCalledOnce()
			expect(timerService.hasTimer(timerId)).toBe(true)

			vi.advanceTimersByTime(1000)
			expect(mockCallback).toHaveBeenCalledTimes(2)
		})

		it("should handle callback errors gracefully", () => {
			const errorCallback = vi.fn(() => {
				throw new Error("Callback error")
			})

			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			const config: TimerConfig = {
				duration: 1000,
				onTimeout: errorCallback,
			}

			const timerId = timerService.startTimer(config)

			vi.advanceTimersByTime(1000)

			expect(errorCallback).toHaveBeenCalledOnce()
			expect(consoleSpy).toHaveBeenCalledWith(`Timer ${timerId} callback error:`, expect.any(Error))
			expect(timerService.hasTimer(timerId)).toBe(false)

			consoleSpy.mockRestore()
		})
	})

	describe("stopTimer", () => {
		it("should stop an active timer", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			const timerId = timerService.startTimer(config)
			expect(timerService.hasTimer(timerId)).toBe(true)

			const result = timerService.stopTimer(timerId)

			expect(result).toBe(true)
			expect(timerService.hasTimer(timerId)).toBe(false)

			vi.advanceTimersByTime(1000)
			expect(mockCallback).not.toHaveBeenCalled()
		})

		it("should return false for non-existent timer", () => {
			const result = timerService.stopTimer("non-existent")
			expect(result).toBe(false)
		})
	})

	describe("restartTimer", () => {
		it("should restart an active timer", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			const timerId = timerService.startTimer(config)

			vi.advanceTimersByTime(500) // halfway through

			const result = timerService.restartTimer(timerId)
			expect(result).toBe(true)

			// Timer should not fire at original time
			vi.advanceTimersByTime(500)
			expect(mockCallback).not.toHaveBeenCalled()

			// Timer should fire after full duration from restart
			vi.advanceTimersByTime(500)
			expect(mockCallback).toHaveBeenCalledOnce()
		})

		it("should return false for non-existent timer", () => {
			const result = timerService.restartTimer("non-existent")
			expect(result).toBe(false)
		})
	})

	describe("getRemainingTime", () => {
		it("should return correct remaining time", () => {
			const config: TimerConfig = {
				duration: 2000,
				onTimeout: mockCallback,
			}

			const timerId = timerService.startTimer(config)

			expect(timerService.getRemainingTime(timerId)).toBe(2000)

			vi.advanceTimersByTime(500)
			expect(timerService.getRemainingTime(timerId)).toBe(1500)

			vi.advanceTimersByTime(1500)
			expect(timerService.getRemainingTime(timerId)).toBe(null) // Timer expired
		})

		it("should return null for non-existent timer", () => {
			const result = timerService.getRemainingTime("non-existent")
			expect(result).toBe(null)
		})
	})

	describe("getActiveTimerIds", () => {
		it("should return all active timer IDs", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			const timer1 = timerService.startTimer(config)
			const timer2 = timerService.startTimer(config)

			const activeIds = timerService.getActiveTimerIds()

			expect(activeIds).toHaveLength(2)
			expect(activeIds).toContain(timer1)
			expect(activeIds).toContain(timer2)
		})

		it("should return empty array when no timers active", () => {
			const activeIds = timerService.getActiveTimerIds()
			expect(activeIds).toHaveLength(0)
		})
	})

	describe("clearAllTimers", () => {
		it("should clear all active timers", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			timerService.startTimer(config)
			timerService.startTimer(config)

			expect(timerService.getActiveTimerIds()).toHaveLength(2)

			timerService.clearAllTimers()

			expect(timerService.getActiveTimerIds()).toHaveLength(0)

			vi.advanceTimersByTime(1000)
			expect(mockCallback).not.toHaveBeenCalled()
		})
	})

	describe("getTimerStats", () => {
		it("should return correct timer statistics", () => {
			const config1: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
				name: "Test Timer 1",
			}

			const config2: TimerConfig = {
				duration: 2000,
				onTimeout: mockCallback,
				autoRestart: true,
			}

			const timer1 = timerService.startTimer(config1)
			const timer2 = timerService.startTimer(config2)

			const stats = timerService.getTimerStats()

			expect(stats.activeCount).toBe(2)
			expect(stats.timers).toHaveLength(2)

			const timer1Stats = stats.timers.find((t) => t.id === timer1)
			const timer2Stats = stats.timers.find((t) => t.id === timer2)

			expect(timer1Stats).toEqual({
				id: timer1,
				name: "Test Timer 1",
				duration: 1000,
				remainingTime: 1000,
				autoRestart: false,
			})

			expect(timer2Stats).toEqual({
				id: timer2,
				name: "unnamed",
				duration: 2000,
				remainingTime: 2000,
				autoRestart: true,
			})
		})
	})

	describe("UI_TIMERS configuration", () => {
		it("should have expected timer configurations", () => {
			expect(UI_TIMERS.API_RESPONSE).toEqual({
				duration: 30000,
				name: "API Response Timeout",
			})

			expect(UI_TIMERS.UI_ACTIVITY).toEqual({
				duration: 300000,
				name: "UI Activity Timeout",
			})

			expect(UI_TIMERS.MESSAGE_PROCESSING).toEqual({
				duration: 10000,
				name: "Message Processing Timeout",
			})

			expect(UI_TIMERS.CONNECTION_HEALTH).toEqual({
				duration: 30000,
				name: "Connection Health Check",
				autoRestart: true,
			})
		})
	})

	describe("memory management", () => {
		it("should not leak memory when timers are stopped", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			const timer1 = timerService.startTimer(config)
			const _timer2 = timerService.startTimer(config)

			expect(timerService.getActiveTimerIds()).toHaveLength(2)

			timerService.stopTimer(timer1)
			expect(timerService.getActiveTimerIds()).toHaveLength(1)

			// Let remaining timer expire
			vi.advanceTimersByTime(1000)
			expect(timerService.getActiveTimerIds()).toHaveLength(0)
		})

		it("should not leak memory when timers expire naturally", () => {
			const config: TimerConfig = {
				duration: 1000,
				onTimeout: mockCallback,
			}

			timerService.startTimer(config)
			timerService.startTimer(config)

			expect(timerService.getActiveTimerIds()).toHaveLength(2)

			vi.advanceTimersByTime(1000)

			expect(timerService.getActiveTimerIds()).toHaveLength(0)
		})
	})
})
