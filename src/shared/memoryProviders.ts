// aincrok_change - new file
/**
 * Memory Provider Profiles for Aincrok
 *
 * Follows the established extension pattern for provider selection
 * where users select providers through profiles, similar to model selection
 */

export type MemoryProvider = "mem0" | "openai" | "local" | "qdrant" | "chroma"

/**
 * Memory provider profile defining capabilities and configuration
 */
export interface MemoryProviderProfile {
	capabilities: {
		vectorSearch: boolean
		semanticSearch: boolean
		batchOperations: boolean
		persistence: boolean
		scalable: boolean
		realtime: boolean
	}
	limitations: {
		maxMemorySize?: number
		maxQuerySize?: number
		rateLimit?: number
		requiresServer?: boolean
		requiresApiKey?: boolean
	}
	performance: {
		averageStoreTime: number // milliseconds
		averageSearchTime: number // milliseconds
		searchAccuracy: number // 0-1 score
	}
	pricing?: {
		storagePerMemory?: number // cost per memory
		searchPerQuery?: number // cost per search
		freeMemories?: number // free tier
	}
}

/**
 * Memory provider profiles mapping
 */
export type MemoryProviderProfiles = {
	[provider in MemoryProvider]: {
		[profileId: string]: MemoryProviderProfile
	}
}

/**
 * Memory provider profiles with specific configurations
 */
export const MEMORY_PROVIDER_PROFILES: MemoryProviderProfiles = {
	mem0: {
		"mem0-cloud": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: true,
				scalable: true,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 10000,
				rateLimit: 1000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 200,
				averageSearchTime: 100,
				searchAccuracy: 0.9,
			},
			pricing: {
				storagePerMemory: 0.001,
				searchPerQuery: 0.0001,
				freeMemories: 1000,
			},
		},
		"mem0-enterprise": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: true,
				scalable: true,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 100000,
				rateLimit: 10000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 150,
				averageSearchTime: 50,
				searchAccuracy: 0.95,
			},
			pricing: {
				storagePerMemory: 0.0005,
				searchPerQuery: 0.00005,
			},
		},
	},
	openai: {
		"openai-ada-002": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: false,
				scalable: true,
				realtime: false,
			},
			limitations: {
				maxMemorySize: 50000,
				rateLimit: 3000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 300,
				averageSearchTime: 150,
				searchAccuracy: 0.85,
			},
			pricing: {
				storagePerMemory: 0.0001,
				searchPerQuery: 0.0001,
			},
		},
		"openai-3-small": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: false,
				scalable: true,
				realtime: false,
			},
			limitations: {
				maxMemorySize: 50000,
				rateLimit: 3000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 250,
				averageSearchTime: 120,
				searchAccuracy: 0.88,
			},
			pricing: {
				storagePerMemory: 0.00002,
				searchPerQuery: 0.00002,
			},
		},
		"openai-3-large": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: false,
				scalable: true,
				realtime: false,
			},
			limitations: {
				maxMemorySize: 50000,
				rateLimit: 3000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 400,
				averageSearchTime: 200,
				searchAccuracy: 0.92,
			},
			pricing: {
				storagePerMemory: 0.00013,
				searchPerQuery: 0.00013,
			},
		},
	},
	local: {
		"local-vscode": {
			capabilities: {
				vectorSearch: false,
				semanticSearch: false,
				batchOperations: true,
				persistence: true,
				scalable: false,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 10000,
				maxQuerySize: 1000,
			},
			performance: {
				averageStoreTime: 10,
				averageSearchTime: 50,
				searchAccuracy: 0.6,
			},
		},
		"local-filesystem": {
			capabilities: {
				vectorSearch: false,
				semanticSearch: false,
				batchOperations: true,
				persistence: true,
				scalable: false,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 100000,
				maxQuerySize: 5000,
			},
			performance: {
				averageStoreTime: 20,
				averageSearchTime: 100,
				searchAccuracy: 0.65,
			},
		},
	},
	qdrant: {
		"qdrant-local": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: true,
				scalable: true,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 1000000,
				requiresServer: true,
			},
			performance: {
				averageStoreTime: 50,
				averageSearchTime: 30,
				searchAccuracy: 0.9,
			},
		},
		"qdrant-cloud": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: true,
				scalable: true,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 10000000,
				rateLimit: 1000,
				requiresApiKey: true,
			},
			performance: {
				averageStoreTime: 100,
				averageSearchTime: 80,
				searchAccuracy: 0.92,
			},
			pricing: {
				storagePerMemory: 0.0001,
				searchPerQuery: 0.00001,
			},
		},
	},
	chroma: {
		"chroma-local": {
			capabilities: {
				vectorSearch: true,
				semanticSearch: true,
				batchOperations: true,
				persistence: true,
				scalable: false,
				realtime: true,
			},
			limitations: {
				maxMemorySize: 100000,
				requiresServer: true,
			},
			performance: {
				averageStoreTime: 80,
				averageSearchTime: 60,
				searchAccuracy: 0.85,
			},
		},
	},
}

/**
 * Get the profile for a specific memory provider and profile ID
 */
export function getMemoryProviderProfile(
	provider: MemoryProvider,
	profileId: string,
): MemoryProviderProfile | undefined {
	const providerProfiles = MEMORY_PROVIDER_PROFILES[provider]
	if (!providerProfiles) {
		console.warn(`Memory provider not found: ${provider}`)
		return undefined
	}

	const profile = providerProfiles[profileId]
	if (!profile) {
		console.warn(`Profile not found for provider ${provider}: ${profileId}`)
		return undefined
	}

	return profile
}

