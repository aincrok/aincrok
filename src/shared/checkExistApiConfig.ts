import { SECRET_STATE_KEYS, ProviderSettings } from "@roo-code/types"

// aincrok_change start - Filter out cipher keys since they're not part of ProviderSettings
const PROVIDER_SECRET_KEYS = SECRET_STATE_KEYS.filter(
	(key) => !key.startsWith("cipher"),
) as readonly (keyof ProviderSettings)[]
// aincrok_change end

export function checkExistKey(config: ProviderSettings | undefined) {
	if (!config) {
		return false
	}

	// Special case for human-relay, fake-ai, claude-code, and gemini-cli providers which don't need any configuration.
	if (
		config.apiProvider &&
		[
			"human-relay",
			"fake-ai",
			"claude-code",
			"roo",
			"gemini-cli", // kilocode_change
			"qwen-code", // kilocode_change
		].includes(config.apiProvider)
	) {
		return true
	}

	// aincrok_change - Use filtered provider keys instead of all SECRET_STATE_KEYS
	// Check provider-related secret keys only (cipher keys are in GlobalSettings)
	const hasSecretKey = PROVIDER_SECRET_KEYS.some((key) => config[key] !== undefined)

	// Check additional non-secret configuration properties
	const hasOtherConfig = [
		config.awsRegion,
		config.vertexProjectId,
		config.ollamaModelId,
		config.lmStudioModelId,
		config.vsCodeLmModelSelector,
		config.kilocodeModel, // kilocode_change
	].some((value) => value !== undefined)

	return hasSecretKey || hasOtherConfig
}
