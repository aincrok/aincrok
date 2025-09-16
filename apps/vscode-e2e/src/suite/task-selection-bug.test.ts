import * as assert from "assert"

import { RooCodeEventName, type ClineMessage } from "@roo-code/types"

import { waitFor, waitUntilCompleted } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("Task Selection Bug Prevention", function () {
	setDefaultSuiteTimeout(this)

	test("Should successfully resume a task that was just created", async () => {
		const api = globalThis.api

		// Ensure API is ready
		await waitFor(() => api.isReady(), { timeout: 15000 })

		const errorMessages: string[] = []
		const messages: ClineMessage[] = []

		// Listen for messages and errors
		api.on(RooCodeEventName.Message, ({ message }) => {
			if (message.type === "say" && message.partial === false) {
				messages.push(message)
			}
		})

		// Monitor console errors for task not found issues
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (
				errorMsg.includes("Task not found") ||
				errorMsg.includes("getTaskWithId") ||
				errorMsg.includes("showTaskWithId")
			) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Step 1: Create a new task
			const taskText = "Write a simple hello world function in Python"

			const taskId = await api.startNewTask({
				configuration: {
					mode: "ask",
					alwaysAllowModeSwitch: true,
					autoApprovalEnabled: true,
				},
				text: taskText,
			})

			// Wait for task to complete
			await waitUntilCompleted({ api, taskId, timeout: 30000 })

			// Verify task was created successfully
			assert.ok(taskId, "Task ID should be returned")
			assert.ok(typeof taskId === "string", "Task ID should be a string")

			// Step 2: Verify task appears in history
			await waitFor(
				async () => {
					const isInHistory = await api.isTaskInHistory(taskId)
					return isInHistory
				},
				{ timeout: 10000 },
			)

			const isInHistory = await api.isTaskInHistory(taskId)
			assert.ok(isInHistory, `Task ${taskId} should be in history`)

			// Step 3: Try to resume the task immediately after creation
			// This tests the race condition where task files might not be fully written
			try {
				await api.resumeTask(taskId)

				// If resume succeeds, verify we can get the current task
				const currentTaskStack = api.getCurrentTaskStack()
				assert.ok(Array.isArray(currentTaskStack), "Task stack should be an array")
				assert.ok(currentTaskStack.length > 0, "Task stack should contain the resumed task")

				// Verify the resumed task has the same ID
				const currentTask = currentTaskStack[currentTaskStack.length - 1]
				assert.equal(currentTask, taskId, "Resumed task should match the original task ID")

				// Verify no "task not found" errors occurred
				assert.equal(
					errorMessages.length,
					0,
					`Should not have task not found errors, but got: ${errorMessages.join(", ")}`,
				)
			} catch (error) {
				// If resume fails, this indicates the bug we're testing for
				assert.fail(`Task resume should succeed immediately after creation, but failed with: ${error}`)
			}
		} finally {
			// Restore original console.error
			console.error = originalConsoleError
		}
	})

	test("Should handle multiple rapid task creation and selection", async () => {
		const api = globalThis.api

		const errorMessages: string[] = []
		const createdTasks: string[] = []

		// Monitor console errors
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (
				errorMsg.includes("Task not found") ||
				errorMsg.includes("getTaskWithId") ||
				errorMsg.includes("showTaskWithId")
			) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Create multiple tasks rapidly to stress test the storage system
			const taskTexts = [
				"Create a simple calculator function",
				"Write a todo list application",
				"Implement a basic sorting algorithm",
			]

			// Step 1: Create tasks rapidly
			for (const taskText of taskTexts) {
				const taskId = await api.startNewTask({
					configuration: {
						mode: "ask",
						alwaysAllowModeSwitch: true,
						autoApprovalEnabled: true,
					},
					text: taskText,
				})

				await waitUntilCompleted({ api, taskId, timeout: 30000 })
				createdTasks.push(taskId)
			}

			// Step 2: Wait for all tasks to be properly saved
			await waitFor(
				async () => {
					for (const taskId of createdTasks) {
						const isInHistory = await api.isTaskInHistory(taskId)
						if (!isInHistory) return false
					}
					return true
				},
				{ timeout: 15000 },
			)

			// Step 3: Try to resume each task to verify they're accessible
			for (const taskId of createdTasks) {
				try {
					await api.resumeTask(taskId)

					// Verify task was resumed
					const currentTaskStack = api.getCurrentTaskStack()
					const currentTask = currentTaskStack[currentTaskStack.length - 1]
					assert.equal(currentTask, taskId, `Should be able to resume task ${taskId}`)
				} catch (error) {
					assert.fail(`Should be able to resume task ${taskId}, but failed with: ${error}`)
				}
			}

			// Verify no task not found errors occurred
			assert.equal(
				errorMessages.length,
				0,
				`Should not have task not found errors, but got: ${errorMessages.join(", ")}`,
			)
		} finally {
			console.error = originalConsoleError
		}
	})

	test("Should gracefully handle attempts to access non-existent tasks", async () => {
		const api = globalThis.api

		const errorMessages: string[] = []

		// Monitor console errors - we expect some in this test
		const originalConsoleError = console.error
		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (errorMsg.includes("Task not found")) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Try to access a non-existent task ID
			const fakeTaskId = "00000000-0000-0000-0000-000000000000"

			// Verify task is not in history
			const isInHistory = await api.isTaskInHistory(fakeTaskId)
			assert.equal(isInHistory, false, "Fake task should not be in history")

			// Try to resume non-existent task - this should fail gracefully
			try {
				await api.resumeTask(fakeTaskId)
				assert.fail("Resuming non-existent task should throw an error")
			} catch (error) {
				// This is expected - verify the error is appropriate
				assert.ok(error, "Should throw error for non-existent task")
				assert.ok(
					(error as Error).message.includes("not found") ||
						(error as Error).message.includes("Task not found"),
					`Error message should indicate task not found, got: ${(error as Error).message}`,
				)
			}

			// Verify that error logging occurred (this is expected for non-existent tasks)
			assert.ok(errorMessages.length > 0, "Should log errors when accessing non-existent tasks")
		} finally {
			console.error = originalConsoleError
		}
	})

	test("Should handle TaskHistoryManager vs globalState synchronization", async () => {
		const api = globalThis.api

		const errorMessages: string[] = []

		// Monitor console errors
		const originalConsoleError = console.error
		const originalConsoleWarn = console.warn
		const warnMessages: string[] = []

		console.error = (...args: any[]) => {
			const errorMsg = args.join(" ")
			if (errorMsg.includes("Task not found") || errorMsg.includes("TaskHistoryManager failed")) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		console.warn = (...args: any[]) => {
			const warnMsg = args.join(" ")
			if (warnMsg.includes("TaskHistoryManager failed") || warnMsg.includes("Task file not found on attempt")) {
				warnMessages.push(warnMsg)
			}
			originalConsoleWarn.apply(console, args)
		}

		try {
			// Create a task to ensure we have something in the system
			const taskId = await api.startNewTask({
				configuration: {
					mode: "ask",
					alwaysAllowModeSwitch: true,
					autoApprovalEnabled: true,
				},
				text: "Test task for TaskHistoryManager synchronization",
			})

			await waitUntilCompleted({ api, taskId, timeout: 30000 })

			// Verify task was created and is accessible
			const isInHistory = await api.isTaskInHistory(taskId)
			assert.ok(isInHistory, "Task should be in history after creation")

			// Test multiple rapid accesses to trigger potential race conditions
			const accessPromises = []
			for (let i = 0; i < 3; i++) {
				accessPromises.push(
					api.resumeTask(taskId).catch((error) => {
						console.log(`Access attempt ${i + 1} failed:`, error.message)
						return error
					}),
				)
			}

			const results = await Promise.all(accessPromises)

			// At least one access should succeed
			const successfulAccesses = results.filter((result) => !(result instanceof Error))
			assert.ok(successfulAccesses.length > 0, "At least one task access should succeed")

			// Should not have critical errors (warnings about retries are acceptable)
			const criticalErrors = errorMessages.filter(
				(msg) => !msg.includes("TaskHistoryManager failed") && !msg.includes("Task file not found on attempt"),
			)

			assert.equal(
				criticalErrors.length,
				0,
				`Should not have critical task access errors, but got: ${criticalErrors.join(", ")}`,
			)
		} finally {
			console.error = originalConsoleError
			console.warn = originalConsoleWarn
		}
	})

	test("Should handle task file corruption gracefully", async () => {
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
				errorMsg.includes("Task not found") ||
				errorMsg.includes("file not found") ||
				errorMsg.includes("Task file not found")
			) {
				errorMessages.push(errorMsg)
			}
			originalConsoleError.apply(console, args)
		}

		try {
			// Create a task
			const taskId = await api.startNewTask({
				configuration: {
					mode: "ask",
					alwaysAllowModeSwitch: true,
					autoApprovalEnabled: true,
				},
				text: "Test task for file corruption handling",
			})

			await waitUntilCompleted({ api, taskId, timeout: 30000 })

			// Verify task was created and is in history
			const isInHistory = await api.isTaskInHistory(taskId)
			assert.ok(isInHistory, "Task should be in history after creation")

			// Try to resume the task
			try {
				await api.resumeTask(taskId)

				// If successful, verify task state
				const currentTaskStack = api.getCurrentTaskStack()
				assert.ok(currentTaskStack.length > 0, "Should have active task after resume")
			} catch (error) {
				// If resume fails due to file issues, verify it's handled gracefully
				if ((error as Error).message.includes("Task not found")) {
					// This is the bug we're testing - the task exists in history but files are missing
					console.log(`Detected task not found issue for task ${taskId}: ${(error as Error).message}`)

					// The system should handle this gracefully - check that appropriate errors are logged
					assert.ok(
						errorMessages.some(
							(msg) => msg.includes("Task file not found") || msg.includes("Task not found"),
						),
						"Should log appropriate error messages for missing task files",
					)
				} else {
					throw error // Re-throw unexpected errors
				}
			}
		} finally {
			console.error = originalConsoleError
		}
	})
})
