import React, { createContext, useContext, useEffect, ReactNode } from "react"
import posthog from "posthog-js"
import { useLocation } from "@docusaurus/router"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"

interface PostHogContextType {
	trackEvent: (eventName: string, properties?: Record<string, any>) => void
	identifyUser: (userId: string, properties?: Record<string, any>) => void
	trackConversion: (conversionType: string, value?: number) => void
	trackFeatureUsage: (feature: string, action: string) => void
	startFunnelTracking: (funnelName: string, step: string) => void
	trackPageView: (path: string, properties?: Record<string, any>) => void
}

const PostHogContext = createContext<PostHogContextType | null>(null)

interface PostHogProviderProps {
	children: ReactNode
	apiKey?: string
	options?: any
}

export const PostHogProvider: React.FC<PostHogProviderProps> = ({ children, apiKey, options = {} }) => {
	const location = useLocation()
	const { siteConfig } = useDocusaurusContext()

	// Try to get API key from props, then from siteConfig plugins
	const effectiveApiKey =
		apiKey || siteConfig?.plugins?.find((p: any) => Array.isArray(p) && p[0] === "posthog-docusaurus")?.[1]?.apiKey

	useEffect(() => {
		if (effectiveApiKey && typeof window !== "undefined") {
			posthog.init(effectiveApiKey, {
				api_host: "https://us.i.posthog.com",
				loaded: (posthog) => {
					// Check for development environment without using process
					if (typeof window !== "undefined" && window.location.hostname === "localhost") {
						console.log("PostHog loaded successfully")
					}
				},
				capture_pageview: false, // We'll handle this manually for better control
				disable_session_recording: false,
				persistence: "localStorage+cookie",
				...options,
			})
		}
	}, [effectiveApiKey, options])

	// Track page views when location changes
	useEffect(() => {
		if (typeof window !== "undefined" && posthog.__loaded) {
			posthog.capture("$pageview", {
				$current_url: window.location.href,
				page_path: location.pathname,
				page_title: document.title,
			})
		}
	}, [location])

	const trackEvent = (eventName: string, properties?: Record<string, any>) => {
		if (typeof window !== "undefined" && posthog.__loaded) {
			posthog.capture(eventName, {
				timestamp: new Date().toISOString(),
				...properties,
			})
		}
	}

	const identifyUser = (userId: string, properties?: Record<string, any>) => {
		if (typeof window !== "undefined" && posthog.__loaded) {
			posthog.identify(userId, properties)
		}
	}

	const trackConversion = (conversionType: string, value?: number) => {
		trackEvent("conversion", {
			conversion_type: conversionType,
			conversion_value: value,
			page_path: location.pathname,
			timestamp: new Date().toISOString(),
		})
	}

	const trackFeatureUsage = (feature: string, action: string) => {
		trackEvent("feature_usage", {
			feature_name: feature,
			action_type: action,
			page_path: location.pathname,
		})
	}

	const startFunnelTracking = (funnelName: string, step: string) => {
		trackEvent("funnel_step", {
			funnel_name: funnelName,
			step_name: step,
			step_order: getFunnelStepOrder(funnelName, step),
			page_path: location.pathname,
		})
	}

	const trackPageView = (path: string, properties?: Record<string, any>) => {
		trackEvent("page_view", {
			page_path: path,
			referrer: document.referrer,
			...properties,
		})
	}

	const value: PostHogContextType = {
		trackEvent,
		identifyUser,
		trackConversion,
		trackFeatureUsage,
		startFunnelTracking,
		trackPageView,
	}

	return <PostHogContext.Provider value={value}>{children}</PostHogContext.Provider>
}

export const usePostHog = (): PostHogContextType => {
	const context = useContext(PostHogContext)
	if (!context) {
		// Return no-op functions if PostHog is not initialized
		return {
			trackEvent: () => {},
			identifyUser: () => {},
			trackConversion: () => {},
			trackFeatureUsage: () => {},
			startFunnelTracking: () => {},
			trackPageView: () => {},
		}
	}
	return context
}

// Helper function to define funnel step orders
function getFunnelStepOrder(funnelName: string, step: string): number {
	const funnelSteps: Record<string, Record<string, number>> = {
		user_acquisition: {
			landing_page_view: 1,
			hero_engagement: 2,
			feature_exploration: 3,
			demo_interaction: 4,
			download_intent: 5,
			extension_install: 6,
		},
		user_activation: {
			extension_install: 1,
			first_setup: 2,
			provider_connection: 3,
			first_chat: 4,
			first_tool_use: 5,
			first_successful_task: 6,
		},
		user_retention: {
			return_visit: 1,
			feature_discovery: 2,
			advanced_usage: 3,
			community_engagement: 4,
			feedback_submission: 5,
		},
	}

	return funnelSteps[funnelName]?.[step] || 0
}
