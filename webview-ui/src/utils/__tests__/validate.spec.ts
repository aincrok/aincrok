import { describe, it, expect, vi, beforeEach } from "vitest"
import i18next from "i18next"
import type { ProviderSettings } from "@roo-code/types"
import type { OrganizationAllowList } from "@roo/cloud"
import {
	validateApiConfiguration,
	validateBedrockArn,
	validateModelId,
	getModelValidationError,
	validateApiConfigurationExcludingModelErrors,
} from "../validate"

// Test types
interface TestRouterModels {
	openrouter?: Record<string, any>
	glama?: Record<string, any>
	unbound?: Record<string, any>
	requesty?: Record<string, any>
	ollama?: Record<string, any>
	lmstudio?: Record<string, any>
	litellm?: Record<string, any>
	deepinfra?: Record<string, any>
	"io-intelligence"?: Record<string, any>
}

interface TestProviderSettings {
	apiProvider?: ProviderSettings["apiProvider"]
	apiKey?: string
	openRouterApiKey?: string
	openRouterModelId?: string
	glamaApiKey?: string
	glamaModelId?: string
	unboundApiKey?: string
	unboundModelId?: string
	requestyApiKey?: string
	requestyModelId?: string
	litellmApiKey?: string
	litellmModelId?: string
	awsRegion?: string
	vertexProjectId?: string
	vertexRegion?: string
	geminiApiKey?: string
	deepInfraApiKey?: string
	deepInfraModelId?: string
	openAiNativeApiKey?: string
	mistralApiKey?: string
	openAiBaseUrl?: string
	openAiApiKey?: string
	openAiModelId?: string
	ollamaModelId?: string
	lmStudioModelId?: string
	vsCodeLmModelSelector?: { id: string }
	huggingFaceApiKey?: string
	huggingFaceModelId?: string
	cerebrasApiKey?: string
	fireworksApiKey?: string
	ioIntelligenceApiKey?: string
	ioIntelligenceModelId?: string
	featherlessApiKey?: string
}

interface TestOrganizationAllowList extends Partial<OrganizationAllowList> {
	allowAll?: boolean
	providers?: Record<
		string,
		{
			allowAll?: boolean
			models?: string[]
		}
	>
}

// Mock i18next
vi.mock("i18next", () => ({
	default: {
		t: vi.fn((key: string, params?: any) => {
			// Return a mock translation that includes the key and params for testing
			const paramString = params ? ` [${JSON.stringify(params)}]` : ""
			return `${key}${paramString}`
		}),
	},
}))

// Mock the router functions
vi.mock("@roo/api", () => ({
	isRouterName: vi.fn((provider: string) => {
		const routerProviders = [
			"openrouter",
			"glama",
			"unbound",
			"requesty",
			"ollama",
			"lmstudio",
			"litellm",
			"deepinfra",
			"io-intelligence",
		]
		return routerProviders.includes(provider)
	}),
}))

