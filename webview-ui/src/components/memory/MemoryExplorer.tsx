// aincrok_change - new file
// Memory explorer with graph visualization and connection management

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Network, Link2, X, Eye } from "lucide-react"
import { VSCodeTextField, VSCodeButton, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"

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

interface MemoryConnection {
	source: string
	target: string
	relationship?: string
	strength?: number
}

interface MemoryGraph {
	nodes: Memory[]
	edges: MemoryConnection[]
}

const memoryTypeColors = {
	"short-term": "#3B82F6",
	working: "#EF4444",
	episodic: "#10B981",
	semantic: "#8B5CF6",
	procedural: "#F59E0B",
}

export default function MemoryExplorer() {
	const { t: _t } = useAppTranslation()
	const svgRef = useRef<SVGSVGElement>(null)
	const [memoryGraph, setMemoryGraph] = useState<MemoryGraph>({ nodes: [], edges: [] })
	const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [filterType, setFilterType] = useState<string>("all")
	const [showConnections, setShowConnections] = useState(true)
	const [loading, setLoading] = useState(false)
	const [connectionMode, setConnectionMode] = useState(false)
	const [selectedForConnection, setSelectedForConnection] = useState<string | null>(null)

	const loadMemoryGraph = useCallback(async () => {
		try {
			setLoading(true)
			vscode.postMessage({
				type: "getMemoryGraph",
				query: searchQuery,
				typeFilter: filterType === "all" ? undefined : filterType,
				includeConnections: showConnections,
			})
		} catch (err) {
			console.error("Failed to load memory graph:", err)
		} finally {
			setLoading(false)
		}
	}, [searchQuery, filterType, showConnections])

	useEffect(() => {
		loadMemoryGraph()
	}, [loadMemoryGraph])

	// Handle messages from extension
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			switch (message.type) {
				case "memoryGraph":
					setMemoryGraph(message.graph)
					break
				case "memoryConnected":
					// Refresh graph after connection
					loadMemoryGraph()
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [loadMemoryGraph])

	const handleMemoryClick = useCallback(
		(memory: Memory) => {
			if (connectionMode && selectedForConnection) {
				if (selectedForConnection !== memory.id) {
					// Create connection
					vscode.postMessage({
						type: "linkMemories",
						sourceId: selectedForConnection,
						targetId: memory.id,
						relationship: "related",
					})
					setSelectedForConnection(null)
					setConnectionMode(false)
				}
			} else if (connectionMode) {
				setSelectedForConnection(memory.id)
			} else {
				setSelectedMemory(selectedMemory?.id === memory.id ? null : memory)
			}
		},
		[connectionMode, selectedForConnection, selectedMemory],
	)

	const handleDeleteConnection = useCallback(
		(sourceId: string, targetId: string) => {
			vscode.postMessage({
				type: "unlinkMemories",
				sourceId,
				targetId,
			})
			// Refresh graph
			setTimeout(() => loadMemoryGraph(), 500)
		},
		[loadMemoryGraph],
	)

	const renderMemoryNode = (memory: Memory, x: number, y: number, _index: number) => {
		const isSelected = selectedMemory?.id === memory.id
		const isConnectionCandidate = connectionMode && selectedForConnection === memory.id
		const nodeRadius = isSelected ? 25 : 20
		const color = memoryTypeColors[memory.type]

		return (
			<g key={memory.id} transform={`translate(${x}, ${y})`}>
				{/* Connection highlight */}
				{isConnectionCandidate && (
					<circle r={nodeRadius + 5} fill="none" stroke="#FFD700" strokeWidth="3" strokeDasharray="5,5">
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="0;360"
							dur="2s"
							repeatCount="indefinite"
						/>
					</circle>
				)}

				{/* Selection highlight */}
				{isSelected && <circle r={nodeRadius + 3} fill="none" stroke={color} strokeWidth="2" />}

				{/* Main node */}
				<circle
					r={nodeRadius}
					fill={color}
					stroke="white"
					strokeWidth="2"
					style={{ cursor: "pointer" }}
					onClick={() => handleMemoryClick(memory)}
				/>

				{/* Memory type indicator */}
				<text
					textAnchor="middle"
					dy="0.35em"
					fontSize="10"
					fill="white"
					fontWeight="bold"
					style={{ pointerEvents: "none" }}>
					{memory.type.charAt(0).toUpperCase()}
				</text>

				{/* Connection count badge */}
				{memory.connections.length > 0 && (
					<g transform={`translate(${nodeRadius - 5}, ${-nodeRadius + 5})`}>
						<circle r="8" fill="white" stroke={color} strokeWidth="1" />
						<text textAnchor="middle" dy="0.35em" fontSize="8" fill={color} fontWeight="bold">
							{memory.connections.length}
						</text>
					</g>
				)}
			</g>
		)
	}

	const renderConnection = (
		edge: MemoryConnection,
		sourcePos: { x: number; y: number },
		targetPos: { x: number; y: number },
	) => {
		const midX = (sourcePos.x + targetPos.x) / 2
		const midY = (sourcePos.y + targetPos.y) / 2

		return (
			<g key={`${edge.source}-${edge.target}`}>
				<line
					x1={sourcePos.x}
					y1={sourcePos.y}
					x2={targetPos.x}
					y2={targetPos.y}
					stroke="#6B7280"
					strokeWidth="2"
					opacity="0.6"
				/>

				{/* Connection strength indicator */}
				{edge.strength && <circle cx={midX} cy={midY} r="3" fill="#6B7280" opacity="0.8" />}

				{/* Delete connection button */}
				<circle
					cx={midX}
					cy={midY - 10}
					r="6"
					fill="white"
					stroke="#EF4444"
					strokeWidth="1"
					style={{ cursor: "pointer" }}
					onClick={() => handleDeleteConnection(edge.source, edge.target)}
				/>
				<text
					x={midX}
					y={midY - 10}
					textAnchor="middle"
					dy="0.35em"
					fontSize="8"
					fill="#EF4444"
					fontWeight="bold"
					style={{ pointerEvents: "none" }}>
					×
				</text>
			</g>
		)
	}

	const renderGraph = () => {
		if (memoryGraph.nodes.length === 0) {
			return (
				<div
					style={{
						height: "400px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "var(--vscode-descriptionForeground)",
						backgroundColor: "var(--vscode-input-background)",
						borderRadius: "8px",
					}}>
					<div style={{ textAlign: "center" }}>
						<Network size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
						<p>No memories found</p>
						{searchQuery && <p>Try adjusting your search criteria</p>}
					</div>
				</div>
			)
		}

		// Simple force-directed layout simulation
		const width = 800
		const height = 600
		const centerX = width / 2
		const centerY = height / 2

		// Position nodes in a circular layout for simplicity
		const nodePositions = memoryGraph.nodes.map((node, index) => {
			const angle = (2 * Math.PI * index) / memoryGraph.nodes.length
			const radius = Math.min(width, height) / 3
			return {
				id: node.id,
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			}
		})

		return (
			<div style={{ border: "1px solid var(--vscode-widget-border)", borderRadius: "8px", overflow: "hidden" }}>
				<svg
					ref={svgRef}
					width={width}
					height={height}
					style={{ backgroundColor: "var(--vscode-input-background)" }}>
					{/* Render connections first (behind nodes) */}
					{showConnections &&
						memoryGraph.edges.map((edge) => {
							const sourcePos = nodePositions.find((pos) => pos.id === edge.source)
							const targetPos = nodePositions.find((pos) => pos.id === edge.target)

							if (sourcePos && targetPos) {
								return renderConnection(edge, sourcePos, targetPos)
							}
							return null
						})}

					{/* Render nodes */}
					{memoryGraph.nodes.map((node, index) => {
						const pos = nodePositions[index]
						return renderMemoryNode(node, pos.x, pos.y, index)
					})}
				</svg>
			</div>
		)
	}

	const renderMemoryDetails = () => {
		if (!selectedMemory) return null

		return (
			<div
				style={{
					padding: "16px",
					backgroundColor: "var(--vscode-input-background)",
					borderRadius: "8px",
					border: `2px solid ${memoryTypeColors[selectedMemory.type]}`,
					marginTop: "16px",
				}}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "12px",
					}}>
					<h4 style={{ margin: 0, color: memoryTypeColors[selectedMemory.type] }}>
						{selectedMemory.type.charAt(0).toUpperCase() + selectedMemory.type.slice(1).replace("-", " ")}{" "}
						Memory
					</h4>
					<VSCodeButton appearance="icon" onClick={() => setSelectedMemory(null)}>
						<X size={16} />
					</VSCodeButton>
				</div>

				<div style={{ marginBottom: "12px" }}>
					<strong>Content:</strong>
					<p
						style={{
							margin: "4px 0",
							padding: "8px",
							backgroundColor: "var(--vscode-editor-background)",
							borderRadius: "4px",
							whiteSpace: "pre-wrap",
						}}>
						{selectedMemory.content}
					</p>
				</div>

				<div style={{ marginBottom: "8px" }}>
					<strong>Keywords:</strong> {selectedMemory.keywords.join(", ")}
				</div>

				<div style={{ marginBottom: "8px" }}>
					<strong>Tags:</strong> {selectedMemory.tags.join(", ")}
				</div>

				{selectedMemory.task_id && (
					<div style={{ marginBottom: "8px" }}>
						<strong>Task ID:</strong> {selectedMemory.task_id}
					</div>
				)}

				{selectedMemory.file_context.length > 0 && (
					<div style={{ marginBottom: "8px" }}>
						<strong>File Context:</strong> {selectedMemory.file_context.join(", ")}
					</div>
				)}

				<div style={{ marginBottom: "8px" }}>
					<strong>Connections:</strong> {selectedMemory.connections.length}
				</div>

				{selectedMemory.relevance_score && (
					<div style={{ marginBottom: "8px" }}>
						<strong>Relevance Score:</strong> {selectedMemory.relevance_score.toFixed(2)}
					</div>
				)}

				<div style={{ marginBottom: "8px", fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
					Created: {new Date(selectedMemory.timestamp).toLocaleString()}
				</div>

				<div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
					<VSCodeButton
						appearance="secondary"
						onClick={() => {
							vscode.postMessage({
								type: "getConnectedMemories",
								memoryId: selectedMemory!.id,
							})
						}}>
						<Eye size={16} style={{ marginRight: "4px" }} />
						View Connections
					</VSCodeButton>
				</div>
			</div>
		)
	}

	return (
		<div className="memory-explorer" style={{ padding: "16px", maxWidth: "1200px" }}>
			<div className="explorer-header" style={{ marginBottom: "24px" }}>
				<h2 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center" }}>
					<Network size={24} style={{ marginRight: "8px" }} />
					Memory Explorer
				</h2>

				<div
					style={{
						display: "flex",
						gap: "12px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "16px",
					}}>
					<VSCodeTextField
						placeholder="Search memories..."
						value={searchQuery}
						onInput={(e: any) => setSearchQuery(e.target.value)}
						style={{ minWidth: "250px" }}
					/>

					<VSCodeDropdown value={filterType} onInput={(e: any) => setFilterType(e.target.value)}>
						<VSCodeOption value="all">All Types</VSCodeOption>
						<VSCodeOption value="working">Working</VSCodeOption>
						<VSCodeOption value="short-term">Short-term</VSCodeOption>
						<VSCodeOption value="semantic">Semantic</VSCodeOption>
						<VSCodeOption value="procedural">Procedural</VSCodeOption>
						<VSCodeOption value="episodic">Episodic</VSCodeOption>
					</VSCodeDropdown>

					<label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
						<input
							type="checkbox"
							checked={showConnections}
							onChange={(e) => setShowConnections(e.target.checked)}
						/>
						Show Connections
					</label>

					<VSCodeButton
						appearance={connectionMode ? "primary" : "secondary"}
						onClick={() => {
							setConnectionMode(!connectionMode)
							setSelectedForConnection(null)
						}}>
						<Link2 size={16} style={{ marginRight: "4px" }} />
						{connectionMode ? "Exit Link Mode" : "Link Memories"}
					</VSCodeButton>

					<VSCodeButton appearance="secondary" onClick={loadMemoryGraph}>
						Refresh
					</VSCodeButton>
				</div>

				{connectionMode && (
					<div
						style={{
							padding: "12px",
							backgroundColor: "var(--vscode-input-background)",
							borderRadius: "6px",
							border: "1px solid #FFD700",
							marginBottom: "16px",
						}}>
						<p style={{ margin: "0", color: "#FFD700" }}>
							<Link2 size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
							Connection Mode: Click on two memories to link them together.
							{selectedForConnection && " Click on another memory to complete the connection."}
						</p>
					</div>
				)}
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: "48px", color: "var(--vscode-descriptionForeground)" }}>
					<Network size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
					<p>Loading memory graph...</p>
				</div>
			) : (
				<div>
					{renderGraph()}
					{renderMemoryDetails()}
				</div>
			)}

			<div
				style={{
					marginTop: "24px",
					padding: "16px",
					backgroundColor: "var(--vscode-input-background)",
					borderRadius: "8px",
				}}>
				<h4 style={{ margin: "0 0 8px 0" }}>Legend</h4>
				<div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "12px" }}>
					{Object.entries(memoryTypeColors).map(([type, color]) => (
						<div key={type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<div
								style={{
									width: "16px",
									height: "16px",
									backgroundColor: color,
									borderRadius: "50%",
								}}
							/>
							<span style={{ textTransform: "capitalize" }}>{type.replace("-", " ")}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
