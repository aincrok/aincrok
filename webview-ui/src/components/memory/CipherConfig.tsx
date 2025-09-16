// aincrok_change - new component for Cipher memory configuration
import React, { useCallback, useState, useEffect } from "react"
import { Checkbox } from "vscrui"
import {
	VSCodeDropdown,
	VSCodeOption,
	VSCodeButton,
	VSCodeTextField,
	VSCodeCheckbox,
	VSCodeProgressRing,
} from "@vscode/webview-ui-toolkit/react"
import { RefreshCw, Unplug, AlertCircle, Link } from "lucide-react"

import { inputEventTransform } from "../settings/transforms"
import { vscode } from "@src/utils/vscode"
import { SetCachedStateField } from "../settings/types"
import { useAppTranslation } from "@/i18n/TranslationContext"
import type { MemoryConfigPayload } from "@roo/WebviewMessage"

// aincrok_change - updated to use grouped configuration props
type CipherProps = {
	// Main mode
	mode?: "disabled" | "embedded" | "mcp" | "api"
	autoCapture?: boolean
	reasoningExtraction?: boolean

	// Workspace settings
	workspace?: {
		enabled?: boolean
	}

	// LLM settings
	llm?: {
		provider?: string
		model?: string
		apiKey?: string
		baseUrl?: string
	}

	// Embedding settings
	embedding?: {
		type?: string
		model?: string
		apiKey?: string
		baseUrl?: string
		dimensions?: number
	}

	// Vector store settings
	vectorStore?: {
		type?: string
		url?: string
		apiKey?: string
	}

	// Knowledge graph settings
	knowledgeGraph?: {
		type?: string
		host?: string
		port?: string
		username?: string
		password?: string
		database?: string
		maxNodes?: number
		maxEdges?: number
	}

	// Session settings
	session?: {
		sessionTTL?: number
		maxSessions?: number
		maxIterations?: number
	}

	// MCP settings
	mcp?: {
		connectionType?: string
		command?: string
		args?: string
	}

	// API settings
	api?: {
		url?: string
		apiKey?: string
	}

	// Event handlers
	onModeChange?: (mode: string) => void
	onConfigChange?: (field: string, value: any) => void
	onTestConnection?: (testFn: () => Promise<void>) => void
	onTestResult?: (result: { success: boolean; message: string; details: string[]; timestamp: Date }) => void
	onProgressUpdate?: (progress: number, phase: string) => void
}

type CipherConfigProps = CipherProps

