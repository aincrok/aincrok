import * as vscode from "vscode"
import * as dotenvx from "@dotenvx/dotenvx"
import * as path from "path"

// Load environment variables from .env file
try {
	// Specify path to .env file in the project root directory
	const envPath = path.join(__dirname, "..", ".env")
	dotenvx.config({ path: envPath })
} catch (e) {
	// Silently handle environment loading errors
	console.warn("Failed to load environment variables:", e)
}

// @roo-code/cloud removed for aincrok fork
import { TelemetryService, PostHogTelemetryClient } from "@roo-code/telemetry"

import "./utils/path" // Necessary to have access to String.prototype.toPosix.
import { createOutputChannelLogger, createDualLogger } from "./utils/outputChannelLogger"

import { Package } from "./shared/package"
import { formatLanguage } from "./shared/language"
import { ContextProxy } from "./core/config/ContextProxy"
import { ClineProvider } from "./core/webview/ClineProvider"
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import { TerminalRegistry } from "./integrations/terminal/TerminalRegistry"
import { McpServerManager } from "./services/mcp/McpServerManager"
import { CodeIndexManager } from "./services/code-index/manager"
import { registerCommitMessageProvider } from "./services/commit-message"
import { MdmService } from "./services/mdm/MdmService"
import { migrateSettings } from "./utils/migrateSettings"
import { checkAndRunAutoLaunchingTask as checkAndRunAutoLaunchingTask } from "./utils/autoLaunchingTask"
import { autoImportSettings } from "./utils/autoImportSettings"
import { isRemoteControlEnabled } from "./utils/remoteControl"
import { API } from "./extension/api"

import {
	handleUri,
	registerCommands,
	registerCodeActions,
	registerTerminalActions,
	registerMemoryCommands, // aincrok_change
	CodeActionProvider,
} from "./activate"
import { initializeI18n } from "./i18n"
import { registerGhostProvider } from "./services/ghost" // kilocode_change
import { TerminalWelcomeService } from "./services/terminal-welcome/TerminalWelcomeService" // kilocode_change

/**
 * Built using https://github.com/microsoft/vscode-webview-ui-toolkit
 *
 * Inspired by:
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra
 */

let outputChannel: vscode.OutputChannel
let extensionContext: vscode.ExtensionContext

