// aincrok_change - updated for Memory system
// Memory Configuration UI - configures memory system
import { HTMLAttributes, useRef } from "react"
import { Brain } from "lucide-react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { cn } from "@/lib/utils"
import CipherConfig from "./CipherConfig"
import { SectionHeader } from "../settings/SectionHeader"
import { Section } from "../settings/Section"
import { SetCachedStateField } from "../settings/types"

// aincrok_change start - Import the shared MemoryConfiguration type
import type { MemoryConfiguration } from "../../types/ExtensionMessage"

type MemorySettingsProps = HTMLAttributes<HTMLDivElement> & {
	memoryConfiguration: MemoryConfiguration
	setCachedStateField: SetCachedStateField<"memoryConfiguration">
}
// aincrok_change end

export const MemorySettings = ({
	memoryConfiguration,
	setCachedStateField,
	className,
	...props
}: MemorySettingsProps) => {
	const { t } = useAppTranslation()
	// aincrok_change - Add ref to access Cipher component's test function
	const cipherTestFunctionRef = useRef<(() => Promise<void>) | null>(null)

	// aincrok_change start - Ensure memoryConfiguration has default values if undefined
	const safeMemoryConfig = memoryConfiguration || {
		mode: "disabled" as const,
		autoCapture: false,
		extractReasoning: false,
		teamSharing: false,
		llmProvider: "openai" as const,
		llmModel: "",
		llmApiKey: "",
		llmBaseUrl: "",
		vectorStore: "in-memory" as const,
		vectorStoreUrl: "",
		vectorStoreApiKey: "",
		embeddingProvider: "openai" as const,
		embeddingModel: "",
		embeddingDimensions: 1536,
		embeddingApiKey: "",
		embeddingBaseUrl: "",
		knowledgeGraphEnabled: false,
		knowledgeGraphType: "in-memory" as const,
		neo4jHost: "localhost",
		neo4jPort: "7687",
		neo4jUsername: "",
		neo4jPassword: "",
		neo4jDatabase: "neo4j",
		inMemoryMaxNodes: 10000,
		inMemoryMaxEdges: 50000,
		maxSessions: 5,
		sessionTTL: 3600,
		maxIterations: 10,
		mcpConnectionType: "stdio" as const,
		mcpCommand: "",
		mcpArgs: "",
		apiUrl: "",
		apiKey: "",
	}
	// aincrok_change end

	// aincrok_change - Handle test result callback from Cipher component
	const handleTestResult = (result: { success: boolean; message: string; details: string[]; timestamp: Date }) => {
		// This can be used if we want to do something in the parent when test completes
		console.log("Test completed:", result)
	}

	// aincrok_change - Handle mode change from Cipher component
	const handleModeChange = (mode: string) => {
		setCachedStateField("memoryConfiguration", {
			...safeMemoryConfig,
			mode: mode as "disabled" | "embedded" | "mcp" | "api",
		})
	}

	// aincrok_change - Handle progress updates from Cipher component
	const handleProgressUpdate = (progress: number, phase: string) => {
		// This can be used if we want to show progress in the parent
		console.log(`Progress: ${progress}% - ${phase}`)
	}

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			<SectionHeader description={t("memory:settings.description")}>
				<div className="flex items-center gap-2">
					<Brain className="w-4" />
					<div>{t("memory:settings.title")}</div>
				</div>
			</SectionHeader>

			<Section>
				<div className="w-full">
					<CipherConfig
						// Pass all memory configuration fields using new attribute names
						mode={safeMemoryConfig.mode}
						autoCapture={safeMemoryConfig.autoCapture}
						reasoningExtraction={safeMemoryConfig.extractReasoning}
						workspace={{ enabled: safeMemoryConfig.teamSharing }}
						llm={{
							provider: safeMemoryConfig.llmProvider,
							model: safeMemoryConfig.llmModel,
							apiKey: safeMemoryConfig.llmApiKey,
							baseUrl: safeMemoryConfig.llmBaseUrl,
						}}
						embedding={{
							type: safeMemoryConfig.embeddingProvider,
							model: safeMemoryConfig.embeddingModel,
							apiKey: safeMemoryConfig.embeddingApiKey,
							baseUrl: safeMemoryConfig.embeddingBaseUrl,
							dimensions: safeMemoryConfig.embeddingDimensions,
						}}
						vectorStore={{
							type: safeMemoryConfig.vectorStore,
							url: safeMemoryConfig.vectorStoreUrl,
							apiKey: safeMemoryConfig.vectorStoreApiKey,
						}}
						knowledgeGraph={{
							type: safeMemoryConfig.knowledgeGraphType,
							host: safeMemoryConfig.neo4jHost,
							port: safeMemoryConfig.neo4jPort,
							username: safeMemoryConfig.neo4jUsername,
							password: safeMemoryConfig.neo4jPassword,
							database: safeMemoryConfig.neo4jDatabase,
							maxNodes: safeMemoryConfig.inMemoryMaxNodes,
							maxEdges: safeMemoryConfig.inMemoryMaxEdges,
						}}
						session={{
							sessionTTL: safeMemoryConfig.sessionTTL,
							maxSessions: safeMemoryConfig.maxSessions,
							maxIterations: safeMemoryConfig.maxIterations,
						}}
						mcp={{
							connectionType: safeMemoryConfig.mcpConnectionType,
							command: safeMemoryConfig.mcpCommand,
							args: safeMemoryConfig.mcpArgs,
						}}
						api={{
							url: safeMemoryConfig.apiUrl,
							apiKey: safeMemoryConfig.apiKey,
						}}
						onModeChange={handleModeChange}
						onConfigChange={(field, value) => {
							// Update memoryConfiguration object directly using new attribute names
							const fieldMap: Record<string, keyof MemoryConfiguration> = {
								autoCapture: "autoCapture",
								reasoningExtraction: "extractReasoning",
								"workspace.enabled": "teamSharing",
								"llm.provider": "llmProvider",
								"llm.model": "llmModel",
								"llm.apiKey": "llmApiKey",
								"llm.baseUrl": "llmBaseUrl",
								"embedding.type": "embeddingProvider",
								"embedding.model": "embeddingModel",
								"embedding.apiKey": "embeddingApiKey",
								"embedding.baseUrl": "embeddingBaseUrl",
								"embedding.dimensions": "embeddingDimensions",
								"vectorStore.type": "vectorStore",
								"vectorStore.url": "vectorStoreUrl",
								"vectorStore.apiKey": "vectorStoreApiKey",
								"knowledgeGraph.type": "knowledgeGraphType",
								"knowledgeGraph.host": "neo4jHost",
								"knowledgeGraph.port": "neo4jPort",
								"knowledgeGraph.username": "neo4jUsername",
								"knowledgeGraph.password": "neo4jPassword",
								"knowledgeGraph.database": "neo4jDatabase",
								"knowledgeGraph.maxNodes": "inMemoryMaxNodes",
								"knowledgeGraph.maxEdges": "inMemoryMaxEdges",
								"session.sessionTTL": "sessionTTL",
								"session.maxSessions": "maxSessions",
								"session.maxIterations": "maxIterations",
								"mcp.connectionType": "mcpConnectionType",
								"mcp.command": "mcpCommand",
								"mcp.args": "mcpArgs",
								"api.url": "apiUrl",
								"api.apiKey": "apiKey",
							}

							const mappedField = fieldMap[field]
							if (mappedField) {
								// Convert string values back to numbers for numeric fields
								const numericFields = [
									"embeddingDimensions",
									"inMemoryMaxNodes",
									"inMemoryMaxEdges",
									"sessionTTL",
									"maxSessions",
									"maxIterations",
								]
								const processedValue =
									numericFields.includes(mappedField) && typeof value === "string"
										? parseInt(value) || undefined
										: value

								setCachedStateField("memoryConfiguration", {
									...safeMemoryConfig,
									[mappedField]: processedValue,
								})
							}
						}}
						onTestConnection={(testFn) => {
							// Store the test function reference
							cipherTestFunctionRef.current = testFn
						}}
						onTestResult={handleTestResult}
						onProgressUpdate={handleProgressUpdate}
					/>
				</div>
			</Section>
		</div>
	)
}
