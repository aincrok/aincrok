import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { usePostHog } from "./PostHogProvider"

interface ABTest {
	id: string
	variant: string
	metadata?: Record<string, any>
}

interface ABTestContextType {
	getVariant: (testId: string, variants: string[], defaultVariant?: string) => string
	trackTestExposure: (testId: string, variant: string) => void
	trackTestConversion: (testId: string, variant: string, conversionType?: string) => void
	activeTests: Record<string, ABTest>
}

const ABTestContext = createContext<ABTestContextType | null>(null)

interface ABTestProviderProps {
	children: ReactNode
	userId?: string
}

export const ABTestProvider: React.FC<ABTestProviderProps> = ({ children, userId }) => {
	const { trackEvent } = usePostHog()
	const [activeTests, setActiveTests] = useState<Record<string, ABTest>>({})

	const hashString = (str: string): number => {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32bit integer
		}
		return Math.abs(hash)
	}

	const getVariant = (testId: string, variants: string[], defaultVariant: string = variants[0]): string => {
		// Generate a consistent variant assignment based on user ID + test ID
		const seedString = `${userId || "anonymous"}-${testId}`
		const hash = hashString(seedString)
		const variantIndex = hash % variants.length
		const selectedVariant = variants[variantIndex]

		// Store the test assignment
		setActiveTests((prev) => ({
			...prev,
			[testId]: {
				id: testId,
				variant: selectedVariant,
				metadata: {
					assigned_at: new Date().toISOString(),
					available_variants: variants,
					user_id: userId || "anonymous",
				},
			},
		}))

		return selectedVariant
	}

	const trackTestExposure = (testId: string, variant: string) => {
		trackEvent("ab_test_exposure", {
			test_id: testId,
			variant,
			user_id: userId || "anonymous",
			timestamp: new Date().toISOString(),
		})
	}

	const trackTestConversion = (testId: string, variant: string, conversionType: string = "default") => {
		trackEvent("ab_test_conversion", {
			test_id: testId,
			variant,
			conversion_type: conversionType,
			user_id: userId || "anonymous",
			timestamp: new Date().toISOString(),
		})
	}

	const value: ABTestContextType = {
		getVariant,
		trackTestExposure,
		trackTestConversion,
		activeTests,
	}

	return <ABTestContext.Provider value={value}>{children}</ABTestContext.Provider>
}

export const useABTest = (): ABTestContextType => {
	const context = useContext(ABTestContext)
	if (!context) {
		return {
			getVariant: (testId, variants, defaultVariant) => defaultVariant || variants[0],
			trackTestExposure: () => {},
			trackTestConversion: () => {},
			activeTests: {},
		}
	}
	return context
}

// Hook for individual A/B tests
export const useABTestVariant = (testId: string, variants: string[], defaultVariant?: string) => {
	const { getVariant, trackTestExposure } = useABTest()
	const [variant, setVariant] = useState<string>(() => getVariant(testId, variants, defaultVariant))

	useEffect(() => {
		const selectedVariant = getVariant(testId, variants, defaultVariant)
		setVariant(selectedVariant)
		trackTestExposure(testId, selectedVariant)
	}, [testId, variants.join(","), defaultVariant])

	return variant
}

// Component for A/B testing different UI elements
interface ABTestComponentProps {
	testId: string
	variants: Record<string, ReactNode>
	defaultVariant?: string
	onExposure?: (variant: string) => void
	onConversion?: (variant: string, conversionType?: string) => void
}

export const ABTestComponent: React.FC<ABTestComponentProps> = ({
	testId,
	variants,
	defaultVariant,
	onExposure,
	onConversion,
}) => {
	const variantKeys = Object.keys(variants)
	const { trackTestConversion } = useABTest()
	const variant = useABTestVariant(testId, variantKeys, defaultVariant)

	useEffect(() => {
		if (onExposure) {
			onExposure(variant)
		}
	}, [variant, onExposure])

	const handleConversion = (conversionType?: string) => {
		trackTestConversion(testId, variant, conversionType)
		if (onConversion) {
			onConversion(variant, conversionType)
		}
	}

	// Clone the variant element and add conversion tracking if it's a React element
	const variantElement = variants[variant]
	if (React.isValidElement(variantElement)) {
		return React.cloneElement(variantElement, {
			"data-ab-test": testId,
			"data-variant": variant,
			onClick: (...args: any[]) => {
				if (variantElement.props.onClick) {
					variantElement.props.onClick(...args)
				}
				handleConversion("click")
			},
		} as any)
	}

	return <>{variantElement}</>
}
