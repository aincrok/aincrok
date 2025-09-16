import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { copyToClipboard, useCopyToClipboard } from "../clipboard"

// Mock navigator.clipboard
const mockWriteText = vi.fn()
Object.defineProperty(global.navigator, "clipboard", {
	value: {
		writeText: mockWriteText,
	},
	configurable: true,
})

// Mock console.error
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

// Mock timers
vi.useFakeTimers()

describe("clipboard", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.runOnlyPendingTimers()
		vi.useRealTimers()
		vi.useFakeTimers()
	})

	describe("copyToClipboard", () => {
		it("should successfully copy text to clipboard", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const onSuccess = vi.fn()

			const result = await copyToClipboard("test text", { onSuccess })

			expect(mockWriteText).toHaveBeenCalledWith("test text")
			expect(onSuccess).toHaveBeenCalledOnce()
			expect(result).toBe(true)
		})

		it("should handle clipboard write failure", async () => {
			const error = new Error("Clipboard not available")
			mockWriteText.mockRejectedValueOnce(error)
			const onError = vi.fn()

			const result = await copyToClipboard("test text", { onError })

			expect(mockWriteText).toHaveBeenCalledWith("test text")
			expect(onError).toHaveBeenCalledWith(error)
			expect(mockConsoleError).toHaveBeenCalledWith("Failed to copy to clipboard:", error)
			expect(result).toBe(false)
		})

		it("should handle non-Error exceptions", async () => {
			mockWriteText.mockRejectedValueOnce("string error")
			const onError = vi.fn()

			const result = await copyToClipboard("test text", { onError })

			expect(onError).toHaveBeenCalledWith(expect.any(Error))
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Failed to copy to clipboard",
				}),
			)
			expect(result).toBe(false)
		})

		it("should work without options", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)

			const result = await copyToClipboard("test text")

			expect(mockWriteText).toHaveBeenCalledWith("test text")
			expect(result).toBe(true)
		})

		it("should handle empty string", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)

			const result = await copyToClipboard("")

			expect(mockWriteText).toHaveBeenCalledWith("")
			expect(result).toBe(true)
		})

		it("should handle special characters", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const specialText = 'Special chars: \n\t\r"Test"'

			const result = await copyToClipboard(specialText)

			expect(mockWriteText).toHaveBeenCalledWith(specialText)
			expect(result).toBe(true)
		})

		it("should handle unicode characters", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const unicodeText = "Unicode: 🚀 📝 ✅ 中文 العربية"

			const result = await copyToClipboard(unicodeText)

			expect(mockWriteText).toHaveBeenCalledWith(unicodeText)
			expect(result).toBe(true)
		})

		it("should handle very large text", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const largeText = "x".repeat(100000)

			const result = await copyToClipboard(largeText)

			expect(mockWriteText).toHaveBeenCalledWith(largeText)
			expect(result).toBe(true)
		})

		it("should call both callbacks appropriately", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const onSuccess = vi.fn()
			const onError = vi.fn()

			const result = await copyToClipboard("test", { onSuccess, onError })

			expect(onSuccess).toHaveBeenCalledOnce()
			expect(onError).not.toHaveBeenCalled()
			expect(result).toBe(true)
		})
	})

	describe("useCopyToClipboard", () => {
		it("should initialize with correct default values", () => {
			const { result } = renderHook(() => useCopyToClipboard())

			expect(result.current.showCopyFeedback).toBe(false)
			expect(typeof result.current.copyWithFeedback).toBe("function")
		})

		it("should handle successful copy with feedback", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard(1000))

			expect(result.current.showCopyFeedback).toBe(false)

			let copyResult: boolean | undefined
			await act(async () => {
				copyResult = await result.current.copyWithFeedback("test text")
			})

			expect(copyResult).toBe(true)
			expect(result.current.showCopyFeedback).toBe(true)
			expect(mockWriteText).toHaveBeenCalledWith("test text")
		})

		it("should hide feedback after duration", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard(1000))

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(1000)
			})

			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should use custom feedback duration", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const customDuration = 5000
			const { result } = renderHook(() => useCopyToClipboard(customDuration))

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(customDuration - 1)
			})
			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(1)
			})
			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should handle copy failure without showing feedback", async () => {
			mockWriteText.mockRejectedValueOnce(new Error("Copy failed"))
			const { result } = renderHook(() => useCopyToClipboard())

			let copyResult: boolean | undefined
			await act(async () => {
				copyResult = await result.current.copyWithFeedback("test")
			})

			expect(copyResult).toBe(false)
			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should stop event propagation when event is provided", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard())

			const mockEvent = {
				stopPropagation: vi.fn(),
			} as unknown as React.MouseEvent

			await act(async () => {
				await result.current.copyWithFeedback("test", mockEvent)
			})

			expect(mockEvent.stopPropagation).toHaveBeenCalledOnce()
		})

		it("should not call stopPropagation when no event is provided", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard())

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			// Should not throw or cause issues
			expect(result.current.showCopyFeedback).toBe(true)
		})

		it("should clear existing timeout when copying again", async () => {
			mockWriteText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard(2000))

			// First copy
			await act(async () => {
				await result.current.copyWithFeedback("test1")
			})
			expect(result.current.showCopyFeedback).toBe(true)

			// Advance time partially
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.showCopyFeedback).toBe(true)

			// Second copy before first timeout completes
			await act(async () => {
				await result.current.copyWithFeedback("test2")
			})
			expect(result.current.showCopyFeedback).toBe(true)

			// Original timeout should be cleared, new one should be active
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should cleanup timeout on unmount", async () => {
			mockWriteText.mockResolvedValue(undefined)
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
			const { result, unmount } = renderHook(() => useCopyToClipboard())

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			unmount()

			expect(clearTimeoutSpy).toHaveBeenCalled()
		})

		it("should handle multiple rapid copy calls", async () => {
			mockWriteText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard(1000))

			// Rapid fire copies
			const promises = [
				result.current.copyWithFeedback("test1"),
				result.current.copyWithFeedback("test2"),
				result.current.copyWithFeedback("test3"),
			]

			await act(async () => {
				const results = await Promise.all(promises)
				expect(results).toEqual([true, true, true])
			})

			expect(result.current.showCopyFeedback).toBe(true)
			expect(mockWriteText).toHaveBeenCalledTimes(3)
		})

		it("should work with default feedback duration", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard()) // no duration specified

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(2000) // default duration
			})

			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should handle zero feedback duration", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard(0))

			await act(async () => {
				await result.current.copyWithFeedback("test")
			})

			expect(result.current.showCopyFeedback).toBe(true)

			act(() => {
				vi.advanceTimersByTime(0)
			})

			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should memoize copyWithFeedback based on feedbackDuration", () => {
			const { result, rerender } = renderHook(({ duration }) => useCopyToClipboard(duration), {
				initialProps: { duration: 1000 },
			})

			const firstCallback = result.current.copyWithFeedback

			rerender({ duration: 1000 })
			expect(result.current.copyWithFeedback).toBe(firstCallback)

			rerender({ duration: 2000 })
			expect(result.current.copyWithFeedback).not.toBe(firstCallback)
		})
	})

	describe("integration scenarios", () => {
		it("should handle complete copy workflow with feedback", async () => {
			mockWriteText.mockResolvedValueOnce(undefined)
			const { result } = renderHook(() => useCopyToClipboard(1000))

			// Initial state
			expect(result.current.showCopyFeedback).toBe(false)

			// Copy text
			let success: boolean | undefined
			await act(async () => {
				success = await result.current.copyWithFeedback("Hello, World!")
			})

			// Verify copy succeeded and feedback is shown
			expect(success).toBe(true)
			expect(result.current.showCopyFeedback).toBe(true)
			expect(mockWriteText).toHaveBeenCalledWith("Hello, World!")

			// Wait for feedback to disappear
			act(() => {
				vi.advanceTimersByTime(1000)
			})

			expect(result.current.showCopyFeedback).toBe(false)
		})

		it("should handle copy failure with proper error handling", async () => {
			const error = new Error("Permission denied")
			mockWriteText.mockRejectedValueOnce(error)
			const { result } = renderHook(() => useCopyToClipboard())

			let success: boolean | undefined
			await act(async () => {
				success = await result.current.copyWithFeedback("test")
			})

			expect(success).toBe(false)
			expect(result.current.showCopyFeedback).toBe(false)
			expect(mockConsoleError).toHaveBeenCalledWith("Failed to copy to clipboard:", error)
		})

		it("should handle mixed success and failure scenarios", async () => {
			const { result } = renderHook(() => useCopyToClipboard(500))

			// First copy succeeds
			mockWriteText.mockResolvedValueOnce(undefined)
			await act(async () => {
				const success = await result.current.copyWithFeedback("success")
				expect(success).toBe(true)
			})
			expect(result.current.showCopyFeedback).toBe(true)

			// Second copy fails before first timeout completes
			mockWriteText.mockRejectedValueOnce(new Error("Failed"))
			await act(async () => {
				const success = await result.current.copyWithFeedback("failure")
				expect(success).toBe(false)
			})
			// Feedback stays true because the failure doesn't reset it, only the timeout does
			expect(result.current.showCopyFeedback).toBe(true)
		})
	})
})
