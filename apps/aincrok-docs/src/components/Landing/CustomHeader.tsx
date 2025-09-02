import React from "react"
import { GITHUB_MAIN_REPO_URL, VSCODE_MARKETPLACE_URL } from "@site/src/constants"
import Icon from "../Icon"

export default function CustomHeader(): JSX.Element {
	return (
		<header className="landing-header">
			<nav className="landing-nav">
				<a href="/" className="landing-logo">
					<img src="/img/aincrok-logo-white.svg" alt="Aincrok" />
					Aincrok
				</a>

				<ul className="landing-nav-links">
					<li>
						<a href="#features" className="landing-nav-link">
							Features
						</a>
					</li>
					<li>
						<a href="/docs" className="landing-nav-link">
							Documentation
						</a>
					</li>
					<li>
						<a
							href={GITHUB_MAIN_REPO_URL}
							className="landing-nav-link"
							target="_blank"
							rel="noopener noreferrer">
							GitHub
						</a>
					</li>
					<li>
						<a href="/docs/getting-started/installing" className="landing-nav-link">
							Get Started
						</a>
					</li>
				</ul>

				<div className="landing-nav-cta">
					<a
						href={VSCODE_MARKETPLACE_URL}
						className="landing-btn landing-btn-primary"
						target="_blank"
						rel="noopener noreferrer">
						<Icon name="package" size={16} color="#f4f4f5" />
						Install Extension
					</a>
				</div>
			</nav>
		</header>
	)
}