/**
 * Get the default profile ID for a provider
 */
export function getDefaultProfileId(provider: MemoryProvider): string {
	switch (provider) {
		case "mem0":
			return "mem0-cloud"
		case "openai":
			return "openai-3-small"
		case "local":
			return "local-vscode"
		case "qdrant":
			return "qdrant-local"
		case "chroma":
			return "chroma-local"
		default:
			console.warn(`Unknown provider for default profile: ${provider}`)
			return ""
	}
}

/**
 * Get available profiles for a provider
 */
export function getAvailableProfiles(provider: MemoryProvider): string[] {
	const providerProfiles = MEMORY_PROVIDER_PROFILES[provider]
	return providerProfiles ? Object.keys(providerProfiles) : []
}

/**
 * Validate if a provider profile supports a specific capability
 */
export function supportsCapability(
	provider: MemoryProvider,
	profileId: string,
	capability: keyof MemoryProviderProfile["capabilities"],
): boolean {
	const profile = getMemoryProviderProfile(provider, profileId)
	return profile?.capabilities[capability] ?? false
}

/**
 * Get the best profile for specific requirements
 */
export function getBestProfile(
	provider: MemoryProvider,
	requirements: {
		needsVectorSearch?: boolean
		needsPersistence?: boolean
		maxLatency?: number
		maxCost?: number
		minAccuracy?: number
	},
): string | undefined {
	const profiles = getAvailableProfiles(provider)

	let bestProfile: string | undefined
	let bestScore = 0

	for (const profileId of profiles) {
		const profile = getMemoryProviderProfile(provider, profileId)
		if (!profile) continue

		let score = 0
		let meets = true

		// Check requirements
		if (requirements.needsVectorSearch && !profile.capabilities.vectorSearch) {
			meets = false
		}
		if (requirements.needsPersistence && !profile.capabilities.persistence) {
			meets = false
		}
		if (requirements.maxLatency && profile.performance.averageSearchTime > requirements.maxLatency) {
			meets = false
		}
		if (requirements.minAccuracy && profile.performance.searchAccuracy < requirements.minAccuracy) {
			meets = false
		}

		if (!meets) continue

		// Calculate score based on performance
		score += profile.performance.searchAccuracy * 100
		score += Math.max(0, 100 - profile.performance.averageSearchTime)
		score += Math.max(0, 100 - profile.performance.averageStoreTime)

		// Bonus for advanced capabilities
		if (profile.capabilities.semanticSearch) score += 20
		if (profile.capabilities.realtime) score += 10
		if (profile.capabilities.scalable) score += 15

		if (score > bestScore) {
			bestScore = score
			bestProfile = profileId
		}
	}

	return bestProfile
}

/**
 * Memory provider settings following the extension pattern
 */
export interface MemoryProviderSettings {
	memoryProvider: MemoryProvider
	mem0ProfileId?: string
	openaiProfileId?: string
	localProfileId?: string
	qdrantProfileId?: string
	chromaProfileId?: string

	// Provider-specific configurations
	apiKey?: string
	baseUrl?: string
	userId?: string
	enableAutoFallback?: boolean
	fallbackProvider?: MemoryProvider
	fallbackProfileId?: string
}

/**
 * Get profile ID from memory provider settings
 */
export function getProfileIdFromSettings(settings: MemoryProviderSettings): string | undefined {
	switch (settings.memoryProvider) {
		case "mem0":
			return settings.mem0ProfileId || getDefaultProfileId("mem0")
		case "openai":
			return settings.openaiProfileId || getDefaultProfileId("openai")
		case "local":
			return settings.localProfileId || getDefaultProfileId("local")
		case "qdrant":
			return settings.qdrantProfileId || getDefaultProfileId("qdrant")
		case "chroma":
			return settings.chromaProfileId || getDefaultProfileId("chroma")
		default:
			return undefined
	}
}

/**
 * Validate memory provider settings
 */
export function validateMemoryProviderSettings(settings: MemoryProviderSettings): {
	valid: boolean
	errors: string[]
	warnings: string[]
} {
	const errors: string[] = []
	const warnings: string[] = []

	// Validate provider exists
	if (!MEMORY_PROVIDER_PROFILES[settings.memoryProvider]) {
		errors.push(`Unknown memory provider: ${settings.memoryProvider}`)
		return { valid: false, errors, warnings }
	}

	// Validate profile exists
	const profileId = getProfileIdFromSettings(settings)
	if (!profileId) {
		errors.push(`No profile specified for provider: ${settings.memoryProvider}`)
		return { valid: false, errors, warnings }
	}

	const profile = getMemoryProviderProfile(settings.memoryProvider, profileId)
	if (!profile) {
		errors.push(`Profile not found: ${settings.memoryProvider}/${profileId}`)
		return { valid: false, errors, warnings }
	}

	// Validate requirements based on profile
	if (profile.limitations.requiresApiKey && !settings.apiKey) {
		errors.push(`API key required for ${settings.memoryProvider}/${profileId}`)
	}

	if (profile.limitations.requiresServer && !settings.baseUrl) {
		warnings.push(`Server URL recommended for ${settings.memoryProvider}/${profileId}`)
	}

	// Validate fallback configuration
	if (settings.enableAutoFallback && settings.fallbackProvider) {
		if (!MEMORY_PROVIDER_PROFILES[settings.fallbackProvider]) {
			warnings.push(`Unknown fallback provider: ${settings.fallbackProvider}`)
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	}
}