const CipherConfig: React.FC<CipherConfigProps> = ({
	mode = "disabled",
	autoCapture = false,
	reasoningExtraction = false,
	workspace,
	llm,
	embedding,
	vectorStore,
	knowledgeGraph,
	session,
	mcp,
	api,
	onModeChange,
	onConfigChange,
	onTestConnection,
	onTestResult,
	onProgressUpdate,
}) => {
	const { t } = useAppTranslation()

	// Local state for internal management
	const [localMode, setLocalMode] = useState<"disabled" | "embedded" | "mcp" | "api">(mode)
	const [isAutoCapture, setIsAutoCapture] = useState(autoCapture)
	const [isReasoningExtraction, setIsReasoningExtraction] = useState(reasoningExtraction)
	const [isWorkspaceEnabled, setIsWorkspaceEnabled] = useState(workspace?.enabled || false)

	// aincrok_change start - State for dropdowns - Fixed initialization
	// Fix: Use the actual value from props, not just defaulting to "in-memory"
	const [vectorStoreType, setVectorStoreType] = useState(() => {
		// Check if we have an actual value from props, otherwise use default
		// Important: empty string should also use default
		return vectorStore?.type && vectorStore.type !== "" ? vectorStore.type : "in-memory"
	})
	const [knowledgeGraphType, setKnowledgeGraphType] = useState(() => {
		return knowledgeGraph?.type || "disabled"
	})
	// aincrok_change end

	// aincrok_change - State for test results
	const [testResults, setTestResults] = useState<{
		success: boolean
		message: string
		error?: string
		details?:
			| string[]
			| {
					llm?: { success: boolean; message: string; error?: string }
					embedding?: { success: boolean; message: string; error?: string }
					vectorStore?: { success: boolean; message: string; error?: string }
					knowledgeGraph?: { success: boolean; message: string; error?: string }
					mcp?: { success: boolean; message: string; error?: string }
					api?: { success: boolean; message: string; error?: string }
			  }
		timestamp?: Date
	} | null>(null)
	const [isTestingConnection, setIsTestingConnection] = useState(false)
	const [testProgress, setTestProgress] = useState<{ progress: number; phase: string } | null>(null)

	// aincrok_change - Real connection status tracking
	const [connectionStatus, setConnectionStatus] = useState<
		"unknown" | "connected" | "disconnected" | "testing" | "error"
	>("unknown")
	const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null)

	// aincrok_change - Track field errors for validation feedback
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

	// aincrok_change - State for collapsible sections
	const [memoryFeaturesExpanded, setMemoryFeaturesExpanded] = useState(false)
	const [sessionSettingsExpanded, setSessionSettingsExpanded] = useState(false)

	// Sync local state with props when they change
	useEffect(() => {
		setLocalMode(mode)
	}, [mode])

	// aincrok_change start - Sync dropdown state with props - Fixed to only update when prop actually changes
	useEffect(() => {
		if (vectorStore?.type !== undefined && vectorStore.type !== "") {
			setVectorStoreType(vectorStore.type)
		}
	}, [vectorStore?.type])

	useEffect(() => {
		if (knowledgeGraph?.type !== undefined) {
			setKnowledgeGraphType(knowledgeGraph.type)
		}
	}, [knowledgeGraph?.type])
	// aincrok_change end

	// aincrok_change - Helper to get current field value
	const getFieldValue = (fieldPath: string): string | number | boolean | undefined => {
		const paths = fieldPath.split(".")
		let value: any = {
			mode: localMode,
			autoCapture: isAutoCapture,
			reasoningExtraction: isReasoningExtraction,
			workspace: { enabled: isWorkspaceEnabled },
			llm: llm || {},
			embedding: embedding || {},
			vectorStore: vectorStore ? { ...vectorStore, type: vectorStoreType } : { type: vectorStoreType },
			knowledgeGraph: knowledgeGraph
				? { ...knowledgeGraph, type: knowledgeGraphType }
				: { type: knowledgeGraphType },
			session: session || {},
			mcp: mcp || {},
			api: api || {},
		}

		for (const path of paths) {
			value = value?.[path]
		}

		return value
	}

	// aincrok_change - Get field-specific props (for error states, etc.)
	const getFieldProps = (fieldName: string) => {
		const hasError = !!fieldErrors[fieldName]
		return {
			className: hasError ? "error" : "",
			"aria-invalid": hasError,
			"aria-describedby": hasError ? `${fieldName}-error` : undefined,
		}
	}

	// aincrok_change - Error message component
	const ErrorMessage: React.FC<{ fieldName: string }> = ({ fieldName }) => {
		const error = fieldErrors[fieldName]
		if (!error) return null
		return (
			<div id={`${fieldName}-error`} className="text-red-500 text-xs mt-1">
				{error}
			</div>
		)
	}

	// aincrok_change - Validate required fields based on mode - wrapped in useCallback
	const validateFields = useCallback((): boolean => {
		const errors: Record<string, string> = {}

		if (localMode === "embedded") {
			// Validate LLM fields
			if (!llm?.provider) errors["llm.provider"] = "LLM provider is required"
			if (!llm?.model) errors["llm.model"] = "LLM model is required"
			if (llm?.provider !== "ollama" && !llm?.apiKey) errors["llm.apiKey"] = "API key is required"

			// Validate Embedding fields
			if (!embedding?.type) errors["embedding.type"] = "Embedding provider is required"
			if (!embedding?.model) errors["embedding.model"] = "Embedding model is required"
			if (embedding?.type !== "ollama" && !embedding?.apiKey) errors["embedding.apiKey"] = "API key is required"
			if (embedding?.type === "openai-compatible" && !embedding?.baseUrl)
				errors["embedding.baseUrl"] = "Base URL is required for OpenAI-compatible providers"

			// Validate Vector Store fields if not in-memory
			if (vectorStoreType !== "in-memory") {
				if (!vectorStore?.url) errors["vectorStore.url"] = "Vector store URL is required"
			}

			// Validate Knowledge Graph fields if neo4j
			if (knowledgeGraphType === "neo4j") {
				if (!knowledgeGraph?.host) errors["knowledgeGraph.host"] = "Host is required"
				if (!knowledgeGraph?.port) errors["knowledgeGraph.port"] = "Port is required"
				if (!knowledgeGraph?.username) errors["knowledgeGraph.username"] = "Username is required"
				if (!knowledgeGraph?.password) errors["knowledgeGraph.password"] = "Password is required"
				if (!knowledgeGraph?.database) errors["knowledgeGraph.database"] = "Database is required"
			}
		} else if (localMode === "mcp") {
			if (!mcp?.command) errors["mcp.command"] = "MCP command is required"
		} else if (localMode === "api") {
			if (!api?.url) errors["api.url"] = "API URL is required"
			if (!api?.apiKey) errors["api.apiKey"] = "API key is required"
		}

		setFieldErrors(errors)
		return Object.keys(errors).length === 0
	}, [
		localMode,
		llm,
		embedding,
		vectorStore,
		vectorStoreType,
		knowledgeGraph,
		knowledgeGraphType,
		mcp,
		api,
		setFieldErrors,
	])

	const handleModeChange = (e: Event | React.FormEvent<HTMLElement>) => {
		const target = e.target as HTMLSelectElement
		const newMode = target.value as typeof localMode
		setLocalMode(newMode)
		onModeChange?.(newMode)
		// Clear errors when mode changes
		setFieldErrors({})
		setTestResults(null)
	}

	const handleInputChange = (field: string) => (e: Event | React.FormEvent<HTMLElement>) => {
		const target = e.target as HTMLInputElement
		const value = target.type === "checkbox" ? target.checked : target.value

		// Clear error for this field when user starts typing
		setFieldErrors((prev) => {
			const next = { ...prev }
			delete next[field]
			return next
		})

		// Clear test results when configuration changes
		setTestResults(null)

		onConfigChange?.(field, value)
	}

	const handleCheckboxChange = (field: string) => (value: boolean) => {
		// Clear test results when configuration changes
		setTestResults(null)

		if (field === "autoCapture") {
			setIsAutoCapture(value)
		} else if (field === "reasoningExtraction") {
			setIsReasoningExtraction(value)
		} else if (field === "workspace.enabled") {
			setIsWorkspaceEnabled(value)
		}
		onConfigChange?.(field, value)
	}

	const handleVectorStoreTypeChange = (e: Event | React.FormEvent<HTMLElement>) => {
		const target = e.target as HTMLSelectElement
		setVectorStoreType(target.value)
		onConfigChange?.("vectorStore.type", target.value)
		// Clear test results when configuration changes
		setTestResults(null)
	}

	const handleKnowledgeGraphTypeChange = (e: Event | React.FormEvent<HTMLElement>) => {
		const target = e.target as HTMLSelectElement
		setKnowledgeGraphType(target.value)
		onConfigChange?.("knowledgeGraph.type", target.value)
		// Clear test results when configuration changes
		setTestResults(null)
	}

	// aincrok_change - Test memory connection - wrapped in useCallback to prevent re-renders
	const testConnection = useCallback(async () => {
		// First validate all required fields
		if (!validateFields()) {
			setTestResults({
				success: false,
				message: "Please fill in all required fields",
				error: "Validation failed",
				details: Object.entries(fieldErrors).map(([field, error]) => `${field}: ${error}`),
			})
			return
		}

		setIsTestingConnection(true)
		setConnectionStatus("testing")
		setTestProgress({ progress: 10, phase: "Initializing connection test..." })
		setTestResults(null)

		// Store timeout reference
		let timeoutId: NodeJS.Timeout | null = null

		try {
			// Set progress to indicate we're starting
			setTestProgress({ progress: 25, phase: "Validating configuration fields..." })

			// aincrok_change start - Real server testing implementation
			const componentResults: {
				llm?: { success: boolean; message: string; error?: string }
				embedding?: { success: boolean; message: string; error?: string }
				vectorStore?: { success: boolean; message: string; error?: string }
				knowledgeGraph?: { success: boolean; message: string; error?: string }
				mcp?: { success: boolean; message: string; error?: string }
				api?: { success: boolean; message: string; error?: string }
			} = {}

			let currentProgress = 30
			const progressIncrement = localMode === "embedded" ? 15 : 30

			// Helper function to test individual component with real server request
			const testSingleComponent = async (
				componentType: string,
				config: any,
			): Promise<{ success: boolean; message: string; error?: string }> => {
				return new Promise((resolve) => {
					const requestId = `${componentType}-${Date.now()}`

					// Set up listener for response
					const handleMessage = (event: MessageEvent) => {
						const message = event.data
						if (message.type === "testComponentResult" && message.requestId === requestId) {
							window.removeEventListener("message", handleMessage)
							resolve({
								success: message.success,
								message: message.message,
								error: message.error,
							})
						}
					}

					window.addEventListener("message", handleMessage)

					// Send test request
					vscode.postMessage({
						type: "testMemoryComponent",
						requestId,
						componentType,
						config,
					} as any)

					// Timeout fallback (10 seconds)
					setTimeout(() => {
						window.removeEventListener("message", handleMessage)
						resolve({
							success: false,
							message: `${componentType} test timed out`,
							error: "Test request timed out after 10 seconds",
						})
					}, 10000)
				})
			}

			// Test components based on mode with REAL server requests
			if (localMode === "embedded") {
				// Test LLM Provider with real server request
				setTestProgress({ progress: currentProgress, phase: "Testing LLM provider connection..." })
				componentResults.llm = await testSingleComponent("llm", {
					provider: llm?.provider,
					model: llm?.model,
					apiKey: llm?.apiKey,
					baseUrl: llm?.baseUrl,
				})
				currentProgress += progressIncrement

				// Test Embedding Provider with real server request
				setTestProgress({ progress: currentProgress, phase: "Testing embedding provider..." })
				componentResults.embedding = await testSingleComponent("embedding", {
					type: embedding?.type,
					model: embedding?.model,
					apiKey: embedding?.apiKey,
					baseUrl: embedding?.baseUrl,
					dimensions: embedding?.dimensions,
				})
				currentProgress += progressIncrement

				// Test Vector Store with real server request
				if (vectorStoreType !== "in-memory") {
					setTestProgress({ progress: currentProgress, phase: "Testing vector store connection..." })
					componentResults.vectorStore = await testSingleComponent("vectorStore", {
						type: vectorStoreType,
						url: vectorStore?.url,
						apiKey: vectorStore?.apiKey,
					})
				} else {
					componentResults.vectorStore = {
						success: true,
						message: "Using in-memory vector store",
					}
				}
				currentProgress += progressIncrement

				// Test Knowledge Graph with real server request
				if (knowledgeGraphType === "neo4j") {
					setTestProgress({ progress: currentProgress, phase: "Testing Neo4j connection..." })
					componentResults.knowledgeGraph = await testSingleComponent("knowledgeGraph", {
						host: knowledgeGraph?.host,
						port: knowledgeGraph?.port,
						username: knowledgeGraph?.username,
						password: knowledgeGraph?.password,
						database: knowledgeGraph?.database,
					})
				} else if (knowledgeGraphType === "in-memory") {
					componentResults.knowledgeGraph = {
						success: true,
						message: "Using in-memory knowledge graph",
					}
				}
			} else if (localMode === "mcp") {
				// For MCP mode, validate MCP command
				setTestProgress({ progress: currentProgress, phase: "Validating MCP command..." })
				if (mcp?.command) {
					componentResults.mcp = {
						success: true,
						message: "MCP command configured",
					}
				} else {
					componentResults.mcp = {
						success: false,
						message: "MCP command missing",
						error: "MCP command is required",
					}
				}
			} else if (localMode === "api") {
				// For API mode, validate API endpoint
				setTestProgress({ progress: currentProgress, phase: "Validating API configuration..." })
				if (api?.url && api?.apiKey) {
					componentResults.api = {
						success: true,
						message: "API configuration present",
					}
				} else {
					componentResults.api = {
						success: false,
						message: "Missing API details",
						error: "API URL and key are required",
					}
				}
			}
			// aincrok_change end

			// After component testing, test full Cipher integration
			setTestProgress({ progress: 75, phase: "Testing full Cipher integration..." })

			// Send test request to extension with full configuration
			vscode.postMessage({
				type: "testMemoryConnection",
				config: {
					mode: localMode,
					autoCapture: isAutoCapture,
					extractReasoning: isReasoningExtraction,
					teamSharing: isWorkspaceEnabled,
					// Include all configuration based on mode
					...(localMode === "embedded" && {
						llm: {
							provider: llm?.provider,
							model: llm?.model,
							apiKey: llm?.apiKey,
							baseUrl: llm?.baseUrl,
						},
						embedding: {
							type: embedding?.type,
							model: embedding?.model,
							apiKey: embedding?.apiKey,
							baseUrl: embedding?.baseUrl,
							dimensions: embedding?.dimensions,
						},
						vectorStore: {
							type: vectorStoreType,
							url: vectorStore?.url,
							apiKey: vectorStore?.apiKey,
						},
						knowledgeGraph: {
							enabled: knowledgeGraphType !== "disabled",
							type: knowledgeGraphType,
							host: knowledgeGraph?.host,
							port: knowledgeGraph?.port,
							username: knowledgeGraph?.username,
							password: knowledgeGraph?.password,
							database: knowledgeGraph?.database,
							maxNodes: knowledgeGraph?.maxNodes,
							maxEdges: knowledgeGraph?.maxEdges,
						},
						session: {
							sessionTTL: session?.sessionTTL,
							maxSessions: session?.maxSessions,
							maxIterations: session?.maxIterations,
						},
					}),
					...(localMode === "mcp" && {
						mcpCommand: mcp?.command,
						mcpArgs: mcp?.args,
					}),
					...(localMode === "api" && {
						apiUrl: api?.url,
						apiKey: api?.apiKey,
					}),
				},
			})

			// Wait for full integration test response
			setTestProgress({ progress: 85, phase: "Waiting for Cipher integration test result..." })

			// Update connection status based on component results
			const allComponentsSuccess = Object.values(componentResults).every((result) => result?.success === true)

			if (allComponentsSuccess) {
				setConnectionStatus("connected")
			} else {
				const hasErrors = Object.values(componentResults).some((result) => result?.error)
				setConnectionStatus(hasErrors ? "error" : "disconnected")
			}
			setLastStatusCheck(new Date())

			// Note: The response handler is in the useEffect hook below
			// We're not setting a timeout here because the integration test has its own timeout
		} catch (error) {
			// Clear timeout if set
			if (timeoutId) {
				clearTimeout(timeoutId)
			}

			setIsTestingConnection(false)
			setConnectionStatus("error")
			setLastStatusCheck(new Date())
			setTestProgress(null)
			setTestResults({
				success: false,
				message: "Failed to start connection test",
				error: error instanceof Error ? error.message : String(error),
				details: [
					"An unexpected error occurred while initiating the test:",
					"• Check your VS Code extension is running",
					"• Verify the configuration is valid",
					"• Try restarting VS Code if the problem persists",
				],
			})
		}
	}, [
		localMode,
		llm,
		embedding,
		vectorStore,
		vectorStoreType,
		knowledgeGraph,
		knowledgeGraphType,
		session,
		mcp,
		api,
		isAutoCapture,
		isReasoningExtraction,
		isWorkspaceEnabled,
		fieldErrors,
		validateFields,
	])

	// aincrok_change - Listen for test results
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			switch (message.type) {
				case "cipherConnectionTestResult":
					setIsTestingConnection(false)
					setTestProgress(null)

					// Update connection status based on final test result
					if (message.success) {
						setConnectionStatus("connected")
					} else {
						setConnectionStatus(message.error ? "error" : "disconnected")
					}
					setLastStatusCheck(new Date())

					setTestResults({
						success: message.success,
						message: message.message,
						error: message.error,
						details: message.details,
						timestamp: new Date(),
					})
					onTestResult?.({
						success: message.success,
						message: message.message,
						details: Array.isArray(message.details) ? message.details : [],
						timestamp: new Date(),
					})
					break
				case "cipherConnectionTestProgress":
					setTestProgress({
						progress: message.progress,
						phase: message.phase,
					})
					onProgressUpdate?.(message.progress, message.phase)
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [onTestResult, onProgressUpdate])

	// aincrok_change - Expose test function to parent - optimized dependencies
	useEffect(() => {
		onTestConnection?.(testConnection)
	}, [testConnection, onTestConnection])

	// aincrok_change - Helper to render component test results with validation states
	const renderComponentResult = (
		component: string,
		result?: { success: boolean; message: string; error?: string },
	) => {
		if (!result) return null

		// Determine the state based on message content and success flag
		const isPending = result.message?.includes("awaiting") || result.message?.includes("waiting")
		const bgColor = result.success ? "bg-green-900/20" : result.error ? "bg-red-900/20" : "bg-yellow-900/20"
		const iconColor = result.success ? "text-green-500" : result.error ? "text-red-500" : "text-yellow-500"
		const icon = result.success ? "✓" : result.error ? "✗" : "○"

		return (
			<div className={`flex items-start gap-2 p-2 rounded ${bgColor}`}>
				<span className={`mt-1 ${iconColor}`}>{icon}</span>
				<div className="flex-1">
					<div className="font-medium">{component}</div>
					<div className={`text-sm ${isPending ? "text-yellow-400" : "opacity-80"}`}>{result.message}</div>
					{result.error && <div className="text-xs text-red-400 mt-1 font-mono">{result.error}</div>}
				</div>
			</div>
		)
	}

	// aincrok_change - Get display text and color for connection status - Updated to match reference design
	const getStatusDisplay = () => {
		if (localMode === "disabled") {
			return { text: "Memory Disabled", color: "text-gray-500", icon: "●" }
		}

		switch (connectionStatus) {
			case "connected":
				return { text: "Connected", color: "text-green-500", icon: "●" }
			case "disconnected":
				return { text: "Not Connected", color: "text-yellow-500", icon: "●" }
			case "testing":
				return { text: "Testing...", color: "text-blue-500 animate-pulse", icon: "●" }
			case "error":
				return { text: "Connection Failed", color: "text-red-500", icon: "●" }
			default:
				return { text: "Configuring", color: "text-gray-400", icon: "●" }
		}
	}

	// aincrok_change - Get mode display text
	const getModeDisplayText = () => {
		if (localMode === "disabled") return ""
		if (localMode === "embedded") return "Embedded Mode"
		if (localMode === "mcp") return "MCP Mode"
		if (localMode === "api") return "API Mode"
		return "Unknown Mode"
	}

	return (
		<div className="space-y-4">
			{/* Memory Status Bar - aincrok_change: Real-time status display - No box wrapper, fit content */}
			<div className="flex items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					{/* Status Indicator */}
					<div className="flex items-center gap-2">
						<span className={`${getStatusDisplay().color} text-xs`}>{getStatusDisplay().icon}</span>
						<span className="text-sm">{getStatusDisplay().text}</span>
					</div>
				</div>

				{localMode !== "disabled" && (
					<VSCodeButton onClick={testConnection} disabled={isTestingConnection} appearance="primary">
						<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
							<Link size={14} />
							{isTestingConnection ? "Testing..." : "Test Connection"}
						</div>
					</VSCodeButton>
				)}
			</div>

			{/* Test Results - aincrok_change: Show validation states accurately */}
			{testResults && (
				<div
					className={`p-3 rounded border ${
						testResults.success
							? "bg-green-900/10 border-green-500/30"
							: testResults.message?.includes("waiting") || testResults.message?.includes("awaiting")
								? "bg-blue-900/10 border-blue-500/30"
								: "bg-yellow-900/10 border-yellow-500/30"
					}`}>
					<div className="flex items-start gap-2">
						<span
							className={`text-xl ${
								testResults.success
									? "text-green-500"
									: testResults.message?.includes("waiting") ||
										  testResults.message?.includes("awaiting")
										? "text-blue-500"
										: "text-yellow-500"
							}`}>
							{testResults.success
								? "✓"
								: testResults.message?.includes("waiting") || testResults.message?.includes("awaiting")
									? "⏳"
									: "⚠"}
						</span>
						<div className="flex-1">
							<div className="font-medium">{testResults.message || "Test results"}</div>
							{testResults.error && <div className="text-sm mt-1 text-red-400">{testResults.error}</div>}
							{testResults.details && (
								<div className="mt-2 space-y-2">
									{typeof testResults.details === "object" && !Array.isArray(testResults.details) ? (
										// Render component-by-component results
										<>
											{testResults.details.llm &&
												renderComponentResult("LLM Configuration", testResults.details.llm)}
											{testResults.details.embedding &&
												renderComponentResult(
													"Embedding Configuration",
													testResults.details.embedding,
												)}
											{testResults.details.vectorStore &&
												renderComponentResult("Vector Store", testResults.details.vectorStore)}
											{testResults.details.knowledgeGraph &&
												renderComponentResult(
													"Knowledge Graph",
													testResults.details.knowledgeGraph,
												)}
											{testResults.details.mcp &&
												renderComponentResult("MCP Server", testResults.details.mcp)}
											{testResults.details.api &&
												renderComponentResult("API Connection", testResults.details.api)}
										</>
									) : (
										// Render string array details
										<div className="text-sm opacity-80">
											{testResults.details.map((detail, idx) => (
												<div key={idx}>• {detail}</div>
											))}
										</div>
									)}
								</div>
							)}
							{testResults.timestamp && (
								<div className="text-xs opacity-60 mt-2">
									Tested at: {testResults.timestamp.toLocaleTimeString()}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Test Progress - aincrok_change: Enhanced progress display */}
			{testProgress && (
				<div className="p-3 rounded border bg-blue-900/10 border-blue-500/30">
					<div className="flex items-center gap-3">
						<VSCodeProgressRing />
						<div className="flex-1">
							<div className="text-sm font-medium">Testing connection...</div>
							<div className="text-xs opacity-80 mt-1">{testProgress.phase}</div>
							{testProgress.progress && (
								<div className="text-xs opacity-60 mt-1">Progress: {testProgress.progress}%</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Mode Selection */}
			<div>
				<label className="block mb-2">{t("memory:modes.title")}</label>
				<VSCodeDropdown value={localMode} onChange={handleModeChange}>
					<VSCodeOption value="disabled">{t("memory:modes.disabled")}</VSCodeOption>
					<VSCodeOption value="embedded">{t("memory:modes.embedded")}</VSCodeOption>
					<VSCodeOption value="mcp">{t("memory:modes.mcp")}</VSCodeOption>
					<VSCodeOption value="api">{t("memory:modes.api")}</VSCodeOption>
				</VSCodeDropdown>
			</div>

			{/* Memory Features - aincrok_change: Collapsible section */}
			{localMode !== "disabled" && (
				<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
					<button
						onClick={() => setMemoryFeaturesExpanded(!memoryFeaturesExpanded)}
						className="flex items-center gap-2 font-medium hover:opacity-80"
						type="button">
						<span className={`transform transition-transform ${memoryFeaturesExpanded ? "rotate-90" : ""}`}>
							▶
						</span>
						Memory Features
					</button>

					{memoryFeaturesExpanded && (
						<div className="space-y-3 pl-4">
							<VSCodeCheckbox
								checked={isAutoCapture}
								onChange={(e) => {
									const target = e.target as HTMLInputElement
									handleCheckboxChange("autoCapture")(target.checked)
								}}>
								{t("memory:settings.autoCapture")}
							</VSCodeCheckbox>

							<VSCodeCheckbox
								checked={isReasoningExtraction}
								onChange={(e) => {
									const target = e.target as HTMLInputElement
									handleCheckboxChange("reasoningExtraction")(target.checked)
								}}>
								{t("memory:settings.reasoningExtraction")}
							</VSCodeCheckbox>

							<VSCodeCheckbox
								checked={isWorkspaceEnabled}
								onChange={(e) => {
									const target = e.target as HTMLInputElement
									handleCheckboxChange("workspace.enabled")(target.checked)
								}}>
								{t("memory:settings.workspace")}
							</VSCodeCheckbox>
						</div>
					)}
				</div>
			)}

			{/* Embedded Mode Configuration - aincrok_change: Complete restructure for embedded fields */}
			{localMode === "embedded" && (
				<>
					{/* LLM Configuration */}
					<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
						<h4 className="font-medium">{t("memory:llm.title")}</h4>

						<div>
							<label className="block mb-1 text-sm">{t("memory:llm.provider")}</label>
							<VSCodeDropdown
								value={(getFieldValue("llm.provider") as string) || ""}
								onChange={handleInputChange("llm.provider")}
								{...getFieldProps("llm.provider")}>
								<VSCodeOption value="">Select Provider</VSCodeOption>
								<VSCodeOption value="openai">OpenAI</VSCodeOption>
								<VSCodeOption value="anthropic">Anthropic</VSCodeOption>
								<VSCodeOption value="ollama">Ollama (Local)</VSCodeOption>
							</VSCodeDropdown>
							<ErrorMessage fieldName="llm.provider" />
						</div>

						{getFieldValue("llm.provider") && getFieldValue("llm.provider") !== "ollama" && (
							<div>
								<label className="block mb-1 text-sm">{t("memory:llm.apiKey")}</label>
								<VSCodeTextField
									type="password"
									value={(getFieldValue("llm.apiKey") as string) || ""}
									onChange={handleInputChange("llm.apiKey")}
									placeholder="Enter API key"
									{...getFieldProps("llm.apiKey")}
								/>
								<ErrorMessage fieldName="llm.apiKey" />
							</div>
						)}

						<div>
							<label className="block mb-1 text-sm">{t("memory:llm.model")}</label>
							<VSCodeTextField
								value={(getFieldValue("llm.model") as string) || ""}
								onChange={handleInputChange("llm.model")}
								placeholder={getFieldValue("llm.provider") === "openai" ? "gpt-4" : "Enter model name"}
								{...getFieldProps("llm.model")}
							/>
							<ErrorMessage fieldName="llm.model" />
						</div>

						{getFieldValue("llm.provider") === "openai" && (
							<div>
								<label className="block mb-1 text-sm">
									{t("memory:llm.baseUrl")} <span className="text-gray-500">(optional)</span>
								</label>
								<VSCodeTextField
									value={(getFieldValue("llm.baseUrl") as string) || ""}
									onChange={handleInputChange("llm.baseUrl")}
									placeholder="https://api.openai.com/v1"
								/>
							</div>
						)}
					</div>

					{/* Embedding Provider Configuration */}
					<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
						<h4 className="font-medium">Embedding Configuration</h4>

						<div>
							<label className="block mb-1 text-sm">Embedding Provider</label>
							<VSCodeDropdown
								value={(getFieldValue("embedding.type") as string) || ""}
								onChange={handleInputChange("embedding.type")}
								{...getFieldProps("embedding.type")}>
								<VSCodeOption value="">Select Provider</VSCodeOption>
								<VSCodeOption value="openai">OpenAI</VSCodeOption>
								<VSCodeOption value="openai-compatible">OpenAI Compatible</VSCodeOption>
								<VSCodeOption value="ollama">Ollama (Local)</VSCodeOption>
							</VSCodeDropdown>
							<ErrorMessage fieldName="embedding.type" />
						</div>

						{getFieldValue("embedding.type") && getFieldValue("embedding.type") !== "ollama" && (
							<div>
								<label className="block mb-1 text-sm">API Key</label>
								<VSCodeTextField
									type="password"
									value={(getFieldValue("embedding.apiKey") as string) || ""}
									onChange={handleInputChange("embedding.apiKey")}
									placeholder="Enter API key"
									{...getFieldProps("embedding.apiKey")}
								/>
								<ErrorMessage fieldName="embedding.apiKey" />
							</div>
						)}

						<div>
							<label className="block mb-1 text-sm">Model</label>
							<VSCodeTextField
								value={(getFieldValue("embedding.model") as string) || ""}
								onChange={handleInputChange("embedding.model")}
								placeholder={
									getFieldValue("embedding.type") === "openai"
										? "text-embedding-ada-002"
										: "Enter model name"
								}
								{...getFieldProps("embedding.model")}
							/>
							<ErrorMessage fieldName="embedding.model" />
						</div>

						{(getFieldValue("embedding.type") === "openai" ||
							getFieldValue("embedding.type") === "openai-compatible") && (
							<div>
								<label className="block mb-1 text-sm">
									Base URL{" "}
									<span className="text-gray-500">
										{getFieldValue("embedding.type") === "openai" ? "(optional)" : ""}
									</span>
								</label>
								<VSCodeTextField
									value={(getFieldValue("embedding.baseUrl") as string) || ""}
									onChange={handleInputChange("embedding.baseUrl")}
									placeholder={
										getFieldValue("embedding.type") === "openai"
											? "https://api.openai.com/v1"
											: "Enter base URL"
									}
									{...getFieldProps("embedding.baseUrl")}
								/>
								<ErrorMessage fieldName="embedding.baseUrl" />
							</div>
						)}

						<div>
							<label className="block mb-1 text-sm">Dimensions</label>
							<VSCodeTextField
								value={`${getFieldValue("embedding.dimensions") || ""}`}
								onChange={handleInputChange("embedding.dimensions")}
								placeholder="1536"
							/>
						</div>
					</div>

					{/* Vector Store Configuration */}
					<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
						<h4 className="font-medium">Vector Store</h4>

						<div>
							<label className="block mb-1 text-sm">Vector Store Type</label>
							<VSCodeDropdown value={vectorStoreType} onChange={handleVectorStoreTypeChange}>
								<VSCodeOption value="in-memory">In-Memory</VSCodeOption>
								<VSCodeOption value="qdrant">Qdrant</VSCodeOption>
								<VSCodeOption value="milvus">Milvus</VSCodeOption>
							</VSCodeDropdown>
						</div>

						{(vectorStoreType === "qdrant" || vectorStoreType === "milvus") && (
							<>
								<div>
									<label className="block mb-1 text-sm">Vector Store URL</label>
									<VSCodeTextField
										value={(getFieldValue("vectorStore.url") as string) || ""}
										onChange={handleInputChange("vectorStore.url")}
										placeholder="http://localhost:6333"
										{...getFieldProps("vectorStore.url")}
									/>
									<ErrorMessage fieldName="vectorStore.url" />
								</div>

								<div>
									<label className="block mb-1 text-sm">API Key (Optional)</label>
									<VSCodeTextField
										type="password"
										value={(getFieldValue("vectorStore.apiKey") as string) || ""}
										onChange={handleInputChange("vectorStore.apiKey")}
										placeholder="Leave blank if not required"
									/>
								</div>
							</>
						)}
					</div>

					{/* Knowledge Graph Configuration - aincrok_change: restructured like Vector Store */}
					<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
						<h4 className="font-medium">{t("memory:knowledgeGraph.title")}</h4>

						<div>
							<label className="block mb-1 text-sm">{t("memory:knowledgeGraph.type")}</label>
							<VSCodeDropdown
								value={(getFieldValue("knowledgeGraph.type") as string) || knowledgeGraphType}
								onChange={handleKnowledgeGraphTypeChange}>
								<VSCodeOption value="disabled">{t("memory:modes.disabled")}</VSCodeOption>
								<VSCodeOption value="in-memory">
									{t("memory:knowledgeGraph.types.in-memory")}
								</VSCodeOption>
								<VSCodeOption value="neo4j">{t("memory:knowledgeGraph.types.neo4j")}</VSCodeOption>
							</VSCodeDropdown>
						</div>

						{knowledgeGraphType === "neo4j" && (
							<>
								<div>
									<label className="block mb-1 text-sm">Host</label>
									<VSCodeTextField
										value={(getFieldValue("knowledgeGraph.host") as string) || ""}
										onChange={handleInputChange("knowledgeGraph.host")}
										placeholder="localhost"
										{...getFieldProps("knowledgeGraph.host")}
									/>
									<ErrorMessage fieldName="knowledgeGraph.host" />
								</div>

								<div>
									<label className="block mb-1 text-sm">Port</label>
									<VSCodeTextField
										value={(getFieldValue("knowledgeGraph.port") as string) || ""}
										onChange={handleInputChange("knowledgeGraph.port")}
										placeholder="7687"
										{...getFieldProps("knowledgeGraph.port")}
									/>
									<ErrorMessage fieldName="knowledgeGraph.port" />
								</div>

								<div>
									<label className="block mb-1 text-sm">Username</label>
									<VSCodeTextField
										value={(getFieldValue("knowledgeGraph.username") as string) || ""}
										onChange={handleInputChange("knowledgeGraph.username")}
										placeholder="neo4j"
										{...getFieldProps("knowledgeGraph.username")}
									/>
									<ErrorMessage fieldName="knowledgeGraph.username" />
								</div>

								<div>
									<label className="block mb-1 text-sm">Password</label>
									<VSCodeTextField
										type="password"
										value={(getFieldValue("knowledgeGraph.password") as string) || ""}
										onChange={handleInputChange("knowledgeGraph.password")}
										placeholder="Enter password"
										{...getFieldProps("knowledgeGraph.password")}
									/>
									<ErrorMessage fieldName="knowledgeGraph.password" />
								</div>

								<div>
									<label className="block mb-1 text-sm">Database</label>
									<VSCodeTextField
										value={(getFieldValue("knowledgeGraph.database") as string) || ""}
										onChange={handleInputChange("knowledgeGraph.database")}
										placeholder="neo4j"
										{...getFieldProps("knowledgeGraph.database")}
									/>
									<ErrorMessage fieldName="knowledgeGraph.database" />
								</div>
							</>
						)}

						{knowledgeGraphType === "in-memory" && (
							<>
								<div>
									<label className="block mb-1 text-sm">Max Nodes</label>
									<VSCodeTextField
										value={`${getFieldValue("knowledgeGraph.maxNodes") || ""}`}
										onChange={handleInputChange("knowledgeGraph.maxNodes")}
										placeholder="10000"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm">Max Edges</label>
									<VSCodeTextField
										value={`${getFieldValue("knowledgeGraph.maxEdges") || ""}`}
										onChange={handleInputChange("knowledgeGraph.maxEdges")}
										placeholder="50000"
									/>
								</div>
							</>
						)}
					</div>

					{/* Session Settings */}
					<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
						<button
							onClick={() => setSessionSettingsExpanded(!sessionSettingsExpanded)}
							className="flex items-center gap-2 font-medium hover:opacity-80">
							<span
								className={`transform transition-transform ${sessionSettingsExpanded ? "rotate-90" : ""}`}>
								▶
							</span>
							Session Settings (Advanced)
						</button>

						{sessionSettingsExpanded && (
							<div className="space-y-3 pl-4">
								<div>
									<label className="block mb-1 text-sm">Session TTL (seconds)</label>
									<VSCodeTextField
										value={`${getFieldValue("session.sessionTTL") || ""}`}
										onChange={handleInputChange("session.sessionTTL")}
										placeholder="3600"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm">Max Sessions</label>
									<VSCodeTextField
										value={`${getFieldValue("session.maxSessions") || ""}`}
										onChange={handleInputChange("session.maxSessions")}
										placeholder="100"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm">Max Iterations</label>
									<VSCodeTextField
										value={`${getFieldValue("session.maxIterations") || ""}`}
										onChange={handleInputChange("session.maxIterations")}
										placeholder="10"
									/>
								</div>
							</div>
						)}
					</div>
				</>
			)}

			{/* MCP Mode Configuration */}
			{getFieldValue("mode") === "mcp" && (
				<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
					<h4 className="font-medium">MCP Server Configuration</h4>

					<div>
						<label className="block mb-1 text-sm">Connection Type</label>
						<VSCodeDropdown
							value={(getFieldValue("mcp.connectionType") as string) || ""}
							onChange={handleInputChange("mcp.connectionType")}>
							<VSCodeOption value="stdio">STDIO</VSCodeOption>
							<VSCodeOption value="tcp">TCP</VSCodeOption>
						</VSCodeDropdown>
					</div>

					<div>
						<label className="block mb-1 text-sm">Command</label>
						<VSCodeTextField
							value={(getFieldValue("mcp.command") as string) || ""}
							onChange={handleInputChange("mcp.command")}
							placeholder="cipher-mcp-server"
							{...getFieldProps("mcp.command")}
						/>
						<ErrorMessage fieldName="mcp.command" />
					</div>

					<div>
						<label className="block mb-1 text-sm">Arguments (Optional)</label>
						<VSCodeTextField
							value={(getFieldValue("mcp.args") as string) || ""}
							onChange={handleInputChange("mcp.args")}
							placeholder="--port 3000"
						/>
					</div>
				</div>
			)}

			{/* API Mode Configuration */}
			{getFieldValue("mode") === "api" && (
				<div className="space-y-3 border-l-2 border-vscode-button-background pl-4">
					<h4 className="font-medium">API Configuration</h4>

					<div>
						<label className="block mb-1 text-sm">API URL</label>
						<VSCodeTextField
							value={(getFieldValue("api.url") as string) || ""}
							onChange={handleInputChange("api.url")}
							placeholder="https://api.cipher.com"
							{...getFieldProps("api.url")}
						/>
						<ErrorMessage fieldName="api.url" />
					</div>

					<div>
						<label className="block mb-1 text-sm">API Key</label>
						<VSCodeTextField
							type="password"
							value={(getFieldValue("api.apiKey") as string) || ""}
							onChange={handleInputChange("api.apiKey")}
							placeholder="Enter API key"
							{...getFieldProps("api.apiKey")}
						/>
						<ErrorMessage fieldName="api.apiKey" />
					</div>
				</div>
			)}
		</div>
	)
}

export default CipherConfig
