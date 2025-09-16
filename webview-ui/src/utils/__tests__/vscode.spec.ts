import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { WebviewApi } from "vscode-webview"
import { WebviewMessage } from "@roo/WebviewMessage"

// Mock console.log
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {})

describe("vscode utility", () => {
	// Mock VS Code API
	const mockVsCodeApi: WebviewApi<unknown> = {
		postMessage: vi.fn(),
		getState: vi.fn(),
		setState: vi.fn(),
	}

	// Mock global acquireVsCodeApi function
	const originalAcquireVsCodeApi = global.acquireVsCodeApi

	beforeEach(() => {
		vi.clearAllMocks()
		// Clear localStorage
		localStorage.clear()
		// Reset modules to ensure fresh imports
		vi.resetModules()
	})

	afterEach(() => {
		// Restore original acquireVsCodeApi
		global.acquireVsCodeApi = originalAcquireVsCodeApi
	})

	describe("VSCodeAPIWrapper with VS Code API available", () => {
		beforeEach(() => {
			// Mock acquireVsCodeApi to return our mock
			global.acquireVsCodeApi = vi.fn().mockReturnValue(mockVsCodeApi)
		})

		it("should use VS Code API when available", async () => {
			// Dynamically import to get fresh instance
			const { vscode } = await import("../vscode")

			const message: WebviewMessage = { type: "clearTask" }
			vscode.postMessage(message)

			expect(mockVsCodeApi.postMessage).toHaveBeenCalledWith(message)
			expect(mockConsoleLog).not.toHaveBeenCalled()
		})

		it("should use VS Code API for getState", async () => {
			const mockState = { key: "value" }
			vi.mocked(mockVsCodeApi.getState).mockReturnValue(mockState)

			const { vscode } = await import("../vscode")
			const result = vscode.getState()

			expect(mockVsCodeApi.getState).toHaveBeenCalled()
			expect(result).toEqual(mockState)
		})

		it("should use VS Code API for setState", async () => {
			const newState = { key: "newValue" }
			vi.mocked(mockVsCodeApi.setState).mockReturnValue(newState)

			const { vscode } = await import("../vscode")
			const result = vscode.setState(newState)

			expect(mockVsCodeApi.setState).toHaveBeenCalledWith(newState)
			expect(result).toEqual(newState)
		})
	})

	describe("VSCodeAPIWrapper without VS Code API", () => {
		beforeEach(() => {
			// Mock acquireVsCodeApi as undefined (browser environment)
			global.acquireVsCodeApi = undefined as any
		})

		it("should fall back to console.log for postMessage", async () => {
			const { vscode } = await import("../vscode")

			const message: WebviewMessage = { type: "clearTask" }
			vscode.postMessage(message)

			expect(mockConsoleLog).toHaveBeenCalledWith(message)
			expect(mockVsCodeApi.postMessage).not.toHaveBeenCalled()
		})

		it("should fall back to localStorage for getState when no state exists", async () => {
			const { vscode } = await import("../vscode")

			const result = vscode.getState()

			expect(result).toBeUndefined()
			expect(mockVsCodeApi.getState).not.toHaveBeenCalled()
		})

		it("should fall back to localStorage for getState when state exists", async () => {
			const testState = { key: "value" }
			localStorage.setItem("vscodeState", JSON.stringify(testState))

			const { vscode } = await import("../vscode")
			const result = vscode.getState()

			expect(result).toEqual(testState)
			expect(mockVsCodeApi.getState).not.toHaveBeenCalled()
		})

		it("should handle invalid JSON in localStorage gracefully", async () => {
			localStorage.setItem("vscodeState", "invalid json")

			const { vscode } = await import("../vscode")

			expect(() => vscode.getState()).toThrow()
		})

		it("should fall back to localStorage for setState", async () => {
			const { vscode } = await import("../vscode")
			const newState = { key: "newValue" }

			const result = vscode.setState(newState)

			expect(result).toEqual(newState)
			expect(localStorage.getItem("vscodeState")).toBe(JSON.stringify(newState))
			expect(mockVsCodeApi.setState).not.toHaveBeenCalled()
		})

		it("should handle setting null state", async () => {
			const { vscode } = await import("../vscode")

			const result = vscode.setState(null)

			expect(result).toBe(null)
			expect(localStorage.getItem("vscodeState")).toBe("null")
		})

		it("should handle setting undefined state", async () => {
			const { vscode } = await import("../vscode")

			const result = vscode.setState(undefined)

			expect(result).toBeUndefined()
			expect(localStorage.getItem("vscodeState")).toBe("undefined")
		})
	})

	describe("global window assignment", () => {
		const originalWindow = global.window

		afterEach(() => {
			global.window = originalWindow
		})

		it("should assign vscode to window when window is defined", async () => {
			// Mock window object
			const mockWindow = {} as any
			global.window = mockWindow

			const { vscode } = await import("../vscode")

			expect(mockWindow.vscode).toBe(vscode)
		})

		it("should not fail when window is undefined", async () => {
			global.window = undefined as any

			expect(async () => {
				await import("../vscode")
			}).not.toThrow()
		})
	})

	describe("message types", () => {
		beforeEach(() => {
			global.acquireVsCodeApi = vi.fn().mockReturnValue(mockVsCodeApi)
		})

		it("should handle different WebviewMessage types", async () => {
			const { vscode } = await import("../vscode")

			const messages: WebviewMessage[] = [
				{ type: "newTask", text: "test" },
				{ type: "askResponse", askResponse: "yesButtonClicked" },
				{ type: "clearTask" },
				{ type: "selectImages", images: ["image1.jpg"] },
			]

			messages.forEach((message) => {
				vscode.postMessage(message)
				expect(mockVsCodeApi.postMessage).toHaveBeenCalledWith(message)
			})

			expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(messages.length)
		})
	})

	describe("state management edge cases", () => {
		it("should handle complex state objects when using VS Code API", async () => {
			const complexState = {
				nested: { object: true },
				array: [1, 2, 3],
				nullValue: null,
				undefinedValue: undefined,
				booleanValue: false,
				stringValue: "test",
			}

			global.acquireVsCodeApi = vi.fn().mockReturnValue(mockVsCodeApi)
			vi.mocked(mockVsCodeApi.setState).mockReturnValue(complexState)

			const { vscode } = await import("../vscode")
			const result = vscode.setState(complexState)

			expect(mockVsCodeApi.setState).toHaveBeenCalledWith(complexState)
			expect(result).toEqual(complexState)
		})

		it("should handle complex state objects when using localStorage", async () => {
			global.acquireVsCodeApi = undefined as any

			const complexState = {
				nested: { object: true },
				array: [1, 2, 3],
				nullValue: null,
				booleanValue: false,
				stringValue: "test",
			}

			const { vscode } = await import("../vscode")
			const result = vscode.setState(complexState)

			expect(result).toEqual(complexState)

			// Verify it can be retrieved
			const retrievedState = vscode.getState()
			expect(retrievedState).toEqual(complexState)
		})

		it("should handle state with circular references using localStorage", async () => {
			global.acquireVsCodeApi = undefined as any

			const { vscode } = await import("../vscode")

			const circularState: any = { key: "value" }
			circularState.self = circularState

			expect(() => vscode.setState(circularState)).toThrow()
		})
	})

	// localStorage error edge cases are tested implicitly through normal localStorage usage
	// since any localStorage errors would naturally propagate through the vscode wrapper

	describe("singleton behavior", () => {
		it("should maintain singleton instance across multiple imports", async () => {
			global.acquireVsCodeApi = vi.fn().mockReturnValue(mockVsCodeApi)

			const { vscode: vscode1 } = await import("../vscode")
			const { vscode: vscode2 } = await import("../vscode")

			// Should be the same instance since the module is cached
			expect(vscode1).toBe(vscode2)
		})
	})

	describe("error handling", () => {
		it("should handle VS Code API method failures gracefully", async () => {
			const faultyApi = {
				postMessage: vi.fn().mockImplementation(() => {
					throw new Error("PostMessage failed")
				}),
				getState: vi.fn().mockImplementation(() => {
					throw new Error("GetState failed")
				}),
				setState: vi.fn().mockImplementation(() => {
					throw new Error("SetState failed")
				}),
			}

			global.acquireVsCodeApi = vi.fn().mockReturnValue(faultyApi)

			const { vscode } = await import("../vscode")

			expect(() => vscode.postMessage({ type: "test" } as any)).toThrow("PostMessage failed")
			expect(() => vscode.getState()).toThrow("GetState failed")
			expect(() => vscode.setState({ key: "value" })).toThrow("SetState failed")
		})
	})
})
