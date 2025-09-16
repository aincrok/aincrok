import React, { useMemo, useState, useCallback } from "react"
import { useEvent } from "react-use"
import { LanguageModelChatSelector } from "vscode"
import { SelectDropdown, DropdownOptionType } from "@/components/ui"
import { OPENROUTER_DEFAULT_PROVIDER_NAME, type ProviderSettings, vscodeLlmModels } from "@roo-code/types"
import { vscode } from "@src/utils/vscode"
import { ExtensionMessage } from "@roo/ExtensionMessage"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { cn } from "@src/lib/utils"
import { prettyModelName } from "../../../utils/prettyModelName"
import { useProviderModels } from "../hooks/useProviderModels"
import { getModelIdKey, getSelectedModelId } from "../hooks/useSelectedModel"
import { usePreferredModels } from "@/components/ui/hooks/aincrok/usePreferredModels"

interface ModelSelectorProps {
	currentApiConfigName?: string
	apiConfiguration: ProviderSettings
	fallbackText: string
}

export const ModelSelector = ({ currentApiConfigName, apiConfiguration, fallbackText }: ModelSelectorProps) => {
	const { t } = useAppTranslation()
	const { provider, providerModels, providerDefaultModel, isLoading, isError } = useProviderModels(apiConfiguration)
	const selectedModelId = getSelectedModelId({
		provider,
		apiConfiguration,
		defaultModelId: providerDefaultModel,
	})
	const modelIdKey = getModelIdKey({ provider })

	// aincrok_change - Add dynamic VS Code LM models state like settings component
	const [vsCodeLmModels, setVsCodeLmModels] = useState<LanguageModelChatSelector[]>([])

	// aincrok_change - Listen for VS Code LM models messages like settings component
	const onMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data

		switch (message.type) {
			case "vsCodeLmModels":
				{
					const newModels = message.vsCodeLmModels ?? []
					setVsCodeLmModels(newModels)
				}
				break
		}
	}, [])

	useEvent("message", onMessage)

	// aincrok_change - Request VS Code LM models immediately when provider is vscode-lm
	React.useEffect(() => {
		if (provider === "vscode-lm") {
			vscode.postMessage({
				type: "requestVsCodeLmModels",
			})
		}
	}, [provider])

	const preferredModels = usePreferredModels(providerModels)

	// aincrok_change - For VS Code LM, use vendor/family format like settings component
	const modelsIds = useMemo(() => {
		if (provider === "vscode-lm") {
			if (vsCodeLmModels.length > 0) {
				// Use dynamic models with vendor/family format like settings
				return vsCodeLmModels.map((model) => `${model.vendor}/${model.family}`)
			}
			// For VS Code LM, return empty array if dynamic models aren't loaded yet
			// This prevents showing static models that don't match the vendor/family format
			return []
		}
		return preferredModels
	}, [provider, vsCodeLmModels, preferredModels])

	const options = useMemo(
		() =>
			modelsIds.map((modelId) => ({
				value: modelId,
				label:
					provider === "vscode-lm" && modelId.includes("/")
						? modelId.replace("/", " - ") // Format like settings: "copilot - gemini-2.0-flash"
						: prettyModelName(modelId),
				type: DropdownOptionType.ITEM,
			})),
		[modelsIds, provider],
	)

	// aincrok_change - For VS Code LM, consider dynamic models loading state
	const vsCodeLmModelsLoading = provider === "vscode-lm" && vsCodeLmModels.length === 0
	const disabled = isLoading || isError || vsCodeLmModelsLoading

	const onChange = (value: string) => {
		if (!currentApiConfigName) {
			return
		}

		// Handle VS Code LM model selector special case
		let modelValue: any = value
		let shouldSkip = false

		if (provider === "vscode-lm" && modelIdKey === "vsCodeLmModelSelector") {
			// aincrok_change - Don't allow selection until dynamic models are loaded
			// This prevents creating model objects with incorrect vendor information
			if (vsCodeLmModels.length === 0) {
				console.warn("VS Code LM models not loaded yet, ignoring selection")
				return
			}
			// For VS Code LM, parse vendor/family format like settings component
			const currentValue = apiConfiguration.vsCodeLmModelSelector

			// Check if we're selecting the same model that's already selected
			if (currentValue) {
				const currentVendorFamily = `${currentValue.vendor ?? ""}/${currentValue.family ?? ""}`
				shouldSkip = currentVendorFamily === value
			}

			// Only create new model value if we're not skipping
			if (!shouldSkip) {
				// aincrok_change - Parse vendor/family format exactly like settings component
				const [vendor, family] = value.split("/")

				// Find the corresponding model to get the id
				const selectedModel = vsCodeLmModels.find((model) => model.vendor === vendor && model.family === family)

				// aincrok_change - Ensure we found the model before proceeding
				if (!selectedModel) {
					console.warn(
						`VS Code LM model not found for ${vendor}/${family}, available models:`,
						vsCodeLmModels.map((m) => `${m.vendor}/${m.family}`),
					)
					return
				}

				modelValue = {
					vendor,
					family,
					id: selectedModel.id,
				}
			}
		} else {
			shouldSkip = apiConfiguration[modelIdKey] === value
		}

		if (shouldSkip) {
			// don't reset openRouterSpecificProvider
			return
		}

		// aincrok_change - Add small delay to prevent race condition with settings component
		// This allows settings to load its models before processing the update
		if (provider === "vscode-lm") {
			setTimeout(() => {
				vscode.postMessage({
					type: "upsertApiConfiguration",
					text: currentApiConfigName,
					apiConfiguration: {
						...apiConfiguration,
						[modelIdKey]: modelValue,
						openRouterSpecificProvider: OPENROUTER_DEFAULT_PROVIDER_NAME,
					},
				})
			}, 100) // Small delay to ensure settings loads its models first
		} else {
			vscode.postMessage({
				type: "upsertApiConfiguration",
				text: currentApiConfigName,
				apiConfiguration: {
					...apiConfiguration,
					[modelIdKey]: modelValue,
					openRouterSpecificProvider: OPENROUTER_DEFAULT_PROVIDER_NAME,
				},
			})
		}
	}

	if (isLoading || vsCodeLmModelsLoading) {
		return null
	}

	if (isError || options.length <= 0) {
		return <span className="text-xs text-vscode-descriptionForeground opacity-70 truncate">{fallbackText}</span>
	}

	// aincrok_change - For VS Code LM, get current value in vendor/family format like settings
	const getCurrentValue = () => {
		if (provider === "vscode-lm") {
			// For VS Code LM, ONLY use the stored configuration to avoid intermediate states
			if (apiConfiguration?.vsCodeLmModelSelector) {
				const stored = apiConfiguration.vsCodeLmModelSelector
				const vendorFamily = `${stored.vendor ?? ""}/${stored.family ?? ""}`

				// Only return this value if it exists in our current dynamic models list
				// This prevents showing outdated vendor/family combinations
				if (vsCodeLmModels.length > 0) {
					const modelExists = vsCodeLmModels.some(
						(model) => `${model.vendor}/${model.family}` === vendorFamily,
					)
					if (modelExists) {
						return vendorFamily
					}
				} else {
					// If dynamic models aren't loaded yet, still return the stored value
					// but the component will be in loading state anyway
					return vendorFamily
				}
			}

			// If no stored configuration or dynamic models don't match, return empty string
			// This will trigger fallback text display
			return ""
		}

		const selectedModelNoLongerExistsButDefaultDoes =
			modelsIds.indexOf(selectedModelId) < 0 && modelsIds.indexOf(providerDefaultModel) >= 0

		return selectedModelNoLongerExistsButDefaultDoes ? providerDefaultModel : selectedModelId
	}

	const currentValue = getCurrentValue()

	return (
		<SelectDropdown
			value={currentValue}
			disabled={disabled}
			title={t("chat:selectApiConfig")}
			options={options}
			onChange={onChange}
			contentClassName="max-h-[300px] overflow-y-auto"
			triggerClassName={cn(
				"w-full text-ellipsis overflow-hidden p-0",
				"bg-transparent border-transparent hover:bg-transparent hover:border-transparent",
			)}
			triggerIcon={false}
			itemClassName="group"
		/>
	)
}
