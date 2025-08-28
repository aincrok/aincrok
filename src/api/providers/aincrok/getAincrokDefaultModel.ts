import { openRouterDefaultModelId } from "@roo-code/types"
import { getKiloBaseUriFromToken } from "../../../shared/aincrok/token"
import { TelemetryService } from "@roo-code/telemetry"
import { z } from "zod"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { DEFAULT_HEADERS } from "../constants"

type AincrokToken = string

const cache = new Map<AincrokToken, Promise<string>>()

const defaultsSchema = z.object({
	defaultModel: z.string().nullish(),
})

const fetcher = fetchWithTimeout(5000)

async function fetchAincrokDefaultModel(aincrokToken: AincrokToken): Promise<string> {
	try {
		const url = `${getKiloBaseUriFromToken(aincrokToken)}/api/defaults`
		const response = await fetcher(url, {
			headers: {
				...DEFAULT_HEADERS,
				Authorization: `Bearer ${aincrokToken}`,
			},
		})
		if (!response.ok) {
			throw new Error(`Fetching default model from ${url} failed: ${response.status}`)
		}
		const defaultModel = (await defaultsSchema.parseAsync(await response.json())).defaultModel
		if (!defaultModel) {
			throw new Error(`Default model from ${url} was empty`)
		}
		console.info(`Fetched default model from ${url}: ${defaultModel}`)
		return defaultModel
	} catch (err) {
		console.error("Failed to get default model", err)
		TelemetryService.instance.captureException(err, { context: "getAincrokDefaultModel" })
		return openRouterDefaultModelId
	}
}

export async function getAincrokDefaultModel(aincrokToken?: AincrokToken): Promise<string> {
	if (!aincrokToken) {
		return openRouterDefaultModelId
	}
	let defaultModelPromise = cache.get(aincrokToken ?? "")
	if (!defaultModelPromise) {
		defaultModelPromise = fetchAincrokDefaultModel(aincrokToken)
		cache.set(aincrokToken, defaultModelPromise)
	}
	return await defaultModelPromise
}
