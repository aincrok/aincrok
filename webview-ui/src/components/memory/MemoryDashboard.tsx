// aincrok_change - enhanced memory dashboard with onboarding workflow
// Memory dashboard for visualization, management, and codebase onboarding

import React, { useState, useEffect, useCallback } from "react"
import {
	Brain,
	Search,
	Link,
	Trash2,
	Eye,
	Clock,
	Play,
	RefreshCw,
	CheckCircle,
	BarChart3,
	FileText,
	TrendingUp,
	Settings,
} from "lucide-react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"

// aincrok_change - add spinning animation for loading states
const spinningStyle = `
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.spinning {
		animation: spin 2s linear infinite;
	}
`

interface Memory {
	id: string
	type: "short-term" | "working" | "episodic" | "semantic" | "procedural"
	keywords: string[]
	content: string
	tags: string[]
	timestamp: number
	relevance_score?: number
	connections: string[]
	task_id?: string
	file_context: string[]
	session_id: string
}

// aincrok_change - Memory system status types
type MemoryStatus = "checking" | "configured" | "unconfigured" | "unhealthy" | "disabled"

interface MemoryStats {
	totalMemories: number
	cacheSize: number
	isOnline: boolean
	primaryProviderHealth: boolean
	fallbackProviderHealth?: boolean
	operations: {
		stores: number
		searches: number
		failures: number
	}
	performance: {
		averageStoreTime: number
		averageSearchTime: number
	}
	memoryTypeDistribution: Record<string, number>
	// aincrok_change - enhanced stats for Cipher integration
	knowledgeCount: number
	reasoningCount: number
	graphNodes: number
	graphEdges: number
	lastActivity: string
	healthStatus: "healthy" | "warning" | "error" | "unknown"
	memorySize: string
}

// aincrok_change - onboarding workflow interfaces
interface OnboardingStatus {
	isComplete: boolean
	filesAnalyzed: number
	totalFiles: number
	currentPhase: string
	isRunning: boolean
	progress: number
	phases: {
		name: string
		completed: boolean
		current: boolean
	}[]
}

const memoryTypeColors = {
	"short-term": "#3B82F6", // Blue
	working: "#EF4444", // Red
	episodic: "#10B981", // Green
	semantic: "#8B5CF6", // Purple
	procedural: "#F59E0B", // Amber
}

const memoryTypeLabels = {
	"short-term": "Short-term",
	working: "Working",
	episodic: "Episodic",
	semantic: "Semantic",
	procedural: "Procedural",
}

