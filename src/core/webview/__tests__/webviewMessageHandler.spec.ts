import type { Mock } from "vitest"

// Mock dependencies - must come before imports
vi.mock("../../../api/providers/fetchers/modelCache")

import { webviewMessageHandler } from "../webviewMessageHandler"
import type { ClineProvider } from "../ClineProvider"
import { getModels } from "../../../api/providers/fetchers/modelCache"
import type { ModelRecord } from "../../../shared/api"

const mockGetModels = getModels as Mock<typeof getModels>

// Mock ClineProvider
const mockClineProvider = {
	getState: vi.fn(),
	postMessageToWebview: vi.fn(),
	updateGlobalState: vi.fn(),
	customModesManager: {
		getCustomModes: vi.fn(),
		deleteCustomMode: vi.fn(),
	},
	context: {
		extensionPath: "/mock/extension/path",
		globalStorageUri: { fsPath: "/mock/global/storage" },
	},
	contextProxy: {
		context: {
			extensionPath: "/mock/extension/path",
			globalStorageUri: { fsPath: "/mock/global/storage" },
		},
		setValue: vi.fn(),
		getValue: vi.fn(),
	},
	log: vi.fn(),
	postStateToWebview: vi.fn(),
	getCurrentTask: vi.fn(),
	getTaskWithId: vi.fn(),
	createTaskWithHistoryItem: vi.fn(),
} as unknown as ClineProvider

import { t } from "../../../i18n"

vi.mock("vscode", () => ({
	window: {
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
		createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })), // kilocode_change
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/mock/workspace" } }],
	},
}))

vi.mock("../../../i18n", () => ({
	t: vi.fn((key: string, args?: Record<string, any>) => {
		// For the delete confirmation with rules, we need to return the interpolated string
		if (key === "common:confirmation.delete_custom_mode_with_rules" && args) {
			return `Are you sure you want to delete this ${args.scope} mode?\n\nThis will also delete the associated rules folder at:\n${args.rulesFolderPath}`
		}
		// Return the translated value for "Yes"
		if (key === "common:answers.yes") {
			return "Yes"
		}
		// Return the translated value for "Cancel"
		if (key === "common:answers.cancel") {
			return "Cancel"
		}
		return key
	}),
}))

vi.mock("fs/promises", () => {
	const mockRm = vi.fn().mockResolvedValue(undefined)
	const mockMkdir = vi.fn().mockResolvedValue(undefined)

	return {
		default: {
			rm: mockRm,
			mkdir: mockMkdir,
		},
		rm: mockRm,
		mkdir: mockMkdir,
	}
})

import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as os from "os"
import * as path from "path"
import * as fsUtils from "../../../utils/fs"
import { getWorkspacePath } from "../../../utils/path"
import { ensureSettingsDirectoryExists } from "../../../utils/globalContext"
import type { ModeConfig } from "@roo-code/types"

vi.mock("../../../utils/fs")
vi.mock("../../../utils/path")
vi.mock("../../../utils/globalContext")

describe("webviewMessageHandler - requestLmStudioModels", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockClineProvider.getState = vi.fn().mockResolvedValue({
			apiConfiguration: {
				lmStudioModelId: "model-1",
				lmStudioBaseUrl: "http://localhost:1234",
			},
		})
	})

	it("successfully fetches models from LMStudio", async () => {
		const mockModels: ModelRecord = {
			"model-1": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Test model 1",
			},
			"model-2": {
				maxTokens: 8192,
				contextWindow: 16384,
				supportsPromptCache: false,
				description: "Test model 2",
			},
		}

		mockGetModels.mockResolvedValue(mockModels)

		await webviewMessageHandler(mockClineProvider)({
			type: "requestLmStudioModels",
		})

		expect(mockGetModels).toHaveBeenCalledWith({ provider: "lmstudio", baseUrl: "http://localhost:1234" })

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "lmStudioModels",
			lmStudioModels: mockModels,
		})
	})
})

