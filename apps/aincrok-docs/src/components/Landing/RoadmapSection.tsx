import React from "react"
import Icon from "../Icon"
import ScrollReveal from "./ScrollReveal"

const roadmapItems = [
	{
		status: "current",
		title: "Core Foundation",
		timeframe: "Available Now",
		features: [
			"Multi-provider AI support (OpenAI, Anthropic, Google)",
			"Autonomous multi-file editing",
			"Persistent conversation history",
			"Terminal integration",
			"Template system",
		],
	},
	{
		status: "next",
		title: "Cost & Efficiency Optimization",
		timeframe: "Phase 1",
		features: [
			"LSP Integration for precise file operations",
			"Advanced prompt caching system",
			"API call optimization with batching",
			"Memory layer & knowledge base",
			"Hassle-free system prompt customization",
		],
	},
	{
		status: "upcoming",
		title: "Advanced Intelligence",
		timeframe: "Phase 2",
		features: [
			"Remote control & monitoring from mobile",
			"Enhanced multi-agent & subtask system",
			"Precise edits mode with LSP diffs",
			"RAG-like context for large codebases",
			"Human-in-the-loop approval tools",
		],
	},
]

const getStatusInfo = (status: string) => {
	switch (status) {
		case "current":
			return { icon: "check", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" }
		case "next":
			return { icon: "zap", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)" }
		case "upcoming":
			return { icon: "clock", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" }
		case "future":
			return { icon: "star", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.1)" }
		default:
			return { icon: "circle", color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.1)" }
	}
}

export default function RoadmapSection(): JSX.Element {
	return (
		<section id="roadmap" className="landing-roadmap">
			<div className="landing-roadmap-content">
				<ScrollReveal animation="fade-up">
					<h2>Development Roadmap</h2>
					<p className="landing-roadmap-subtitle">
						Our transparent roadmap shows what's available today and what's coming next. Built with
						community feedback to solve real developer pain points.
					</p>
				</ScrollReveal>

				<div className="roadmap-timeline">
					{roadmapItems.map((item, index) => {
						const statusInfo = getStatusInfo(item.status)
						return (
							<ScrollReveal key={index} animation="stagger" delay={index * 150}>
								<div className={`roadmap-item ${item.status}`}>
									<div className="roadmap-marker">
										<div className="roadmap-icon" style={{ backgroundColor: statusInfo.bgColor }}>
											<Icon name={statusInfo.icon as any} size={16} color={statusInfo.color} />
										</div>
										{index < roadmapItems.length - 1 && <div className="roadmap-line" />}
									</div>

									<div className="roadmap-content">
										<div className="roadmap-header">
											<h3>{item.title}</h3>
											<span className="roadmap-timeframe" style={{ color: statusInfo.color }}>
												{item.timeframe}
											</span>
										</div>

										<ul className="roadmap-features">
											{item.features.map((feature, featureIndex) => (
												<li key={featureIndex}>
													<Icon name="arrow-right" size={14} color="#6b7280" />
													{feature}
												</li>
											))}
										</ul>
									</div>
								</div>
							</ScrollReveal>
						)
					})}
				</div>

				<ScrollReveal animation="fade-up">
					<div className="roadmap-cta">
						<p>Want to influence our roadmap? Join our community and share your feedback.</p>
						<div className="roadmap-actions">
							<a
								href="https://github.com/aincrok/aincrok/issues"
								target="_blank"
								rel="noopener noreferrer"
								className="landing-btn landing-btn-secondary">
								<Icon name="github" size={16} color="#e4e4e7" />
								Request Features
							</a>
							<a
								href="https://discord.gg/yeYsX7cZUr"
								target="_blank"
								rel="noopener noreferrer"
								className="landing-btn landing-btn-secondary">
								<Icon name="message-circle" size={16} color="#e4e4e7" />
								Join Discord
							</a>
						</div>
					</div>
				</ScrollReveal>
			</div>
		</section>
	)
}