export default function MemoryDashboard() {
	const { t: _t } = useAppTranslation()
	const [_memories, setMemories] = useState<Memory[]>([])
	const [stats, setStats] = useState<MemoryStats | null>(null)

	// aincrok_change - inject spinning animation styles
	useEffect(() => {
		const style = document.createElement("style")
		style.textContent = spinningStyle
		document.head.appendChild(style)
		return () => {
			document.head.removeChild(style)
		}
	}, [])

	const [searchQuery, _setSearchQuery] = useState("")
	const [selectedMemoryType, _setSelectedMemoryType] = useState<string>("all")
	const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
	const [_loading, setLoading] = useState(false)
	const [_error, setError] = useState<string | null>(null)

	// aincrok_change - enhanced state for onboarding and tabs
	const [activeTab, setActiveTab] = useState<"overview" | "explore" | "analytics" | "logs" | "settings">("overview")
	const [memoryStatus, setMemoryStatus] = useState<MemoryStatus>("checking") // aincrok_change - memory system status
	const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
		isComplete: false,
		filesAnalyzed: 0,
		totalFiles: 0,
		currentPhase: "Not started",
		isRunning: false,
		progress: 0,
		phases: [
			{ name: "Initializing", completed: false, current: false },
			{ name: "Scanning Files", completed: false, current: false },
			{ name: "Analyzing Code", completed: false, current: false },
			{ name: "Building Memory", completed: false, current: false },
			{ name: "Complete", completed: false, current: false },
		],
	})

	const loadMemories = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			vscode.postMessage({
				type: "searchMemory",
				query: searchQuery,
				types: selectedMemoryType === "all" ? undefined : selectedMemoryType,
				limit: 50,
			})
		} catch (_err) {
			setError("Failed to load memories")
		} finally {
			setLoading(false)
		}
	}, [searchQuery, selectedMemoryType])

	const loadStats = useCallback(async () => {
		try {
			vscode.postMessage({ type: "getMemoryStats" })
		} catch (err) {
			console.error("Failed to load memory stats:", err)
		}
	}, [])

	// aincrok_change - memory configuration and health check function
	const checkMemoryConfiguration = useCallback(async () => {
		try {
			setMemoryStatus("checking")
			// Send message to check memory configuration and health
			vscode.postMessage({ type: "checkMemoryHealth" } as any)

			// Fallback timeout in case backend doesn't respond
			setTimeout(() => {
				// Default to unconfigured if no response received
				setMemoryStatus("unconfigured")
			}, 2000)
		} catch (err) {
			console.error("Failed to check memory configuration:", err)
			setMemoryStatus("unconfigured")
		}
	}, [])

	// aincrok_change - function to redirect to memory settings
	const redirectToMemorySettings = useCallback(() => {
		vscode.postMessage({
			type: "switchTabAndOpenSettings",
			tab: "settings",
			section: "memory",
		} as any)
	}, [])

	// aincrok_change - onboarding workflow functions
	const startOnboarding = useCallback(async () => {
		setOnboardingStatus((prev) => ({
			...prev,
			isRunning: true,
			currentPhase: "Starting analysis...",
			phases: prev.phases.map((phase, index) => ({
				...phase,
				current: index === 0,
				completed: false,
			})),
		}))
		vscode.postMessage({ type: "startMemoryOnboarding" })
	}, [])

	const loadOnboardingStatus = useCallback(() => {
		vscode.postMessage({ type: "getOnboardingStatus" })
	}, [])

	// Load memories and stats on mount
	useEffect(() => {
		checkMemoryConfiguration() // aincrok_change - check if memory is configured first
		loadMemories()
		loadStats()
		loadOnboardingStatus() // aincrok_change - load onboarding status

		// Refresh every 30 seconds
		const interval = setInterval(() => {
			loadStats()
			loadOnboardingStatus() // aincrok_change - refresh onboarding status
		}, 30000)

		return () => clearInterval(interval)
	}, [checkMemoryConfiguration, loadMemories, loadStats, loadOnboardingStatus])

	// Handle messages from extension
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			switch (message.type) {
				case "memorySearchResults":
					setMemories(message.memories || [])
					break
				case "memoryStats":
					setStats(message.stats)
					break
				case "error":
					setError(message.message)
					break
				// aincrok_change - memory health and configuration response
				case "memoryHealthStatus":
				case "memoryConfigurationStatus": {
					const status = message.status || (message.isConfigured ? "configured" : "unconfigured")
					setMemoryStatus(status)
					break
				}
				// aincrok_change - onboarding workflow message handling
				case "onboardingStatus":
					setOnboardingStatus(message.status || message.data)
					break
				case "onboardingProgress": {
					const progressData = message.status || message.data
					setOnboardingStatus((prev) => ({
						...prev,
						filesAnalyzed: progressData.filesAnalyzed,
						totalFiles: progressData.totalFiles,
						currentPhase: progressData.currentPhase,
						progress: progressData.progress || 0,
						phases: prev.phases.map((phase, index) => ({
							...phase,
							current: phase.name === progressData.currentPhase,
							completed: index < progressData.completedPhaseIndex,
						})),
					}))
					break
				}
				case "onboardingComplete":
					setOnboardingStatus((prev) => ({
						...prev,
						isComplete: true,
						isRunning: false,
						currentPhase: "Complete",
						progress: 100,
						phases: prev.phases.map((phase) => ({ ...phase, completed: true, current: false })),
					}))
					// Refresh data after onboarding
					setTimeout(() => {
						loadMemories()
						loadStats()
					}, 1000)
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [loadMemories, loadStats])

	const _handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			loadMemories()
		},
		[loadMemories],
	)

	const handleDeleteMemory = useCallback(
		(memoryId: string) => {
			if (confirm("Are you sure you want to delete this memory?")) {
				vscode.postMessage({
					type: "deleteMemory",
					memoryId,
				})
				// Refresh memories list
				setTimeout(() => loadMemories(), 500)
			}
		},
		[loadMemories],
	)

	const _handleExportMemories = useCallback(() => {
		vscode.postMessage({ type: "exportMemories" })
	}, [])

	const _handleImportMemories = useCallback(() => {
		vscode.postMessage({ type: "importMemories" })
	}, [])

	// aincrok_change - onboarding UI render functions
	const _renderOnboardingSection = () => {
		if (!onboardingStatus) {
			return null
		}

		if (onboardingStatus.isComplete) {
			return (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "12px 16px",
						backgroundColor: "var(--vscode-inputValidation-infoBackground)",
						border: "1px solid var(--vscode-inputValidation-infoBorder)",
						borderRadius: "4px",
						marginBottom: "16px",
						color: "var(--vscode-foreground)",
					}}>
					<CheckCircle size={16} style={{ color: "var(--vscode-charts-green)", flexShrink: 0 }} />
					<span style={{ fontSize: "13px", fontWeight: "500" }}>Memory system initialized successfully</span>
				</div>
			)
		}

		return (
			<div
				style={{
					backgroundColor: "var(--vscode-editor-background)",
					border: "1px solid var(--vscode-panel-border)",
					borderRadius: "4px",
					marginBottom: "16px",
					overflow: "hidden",
				}}>
				{/* Header */}
				<div
					style={{
						padding: "12px 16px",
						backgroundColor: "var(--vscode-sideBarSectionHeader-background)",
						borderBottom: "1px solid var(--vscode-panel-border)",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}>
					<Brain size={16} style={{ color: "var(--vscode-symbolIcon-colorIcon)", flexShrink: 0 }} />
					<span
						style={{
							fontSize: "13px",
							fontWeight: "600",
							color: "var(--vscode-sideBarSectionHeader-foreground)",
						}}>
						Memory System Setup
					</span>
				</div>

				{/* Content */}
				<div style={{ padding: "16px" }}>
					<p
						style={{
							margin: "0 0 16px 0",
							fontSize: "13px",
							lineHeight: "1.4",
							color: "var(--vscode-descriptionForeground)",
						}}>
						Initialize your memory system to enable intelligent code analysis and context awareness across
						your project.
					</p>

					{onboardingStatus?.isRunning ? (
						<div>
							{/* Current phase indicator */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									marginBottom: "12px",
								}}>
								<RefreshCw
									size={14}
									style={{
										animation: "spin 1s linear infinite",
										color: "var(--vscode-progressBar-foreground)",
										flexShrink: 0,
									}}
								/>
								<span
									style={{
										fontSize: "13px",
										color: "var(--vscode-foreground)",
										fontWeight: "500",
									}}>
									{onboardingStatus?.currentPhase || "Initializing..."}
								</span>
							</div>

							{/* Progress bar */}
							<div
								style={{
									width: "100%",
									height: "6px",
									backgroundColor: "var(--vscode-scrollbarSlider-background)",
									borderRadius: "3px",
									overflow: "hidden",
									marginBottom: "8px",
								}}>
								<div
									style={{
										width: `${Math.min(100, Math.max(0, onboardingStatus?.progress || 0))}%`,
										height: "100%",
										backgroundColor: "var(--vscode-progressBar-foreground)",
										borderRadius: "3px",
										transition: "width 0.3s ease-out",
									}}
								/>
							</div>

							{/* File progress counter */}
							<div
								style={{
									fontSize: "12px",
									color: "var(--vscode-descriptionForeground)",
									marginBottom: "12px",
									textAlign: "center",
								}}>
								{onboardingStatus?.filesAnalyzed || 0} of {onboardingStatus?.totalFiles || 0} files
								analyzed
							</div>

							{/* Phase badges */}
							{(onboardingStatus?.phases || []).length > 0 && (
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: "6px",
										justifyContent: "center",
									}}>
									{onboardingStatus.phases.map((phase, index) => (
										<div
											key={`${phase.name}-${index}`}
											style={{
												padding: "4px 8px",
												borderRadius: "3px",
												fontSize: "11px",
												fontWeight: "500",
												textTransform: "capitalize",
												backgroundColor: phase.completed
													? "var(--vscode-charts-green)"
													: phase.current
														? "var(--vscode-charts-blue)"
														: "var(--vscode-button-secondaryBackground)",
												color:
													phase.completed || phase.current
														? "var(--vscode-button-foreground)"
														: "var(--vscode-button-secondaryForeground)",
												border: `1px solid ${
													phase.completed
														? "var(--vscode-charts-green)"
														: phase.current
															? "var(--vscode-charts-blue)"
															: "var(--vscode-button-border)"
												}`,
												display: "flex",
												alignItems: "center",
												gap: "4px",
											}}>
											{phase.completed && <CheckCircle size={10} style={{ flexShrink: 0 }} />}
											{phase.name.replace(/_/g, " ")}
										</div>
									))}
								</div>
							)}
						</div>
					) : (
						<VSCodeButton
							onClick={startOnboarding}
							style={{
								width: "100%",
								justifyContent: "center",
								fontWeight: "500",
							}}>
							<Play size={14} style={{ marginRight: "6px" }} />
							Initialize Memory System
						</VSCodeButton>
					)}
				</div>
			</div>
		)
	}

	const formatTimestamp = (timestamp: number) => {
		const now = Date.now()
		const diff = now - timestamp
		const minutes = Math.floor(diff / 60000)
		const hours = Math.floor(diff / 3600000)
		const days = Math.floor(diff / 86400000)

		if (minutes < 60) return `${minutes}m ago`
		if (hours < 24) return `${hours}h ago`
		return `${days}d ago`
	}

	const _renderMemoryCard = (memory: Memory) => (
		<div
			key={memory.id}
			className="memory-card"
			style={{
				border: `2px solid ${memoryTypeColors[memory.type]}`,
				borderRadius: "8px",
				padding: "12px",
				margin: "8px 0",
				backgroundColor: "var(--vscode-editor-background)",
				cursor: "pointer",
			}}
			onClick={() => setSelectedMemory(selectedMemory?.id === memory.id ? null : memory)}>
			<div
				className="memory-header"
				style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
				<span
					className="memory-type-badge"
					style={{
						backgroundColor: memoryTypeColors[memory.type],
						color: "white",
						padding: "2px 8px",
						borderRadius: "12px",
						fontSize: "12px",
						fontWeight: "bold",
					}}>
					{memoryTypeLabels[memory.type]}
				</span>
				<span
					className="memory-time"
					style={{ color: "var(--vscode-descriptionForeground)", fontSize: "12px" }}>
					<Clock size={12} style={{ marginRight: "4px", display: "inline" }} />
					{formatTimestamp(memory.timestamp)}
				</span>
			</div>

			<div className="memory-content" style={{ marginBottom: "8px" }}>
				<p style={{ margin: "0", lineHeight: "1.4" }}>
					{memory.content.length > 150 ? `${memory.content.substring(0, 150)}...` : memory.content}
				</p>
			</div>

			<div
				className="memory-metadata"
				style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
				{memory.keywords.length > 0 && (
					<div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
						{memory.keywords.slice(0, 3).map((keyword) => (
							<span
								key={keyword}
								style={{
									backgroundColor: "var(--vscode-badge-background)",
									color: "var(--vscode-badge-foreground)",
									padding: "2px 6px",
									borderRadius: "4px",
									fontSize: "11px",
								}}>
								{keyword}
							</span>
						))}
						{memory.keywords.length > 3 && (
							<span style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
								+{memory.keywords.length - 3} more
							</span>
						)}
					</div>
				)}

				{memory.relevance_score !== undefined && (
					<span style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
						Score: {memory.relevance_score.toFixed(2)}
					</span>
				)}

				{memory.connections.length > 0 && (
					<span style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
						<Link size={11} style={{ marginRight: "2px", display: "inline" }} />
						{memory.connections.length}
					</span>
				)}
			</div>

			{selectedMemory?.id === memory.id && (
				<div
					className="memory-details"
					style={{
						marginTop: "12px",
						padding: "8px",
						backgroundColor: "var(--vscode-input-background)",
						borderRadius: "4px",
					}}>
					<div style={{ marginBottom: "8px" }}>
						<strong>Full Content:</strong>
						<p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>{memory.content}</p>
					</div>

					<div style={{ marginBottom: "8px" }}>
						<strong>Keywords:</strong> {memory.keywords.join(", ")}
					</div>

					<div style={{ marginBottom: "8px" }}>
						<strong>Tags:</strong> {memory.tags.join(", ")}
					</div>

					{memory.task_id && (
						<div style={{ marginBottom: "8px" }}>
							<strong>Task ID:</strong> {memory.task_id}
						</div>
					)}

					{memory.file_context.length > 0 && (
						<div style={{ marginBottom: "8px" }}>
							<strong>File Context:</strong> {memory.file_context.join(", ")}
						</div>
					)}

					<div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
						<VSCodeButton
							appearance="secondary"
							onClick={(e) => {
								e.stopPropagation()
								// TODO: Implement view connections
								console.log("View connections for memory:", memory.id)
							}}>
							<Eye size={12} style={{ marginRight: "4px" }} />
							View Connections
						</VSCodeButton>
						<VSCodeButton
							appearance="secondary"
							onClick={(e) => {
								e.stopPropagation()
								handleDeleteMemory(memory.id)
							}}>
							<Trash2 size={12} style={{ marginRight: "4px" }} />
							Delete
						</VSCodeButton>
					</div>
				</div>
			)}
		</div>
	)

	// aincrok_change - shared loading and configuration warning components
	const renderLoadingState = () => (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "200px",
				color: "var(--vscode-descriptionForeground)",
			}}>
			<RefreshCw size={24} className="spinning" style={{ marginRight: "8px" }} />
			Checking memory configuration...
		</div>
	)

	const renderConfigurationWarning = () => {
		const getWarningContent = () => {
			switch (memoryStatus) {
				case "unconfigured":
					return {
						title: "Memory System Not Configured",
						message:
							"The memory system requires configuration before you can initialize and use it. Please configure a memory provider in the settings first.",
						icon: Settings,
					}
				case "disabled":
					return {
						title: "Memory System Disabled",
						message:
							"The memory system is currently disabled. Enable it in the memory settings to start using memory features.",
						icon: Settings,
					}
				case "unhealthy":
					return {
						title: "Memory System Unhealthy",
						message:
							"The memory system is not functioning properly. Please check your configuration and try reconnecting in the memory settings.",
						icon: Settings,
					}
				default:
					return {
						title: "Memory System Not Available",
						message:
							"The memory system is not available. Please configure a memory provider in the settings.",
						icon: Settings,
					}
			}
		}

		const { title, message, icon: Icon } = getWarningContent()

		return (
			<div style={{ padding: "20px" }}>
				<div
					style={{
						backgroundColor: "var(--vscode-inputValidation-warningBackground)",
						border: "1px solid var(--vscode-inputValidation-warningBorder)",
						borderRadius: "6px",
						padding: "16px",
						marginBottom: "16px",
					}}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							marginBottom: "12px",
							color: "var(--vscode-inputValidation-warningForeground)",
						}}>
						<Icon size={20} style={{ marginRight: "8px" }} />
						<h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>{title}</h3>
					</div>
					<p
						style={{
							margin: "0 0 12px 0",
							lineHeight: "1.4",
							color: "var(--vscode-inputValidation-warningForeground)",
						}}>
						{message}
					</p>
					<VSCodeButton
						appearance="primary"
						onClick={redirectToMemorySettings}
						style={{ marginRight: "8px" }}>
						<Settings size={14} style={{ marginRight: "4px" }} />
						Open Memory Settings
					</VSCodeButton>
				</div>
			</div>
		)
	}

	// aincrok_change - render functions for tab content with memory configuration check
	const renderOverviewTab = () => {
		// Show loading state while checking configuration
		if (memoryStatus === "checking") {
			return renderLoadingState()
		}

		// Show warning if memory is not configured, disabled, or unhealthy
		if (memoryStatus !== "configured") {
			return renderConfigurationWarning()
		}

		// Show normal onboarding UI if memory is configured
		return (
			<div style={{ padding: "20px" }}>
				<div
					style={{
						backgroundColor: "var(--vscode-input-background)",
						border: "1px solid var(--vscode-input-border)",
						borderRadius: "6px",
						padding: "16px",
						marginBottom: "16px",
					}}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							marginBottom: "12px",
						}}>
						<Brain size={20} style={{ marginRight: "8px" }} />
						<h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Memory System Setup</h3>
					</div>
					<p
						style={{
							margin: "0 0 12px 0",
							lineHeight: "1.4",
							color: "var(--vscode-descriptionForeground)",
						}}>
						Initialize your memory system to enable intelligent code analysis and context awareness across
						your project.
					</p>
					<VSCodeButton appearance="primary" onClick={startOnboarding} disabled={onboardingStatus.isRunning}>
						<Play size={14} style={{ marginRight: "4px" }} />
						{onboardingStatus.isRunning ? "Initializing..." : "Initialize Memory System"}
					</VSCodeButton>
				</div>

				{/* Show onboarding progress if running */}
				{onboardingStatus.isRunning && (
					<div
						style={{
							backgroundColor: "var(--vscode-input-background)",
							border: "1px solid var(--vscode-input-border)",
							borderRadius: "6px",
							padding: "16px",
							marginBottom: "16px",
						}}>
						<div style={{ marginBottom: "12px" }}>
							<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
								<span style={{ fontSize: "12px", fontWeight: "500" }}>
									{onboardingStatus.currentPhase}
								</span>
								<span style={{ fontSize: "12px" }}>{onboardingStatus.progress}%</span>
							</div>
							<div
								style={{
									width: "100%",
									height: "4px",
									backgroundColor: "var(--vscode-progressBar-background)",
									borderRadius: "2px",
									overflow: "hidden",
								}}>
								<div
									style={{
										width: `${onboardingStatus.progress}%`,
										height: "100%",
										backgroundColor: "var(--vscode-progressBar-background)",
										transition: "width 0.3s ease",
									}}
								/>
							</div>
						</div>
						{onboardingStatus.totalFiles > 0 && (
							<div style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
								Analyzed {onboardingStatus.filesAnalyzed} of {onboardingStatus.totalFiles} files
							</div>
						)}
					</div>
				)}

				{/* Show stats if available */}
				{stats && (
					<div
						style={{
							backgroundColor: "var(--vscode-input-background)",
							border: "1px solid var(--vscode-input-border)",
							borderRadius: "6px",
							padding: "16px",
						}}>
						<h4 style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: "600" }}>Memory Statistics</h4>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
								gap: "12px",
							}}>
							<div>
								<div style={{ fontSize: "20px", fontWeight: "bold", color: "#3B82F6" }}>
									{stats.totalMemories}
								</div>
								<div style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
									Stored
								</div>
							</div>
							<div>
								<div style={{ fontSize: "20px", fontWeight: "bold", color: "#8B5CF6" }}>
									{stats.operations.searches}
								</div>
								<div style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
									Searches
								</div>
							</div>
							<div>
								<div
									style={{
										fontSize: "20px",
										fontWeight: "bold",
										color: stats.operations.failures > 0 ? "#EF4444" : "#10B981",
									}}>
									{stats.operations.failures}
								</div>
								<div style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
									Failures
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		)
	}

	const renderExploreTab = () => {
		if (memoryStatus === "checking") {
			return renderLoadingState()
		}
		if (memoryStatus !== "configured") {
			return renderConfigurationWarning()
		}
		return (
			<div style={{ padding: "20px" }}>
				<div style={{ textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
					Memory exploration coming soon...
				</div>
			</div>
		)
	}

	const renderAnalyticsTab = () => {
		if (memoryStatus === "checking") {
			return renderLoadingState()
		}
		if (memoryStatus !== "configured") {
			return renderConfigurationWarning()
		}
		return (
			<div style={{ padding: "20px" }}>
				<div style={{ textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
					Memory analytics coming soon...
				</div>
			</div>
		)
	}

	const renderLogsTab = () => {
		if (memoryStatus === "checking") {
			return renderLoadingState()
		}
		if (memoryStatus !== "configured") {
			return renderConfigurationWarning()
		}
		return (
			<div style={{ padding: "20px" }}>
				<div style={{ textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
					Memory logs coming soon...
				</div>
			</div>
		)
	}

	const renderSettingsTab = () => {
		if (memoryStatus === "checking") {
			return renderLoadingState()
		}
		if (memoryStatus !== "configured") {
			return renderConfigurationWarning()
		}
		return (
			<div style={{ padding: "20px" }}>
				<div style={{ textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
					Memory settings coming soon...
				</div>
			</div>
		)
	}

	return (
		<div
			className="memory-dashboard"
			style={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "var(--vscode-editor-background)",
				color: "var(--vscode-foreground)",
			}}>
			{/* Header with improved VS Code styling */}
			<div
				style={{
					padding: "12px 16px",
					borderBottom: "1px solid var(--vscode-sideBar-border)",
					backgroundColor: "var(--vscode-sideBarSectionHeader-background)",
				}}>
				<h2
					style={{
						margin: "0 0 12px 0",
						display: "flex",
						alignItems: "center",
						fontSize: "16px",
						fontWeight: "600",
						color: "var(--vscode-sideBarSectionHeader-foreground)",
					}}>
					<Brain size={16} style={{ marginRight: "8px" }} />
					Memory Dashboard
				</h2>

				{/* Tab Navigation with proper VS Code tab styling */}
				<div
					style={{
						display: "flex",
						gap: "1px",
						overflowX: "auto",
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					{[
						{ id: "overview", label: "Overview", icon: TrendingUp },
						{ id: "explore", label: "Explore", icon: Search },
						{ id: "analytics", label: "Analytics", icon: BarChart3 },
						{ id: "logs", label: "Logs", icon: FileText },
						{ id: "settings", label: "Settings", icon: Settings },
					].map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							onClick={() => setActiveTab(id as any)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "4px",
								padding: "6px 12px",
								border: "none",
								borderRadius: "0",
								cursor: "pointer",
								fontSize: "12px",
								fontWeight: "400",
								fontFamily: "inherit",
								whiteSpace: "nowrap",
								minWidth: "fit-content",
								backgroundColor:
									activeTab === id
										? "var(--vscode-tab-activeBackground)"
										: "var(--vscode-tab-inactiveBackground)",
								color:
									activeTab === id
										? "var(--vscode-tab-activeForeground)"
										: "var(--vscode-tab-inactiveForeground)",
								borderBottom:
									activeTab === id
										? "1px solid var(--vscode-tab-activeBorder)"
										: "1px solid transparent",
								transition: "background-color 0.1s ease",
							}}
							onMouseOver={(e) => {
								if (activeTab !== id) {
									e.currentTarget.style.backgroundColor = "var(--vscode-tab-hoverBackground)"
								}
							}}
							onMouseOut={(e) => {
								if (activeTab !== id) {
									e.currentTarget.style.backgroundColor = "var(--vscode-tab-inactiveBackground)"
								}
							}}>
							<Icon size={12} />
							<span style={{ display: window.innerWidth > 600 ? "inline" : "none" }}>{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Tab Content with proper background */}
			<div
				style={{
					flex: 1,
					overflow: "auto",
					padding: "0",
					backgroundColor: "var(--vscode-editor-background)",
				}}>
				<div
					style={{
						padding: "16px",
						minHeight: "100%",
						backgroundColor: "var(--vscode-editor-background)",
					}}>
					{activeTab === "overview" && renderOverviewTab()}
					{activeTab === "explore" && renderExploreTab()}
					{activeTab === "analytics" && renderAnalyticsTab()}
					{activeTab === "logs" && renderLogsTab()}
					{activeTab === "settings" && renderSettingsTab()}
				</div>
			</div>
		</div>
	)
}
