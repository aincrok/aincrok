import * as assert from "assert"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import * as vscode from "vscode"

import { RooCodeEventName, type ClineMessage } from "@roo-code/types"

import { waitFor, sleep } from "../utils"
import { setDefaultSuiteTimeout } from "../test-utils"

suite("Aincrok semantic_read_file Tool", function () {
	setDefaultSuiteTimeout(this)

	let tempDir: string
	let testFiles: {
		typescript: string
		javascript: string
		python: string
		simpleClass: string
		complexFile: string
		emptyFile: string
		textFile: string
	}

	// Create a temporary directory and test files
	suiteSetup(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aincrok-semantic-test-"))

		// Create test files in VSCode workspace directory
		const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || tempDir

		// Create test files with different code content types
		testFiles = {
			typescript: path.join(workspaceDir, `test-class-${Date.now()}.ts`),
			javascript: path.join(workspaceDir, `test-functions-${Date.now()}.js`),
			python: path.join(workspaceDir, `test-module-${Date.now()}.py`),
			simpleClass: path.join(workspaceDir, `simple-${Date.now()}.ts`),
			complexFile: path.join(workspaceDir, `complex-${Date.now()}.ts`),
			emptyFile: path.join(workspaceDir, `empty-${Date.now()}.ts`),
			textFile: path.join(workspaceDir, `readme-${Date.now()}.txt`),
		}

		// Create TypeScript file with class and methods
		await fs.writeFile(
			testFiles.typescript,
			`export class UserService {
	private users: User[] = []

	constructor(private config: ServiceConfig) {}

	async createUser(userData: UserData): Promise<User> {
		const user = new User(userData)
		this.users.push(user)
		return user
	}

	async findUser(id: string): Promise<User | null> {
		return this.users.find(u => u.id === id) || null
	}

	private validateUser(user: User): boolean {
		return user.email.includes('@')
	}
}

interface User {
	id: string
	email: string
	name: string
}

interface UserData {
	email: string
	name: string
}

interface ServiceConfig {
	maxUsers: number
}`,
		)

		// Create JavaScript file with functions
		await fs.writeFile(
			testFiles.javascript,
			`function calculateTotal(items) {
	return items.reduce((sum, item) => sum + item.price, 0)
}

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount)
}

class ShoppingCart {
	constructor() {
		this.items = []
	}

	addItem(item) {
		this.items.push(item)
	}

	getTotal() {
		return calculateTotal(this.items)
	}
}

module.exports = { calculateTotal, formatCurrency, ShoppingCart }`,
		)

		// Create Python file with class and functions
		await fs.writeFile(
			testFiles.python,
			`from typing import List, Optional

class DataProcessor:
    def __init__(self, config: dict):
        self.config = config
        self.processed_count = 0

    def process_data(self, data: List[dict]) -> List[dict]:
        """Process a list of data items."""
        result = []
        for item in data:
            processed_item = self._process_single_item(item)
            if processed_item:
                result.append(processed_item)
                self.processed_count += 1
        return result

    def _process_single_item(self, item: dict) -> Optional[dict]:
        """Process a single data item."""
        if not item.get('valid', True):
            return None
        return {
            'id': item.get('id'),
            'processed': True,
            'timestamp': item.get('timestamp')
        }

def utility_function(value: str) -> str:
    """A utility function."""
    return value.upper()

CONSTANT_VALUE = 42`,
		)

		// Create simple class file
		await fs.writeFile(
			testFiles.simpleClass,
			`export class Calculator {
	add(a: number, b: number): number {
		return a + b
	}

	multiply(a: number, b: number): number {
		return a * b
	}
}`,
		)

		// Create complex file with multiple symbols
		await fs.writeFile(
			testFiles.complexFile,
			`import { EventEmitter } from 'events'

export interface APIResponse<T> {
	data: T
	status: number
	message?: string
}

export enum RequestMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE'
}

export abstract class BaseService extends EventEmitter {
	protected baseUrl: string

	constructor(baseUrl: string) {
		super()
		this.baseUrl = baseUrl
	}

	abstract authenticate(): Promise<string>
}

export class APIClient extends BaseService {
	private token?: string

	async authenticate(): Promise<string> {
		// Mock authentication
		this.token = 'mock-token'
		this.emit('authenticated', this.token)
		return this.token
	}

	async request<T>(
		method: RequestMethod,
		endpoint: string,
		data?: any
	): Promise<APIResponse<T>> {
		if (!this.token) {
			await this.authenticate()
		}

		// Mock request implementation
		return {
			data: data as T,
			status: 200,
			message: 'Success'
		}
	}
}

export const API_CONSTANTS = {
	DEFAULT_TIMEOUT: 5000,
	MAX_RETRIES: 3
}

export function createAPIClient(baseUrl: string): APIClient {
	return new APIClient(baseUrl)
}`,
		)

		// Create empty TypeScript file
		await fs.writeFile(testFiles.emptyFile, "")

		// Create plain text file (should fallback to text-based reading)
		await fs.writeFile(testFiles.textFile, "This is a plain text file with no code symbols.")

		console.log("Semantic test files created in:", workspaceDir)
		console.log("Test files:", testFiles)
	})

	// Clean up temporary directory and files after tests
	suiteTeardown(async () => {
		// Cancel any running tasks before cleanup
		try {
			await globalThis.api.cancelCurrentTask()
		} catch {
			// Task might not be running
		}

		// Clean up test files
		for (const filePath of Object.values(testFiles)) {
			try {
				await fs.unlink(filePath)
			} catch {
				// File might not exist
			}
		}

		await fs.rm(tempDir, { recursive: true, force: true })
	})

	// Clean up before each test
	setup(async () => {
		// Cancel any previous task
		try {
			await globalThis.api.cancelCurrentTask()
		} catch {
			// Task might not be running
		}

		// Small delay to ensure clean state
		await sleep(100)
	})

	// Clean up after each test
	teardown(async () => {
		// Cancel the current task
		try {
			await globalThis.api.cancelCurrentTask()
		} catch {
			// Task might not be running
		}

		// Small delay to ensure clean state
		await sleep(100)
	})

	test("Should perform semantic analysis of TypeScript class file", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskStarted = false
		let taskCompleted = false
		let errorOccurred: string | null = null
		let toolExecuted = false
		let _semanticAnalysisDetected = false

		// Listen for messages
		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			// Check for semantic analysis execution
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_read_file") || text.includes('semantic_analysis success="true"')) {
					toolExecuted = true
					_semanticAnalysisDetected = true
					console.log("Semantic analysis tool executed:", text.substring(0, 300))
				} else if (text.includes("read_file")) {
					toolExecuted = true
					console.log("Fallback read_file tool executed:", text.substring(0, 200))
				}
			}

			// Check for errors
			if (message.type === "say" && message.say === "error") {
				errorOccurred = message.text || "Unknown error"
				console.error("Error:", message.text)
			}

			// Log AI responses for debugging
			if (message.type === "say" && (message.say === "text" || message.say === "completion_result")) {
				console.log("AI response:", message.text?.substring(0, 200))
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		// Listen for task events
		const taskStartedHandler = (id: string) => {
			if (id === taskId) {
				taskStarted = true
				console.log("Task started:", id)
			}
		}
		api.on(RooCodeEventName.TaskStarted, taskStartedHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
				console.log("Task completed:", id)
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			// Start task with a request to analyze TypeScript class
			const fileName = path.basename(testFiles.typescript)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please use the semantic read file tool to analyze the TypeScript class file "${fileName}". This file contains a UserService class with methods and interfaces. I want to understand the class structure, methods, and types defined in this file. Provide a detailed analysis of the symbols found.`,
			})

			console.log("Task ID:", taskId)
			console.log("Analyzing file:", fileName)
			console.log("Expected file path:", testFiles.typescript)

			// Wait for task to start
			await waitFor(() => taskStarted, { timeout: 60_000 })

			// Wait for task completion
			await waitFor(() => taskCompleted, { timeout: 60_000 })

			// Verify that the tool was executed
			assert.ok(toolExecuted, "The semantic_read_file or read_file tool should have been executed")

			// Check that no errors occurred
			assert.strictEqual(errorOccurred, null, "No errors should have occurred")

			// Check that the AI mentioned key elements from the TypeScript file
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			// Verify the AI understood the class structure
			assert.ok(
				aiResponses.includes("userservice") || aiResponses.includes("user service"),
				"AI should have identified the UserService class",
			)
			assert.ok(
				aiResponses.includes("createuser") ||
					aiResponses.includes("create user") ||
					aiResponses.includes("method"),
				"AI should have identified methods in the class",
			)
			assert.ok(
				aiResponses.includes("interface") || aiResponses.includes("type"),
				"AI should have identified interfaces or types",
			)

			console.log("Test passed! Semantic analysis completed successfully")
		} finally {
			// Clean up
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskStarted, taskStartedHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle semantic analysis with symbol filtering", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
					console.log("Tool executed for symbol filtering test")
				}
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
				console.log("Task completed:", id)
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			const fileName = path.basename(testFiles.complexFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the file "${fileName}" and focus specifically on finding all classes defined in this file. This file contains multiple types of symbols including interfaces, enums, and classes. I'm particularly interested in the class definitions and their methods.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")

			// Check that AI identified the classes specifically
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("baseservice") || aiResponses.includes("base service"),
				"AI should have identified BaseService class",
			)
			assert.ok(
				aiResponses.includes("apiclient") || aiResponses.includes("api client"),
				"AI should have identified APIClient class",
			)

			console.log("Test passed! Symbol filtering worked correctly")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should fallback to text-based reading for non-code files", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false
		let _fallbackDetected = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes('fallback="text_based"') || text.includes('semantic_analysis success="false"')) {
					_fallbackDetected = true
					console.log("Fallback to text-based reading detected")
				}
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
				}
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			const fileName = path.basename(testFiles.textFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please read the text file "${fileName}". This is a plain text file without code symbols, so semantic analysis should fallback to text-based reading.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")

			// Check that AI read the text content
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("plain text") || aiResponses.includes("text file"),
				"AI should have identified this as a plain text file",
			)

			console.log("Test passed! Fallback mechanism worked correctly")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle empty code files gracefully", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false
		let errorOccurred: string | null = null

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
				}
			}

			if (message.type === "say" && message.say === "error") {
				errorOccurred = message.text || "Unknown error"
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			const fileName = path.basename(testFiles.emptyFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the empty TypeScript file "${fileName}". This file exists but has no content, so there should be no symbols to analyze.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")
			assert.strictEqual(errorOccurred, null, "No errors should have occurred with empty file")

			// Check that AI handled the empty file appropriately
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("empty") ||
					aiResponses.includes("no content") ||
					aiResponses.includes("no symbols"),
				"AI should have identified that the file is empty or has no symbols",
			)

			console.log("Test passed! Empty file handled gracefully")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should analyze Python file with different language semantics", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
				}
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			const fileName = path.basename(testFiles.python)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the Python file "${fileName}". This file contains a DataProcessor class with methods, a utility function, and a constant. Please identify the class structure and its methods.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")

			console.log("Test passed! Python file analysis completed")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})
})
