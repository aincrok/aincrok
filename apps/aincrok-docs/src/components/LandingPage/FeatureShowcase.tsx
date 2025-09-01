import React from "react"
import Link from "@docusaurus/Link"
import { FeatureExploreTracker, ConversionTracker } from "../Analytics"
import styles from "./FeatureShowcase.module.css"

interface Feature {
	id: string
	title: string
	description: string
	icon: string
	link: string
	benefits: string[]
	gradient: string
}

const features: Feature[] = [
	{
		id: "ai-providers",
		title: "20+ AI Providers",
		description: "Connect to any AI service including OpenAI, Anthropic, Google, Ollama, and more",
		icon: "🤝",
		link: "/basic-usage/connecting-providers",
		benefits: ["No vendor lock-in", "Best model for each task", "Fallback options"],
		gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	},
	{
		id: "smart-tools",
		title: "Intelligent Tool System",
		description: "Advanced tools for code analysis, file operations, terminal commands, and more",
		icon: "🛠️",
		link: "/features/tools/tool-use-overview",
		benefits: ["Context-aware actions", "Safe execution", "Extensible framework"],
		gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
	},
	{
		id: "task-management",
		title: "Task Orchestration",
		description: "Break down complex projects into manageable subtasks with specialized modes",
		icon: "📋",
		link: "/basic-usage/orchestrator-mode",
		benefits: ["Complex workflow support", "Mode specialization", "Progress tracking"],
		gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
	},
	{
		id: "mcp-integration",
		title: "MCP Integration",
		description: "Extend capabilities with Model Context Protocol servers for unlimited possibilities",
		icon: "🔌",
		link: "/features/mcp/overview",
		benefits: ["Unlimited extensibility", "Third-party integrations", "Custom workflows"],
		gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
	},
	{
		id: "browser-automation",
		title: "Browser Automation",
		description: "Automate web interactions and testing with built-in browser capabilities",
		icon: "🌐",
		link: "/features/browser-use",
		benefits: ["Web scraping", "UI testing", "Automated workflows"],
		gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
	},
	{
		id: "custom-modes",
		title: "Custom Modes",
		description: "Create specialized AI assistants tailored to your specific workflows and needs",
		icon: "⚙️",
		link: "/features/custom-modes",
		benefits: ["Personalized AI behavior", "Domain expertise", "Workflow optimization"],
		gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
	},
]

export const FeatureShowcase: React.FC = () => {
	return (
		<section className={styles.showcaseContainer}>
			<div className={styles.showcaseHeader}>
				<h2 className={styles.showcaseTitle}>Powerful Features for Modern Development</h2>
				<p className={styles.showcaseSubtitle}>
					Everything you need to supercharge your coding workflow with AI
				</p>
			</div>

			<div className={styles.featuresGrid}>
				{features.map((feature) => (
					<FeatureExploreTracker key={feature.id} featureName={feature.title} className={styles.featureCard}>
						<div className={styles.featureHeader} style={{ background: feature.gradient }}>
							<span className={styles.featureIcon}>{feature.icon}</span>
							<h3 className={styles.featureTitle}>{feature.title}</h3>
						</div>

						<div className={styles.featureContent}>
							<p className={styles.featureDescription}>{feature.description}</p>

							<ul className={styles.benefitsList}>
								{feature.benefits.map((benefit, index) => (
									<li key={index} className={styles.benefitItem}>
										<span className={styles.benefitCheck}>✓</span>
										{benefit}
									</li>
								))}
							</ul>

							<ConversionTracker
								conversionType="feature_exploration"
								triggerOn="click"
								className={styles.featureLink}>
								<Link to={feature.link} className={styles.learnMore}>
									Learn More →
								</Link>
							</ConversionTracker>
						</div>
					</FeatureExploreTracker>
				))}
			</div>

			<div className={styles.showcaseFooter}>
				<ConversionTracker conversionType="feature_overview_complete" triggerOn="view" scrollThreshold={80}>
					<h3 className={styles.footerTitle}>Ready to transform your coding experience?</h3>
					<p className={styles.footerDescription}>
						Join thousands of developers already using Aincrok to code faster and smarter
					</p>
					<div className={styles.footerActions}>
						<Link to="/getting-started/installing" className={`${styles.footerButton} ${styles.primary}`}>
							Get Started Now
						</Link>
						<Link
							to="/features/tools/tool-use-overview"
							className={`${styles.footerButton} ${styles.secondary}`}>
							Explore All Features
						</Link>
					</div>
				</ConversionTracker>
			</div>
		</section>
	)
}
