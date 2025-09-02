import React from "react"
import Head from "@docusaurus/Head"
import { PostHogProvider } from "@site/src/components/Analytics"
import CustomHeader from "@site/src/components/Landing/CustomHeader"
import CustomHeroSection from "@site/src/components/Landing/CustomHeroSection"
import CustomFeatureShowcase from "@site/src/components/Landing/CustomFeatureShowcase"
import RoadmapSection from "@site/src/components/Landing/RoadmapSection"
import InteractiveBackground from "@site/src/components/Landing/InteractiveBackground"
import CustomFooter from "@site/src/components/Landing/CustomFooter"
import "@site/src/css/landing.css"

export default function LandingPage(): JSX.Element {
	return (
		<PostHogProvider>
			<Head>
				<title>Aincrok - Cost-Effective AI Code Assistant | Reduce Token Usage by 70%</title>
				<meta
					name="description"
					content="Open-source AI coding assistant for VS Code. Multi-provider support, precise edits, persistent memory. Alternative to GitHub Copilot, ChatGPT, and Claude with 70% lower token costs."
				/>
				<meta
					name="keywords"
					content="AI code assistant, VS Code extension, OpenAI, Anthropic, GitHub Copilot alternative, coding automation, developer tools, LSP integration, multi-file editing, token optimization"
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />

				{/* Open Graph / Social Media */}
				<meta property="og:type" content="website" />
				<meta property="og:title" content="Aincrok - Cost-Effective AI Code Assistant" />
				<meta
					property="og:description"
					content="Open-source AI coding assistant for VS Code. Reduce AI token costs by 70% with precise context management and multi-provider support."
				/>
				<meta property="og:url" content="https://aincrok.dev" />
				<meta property="og:site_name" content="Aincrok" />

				{/* Twitter */}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content="Aincrok - Cost-Effective AI Code Assistant" />
				<meta
					name="twitter:description"
					content="Open-source AI coding assistant for VS Code. Reduce AI token costs by 70% with precise context management."
				/>

				{/* Technical SEO */}
				<meta
					name="robots"
					content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
				/>
				<link rel="canonical" href="https://aincrok.dev" />
				<meta name="author" content="Aincrok Team" />
				<meta name="publisher" content="Aincrok" />

				{/* Structured Data */}
				<script type="application/ld+json">
					{JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						name: "Aincrok",
						description:
							"Cost-effective AI code assistant for VS Code with multi-provider support and 70% token savings",
						url: "https://aincrok.dev",
						applicationCategory: "DeveloperApplication",
						operatingSystem: "Windows, macOS, Linux",
						offers: {
							"@type": "Offer",
							price: "0",
							priceCurrency: "USD",
						},
						author: {
							"@type": "Organization",
							name: "Aincrok",
						},
						downloadUrl: "https://marketplace.visualstudio.com/items?itemName=aincrok.aincrok",
						softwareVersion: "1.0.0",
						aggregateRating: {
							"@type": "AggregateRating",
							ratingValue: "4.8",
							ratingCount: "150",
						},
					})}
				</script>

				<body className="landing-page-body" />
			</Head>
			<div className="landing-page-wrapper">
				<InteractiveBackground />
				<div className="landing-page">
					<CustomHeader />
					<main className="landing-main">
						<CustomHeroSection />
						<CustomFeatureShowcase />
						<RoadmapSection />
					</main>
					<CustomFooter />
				</div>
			</div>
		</PostHogProvider>
	)
}
