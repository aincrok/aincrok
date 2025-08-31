// aincrok_change - new test file for DialogErrorBoundary component
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import { DialogErrorBoundary } from "../DialogErrorBoundary"

// Mock telemetry client
vi.mock("../../../utils/TelemetryClient", () => ({
	telemetryClient: {
		capture: vi.fn(),
	},
}))

// Import the mocked module to get access to the mock function
import { telemetryClient } from "../../../utils/TelemetryClient"
const mockTelemetryCapture = telemetryClient.capture as ReturnType<typeof vi.fn>

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error("Test error")
	}
	return <div>No error</div>
}

describe("DialogErrorBoundary", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.clearAllTimers()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe("Normal operation", () => {
		it("should render children when no error occurs", () => {
			render(
				<DialogErrorBoundary>
					<div>Test content</div>
				</DialogErrorBoundary>,
			)

			expect(screen.getByText("Test content")).toBeInTheDocument()
		})

		it("should not show error UI when no error occurs", () => {
			render(
				<DialogErrorBoundary>
					<div>Test content</div>
				</DialogErrorBoundary>,
			)

			expect(screen.queryByText("Dialog Error")).not.toBeInTheDocument()
		})
	})

	describe("Error handling", () => {
		it("should catch and display error fallback UI", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(screen.getByText(/Recovering dialog\.\.\./)).toBeInTheDocument()
			expect(screen.getByText(/\(Attempt 1\/3\)/)).toBeInTheDocument()

			consoleSpy.mockRestore()
		})

		it("should log error to telemetry when error occurs", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(mockTelemetryCapture).toHaveBeenCalledWith(
				"Dialog Error Boundary Triggered",
				expect.objectContaining({
					errorMessage: "Test error",
					errorStack: expect.any(String),
					componentStack: expect.any(String),
					retryCount: 0,
				}),
			)

			consoleSpy.mockRestore()
		})

		it("should show final fallback UI after max retries", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			render(
				<DialogErrorBoundary maxRetries={2}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Initial error state
			expect(screen.getByText(/Recovering dialog\.\.\./)).toBeInTheDocument()

			// Simulate max retries reached by calling attemptRecovery multiple times
			const _boundary = screen.getByText(/Recovering dialog\.\.\./).closest(".dialog-error-retry")?.parentElement

			// We need to simulate the internal retry logic
			// Since we can't directly access the component instance, we'll test the final state
			// by creating a boundary that starts with maxRetries already reached
			render(
				<DialogErrorBoundary maxRetries={0}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			await waitFor(() => {
				expect(screen.getByText("Dialog Error")).toBeInTheDocument()
				expect(
					screen.getByText("A dialog component encountered an error. Press ESC or click outside to dismiss."),
				).toBeInTheDocument()
				expect(screen.getByText("Close Dialog")).toBeInTheDocument()
			})

			consoleSpy.mockRestore()
		})
	})

	describe("Timeout mechanism", () => {
		it("should set up timeout when timeoutMs prop is provided", () => {
			const setTimeoutSpy = vi.spyOn(global, "setTimeout")

			render(
				<DialogErrorBoundary timeoutMs={5000}>
					<div>Test content</div>
				</DialogErrorBoundary>,
			)

			expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000)

			setTimeoutSpy.mockRestore()
		})

		it("should use default timeout of 30 seconds when no timeoutMs provided", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const setTimeoutSpy = vi.spyOn(global, "setTimeout")

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000)

			consoleSpy.mockRestore()
			setTimeoutSpy.mockRestore()
		})

		it("should trigger recovery when timeout expires", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

			render(
				<DialogErrorBoundary timeoutMs={1000}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Fast forward time to trigger timeout
			vi.advanceTimersByTime(1000)

			await waitFor(() => {
				expect(consoleWarnSpy).toHaveBeenCalledWith(
					expect.stringContaining("[DialogErrorBoundary] Dialog timeout - attempting recovery"),
				)
			})

			consoleSpy.mockRestore()
			consoleWarnSpy.mockRestore()
		})
	})

	describe("ESC key recovery", () => {
		it("should set up ESC key listener on error", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const addEventListenerSpy = vi.spyOn(document, "addEventListener")

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))

			consoleSpy.mockRestore()
			addEventListenerSpy.mockRestore()
		})

		it("should trigger recovery when ESC key is pressed", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Simulate ESC key press
			fireEvent.keyDown(document, { key: "Escape", code: "Escape" })

			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("[DialogErrorBoundary] ESC key pressed - attempting recovery"),
			)

			consoleSpy.mockRestore()
			consoleLogSpy.mockRestore()
		})

		it("should not trigger recovery for non-ESC keys", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Simulate other key press
			fireEvent.keyDown(document, { key: "Enter", code: "Enter" })

			expect(consoleLogSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("[DialogErrorBoundary] ESC key pressed - attempting recovery"),
			)

			consoleSpy.mockRestore()
			consoleLogSpy.mockRestore()
		})
	})

	describe("Cleanup", () => {
		it("should clean up timeout and event listeners on unmount", () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
			const removeEventListenerSpy = vi.spyOn(document, "removeEventListener")
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			const { unmount } = render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			unmount()

			expect(clearTimeoutSpy).toHaveBeenCalled()
			expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))

			clearTimeoutSpy.mockRestore()
			removeEventListenerSpy.mockRestore()
			consoleSpy.mockRestore()
		})
	})

	describe("Custom props", () => {
		it("should render custom fallback when provided", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const CustomFallback = <div>Custom error fallback</div>

			render(
				<DialogErrorBoundary fallback={CustomFallback} maxRetries={0}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(screen.getByText("Custom error fallback")).toBeInTheDocument()
			expect(screen.queryByText("Dialog Error")).not.toBeInTheDocument()

			consoleSpy.mockRestore()
		})

		it("should respect custom maxRetries prop", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			render(
				<DialogErrorBoundary maxRetries={5}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			expect(screen.getByText(/\(Attempt 1\/5\)/)).toBeInTheDocument()

			consoleSpy.mockRestore()
		})
	})

	describe("Telemetry tracking", () => {
		it("should log recovery attempts to telemetry", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			render(
				<DialogErrorBoundary>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Simulate ESC key to trigger recovery
			fireEvent.keyDown(document, { key: "Escape" })

			await waitFor(() => {
				expect(mockTelemetryCapture).toHaveBeenCalledWith(
					"Dialog Error Recovery Attempted",
					expect.objectContaining({
						retryCount: 1,
						maxRetries: 3,
					}),
				)
			})

			consoleSpy.mockRestore()
		})

		it("should log recovery failures when max retries exceeded", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			// Create boundary that will immediately exceed retries
			render(
				<DialogErrorBoundary maxRetries={1}>
					<ThrowError shouldThrow={true} />
				</DialogErrorBoundary>,
			)

			// Trigger recovery attempts until failure
			fireEvent.keyDown(document, { key: "Escape" })
			fireEvent.keyDown(document, { key: "Escape" })

			await waitFor(() => {
				expect(mockTelemetryCapture).toHaveBeenCalledWith(
					"Dialog Error Recovery Failed",
					expect.objectContaining({
						maxRetries: 1,
						finalError: "Test error",
					}),
				)
			})

			consoleSpy.mockRestore()
		})
	})
})
