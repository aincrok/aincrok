import { z } from "zod"

import {
	type ProviderSettings,
	type PromptComponent,
	type ModeConfig,
	type InstallMarketplaceItemOptions,
	type MarketplaceItem,
	marketplaceItemSchema,
	CommitRange, // kilocode_change
} from "@roo-code/types"
// aincrok_change: CloudService removed, using type stub
type ShareVisibility = any

import { Mode } from "./modes"

export type ClineAskResponse =
	| "yesButtonClicked"
	| "noButtonClicked"
	| "messageResponse"
	| "objectResponse"
	| "retry_clicked" // kilocode_change: Added retry_clicked for payment required dialog

export type PromptMode = Mode | "enhance"

export type AudioType = "notification" | "celebration" | "progress_loop"

export interface UpdateTodoListPayload {
	todos: any[]
}

export interface WebviewMessage {
	type:
		| "updateTodoList"
		| "deleteMultipleTasksWithIds"
		| "currentApiConfigName"
		| "apiConfiguration"
		| "saveApiConfiguration"
		| "upsertApiConfiguration"
		| "deleteApiConfiguration"
		| "loadApiConfiguration"
		| "loadApiConfigurationById"
		| "renameApiConfiguration"
		| "getListApiConfiguration"
		| "customInstructions"
		| "allowedCommands"
		| "deniedCommands"
		| "alwaysAllowReadOnly"
		| "alwaysAllowReadOnlyOutsideWorkspace"
		| "alwaysAllowWrite"
		| "alwaysAllowWriteOutsideWorkspace"
		| "alwaysAllowWriteProtected"
		| "alwaysAllowExecute"
		| "alwaysAllowFollowupQuestions"
		| "alwaysAllowUpdateTodoList"
		| "followupAutoApproveTimeoutMs"
		| "webviewDidLaunch"
		| "memoryPressure" // aincrok_change - for memory pressure notifications
		| "newTask"
		| "askResponse"
		| "terminalOperation"
		| "clearTask"
		| "didShowAnnouncement"
		| "selectImages"
		| "exportCurrentTask"
		| "shareCurrentTask"
		| "showTaskWithId"
		| "deleteTaskWithId"
		| "exportTaskWithId"
		| "importSettings"
		| "toggleToolAutoApprove"
		| "openExtensionSettings"
		| "openInBrowser"
		| "fetchOpenGraphData"
		| "checkIsImageUrl"
		| "exportSettings"
		| "resetState"
		| "flushRouterModels"
		| "requestRouterModels"
		| "requestOpenAiModels"
		| "requestOllamaModels"
		| "requestLmStudioModels"
		| "requestVsCodeLmModels"
		| "requestHuggingFaceModels"
		| "openImage"
		| "saveImage"
		| "openFile"
		| "openMention"
		| "cancelTask"
		| "updateVSCodeSetting"
		| "getVSCodeSetting"
		| "vsCodeSetting"
		| "alwaysAllowBrowser"
		| "alwaysAllowMcp"
		| "alwaysAllowModeSwitch"
		| "allowedMaxRequests"
		| "allowedMaxCost"
		| "alwaysAllowSubtasks"
		| "alwaysAllowUpdateTodoList"
		| "autoCondenseContext"
		| "autoCondenseContextPercent"
		| "condensingApiConfigId"
		| "updateCondensingPrompt"
		| "playSound"
		| "playTts"
		| "stopTts"
		| "soundEnabled"
		| "ttsEnabled"
		| "ttsSpeed"
		| "soundVolume"
		| "diffEnabled"
		| "enableCheckpoints"
		| "browserViewportSize"
		| "screenshotQuality"
		| "remoteBrowserHost"
		| "openMcpSettings"
		| "openProjectMcpSettings"
		| "restartMcpServer"
		| "refreshAllMcpServers"
		| "toggleToolAlwaysAllow"
		| "toggleToolEnabledForPrompt"
		| "toggleMcpServer"
		| "updateMcpTimeout"
		| "fuzzyMatchThreshold"
		| "morphApiKey" // kilocode_change: Morph fast apply - global setting
		| "writeDelayMs"
		| "diagnosticsEnabled"
		| "enhancePrompt"
		| "enhancedPrompt"
		| "draggedImages"
		| "deleteMessage"
		| "deleteMessageConfirm"
		| "submitEditedMessage"
		| "editMessageConfirm"
		| "terminalOutputLineLimit"
		| "terminalOutputCharacterLimit"
		| "terminalShellIntegrationTimeout"
		| "terminalShellIntegrationDisabled"
		| "terminalCommandDelay"
		| "terminalPowershellCounter"
		| "terminalZshClearEolMark"
		| "terminalZshOhMy"
		| "terminalZshP10k"
		| "terminalZdotdir"
		| "terminalCompressProgressBar"
		| "mcpEnabled"
		| "enableMcpServerCreation"
		| "remoteControlEnabled"
		| "searchCommits"
		| "alwaysApproveResubmit"
		| "requestDelaySeconds"
		| "setApiConfigPassword"
		| "mode"
		| "updatePrompt"
		| "updateSupportPrompt"
		| "getSystemPrompt"
		| "copySystemPrompt"
		| "systemPrompt"
		| "enhancementApiConfigId"
		| "commitMessageApiConfigId" // kilocode_change
		| "terminalCommandApiConfigId" // kilocode_change
		| "ghostServiceSettings" // kilocode_change
		| "includeTaskHistoryInEnhance"
		| "updateExperimental"
		| "autoApprovalEnabled"
		| "updateCustomMode"
		| "deleteCustomMode"
		| "setopenAiCustomModelInfo"
		| "openCustomModesSettings"
		| "checkpointDiff"
		| "checkpointRestore"
		| "seeNewChanges" // kilocode_change
		| "deleteMcpServer"
		| "maxOpenTabsContext"
		| "maxWorkspaceFiles"
		| "humanRelayResponse"
		| "humanRelayCancel"
		| "insertTextToChatArea" // kilocode_change
		| "browserToolEnabled"
		| "codebaseIndexEnabled"
		| "telemetrySetting"
		| "showRooIgnoredFiles"
		| "testBrowserConnection"
		| "browserConnectionResult"
		| "remoteBrowserEnabled"
		| "language"
		| "maxReadFileLine"
		| "maxImageFileSize"
		| "maxTotalImageSize"
		| "maxConcurrentFileReads"
		| "allowVeryLargeReads" // kilocode_change
		| "includeDiagnosticMessages"
		| "maxDiagnosticMessages"
		| "searchFiles"
		| "setHistoryPreviewCollapsed"
		| "showFeedbackOptions" // kilocode_change
		| "toggleApiConfigPin"
		| "fetchMcpMarketplace" // kilocode_change
		| "silentlyRefreshMcpMarketplace" // kilocode_change
		| "fetchLatestMcpServersFromHub" // kilocode_change
		| "downloadMcp" // kilocode_change
		| "showSystemNotification" // kilocode_change
		| "showAutoApproveMenu" // kilocode_change
		| "reportBug" // kilocode_change
		| "profileButtonClicked" // kilocode_change
		| "fetchProfileDataRequest" // kilocode_change
		| "profileDataResponse" // kilocode_change
		| "fetchBalanceDataRequest" // kilocode_change
		| "shopBuyCredits" // kilocode_change
		| "balanceDataResponse" // kilocode_change
		| "updateProfileData" // kilocode_change
		| "condense" // kilocode_change
		| "toggleWorkflow" // kilocode_change
		| "refreshRules" // kilocode_change
		| "toggleRule" // kilocode_change
		| "createRuleFile" // kilocode_change
		| "deleteRuleFile" // kilocode_change
		| "hasOpenedModeSelector"
		| "accountButtonClicked"
		| "rooCloudSignIn"
		| "rooCloudSignOut"
		| "condenseTaskContextRequest"
		| "requestIndexingStatus"
		| "startIndexing"
		| "clearIndexData"
		| "indexingStatusUpdate"
		| "indexCleared"
		| "focusPanelRequest"
		| "profileThresholds"
		| "setHistoryPreviewCollapsed"
		| "clearUsageData" // kilocode_change
		| "getUsageData" // kilocode_change
		| "usageDataResponse" // kilocode_change
		| "showTaskTimeline" // kilocode_change
		| "toggleTaskFavorite" // kilocode_change
		| "fixMermaidSyntax" // kilocode_change
		| "mermaidFixResponse" // kilocode_change
		| "openGlobalKeybindings" // kilocode_change
		| "openExternal"
		| "filterMarketplaceItems"
		| "mcpButtonClicked"
		| "marketplaceButtonClicked"
		| "memoryButtonClicked" // aincrok_change
		| "installMarketplaceItem"
		| "installMarketplaceItemWithParameters"
		| "cancelMarketplaceInstall"
		| "removeInstalledMarketplaceItem"
		| "marketplaceInstallResult"
		| "fetchMarketplaceData"
		| "switchTab"
		| "profileThresholds"
		| "editMessage" // kilocode_change
		| "systemNotificationsEnabled" // kilocode_change
		| "dismissNotificationId" // kilocode_change
		| "shareTaskSuccess"
		| "exportMode"
		| "exportModeResult"
		| "importMode"
		| "importModeResult"
		| "checkRulesDirectory"
		| "checkRulesDirectoryResult"
		| "saveCodeIndexSettingsAtomic"
		| "requestCodeIndexSecretStatus"
		| "fetchAincrokNotifications"
		| "requestCommands"
		| "openCommandFile"
		| "deleteCommand"
		| "createCommand"
		| "insertTextIntoTextarea"
		| "showMdmAuthRequiredNotification"
		// aincrok_change start - Memory system operations
		| "getMemoryConfig"
		| "saveMemoryConfig"
		| "testMemoryConnection"
		| "testMemoryComponent" // aincrok_change
		| "memoryConfigResponse"
		| "memoryConnectionTestResult"
		// Memory configuration fields
		| "memoryMode"
		| "autoCapture"
		| "extractReasoning"
		| "teamSharing"
		| "llmProvider"
		| "llmModel"
		| "llmApiKey"
		| "llmBaseUrl"
		| "vectorStore"
		| "vectorStoreUrl"
		| "vectorStoreApiKey"
		| "embeddingProvider"
		| "embeddingModel"
		| "embeddingDimensions"
		| "embeddingApiKey"
		| "embeddingBaseUrl"
		| "knowledgeGraphEnabled"
		| "knowledgeGraphType"
		| "neo4jHost"
		| "neo4jPort"
		| "neo4jUsername"
		| "neo4jPassword"
		| "neo4jDatabase"
		| "neo4jEnableAutoIndexing"
		| "neo4jEnableMetrics"
		| "neo4jEnableQueryCache"
		| "neo4jMaxRetries"
		| "neo4jTimeout"
		| "inMemoryMaxNodes"
		| "inMemoryMaxEdges"
		| "inMemoryEnableIndexing"
		| "inMemoryEnableGarbageCollection"
		| "inMemoryEnableAutoIndexing"
		| "inMemoryDefaultBatchSize"
		| "maxSessions"
		| "sessionTTL"
		| "maxIterations"
		| "mcpConnectionType"
		| "mcpCommand"
		| "mcpArgs"
		| "mcpTimeout"
		| "mcpStrictMode"
		| "apiUrl"
		| "apiKey"
		| "apiTimeout"
		| "apiRetries"
		| "apiVerifySSL"
		// aincrok_change start - Memory configuration
		| "updateMemoryConfiguration"
		| "getMemoryConfiguration"
		// aincrok_change end
		// aincrok_change start - Memory management operations
		| "searchMemory"
		| "getMemoryStats"
		| "getMemoryGraph"
		| "getMemoryInsights"
		| "linkMemories"
		| "unlinkMemories"
		| "exportMemories"
		| "importMemories"
		| "getConnectedMemories"
		| "deleteMemory"
		| "showInfo"
		| "memorySearchResults"
		| "memoryStats"
		| "memoryGraph"
		| "memoryConnected"
		| "memoryDisconnected"
		| "connectedMemories"
		| "memoryDeleted"
		// aincrok_change - onboarding workflow messages
		| "startMemoryOnboarding"
		| "getOnboardingStatus"
		| "onboardingStatus"
		| "onboardingProgress"
		| "onboardingComplete"
		// aincrok_change end
		// aincrok_change start - Missing message types
		| "requestBalanceData"
		| "condenseTaskContext"
		| "clearCodebaseIndex"
		| "buildCodebaseIndex"
		| "codebaseIndexConfig"
		| "requestRulesData"
		| "removeMarketplaceItem"
		| "requestMarketplaceData"
		| "requestMermaidFix"
		| "shareTask"
		| "codeIndexSecret"
		| "showDeleteMessageDialog"
		| "showEditMessageDialog"
		| "kilocodeNotifications"
		| "usageData"
		// aincrok_change end
		// aincrok_change start - Additional missing message types
		| "singleRouterModelFetch"
		| "getExtensionId"
		| "requestGitDiff"
		| "requestGitLog"
		| "pinApiConfig"
		| "fetchMcpMarketplaceCatalog"
		| "fetchMcpDownloadDetails"
		| "navigateToMcpSettings"
		| "switchTabAndOpenSettings" // aincrok_change - memory settings navigation
		| "requestInsertTextToChatArea"
		| "focusChatInput"
		| "requestProfileData"
		// aincrok_change start - Additional webview message types
		| "modeApiConfigs"
		| "customModes"
		| "customModePrompts"
		| "customSupportPrompts"
		| "customCondensingPrompt"
		| "codebaseIndexModels"
		| "localWorkflowToggles"
		| "globalRulesToggles"
		| "localRulesToggles"
		| "globalWorkflowToggles"
		| "dismissedNotificationIds"
		| "apiRequestResumeTask"
		| "exportCustomMode"
		| "importCustomMode"
		| "showChangelog"
		| "searchFilesTool"
		| "fileSearch"
		| "cancelCurrentRequest"
		| "refreshOpenRouterModels"
		| "refreshOpenAiModels"
		| "refreshOllamaModels"
		| "refreshVsCodeLmModels"
		| "testBrowserConnectionHost"
		| "getOpenTabs"
		| "getTheme"
		// aincrok_change start - Additional missing webview message types from error logs
		| "healthCheck"
		// aincrok_change start - Memory connection testing
		| "testMemoryConnection"
		| "testMemoryComponent" // aincrok_change
	// aincrok_change end
	// aincrok_change end
	// aincrok_change end
	// aincrok_change end
	text?: string
	editedMessageContent?: string
	tab?: "settings" | "history" | "mcp" | "modes" | "chat" | "marketplace" | "account"
	section?: string // aincrok_change - section parameter for settings navigation
	disabled?: boolean
	context?: string
	dataUri?: string
	askResponse?: ClineAskResponse
	apiConfiguration?: ProviderSettings
	images?: string[]
	bool?: boolean
	value?: number
	commands?: string[]
	audioType?: AudioType
	// kilocode_change begin
	notificationOptions?: {
		title?: string
		subtitle?: string
		message: string
	}
	mcpId?: string
	toolNames?: string[]
	autoApprove?: boolean
	workflowPath?: string // kilocode_change
	enabled?: boolean // kilocode_change
	rulePath?: string // kilocode_change
	isGlobal?: boolean // kilocode_change
	filename?: string // kilocode_change
	ruleType?: string // kilocode_change
	notificationId?: string // kilocode_change
	// kilocode_change end
	serverName?: string
	toolName?: string
	alwaysAllow?: boolean
	isEnabled?: boolean
	mode?: Mode
	promptMode?: PromptMode
	customPrompt?: PromptComponent
	dataUrls?: string[]
	values?: Record<string, any>
	// aincrok_change - Memory configuration properties
	key?: string
	query?: string
	setting?: string
	slug?: string
	modeConfig?: ModeConfig
	timeout?: number
	payload?: WebViewMessagePayload
	source?: "global" | "project"
	requestId?: string
	ids?: string[]
	hasSystemPromptOverride?: boolean
	terminalOperation?: "continue" | "abort"
	messageTs?: number
	historyPreviewCollapsed?: boolean
	filters?: { type?: string; search?: string; tags?: string[] }
	url?: string // For openExternal
	mpItem?: MarketplaceItem
	mpInstallOptions?: InstallMarketplaceItemOptions
	config?: Record<string, any> // Add config to the payload
	visibility?: ShareVisibility // For share visibility
	hasContent?: boolean // For checkRulesDirectoryResult
	checkOnly?: boolean // For deleteCustomMode check
	codeIndexSettings?: {
		// Global state settings
		codebaseIndexEnabled: boolean
		codebaseIndexQdrantUrl: string
		codebaseIndexEmbedderProvider: "openai" | "ollama" | "openai-compatible" | "gemini" | "mistral"
		codebaseIndexEmbedderBaseUrl?: string
		codebaseIndexEmbedderModelId: string
		codebaseIndexEmbedderModelDimension?: number // Generic dimension for all providers
		codebaseIndexOpenAiCompatibleBaseUrl?: string
		codebaseIndexSearchMaxResults?: number
		codebaseIndexSearchMinScore?: number

		// Secret settings
		codeIndexOpenAiKey?: string
		codeIndexQdrantApiKey?: string
		codebaseIndexOpenAiCompatibleApiKey?: string
		codebaseIndexGeminiApiKey?: string
		codebaseIndexMistralApiKey?: string
	}
	// aincrok_change - memory pressure message properties
	level?: "moderate" | "high" | "critical"
	heapUsedMb?: number
	emergency?: boolean
	// aincrok_change start - Memory management message properties
	memoryId?: string
	sourceId?: string
	targetId?: string
	relationship?: string
	types?: string
	limit?: number
	typeFilter?: string
	includeConnections?: boolean
	memories?: any[]
	stats?: any
	graph?: any
	connections?: any[]
	success?: boolean
	timeRange?: "day" | "week" | "month" | "all"
	// aincrok_change end
}