// This method is called when your extension is activated.
// Your extension is activated the very first time the command is executed.
export async function activate(context: vscode.ExtensionContext) {
	try {
		console.log("[DEBUG] Extension activation starting...")
		extensionContext = context
		outputChannel = vscode.window.createOutputChannel("Aincrok")
		context.subscriptions.push(outputChannel)
		console.log("[DEBUG] Output channel created")
		outputChannel.appendLine(`${Package.name} extension activated - ${JSON.stringify(Package)}`)

		console.log("[DEBUG] Starting settings migration...")
		// Migrate old settings to new
		await migrateSettings(context, outputChannel)
		console.log("[DEBUG] Settings migration completed")

		console.log("[DEBUG] Initializing telemetry service...")
		// Initialize telemetry service.
		const telemetryService = TelemetryService.createInstance()
		console.log("[DEBUG] Telemetry service created")

		// aincrok_change start - Skip PostHog in test environment
		if (!isTestEnvironment()) {
			try {
				console.log("[DEBUG] Registering PostHog client...")
				telemetryService.register(new PostHogTelemetryClient())
				console.log("[DEBUG] PostHog client registered")
			} catch (error) {
				console.warn("Failed to register PostHogTelemetryClient:", error)
			}
		} else {
			console.log("[DEBUG] Skipping PostHog registration in test environment")
		}
		// aincrok_change end

		// Create logger for cloud services.
		const cloudLogger = createDualLogger(createOutputChannelLogger(outputChannel))

		// kilocode_change start: no Roo cloud service
		// Initialize Roo Code Cloud service.
		// const cloudService = await CloudService.createInstance(context, cloudLogger)

		// try {
		// 	if (cloudService.telemetryClient) {
		// 		TelemetryService.instance.register(cloudService.telemetryClient)
		// 	}
		// } catch (error) {
		// 	outputChannel.appendLine(
		// 		`[CloudService] Failed to register TelemetryClient: ${error instanceof Error ? error.message : String(error)}`,
		// 	)
		// }

		// const postStateListener = () => {
		// 	ClineProvider.getVisibleInstance()?.postStateToWebview()
		// }

		// cloudService.on("auth-state-changed", postStateListener)
		// cloudService.on("user-info", postStateListener)
		// cloudService.on("settings-updated", postStateListener)

		// // Add to subscriptions for proper cleanup on deactivate
		// context.subscriptions.push(cloudService)
		// kilocode_change end

		// Initialize MDM service
		const mdmService = await MdmService.createInstance(cloudLogger)

		// Initialize i18n for internationalization support
		initializeI18n(context.globalState.get("language") ?? formatLanguage(vscode.env.language))

		// Initialize terminal shell execution handlers.
		TerminalRegistry.initialize()

		// Get default commands from configuration.
		const defaultCommands = vscode.workspace.getConfiguration(Package.name).get<string[]>("allowedCommands") || []

		// Initialize global state if not already set.
		if (!context.globalState.get("allowedCommands")) {
			context.globalState.update("allowedCommands", defaultCommands)
		}

		// kilocode_change start
		// aincrok_change - Skip telemetry in test environment
		if (!context.globalState.get("firstInstallCompleted") && !isTestEnvironment()) {
			await context.globalState.update("telemetrySetting", "enabled")
		}
		// kilocode_change end

		const contextProxy = await ContextProxy.getInstance(context)

		// Initialize code index managers for all workspace folders
		const codeIndexManagers: CodeIndexManager[] = []
		if (vscode.workspace.workspaceFolders) {
			for (const folder of vscode.workspace.workspaceFolders) {
				const manager = CodeIndexManager.getInstance(context, folder.uri.fsPath)
				if (manager) {
					codeIndexManagers.push(manager)
					try {
						await manager.initialize(contextProxy)
					} catch (error) {
						outputChannel.appendLine(
							`[CodeIndexManager] Error during background CodeIndexManager configuration/indexing for ${folder.uri.fsPath}: ${error.message || error}`,
						)
					}
					context.subscriptions.push(manager)
				}
			}
		}

		// kilocode_change start - CloudService initialization disabled for E2E debugging
		// Initialize Roo Code Cloud service.
		// const cloudService = await CloudService.createInstance(context, cloudLogger)

		// try {
		// 	if (cloudService.telemetryClient) {
		// 		// TelemetryService.instance.register(cloudService.telemetryClient) kilocode_change
		// 	}
		// } catch (error) {
		// 	outputChannel.appendLine(
		// 		`[CloudService] Failed to register TelemetryClient: ${error instanceof Error ? error.message : String(error)}`,
		// 	)
		// }

		// const postStateListener = () => ClineProvider.getVisibleInstance()?.postStateToWebview()

		// cloudService.on("auth-state-changed", postStateListener)
		// cloudService.on("settings-updated", postStateListener)

		// cloudService.on("user-info", async ({ userInfo }) => {
		// 	postStateListener()

		// 	const bridgeConfig = await cloudService.cloudAPI?.bridgeConfig().catch(() => undefined)

		// 	if (!bridgeConfig) {
		// 		outputChannel.appendLine("[CloudService] Failed to get bridge config")
		// 		return
		// 	}

		// 	ExtensionBridgeService.handleRemoteControlState(
		// 		userInfo,
		// 		contextProxy.getValue("remoteControlEnabled"),
		// 		{ ...bridgeConfig, provider: provider as any, sessionId: vscode.env.sessionId },
		// 		(message: string) => outputChannel.appendLine(message),
		// 	)
		// })

		// // Add to subscriptions for proper cleanup on deactivate.
		// context.subscriptions.push(cloudService)
		// kilocode_change end

		const provider = new ClineProvider(context, outputChannel, "sidebar", contextProxy, mdmService)
		TelemetryService.instance.setProvider(provider)

		// aincrok_change start - Add validation before registering webview provider
		try {
			console.log("[DEBUG] Registering webview provider with ID:", ClineProvider.sideBarId)

			// Validate provider is properly initialized
			if (!provider) {
				throw new Error("ClineProvider instance is null or undefined")
			}

			// Register the webview provider
			const registration = vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, provider, {
				webviewOptions: { retainContextWhenHidden: true },
			})

			if (!registration) {
				throw new Error("Failed to register webview provider - registration returned null")
			}

			context.subscriptions.push(registration)
			console.log("[DEBUG] Webview provider registered successfully")
			outputChannel.appendLine(`Webview provider registered with ID: ${ClineProvider.sideBarId}`)
		} catch (error) {
			const errorMessage = `Failed to register webview provider: ${error instanceof Error ? error.message : String(error)}`
			console.error("[DEBUG] " + errorMessage)
			outputChannel.appendLine(errorMessage)
			// Continue activation - the extension can still work via commands even if sidebar fails
		}
		// aincrok_change end

		// kilocode_change start
		// aincrok_change - Temporarily disable first-install logic for E2E testing
		if (!context.globalState.get("firstInstallCompleted")) {
			outputChannel.appendLine("First installation detected, marking as completed for E2E testing")
			await context.globalState.update("firstInstallCompleted", true)
		}
		// kilocode_change end

		// Auto-import configuration if specified in settings
		try {
			await autoImportSettings(outputChannel, {
				providerSettingsManager: provider.providerSettingsManager,
				contextProxy: provider.contextProxy,
				customModesManager: provider.customModesManager,
			})
		} catch (error) {
			outputChannel.appendLine(
				`[AutoImport] Error during auto-import: ${error instanceof Error ? error.message : String(error)}`,
			)
		}

		registerCommands({ context, outputChannel, provider })

		/**
		 * We use the text document content provider API to show the left side for diff
		 * view by creating a virtual document for the original content. This makes it
		 * readonly so users know to edit the right side if they want to keep their changes.
		 *
		 * This API allows you to create readonly documents in VSCode from arbitrary
		 * sources, and works by claiming an uri-scheme for which your provider then
		 * returns text contents. The scheme must be provided when registering a
		 * provider and cannot change afterwards.
		 *
		 * Note how the provider doesn't create uris for virtual documents - its role
		 * is to provide contents given such an uri. In return, content providers are
		 * wired into the open document logic so that providers are always considered.
		 *
		 * https://code.visualstudio.com/api/extension-guides/virtual-documents
		 */
		const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
			provideTextDocumentContent(uri: vscode.Uri): string {
				return Buffer.from(uri.query, "base64").toString("utf-8")
			}
		})()

		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider),
		)

		context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

		// Register code actions provider.
		context.subscriptions.push(
			vscode.languages.registerCodeActionsProvider({ pattern: "**/*" }, new CodeActionProvider(), {
				providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds,
			}),
		)

		registerGhostProvider(context, provider) // kilocode_change
		registerCommitMessageProvider(context, outputChannel) // kilocode_change
		registerCodeActions(context)
		registerTerminalActions(context)
		registerMemoryCommands(context) // aincrok_change

		// Allows other extensions to activate once Aincrok is ready.
		vscode.commands.executeCommand(`${Package.name}.activationCompleted`)

		// Implements the `RooCodeAPI` interface.
		const socketPath = process.env.KILO_IPC_SOCKET_PATH ?? process.env.ROO_CODE_IPC_SOCKET_PATH // kilocode_change
		const enableLogging = typeof socketPath === "string"

		// Watch the core files and automatically reload the extension host.
		if (process.env.NODE_ENV === "development") {
			const watchPaths = [
				{ path: context.extensionPath, pattern: "**/*.ts" },
				{ path: path.join(context.extensionPath, "../packages/types"), pattern: "**/*.ts" },
				{ path: path.join(context.extensionPath, "../packages/telemetry"), pattern: "**/*.ts" },
			]

			console.log(
				`♻️♻️♻️ Core auto-reloading: Watching for changes in ${watchPaths.map(({ path }) => path).join(", ")}`,
			)

			// Create a debounced reload function to prevent excessive reloads
			let reloadTimeout: NodeJS.Timeout | undefined
			const DEBOUNCE_DELAY = 1_000

			const debouncedReload = (uri: vscode.Uri) => {
				if (reloadTimeout) {
					clearTimeout(reloadTimeout)
				}

				console.log(`♻️ ${uri.fsPath} changed; scheduling reload...`)

				reloadTimeout = setTimeout(() => {
					console.log(`♻️ Reloading host after debounce delay...`)
					vscode.commands.executeCommand("workbench.action.reloadWindow")
				}, DEBOUNCE_DELAY)
			}

			watchPaths.forEach(({ path: watchPath, pattern }) => {
				const relPattern = new vscode.RelativePattern(vscode.Uri.file(watchPath), pattern)
				const watcher = vscode.workspace.createFileSystemWatcher(relPattern, false, false, false)

				// Listen to all change types to ensure symlinked file updates trigger reloads.
				watcher.onDidChange(debouncedReload)
				watcher.onDidCreate(debouncedReload)
				watcher.onDidDelete(debouncedReload)

				context.subscriptions.push(watcher)
			})

			// Clean up the timeout on deactivation
			context.subscriptions.push({
				dispose: () => {
					if (reloadTimeout) {
						clearTimeout(reloadTimeout)
					}
				},
			})
		}

		console.log("[DEBUG] Running auto-launching task...")
		await checkAndRunAutoLaunchingTask(context) // kilocode_change
		console.log("[DEBUG] Auto-launching task completed")

		console.log("[DEBUG] Creating API...")
		const api = new API(outputChannel, provider, socketPath, enableLogging)
		console.log("[DEBUG] Extension activation completed successfully!")
		return api
	} catch (error) {
		const errorMessage = `Extension activation failed: ${error instanceof Error ? error.message : String(error)}`
		console.error("[DEBUG] Extension activation failed:", errorMessage)
		console.error("[DEBUG] Error stack:", error)
		if (outputChannel) {
			outputChannel.appendLine(errorMessage)
			outputChannel.show()
		}
		vscode.window.showErrorMessage(`Aincrok extension failed to activate: ${errorMessage}`)
		throw error
	}
}

// aincrok_change start - Test mode detection helper
export function isTestEnvironment(): boolean {
	return (
		process.env.IS_TEST_ENVIRONMENT === "true" ||
		process.env.VSCODE_TEST_VERSION !== undefined ||
		process.env.TEST_MODE === "true"
	)
}
// aincrok_change end

// This method is called when your extension is deactivated.
export async function deactivate() {
	outputChannel.appendLine(`${Package.name} extension deactivated`)

	// ExtensionBridgeService removed for aincrok fork

	await McpServerManager.cleanup(extensionContext)
	TelemetryService.instance.shutdown()
	TerminalRegistry.cleanup()
}
