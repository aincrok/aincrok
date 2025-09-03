// aincrok_change - new file
// Custom LSP Client Manager for Aincrok VS Code Extension
// Replaces multilspy with TypeScript-native VS Code Language Client API

import * as vscode from "vscode"
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node"
import { LanguageServerConfig } from "./types"

/**
 * Manages multiple language server clients for different programming languages
 * Uses VS Code's native LanguageClient API instead of multilspy (Python-only library)
 */
export class LSPClientManager {
	private static instance: LSPClientManager | undefined
	private clients = new Map<string, LanguageClient>()
	private configurations = new Map<string, LanguageServerConfig>()
	private isInitialized = false

	private constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Get or create the singleton instance
	 */
	static getInstance(context: vscode.ExtensionContext): LSPClientManager {
		if (!LSPClientManager.instance) {
			LSPClientManager.instance = new LSPClientManager(context)
		}
		return LSPClientManager.instance
	}

	/**
	 * Initialize the LSP client manager with language server configurations
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		await this.setupLanguageServerConfigurations()
		await this.startLanguageServers()

		this.isInitialized = true
		console.log("[Aincrok] LSP Client Manager initialized successfully")
	}

	/**
	 * Get a language client for a specific language
	 */
	getClient(language: string): LanguageClient | undefined {
		return this.clients.get(language)
	}

	/**
	 * Check if a language server is available for a given language
	 */
	isLanguageSupported(language: string): boolean {
		const client = this.clients.get(language)
		return client !== undefined && client.state === 2 // State.Running
	}

	/**
	 * Get all active language clients
	 */
	getAllClients(): Map<string, LanguageClient> {
		return new Map(this.clients)
	}

	/**
	 * Stop all language servers
	 */
	async dispose(): Promise<void> {
		const stopPromises: Promise<void>[] = []

		for (const [language, client] of this.clients) {
			console.log(`[Aincrok] Stopping ${language} language server`)
			stopPromises.push(client.stop())
		}

		await Promise.allSettled(stopPromises)
		this.clients.clear()
		this.isInitialized = false
	}

	/**
	 * Restart a specific language server
	 */
	async restartLanguageServer(language: string): Promise<boolean> {
		const client = this.clients.get(language)
		if (!client) {
			console.warn(`[Aincrok] No client found for language: ${language}`)
			return false
		}

		try {
			await client.stop()
			this.clients.delete(language)

			const config = this.configurations.get(language)
			if (config && config.enabled) {
				await this.startLanguageServer(language, config)
				return true
			}
		} catch (error) {
			console.error(`[Aincrok] Error restarting ${language} language server:`, error)
		}

		return false
	}

	/**
	 * Get language server status information
	 */
	getServerStatus(): Record<string, { state: string; enabled: boolean }> {
		const status: Record<string, { state: string; enabled: boolean }> = {}

		for (const [language, config] of this.configurations) {
			const client = this.clients.get(language)
			const stateNames = ["Stopped", "Starting", "Running", "Stopping"]
			status[language] = {
				state: client ? stateNames[client.state] || "Unknown" : "Not Started",
				enabled: config.enabled,
			}
		}

		return status
	}

	// Private methods

