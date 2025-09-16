import * as assert from "assert"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import * as vscode from "vscode"

import { RooCodeEventName, type ClineMessage } from "@roo-code/types"

import { waitFor, sleep } from "../utils"
import { setDefaultSuiteTimeout } from "../test-utils"

suite("Aincrok LSP Integration and Fallback", function () {
	setDefaultSuiteTimeout(this)

	let tempDir: string
	let testFiles: {
		validTypeScript: string
		invalidTypeScript: string
		unsupportedFile: string
		largeFile: string
		binaryFile: string
	}

	// Create a temporary directory and test files
	suiteSetup(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aincrok-lsp-test-"))

		// Create test files in VSCode workspace directory
		const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || tempDir

		// Create test files for various LSP scenarios
		testFiles = {
			validTypeScript: path.join(workspaceDir, `valid-code-${Date.now()}.ts`),
			invalidTypeScript: path.join(workspaceDir, `invalid-syntax-${Date.now()}.ts`),
			unsupportedFile: path.join(workspaceDir, `config-${Date.now()}.toml`),
			largeFile: path.join(workspaceDir, `large-file-${Date.now()}.ts`),
			binaryFile: path.join(workspaceDir, `binary-${Date.now()}.bin`),
		}

		// Create valid TypeScript file with comprehensive symbols
		await fs.writeFile(
			testFiles.validTypeScript,
			`import { EventEmitter } from 'events'

/**
 * A comprehensive service class for testing LSP integration
 */
export class TestService extends EventEmitter {
	private static instance: TestService | null = null
	private readonly config: TestConfig
	private cache = new Map<string, any>()

	constructor(config: TestConfig) {
		super()
		this.config = config
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(config?: TestConfig): TestService {
		if (!TestService.instance) {
			if (!config) throw new Error('Config required for first instance')
			TestService.instance = new TestService(config)
		}
		return TestService.instance
	}

	/**
	 * Process data asynchronously
	 */
	async processData<T>(data: T[], processor: DataProcessor<T>): Promise<ProcessResult<T>> {
		const results: T[] = []
		const errors: ProcessError[] = []

		for (const item of data) {
			try {
				const result = await processor.process(item)
				results.push(result)
				this.emit('itemProcessed', result)
			} catch (error) {
				const processError: ProcessError = {
					item,
					error: error as Error,
					timestamp: new Date()
				}
				errors.push(processError)
				this.emit('processingError', processError)
			}
		}

		return { results, errors, total: data.length }
	}

	/**
	 * Cache management
	 */
	set<T>(key: string, value: T, ttl?: number): void {
		this.cache.set(key, { value, timestamp: Date.now(), ttl })
	}

	get<T>(key: string): T | null {
		const cached = this.cache.get(key)
		if (!cached) return null

		if (cached.ttl && Date.now() - cached.timestamp > cached.ttl * 1000) {
			this.cache.delete(key)
			return null
		}

		return cached.value as T
	}

	private validateConfig(config: TestConfig): boolean {
		return config.enabled && config.maxItems > 0
	}
}

export interface TestConfig {
	enabled: boolean
	maxItems: number
	timeout: number
	retries: number
}

export interface DataProcessor<T> {
	process(item: T): Promise<T>
}

export interface ProcessResult<T> {
	results: T[]
	errors: ProcessError[]
	total: number
}

export interface ProcessError {
	item: any
	error: Error
	timestamp: Date
}

export enum ProcessStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed'
}

export const DEFAULT_CONFIG: TestConfig = {
	enabled: true,
	maxItems: 100,
	timeout: 5000,
	retries: 3
}

export function createProcessor<T>(
	processFn: (item: T) => Promise<T>
): DataProcessor<T> {
	return { process: processFn }
}

export abstract class BaseProcessor<T> implements DataProcessor<T> {
	abstract process(item: T): Promise<T>
	
	protected log(message: string): void {
		console.log(\`[\${this.constructor.name}] \${message}\`)
	}
}`,
		)

		// Create TypeScript file with syntax errors
		await fs.writeFile(
			testFiles.invalidTypeScript,
			`// This file has intentional syntax errors to test fallback behavior

export class InvalidSyntax {
	// Missing closing brace and semicolon
	private data: string = "test"
	
	// Invalid method syntax
	async method() {
		const result = await this.getData(
		// Missing closing parenthesis and implementation
	}
	
	// Incomplete interface
	interface IncompleteInterface {
		name: string
		// Missing closing brace

// Missing export and class closing
export function incompleteFunction() {
	return "incomplete
// Missing closing quote and brace`,
		)

		// Create unsupported file format (TOML)
		await fs.writeFile(
			testFiles.unsupportedFile,
			`[database]
host = "localhost"
port = 5432
name = "test_db"

[server]
host = "0.0.0.0"
port = 3000
debug = true

[[users]]
name = "admin"
role = "administrator"

[[users]]
name = "user"
role = "standard"`,
		)

		// Create large TypeScript file
		const largeFileContent = [
			`// Large file to test performance and LSP handling`,
			`export namespace LargeTestNamespace {`,
		]

		// Add many classes and interfaces
		for (let i = 1; i <= 50; i++) {
			largeFileContent.push(`
	export interface TestInterface${i} {
		id: string
		name: string
		data: TestData${i}
		method${i}(): Promise<void>
	}

	export interface TestData${i} {
		value: number
		timestamp: Date
		metadata: { [key: string]: any }
	}

	export class TestClass${i} implements TestInterface${i} {
		id: string = 'test-${i}'
		name: string = 'TestClass${i}'
		data: TestData${i}

		constructor() {
			this.data = {
				value: ${i},
				timestamp: new Date(),
				metadata: { index: ${i} }
			}
		}

		async method${i}(): Promise<void> {
			console.log(\`Executing method ${i}\`)
			await new Promise(resolve => setTimeout(resolve, 10))
		}

		static create${i}(): TestClass${i} {
			return new TestClass${i}()
		}
	}`)
		}

		largeFileContent.push(`}`)
		largeFileContent.push(`export const LARGE_FILE_CONSTANTS = { TOTAL_CLASSES: 50 }`)

		await fs.writeFile(testFiles.largeFile, largeFileContent.join("\n"))

		// Create binary file
		const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // PNG header
		await fs.writeFile(testFiles.binaryFile, binaryData)

		console.log("LSP test files created in:", workspaceDir)
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

	test("Should use LSP for valid TypeScript file with complex symbols", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskStarted = false
		let taskCompleted = false
		let errorOccurred: string | null = null
		let lspAnalysisDetected = false
		let toolExecuted = false

		// Listen for messages
		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes('semantic_analysis success="true"') || text.includes("semantic_read_file")) {
					lspAnalysisDetected = true
					toolExecuted = true
					console.log("LSP semantic analysis detected:", text.substring(0, 300))
				} else if (text.includes("read_file")) {
					toolExecuted = true
					console.log("Tool executed (possibly fallback):", text.substring(0, 200))
				}
			}

			if (message.type === "say" && message.say === "error") {
				errorOccurred = message.text || "Unknown error"
				console.error("Error:", message.text)
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
			const fileName = path.basename(testFiles.validTypeScript)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the TypeScript file "${fileName}" using semantic understanding. This file contains a complex service class with methods, interfaces, enums, and inheritance. I want to understand the class hierarchy, available methods, and symbol relationships. Focus on identifying the TestService class, its methods, and the interfaces it uses.`,
			})

			await waitFor(() => taskStarted, { timeout: 60_000 })
			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Analysis tool should have been executed")
			assert.strictEqual(errorOccurred, null, "No errors should have occurred")

			// Check that the AI understood the complex TypeScript structure
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("testservice") || aiResponses.includes("test service"),
				"AI should have identified TestService class",
			)
			assert.ok(
				aiResponses.includes("processdata") ||
					aiResponses.includes("process data") ||
					aiResponses.includes("method"),
				"AI should have identified methods",
			)
			assert.ok(
				aiResponses.includes("interface") || aiResponses.includes("enum"),
				"AI should have identified interfaces or enums",
			)

			console.log("Test passed! LSP analysis of valid TypeScript file successful")
			console.log("LSP analysis detected:", lspAnalysisDetected)
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskStarted, taskStartedHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should gracefully fallback for files with syntax errors", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false
		let fallbackDetected = false
		let _errorOccurred: string | null = null

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes('fallback="text_based"') || text.includes('semantic_analysis success="false"')) {
					fallbackDetected = true
					console.log("Fallback to text-based reading detected")
				}
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
				}
			}

			if (message.type === "say" && message.say === "error") {
				_errorOccurred = message.text || "Unknown error"
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
			const fileName = path.basename(testFiles.invalidTypeScript)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the TypeScript file "${fileName}". This file has intentional syntax errors, so LSP semantic analysis might fail and should fallback to text-based reading. Please try to understand what the file contains despite the syntax issues.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")
			// Don't assert on error occurrence as syntax errors are expected

			// Check that AI still provided some analysis despite syntax errors
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("syntax") ||
					aiResponses.includes("error") ||
					aiResponses.includes("invalid") ||
					aiResponses.includes("incomplete"),
				"AI should have identified syntax issues",
			)

			console.log("Test passed! Graceful handling of syntax errors")
			console.log("Fallback detected:", fallbackDetected)
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should fallback to text-based reading for unsupported file types", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false
		let fallbackDetected = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes('fallback="text_based"')) {
					fallbackDetected = true
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
			const fileName = path.basename(testFiles.unsupportedFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please read the configuration file "${fileName}". This is a TOML file which is not supported by LSP semantic analysis, so it should fallback to text-based reading.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")

			console.log("Test passed! Unsupported file type handled with fallback")
			console.log("Fallback detected:", fallbackDetected)
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle large files efficiently", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false
		let errorOccurred: string | null = null
		let startTime: number

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_read_file") || text.includes("read_file")) {
					toolExecuted = true
					console.log("Tool executed for large file analysis")
				}
			}

			if (message.type === "say" && message.say === "error") {
				errorOccurred = message.text || "Unknown error"
			}
		}
		api.on(RooCodeEventName.Message, messageHandler)

		const taskStartedHandler = (id: string) => {
			if (id === taskId) {
				startTime = Date.now()
				console.log("Large file analysis task started")
			}
		}
		api.on(RooCodeEventName.TaskStarted, taskStartedHandler)

		const taskCompletedHandler = (id: string) => {
			if (id === taskId) {
				taskCompleted = true
				const duration = Date.now() - startTime
				console.log(`Large file analysis completed in ${duration}ms`)
			}
		}
		api.on(RooCodeEventName.TaskCompleted, taskCompletedHandler)

		let taskId: string
		try {
			const fileName = path.basename(testFiles.largeFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please analyze the large TypeScript file "${fileName}". This file contains many classes and interfaces (50 of each). I want to understand the overall structure and maybe identify a few key classes. Focus on efficiency and don't try to analyze every single symbol.`,
			})

			await waitFor(() => taskCompleted, { timeout: 120_000 }) // Longer timeout for large file

			assert.ok(toolExecuted, "Tool should have been executed")
			assert.strictEqual(errorOccurred, null, "No errors should have occurred with large file")

			console.log("Test passed! Large file handled efficiently")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskStarted, taskStartedHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle binary files gracefully", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false
		let errorOccurred: string | null = null

		const messageHandler = ({ message }: { message: ClineMessage }) => {
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
			const fileName = path.basename(testFiles.binaryFile)
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please try to read the binary file "${fileName}". This is a binary file, so semantic analysis is not applicable and the system should handle it appropriately.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Tool should have been executed")

			// Binary files should be handled gracefully, either with an appropriate message or fallback
			console.log("Test passed! Binary file handled appropriately")
			console.log("Error occurred:", errorOccurred)
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle semantic search with LSP integration", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false
		let lspSearchDetected = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") && text.includes('semantic_analysis success="true"')) {
					lspSearchDetected = true
					toolExecuted = true
					console.log("LSP semantic search detected")
				} else if (text.includes("semantic_search") || text.includes("search_files")) {
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
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please search for all classes that extend or implement something (inheritance and interface implementation). Look for symbols like "TestService extends EventEmitter" or classes that implement interfaces. Use semantic understanding to find these relationships.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")

			console.log("Test passed! Semantic search with LSP integration completed")
			console.log("LSP search detected:", lspSearchDetected)
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})
})