describe("webviewMessageHandler - requestRouterModels", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockClineProvider.getState = vi.fn().mockResolvedValue({
			apiConfiguration: {
				openRouterApiKey: "openrouter-key",
				requestyApiKey: "requesty-key",
				glamaApiKey: "glama-key",
				unboundApiKey: "unbound-key",
				litellmApiKey: "litellm-key",
				litellmBaseUrl: "http://localhost:4000",
			},
		})
	})

	it("successfully fetches models from all providers", async () => {
		const mockModels: ModelRecord = {
			"model-1": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Test model 1",
			},
			"model-2": {
				maxTokens: 8192,
				contextWindow: 16384,
				supportsPromptCache: false,
				description: "Test model 2",
			},
		}

		mockGetModels.mockResolvedValue(mockModels)

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
		})

		// Verify getModels was called for each provider
		expect(mockGetModels).toHaveBeenCalledWith({ provider: "openrouter", apiKey: "openrouter-key" }) // kilocode_change: apiKey
		expect(mockGetModels).toHaveBeenCalledWith({ provider: "requesty", apiKey: "requesty-key" })
		expect(mockGetModels).toHaveBeenCalledWith({ provider: "glama" })
		expect(mockGetModels).toHaveBeenCalledWith({ provider: "unbound", apiKey: "unbound-key" })
		expect(mockGetModels).toHaveBeenCalledWith({
			provider: "litellm",
			apiKey: "litellm-key",
			baseUrl: "http://localhost:4000",
		})

		// Verify response was sent
		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "routerModels",
			routerModels: {
				openrouter: mockModels,
				requesty: mockModels,
				glama: mockModels,
				unbound: mockModels,
				litellm: mockModels,
				"kilocode-openrouter": mockModels,
				ollama: mockModels, // kilocode_change
				deepinfra: mockModels, // kilocode_change
				lmstudio: {},
			},
		})
	})

	it("handles LiteLLM models with values from message when config is missing", async () => {
		mockClineProvider.getState = vi.fn().mockResolvedValue({
			apiConfiguration: {
				openRouterApiKey: "openrouter-key",
				requestyApiKey: "requesty-key",
				glamaApiKey: "glama-key",
				unboundApiKey: "unbound-key",
				// Missing litellm config
			},
		})

		const mockModels: ModelRecord = {
			"model-1": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Test model 1",
			},
		}

		mockGetModels.mockResolvedValue(mockModels)

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
			values: {
				litellmApiKey: "message-litellm-key",
				litellmBaseUrl: "http://message-url:4000",
			},
		})

		// Verify LiteLLM was called with values from message
		expect(mockGetModels).toHaveBeenCalledWith({
			provider: "litellm",
			apiKey: "message-litellm-key",
			baseUrl: "http://message-url:4000",
		})
	})

	it("skips LiteLLM when both config and message values are missing", async () => {
		mockClineProvider.getState = vi.fn().mockResolvedValue({
			apiConfiguration: {
				openRouterApiKey: "openrouter-key",
				requestyApiKey: "requesty-key",
				glamaApiKey: "glama-key",
				unboundApiKey: "unbound-key",
				// Missing litellm config
			},
		})

		const mockModels: ModelRecord = {
			"model-1": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Test model 1",
			},
		}

		mockGetModels.mockResolvedValue(mockModels)

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
			// No values provided
		})

		// Verify LiteLLM was NOT called
		expect(mockGetModels).not.toHaveBeenCalledWith(
			expect.objectContaining({
				provider: "litellm",
			}),
		)

		// Verify response includes empty object for LiteLLM
		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "routerModels",
			routerModels: {
				openrouter: mockModels,
				requesty: mockModels,
				glama: mockModels,
				unbound: mockModels,
				litellm: {},
				"kilocode-openrouter": mockModels,
				ollama: mockModels, // kilocode_change
				deepinfra: mockModels, // kilocode_change
				lmstudio: {},
			},
		})
	})

	it("handles individual provider failures gracefully", async () => {
		const mockModels: ModelRecord = {
			"model-1": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Test model 1",
			},
		}

		// Mock some providers to succeed and others to fail
		mockGetModels
			.mockResolvedValueOnce(mockModels) // openrouter
			.mockRejectedValueOnce(new Error("Requesty API error")) // requesty
			.mockResolvedValueOnce(mockModels) // glama
			.mockRejectedValueOnce(new Error("Unbound API error")) // unbound
			.mockResolvedValueOnce(mockModels) // kilocode-openrouter
			.mockRejectedValueOnce(new Error("Ollama API error")) // kilocode_change
			.mockResolvedValueOnce(mockModels) // kilocode_change deepinfra
			.mockRejectedValueOnce(new Error("LiteLLM connection failed")) // litellm

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
		})

		// Verify successful providers are included
		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "routerModels",
			routerModels: {
				openrouter: mockModels,
				requesty: {},
				glama: mockModels,
				unbound: {},
				litellm: {},
				"kilocode-openrouter": mockModels,
				ollama: {},
				deepinfra: mockModels,
				lmstudio: {},
			},
		})

		// Verify error messages were sent for failed providers
		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Requesty API error",
			values: { provider: "requesty" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Unbound API error",
			values: { provider: "unbound" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "LiteLLM connection failed",
			values: { provider: "litellm" },
		})
	})

	it("handles Error objects and string errors correctly", async () => {
		// Mock providers to fail with different error types
		mockGetModels
			.mockRejectedValueOnce(new Error("Structured error message")) // openrouter
			.mockRejectedValueOnce(new Error("Requesty API error")) // requesty
			.mockRejectedValueOnce(new Error("Glama API error")) // glama
			.mockRejectedValueOnce(new Error("Unbound API error")) // unbound
			.mockResolvedValueOnce({}) // kilocode-openrouter - Success
			.mockRejectedValueOnce(new Error("Ollama API error")) // kilocode_change
			.mockRejectedValueOnce({}) // kilocode_change deepinfra
			.mockRejectedValueOnce(new Error("LiteLLM connection failed")) // litellm

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
		})

		// Verify error handling for different error types
		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Structured error message",
			values: { provider: "openrouter" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Requesty API error",
			values: { provider: "requesty" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Glama API error",
			values: { provider: "glama" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "Unbound API error",
			values: { provider: "unbound" },
		})

		expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "singleRouterModelFetchResponse",
			success: false,
			error: "LiteLLM connection failed",
			values: { provider: "litellm" },
		})
	})

	it("prefers config values over message values for LiteLLM", async () => {
		const mockModels: ModelRecord = {}
		mockGetModels.mockResolvedValue(mockModels)

		await webviewMessageHandler(mockClineProvider)({
			type: "requestRouterModels",
			values: {
				litellmApiKey: "message-key",
				litellmBaseUrl: "http://message-url",
			},
		})

		// Verify config values are used over message values
		expect(mockGetModels).toHaveBeenCalledWith({
			provider: "litellm",
			apiKey: "litellm-key", // From config
			baseUrl: "http://localhost:4000", // From config
		})
	})
})

