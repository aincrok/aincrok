// aincrok_change - new file
/**
 * Timer Management Service for handling UI timeouts and preventing grey screen issues
 */

export interface TimerConfig {
	/** Timer duration in milliseconds */
	duration: number
	/** Callback to execute when timer expires */
	onTimeout: () => void
	/** Auto-restart timer after expiration */
	autoRestart?: boolean
	/** Custom timer name for debugging */
	name?: string
}

export interface ActiveTimer {
	id: string
	config: TimerConfig
	startTime: number
	timeoutId: NodeJS.Timeout
}

export class TimerService {
	private static instance: TimerService | null = null
	private activeTimers = new Map<string, ActiveTimer>()
	private timerCounter = 0

	private constructor() {}

	public static getInstance(): TimerService {
		if (!TimerService.instance) {
			TimerService.instance = new TimerService()
		}
		return TimerService.instance
	}

	/**
	 * Start a new timer
	 */
	public startTimer(config: TimerConfig): string {
		const timerId = `timer_${++this.timerCounter}`

		const timeoutId = setTimeout(() => {
			const timer = this.activeTimers.get(timerId)
			if (timer) {
				try {
					timer.config.onTimeout()
				} catch (error) {
					console.error(`Timer ${timerId} callback error:`, error)
				}

				if (timer.config.autoRestart) {
					// Restart the timer with the same ID
					this.restartTimer(timerId)
				} else {
					this.stopTimer(timerId)
				}
			}
		}, config.duration)

		const timer: ActiveTimer = {
			id: timerId,
			config: { ...config },
			startTime: Date.now(),
			timeoutId,
		}

		this.activeTimers.set(timerId, timer)

		if (config.name) {
			console.debug(`Timer started: ${config.name} (${timerId}) - ${config.duration}ms`)
		}

		return timerId
	}

	/**
	 * Stop and remove a timer
	 */
	public stopTimer(timerId: string): boolean {
		const timer = this.activeTimers.get(timerId)
		if (timer) {
			clearTimeout(timer.timeoutId)
			this.activeTimers.delete(timerId)

			if (timer.config.name) {
				console.debug(`Timer stopped: ${timer.config.name} (${timerId})`)
			}
			return true
		}
		return false
	}

	/**
	 * Restart a timer (reset its countdown)
	 */
	public restartTimer(timerId: string): boolean {
		const timer = this.activeTimers.get(timerId)
		if (timer) {
			clearTimeout(timer.timeoutId)

			const newTimeoutId = setTimeout(() => {
				const restartedTimer = this.activeTimers.get(timerId)
				if (restartedTimer) {
					try {
						restartedTimer.config.onTimeout()
					} catch (error) {
						console.error(`Timer ${timerId} callback error:`, error)
					}

					if (restartedTimer.config.autoRestart) {
						this.restartTimer(timerId)
					} else {
						this.stopTimer(timerId)
					}
				}
			}, timer.config.duration)

			timer.timeoutId = newTimeoutId
			timer.startTime = Date.now()

			if (timer.config.name) {
				console.debug(`Timer restarted: ${timer.config.name} (${timerId})`)
			}
			return true
		}
		return false
	}

	/**
	 * Check if a timer is active
	 */
	public hasTimer(timerId: string): boolean {
		return this.activeTimers.has(timerId)
	}

	/**
	 * Get remaining time for a timer in milliseconds
	 */
	public getRemainingTime(timerId: string): number | null {
		const timer = this.activeTimers.get(timerId)
		if (timer) {
			const elapsed = Date.now() - timer.startTime
			return Math.max(0, timer.config.duration - elapsed)
		}
		return null
	}

	/**
	 * Get all active timer IDs
	 */
	public getActiveTimerIds(): string[] {
		return Array.from(this.activeTimers.keys())
	}

	/**
	 * Clear all active timers
	 */
	public clearAllTimers(): void {
		this.activeTimers.forEach((timer, timerId) => {
			clearTimeout(timer.timeoutId)
			if (timer.config.name) {
				console.debug(`Timer cleared: ${timer.config.name} (${timerId})`)
			}
		})
		this.activeTimers.clear()
	}

	/**
	 * Get timer statistics for debugging
	 */
	public getTimerStats() {
		const timers = Array.from(this.activeTimers.values()).map((timer) => ({
			id: timer.id,
			name: timer.config.name || "unnamed",
			duration: timer.config.duration,
			remainingTime: this.getRemainingTime(timer.id),
			autoRestart: timer.config.autoRestart || false,
		}))

		return {
			activeCount: this.activeTimers.size,
			timers,
		}
	}
}

// Common timer configurations for UI components
export const UI_TIMERS = {
	/** API response timeout - 30 seconds */
	API_RESPONSE: {
		duration: 30000,
		name: "API Response Timeout",
	},

	/** UI activity timeout - 5 minutes */
	UI_ACTIVITY: {
		duration: 300000,
		name: "UI Activity Timeout",
	},

	/** Message processing timeout - 10 seconds */
	MESSAGE_PROCESSING: {
		duration: 10000,
		name: "Message Processing Timeout",
	},

	/** Connection health check - 30 seconds */
	CONNECTION_HEALTH: {
		duration: 30000,
		name: "Connection Health Check",
		autoRestart: true,
	},
} as const
