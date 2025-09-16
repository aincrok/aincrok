// aincrok_change - new file
// TaskHistoryManager: Manages task history storage using file system instead of globalState
// This fixes the large extension state warning by moving task data to disk

import * as vscode from "vscode"
import * as path from "path"
import { HistoryItem } from "@roo-code/types"
import { ClineMessage } from "@roo-code/types"

/**
 * Lightweight task metadata stored in globalState
 */
export interface TaskHistoryIndex {
	id: string
	ts: number
	task: string // First 100 chars only for preview
	totalCost: number
	isFavorited?: boolean
	workspace?: string
	size?: number
}

/**
 * Full task data stored in file system
 */
export interface TaskHistoryFile {
	id: string
	metadata: HistoryItem
	messages?: ClineMessage[]
	createdAt: number
	updatedAt: number
}

/**
 * Configuration for task history management
 */
export interface TaskHistoryConfig {
	maxTasks: number
	retentionDays: number
	autoCleanup: boolean
}

/**
 * Manages task history storage using VS Code's recommended globalStorageUri approach
 * instead of storing large data in globalState which causes performance issues
 */
export class TaskHistoryManager {
	private static instance: TaskHistoryManager | null = null
	private cache = new Map<string, TaskHistoryFile>()
	private cacheAccessOrder: string[] = []
	private readonly maxCacheSize = 10
	private storageUri: vscode.Uri
	private tasksDir: vscode.Uri
	private config: TaskHistoryConfig

	private constructor(
		private context: vscode.ExtensionContext,
		config?: TaskHistoryConfig,
	) {
		this.storageUri = context.globalStorageUri
		this.tasksDir = vscode.Uri.joinPath(this.storageUri, "tasks")

		// Load configuration from VS Code settings if not provided
		if (config) {
			this.config = config
		} else {
			const vsConfig = vscode.workspace.getConfiguration("aincrok.taskHistory")
			this.config = {
				maxTasks: vsConfig.get("maxTasks", 100),
				retentionDays: vsConfig.get("retentionDays", 30),
				autoCleanup: vsConfig.get("autoCleanup", true),
			}
		}
	}

	public static getInstance(context?: vscode.ExtensionContext, config?: TaskHistoryConfig): TaskHistoryManager {
		if (!TaskHistoryManager.instance) {
			if (!context) {
				throw new Error("Context required for first initialization")
			}
			TaskHistoryManager.instance = new TaskHistoryManager(context, config)
		}
		return TaskHistoryManager.instance
	}

	/**
	 * Initialize storage directories
	 */
	public async initialize(): Promise<void> {
		try {
			// Ensure storage directory exists
			await vscode.workspace.fs.stat(this.storageUri)
		} catch {
			await vscode.workspace.fs.createDirectory(this.storageUri)
		}

		try {
			// Ensure tasks directory exists
			await vscode.workspace.fs.stat(this.tasksDir)
		} catch {
			await vscode.workspace.fs.createDirectory(this.tasksDir)
		}

		console.log("[TaskHistoryManager] Initialized storage at:", this.storageUri.fsPath)
	}

	/**
	 * Save a task to file system and update metadata index
	 */
	public async saveTask(item: HistoryItem, messages?: ClineMessage[]): Promise<void> {
		await this.initialize()

		const taskFile: TaskHistoryFile = {
			id: item.id,
			metadata: item,
			messages,
			createdAt: item.ts,
			updatedAt: Date.now(),
		}

		// Save to file system
		const taskFilePath = vscode.Uri.joinPath(this.tasksDir, `${item.id}.json`)
		const taskData = JSON.stringify(taskFile, null, 2)
		await vscode.workspace.fs.writeFile(taskFilePath, Buffer.from(taskData, "utf8"))

		// Update cache
		this.updateCache(item.id, taskFile)

		// Update metadata index in globalState
		await this.updateTaskIndex(item)

		console.log("[TaskHistoryManager] Saved task:", item.id)
	}

	/**
	 * Get full task data from file system
	 */
	public async getTask(id: string): Promise<TaskHistoryFile | null> {
		// Check cache first
		if (this.cache.has(id)) {
			this.updateCacheAccess(id)
			return this.cache.get(id)!
		}

		try {
			const taskFilePath = vscode.Uri.joinPath(this.tasksDir, `${id}.json`)
			const taskData = await vscode.workspace.fs.readFile(taskFilePath)
			const taskFile: TaskHistoryFile = JSON.parse(Buffer.from(taskData).toString("utf8"))

			// Update cache
			this.updateCache(id, taskFile)

			return taskFile
		} catch (error) {
			console.error("[TaskHistoryManager] Failed to load task:", id, error)
			return null
		}
	}