describe("webviewMessageHandler - deleteCustomMode", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(getWorkspacePath).mockReturnValue("/mock/workspace")
		vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(undefined)
		vi.mocked(ensureSettingsDirectoryExists).mockResolvedValue("/mock/global/storage/.roo")
	})

	it("should delete a project mode and its rules folder", async () => {
		const slug = "test-project-mode"
		const rulesFolderPath = path.join("/mock/workspace", ".roo", `rules-${slug}`)

		vi.mocked(mockClineProvider.customModesManager.getCustomModes).mockResolvedValue([
			{
				name: "Test Project Mode",
				slug,
				roleDefinition: "Test Role",
				groups: [],
				source: "project",
			} as ModeConfig,
		])
		vi.mocked(fsUtils.fileExistsAtPath).mockResolvedValue(true)
		vi.mocked(mockClineProvider.customModesManager.deleteCustomMode).mockResolvedValue(undefined)

		await webviewMessageHandler(mockClineProvider)({ type: "deleteCustomMode", slug })

		// The confirmation dialog is now handled in the webview, so we don't expect showInformationMessage to be called
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
		expect(mockClineProvider.customModesManager.deleteCustomMode).toHaveBeenCalledWith(slug)
		expect(fs.rm).toHaveBeenCalledWith(rulesFolderPath, { recursive: true, force: true })
	})

	it("should delete a global mode and its rules folder", async () => {
		const slug = "test-global-mode"
		const homeDir = os.homedir()
		const rulesFolderPath = path.join(homeDir, ".roo", `rules-${slug}`)

		vi.mocked(mockClineProvider.customModesManager.getCustomModes).mockResolvedValue([
			{
				name: "Test Global Mode",
				slug,
				roleDefinition: "Test Role",
				groups: [],
				source: "global",
			} as ModeConfig,
		])
		vi.mocked(fsUtils.fileExistsAtPath).mockResolvedValue(true)
		vi.mocked(mockClineProvider.customModesManager.deleteCustomMode).mockResolvedValue(undefined)

		await webviewMessageHandler(mockClineProvider)({ type: "deleteCustomMode", slug })

		// The confirmation dialog is now handled in the webview, so we don't expect showInformationMessage to be called
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
		expect(mockClineProvider.customModesManager.deleteCustomMode).toHaveBeenCalledWith(slug)
		expect(fs.rm).toHaveBeenCalledWith(rulesFolderPath, { recursive: true, force: true })
	})

	it("should only delete the mode when rules folder does not exist", async () => {
		const slug = "test-mode-no-rules"
		vi.mocked(mockClineProvider.customModesManager.getCustomModes).mockResolvedValue([
			{
				name: "Test Mode No Rules",
				slug,
				roleDefinition: "Test Role",
				groups: [],
				source: "project",
			} as ModeConfig,
		])
		vi.mocked(fsUtils.fileExistsAtPath).mockResolvedValue(false)
		vi.mocked(mockClineProvider.customModesManager.deleteCustomMode).mockResolvedValue(undefined)

		await webviewMessageHandler(mockClineProvider)({ type: "deleteCustomMode", slug })

		// The confirmation dialog is now handled in the webview, so we don't expect showInformationMessage to be called
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
		expect(mockClineProvider.customModesManager.deleteCustomMode).toHaveBeenCalledWith(slug)
		expect(fs.rm).not.toHaveBeenCalled()
	})

	it("should handle errors when deleting rules folder", async () => {
		const slug = "test-mode-error"
		const rulesFolderPath = path.join("/mock/workspace", ".roo", `rules-${slug}`)
		const error = new Error("Permission denied")

		vi.mocked(mockClineProvider.customModesManager.getCustomModes).mockResolvedValue([
			{
				name: "Test Mode Error",
				slug,
				roleDefinition: "Test Role",
				groups: [],
				source: "project",
			} as ModeConfig,
		])
		vi.mocked(fsUtils.fileExistsAtPath).mockResolvedValue(true)
		vi.mocked(mockClineProvider.customModesManager.deleteCustomMode).mockResolvedValue(undefined)
		vi.mocked(fs.rm).mockRejectedValue(error)

		await webviewMessageHandler(mockClineProvider)({ type: "deleteCustomMode", slug })

		expect(mockClineProvider.customModesManager.deleteCustomMode).toHaveBeenCalledWith(slug)
		expect(fs.rm).toHaveBeenCalledWith(rulesFolderPath, { recursive: true, force: true })
		// Verify error message is shown to the user
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			t("common:errors.delete_rules_folder_failed", {
				rulesFolderPath,
				error: error.message,
			}),
		)
		// No error response is sent anymore - we just continue with deletion
		expect(mockClineProvider.postMessageToWebview).not.toHaveBeenCalled()
	})
})

