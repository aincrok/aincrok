import * as assert from "assert"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import * as vscode from "vscode"

import { RooCodeEventName, type ClineMessage } from "@roo-code/types"

import { waitFor, sleep } from "../utils"
import { setDefaultSuiteTimeout } from "../test-utils"

suite("Aincrok semantic_search Tool", function () {
	setDefaultSuiteTimeout(this)

	let tempDir: string
	let testFiles: {
		serviceFile: string
		utilsFile: string
		configFile: string
		modelFile: string
		controllerFile: string
	}

	// Create a temporary directory and test files
	suiteSetup(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aincrok-search-test-"))

		// Create test files in VSCode workspace directory
		const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || tempDir

		// Create test files with searchable content
		testFiles = {
			serviceFile: path.join(workspaceDir, `user-service-${Date.now()}.ts`),
			utilsFile: path.join(workspaceDir, `utils-${Date.now()}.ts`),
			configFile: path.join(workspaceDir, `config-${Date.now()}.ts`),
			modelFile: path.join(workspaceDir, `user-model-${Date.now()}.ts`),
			controllerFile: path.join(workspaceDir, `user-controller-${Date.now()}.ts`),
		}

		// Create UserService file
		await fs.writeFile(
			testFiles.serviceFile,
			`export class UserService {
	private database: Database

	constructor(database: Database) {
		this.database = database
	}

	async createUser(userData: CreateUserRequest): Promise<User> {
		const user = await this.database.users.create(userData)
		return user
	}

	async findUserById(id: string): Promise<User | null> {
		return await this.database.users.findById(id)
	}

	async updateUser(id: string, updates: Partial<User>): Promise<User> {
		return await this.database.users.update(id, updates)
	}

	async deleteUser(id: string): Promise<void> {
		await this.database.users.delete(id)
	}

	async getUsersByEmail(email: string): Promise<User[]> {
		return await this.database.users.findByEmail(email)
	}
}

interface CreateUserRequest {
	email: string
	name: string
	password: string
}

interface Database {
	users: UserRepository
}

interface UserRepository {
	create(data: CreateUserRequest): Promise<User>
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User[]>
	update(id: string, updates: Partial<User>): Promise<User>
	delete(id: string): Promise<void>
}`,
		)

		// Create utils file
		await fs.writeFile(
			testFiles.utilsFile,
			`export function validateEmail(email: string): boolean {
	const emailRegex = /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/
	return emailRegex.test(email)
}

export function hashPassword(password: string): Promise<string> {
	// Mock hash implementation
	return Promise.resolve(\`hashed_\${password}\`)
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 15)
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ValidationError'
	}
}

export const EMAIL_CONSTANTS = {
	MIN_LENGTH: 5,
	MAX_LENGTH: 254,
	DOMAIN_SEPARATOR: '@'
}`,
		)

		// Create config file
		await fs.writeFile(
			testFiles.configFile,
			`export interface AppConfig {
	database: DatabaseConfig
	auth: AuthConfig
	server: ServerConfig
}

export interface DatabaseConfig {
	host: string
	port: number
	name: string
	user: string
	password: string
}

export interface AuthConfig {
	jwtSecret: string
	tokenExpiration: number
	refreshTokenExpiration: number
}

export interface ServerConfig {
	port: number
	host: string
	cors: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
	database: {
		host: 'localhost',
		port: 5432,
		name: 'app_db',
		user: 'postgres',
		password: 'password'
	},
	auth: {
		jwtSecret: 'your-secret-key',
		tokenExpiration: 3600,
		refreshTokenExpiration: 86400
	},
	server: {
		port: 3000,
		host: '0.0.0.0',
		cors: true
	}
}`,
		)

		// Create User model file
		await fs.writeFile(
			testFiles.modelFile,
			`export interface User {
	id: string
	email: string
	name: string
	password: string
	createdAt: Date
	updatedAt: Date
	isActive: boolean
	profile?: UserProfile
}

export interface UserProfile {
	firstName: string
	lastName: string
	phoneNumber?: string
	address?: Address
	preferences: UserPreferences
}

export interface Address {
	street: string
	city: string
	state: string
	zipCode: string
	country: string
}

export interface UserPreferences {
	theme: 'light' | 'dark'
	language: string
	notifications: {
		email: boolean
		sms: boolean
		push: boolean
	}
}

export enum UserRole {
	ADMIN = 'admin',
	USER = 'user',
	MODERATOR = 'moderator'
}

export class UserEntity implements User {
	id: string
	email: string
	name: string
	password: string
	createdAt: Date
	updatedAt: Date
	isActive: boolean
	profile?: UserProfile

	constructor(data: Partial<User>) {
		this.id = data.id || ''
		this.email = data.email || ''
		this.name = data.name || ''
		this.password = data.password || ''
		this.createdAt = data.createdAt || new Date()
		this.updatedAt = data.updatedAt || new Date()
		this.isActive = data.isActive ?? true
		this.profile = data.profile
	}

	updateProfile(profile: Partial<UserProfile>): void {
		this.profile = { ...this.profile, ...profile } as UserProfile
		this.updatedAt = new Date()
	}
}`,
		)

		// Create controller file
		await fs.writeFile(
			testFiles.controllerFile,
			`import { Request, Response } from 'express'
import { UserService } from './user-service'
import { validateEmail } from './utils'

export class UserController {
	constructor(private userService: UserService) {}

	async createUser(req: Request, res: Response): Promise<void> {
		try {
			const { email, name, password } = req.body

			if (!validateEmail(email)) {
				res.status(400).json({ error: 'Invalid email format' })
				return
			}

			const user = await this.userService.createUser({ email, name, password })
			res.status(201).json(user)
		} catch (error) {
			res.status(500).json({ error: 'Internal server error' })
		}
	}

	async getUserById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params
			const user = await this.userService.findUserById(id)

			if (!user) {
				res.status(404).json({ error: 'User not found' })
				return
			}

			res.json(user)
		} catch (error) {
			res.status(500).json({ error: 'Internal server error' })
		}
	}

	async updateUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params
			const updates = req.body

			const user = await this.userService.updateUser(id, updates)
			res.json(user)
		} catch (error) {
			res.status(500).json({ error: 'Internal server error' })
		}
	}

	async deleteUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params
			await this.userService.deleteUser(id)
			res.status(204).send()
		} catch (error) {
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}`,
		)

		console.log("Semantic search test files created in:", workspaceDir)
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

	test("Should find all User-related classes and interfaces", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskStarted = false
		let taskCompleted = false
		let errorOccurred: string | null = null
		let toolExecuted = false
		let _semanticSearchDetected = false

		// Listen for messages
		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			// Check for semantic search execution
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes('semantic_analysis success="true"')) {
					toolExecuted = true
					_semanticSearchDetected = true
					console.log("Semantic search tool executed:", text.substring(0, 300))
				} else if (text.includes("search_files")) {
					toolExecuted = true
					console.log("Fallback search_files tool executed:", text.substring(0, 200))
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
			// Start task with a search request for User-related symbols
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please use the semantic search tool to find all symbols related to "User" in the codebase. I'm looking for classes, interfaces, and types that contain "User" in their name. This should include UserService, UserController, User interface, UserProfile, etc.`,
			})

			console.log("Task ID:", taskId)
			console.log("Searching for User-related symbols")

			// Wait for task to start
			await waitFor(() => taskStarted, { timeout: 60_000 })

			// Wait for task completion
			await waitFor(() => taskCompleted, { timeout: 60_000 })

			// Verify that the search tool was executed
			assert.ok(toolExecuted, "The semantic_search or search_files tool should have been executed")

			// Check that no errors occurred
			assert.strictEqual(errorOccurred, null, "No errors should have occurred")

			// Check that the AI found User-related symbols
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			// Verify the AI found key User-related symbols
			assert.ok(
				aiResponses.includes("userservice") || aiResponses.includes("user service"),
				"AI should have found UserService class",
			)
			assert.ok(
				aiResponses.includes("usercontroller") || aiResponses.includes("user controller"),
				"AI should have found UserController class",
			)
			assert.ok(
				aiResponses.includes("user") && (aiResponses.includes("interface") || aiResponses.includes("type")),
				"AI should have found User interface/type",
			)

			console.log("Test passed! User-related symbols found successfully")
		} finally {
			// Clean up
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskStarted, taskStartedHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should find specific functions by name", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes("search_files")) {
					toolExecuted = true
					console.log("Search tool executed for function search")
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
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please search for functions that validate data, specifically looking for "validateEmail" function. I want to understand where email validation is implemented in the codebase.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")

			// Check that AI found the validateEmail function
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("validateemail") || aiResponses.includes("validate email"),
				"AI should have found validateEmail function",
			)
			assert.ok(
				aiResponses.includes("email") && aiResponses.includes("validation"),
				"AI should mention email validation functionality",
			)

			console.log("Test passed! Function search completed successfully")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should search with file pattern filtering", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes("search_files")) {
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
				text: `Please search for all "Config" related interfaces and types, but only in files that contain "config" in their filename. I want to find configuration-related symbols specifically in configuration files.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")

			console.log("Test passed! File pattern filtering search completed")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should find symbols with relationships and references", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes("search_files")) {
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
				text: `Please find the UserService class and show me where it's being used or referenced in other files. I want to understand the relationships and dependencies around this service class.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")

			console.log("Test passed! Relationship and reference search completed")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should handle search with no results gracefully", async function () {
		const api = globalThis.api
		const messages: ClineMessage[] = []
		let taskCompleted = false
		let toolExecuted = false
		let errorOccurred: string | null = null

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			messages.push(message)

			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes("search_files")) {
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
			taskId = await api.startNewTask({
				configuration: {
					mode: "code",
					autoApprovalEnabled: true,
					alwaysAllowReadOnly: true,
					alwaysAllowReadOnlyOutsideWorkspace: true,
				},
				text: `Please search for symbols related to "NonExistentSymbolThatDoesNotExist". This should return no results since no such symbols exist in the codebase.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")
			assert.strictEqual(errorOccurred, null, "No errors should have occurred with empty search results")

			// Check that AI handled the empty results appropriately
			const aiResponses = messages
				.filter((m) => m.type === "say" && (m.say === "completion_result" || m.say === "text"))
				.map((m) => m.text || "")
				.join(" ")
				.toLowerCase()

			assert.ok(
				aiResponses.includes("no") &&
					(aiResponses.includes("found") || aiResponses.includes("result") || aiResponses.includes("match")),
				"AI should have indicated that no results were found",
			)

			console.log("Test passed! Empty search results handled gracefully")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})

	test("Should search for specific symbol kinds (classes only)", async function () {
		const api = globalThis.api
		let taskCompleted = false
		let toolExecuted = false

		const messageHandler = ({ message }: { message: ClineMessage }) => {
			if (message.type === "say" && message.say === "api_req_started") {
				const text = message.text || ""
				if (text.includes("semantic_search") || text.includes("search_files")) {
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
				text: `Please search for all class definitions in the codebase. I want to find only classes, not interfaces or functions. Look for symbols like UserService, UserController, ValidationError, etc.`,
			})

			await waitFor(() => taskCompleted, { timeout: 60_000 })

			assert.ok(toolExecuted, "Search tool should have been executed")

			console.log("Test passed! Symbol kind filtering search completed")
		} finally {
			api.off(RooCodeEventName.Message, messageHandler)
			api.off(RooCodeEventName.TaskCompleted, taskCompletedHandler)
		}
	})
})
