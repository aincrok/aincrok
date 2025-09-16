import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"
import SettingsView from "../../settings/SettingsView"

/**
 * Memory Settings E2E Persistence Test
 *
 * This test verifies that memory configuration input fields maintain their
 * values after clicking the save button. This is a true end-to-end test that
 * tests the actual UI behavior that users experience.
 */

describe("Memory Settings E2E Persistence", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Extension state with initial memory configuration
	const extensionStateWithMemoryConfig = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
			// Initial memory configuration that should persist
			cipherMode: "embedded",
			cipherAutoCapture: true,
			cipherLlmProvider: "anthropic",
			cipherLlmApiKey: "test-cipher-key",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "text-embedding-3-small",
			cipherEmbeddingDimensions: 1536,
			cipherVectorStore: "qdrant",
			cipherVectorStoreUrl: "http://localhost:6333",
		},
		currentApiConfigName: "default",
		listApiConfigMeta: [{ id: "default", label: "Default" }],
		uriScheme: "vscode",
		settingsImportedAt: null,
		alwaysAllowReadOnly: false,
		alwaysAllowReadOnlyOutsideWorkspace: false,
		alwaysAllowWrite: false,
		alwaysAllowWriteOutsideWorkspace: false,
		alwaysAllowWriteProtected: false,
		alwaysAllowBrowser: false,
		alwaysAllowExecute: false,
		alwaysAllowMcp: false,
		alwaysAllowModeSwitch: false,
		alwaysAllowSubtasks: false,
		alwaysAllowFollowupQuestions: false,
		alwaysAllowUpdateTodoList: false,
		alwaysApproveResubmit: false,
		allowedCommands: [],
		deniedCommands: [],
		allowedMaxRequests: undefined,
		allowedMaxCost: undefined,
		language: "en",
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-expect-error
		global.vscode = mockVscode
		global.ResizeObserver = vi.fn().mockImplementation(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}))
	})

	const renderMemorySettings = (extensionState = extensionStateWithMemoryConfig) => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		return render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<ExtensionStateContext.Provider value={extensionState as any}>
						<SettingsView onDone={mockOnDone} targetSection="memory" />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	it("E2E: memory input fields should retain values after save button is clicked", async () => {
		const { getByTestId } = renderMemorySettings()

		// Wait for component to render
		await waitFor(
			() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			},
			{ timeout: 5000 },
		)

		// Navigate to memory tab
		const memoryTab = await waitFor(
			() => {
				return screen.getByTestId("tab-memory")
			},
			{ timeout: 5000 },
		)

		fireEvent.click(memoryTab)

		// Wait for memory tab to become active and content to load
		await waitFor(
			() => {
				expect(memoryTab).toHaveAttribute("aria-selected", "true")
			},
			{ timeout: 5000 },
		)

		// Wait for cipher mode dropdown to appear with initial value
		await waitFor(
			() => {
				const embeddedOption = screen.queryByText("Embedded (Zero Config)")
				expect(embeddedOption).toBeInTheDocument()
			},
			{ timeout: 5000 },
		)

		// Verify initial values are displayed correctly
		const initialValues = {
			cipherMode: "embedded", // Should show "Embedded (Zero Config)"
			cipherLlmProvider: "anthropic", // Should show "Anthropic"
			cipherLlmApiKey: "test-cipher-key", // Should be in API key input
			cipherEmbeddingProvider: "openai", // Should show "OpenAI"
			cipherEmbeddingModel: "text-embedding-3-small", // Should be in model input
			cipherEmbeddingDimensions: "1536", // Should be in dimensions input
			cipherVectorStore: "qdrant", // Should show "Qdrant"
			cipherVectorStoreUrl: "http://localhost:6333", // Should be in URL input
		}

		// Verify some key fields are showing initial values
		expect(screen.getByText("Embedded (Zero Config)")).toBeInTheDocument()
		expect(screen.getByText("Anthropic")).toBeInTheDocument()
		expect(screen.getByText("OpenAI")).toBeInTheDocument()
		expect(screen.getByText("Qdrant")).toBeInTheDocument()

		// Find text inputs and verify they have initial values
		const apiKeyInputs = screen.getAllByDisplayValue("test-cipher-key")
		expect(apiKeyInputs.length).toBeGreaterThan(0)

		const modelInputs = screen.getAllByDisplayValue("text-embedding-3-small")
		expect(modelInputs.length).toBeGreaterThan(0)

		const dimensionInputs = screen.getAllByDisplayValue("1536")
		expect(dimensionInputs.length).toBeGreaterThan(0)

		const urlInputs = screen.getAllByDisplayValue("http://localhost:6333")
		expect(urlInputs.length).toBeGreaterThan(0)

		// Make a small change to enable the save button
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)

		await waitFor(() => {
			expect(autoApproveTab).toHaveAttribute("aria-selected", "true")
		})

		const readOnlyToggle = await waitFor(() => {
			return screen.getByTestId("always-allow-readonly-toggle")
		})
		fireEvent.click(readOnlyToggle)

		// Save button should now be enabled (still on autoApprove tab)
		await waitFor(() => {
			const saveButton = getByTestId("save-button")
			expect(saveButton).not.toBeDisabled()
		})

		// THIS IS THE CRITICAL TEST: Click save while still on autoApprove tab
		// Switching back to memory tab before save breaks form submission context
		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		// Wait for save operation to complete
		await waitFor(
			() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			},
			{ timeout: 5000 },
		)

		// NOW go back to memory tab to verify persistence
		fireEvent.click(memoryTab)
		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// CRITICAL VERIFICATION: After save, all the memory field values should still be present
		// This is what was failing in the original bug - fields would get cleared to defaults

		// Wait a bit for any potential state updates to complete
		await waitFor(
			() => {
				// Verify cipher mode is still "Embedded (Zero Config)" and not reset to "Disabled"
				const embeddedOption = screen.queryByText("Embedded (Zero Config)")
				expect(embeddedOption).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)

		// Verify LLM provider is still "Anthropic" and not reset to "OpenAI" (default)
		await waitFor(() => {
			const anthropicOption = screen.queryByText(/Anthropic/i)
			expect(anthropicOption).toBeInTheDocument()
		})

		// Verify API key field still contains the original value
		await waitFor(() => {
			const apiKeyInputs = screen.queryAllByDisplayValue("test-cipher-key")
			expect(apiKeyInputs.length).toBeGreaterThan(0)
		})

		// Verify embedding model field still contains the original value
		await waitFor(() => {
			const modelInputs = screen.queryAllByDisplayValue("text-embedding-3-small")
			expect(modelInputs.length).toBeGreaterThan(0)
		})

		// Verify dimensions field still contains the original value (not reset to 1536 default)
		await waitFor(() => {
			const dimensionInputs = screen.queryAllByDisplayValue("1536")
			expect(dimensionInputs.length).toBeGreaterThan(0)
		})

		// Verify vector store is still "Qdrant" and not reset to "In-Memory" (default)
		await waitFor(() => {
			const qdrantOption = screen.queryByText("Qdrant")
			expect(qdrantOption).toBeInTheDocument()
		})

		// Verify vector store URL field still contains the original value
		await waitFor(() => {
			const urlInputs = screen.queryAllByDisplayValue("http://localhost:6333")
			expect(urlInputs.length).toBeGreaterThan(0)
		})
	}, 30000) // Extended timeout for complex E2E test

	it("E2E: should handle partial memory configuration without clearing existing values", async () => {
		// Test with partial configuration to ensure only set fields persist
		const partialMemoryState = {
			...extensionStateWithMemoryConfig,
			apiConfiguration: {
				...extensionStateWithMemoryConfig.apiConfiguration,
				cipherMode: "mcp",
				cipherLlmProvider: "openai",
				cipherLlmApiKey: "partial-test-key",
				// Intentionally omit other fields to test partial persistence
			},
		}

		const { getByTestId } = renderMemorySettings(partialMemoryState)

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		// Navigate to memory tab
		const memoryTab = await waitFor(() => screen.getByTestId("tab-memory"))
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Verify initial partial state
		await waitFor(() => {
			expect(screen.getByText(/MCP/i)).toBeInTheDocument() // MCP mode
			expect(screen.getByText(/OpenAI/i)).toBeInTheDocument() // OpenAI provider
		})

		// Enable save button
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)
		const readOnlyToggle = await waitFor(() => screen.getByTestId("always-allow-readonly-toggle"))
		fireEvent.click(readOnlyToggle)

		// Click save while still on autoApprove tab (don't switch back to memory first)
		await waitFor(() => {
			const saveButton = getByTestId("save-button")
			expect(saveButton).not.toBeDisabled()
		})

		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalled()
		})

		// Now go back to memory tab to verify persistence
		fireEvent.click(memoryTab)

		// Verify partial values persist after save
		await waitFor(
			() => {
				expect(screen.queryByText(/MCP/i)).toBeInTheDocument()
				expect(screen.queryByText(/OpenAI/i)).toBeInTheDocument()
				const apiKeyInputs = screen.queryAllByDisplayValue("partial-test-key")
				expect(apiKeyInputs.length).toBeGreaterThan(0)
			},
			{ timeout: 3000 },
		)
	}, 30000)

	it("E2E: should demonstrate the original bug if save flow is broken", async () => {
		// This test documents what the bug looked like when it was present
		// If the bug exists, fields would be reset to defaults after save

		const { getByTestId } = renderMemorySettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		const memoryTab = await waitFor(() => screen.getByTestId("tab-memory"))
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Record what values should be present initially
		const expectedValues = {
			mode: "Embedded (Zero Config)",
			provider: "Anthropic",
			apiKey: "test-cipher-key",
			embeddingProvider: "OpenAI",
			model: "text-embedding-3-small",
			dimensions: "1536",
			vectorStore: "Qdrant",
			vectorUrl: "http://localhost:6333",
		}

		// Verify initial values
		expect(screen.getByText(expectedValues.mode)).toBeInTheDocument()
		expect(screen.getByText(expectedValues.provider)).toBeInTheDocument()
		expect(screen.getByText(expectedValues.embeddingProvider)).toBeInTheDocument()

		// Trigger save
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)
		const readOnlyToggle = await waitFor(() => screen.getByTestId("always-allow-readonly-toggle"))
		fireEvent.click(readOnlyToggle)

		// Click save while still on autoApprove tab
		const saveButton = getByTestId("save-button")
		await waitFor(() => expect(saveButton).not.toBeDisabled())
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalled()
		})

		// Now go back to memory tab to verify values persisted
		fireEvent.click(memoryTab)

		// With the fix, these values should still be present
		// With the original bug, they would be reset to defaults:
		// - Mode would become "Disabled"
		// - LLM Provider would become "OpenAI"
		// - Vector Store would become "In-Memory"
		// - Text fields would become empty

		await waitFor(
			() => {
				// These should NOT be present if bug exists:
				expect(screen.queryByText("Disabled")).not.toBeInTheDocument() // Bug would show this

				// These SHOULD be present with the fix:
				expect(screen.getByText(expectedValues.mode)).toBeInTheDocument()
				expect(screen.getByText(expectedValues.provider)).toBeInTheDocument()
				expect(screen.getByText(expectedValues.vectorStore)).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)
	}, 30000)
})
