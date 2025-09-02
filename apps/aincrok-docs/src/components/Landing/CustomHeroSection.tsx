import React from "react"
import { VSCODE_MARKETPLACE_URL, GITHUB_MAIN_REPO_URL } from "@site/src/constants"
import Icon from "../Icon"
import ScrollReveal from "./ScrollReveal"
import CodingAnimation from "./CodingAnimation"

export default function CustomHeroSection(): JSX.Element {
	return (
		<section className="landing-hero">
			<div className="landing-hero-content">
				{/* ATTENTION: Powerful hook with value proposition */}
				<div className="hero-badge fade-in">
					<Icon name="zap" size={14} color="#f4f4f5" />
					<span>AI-Powered VS Code Extension</span>
				</div>

				{/* ATTENTION: Problem-focused headline */}
				<h1 className="fade-in hero-headline">
					<div className="headline-content">
						Stop wasting money on
						<br />
						<span className="hero-gradient-text">expensive AI tokens.</span>
					</div>
				</h1>

				{/* INTEREST: Clear value proposition */}
				<p className="fade-in hero-subtitle">
					Aincrok reduces your AI coding costs while delivering precise, production-ready code. The smart
					alternative to ChatGPT, Claude, and GitHub Copilot for professional developers.
				</p>

				{/* INTEREST: Immediate credibility & value */}
				<div className="hero-credibility fade-in">
					<div className="credibility-item">
						<Icon name="zap" size={16} color="#4ade80" />
						<span>Quick setup</span>
					</div>
					<div className="credibility-item">
						<Icon name="shield" size={16} color="#4ade80" />
						<span>Free to start</span>
					</div>
					<div className="credibility-item">
						<Icon name="monitor" size={16} color="#4ade80" />
						<span>Built for VS Code</span>
					</div>
				</div>

				{/* DESIRE: Social proof through demonstration */}
				<ScrollReveal animation="scale" delay={400}>
					<div className="landing-hero-demo">
						<div className="demo-header">
							<Icon name="play" size={16} color="#4ade80" />
							<span>Watch Aincrok in action</span>
							<div className="demo-badge">Live Demo</div>
						</div>
						<CodingAnimation />
					</div>
				</ScrollReveal>

				{/* PRIMARY CTA: Above the fold, high contrast */}
				<div className="landing-hero-primary-cta fade-in">
					<a
						href={VSCODE_MARKETPLACE_URL}
						className="landing-btn landing-btn-primary hero-cta-primary hero-cta-large"
						target="_blank"
						rel="noopener noreferrer">
						<Icon name="rocket" size={18} color="#ffffff" />
						Install Free Extension
						<span className="cta-subtext">↓ Quick install</span>
					</a>
					<div className="hero-risk-reversal">
						<Icon name="check" size={14} color="#4ade80" />
						<span>No credit card • No signup required • Bring your own subscription/keys</span>
					</div>
				</div>

				{/* DESIRE: Core benefits */}
				<div className="hero-benefits fade-in">
					<div className="benefit-item">
						<div className="benefit-icon">
							<Icon name="zap" size={24} color="#4ade80" />
						</div>
						<div className="benefit-text">Efficient Token Usage</div>
						<div className="benefit-subtext">Smart context management</div>
					</div>
					<div className="benefit-item">
						<div className="benefit-icon">
							<Icon name="target" size={24} color="#4ade80" />
						</div>
						<div className="benefit-text">Precise Edits</div>
						<div className="benefit-subtext">Only change what's needed</div>
					</div>
					<div className="benefit-item">
						<div className="benefit-icon">
							<Icon name="layers" size={24} color="#4ade80" />
						</div>
						<div className="benefit-text">Multi-Provider</div>
						<div className="benefit-subtext">Works with any AI model</div>
					</div>
				</div>

				{/* ACTION: Secondary CTA for different user types */}
				<div className="landing-hero-secondary-actions fade-in">
					<div className="secondary-cta-group">
						<a href="/docs/getting-started/installing" className="hero-link-secondary">
							<Icon name="book" size={16} color="#e4e4e7" />
							Quick Start Guide
						</a>
						<a
							href={GITHUB_MAIN_REPO_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="hero-link-secondary">
							<Icon name="github" size={16} color="#e4e4e7" />
							View Source Code
						</a>
						<a href="#" className="hero-link-secondary">
							<Icon name="users" size={16} color="#e4e4e7" />
							Join Community
						</a>
					</div>
					<div className="hero-install-alternative">
						<span className="install-text">Or install via command line:</span>
						<div className="hero-install-command">
							<code>ext install aincrok.aincrok</code>
							<button className="copy-button" title="Copy to clipboard">
								<Icon name="copy" size={14} color="#e4e4e7" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
