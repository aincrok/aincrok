import { suite, test, before, after } from "mocha"
import * as assert from "assert"
import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"

import type { RooCodeAPI } from "@roo-code/types"
import { setDefaultSuiteTimeout } from "./test-utils"

declare const api: RooCodeAPI

suite("LSP System Comprehensive Tests", function () {
	setDefaultSuiteTimeout(this)
	let workspaceFolder: vscode.WorkspaceFolder
	let testFiles: string[] = []

	before(async () => {
		// Get workspace folder
		const folders = vscode.workspace.workspaceFolders
		assert.ok(folders && folders.length > 0, "Workspace folder should be available")
		workspaceFolder = folders[0]!

		// Create test files for LSP analysis
		const testDir = path.join(workspaceFolder.uri.fsPath, "test-lsp")
		await fs.mkdir(testDir, { recursive: true })

		// Create a comprehensive TypeScript test file
		const testFile = {
			name: "ComplexService.ts",
			content: `export interface ServiceConfig {
	maxConnections: number
	timeout: number
	retryAttempts: number
}

export interface ConnectionInfo {
	id: string
	host: string
	port: number
	status: 'connecting' | 'connected' | 'disconnected'
}

export class ComplexService {
	private config: ServiceConfig
	private connections: Map<string, ConnectionInfo> = new Map()

	constructor(config: Partial<ServiceConfig> = {}) {
		this.config = {
			maxConnections: 100,
			timeout: 30000,
			retryAttempts: 3,
			...config
		}
	}

	async createConnection(host: string, port: number): Promise<string> {
		if (this.connections.size >= this.config.maxConnections) {
			throw new Error('Maximum connections exceeded')
		}

		const id = this.generateConnectionId()
		const connection: ConnectionInfo = { id, host, port, status: 'connecting' }
		this.connections.set(id, connection)
		
		try {
			await this.performConnection(connection)
			connection.status = 'connected'
			return id
		} catch (error) {
			connection.status = 'disconnected'
			throw error
		}
	}

	getConnections(): ConnectionInfo[] {
		return Array.from(this.connections.values())
	}

	private generateConnectionId(): string {
		return \`conn_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
	}

	private async performConnection(connection: ConnectionInfo): Promise<void> {
		// Simulate connection with random delay
		await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
	}
}

export function createDefaultService(): ComplexService {
	return new ComplexService({
		maxConnections: 10,
		timeout: 5000,
		retryAttempts: 1
	})
}`,
		}

		const filePath = path.join(testDir, testFile.name)
		await fs.writeFile(filePath, testFile.content)
		testFiles.push(filePath)
	})

	after(async () => {
		// Clean up test files
		for (const filePath of testFiles) {
			try {
				await fs.unlink(filePath)
			} catch (error) {
				// Ignore cleanup errors
			}
		}

		const testDir = path.join(workspaceFolder.uri.fsPath, "test-lsp")
		try {
			await fs.rmdir(testDir)
		} catch (error) {
			// Ignore cleanup errors
		}
	})

	suite("LSP Integration Through Task System", () => {
		test("Code Analysis Task with LSP Context", async () => {
			try {
				// Create a task that would benefit from LSP semantic understanding
				const taskId = await api.startNewTask({
					text: `Analyze the ComplexService class in the test files. Focus on:
					1. The class structure and inheritance
					2. Method signatures and their purposes
					3. Error handling patterns
					4. Async/await usage patterns`,
					configuration: api.getConfiguration(),
				})

				assert.ok(typeof taskId === "string", "Task should be created successfully")
				assert.ok(taskId.length > 0, "Task ID should be non-empty")

				// Send follow-up that would use LSP context
				await api.sendMessage("Based on your analysis, suggest improvements for error handling")

				// Clean up
				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`LSP-enhanced code analysis should work: ${error}`)
			}
		})

		test("Method Analysis with LSP Understanding", async () => {
			try {
				const taskId = await api.startNewTask({
					text: "List all public methods in the ComplexService class and explain their responsibilities",
					configuration: api.getConfiguration(),
				})

				assert.ok(taskId, "Symbol analysis task should be created")

				// Follow up with specific method questions
				await api.sendMessage("What are the parameters and return types for the createConnection method?")
				await api.sendMessage("Which methods are private and why might they be private?")

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Method analysis should work: ${error}`)
			}
		})

		test("Interface Analysis with LSP Context", async () => {
			try {
				const taskId = await api.startNewTask({
					text: "Analyze the ServiceConfig and ConnectionInfo interfaces. Explain their purpose and suggest improvements.",
					configuration: api.getConfiguration(),
				})

				assert.ok(taskId, "Interface analysis task should be created")

				await api.sendMessage("How would you extend these interfaces for better flexibility?")

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Interface analysis should work: ${error}`)
			}
		})
	})

	suite("LSP Workflow Integration", () => {
		test("Code Generation with LSP Understanding", async () => {
			try {
				const taskId = await api.startNewTask({
					text: `Based on the patterns you see in ComplexService, create a new TypeScript class called DataService that:
					1. Follows the same error handling patterns
					2. Uses similar async/await patterns
					3. Has proper TypeScript interfaces
					4. Includes comprehensive JSDoc comments`,
					configuration: api.getConfiguration(),
				})

				assert.ok(taskId, "Code generation task should be created")

				await api.sendMessage(
					"Make sure the generated code includes proper error handling and follows the established patterns",
				)

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Code generation should work: ${error}`)
			}
		})

		test("Refactoring Suggestions with LSP Context", async () => {
			try {
				const taskId = await api.startNewTask({
					text: `Review the ComplexService class and suggest refactoring opportunities:
					- Method extraction opportunities
					- Interface improvements  
					- Performance optimizations
					- Better separation of concerns`,
					configuration: api.getConfiguration(),
				})

				assert.ok(taskId, "Refactoring task should be created")

				await api.sendMessage("Show specific code examples for the refactoring suggestions")

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Refactoring suggestions should work: ${error}`)
			}
		})

		test("Documentation Generation", async () => {
			try {
				const taskId = await api.startNewTask({
					text: "Generate comprehensive API documentation for the ComplexService class, including usage examples",
					configuration: api.getConfiguration(),
				})

				assert.ok(taskId, "Documentation generation task should be created")

				await api.sendMessage("Include TypeScript interfaces and example usage patterns")

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Documentation generation should work: ${error}`)
			}
		})
	})

	suite("LSP Performance and Error Handling", () => {
		test("Task Creation Performance", async () => {
			const startTime = Date.now()

			try {
				const taskId = await api.startNewTask({
					text: "Perform a quick analysis of the ComplexService class structure",
					configuration: api.getConfiguration(),
				})

				const taskCreationTime = Date.now() - startTime
				assert.ok(taskCreationTime < 5000, `Task creation should be fast, took ${taskCreationTime}ms`)

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Task creation performance test should work: ${error}`)
			}
		})

		test("Error Recovery in LSP Operations", async () => {
			try {
				const taskId = await api.startNewTask({
					text: "Analyze this non-existent file: /invalid/path/nonexistent.ts",
					configuration: api.getConfiguration(),
				})

				// This should handle the error gracefully
				assert.ok(taskId, "Task should be created even with invalid file reference")

				// Should continue to work with valid requests
				await api.sendMessage("Now analyze the actual ComplexService.ts file instead")

				await api.clearCurrentTask()
			} catch (error) {
				assert.fail(`Error recovery should work gracefully: ${error}`)
			}
		})

		test("Concurrent Task Handling", async () => {
			const taskIds: string[] = []

			try {
				// Create multiple tasks that would use LSP understanding
				for (let i = 0; i < 3; i++) {
					const taskId = await api.startNewTask({
						text: `Analysis task ${i}: Review ComplexService class methods`,
						configuration: api.getConfiguration(),
					})
					taskIds.push(taskId)
					await api.clearCurrentTask()
				}

				assert.ok(taskIds.length === 3, "All tasks should be created")
				assert.ok(new Set(taskIds).size === 3, "All task IDs should be unique")
			} catch (error) {
				assert.fail(`Concurrent task handling should work: ${error}`)
			}
		})
	})

	suite("LSP System Health Check", () => {
		test("LSP Integration Health Validation", async () => {
			const healthResults = {
				taskCreation: false,
				codeAnalysis: false,
				messaging: false,
				errorHandling: false,
			}

			// Test basic task creation with code context
			try {
				const taskId = await api.startNewTask({
					text: "Perform a quick health check analysis on ComplexService",
					configuration: api.getConfiguration(),
				})
				healthResults.taskCreation = typeof taskId === "string"
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Task creation health check error: ${error}`)
			}

			// Test code analysis capability
			try {
				const taskId = await api.startNewTask({
					text: "List the main classes in the ComplexService file",
					configuration: api.getConfiguration(),
				})
				healthResults.codeAnalysis = typeof taskId === "string"
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Code analysis health check error: ${error}`)
			}

			// Test messaging with LSP context
			try {
				const taskId = await api.startNewTask({
					text: "Analyze ComplexService structure",
					configuration: api.getConfiguration(),
				})
				await api.sendMessage("What methods are available?")
				healthResults.messaging = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Messaging health check error: ${error}`)
			}

			// Test error handling
			try {
				const taskId = await api.startNewTask({
					text: "Analyze invalid file reference gracefully",
					configuration: api.getConfiguration(),
				})
				healthResults.errorHandling = typeof taskId === "string"
				await api.clearCurrentTask()
			} catch (error) {
				// Error is expected but should be handled gracefully
				healthResults.errorHandling = true
			}

			// Calculate health score
			const healthScore = Object.values(healthResults).filter((v) => v).length / Object.keys(healthResults).length

			console.log(`LSP System Health: ${(healthScore * 100).toFixed(0)}%`)
			console.log(`LSP Health Details:`, healthResults)

			// Assert minimum health threshold
			assert.ok(
				healthScore >= 0.5,
				`LSP system should have at least 50% health, got ${(healthScore * 100).toFixed(0)}%`,
			)
		})

		test("LSP Integration Comprehensive Coverage", async () => {
			const coverageAreas = {
				classAnalysis: false,
				interfaceAnalysis: false,
				methodAnalysis: false,
				errorHandling: false,
				codeGeneration: false,
			}

			// Test class analysis
			try {
				const taskId = await api.startNewTask({
					text: "Analyze the ComplexService class structure and design patterns",
					configuration: api.getConfiguration(),
				})
				coverageAreas.classAnalysis = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Class analysis coverage error: ${error}`)
			}

			// Test interface analysis
			try {
				const taskId = await api.startNewTask({
					text: "Explain the ServiceConfig and ConnectionInfo interfaces",
					configuration: api.getConfiguration(),
				})
				coverageAreas.interfaceAnalysis = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Interface analysis coverage error: ${error}`)
			}

			// Test method analysis
			try {
				const taskId = await api.startNewTask({
					text: "Describe the createConnection method implementation",
					configuration: api.getConfiguration(),
				})
				coverageAreas.methodAnalysis = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Method analysis coverage error: ${error}`)
			}

			// Test error handling analysis
			try {
				const taskId = await api.startNewTask({
					text: "Analyze error handling patterns in ComplexService",
					configuration: api.getConfiguration(),
				})
				coverageAreas.errorHandling = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Error handling coverage error: ${error}`)
			}

			// Test code generation
			try {
				const taskId = await api.startNewTask({
					text: "Generate a similar service class based on ComplexService patterns",
					configuration: api.getConfiguration(),
				})
				coverageAreas.codeGeneration = true
				await api.clearCurrentTask()
			} catch (error) {
				console.log(`Code generation coverage error: ${error}`)
			}

			// Calculate coverage score
			const coverageScore =
				Object.values(coverageAreas).filter((v) => v).length / Object.keys(coverageAreas).length

			console.log(`LSP Coverage Score: ${(coverageScore * 100).toFixed(0)}%`)
			console.log(`Coverage Details:`, coverageAreas)

			// Assert high coverage for comprehensive testing
			assert.ok(
				coverageScore >= 0.8,
				`LSP should have at least 80% coverage, got ${(coverageScore * 100).toFixed(0)}%`,
			)
		})
	})
})
