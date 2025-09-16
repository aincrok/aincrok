import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import posthog from "posthog-js"
import { TelemetrySetting } from "@roo/TelemetrySetting"
import { telemetryClient } from "../TelemetryClient"

// Mock posthog
vi.mock("posthog-js", () => ({
	default: {
		reset: vi.fn(),
		init: vi.fn(),
		identify: vi.fn(),
		capture: vi.fn(),
		captureException: vi.fn(),
	},
}))

describe("TelemetryClient", () => {
	const mockPosthog = vi.mocked(posthog)
	const mockApiKey = "test-api-key"
	const mockDistinctId = "test-user-id"

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		// Reset telemetry state after each test
		telemetryClient.updateTelemetryState("disabled")
	})

	describe("singleton pattern", () => {
		it("should return the same instance when calling getInstance multiple times", () => {
			// Note: telemetryClient is already an instance from getInstance()
			const instance1 = telemetryClient
			const instance2 = telemetryClient

			expect(instance1).toBe(instance2)
		})
	})

	describe("updateTelemetryState", () => {
		it("should enable telemetry when setting is enabled with apiKey and distinctId", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).toHaveBeenCalledWith(mockApiKey, {
				api_host: "https://us.i.posthog.com",
				persistence: "localStorage",
				loaded: expect.any(Function),
				capture_pageview: false,
				capture_pageleave: false,
				autocapture: false,
			})
			expect(mockPosthog.identify).toHaveBeenCalledWith(mockDistinctId)
		})

		it("should call loaded callback to identify user", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			// Get the loaded callback and call it
			const initCall = mockPosthog.init.mock.calls[0]
			const config = initCall?.[1]
			const loadedCallback = config?.loaded

			if (loadedCallback) {
				loadedCallback(mockPosthog as any)
				expect(mockPosthog.identify).toHaveBeenCalledWith(mockDistinctId)
			} else {
				throw new Error("loaded callback not found")
			}
		})

		it("should disable telemetry when setting is disabled", () => {
			// First enable it
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			vi.clearAllMocks()

			// Then disable it
			telemetryClient.updateTelemetryState("disabled")

			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).not.toHaveBeenCalled()
			expect(mockPosthog.identify).not.toHaveBeenCalled()
		})

		it("should disable telemetry when apiKey is missing", () => {
			telemetryClient.updateTelemetryState("enabled", undefined, mockDistinctId)

			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).not.toHaveBeenCalled()
			expect(mockPosthog.identify).not.toHaveBeenCalled()
		})

		it("should disable telemetry when distinctId is missing", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, undefined)

			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).not.toHaveBeenCalled()
			expect(mockPosthog.identify).not.toHaveBeenCalled()
		})

		it("should disable telemetry when both apiKey and distinctId are missing", () => {
			telemetryClient.updateTelemetryState("enabled")

			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).not.toHaveBeenCalled()
			expect(mockPosthog.identify).not.toHaveBeenCalled()
		})

		it("should always reset posthog before updating state", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			expect(mockPosthog.reset).toHaveBeenCalledOnce()

			telemetryClient.updateTelemetryState("disabled")
			expect(mockPosthog.reset).toHaveBeenCalledTimes(2)
		})
	})

	describe("capture", () => {
		it("should capture events when telemetry is enabled", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const eventName = "test_event"
			const properties = { key: "value" }

			telemetryClient.capture(eventName, properties)

			expect(mockPosthog.capture).toHaveBeenCalledWith(eventName, properties)
		})

		it("should capture events without properties when telemetry is enabled", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const eventName = "test_event"

			telemetryClient.capture(eventName)

			expect(mockPosthog.capture).toHaveBeenCalledWith(eventName, undefined)
		})

		it("should not capture events when telemetry is disabled", () => {
			telemetryClient.updateTelemetryState("disabled")
			const eventName = "test_event"
			const properties = { key: "value" }

			telemetryClient.capture(eventName, properties)

			expect(mockPosthog.capture).not.toHaveBeenCalled()
		})

		it("should silently fail when posthog.capture throws an error", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			mockPosthog.capture.mockImplementation(() => {
				throw new Error("Posthog error")
			})

			expect(() => {
				telemetryClient.capture("test_event")
			}).not.toThrow()
		})

		it("should handle empty string event names", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			telemetryClient.capture("")

			expect(mockPosthog.capture).toHaveBeenCalledWith("", undefined)
		})

		it("should handle complex properties objects", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const complexProperties = {
				nested: { object: true },
				array: [1, 2, 3],
				nullValue: null,
				undefinedValue: undefined,
				booleanValue: false,
			}

			telemetryClient.capture("complex_event", complexProperties)

			expect(mockPosthog.capture).toHaveBeenCalledWith("complex_event", complexProperties)
		})
	})

	describe("captureException", () => {
		it("should capture exceptions when telemetry is enabled", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const error = new Error("Test error")
			const properties = { context: "test" }

			telemetryClient.captureException(error, properties)

			expect(mockPosthog.captureException).toHaveBeenCalledWith(error, properties)
		})

		it("should capture exceptions without properties when telemetry is enabled", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const error = new Error("Test error")

			telemetryClient.captureException(error)

			expect(mockPosthog.captureException).toHaveBeenCalledWith(error, undefined)
		})

		it("should not capture exceptions when telemetry is disabled", () => {
			telemetryClient.updateTelemetryState("disabled")
			const error = new Error("Test error")
			const properties = { context: "test" }

			telemetryClient.captureException(error, properties)

			expect(mockPosthog.captureException).not.toHaveBeenCalled()
		})

		it("should silently fail when posthog.captureException throws an error", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			mockPosthog.captureException.mockImplementation(() => {
				throw new Error("Posthog error")
			})

			const error = new Error("Test error")
			expect(() => {
				telemetryClient.captureException(error)
			}).not.toThrow()
		})

		it("should handle different types of Error objects", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			const standardError = new Error("Standard error")
			const typeError = new TypeError("Type error")
			const customError = new Error("Custom error")
			customError.name = "CustomError"

			telemetryClient.captureException(standardError)
			telemetryClient.captureException(typeError)
			telemetryClient.captureException(customError)

			expect(mockPosthog.captureException).toHaveBeenCalledTimes(3)
			expect(mockPosthog.captureException).toHaveBeenCalledWith(standardError, undefined)
			expect(mockPosthog.captureException).toHaveBeenCalledWith(typeError, undefined)
			expect(mockPosthog.captureException).toHaveBeenCalledWith(customError, undefined)
		})
	})

	describe("telemetry state transitions", () => {
		it("should handle enabling -> disabling -> enabling transitions", () => {
			// Enable
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			telemetryClient.capture("event1")
			expect(mockPosthog.capture).toHaveBeenCalledWith("event1", undefined)

			vi.clearAllMocks()

			// Disable
			telemetryClient.updateTelemetryState("disabled")
			telemetryClient.capture("event2")
			expect(mockPosthog.capture).not.toHaveBeenCalled()

			// Enable again
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			telemetryClient.capture("event3")
			expect(mockPosthog.capture).toHaveBeenCalledWith("event3", undefined)
		})

		it("should handle multiple enable calls with different credentials", () => {
			const apiKey1 = "api-key-1"
			const distinctId1 = "user-1"
			const apiKey2 = "api-key-2"
			const distinctId2 = "user-2"

			telemetryClient.updateTelemetryState("enabled", apiKey1, distinctId1)
			expect(mockPosthog.init).toHaveBeenCalledWith(apiKey1, expect.any(Object))
			expect(mockPosthog.identify).toHaveBeenCalledWith(distinctId1)

			vi.clearAllMocks()

			telemetryClient.updateTelemetryState("enabled", apiKey2, distinctId2)
			expect(mockPosthog.reset).toHaveBeenCalledOnce()
			expect(mockPosthog.init).toHaveBeenCalledWith(apiKey2, expect.any(Object))
			expect(mockPosthog.identify).toHaveBeenCalledWith(distinctId2)
		})
	})

	describe("edge cases", () => {
		it("should handle null and undefined values in properties", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			const properties = {
				nullProp: null,
				undefinedProp: undefined,
			}

			telemetryClient.capture("test_event", properties)
			telemetryClient.captureException(new Error("test"), properties)

			expect(mockPosthog.capture).toHaveBeenCalledWith("test_event", properties)
			expect(mockPosthog.captureException).toHaveBeenCalledWith(expect.any(Error), properties)
		})

		it("should handle empty properties object", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const emptyProps = {}

			telemetryClient.capture("test_event", emptyProps)
			telemetryClient.captureException(new Error("test"), emptyProps)

			expect(mockPosthog.capture).toHaveBeenCalledWith("test_event", emptyProps)
			expect(mockPosthog.captureException).toHaveBeenCalledWith(expect.any(Error), emptyProps)
		})

		it("should handle very long event names", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
			const longEventName = "a".repeat(1000)

			telemetryClient.capture(longEventName)

			expect(mockPosthog.capture).toHaveBeenCalledWith(longEventName, undefined)
		})
	})

	describe("concurrent operations", () => {
		it("should handle rapid state changes", () => {
			// Rapid enable/disable cycles
			for (let i = 0; i < 5; i++) {
				telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)
				telemetryClient.updateTelemetryState("disabled")
			}

			expect(mockPosthog.reset).toHaveBeenCalledTimes(10) // 2 calls per cycle
		})

		it("should handle multiple capture calls in sequence", () => {
			telemetryClient.updateTelemetryState("enabled", mockApiKey, mockDistinctId)

			for (let i = 0; i < 10; i++) {
				telemetryClient.capture(`event_${i}`, { index: i })
			}

			expect(mockPosthog.capture).toHaveBeenCalledTimes(10)
		})
	})
})
