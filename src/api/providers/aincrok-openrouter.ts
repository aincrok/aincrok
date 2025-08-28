import { ApiHandlerOptions, ModelRecord } from "../../shared/api"
import { CompletionUsage, OpenRouterHandler } from "./openrouter"
import { getModelParams } from "../transform/model-params"
import { getModels } from "./fetchers/modelCache"
import { DEEP_SEEK_DEFAULT_TEMPERATURE, openRouterDefaultModelId, openRouterDefaultModelInfo } from "@roo-code/types"
import { getKiloBaseUriFromToken } from "../../shared/aincrok/token"
import { ApiHandlerCreateMessageMetadata } from ".."
import OpenAI from "openai"
import { getModelEndpoints } from "./fetchers/modelEndpointCache"
import { getAincrokDefaultModel } from "./aincrok/getAincrokDefaultModel"

/**
 * A custom OpenRouter handler that overrides the getModel function
 * to provide custom model information and fetches models from the AINCROK OpenRouter endpoint.
 */
export class AincrokOpenrouterHandler extends OpenRouterHandler {
	protected override models: ModelRecord = {}
	defaultModel: string = openRouterDefaultModelId

	constructor(options: ApiHandlerOptions) {
		const baseUri = getKiloBaseUriFromToken(options.aincrokToken ?? "")
		options = {
			...options,
			openRouterBaseUrl: `${baseUri}/api/openrouter/`,
			openRouterApiKey: options.aincrokToken,
		}

		super(options)
	}

	override customRequestOptions(metadata?: ApiHandlerCreateMessageMetadata): OpenAI.RequestOptions | undefined {
		const headers: Record<string, string> = {}

		if (metadata?.taskId) {
			headers["X-AINCROK-TaskId"] = metadata.taskId
		}

		// Cast to access aincrok-specific properties
		const aincrokOptions = this.options as ApiHandlerOptions

		if (aincrokOptions.aincrokOrganizationId) {
			headers["X-AINCROK-OrganizationId"] = aincrokOptions.aincrokOrganizationId
		}

		return Object.keys(headers).length > 0 ? { headers } : undefined
	}

	override getTotalCost(lastUsage: CompletionUsage): number {
		const model = this.getModel().info
		if (!model.inputPrice && !model.outputPrice) {
			return 0
		}
		// https://github.com/aincrok/kilocode-backend/blob/eb3d382df1e933a089eea95b9c4387db0c676e35/src/lib/processUsage.ts#L281
		if (lastUsage.is_byok) {
			return lastUsage.cost_details?.upstream_inference_cost || 0
		}
		return lastUsage.cost || 0
	}

	override getModel() {
		let id = this.options.aincrokModel ?? this.defaultModel
		let info = this.models[id]
		let defaultTemperature = 0

		if (!info) {
			const defaultInfo = this.models[this.defaultModel]
			if (defaultInfo) {
				console.warn(`${id} no longer exists, falling back to ${this.defaultModel}`)
				id = this.defaultModel
				info = defaultInfo
			} else {
				console.warn(`${id} no longer exists, falling back to ${openRouterDefaultModelId}`)
				id = openRouterDefaultModelId
				info = openRouterDefaultModelInfo
			}
		}

		// If a specific provider is requested, use the endpoint for that provider.
		if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
			info = this.endpoints[this.options.openRouterSpecificProvider]
		}

		const isDeepSeekR1 = id.startsWith("deepseek/deepseek-r1") || id === "perplexity/sonar-reasoning"

		const params = getModelParams({
			format: "openrouter",
			modelId: id,
			model: info,
			settings: this.options,
			defaultTemperature: isDeepSeekR1 ? DEEP_SEEK_DEFAULT_TEMPERATURE : defaultTemperature,
		})

		return { id, info, topP: isDeepSeekR1 ? 0.95 : undefined, ...params }
	}

	public override async fetchModel() {
		if (!this.options.aincrokToken || !this.options.openRouterBaseUrl) {
			throw new Error("KiloCode token + baseUrl is required to fetch models")
		}

		const [models, endpoints, defaultModel] = await Promise.all([
			getModels({
				provider: "aincrok-openrouter",
				aincrokToken: this.options.aincrokToken,
				aincrokOrganizationId: this.options.aincrokOrganizationId,
			}),
			getModelEndpoints({
				router: "openrouter",
				modelId: this.options.aincrokModel,
				endpoint: this.options.openRouterSpecificProvider,
			}),
			getAINCROKDefaultModel(this.options.aincrokToken),
		])

		this.models = models
		this.endpoints = endpoints
		this.defaultModel = defaultModel
		return this.getModel()
	}
}
