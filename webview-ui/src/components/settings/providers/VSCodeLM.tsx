import React, { useState, useCallback } from "react" // aincrok_change - add React for useEffect
import { useEvent } from "react-use"
import { LanguageModelChatSelector } from "vscode"

import type { ProviderSettings } from "@roo-code/types"

import { ExtensionMessage } from "@roo/ExtensionMessage"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui"
import { vscode } from "@src/utils/vscode" // aincrok_change - add vscode for postMessage

type VSCodeLMProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

export const VSCodeLM = ({ apiConfiguration, setApiConfigurationField }: VSCodeLMProps) => {
	const { t } = useAppTranslation()

	const [vsCodeLmModels, setVsCodeLmModels] = useState<LanguageModelChatSelector[]>([])

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

	// aincrok_change - Request VS Code LM models immediately when component mounts
	React.useEffect(() => {
		vscode.postMessage({ type: "requestVsCodeLmModels" })
	}, [])

	return (
		<>
			<div>
				<label className="block font-medium mb-1">{t("settings:providers.vscodeLmModel")}</label>
				{vsCodeLmModels.length > 0 || apiConfiguration?.vsCodeLmModelSelector ? (
					<Select
						value={(() => {
							if (!apiConfiguration?.vsCodeLmModelSelector) return ""

							const stored = apiConfiguration.vsCodeLmModelSelector
							const targetValue = `${stored.vendor ?? ""}/${stored.family ?? ""}`

							// Only accept EXACT matches from the dynamic models list
							const exactMatch = vsCodeLmModels.find(
								(model) => `${model.vendor}/${model.family}` === targetValue,
							)

							if (exactMatch) {
								return targetValue
							}

							// If no exact match found, return the stored value anyway
							// This prevents auto-switching to similar models
							return targetValue
						})()}
						onValueChange={(value) => {
							const [vendor, family] = value.split("/")

							// Only update if this is a different selection
							const currentStored = apiConfiguration?.vsCodeLmModelSelector
							const currentValue = currentStored
								? `${currentStored.vendor ?? ""}/${currentStored.family ?? ""}`
								: ""

							// Skip if we're trying to set the same value (prevents loops)
							if (value === currentValue) {
								return
							}

							// Find the corresponding model to get the id
							const selectedModel = vsCodeLmModels.find(
								(model) => model.vendor === vendor && model.family === family,
							)
							setApiConfigurationField("vsCodeLmModelSelector", {
								vendor,
								family,
								id: selectedModel?.id || `${vendor}/${family}`,
							})
						}}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("settings:common.select")} />
						</SelectTrigger>
						<SelectContent>
							{vsCodeLmModels.map((model) => (
								<SelectItem
									key={`${model.vendor}/${model.family}`}
									value={`${model.vendor}/${model.family}`}>
									{`${model.vendor} - ${model.family}`}
								</SelectItem>
							))}
							{/* aincrok_change - Remove (from chat) intermediate display completely */}
						</SelectContent>
					</Select>
				) : (
					<div className="text-sm text-vscode-descriptionForeground">
						{t("settings:providers.vscodeLmDescription")}
					</div>
				)}
			</div>
			<div className="text-sm text-vscode-errorForeground">{t("settings:providers.vscodeLmWarning")}</div>
		</>
	)
}