	/**
	 * Get lightweight metadata for all tasks from globalState
	 */
	public async getAllTasksMetadata(): Promise<TaskHistoryIndex[]> {
		const taskIndex = this.context.globalState.get<TaskHistoryIndex[]>("taskHistoryIndex") || []
		return taskIndex.sort((a, b) => b.ts - a.ts)
	}

	/**
	 * Get HistoryItem array for backward compatibility
	 */
	public async getAllTasksHistoryItems(): Promise<HistoryItem[]> {
		const metadata = await this.getAllTasksMetadata()
		return metadata.map((index) => ({
			id: index.id,
			number: 0, // Will be set by caller if needed
			ts: index.ts,
			task: index.task,
			tokensIn: 0, // These will be loaded on demand
			tokensOut: 0,
			totalCost: index.totalCost,
			workspace: index.workspace,
			isFavorited: index.isFavorited,
		}))
	}

	/**
	 * Delete a task from both file system and metadata index
	 */
	public async deleteTask(id: string): Promise<void> {
		try {
			// Remove from file system
			const taskFilePath = vscode.Uri.joinPath(this.tasksDir, `${id}.json`)
			await vscode.workspace.fs.delete(taskFilePath)

			// Remove from cache
			this.cache.delete(id)
			this.cacheAccessOrder = this.cacheAccessOrder.filter((cachedId) => cachedId !== id)

			// Remove from metadata index
			const taskIndex = this.context.globalState.get<TaskHistoryIndex[]>("taskHistoryIndex") || []
			const updatedIndex = taskIndex.filter((item) => item.id !== id)
			await this.context.globalState.update("taskHistoryIndex", updatedIndex)

			console.log("[TaskHistoryManager] Deleted task:", id)
		} catch (error) {
			console.error("[TaskHistoryManager] Failed to delete task:", id, error)
			throw error
		}
	}

	/**
	 * Delete multiple tasks efficiently
	 */
	public async deleteMultipleTasks(ids: string[]): Promise<void> {
		for (const id of ids) {
			try {
				// Remove from file system
				const taskFilePath = vscode.Uri.joinPath(this.tasksDir, `${id}.json`)
				await vscode.workspace.fs.delete(taskFilePath)

				// Remove from cache
				this.cache.delete(id)
				this.cacheAccessOrder = this.cacheAccessOrder.filter((cachedId) => cachedId !== id)
			} catch (error) {
				console.error("[TaskHistoryManager] Failed to delete task file:", id, error)
			}
		}

		// Update metadata index in single operation
		const taskIndex = this.context.globalState.get<TaskHistoryIndex[]>("taskHistoryIndex") || []
		const updatedIndex = taskIndex.filter((item) => !ids.includes(item.id))
		await this.context.globalState.update("taskHistoryIndex", updatedIndex)

		console.log("[TaskHistoryManager] Deleted multiple tasks:", ids.length)
	}

	/**
	 * Update task favorite status
	 */
	public async toggleTaskFavorite(id: string): Promise<void> {
		// Update metadata index
		const taskIndex = this.context.globalState.get<TaskHistoryIndex[]>("taskHistoryIndex") || []
		const updatedIndex = taskIndex.map((item) =>
			item.id === id ? { ...item, isFavorited: !item.isFavorited } : item,
		)
		await this.context.globalState.update("taskHistoryIndex", updatedIndex)

		// Update full task data if in cache or on disk
		const taskFile = await this.getTask(id)
		if (taskFile) {
			taskFile.metadata.isFavorited = !taskFile.metadata.isFavorited
			taskFile.updatedAt = Date.now()
			await this.saveTask(taskFile.metadata, taskFile.messages)
		}
	}

	/**
	 * Migrate existing task history from globalState to file system
	 */
	public async migrateFromGlobalState(): Promise<void> {
		const existingHistory = this.context.globalState.get<HistoryItem[]>("taskHistory")
		if (!existingHistory || existingHistory.length === 0) {
			console.log("[TaskHistoryManager] No existing task history to migrate")
			return
		}

		console.log("[TaskHistoryManager] Starting migration of", existingHistory.length, "tasks")

		let migratedCount = 0
		let errorCount = 0

		for (const item of existingHistory) {
			try {
				await this.saveTask(item)
				migratedCount++
			} catch (error) {
				console.error("[TaskHistoryManager] Failed to migrate task:", item.id, error)
				errorCount++
			}
		}

		if (errorCount === 0) {
			// Clear old taskHistory from globalState
			await this.context.globalState.update("taskHistory", undefined)
			console.log("[TaskHistoryManager] Migration completed successfully. Migrated", migratedCount, "tasks")
		} else {
			console.warn(
				"[TaskHistoryManager] Migration completed with errors. Migrated:",
				migratedCount,
				"Errors:",
				errorCount,
			)
		}
	}

