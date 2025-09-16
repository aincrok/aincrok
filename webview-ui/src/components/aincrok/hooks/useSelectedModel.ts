import { type ProviderName, type ProviderSettings, vscodeLlmModels } from "@roo-code/types"

export const getModelIdKey = ({
	provider,
}: {
	provider: ProviderName
}): keyof Pick<
	ProviderSettings,
	| "glamaModelId"
	| "openRouterModelId"
	| "unboundModelId"
	| "requestyModelId"
	| "openAiModelId"
	| "litellmModelId"
	| "kilocodeModel"
	| "ollamaModelId"
	| "lmStudioModelId"
	| "vsCodeLmModelSelector"
	| "apiModelId"
> => {
	switch (provider) {
		case "openrouter": {
			return "openRouterModelId"
		}
		case "requesty": {
			return "requestyModelId"
		}
		case "glama": {
			return "glamaModelId"
		}
		case "unbound": {
			return "unboundModelId"
		}
		case "litellm": {
			return "litellmModelId"
		}
		case "openai": {
			return "openAiModelId"
		}
		case "ollama": {
			return "ollamaModelId"
		}
		case "lmstudio": {
			return "lmStudioModelId"
		}
		case "vscode-lm": {
			return "vsCodeLmModelSelector"
		}
		case "kilocode": {
			return "kilocodeModel"
		}
		default: {
			return "apiModelId"
		}
	}
}

export const getSelectedModelId = ({
	provider,
	apiConfiguration,
	defaultModelId,
}: {
	provider: ProviderName
	apiConfiguration: ProviderSettings
	defaultModelId: string
}): string => {
	const modelIdKey = getModelIdKey({ provider })
	switch (provider) {
		case "vscode-lm": {
			if (apiConfiguration?.vsCodeLmModelSelector) {
				const selector = apiConfiguration.vsCodeLmModelSelector
				// For chat interface, try to find matching static model
				// Priority: id field first, then family
				if (selector.id && Object.keys(vscodeLlmModels).includes(selector.id)) {
					return selector.id
				}
				if (selector.family && Object.keys(vscodeLlmModels).includes(selector.family)) {
					return selector.family
				}
				// Fallback: use family or id
				return selector.family || selector.id || defaultModelId
			}
			return defaultModelId
		}
		default: {
			return (apiConfiguration?.[modelIdKey] as string) ?? defaultModelId
		}
	}
}
