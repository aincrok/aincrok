import React from "react"
import Link from "@docusaurus/Link"
import { HeroEngagementTracker, CTATracker, ABTestComponent } from "../Analytics"
import { VSCODE_MARKETPLACE_URL, GITHUB_MAIN_REPO_URL } from "../../constants"
import styles from "./HeroSection.module.css"

export const HeroSection: React.FC = () => {
	return (
		<HeroEngagementTracker className={styles.heroContainer}>
			<div className={styles.heroContent}>
				<div className={styles.logoContainer}>
					<img src="/docs/img/aincrok-logo.png" alt="Aincrok Logo" className={styles.logo} />
				</div>

				<h1 className={styles.heroTitle}>Aincrok: AI-Powered Coding Assistant</h1>

				<ABTestComponent
					testId="hero-subtitle"
					variants={{
						focused: (
							<p className={styles.heroSubtitle}>
								Transform your coding workflow with intelligent AI assistance. Write better code faster
								with context-aware suggestions and automated tasks.
							</p>
						),
						comprehensive: (
							<p className={styles.heroSubtitle}>
								The ultimate VS Code extension for AI-powered development. From code generation to
								debugging, refactoring to documentation - accelerate every aspect of your coding
								journey.
							</p>
						),
					}}
				/>

				<div className={styles.ctaContainer}>
					<CTATracker
						href={VSCODE_MARKETPLACE_URL}
						conversionValue={100}
						className={`${styles.ctaButton} ${styles.primary}`}>
						<svg className={styles.ctaIcon} viewBox="0 0 24 24" fill="currentColor">
							<path d="M21.29 4.1L20.92 3.73C20.82 3.63 20.7 3.59 20.58 3.59S20.34 3.63 20.24 3.73L12 12L3.76 3.73C3.66 3.63 3.54 3.59 3.42 3.59S3.18 3.63 3.08 3.73L2.71 4.1C2.61 4.2 2.57 4.32 2.57 4.44S2.61 4.68 2.71 4.78L11.56 13.66C11.66 13.76 11.78 13.8 11.9 13.8S12.14 13.76 12.24 13.66L21.09 4.78C21.19 4.68 21.23 4.56 21.23 4.44S21.19 4.2 21.09 4.1H21.29Z" />
						</svg>
						Install Extension
					</CTATracker>

					<CTATracker
						href={GITHUB_MAIN_REPO_URL}
						conversionValue={50}
						className={`${styles.ctaButton} ${styles.secondary}`}>
						<svg className={styles.ctaIcon} viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
						</svg>
						View on GitHub
					</CTATracker>
				</div>

				<div className={styles.quickStats}>
					<div className={styles.stat}>
						<span className={styles.statNumber}>50K+</span>
						<span className={styles.statLabel}>Downloads</span>
					</div>
					<div className={styles.stat}>
						<span className={styles.statNumber}>4.8★</span>
						<span className={styles.statLabel}>Rating</span>
					</div>
					<div className={styles.stat}>
						<span className={styles.statNumber}>20+</span>
						<span className={styles.statLabel}>AI Providers</span>
					</div>
				</div>
			</div>
		</HeroEngagementTracker>
	)
}
