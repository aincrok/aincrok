// aincrok_change - Replaced spawning with VS Code language services
import * as vscode from "vscode"
import { VSCodeLanguageService } from "./VSCodeLanguageService"

export interface LanguageServerConfig {
	enabled: boolean
	initializationOptions?: any
}

/**
 * Manages language services using VS Code's built-in providers
 * Instead of spawning external language servers, we leverage VS Code's existing language features
 */
export class LSPClientManager {
	private static instance: LSPClientManager | null = null
	private configurations: Map<string, LanguageServerConfig> = new Map()
	private context: vscode.ExtensionContext
	private isInitialized = false

	private constructor(context: vscode.ExtensionContext) {
		this.context = context
		this.initializeConfigurations()
	}

	public static getInstance(context?: vscode.ExtensionContext): LSPClientManager {
		if (!LSPClientManager.instance) {
			if (!context) {
				throw new Error("Context is required for first initialization")
			}
			LSPClientManager.instance = new LSPClientManager(context)
		}
		return LSPClientManager.instance
	}

	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		console.log("[Aincrok] Initializing VS Code language services...")

		// No need to spawn servers - VS Code already has language services
		// Just verify they're available
		await this.verifyLanguageServices()

		this.isInitialized = true
		console.log("[Aincrok] VS Code language services ready")
	}

	private initializeConfigurations(): void {
		// Configure which language services we want to use
		// VS Code handles the actual language servers
		this.configurations.set("typescript", {
			enabled: true,
		})

		this.configurations.set("javascript", {
			enabled: true,
		})

		this.configurations.set("python", {
			enabled: true,
		})

		this.configurations.set("rust", {
			enabled: true,
		})

		this.configurations.set("go", {
			enabled: true,
		})

		this.configurations.set("php", {
			enabled: true,
		})

		this.configurations.set("cpp", {
			enabled: true,
		})
	}

	private async verifyLanguageServices(): Promise<void> {
		// Just log which language services are configured
		// VS Code handles the actual availability
		for (const [language, config] of this.configurations) {
			if (config.enabled) {
				console.log(`[Aincrok] ${language} language service configured`)
			}
		}
	}

	/**
	 * Get document symbols for a file
	 */
	public async getDocumentSymbols(uri: vscode.Uri): Promise<vscode.DocumentSymbol[] | undefined> {
		return VSCodeLanguageService.getDocumentSymbols(uri)
	}

	/**
	 * Get definitions for a position
	 */
	public async getDefinitions(
		uri: vscode.Uri,
		position: vscode.Position,
	): Promise<vscode.Location | vscode.Location[] | vscode.LocationLink[] | undefined> {
		return VSCodeLanguageService.getDefinitions(uri, position)
	}

	/**
	 * Get references for a position
	 */
	public async getReferences(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location[] | undefined> {
		return VSCodeLanguageService.getReferences(uri, position)
	}

	/**
	 * Get workspace symbols
	 */
	public async getWorkspaceSymbols(query: string): Promise<vscode.SymbolInformation[] | undefined> {
		return VSCodeLanguageService.getWorkspaceSymbols(query)
	}

	/**
	 * Check if a language is supported
	 */
	public isLanguageSupported(language: string): boolean {
		const config = this.configurations.get(language)
		return config?.enabled ?? false
	}

	/**
	 * Cleanup resources
	 */
	public async dispose(): Promise<void> {
		// No servers to stop - VS Code handles everything
		this.isInitialized = false
		LSPClientManager.instance = null
		console.log("[Aincrok] Language services disposed")
	}

	/**
	 * Restart language services (no-op since VS Code handles them)
	 */
	public async restart(): Promise<void> {
		// VS Code handles language server lifecycle
		console.log("[Aincrok] Language services restart requested (handled by VS Code)")
	}
}
