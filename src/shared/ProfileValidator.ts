import type { ProviderSettings } from "@roo-code/types"
// aincrok_change: CloudService removed, using type stub
type OrganizationAllowList = any

export class ProfileValidator {
	public static isProfileAllowed(profile: ProviderSettings, allowList: OrganizationAllowList): boolean {
		// aincrok_change - Handle undefined or null allowList gracefully
		if (!allowList) {
			return true // Default to allowing if no allowList is provided
		}

		if (allowList.allowAll) {
			return true
		}

		if (!profile.apiProvider) {
			return false
		}

		if (!this.isProviderAllowed(profile.apiProvider, allowList)) {
			return false
		}

		if (profile.apiProvider === "human-relay") {
			return true
		}

		const modelId = this.getModelIdFromProfile(profile)

		if (!modelId) {
			// Handle case where allowList.providers is undefined
			if (!allowList.providers) {
				return true
			}
			return allowList.providers[profile.apiProvider]?.allowAll === true
		}

		return this.isModelAllowed(profile.apiProvider, modelId, allowList)
	}

	private static isProviderAllowed(providerName: string, allowList: OrganizationAllowList): boolean {
		// aincrok_change - Handle undefined or null allowList gracefully
		if (!allowList) {
			return true
		}

		if (allowList.allowAll) {
			return true
		}

		// Handle case where allowList.providers is undefined
		if (!allowList.providers) {
			return true // Default to allowing if no providers list is defined
		}

		return providerName in allowList.providers
	}

	private static isModelAllowed(providerName: string, modelId: string, allowList: OrganizationAllowList): boolean {
		// aincrok_change - Handle undefined or null allowList gracefully
		if (!allowList) {
			return true
		}

		if (allowList.allowAll) {
			return true
		}

		// Handle case where allowList.providers is undefined
		if (!allowList.providers) {
			return true
		}

		const providerAllowList = allowList.providers[providerName]

		if (!providerAllowList) {
			return false
		}

		if (providerAllowList.allowAll) {
			return true
		}

		return providerAllowList.models?.includes(modelId) ?? false
	}

	private static getModelIdFromProfile(profile: ProviderSettings): string | undefined {
		switch (profile.apiProvider) {
			case "openai":
				return profile.openAiModelId
			case "anthropic":
			case "openai-native":
			case "bedrock":
			case "vertex":
			case "gemini":
			case "mistral":
			case "deepseek":
			case "xai":
			case "zai":
			case "groq":
			case "sambanova":
			case "chutes":
			case "fireworks":
			case "featherless":
				return profile.apiModelId
			case "litellm":
				return profile.litellmModelId
			case "unbound":
				return profile.unboundModelId
			case "lmstudio":
				return profile.lmStudioModelId
			case "vscode-lm":
				// We probably need something more flexible for this one, if we need to really support it here.
				return profile.vsCodeLmModelSelector?.id
			case "openrouter":
				return profile.openRouterModelId
			case "glama":
				return profile.glamaModelId
			case "ollama":
				return profile.ollamaModelId
			case "requesty":
				return profile.requestyModelId
			case "io-intelligence":
				return profile.ioIntelligenceModelId
			// kilocode_change start
			case "deepinfra":
				return profile.deepInfraModelId
			// kilocode_change end
			case "human-relay":
			case "fake-ai":
			default:
				return undefined
		}
	}
}