	private async setupLanguageServerConfigurations(): Promise<void> {
		// Configure TypeScript/JavaScript server
		this.configurations.set("typescript", {
			serverPath: "typescript-language-server",
			args: ["--stdio"],
			enabled: true,
			initializationOptions: {
				preferences: {
					includeInlayParameterNameHints: "all",
					includeInlayParameterNameHintsWhenArgumentMatchesName: false,
					includeInlayFunctionParameterTypeHints: true,
					includeInlayVariableTypeHints: true,
					includeInlayPropertyDeclarationTypeHints: true,
					includeInlayFunctionLikeReturnTypeHints: true,
				},
			},
		})

		// Configure Python server (if available)
		this.configurations.set("python", {
			serverPath: "pylsp",
			args: [],
			enabled: await this.isServerAvailable("pylsp"),
			initializationOptions: {
				settings: {
					pylsp: {
						plugins: {
							pycodestyle: { enabled: true },
							pyflakes: { enabled: true },
							autopep8: { enabled: true },
						},
					},
				},
			},
		})

		// Configure Rust server (if available)
		this.configurations.set("rust", {
			serverPath: "rust-analyzer",
			args: [],
			enabled: await this.isServerAvailable("rust-analyzer"),
			initializationOptions: {
				checkOnSave: {
					command: "clippy",
				},
			},
		})

		// Configure Go server (if available)
		this.configurations.set("go", {
			serverPath: "gopls",
			args: [],
			enabled: await this.isServerAvailable("gopls"),
			initializationOptions: {},
		})

		// Configure PHP server (if available)
		this.configurations.set("php", {
			serverPath: "intelephense",
			args: ["--stdio"],
			enabled: await this.isServerAvailable("intelephense"),
			initializationOptions: {},
		})

		// Configure C++ server (if available)
		this.configurations.set("cpp", {
			serverPath: "clangd",
			args: [],
			enabled: await this.isServerAvailable("clangd"),
			initializationOptions: {},
		})
	}

	private async startLanguageServers(): Promise<void> {
		const startPromises: Promise<void>[] = []

		for (const [language, config] of this.configurations) {
			if (config.enabled) {
				startPromises.push(this.startLanguageServer(language, config))
			}
		}

		await Promise.allSettled(startPromises)
	}

	private async startLanguageServer(language: string, config: LanguageServerConfig): Promise<void> {
		try {
			const serverOptions: ServerOptions = {
				command: config.serverPath,
				args: config.args || [],
			}

			const clientOptions: LanguageClientOptions = {
				documentSelector: this.getDocumentSelector(language) as any, // VS Code compatibility workaround
				synchronize: {
					fileEvents: vscode.workspace.createFileSystemWatcher(
						`**/*.{${this.getFileExtensions(language).join(",")}}`,
					),
				},
				initializationOptions: config.initializationOptions || {},
			}

			const client = new LanguageClient(
				`${language}-lsp`,
				`${language.charAt(0).toUpperCase() + language.slice(1)} Language Server`,
				serverOptions,
				clientOptions,
			)

			// Start the client and register for disposal
			await client.start()
			this.context.subscriptions.push(client)
			this.clients.set(language, client)

			console.log(`[Aincrok] ${language} language server started successfully`)
		} catch (error) {
			console.error(`[Aincrok] Failed to start ${language} language server:`, error)
			// Mark as disabled if failed to start
			const config = this.configurations.get(language)
			if (config) {
				config.enabled = false
			}
		}
	}

	private async isServerAvailable(serverCommand: string): Promise<boolean> {
		try {
			// Try to execute the command to see if it's available
			const { exec } = require("child_process")
			return new Promise((resolve) => {
				exec(`which ${serverCommand}`, (error: any) => {
					resolve(!error)
				})
			})
		} catch {
			return false
		}
	}

	private getDocumentSelector(language: string): vscode.DocumentFilter[] {
		const selectors: Record<string, vscode.DocumentFilter[]> = {
			typescript: [
				{ scheme: "file", language: "typescript" },
				{ scheme: "file", language: "typescriptreact" },
				{ scheme: "file", language: "javascript" },
				{ scheme: "file", language: "javascriptreact" },
			],
			python: [{ scheme: "file", language: "python" }],
			rust: [{ scheme: "file", language: "rust" }],
			go: [{ scheme: "file", language: "go" }],
			php: [{ scheme: "file", language: "php" }],
			cpp: [
				{ scheme: "file", language: "cpp" },
				{ scheme: "file", language: "c" },
			],
		}

		return selectors[language] || []
	}

	private getFileExtensions(language: string): string[] {
		const extensions: Record<string, string[]> = {
			typescript: ["ts", "tsx", "js", "jsx"],
			python: ["py"],
			rust: ["rs"],
			go: ["go"],
			php: ["php"],
			cpp: ["cpp", "c", "h", "hpp"],
		}

		return extensions[language] || []
	}
}