// kilocode_change begin
export type OrganizationRole = "owner" | "admin" | "member"

export type UserOrganizationWithApiKey = {
	id: string
	name: string
	balance: number
	role: OrganizationRole
	apiKey: string
}

export type ProfileData = {
	kilocodeToken: string
	user: {
		id: string
		name: string
		email: string
		image: string
	}
	organizations?: UserOrganizationWithApiKey[]
}

export interface ProfileDataResponsePayload {
	success: boolean
	data?: ProfileData
	error?: string
	baseUri?: string | null
	profileData?: ProfileData | null
	errorMessage?: string | null
}

export interface BalanceDataResponsePayload {
	// New: Payload for balance data
	success: boolean
	data?: any // Replace 'any' with a more specific type if known for balance
	error?: string
	baseUri?: string | null
	balanceData?: any | null
	errorMessage?: string | null
}

export interface SeeNewChangesPayload {
	commitRange: CommitRange
}
// kilocode_change end

export const checkoutDiffPayloadSchema = z.object({
	ts: z.number(),
	previousCommitHash: z.string().optional(),
	commitHash: z.string(),
	mode: z.enum(["full", "checkpoint"]),
})

export type CheckpointDiffPayload = z.infer<typeof checkoutDiffPayloadSchema>

export const checkoutRestorePayloadSchema = z.object({
	ts: z.number(),
	commitHash: z.string(),
	mode: z.enum(["preview", "restore"]),
})

