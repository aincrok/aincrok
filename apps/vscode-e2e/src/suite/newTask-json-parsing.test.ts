import * as assert from "assert"

import { RooCodeEventName, type ClineMessage } from "@roo-code/types"

import { waitFor, waitUntilCompleted } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("NewTask JSON Parsing Bug Prevention", function () {
	setDefaultSuiteTimeout(this)

	test("Should handle newTask message with plain text without JSON parsing errors", async () => {
		const api = globalThis.api

		// Ensure API is ready
		await waitFor(() => api.isReady(), { timeout: 15000 })

		const errorMessages: string[] = []
		const messages: ClineMessage[] = []

		// Listen for error messages and responses
		api.on(RooCodeEventName.Message, ({ message }) => {
			if (message.type === "say" && message.partial === false) {
				messages.push(message)
			}
		})

		// Monitor console errors for JSON parsing failures
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (
				errorMsg.includes("Failed to parse newTask message") ||
				errorMsg.includes("Unexpected token") ||
				errorMsg.includes("not valid JSON")
			) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Start a new task with a plain text message that could cause JSON parsing errors
			const taskText =
				"Enhance the PyFlink + Apache Paimon data pipeline implementation based on the architecture analysis"

			const taskId = await api.startNewTask({
				configuration: {
					mode: "ask",
					alwaysAllowModeSwitch: true,
					autoApprovalEnabled: true,
				},
				text: taskText,
			})

			// Wait for task to be processed
			await waitUntilCompleted({ api, taskId, timeout: 30000 })

			// Verify no JSON parsing errors occurred
			assert.equal(
				errorMessages.length,
				0,
				`Should not have JSON parsing errors, but got: ${errorMessages.join(", ")}`,
			)

			// Verify task was created successfully
			assert.ok(taskId, "Task ID should be returned")
			assert.ok(typeof taskId === "string", "Task ID should be a string")

			// Verify the task text was processed correctly
			const hasTaskResponse = messages.some((msg) => msg.text && msg.text.length > 0)
			assert.ok(hasTaskResponse, "Task should have generated a response")
		} finally {
			// Restore original console.error
			console.error = originalConsoleError
		}
	})

	test("Should handle newTask with special characters and complex text", async () => {
		const api = globalThis.api

		const errorMessages: string[] = []
		const messages: ClineMessage[] = []

		api.on(RooCodeEventName.Message, ({ message }) => {
			if (message.type === "say" && message.partial === false) {
				messages.push(message)
			}
		})

		// Monitor console errors
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (
				errorMsg.includes("Failed to parse newTask message") ||
				errorMsg.includes("Unexpected token") ||
				errorMsg.includes("not valid JSON")
			) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Test with text that contains JSON-like characters that could break parsing
			const problematicTexts = [
				'{"name": "test"} - this looks like JSON but should be treated as plain text',
				'Fix the {component} with [complex] syntax and "quotes"',
				"Handle special chars: \\n\\t\\r and unicode: 你好",
				"Text with newlines\nand tabs\tand various symbols: @#$%^&*()",
			]

			for (const taskText of problematicTexts) {
				// Clear messages for each test
				messages.length = 0

				const taskId = await api.startNewTask({
					configuration: {
						mode: "ask",
						alwaysAllowModeSwitch: true,
						autoApprovalEnabled: true,
					},
					text: taskText,
				})

				// Wait for task to be processed
				await waitUntilCompleted({ api, taskId, timeout: 30000 })

				// Verify no JSON parsing errors for this text
				assert.equal(
					errorMessages.length,
					0,
					`Should not have JSON parsing errors for text: "${taskText}", but got: ${errorMessages.join(", ")}`,
				)

				// Verify task was created
				assert.ok(taskId, `Task ID should be returned for text: "${taskText}"`)
			}
		} finally {
			console.error = originalConsoleError
		}
	})

	test("Should handle newTask with images and complex text", async () => {
		const api = globalThis.api

		const errorMessages: string[] = []

		// Monitor console errors
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (errorMsg.includes("Failed to parse newTask message")) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Test with both text and images (simulated data URIs)
			const taskText = "Analyze this image and tell me what you see"
			const mockImageDataURI =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

			const taskId = await api.startNewTask({
				configuration: {
					mode: "ask",
					alwaysAllowModeSwitch: true,
					autoApprovalEnabled: true,
				},
				text: taskText,
				images: [mockImageDataURI],
			})

			// Wait for task to be processed
			await waitUntilCompleted({ api, taskId, timeout: 30000 })

			// Verify no parsing errors
			assert.equal(
				errorMessages.length,
				0,
				`Should not have JSON parsing errors with images, but got: ${errorMessages.join(", ")}`,
			)

			// Verify task was created
			assert.ok(taskId, "Task ID should be returned for text with images")
		} finally {
			console.error = originalConsoleError
		}
	})
})
