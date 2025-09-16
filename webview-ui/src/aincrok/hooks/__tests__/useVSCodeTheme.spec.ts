import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useVSCodeTheme } from "../useVSCodeTheme"

describe("useVSCodeTheme", () => {
	// Mock MutationObserver
	const mockObserver = {
		observe: vi.fn(),
		disconnect: vi.fn(),
	}
	const mockMutationObserver = vi.fn().mockImplementation(() => mockObserver)

	beforeEach(() => {
		vi.clearAllMocks()
		// Setup MutationObserver mock
		global.MutationObserver = mockMutationObserver

		// Reset document.body attributes
		document.body.removeAttribute("data-vscode-theme-kind")
	})

	afterEach(() => {
		// Clean up
		document.body.removeAttribute("data-vscode-theme-kind")
	})

	it("should return initial theme from document.body", () => {
		document.body.setAttribute("data-vscode-theme-kind", "vscode-dark")

		const { result } = renderHook(() => useVSCodeTheme())

		expect(result.current).toBe("vscode-dark")
	})

	it("should return null when no theme is set initially", () => {
		const { result } = renderHook(() => useVSCodeTheme())

		expect(result.current).toBeNull()
	})

	it("should set up MutationObserver on mount", () => {
		renderHook(() => useVSCodeTheme())

		expect(mockMutationObserver).toHaveBeenCalledWith(expect.any(Function))
		expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
			attributes: true,
			attributeFilter: ["data-vscode-theme-kind"],
		})
	})

	it("should disconnect observer on unmount", () => {
		const { unmount } = renderHook(() => useVSCodeTheme())

		unmount()

		expect(mockObserver.disconnect).toHaveBeenCalled()
	})

	it("should update theme when attribute changes", () => {
		const { result } = renderHook(() => useVSCodeTheme())

		// Initially no theme
		expect(result.current).toBeNull()

		// Get the callback passed to MutationObserver
		const callback = mockMutationObserver.mock.calls[0][0]

		// Simulate attribute change
		act(() => {
			document.body.setAttribute("data-vscode-theme-kind", "vscode-light")

			// Call the mutation observer callback
			callback([
				{
					type: "attributes",
					attributeName: "data-vscode-theme-kind",
				},
			])
		})

		expect(result.current).toBe("vscode-light")
	})

	it("should ignore non-theme attribute changes", () => {
		document.body.setAttribute("data-vscode-theme-kind", "vscode-dark")
		const { result } = renderHook(() => useVSCodeTheme())

		expect(result.current).toBe("vscode-dark")

		const callback = mockMutationObserver.mock.calls[0][0]

		// Simulate non-theme attribute change
		act(() => {
			document.body.setAttribute("some-other-attr", "value")

			callback([
				{
					type: "attributes",
					attributeName: "some-other-attr",
				},
			])
		})

		// Theme should not change
		expect(result.current).toBe("vscode-dark")
	})

	it("should handle multiple mutations", () => {
		const { result } = renderHook(() => useVSCodeTheme())
		const callback = mockMutationObserver.mock.calls[0][0]

		act(() => {
			document.body.setAttribute("data-vscode-theme-kind", "vscode-light")

			// Simulate multiple mutations
			callback([
				{
					type: "attributes",
					attributeName: "some-other-attr",
				},
				{
					type: "attributes",
					attributeName: "data-vscode-theme-kind",
				},
			])
		})

		expect(result.current).toBe("vscode-light")
	})

	it("should handle theme removal", () => {
		document.body.setAttribute("data-vscode-theme-kind", "vscode-dark")
		const { result } = renderHook(() => useVSCodeTheme())

		expect(result.current).toBe("vscode-dark")

		const callback = mockMutationObserver.mock.calls[0][0]

		act(() => {
			document.body.removeAttribute("data-vscode-theme-kind")

			callback([
				{
					type: "attributes",
					attributeName: "data-vscode-theme-kind",
				},
			])
		})

		expect(result.current).toBeNull()
	})

	it("should handle different theme values", () => {
		const themes = ["vscode-dark", "vscode-light", "vscode-high-contrast"]

		for (const theme of themes) {
			document.body.setAttribute("data-vscode-theme-kind", theme)
			const { result } = renderHook(() => useVSCodeTheme())
			expect(result.current).toBe(theme)
		}
	})

	it("should re-read theme on each mutation", () => {
		const { result } = renderHook(() => useVSCodeTheme())
		const callback = mockMutationObserver.mock.calls[0][0]

		// Change theme multiple times
		const themes = ["vscode-dark", "vscode-light", "vscode-high-contrast"]

		for (const theme of themes) {
			act(() => {
				document.body.setAttribute("data-vscode-theme-kind", theme)

				callback([
					{
						type: "attributes",
						attributeName: "data-vscode-theme-kind",
					},
				])
			})

			expect(result.current).toBe(theme)
		}
	})
})
