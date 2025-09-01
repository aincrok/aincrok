import React from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"

export const SystemPromptWarning: React.FC = () => {
	const { t } = useAppTranslation()

	return (
		<div className="flex items-center px-4 py-2 mb-2 text-sm rounded bg-vscode-editor-background text-vscode-editor-foreground">
			<span>{t("chat:systemPromptWarning")}</span>
		</div>
	)
}

export default SystemPromptWarning
