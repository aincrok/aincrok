// aincrok_change - new file
// Memory analytics and insights dashboard

import React, { useState, useEffect, useCallback } from "react"
import { BarChart3, PieChart, TrendingUp, Brain, Clock, Target, Activity, Zap } from "lucide-react"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"

interface MemoryInsights {
	tokenReductionPercentage: number
	averageRelevanceScore: number
	memoryTypeDistribution: Record<string, number>
	topKeywords: Array<{ keyword: string; count: number }>
	retrievalEfficiency: {
		averageRetrievalTime: number
		cacheHitRate: number
		searchAccuracy: number
	}
	temporalDistribution: {
		last24Hours: number
		lastWeek: number
		lastMonth: number
		older: number
	}
	qualityMetrics: {
		averageMemoryLength: number
		connectionDensity: number
		duplicateRate: number
	}
	usagePatterns: {
		mostActiveHours: number[]
		peakUsageDays: string[]
		averageSessionMemories: number
	}
}

const memoryTypeColors = {
	"short-term": "#3B82F6",
	working: "#EF4444",
	episodic: "#10B981",
	semantic: "#8B5CF6",
	procedural: "#F59E0B",
}

export default function MemoryInsights() {
	const { t: _t } = useAppTranslation()
	const [insights, setInsights] = useState<MemoryInsights | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "all">("week")

	const loadInsights = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			vscode.postMessage({
				type: "getMemoryInsights",
				timeRange,
			})
		} catch (_err) {
			setError("Failed to load memory insights")
		} finally {
			setLoading(false)
		}
	}, [timeRange])

	useEffect(() => {
		loadInsights()

		// Refresh insights every 5 minutes
		const interval = setInterval(loadInsights, 300000)
		return () => clearInterval(interval)
	}, [loadInsights])

	// Handle messages from extension
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			switch (message.type) {
				case "memoryInsights":
					setInsights(message.insights)
					setLoading(false)
					break
				case "error":
					setError(message.message)
					setLoading(false)
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	const renderMetricCard = (
		title: string,
		value: string | number,
		icon: React.ReactNode,
		subtitle?: string,
		color?: string,
	) => (
		<div
			className="metric-card"
			style={{
				padding: "16px",
				backgroundColor: "var(--vscode-input-background)",
				borderRadius: "8px",
				border: color ? `2px solid ${color}` : "1px solid var(--vscode-widget-border)",
				textAlign: "center",
			}}>
			<div style={{ marginBottom: "8px", color: color || "var(--vscode-foreground)" }}>{icon}</div>
			<div
				style={{
					fontSize: "24px",
					fontWeight: "bold",
					marginBottom: "4px",
					color: color || "var(--vscode-foreground)",
				}}>
				{value}
			</div>
			<div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{title}</div>
			{subtitle && (
				<div style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>{subtitle}</div>
			)}
		</div>
	)

	const renderMemoryTypeChart = () => {
		if (!insights) return null

		const total = Object.values(insights.memoryTypeDistribution).reduce((sum, count) => sum + count, 0)
		if (total === 0) return null

		return (
			<div className="memory-type-chart" style={{ marginBottom: "24px" }}>
				<h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
					<PieChart size={20} style={{ marginRight: "8px" }} />
					Memory Type Distribution
				</h3>

				<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
					{Object.entries(insights.memoryTypeDistribution).map(([type, count]) => {
						const percentage = ((count / total) * 100).toFixed(1)
						const color = memoryTypeColors[type as keyof typeof memoryTypeColors] || "#6B7280"

						return (
							<div key={type} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
								<div
									style={{
										width: "16px",
										height: "16px",
										backgroundColor: color,
										borderRadius: "2px",
									}}
								/>
								<div
									style={{
										flex: 1,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<span style={{ textTransform: "capitalize", fontWeight: "500" }}>
										{type.replace("-", " ")}
									</span>
									<span style={{ color: "var(--vscode-descriptionForeground)" }}>
										{count} ({percentage}%)
									</span>
								</div>
								<div
									style={{
										flex: 2,
										height: "8px",
										backgroundColor: "var(--vscode-input-background)",
										borderRadius: "4px",
										overflow: "hidden",
									}}>
									<div
										style={{
											width: `${percentage}%`,
											height: "100%",
											backgroundColor: color,
											transition: "width 0.3s ease",
										}}
									/>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	const renderTopKeywords = () => {
		if (!insights?.topKeywords) return null

		return (
			<div className="top-keywords" style={{ marginBottom: "24px" }}>
				<h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
					<Target size={20} style={{ marginRight: "8px" }} />
					Most Used Keywords
				</h3>

				<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
					{insights.topKeywords.slice(0, 20).map(({ keyword, count }, index) => (
						<span
							key={keyword}
							style={{
								padding: "6px 12px",
								backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 45%)`,
								color: "white",
								borderRadius: "16px",
								fontSize: "12px",
								fontWeight: "500",
								display: "flex",
								alignItems: "center",
								gap: "4px",
							}}>
							{keyword}
							<span
								style={{
									backgroundColor: "rgba(255, 255, 255, 0.3)",
									borderRadius: "8px",
									padding: "2px 6px",
									fontSize: "10px",
								}}>
								{count}
							</span>
						</span>
					))}
				</div>
			</div>
		)
	}

	const renderTemporalDistribution = () => {
		if (!insights?.temporalDistribution) return null

		const { last24Hours, lastWeek, lastMonth, older } = insights.temporalDistribution
		const total = last24Hours + lastWeek + lastMonth + older

		if (total === 0) return null

		return (
			<div className="temporal-distribution" style={{ marginBottom: "24px" }}>
				<h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
					<Clock size={20} style={{ marginRight: "8px" }} />
					Memory Age Distribution
				</h3>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
						gap: "12px",
					}}>
					{[
						{ label: "Last 24h", count: last24Hours, color: "#10B981" },
						{ label: "Last Week", count: lastWeek, color: "#3B82F6" },
						{ label: "Last Month", count: lastMonth, color: "#F59E0B" },
						{ label: "Older", count: older, color: "#6B7280" },
					].map(({ label, count, color }) => (
						<div
							key={label}
							style={{
								padding: "12px",
								backgroundColor: "var(--vscode-input-background)",
								borderRadius: "6px",
								textAlign: "center",
								border: `2px solid ${color}`,
							}}>
							<div style={{ fontSize: "20px", fontWeight: "bold", color, marginBottom: "4px" }}>
								{count}
							</div>
							<div style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
								{label}
							</div>
							<div style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
								({total > 0 ? ((count / total) * 100).toFixed(1) : "0"}%)
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<div style={{ padding: "24px", textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
				<Brain size={32} style={{ marginBottom: "16px" }} />
				<p>Loading memory insights...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div style={{ padding: "24px", textAlign: "center", color: "#EF4444" }}>
				<p>{error}</p>
				<button onClick={loadInsights} style={{ marginTop: "12px", padding: "8px 16px" }}>
					Retry
				</button>
			</div>
		)
	}

	if (!insights) {
		return (
			<div style={{ padding: "24px", textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>
				<p>No insights available</p>
			</div>
		)
	}

	return (
		<div className="memory-insights" style={{ padding: "16px", maxWidth: "1200px" }}>
			<div className="insights-header" style={{ marginBottom: "32px" }}>
				<h2 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center" }}>
					<BarChart3 size={24} style={{ marginRight: "8px" }} />
					Memory System Insights
				</h2>

				<div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
					{(["day", "week", "month", "all"] as const).map((range) => (
						<button
							key={range}
							onClick={() => setTimeRange(range)}
							style={{
								padding: "6px 12px",
								backgroundColor:
									timeRange === range
										? "var(--vscode-button-background)"
										: "var(--vscode-input-background)",
								color:
									timeRange === range
										? "var(--vscode-button-foreground)"
										: "var(--vscode-foreground)",
								border: "1px solid var(--vscode-widget-border)",
								borderRadius: "4px",
								cursor: "pointer",
								textTransform: "capitalize",
							}}>
							{range === "all" ? "All Time" : `Last ${range}`}
						</button>
					))}
				</div>
			</div>

			{/* Key Metrics */}
			<div
				className="key-metrics"
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: "16px",
					marginBottom: "32px",
				}}>
				{renderMetricCard(
					"Token Reduction",
					`${insights.tokenReductionPercentage.toFixed(1)}%`,
					<Zap size={24} />,
					"vs full context",
					"#10B981",
				)}

				{renderMetricCard(
					"Avg Relevance",
					insights.averageRelevanceScore.toFixed(2),
					<Target size={24} />,
					"search quality",
					"#3B82F6",
				)}

				{renderMetricCard(
					"Retrieval Time",
					`${insights.retrievalEfficiency.averageRetrievalTime.toFixed(1)}ms`,
					<Activity size={24} />,
					"average speed",
					"#8B5CF6",
				)}

				{renderMetricCard(
					"Cache Hit Rate",
					`${(insights.retrievalEfficiency.cacheHitRate * 100).toFixed(1)}%`,
					<TrendingUp size={24} />,
					"efficiency",
					"#F59E0B",
				)}
			</div>

			{/* Charts and Distributions */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
				<div>
					{renderMemoryTypeChart()}
					{renderTopKeywords()}
				</div>

				<div>
					{renderTemporalDistribution()}

					<div className="quality-metrics" style={{ marginBottom: "24px" }}>
						<h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
							<Brain size={20} style={{ marginRight: "8px" }} />
							Quality Metrics
						</h3>

						<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "8px",
									backgroundColor: "var(--vscode-input-background)",
									borderRadius: "4px",
								}}>
								<span>Average Memory Length</span>
								<span style={{ fontWeight: "bold" }}>
									{insights.qualityMetrics.averageMemoryLength} chars
								</span>
							</div>

							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "8px",
									backgroundColor: "var(--vscode-input-background)",
									borderRadius: "4px",
								}}>
								<span>Connection Density</span>
								<span style={{ fontWeight: "bold" }}>
									{insights.qualityMetrics.connectionDensity.toFixed(2)}
								</span>
							</div>

							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "8px",
									backgroundColor: "var(--vscode-input-background)",
									borderRadius: "4px",
								}}>
								<span>Duplicate Rate</span>
								<span
									style={{
										fontWeight: "bold",
										color: insights.qualityMetrics.duplicateRate > 0.1 ? "#EF4444" : "#10B981",
									}}>
									{(insights.qualityMetrics.duplicateRate * 100).toFixed(1)}%
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
