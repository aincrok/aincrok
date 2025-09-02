import React from "react"
import {
	GITHUB_MAIN_REPO_URL,
	DISCORD_URL,
	REDDIT_URL,
	TWITTER_URL,
	VSCODE_MARKETPLACE_URL,
	OPEN_VSX_URL,
	CONTACT_EMAIL,
} from "@site/src/constants"
import Icon from "../Icon"

export default function CustomFooter(): JSX.Element {
	return (
		<footer className="landing-footer">
			<div className="landing-footer-content">
				<div className="landing-footer-grid">
					<div className="landing-footer-section">
						<h4>Product</h4>
						<ul className="landing-footer-links">
							<li>
								<a href="/docs/getting-started/installing">Getting Started</a>
							</li>
							<li>
								<a href="/docs/features">Features</a>
							</li>
							<li>
								<a href="/docs/providers">AI Providers</a>
							</li>
							<li>
								<a href="/docs/features/mcp">MCP Support</a>
							</li>
						</ul>
					</div>

					<div className="landing-footer-section">
						<h4>Documentation</h4>
						<ul className="landing-footer-links">
							<li>
								<a href="/docs">Overview</a>
							</li>
							<li>
								<a href="/docs/basic-usage">Basic Usage</a>
							</li>
							<li>
								<a href="/docs/advanced-usage">Advanced Usage</a>
							</li>
							<li>
								<a href="/docs/faq">FAQ</a>
							</li>
						</ul>
					</div>

					<div className="landing-footer-section">
						<h4>Community</h4>
						<ul className="landing-footer-links">
							<li>
								<a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
									Discord
								</a>
							</li>
							<li>
								<a href={REDDIT_URL} target="_blank" rel="noopener noreferrer">
									Reddit
								</a>
							</li>
							<li>
								<a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">
									Twitter
								</a>
							</li>
							<li>
								<a href={GITHUB_MAIN_REPO_URL} target="_blank" rel="noopener noreferrer">
									GitHub
								</a>
							</li>
						</ul>
					</div>

					<div className="landing-footer-section">
						<h4>Download</h4>
						<ul className="landing-footer-links">
							<li>
								<a href={VSCODE_MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
									VS Code Marketplace
								</a>
							</li>
							<li>
								<a href={OPEN_VSX_URL} target="_blank" rel="noopener noreferrer">
									Open VSX Registry
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="landing-footer-bottom">
					<p>
						Built with <Icon name="heart" size={16} color="#f4f4f5" /> for developers.
					</p>
					<p>
						Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
					</p>
				</div>
			</div>
		</footer>
	)
}