	/**
	 * Cleanup old tasks based on retention policy
	 */
	public async cleanup(): Promise<void> {
		if (!this.config.autoCleanup) {
			return
		}

		const allMetadata = await this.getAllTasksMetadata()
		const now = Date.now()
		const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000

		// Find tasks to delete (old and exceeding maxTasks)
		let tasksToDelete: string[] = []

		// Delete by age
		const expiredTasks = allMetadata.filter((task) => {
			return !task.isFavorited && now - task.ts > retentionMs
		})
		tasksToDelete = expiredTasks.map((task) => task.id)

		// Delete excess tasks (keep maxTasks most recent)
		if (allMetadata.length > this.config.maxTasks) {
			const sortedTasks = allMetadata
				.filter((task) => !task.isFavorited) // Never delete favorites
				.sort((a, b) => b.ts - a.ts)

			const excessTasks = sortedTasks.slice(this.config.maxTasks)
			tasksToDelete.push(...excessTasks.map((task) => task.id))
		}

		// Remove duplicates
		tasksToDelete = [...new Set(tasksToDelete)]

		if (tasksToDelete.length > 0) {
			await this.deleteMultipleTasks(tasksToDelete)
			console.log("[TaskHistoryManager] Cleaned up", tasksToDelete.length, "old tasks")
		}
	}

	/**
	 * Get storage statistics
	 */
	public async getStorageStats(): Promise<{
		taskCount: number
		totalSizeBytes: number
		cacheHitRate: number
	}> {
		const metadata = await this.getAllTasksMetadata()
		let totalSize = 0

		try {
			const taskFiles = await vscode.workspace.fs.readDirectory(this.tasksDir)
			for (const [filename] of taskFiles) {
				if (filename.endsWith(".json")) {
					const filePath = vscode.Uri.joinPath(this.tasksDir, filename)
					const stat = await vscode.workspace.fs.stat(filePath)
					totalSize += stat.size
				}
			}
		} catch (error) {
			console.error("[TaskHistoryManager] Failed to calculate storage size:", error)
		}

		return {
			taskCount: metadata.length,
			totalSizeBytes: totalSize,
			cacheHitRate: this.cache.size > 0 ? this.cache.size / metadata.length : 0,
		}
	}

	/**
	 * Update task metadata index in globalState
	 */
	private async updateTaskIndex(item: HistoryItem): Promise<void> {
		const taskIndex = this.context.globalState.get<TaskHistoryIndex[]>("taskHistoryIndex") || []
		const existingIndex = taskIndex.findIndex((index) => index.id === item.id)

		const newIndex: TaskHistoryIndex = {
			id: item.id,
			ts: item.ts,
			task: item.task.substring(0, 100), // Truncate for storage efficiency
			totalCost: item.totalCost,
			isFavorited: item.isFavorited,
			workspace: item.workspace,
		}

		if (existingIndex !== -1) {
			taskIndex[existingIndex] = newIndex
		} else {
			taskIndex.push(newIndex)
		}

		await this.context.globalState.update("taskHistoryIndex", taskIndex)
	}

	/**
	 * Update LRU cache
	 */
	private updateCache(id: string, taskFile: TaskHistoryFile): void {
		// Remove if already exists
		if (this.cache.has(id)) {
			this.cacheAccessOrder = this.cacheAccessOrder.filter((cachedId) => cachedId !== id)
		}

		// Add to cache
		this.cache.set(id, taskFile)
		this.cacheAccessOrder.push(id)

		// Evict oldest if cache is full
		if (this.cache.size > this.maxCacheSize) {
			const oldestId = this.cacheAccessOrder.shift()!
			this.cache.delete(oldestId)
		}
	}

	/**
	 * Update cache access order for LRU
	 */
	private updateCacheAccess(id: string): void {
		this.cacheAccessOrder = this.cacheAccessOrder.filter((cachedId) => cachedId !== id)
		this.cacheAccessOrder.push(id)
	}
}