describe("webviewMessageHandler - message dialog preferences", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Mock a current Cline instance
		vi.mocked(mockClineProvider.getCurrentTask).mockReturnValue({
			taskId: "test-task-id",
			apiConversationHistory: [],
			clineMessages: [],
		} as any)
		// Reset getValue mock
		vi.mocked(mockClineProvider.contextProxy.getValue).mockReturnValue(false)
	})

	describe("deleteMessage", () => {
		it("should always show dialog for delete confirmation", async () => {
			vi.mocked(mockClineProvider.getCurrentTask).mockReturnValue({} as any)

			await webviewMessageHandler(mockClineProvider)({
				type: "deleteMessage",
				value: 123456789, // Changed from messageTs to value
			})

			expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
				type: "showDeleteMessageDialog",
				messageTs: 123456789,
			})
		})
	})

	describe("submitEditedMessage", () => {
		it("should always show dialog for edit confirmation", async () => {
			vi.mocked(mockClineProvider.getCurrentTask).mockReturnValue({} as any)

			await webviewMessageHandler(mockClineProvider)({
				type: "submitEditedMessage",
				value: 123456789,
				editedMessageContent: "edited content",
			})

			expect(mockClineProvider.postMessageToWebview).toHaveBeenCalledWith({
				type: "showEditMessageDialog",
				messageTs: 123456789,
				text: "edited content",
			})
		})
	})
})