describe("validate utils", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("validateApiConfiguration", () => {
		it("should return undefined for valid configuration", () => {
			const config: TestProviderSettings = {
				apiProvider: "anthropic",
				apiKey: "test-key",
			}

			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should return error for missing API key", () => {
			const config: TestProviderSettings = {
				apiProvider: "anthropic",
			}

			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate with router models", () => {
			const config: TestProviderSettings = {
				apiProvider: "openrouter",
				openRouterApiKey: "test-key",
				openRouterModelId: "model1",
			}

			const routerModels: TestRouterModels = {
				openrouter: { model1: {}, model2: {} },
			}

			const result = validateApiConfiguration(config as ProviderSettings, routerModels as any)
			expect(result).toBeUndefined()
		})

		it("should return organization validation error", () => {
			const config: TestProviderSettings = {
				apiProvider: "anthropic",
				apiKey: "test-key",
			}

			const organizationAllowList: TestOrganizationAllowList = {
				allowAll: false,
				providers: {},
			}

			const result = validateApiConfiguration(
				config as ProviderSettings,
				undefined,
				organizationAllowList as OrganizationAllowList,
			)
			expect(result).toBe('settings:validation.providerNotAllowed [{"provider":"anthropic"}]')
		})
	})

	describe("validateModelsAndKeysProvided", () => {
		it("should validate openrouter provider", () => {
			const config: TestProviderSettings = { apiProvider: "openrouter" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate glama provider", () => {
			const config: TestProviderSettings = { apiProvider: "glama" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate unbound provider", () => {
			const config: TestProviderSettings = { apiProvider: "unbound" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate requesty provider", () => {
			const config: TestProviderSettings = { apiProvider: "requesty" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate litellm provider", () => {
			const config: TestProviderSettings = { apiProvider: "litellm" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate bedrock provider", () => {
			const config: TestProviderSettings = { apiProvider: "bedrock" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.awsRegion")
		})

		it("should validate vertex provider", () => {
			const config: TestProviderSettings = { apiProvider: "vertex" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.googleCloud")

			const configWithProject: TestProviderSettings = { apiProvider: "vertex", vertexProjectId: "project" }
			const result2 = validateApiConfiguration(configWithProject as ProviderSettings)
			expect(result2).toBe("settings:validation.googleCloud")
		})

		it("should validate gemini provider", () => {
			const config: TestProviderSettings = { apiProvider: "gemini" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate deepinfra provider", () => {
			const config: TestProviderSettings = { apiProvider: "deepinfra" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should allow gemini-cli provider without API key", () => {
			const config: TestProviderSettings = { apiProvider: "gemini-cli" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should allow qwen-code provider without API key", () => {
			const config: TestProviderSettings = { apiProvider: "qwen-code" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should validate openai-native provider", () => {
			const config: TestProviderSettings = { apiProvider: "openai-native" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate mistral provider", () => {
			const config: TestProviderSettings = { apiProvider: "mistral" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate openai provider requires all fields", () => {
			const config: TestProviderSettings = { apiProvider: "openai" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.openAi")

			const partialConfig: TestProviderSettings = {
				apiProvider: "openai",
				openAiBaseUrl: "url",
				openAiApiKey: "key",
			}
			const result2 = validateApiConfiguration(partialConfig as ProviderSettings)
			expect(result2).toBe("settings:validation.openAi")
		})

		it("should validate ollama provider", () => {
			const config: TestProviderSettings = { apiProvider: "ollama" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.modelId")
		})

		it("should validate lmstudio provider", () => {
			const config: TestProviderSettings = { apiProvider: "lmstudio" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.modelId")
		})

		it("should validate vscode-lm provider", () => {
			const config: TestProviderSettings = { apiProvider: "vscode-lm" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.modelSelector")
		})

		it("should allow kilocode provider without validation", () => {
			const config: TestProviderSettings = { apiProvider: "kilocode" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should validate huggingface provider", () => {
			const config: TestProviderSettings = { apiProvider: "huggingface" }
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")

			const configWithKey: TestProviderSettings = {
				apiProvider: "huggingface",
				huggingFaceApiKey: "key",
			}
			const result2 = validateApiConfiguration(configWithKey as ProviderSettings)
			expect(result2).toBe("settings:validation.modelId")
		})

		it("should validate cerebras provider", () => {
			const config = { apiProvider: "cerebras" } as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate fireworks provider", () => {
			const config = { apiProvider: "fireworks" } as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate io-intelligence provider", () => {
			const config = { apiProvider: "io-intelligence" } as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should validate featherless provider", () => {
			const config = { apiProvider: "featherless" } as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBe("settings:validation.apiKey")
		})
	})

	describe("validateProviderAgainstOrganizationSettings", () => {
		it("should return undefined when organizationAllowList is undefined", () => {
			const config: TestProviderSettings = {
				apiProvider: "anthropic",
				apiKey: "test-key",
			}
			const result = validateApiConfiguration(config as ProviderSettings, undefined, undefined)
			expect(result).toBeUndefined()
		})

		it("should return undefined when organizationAllowList.providers is undefined", () => {
			const config = { apiProvider: "anthropic", apiKey: "key" } as TestProviderSettings
			const organizationAllowList = { allowAll: false } as TestOrganizationAllowList
			const result = validateApiConfiguration(
				config as ProviderSettings,
				undefined,
				organizationAllowList as OrganizationAllowList,
			)
			expect(result).toBeUndefined()
		})

		it("should return undefined when allowAll is true", () => {
			const config = { apiProvider: "anthropic", apiKey: "key" } as TestProviderSettings
			const organizationAllowList = {
				allowAll: true,
				providers: {},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBeUndefined()
		})

		it("should return provider not allowed error", () => {
			const config = { apiProvider: "anthropic", apiKey: "key" } as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBe('settings:validation.providerNotAllowed [{"provider":"anthropic"}]')
		})

		it("should return model not allowed error", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterApiKey: "key",
				openRouterModelId: "model3",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {
					openrouter: {
						allowAll: false,
						models: ["model1", "model2"],
					},
				},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBe('settings:validation.modelNotAllowed [{"model":"model3","provider":"openrouter"}]')
		})

		it("should allow model when it's in the allowed list", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterApiKey: "key",
				openRouterModelId: "model1",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {
					openrouter: {
						allowAll: false,
						models: ["model1", "model2"],
					},
				},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBeUndefined()
		})

		it("should allow all models when provider allowAll is true", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterApiKey: "key",
				openRouterModelId: "any-model",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {
					openrouter: {
						allowAll: true,
						models: [],
					},
				},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBeUndefined()
		})

		it("should handle undefined provider", () => {
			const config = {} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {},
			}
			const result = validateApiConfiguration(config, undefined, organizationAllowList)
			expect(result).toBeUndefined()
		})
	})

	describe("validateBedrockArn", () => {
		it("should validate correct Bedrock ARN format", () => {
			const arn = "arn:aws:bedrock:us-east-1:123456789012:model/anthropic.claude-v2"
			const result = validateBedrockArn(arn)

			expect(result).toEqual({
				isValid: true,
				arnRegion: "us-east-1",
				errorMessage: undefined,
			})
		})

		it("should validate correct SageMaker ARN format", () => {
			const arn = "arn:aws:sagemaker:us-west-2:123456789012:endpoint/my-endpoint"
			const result = validateBedrockArn(arn)

			expect(result).toEqual({
				isValid: true,
				arnRegion: "us-west-2",
				errorMessage: undefined,
			})
		})

		it("should validate ARN with empty account ID", () => {
			const arn = "arn:aws:bedrock:eu-west-1::model/anthropic.claude-v2"
			const result = validateBedrockArn(arn)

			expect(result).toEqual({
				isValid: true,
				arnRegion: "eu-west-1",
				errorMessage: undefined,
			})
		})

		it("should return error for invalid ARN format", () => {
			const arn = "invalid-arn-format"
			const result = validateBedrockArn(arn)

			expect(result).toEqual({
				isValid: false,
				arnRegion: undefined,
				errorMessage: "settings:validation.arn.invalidFormat",
			})
		})

		it("should validate region match", () => {
			const arn = "arn:aws:bedrock:us-east-1:123456789012:model/anthropic.claude-v2"
			const result = validateBedrockArn(arn, "us-east-1")

			expect(result).toEqual({
				isValid: true,
				arnRegion: "us-east-1",
				errorMessage: undefined,
			})
		})

		it("should return error for region mismatch", () => {
			const arn = "arn:aws:bedrock:us-east-1:123456789012:model/anthropic.claude-v2"
			const result = validateBedrockArn(arn, "us-west-2")

			expect(result).toEqual({
				isValid: true,
				arnRegion: "us-east-1",
				errorMessage: 'settings:validation.arn.regionMismatch [{"arnRegion":"us-east-1","region":"us-west-2"}]',
			})
		})

		it("should handle ARN with special resource format", () => {
			const arn = "arn:aws:bedrock:us-east-1:123456789012:special-resource"
			const result = validateBedrockArn(arn)

			expect(result).toEqual({
				isValid: true,
				arnRegion: "us-east-1",
				errorMessage: undefined,
			})
		})
	})

	describe("validateModelId", () => {
		it("should return undefined for non-router provider", () => {
			const config = { apiProvider: "anthropic" } as TestProviderSettings
			const result = validateModelId(config as ProviderSettings)

			expect(result).toBeUndefined()
		})

		it("should return error for missing model ID", () => {
			const config = { apiProvider: "openrouter" } as TestProviderSettings
			const result = validateModelId(config as ProviderSettings)

			expect(result).toBe("settings:validation.modelId")
		})

		it("should validate model availability in router models", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "model1",
			} as TestProviderSettings
			const routerModels = {
				openrouter: { model1: {}, model2: {} },
			} as TestRouterModels
			const result = validateModelId(config as ProviderSettings, routerModels as any)

			expect(result).toBeUndefined()
		})

		it("should return error for unavailable model", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "model3",
			} as TestProviderSettings
			const routerModels = {
				openrouter: { model1: {}, model2: {} },
			} as TestRouterModels
			const result = validateModelId(config as ProviderSettings, routerModels as any)

			expect(result).toBe('settings:validation.modelAvailability [{"modelId":"model3"}]')
		})

		it("should handle empty router models", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "model1",
			} as TestProviderSettings
			const routerModels = {} as TestRouterModels
			const result = validateModelId(config as ProviderSettings, routerModels as any)

			expect(result).toBeUndefined()
		})

		it("should handle single model in router models", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "model1",
			} as TestProviderSettings
			const routerModels = {
				openrouter: { model1: {} },
			} as TestRouterModels
			const result = validateModelId(config as ProviderSettings, routerModels as any)

			expect(result).toBeUndefined()
		})

		it("should validate different provider model IDs", () => {
			const providers = [
				{ apiProvider: "glama", glamaModelId: "test-model" },
				{ apiProvider: "unbound", unboundModelId: "test-model" },
				{ apiProvider: "requesty", requestyModelId: "test-model" },
				{ apiProvider: "ollama", ollamaModelId: "test-model" },
				{ apiProvider: "lmstudio", lmStudioModelId: "test-model" },
				{ apiProvider: "litellm", litellmModelId: "test-model" },
				{ apiProvider: "deepinfra", deepInfraModelId: "test-model" },
				{ apiProvider: "io-intelligence", ioIntelligenceModelId: "test-model" },
			]

			providers.forEach((config) => {
				const result = validateModelId(config as any)
				expect(result).toBeUndefined()
			})
		})
	})

	describe("getModelValidationError", () => {
		it("should return organization model error", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "forbidden-model",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {
					openrouter: {
						allowAll: false,
						models: ["allowed-model"],
					},
				},
			}

			const result = getModelValidationError(config, undefined, organizationAllowList)
			expect(result).toBe(
				'settings:validation.modelNotAllowed [{"model":"forbidden-model","provider":"openrouter"}]',
			)
		})

		it("should return router model validation error", () => {
			const config: TestProviderSettings = {
				apiProvider: "openrouter",
				openRouterModelId: "unavailable-model",
			}
			const routerModels: TestRouterModels = {
				openrouter: { "available-model": {}, "another-model": {} },
			}

			const result = getModelValidationError(config as ProviderSettings, routerModels as any)
			expect(result).toBe('settings:validation.modelAvailability [{"modelId":"unavailable-model"}]')
		})

		it("should return undefined for valid model", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterModelId: "valid-model",
			} as TestProviderSettings
			const routerModels = {
				openrouter: { "valid-model": {} },
			} as TestRouterModels

			const result = getModelValidationError(config as ProviderSettings, routerModels as any)
			expect(result).toBeUndefined()
		})

		it("should handle vsCodeLmModelSelector object", () => {
			const config = {
				apiProvider: "vscode-lm",
				vsCodeLmModelSelector: { id: "vscode-model" },
			} as TestProviderSettings

			const result = getModelValidationError(config)
			expect(result).toBeUndefined()
		})
	})

	describe("validateApiConfigurationExcludingModelErrors", () => {
		it("should return API key error", () => {
			const config = { apiProvider: "anthropic" } as TestProviderSettings
			const result = validateApiConfigurationExcludingModelErrors(config)
			expect(result).toBe("settings:validation.apiKey")
		})

		it("should return provider not allowed error", () => {
			const config = {
				apiProvider: "anthropic",
				apiKey: "key",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {},
			}

			const result = validateApiConfigurationExcludingModelErrors(config, undefined, organizationAllowList)
			expect(result).toBe('settings:validation.providerNotAllowed [{"provider":"anthropic"}]')
		})

		it("should exclude model-specific organization errors", () => {
			const config = {
				apiProvider: "openrouter",
				openRouterApiKey: "key",
				openRouterModelId: "forbidden-model",
			} as TestProviderSettings
			const organizationAllowList = {
				allowAll: false,
				providers: {
					openrouter: {
						allowAll: false,
						models: ["allowed-model"],
					},
				},
			}

			const result = validateApiConfigurationExcludingModelErrors(config, undefined, organizationAllowList)
			expect(result).toBeUndefined()
		})

		it("should return undefined for valid configuration", () => {
			const config = {
				apiProvider: "anthropic",
				apiKey: "key",
			} as TestProviderSettings

			const result = validateApiConfigurationExcludingModelErrors(config)
			expect(result).toBeUndefined()
		})
	})

	describe("edge cases and error handling", () => {
		it("should handle undefined apiProvider", () => {
			const config = {} as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should handle empty provider string", () => {
			const config = { apiProvider: "" } as unknown as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should handle unknown provider", () => {
			const config = { apiProvider: "unknown-provider" } as unknown as TestProviderSettings
			const result = validateApiConfiguration(config as ProviderSettings)
			expect(result).toBeUndefined()
		})

		it("should handle complex ARN patterns", () => {
			const invalidArns = [
				"",
				"arn:",
				"arn:aws:",
				"arn:aws:bedrock:",
				"arn:aws:bedrock:us-east-1:",
				"arn:aws:bedrock:us-east-1:123456789012:",
				"not-an-arn",
			]

			invalidArns.forEach((arn) => {
				const result = validateBedrockArn(arn)
				expect(result.isValid).toBe(false)
				expect(result.errorMessage).toBe("settings:validation.arn.invalidFormat")
			})
		})
	})
})
