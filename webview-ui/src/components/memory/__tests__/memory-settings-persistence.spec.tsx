import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, fireEvent, waitFor, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import SettingsView from "../../settings/SettingsView"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"

/**
 * Memory Settings Field Persistence Tests
 *
 * These tests verify that memory configuration fields are properly persisted
 * when the save button is clicked. The bug being tested is that all memory
 * fields are cleared after save due to improper state synchronization.
 *
 * Test-Driven Development approach:
 * 1. Write failing tests that demonstrate the bug
 * 2. Implement fix to make tests pass
 * 3. Verify all tests pass with the fix
 */

describe("Memory Settings Field Persistence", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Mock extension state with memory settings
	const mockExtensionStateWithMemory = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
			// Memory/cipher configuration fields that should persist after save
			cipherMode: "embedded",
			cipherAutoCapture: true,
			cipherLlmProvider: "anthropic",
			cipherLlmModel: "claude-3-sonnet-20240229",
			cipherLlmApiKey: "test-cipher-key",
			cipherLlmBaseUrl: "",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "text-embedding-3-small",
			cipherEmbeddingApiKey: "test-embedding-key",
			cipherEmbeddingBaseUrl: "",
			cipherEmbeddingDimensions: 1536,
			cipherVectorStore: "qdrant",
			cipherVectorStoreUrl: "http://localhost:6333",
			cipherVectorStoreApiKey: "",
		},
		currentApiConfigName: "default",
		listApiConfigMeta: [{ id: "default", label: "Default" }],
		uriScheme: "vscode",
		settingsImportedAt: null,
		// Other required extension state fields
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

	// Extension state without memory fields (simulates after save when fields are cleared)
	const mockExtensionStateWithoutMemory = {
		...mockExtensionStateWithMemory,
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
			// No cipher fields - this simulates the bug where fields are cleared
		},
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-ignore
		global.vscode = mockVscode
		// Mock ResizeObserver
		global.ResizeObserver = vi.fn().mockImplementation(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}))
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	const renderComponent = (state = mockExtensionStateWithMemory) => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		return render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<ExtensionStateContext.Provider value={state as any}>
						<SettingsView onDone={mockOnDone} targetSection="memory" />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	describe("Memory Field Persistence - Core Bug Tests", () => {
		it("FAIL: should preserve cipher mode setting after save", async () => {
			const { getByTestId } = renderComponent()

			// Wait for component to render
			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Look for cipher mode select or input field
			// This test should fail initially because the field gets cleared after save
			const cipherModeField = await waitFor(() => {
				// Try to find cipher mode field by various selectors
				const field =
					screen.queryByDisplayValue("embedded") ||
					screen.queryByText("embedded") ||
					screen.queryByRole("combobox", { name: /cipher.*mode/i })
				expect(field).toBeInTheDocument()
				return field
			})

			// Click save button
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			// Wait for save operation to complete
			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// BUG: After save, the cipher mode field should still show "embedded"
			// but it gets cleared to default value. This test should FAIL until fixed.
			await waitFor(() => {
				const fieldAfterSave = screen.queryByDisplayValue("embedded") || screen.queryByText("embedded")
				expect(fieldAfterSave).toBeInTheDocument() // This will FAIL due to bug
			})
		})

		it("FAIL: should preserve cipher LLM provider setting after save", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Look for cipher LLM provider field showing "anthropic"
			const llmProviderField = await waitFor(() => {
				const field =
					screen.queryByDisplayValue("anthropic") ||
					screen.queryByText("Anthropic") ||
					screen.queryByRole("combobox", { name: /llm.*provider/i })
				expect(field).toBeInTheDocument()
				return field
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// This should FAIL - LLM provider gets cleared after save
			await waitFor(() => {
				const fieldAfterSave = screen.queryByDisplayValue("anthropic") || screen.queryByText("Anthropic")
				expect(fieldAfterSave).toBeInTheDocument() // Will FAIL due to bug
			})
		})

		it("FAIL: should preserve cipher API key after save", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Look for cipher API key field
			const apiKeyField = await waitFor(() => {
				const field =
					screen.queryByDisplayValue("test-cipher-key") ||
					screen.queryByPlaceholderText(/api.*key/i) ||
					screen.queryByLabelText(/cipher.*key/i)
				expect(field).toBeInTheDocument()
				return field
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// This should FAIL - API key gets cleared after save
			await waitFor(() => {
				const fieldAfterSave = screen.queryByDisplayValue("test-cipher-key")
				expect(fieldAfterSave).toBeInTheDocument() // Will FAIL due to bug
			})
		})

		it("FAIL: should preserve embedding configuration after save", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Look for embedding provider field
			const embeddingProviderField = await waitFor(() => {
				const field =
					screen.queryByDisplayValue("openai") ||
					screen.queryByText("OpenAI") ||
					screen.queryByRole("combobox", { name: /embedding.*provider/i })
				expect(field).toBeInTheDocument()
				return field
			})

			// Look for embedding dimensions field
			const dimensionsField = await waitFor(() => {
				const field = screen.queryByDisplayValue("1536") || screen.queryByLabelText(/dimensions/i)
				expect(field).toBeInTheDocument()
				return field
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// These should FAIL - embedding settings get cleared after save
			await waitFor(() => {
				const providerAfterSave = screen.queryByDisplayValue("openai")
				const dimensionsAfterSave = screen.queryByDisplayValue("1536")
				expect(providerAfterSave).toBeInTheDocument() // Will FAIL due to bug
				expect(dimensionsAfterSave).toBeInTheDocument() // Will FAIL due to bug
			})
		})

		it("FAIL: should preserve vector store configuration after save", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Look for vector store provider field
			const vectorStoreProviderField = await waitFor(() => {
				const field =
					screen.queryByDisplayValue("qdrant") ||
					screen.queryByText("Qdrant") ||
					screen.queryByRole("combobox", { name: /vector.*store.*provider/i })
				expect(field).toBeInTheDocument()
				return field
			})

			// Look for vector store URL field
			const urlField = await waitFor(() => {
				const field = screen.queryByDisplayValue("http://localhost:6333") || screen.queryByLabelText(/url/i)
				expect(field).toBeInTheDocument()
				return field
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// These should FAIL - vector store settings get cleared after save
			await waitFor(() => {
				const providerAfterSave = screen.queryByDisplayValue("qdrant")
				const urlAfterSave = screen.queryByDisplayValue("http://localhost:6333")
				expect(providerAfterSave).toBeInTheDocument() // Will FAIL due to bug
				expect(urlAfterSave).toBeInTheDocument() // Will FAIL due to bug
			})
		})
	})

	describe("Memory Field Persistence - Message Sending Tests", () => {
		it("FAIL: should send cipher field values via postMessage on save", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// Verify that cipher field messages were sent
			// This might PASS if the postMessage calls were added, but the bug persists
			// because the messages aren't being handled correctly
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherMode",
				text: "embedded",
			})
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherLlmProvider",
				text: "anthropic",
			})
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherLlmApiKey",
				text: "test-cipher-key",
			})
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherEmbeddingProvider",
				text: "openai",
			})
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherEmbeddingDimensions",
				text: "1536",
			})
		})

		it("should handle boolean cipher field persistence", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// Verify boolean fields are sent correctly
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherAutoCapture",
				bool: true,
			})
		})
	})

	describe("Memory Field Persistence - State Synchronization", () => {
		it("FAIL: should maintain field values when extension state is updated after save", async () => {
			const { getByTestId, rerender } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Verify initial values are displayed
			await waitFor(() => {
				expect(screen.queryByDisplayValue("embedded")).toBeInTheDocument()
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// Simulate extension state update (this is where the bug manifests)
			// The extension sends back state without cipher fields, causing them to reset
			const queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
					mutations: { retry: false },
				},
			})

			rerender(
				<QueryClientProvider client={queryClient}>
					<TooltipProvider>
						<ExtensionStateContext.Provider value={mockExtensionStateWithoutMemory as any}>
							<SettingsView onDone={mockOnDone} targetSection="providers" />
						</ExtensionStateContext.Provider>
					</TooltipProvider>
				</QueryClientProvider>,
			)

			// After rerender with extension state that lacks cipher fields,
			// the UI should STILL show the cipher values (they should be preserved)
			// This will FAIL because the bug causes fields to reset to defaults
			await waitFor(
				() => {
					const cipherModeField = screen.queryByDisplayValue("embedded")
					expect(cipherModeField).toBeInTheDocument() // Will FAIL - shows "disabled" instead
				},
				{ timeout: 3000 },
			)
		})

		it("FAIL: should prevent field clearing when getState applies defaults", async () => {
			// This test simulates the core issue: when postStateToWebview is called after save,
			// getState() applies default values for missing cipher fields, overriding user settings

			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Make a modification to cipher settings
			const cipherModeField = await waitFor(() => {
				return screen.queryByDisplayValue("embedded") || screen.getByRole("combobox")
			})

			// Change cipher mode to "mcp" for example
			if (cipherModeField && cipherModeField.tagName === "SELECT") {
				fireEvent.change(cipherModeField, { target: { value: "mcp" } })
			}

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// The bug: postStateToWebview() calls getState() which applies defaults
			// for any cipher fields not present in global state, overriding user changes
			// This test should FAIL until the synchronization issue is fixed
			await waitFor(() => {
				const fieldAfterSave = screen.queryByDisplayValue("mcp")
				expect(fieldAfterSave).toBeInTheDocument() // Will FAIL due to defaults override
			})
		})
	})

	describe("Memory Field Persistence - Integration Tests", () => {
		it("FAIL: complete cipher configuration should persist through save cycle", async () => {
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Verify all initial cipher field values are present
			const initialValues = {
				mode: "embedded",
				llmProvider: "anthropic",
				llmModel: "claude-3-sonnet-20240229",
				llmApiKey: "test-cipher-key",
				embeddingProvider: "openai",
				embeddingModel: "text-embedding-3-small",
				embeddingApiKey: "test-embedding-key",
				embeddingDimensions: "1536",
				vectorStoreProvider: "qdrant",
				vectorStoreUrl: "http://localhost:6333",
			}

			// Check that initial values are displayed
			for (const [field, value] of Object.entries(initialValues)) {
				await waitFor(() => {
					const fieldElement = screen.queryByDisplayValue(value)
					expect(fieldElement, `Field ${field} with value ${value} should be displayed`).toBeInTheDocument()
				})
			}

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// After save, ALL cipher field values should still be present
			// This will FAIL due to the bug where fields get cleared
			for (const [field, value] of Object.entries(initialValues)) {
				await waitFor(
					() => {
						const fieldElement = screen.queryByDisplayValue(value)
						expect(
							fieldElement,
							`Field ${field} with value ${value} should persist after save`,
						).toBeInTheDocument() // Will FAIL
					},
					{ timeout: 2000 },
				)
			}
		})

		it("should handle edge case: partial cipher configuration", async () => {
			// Test with only some cipher fields set
			const partialState = {
				...mockExtensionStateWithMemory,
				apiConfiguration: {
					...mockExtensionStateWithMemory.apiConfiguration,
					cipherMode: "embedded",
					cipherLlmProvider: "anthropic",
					// Other cipher fields undefined/empty
					cipherLlmApiKey: "",
					cipherEmbeddingProvider: "",
					cipherEmbeddingDimensions: 0,
				},
			}

			const { getByTestId } = renderComponent(partialState)

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// Even partial configuration should be preserved
			await waitFor(() => {
				expect(screen.queryByDisplayValue("embedded")).toBeInTheDocument()
				expect(screen.queryByDisplayValue("anthropic")).toBeInTheDocument()
			})
		})
	})

	describe("Memory Field Persistence - Fix Validation", () => {
		it("should validate that fix properly synchronizes cipher fields with global state", async () => {
			// This test validates the fix implementation
			const { getByTestId } = renderComponent()

			await waitFor(() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
			})

			// Click save
			const saveButton = getByTestId("save-button")
			fireEvent.click(saveButton)

			await waitFor(() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			})

			// The fix should ensure that:
			// 1. All cipher fields are sent via postMessage
			// 2. Message handlers save them to global state
			// 3. getState() retrieves them correctly instead of applying defaults
			// 4. UI continues to display saved values

			const expectedMessages = [
				{ type: "cipherMode", text: "embedded" },
				{ type: "cipherAutoCapture", bool: true },
				{ type: "cipherLlmProvider", text: "anthropic" },
				{ type: "cipherLlmModel", text: "claude-3-sonnet-20240229" },
				{ type: "cipherLlmApiKey", text: "test-cipher-key" },
				{ type: "cipherEmbeddingProvider", text: "openai" },
				{ type: "cipherEmbeddingModel", text: "text-embedding-3-small" },
				{ type: "cipherEmbeddingApiKey", text: "test-embedding-key" },
				{ type: "cipherEmbeddingDimensions", text: "1536" },
				{ type: "cipherVectorStore", text: "qdrant" },
				{ type: "cipherVectorStoreUrl", text: "http://localhost:6333" },
			]

			for (const expectedMessage of expectedMessages) {
				expect(mockVscode.postMessage).toHaveBeenCalledWith(expectedMessage)
			}
		})
	})
})
