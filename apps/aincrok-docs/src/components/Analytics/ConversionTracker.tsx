import React, { useEffect, useRef } from "react"
import { usePostHog } from "./PostHogProvider"

interface ConversionTrackerProps {
	conversionType: string
	triggerOn?: "view" | "click" | "hover" | "scroll"
	scrollThreshold?: number
	value?: number
	metadata?: Record<string, any>
	children?: React.ReactNode
	className?: string
	onConversion?: () => void
}

export const ConversionTracker: React.FC<ConversionTrackerProps> = ({
	conversionType,
	triggerOn = "view",
	scrollThreshold = 50,
	value,
	metadata,
	children,
	className,
	onConversion,
}) => {
	const { trackConversion, startFunnelTracking } = usePostHog()
	const elementRef = useRef<HTMLDivElement>(null)
	const hasTracked = useRef(false)

	const handleConversion = () => {
		if (!hasTracked.current) {
			hasTracked.current = true
			trackConversion(conversionType, value)

			// Also track as funnel step based on conversion type
			const funnelMapping: Record<string, { funnel: string; step: string }> = {
				hero_engagement: { funnel: "user_acquisition", step: "hero_engagement" },
				feature_exploration: { funnel: "user_acquisition", step: "feature_exploration" },
				demo_interaction: { funnel: "user_acquisition", step: "demo_interaction" },
				download_intent: { funnel: "user_acquisition", step: "download_intent" },
				extension_install: { funnel: "user_acquisition", step: "extension_install" },
				documentation_engagement: { funnel: "user_activation", step: "first_setup" },
				community_join: { funnel: "user_retention", step: "community_engagement" },
			}

			if (funnelMapping[conversionType]) {
				const { funnel, step } = funnelMapping[conversionType]
				startFunnelTracking(funnel, step)
			}

			if (onConversion) {
				onConversion()
			}
		}
	}

	useEffect(() => {
		const element = elementRef.current
		if (!element) return

		if (triggerOn === "view") {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && entry.intersectionRatio >= scrollThreshold / 100) {
							handleConversion()
						}
					})
				},
				{ threshold: scrollThreshold / 100 },
			)

			observer.observe(element)
			return () => observer.disconnect()
		}

		if (triggerOn === "scroll") {
			const handleScroll = () => {
				const rect = element.getBoundingClientRect()
				const elementTop = rect.top
				const elementHeight = rect.height
				const windowHeight = window.innerHeight

				const visiblePercentage = Math.max(
					0,
					Math.min(100, ((windowHeight - elementTop) / elementHeight) * 100),
				)

				if (visiblePercentage >= scrollThreshold) {
					handleConversion()
				}
			}

			window.addEventListener("scroll", handleScroll)
			handleScroll() // Check initial state
			return () => window.removeEventListener("scroll", handleScroll)
		}
	}, [triggerOn, scrollThreshold])

	const handleClick = () => {
		if (triggerOn === "click") {
			handleConversion()
		}
	}

	const handleHover = () => {
		if (triggerOn === "hover") {
			handleConversion()
		}
	}

	return (
		<div
			ref={elementRef}
			className={className}
			onClick={handleClick}
			onMouseEnter={handleHover}
			data-conversion-type={conversionType}>
			{children}
		</div>
	)
}

// Specialized conversion trackers for common use cases
export const CTATracker: React.FC<{
	href?: string
	onClick?: () => void
	children: React.ReactNode
	className?: string
	conversionValue?: number
}> = ({ href, onClick, children, className, conversionValue }) => (
	<ConversionTracker conversionType="cta_click" triggerOn="click" value={conversionValue} className={className}>
		{href ? (
			<a href={href} className={className} onClick={onClick}>
				{children}
			</a>
		) : (
			<button className={className} onClick={onClick}>
				{children}
			</button>
		)}
	</ConversionTracker>
)

export const FeatureExploreTracker: React.FC<{
	featureName: string
	children: React.ReactNode
	className?: string
}> = ({ featureName, children, className }) => (
	<ConversionTracker
		conversionType="feature_exploration"
		triggerOn="view"
		scrollThreshold={30}
		metadata={{ feature_name: featureName }}
		className={className}>
		{children}
	</ConversionTracker>
)

export const HeroEngagementTracker: React.FC<{
	children: React.ReactNode
	className?: string
}> = ({ children, className }) => (
	<ConversionTracker conversionType="hero_engagement" triggerOn="scroll" scrollThreshold={60} className={className}>
		{children}
	</ConversionTracker>
)
