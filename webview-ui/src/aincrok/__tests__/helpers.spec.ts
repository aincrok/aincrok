import { describe, it, expect, vi, beforeEach } from "vitest"
import { showSystemNotification } from "../helpers"

// Mock the vscode utility
vi.mock("../../utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

// Mock debounce
vi.mock("debounce", () => {
	return {
		default: vi.fn((fn) => fn), // Return the function directly for testing
	}
})

describe("helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("showSystemNotification", () => {
		it("should post a system notification message", async () => {
			const { vscode } = await import("../../utils/vscode")

			showSystemNotification("Test notification message")

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "showSystemNotification",
				notificationOptions: {
					message: "Test notification message",
				},
			})
		})

		it("should handle empty message", async () => {
			const { vscode } = await import("../../utils/vscode")

			showSystemNotification("")

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "showSystemNotification",
				notificationOptions: {
					message: "",
				},
			})
		})

		it("should handle long messages", async () => {
			const { vscode } = await import("../../utils/vscode")
			const longMessage = "A".repeat(1000)

			showSystemNotification(longMessage)

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "showSystemNotification",
				notificationOptions: {
					message: longMessage,
				},
			})
		})

		it("should handle special characters in message", async () => {
			const { vscode } = await import("../../utils/vscode")
			const specialMessage = "Test with émojis 🎉 and symbols @#$%"

			showSystemNotification(specialMessage)

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "showSystemNotification",
				notificationOptions: {
					message: specialMessage,
				},
			})
		})

		it("should be debounced", async () => {
			const debounce = await import("debounce")

			expect(debounce.default).toHaveBeenCalledWith(expect.any(Function))
		})
	})
})