export type CheckpointRestorePayload = z.infer<typeof checkoutRestorePayloadSchema>

export interface IndexingStatusPayload {
	state: "Standby" | "Indexing" | "Indexed" | "Error"
	message: string
}

export interface IndexClearedPayload {
	success: boolean
	error?: string
}

export const installMarketplaceItemWithParametersPayloadSchema = z.object({
	item: marketplaceItemSchema,
	parameters: z.record(z.string(), z.any()),
})

export type InstallMarketplaceItemWithParametersPayload = z.infer<
	typeof installMarketplaceItemWithParametersPayloadSchema
>

// aincrok_change start - Memory REST API message payloads
// aincrok_change - Updated for Memory system
export interface MemoryConfigPayload {
	mode: "embedded" | "mcp" | "api"
	embeddedConfigMethod?: "ui" | "yaml" // Configuration method for embedded mode
	autoCapture: boolean
	extractReasoning?: boolean // aincrok_change - Alternative name used by component
	reasoningExtraction?: boolean // aincrok_change - Keep for backward compatibility
	teamSharing?: boolean // aincrok_change - Alternative name for workspace.enabled
	configPath?: string // Path to cipher.yml for MCP/API mode or embedded YAML mode
	// aincrok_change - Session configuration
	sessionPersistence?: boolean
	maxMemorySize?: number
	// aincrok_change - MCP specific fields
	mcpCommand?: string
	mcpArgs?: string
	// aincrok_change - API specific fields
	apiUrl?: string
	apiKey?: string
	workspace?: {
		enabled: boolean
		syncInterval?: number
	}
	llm?: {
		provider?:
			| "openai"
			| "anthropic"
			| "openrouter"
			| "ollama"
			| "openai-compatible"
			| "gemini"
			| "voyage"
			| "qwen"
			| "bedrock"
		model?: string
		apiKey?: string
		baseUrl?: string
		maxIterations?: number
	}
	embedding?: {
		type: "openai" | "openai-compatible" | "gemini" | "ollama" | "voyage" | "qwen" | "bedrock"
		model?: string
		apiKey?: string
		baseUrl?: string
		dimensions?: number
	}
	vectorStore?: {
		type: "in-memory" | "qdrant" | "milvus" | "chroma" | "pinecone" | "weaviate"
		url?: string
		apiKey?: string
		collection?: string
	}
	knowledgeGraph?: {
		enabled: boolean
		type?: "in-memory" | "neo4j"
		// Neo4j configuration
		host?: string
		port?: number
		username?: string
		password?: string
		database?: string
		// In-memory configuration
		maxNodes?: number
		maxEdges?: number
	}
}

