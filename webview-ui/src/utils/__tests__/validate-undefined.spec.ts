import { describe, it, expect } from "vitest"
import { validateApiConfiguration } from "../validate"
import type { ProviderSettings } from "@roo-code/types"

// aincrok_change - new file: Test undefined organizationAllowList handling

describe("validate with undefined organizationAllowList", () => {
	it("should handle undefined organizationAllowList in validateApiConfiguration", () => {
		const apiConfiguration: ProviderSettings = {
			apiProvider: "anthropic",
			apiKey: "test-key",
		}

		// Should not throw when organizationAllowList is undefined
		const result = validateApiConfiguration(apiConfiguration, undefined, undefined)
		expect(result).toBeUndefined()
	})

	it("should handle organizationAllowList with undefined providers", () => {
		const apiConfiguration: ProviderSettings = {
			apiProvider: "anthropic",
			apiKey: "test-key",
		}

		const organizationAllowList = {
			allowAll: false,
			providers: undefined as any,
		}

		// Should not throw and should allow when providers is undefined
		const result = validateApiConfiguration(apiConfiguration, undefined, organizationAllowList)
		expect(result).toBeUndefined()
	})

	it("should handle null organizationAllowList", () => {
		const apiConfiguration: ProviderSettings = {
			apiProvider: "openai",
			openAiBaseUrl: "https://api.openai.com",
			openAiApiKey: "test-key",
			openAiModelId: "gpt-4",
		}

		// Should not throw when organizationAllowList is null
		const result = validateApiConfiguration(apiConfiguration, undefined, null as any)
		expect(result).toBeUndefined()
	})

	it("should return undefined for validateProviderAgainstOrganizationSettings with undefined allowList", () => {
		const apiConfiguration: ProviderSettings = {
			apiProvider: "anthropic",
			apiKey: "test-key",
		}

		// Direct test of the internal function (via validateApiConfiguration)
		const result = validateApiConfiguration(apiConfiguration, undefined, undefined)
		expect(result).toBeUndefined()
	})

	it("should return undefined when providers property is missing", () => {
		const apiConfiguration: ProviderSettings = {
			apiProvider: "anthropic",
			apiKey: "test-key",
		}

		const organizationAllowList = {
			allowAll: false,
			// providers property is missing
		} as any

		const result = validateApiConfiguration(apiConfiguration, undefined, organizationAllowList)
		expect(result).toBeUndefined()
	})
})
