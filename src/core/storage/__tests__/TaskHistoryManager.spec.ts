// aincrok_change - new file
import { describe, it, expect, beforeEach, vi } from "vitest"
import * as vscode from "vscode"
import { TaskHistoryManager, TaskHistoryIndex } from "../TaskHistoryManager"
import { HistoryItem } from "@roo-code/types"

// Mock VS Code APIs
vi.mock("vscode", () => ({
	workspace: {
		fs: {
			stat: vi.fn(),
			createDirectory: vi.fn(),
			writeFile: vi.fn(),
			readFile: vi.fn(),
			delete: vi.fn(),
			readDirectory: vi.fn(),
		},
		getConfiguration: vi.fn(() => ({
			get: vi.fn((key: string, defaultValue: any) => defaultValue),
		})),
	},
	Uri: {
		joinPath: vi.fn((base: any, ...paths: string[]) => ({
			fsPath: `${base.fsPath}/${paths.join("/")}`,
			toString: () => `${base.fsPath}/${paths.join("/")}`,
		})),
	},
}))

describe("TaskHistoryManager", () => {
	let mockContext: vscode.ExtensionContext
	let taskHistoryManager: TaskHistoryManager
	let mockGlobalState: Map<string, any>

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// Create mock global state
		mockGlobalState = new Map()

		// Create mock extension context
		mockContext = {
			globalStorageUri: {
				fsPath: "/mock/storage/path",
				toString: () => "/mock/storage/path",
			},
			globalState: {
				get: vi.fn((key: string) => mockGlobalState.get(key)),
				update: vi.fn((key: string, value: any) => {
					mockGlobalState.set(key, value)
					return Promise.resolve()
				}),
			},
		} as any

		// Reset singleton
		// @ts-ignore - accessing private static member for testing
		TaskHistoryManager.instance = null

		taskHistoryManager = TaskHistoryManager.getInstance(mockContext)
	})

	describe("initialization", () => {
		it("should create storage directories on initialize", async () => {
			const mockStat = vi.mocked(vscode.workspace.fs.stat)
			const mockCreateDirectory = vi.mocked(vscode.workspace.fs.createDirectory)

			// Mock storage directory doesn't exist
			mockStat
				.mockRejectedValueOnce(new Error("Directory not found"))
				.mockRejectedValueOnce(new Error("Tasks directory not found"))

			await taskHistoryManager.initialize()

			expect(mockCreateDirectory).toHaveBeenCalledTimes(2)
		})

		it("should not create directories if they already exist", async () => {
			const mockStat = vi.mocked(vscode.workspace.fs.stat)
			const mockCreateDirectory = vi.mocked(vscode.workspace.fs.createDirectory)

			// Mock directories exist
			mockStat.mockResolvedValue({ type: 2, ctime: 0, mtime: 0, size: 0 })

			await taskHistoryManager.initialize()

			expect(mockCreateDirectory).not.toHaveBeenCalled()
		})
	})

	describe("saveTask", () => {
		it("should save task to file system and update index", async () => {
			const mockWriteFile = vi.mocked(vscode.workspace.fs.writeFile)
			const mockStat = vi.mocked(vscode.workspace.fs.stat)

			// Mock directories exist
			mockStat.mockResolvedValue({ type: 2, ctime: 0, mtime: 0, size: 0 })

			const historyItem: HistoryItem = {
				id: "test-task-1",
				number: 1,
				ts: Date.now(),
				task: "Test task description",
				tokensIn: 100,
				tokensOut: 50,
				totalCost: 0.01,
				workspace: "/test/workspace",
			}

			await taskHistoryManager.saveTask(historyItem)

			// Verify file was written
			expect(mockWriteFile).toHaveBeenCalled()
			const writeCall = mockWriteFile.mock.calls[0]
			const writtenData = JSON.parse(Buffer.from(writeCall[1]).toString("utf8"))
			expect(writtenData.id).toBe(historyItem.id)
			expect(writtenData.metadata).toEqual(historyItem)

			// Verify index was updated
			const taskIndex = mockGlobalState.get("taskHistoryIndex")
			expect(taskIndex).toHaveLength(1)
			expect(taskIndex[0].id).toBe(historyItem.id)
		})
	})

	describe("getTask", () => {
		it("should retrieve task from file system", async () => {
			const mockReadFile = vi.mocked(vscode.workspace.fs.readFile)

			const mockTaskData = {
				id: "test-task-1",
				metadata: {
					id: "test-task-1",
					number: 1,
					ts: Date.now(),
					task: "Test task",
					tokensIn: 100,
					tokensOut: 50,
					totalCost: 0.01,
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}

			mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify(mockTaskData), "utf8"))

			const result = await taskHistoryManager.getTask("test-task-1")

			expect(result).toEqual(mockTaskData)
			expect(mockReadFile).toHaveBeenCalled()
		})

		it("should return null if task file doesn't exist", async () => {
			const mockReadFile = vi.mocked(vscode.workspace.fs.readFile)
			mockReadFile.mockRejectedValue(new Error("File not found"))

			const result = await taskHistoryManager.getTask("nonexistent-task")

			expect(result).toBeNull()
		})
	})

	describe("deleteTask", () => {
		it("should delete task file and remove from index", async () => {
			const mockDelete = vi.mocked(vscode.workspace.fs.delete)

			// Set up initial index
			const initialIndex: TaskHistoryIndex[] = [
				{
					id: "test-task-1",
					ts: Date.now(),
					task: "Test task 1",
					totalCost: 0.01,
				},
				{
					id: "test-task-2",
					ts: Date.now(),
					task: "Test task 2",
					totalCost: 0.02,
				},
			]
			mockGlobalState.set("taskHistoryIndex", initialIndex)

			await taskHistoryManager.deleteTask("test-task-1")

			expect(mockDelete).toHaveBeenCalled()

			// Verify index was updated
			const updatedIndex = mockGlobalState.get("taskHistoryIndex")
			expect(updatedIndex).toHaveLength(1)
			expect(updatedIndex[0].id).toBe("test-task-2")
		})
	})

	describe("getAllTasksMetadata", () => {
		it("should return sorted task metadata", async () => {
			const now = Date.now()
			const taskIndex: TaskHistoryIndex[] = [
				{
					id: "task-1",
					ts: now - 1000,
					task: "Older task",
					totalCost: 0.01,
				},
				{
					id: "task-2",
					ts: now,
					task: "Newer task",
					totalCost: 0.02,
				},
			]
			mockGlobalState.set("taskHistoryIndex", taskIndex)

			const result = await taskHistoryManager.getAllTasksMetadata()

			expect(result).toHaveLength(2)
			// Should be sorted by timestamp descending (newest first)
			expect(result[0].id).toBe("task-2")
			expect(result[1].id).toBe("task-1")
		})

		it("should return empty array if no tasks exist", async () => {
			const result = await taskHistoryManager.getAllTasksMetadata()
			expect(result).toEqual([])
		})
	})

	describe("migrateFromGlobalState", () => {
		it("should migrate existing task history to file system", async () => {
			const mockWriteFile = vi.mocked(vscode.workspace.fs.writeFile)
			const mockStat = vi.mocked(vscode.workspace.fs.stat)

			// Mock directories exist
			mockStat.mockResolvedValue({ type: 2, ctime: 0, mtime: 0, size: 0 })

			// Set up existing task history in globalState
			const existingHistory: HistoryItem[] = [
				{
					id: "legacy-task-1",
					number: 1,
					ts: Date.now(),
					task: "Legacy task 1",
					tokensIn: 100,
					tokensOut: 50,
					totalCost: 0.01,
				},
				{
					id: "legacy-task-2",
					number: 2,
					ts: Date.now(),
					task: "Legacy task 2",
					tokensIn: 200,
					tokensOut: 100,
					totalCost: 0.02,
				},
			]
			mockGlobalState.set("taskHistory", existingHistory)

			await taskHistoryManager.migrateFromGlobalState()

			// Verify files were written
			expect(mockWriteFile).toHaveBeenCalledTimes(2)

			// Verify task index was created
			const taskIndex = mockGlobalState.get("taskHistoryIndex")
			expect(taskIndex).toHaveLength(2)

			// Verify old taskHistory was cleared
			expect(mockGlobalState.get("taskHistory")).toBeUndefined()
		})

		it("should handle empty or missing task history gracefully", async () => {
			const mockWriteFile = vi.mocked(vscode.workspace.fs.writeFile)

			// No existing task history
			await taskHistoryManager.migrateFromGlobalState()

			expect(mockWriteFile).not.toHaveBeenCalled()
		})
	})

	describe("toggleTaskFavorite", () => {
		it("should toggle favorite status in index", async () => {
			const taskIndex: TaskHistoryIndex[] = [
				{
					id: "test-task-1",
					ts: Date.now(),
					task: "Test task",
					totalCost: 0.01,
					isFavorited: false,
				},
			]
			mockGlobalState.set("taskHistoryIndex", taskIndex)

			await taskHistoryManager.toggleTaskFavorite("test-task-1")

			const updatedIndex = mockGlobalState.get("taskHistoryIndex")
			expect(updatedIndex[0].isFavorited).toBe(true)
		})
	})
})