describe("webviewMessageHandler - mcpEnabled", () => {
	let mockMcpHub: any

	beforeEach(() => {
		vi.clearAllMocks()

		// Create a mock McpHub instance
		mockMcpHub = {
			handleMcpEnabledChange: vi.fn().mockResolvedValue(undefined),
		}

		// Ensure provider exposes getMcpHub and returns our mock
		;(mockClineProvider as any).getMcpHub = vi.fn().mockReturnValue(mockMcpHub)
	})

	it("delegates enable=true to McpHub and posts updated state", async () => {
		await webviewMessageHandler(mockClineProvider)({
			type: "mcpEnabled",
			bool: true,
		})

		expect((mockClineProvider as any).getMcpHub).toHaveBeenCalledTimes(1)
		expect(mockMcpHub.handleMcpEnabledChange).toHaveBeenCalledTimes(1)
		expect(mockMcpHub.handleMcpEnabledChange).toHaveBeenCalledWith(true)
		expect(mockClineProvider.postStateToWebview).toHaveBeenCalledTimes(1)
	})

	it("delegates enable=false to McpHub and posts updated state", async () => {
		await webviewMessageHandler(mockClineProvider)({
			type: "mcpEnabled",
			bool: false,
		})

		expect((mockClineProvider as any).getMcpHub).toHaveBeenCalledTimes(1)
		expect(mockMcpHub.handleMcpEnabledChange).toHaveBeenCalledTimes(1)
		expect(mockMcpHub.handleMcpEnabledChange).toHaveBeenCalledWith(false)
		expect(mockClineProvider.postStateToWebview).toHaveBeenCalledTimes(1)
	})

	it("handles missing McpHub instance gracefully and still posts state", async () => {
		;(mockClineProvider as any).getMcpHub = vi.fn().mockReturnValue(undefined)

		await webviewMessageHandler(mockClineProvider)({
			type: "mcpEnabled",
			bool: true,
		})

		expect((mockClineProvider as any).getMcpHub).toHaveBeenCalledTimes(1)
		expect(mockClineProvider.postStateToWebview).toHaveBeenCalledTimes(1)
	})
})

