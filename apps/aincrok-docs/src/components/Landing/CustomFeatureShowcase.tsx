import React from "react"
import Icon from "../Icon"
import ScrollReveal from "./ScrollReveal"

const features = [
	{
		icon: "feather",
		title: "LSP Integration",
		description:
			"Precise file operations and symbol-level edits eliminate incorrect discoveries and reduce token usage by up to 70%.",
	},
	{
		icon: "brain",
		title: "Memory Layer & Knowledge Base",
		description:
			"Multi-level persistent memory for context-aware sessions, minimizing repeated API calls and hallucinations.",
	},
	{
		icon: "dollar-sign",
		title: "API Call Optimization",
		description: "Batching, local fallbacks, and throttling cut costs by 30-50% compared to competitors.",
	},
	{
		icon: "zap",
		title: "Advanced Prompt Caching",
		description: "Reuse responses for faster, cheaper interactions with intelligent context management.",
	},
	{
		icon: "target",
		title: "Precise Edits Mode",
		description: "Avoid unintended changes and whole-file rewrites using targeted LSP diffs.",
	},
	{
		icon: "refresh-cw",
		title: "Enhanced Stability",
		description: "Robust error handling, retries, and logging outperform competitors in reliability.",
	},
]

const comparisonFeatures = [
	{
		feature: "Cost Efficiency",
		aincrok: "Precise context management",
		github_copilot: "Fixed subscription",
		chatgpt: "High token usage",
		claude: "Expensive API calls",
	},
	{
		feature: "Multi-File Editing",
		aincrok: true,
		github_copilot: false,
		chatgpt: false,
		claude: "Limited via web",
	},
	{
		feature: "Local Model Support",
		aincrok: "Full Ollama/local support",
		github_copilot: false,
		chatgpt: false,
		claude: false,
	},
	{
		feature: "Provider Flexibility",
		aincrok: "OpenAI, Anthropic, Google+",
		github_copilot: "GitHub only",
		chatgpt: "OpenAI only",
		claude: "Anthropic only",
	},
	{
		feature: "VS Code Integration",
		aincrok: "Native extension",
		github_copilot: "Native extension",
		chatgpt: "Web-based",
		claude: "Web-based",
	},
	{
		feature: "Conversation History",
		aincrok: "Persistent across sessions",
		github_copilot: "Chat limited",
		chatgpt: "Web session only",
		claude: "Web session only",
	},
	{
		feature: "Terminal Integration",
		aincrok: true,
		github_copilot: false,
		chatgpt: false,
		claude: false,
	},
	{
		feature: "Open Source",
		aincrok: "Apache 2.0 license",
		github_copilot: false,
		chatgpt: false,
		claude: false,
	},
]

export default function CustomFeatureShowcase(): JSX.Element {
	return (
		<section id="features" className="landing-features">
			<div className="landing-features-content">
				<ScrollReveal animation="fade-up">
					<h2>Built for Developer Productivity</h2>
					<p className="landing-features-subtitle">
						Aincrok addresses common pain points in AI coding tools: token waste, imprecise edits, and
						unreliable outputs. Focus on code quality, not AI costs.
					</p>
				</ScrollReveal>

				<div className="landing-features-grid">
					{features.map((feature, index) => (
						<ScrollReveal key={index} animation="stagger" delay={index * 100}>
							<div className="landing-feature-card">
								<div className="landing-feature-icon">
									<Icon name={feature.icon} size={24} color="#f4f4f5" />
								</div>
								<h3>{feature.title}</h3>
								<p>{feature.description}</p>
							</div>
						</ScrollReveal>
					))}
				</div>

				{/* Comparison Table */}
				<ScrollReveal animation="fade-up">
					<div className="landing-comparison">
						<h3>Why Developers Choose Aincrok</h3>
						<p className="comparison-subtitle">
							Compare Aincrok with popular AI coding solutions used by developers worldwide
						</p>
						<div className="comparison-table">
							<div className="comparison-header">
								<div className="comparison-cell feature-col">Feature</div>
								<div className="comparison-cell aincrok-col">
									<Icon name="zap" size={16} color="#22c55e" />
									Aincrok
								</div>
								<div className="comparison-cell competitor-col">GitHub Copilot</div>
								<div className="comparison-cell competitor-col">ChatGPT</div>
								<div className="comparison-cell competitor-col">Claude</div>
							</div>
							{comparisonFeatures.map((item, index) => (
								<div key={index} className="comparison-row">
									<div className="comparison-cell feature-col">{item.feature}</div>
									<div className="comparison-cell aincrok-col advantage">
										{item.aincrok === true ? (
											<div className="check-mark">
												<Icon name="check" size={16} color="#22c55e" />
											</div>
										) : (
											item.aincrok
										)}
									</div>
									<div className="comparison-cell competitor-col">
										{item.github_copilot === true ? (
											<div className="check-mark">
												<Icon name="check" size={16} color="#6b7280" />
											</div>
										) : item.github_copilot === false ? (
											<div className="x-mark">
												<Icon name="x" size={16} color="#ef4444" />
											</div>
										) : (
											item.github_copilot
										)}
									</div>
									<div className="comparison-cell competitor-col">
										{item.chatgpt === true ? (
											<div className="check-mark">
												<Icon name="check" size={16} color="#6b7280" />
											</div>
										) : item.chatgpt === false ? (
											<div className="x-mark">
												<Icon name="x" size={16} color="#ef4444" />
											</div>
										) : (
											item.chatgpt
										)}
									</div>
									<div className="comparison-cell competitor-col">
										{item.claude === true ? (
											<div className="check-mark">
												<Icon name="check" size={16} color="#6b7280" />
											</div>
										) : item.claude === false ? (
											<div className="x-mark">
												<Icon name="x" size={16} color="#ef4444" />
											</div>
										) : (
											item.claude
										)}
									</div>
								</div>
							))}
						</div>
						<div className="comparison-note">
							<Icon name="info" size={16} color="#6b7280" />
							<span>Comparison based on publicly available features as of September 2025</span>
						</div>
					</div>
				</ScrollReveal>

				{/* Call to Action */}
				<ScrollReveal animation="scale">
					<div className="landing-cta-section">
						<h3>Install from VS Code Marketplace</h3>
						<p>
							Join developers using Aincrok to reduce AI costs while maintaining code quality. Available
							now in the VS Code extension marketplace.
						</p>
						<div className="landing-hero-actions">
							<a href="/docs/getting-started/installing" className="landing-btn landing-btn-primary">
								<Icon name="rocket" size={16} color="#f4f4f5" />
								Quick Start Guide
							</a>
							<a href="/docs" className="landing-btn landing-btn-secondary">
								<Icon name="book" size={16} color="#e4e4e7" />
								Browse Documentation
							</a>
						</div>
					</div>
				</ScrollReveal>
			</div>
		</section>
	)
}