// aincrok_change - Updated for Memory system
export interface SaveMemoryConfigPayload {
	config: MemoryConfigPayload
}

// aincrok_change - Updated for Memory system
export interface TestMemoryConnectionPayload {
	config: MemoryConfigPayload
}

// aincrok_change - Updated for Memory system
export interface MemoryConfigResponsePayload {
	config: MemoryConfigPayload | null
}

// aincrok_change - Updated for Memory system
export interface MemoryConnectionTestResultPayload {
	success: boolean
	error?: string
	message?: string
	details?: {
		llm?: { success: boolean; message: string; error?: string }
		embedding?: { success: boolean; message: string; error?: string }
		vectorStore?: { success: boolean; message: string; error?: string }
		knowledgeGraph?: { success: boolean; message: string; error?: string }
		mcp?: { success: boolean; message: string; error?: string }
		api?: { success: boolean; message: string; error?: string }
		// aincrok_change - Add embedded field for embedded mode testing
		embedded?: { success: boolean; message: string; error?: string }
	}
}
// aincrok_change end

export type WebViewMessagePayload =
	// kilocode_change start
	| ProfileDataResponsePayload
	| BalanceDataResponsePayload
	| SeeNewChangesPayload
	// kilocode_change end
	| CheckpointDiffPayload
	| CheckpointRestorePayload
	| IndexingStatusPayload
	| IndexClearedPayload
	| InstallMarketplaceItemWithParametersPayload
	| UpdateTodoListPayload
	// aincrok_change start - Memory system payloads
	| SaveMemoryConfigPayload
	| TestMemoryConnectionPayload
	| MemoryConfigResponsePayload
	| MemoryConnectionTestResultPayload
	| MemoryConfigPayload
// aincrok_change end