describe("webviewMessageHandler - upsertApiConfiguration - settings persistence regression tests", () => {
	/**
	 * Regression test for settings persistence bug where profiles were being reset
	 * to empty when saving due to webviewMessageHandler.ts overwriting profiles
	 * with empty objects instead of merging partial updates.
	 *
	 * Bug scenario: When upsertApiConfiguration was called with empty or partial
	 * object, existing profile data was completely overwritten rather than merged.
	 *
	 * Fix: Added merge logic in webviewMessageHandler.ts to merge incoming partial
	 * apiConfiguration with existing profile before persisting.
	 */

	const mockExistingProfile = {
		id: "test-profile",
		name: "Test Profile",
		apiConfiguration: {
			apiKey: "existing-api-key",
			baseUrl: "https://existing-api.example.com",
			model: "existing-model-name",
			temperature: 0.7,
			maxTokens: 4000,
			topP: 0.9,
		},
		customInstructions: "Existing custom instructions",
	}

	let testMockProvider: any

	beforeEach(() => {
		// Reset all mocks completely
		vi.clearAllMocks()
		vi.resetAllMocks()

		// Create a completely fresh mock provider for these tests
		testMockProvider = {
			providerSettingsManager: {
				getProfile: vi.fn().mockResolvedValue(mockExistingProfile),
				setProfile: vi.fn(),
				deleteProfile: vi.fn(),
				getAllProfiles: vi.fn().mockReturnValue([mockExistingProfile]),
			},
			upsertProviderProfile: vi.fn(),
			updateGlobalState: vi.fn(),
			postStateToWebview: vi.fn(),
			postMessageToWebview: vi.fn(),
		}
	})

	it("should preserve existing fields when upsertApiConfiguration receives empty object", async () => {
		// Arrange - empty apiConfiguration should preserve existing profile fields
		const message = {
			type: "upsertApiConfiguration" as const,
			text: "test-profile",
			apiConfiguration: {},
		}

		// Act
		await webviewMessageHandler(testMockProvider)(message)

		// Assert - should preserve existing profile fields
		expect(testMockProvider.upsertProviderProfile).toHaveBeenCalledWith(
			"test-profile",
			expect.objectContaining({
				id: "test-profile",
				name: "Test Profile",
				apiConfiguration: mockExistingProfile.apiConfiguration,
				customInstructions: "Existing custom instructions",
			}),
		)
	})

	it("should merge partial updates with existing data preserving unchanged fields", async () => {
		// Arrange - partial update should merge with existing data
		const partialApiConfiguration = {
			apiKey: "updated-api-key",
			// Missing: baseUrl, model, temperature, maxTokens, topP
		}

		const message = {
			type: "upsertApiConfiguration" as const,
			text: "test-profile",
			apiConfiguration: partialApiConfiguration,
		}

		// Act
		await webviewMessageHandler(testMockProvider)(message)

		// Assert - the merge logic spreads the apiConfiguration at top level
		expect(testMockProvider.upsertProviderProfile).toHaveBeenCalledWith(
			"test-profile",
			expect.objectContaining({
				id: "test-profile",
				name: "Test Profile",
				apiConfiguration: mockExistingProfile.apiConfiguration, // Original preserved
				apiKey: "updated-api-key", // New field added at top level
				customInstructions: "Existing custom instructions",
			}),
		)
	})

	it("should handle case where profile does not exist by creating new profile", async () => {
		// Arrange - simulate scenario where profile doesn't exist using proper async rejection
		testMockProvider.providerSettingsManager.getProfile.mockRejectedValue(new Error("Profile not found"))

		const newApiConfiguration = {
			apiKey: "new-api-key",
			baseUrl: "https://new-api.example.com",
			model: "gpt-4",
		}

		const message = {
			type: "upsertApiConfiguration" as const,
			text: "new-profile",
			apiConfiguration: newApiConfiguration,
		}

		// Act
		await webviewMessageHandler(testMockProvider)(message)

		// Assert - should create new profile with provided data spread at top level
		expect(testMockProvider.upsertProviderProfile).toHaveBeenCalledWith(
			"new-profile",
			expect.objectContaining({
				apiKey: "new-api-key",
				baseUrl: "https://new-api.example.com",
				model: "gpt-4",
			}),
		)
	})

	it("should handle null or undefined existing apiConfiguration gracefully", async () => {
		// Arrange - profile exists but has no apiConfiguration
		const profileWithoutApiConfig = {
			...mockExistingProfile,
			apiConfiguration: null,
		}
		testMockProvider.providerSettingsManager.getProfile.mockResolvedValue(profileWithoutApiConfig)

		const apiConfiguration = {
			apiKey: "new-api-key",
		}

		const message = {
			type: "upsertApiConfiguration" as const,
			text: "test-profile",
			apiConfiguration,
		}

		// Act
		await webviewMessageHandler(testMockProvider)(message)

		// Assert - should handle null existing apiConfiguration, spreading new data at top level
		expect(testMockProvider.upsertProviderProfile).toHaveBeenCalledWith(
			"test-profile",
			expect.objectContaining({
				id: "test-profile",
				name: "Test Profile",
				apiConfiguration: null, // Original null preserved
				apiKey: "new-api-key", // New data spread at top level
				customInstructions: "Existing custom instructions",
			}),
		)
	})
})
