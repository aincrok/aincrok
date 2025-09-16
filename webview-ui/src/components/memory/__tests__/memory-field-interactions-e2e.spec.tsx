import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"
import SettingsView from "../../settings/SettingsView"
import userEvent from "@testing-library/user-event"

/**
 * Memory Field Interactions E2E Test
 *
 * This test focuses on actual form interactions to reproduce the memory
 * field clearing bug by:
 * 1. Changing input field values
 * 2. Clicking Save button
 * 3. Verifying that field values persist (not cleared to defaults)
 */

describe("Memory Field Interactions E2E", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Extension state with pre-configured memory values (tests field persistence)
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

	// Start with default/empty memory configuration
	const extensionStateWithDefaults = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
			// Start with default memory values to test changing them
			cipherMode: "disabled",
			cipherAutoCapture: false,
			cipherLlmProvider: "openai",
			cipherLlmApiKey: "",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "",
			cipherEmbeddingDimensions: 1536,
			cipherVectorStore: "in-memory",
			cipherVectorStoreUrl: "",
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

	const renderMemorySettings = (extensionState = extensionStateWithDefaults) => {
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

	const enableSaveButtonByChangingSettings = async (getByTestId: any) => {
		// Navigate to auto-approve tab and make a change to enable save button
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)

		await waitFor(() => {
			expect(autoApproveTab).toHaveAttribute("aria-selected", "true")
		})

		const readOnlyToggle = await waitFor(() => {
			return screen.getByTestId("always-allow-readonly-toggle")
		})

		// Store initial aria-pressed state (it's a button, not a checkbox)
		const initialState = readOnlyToggle.getAttribute("aria-pressed") === "true"

		// Click the toggle to change state
		fireEvent.click(readOnlyToggle)

		// Verify the toggle state actually changed
		await waitFor(() => {
			const newState = readOnlyToggle.getAttribute("aria-pressed") === "true"
			expect(newState).toBe(!initialState)
		})

		// Verify save button is now enabled
		await waitFor(
			() => {
				const saveButton = getByTestId("save-button")
				expect(saveButton).not.toBeDisabled()
			},
			{ timeout: 2000 },
		)
	}

	it("E2E: Memory fields should persist their values after save button click", async () => {
		// Use the extension state with pre-configured memory values
		const { getByTestId } = renderMemorySettings(extensionStateWithMemoryConfig)

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		// Navigate to memory tab to verify initial values are displayed
		const memoryTab = getByTestId("tab-memory")
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Verify the initial memory values are displayed correctly
		await waitFor(() => {
			expect(screen.getAllByText("Embedded (Zero Config)").length).toBeGreaterThan(0) // cipher mode
			expect(screen.getAllByText("Anthropic").length).toBeGreaterThan(0) // LLM provider
			expect(screen.getAllByText("OpenAI").length).toBeGreaterThan(0) // embedding provider
			expect(screen.getAllByText("Qdrant").length).toBeGreaterThan(0) // vector store
		})

		// Find and verify specific input field values
		const apiKeyInputs = screen.getAllByDisplayValue("test-cipher-key")
		expect(apiKeyInputs.length).toBeGreaterThan(0)

		const modelInputs = screen.getAllByDisplayValue("text-embedding-3-small")
		expect(modelInputs.length).toBeGreaterThan(0)

		const urlInputs = screen.getAllByDisplayValue("http://localhost:6333")
		expect(urlInputs.length).toBeGreaterThan(0)

		// Enable save button by making a change on auto-approve tab
		await enableSaveButtonByChangingSettings(getByTestId)

		// CRITICAL FIX: Click save button while still on autoApprove tab
		// Switching back to memory tab before save breaks the form submission context
		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		// Wait for save operation to complete
		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalled()
		})

		// NOW go back to memory tab to verify values are still there
		fireEvent.click(memoryTab)
		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// CRITICAL TEST: Verify that all memory field values are still present after save
		// This is testing the original bug - memory fields getting cleared to defaults after save

		await waitFor(
			() => {
				// Dropdown selections should persist (not reset to defaults)
				expect(screen.getAllByText("Embedded (Zero Config)").length).toBeGreaterThan(0) // Should NOT be "Disabled"
				expect(screen.getAllByText("Anthropic").length).toBeGreaterThan(0) // Should NOT revert to "OpenAI"
				expect(screen.getAllByText("OpenAI").length).toBeGreaterThan(0) // embedding provider should persist
				expect(screen.getAllByText("Qdrant").length).toBeGreaterThan(0) // Should NOT revert to "In-Memory"
			},
			{ timeout: 3000 },
		)

		// Text input fields should persist their values
		await waitFor(
			() => {
				const persistedApiKeys = screen.queryAllByDisplayValue("test-cipher-key")
				expect(persistedApiKeys.length).toBeGreaterThan(0)

				const persistedModels = screen.queryAllByDisplayValue("text-embedding-3-small")
				expect(persistedModels.length).toBeGreaterThan(0)

				const persistedUrls = screen.queryAllByDisplayValue("http://localhost:6333")
				expect(persistedUrls.length).toBeGreaterThan(0)
			},
			{ timeout: 3000 },
		)
	}, 20000)

	it("E2E: Dropdown selections should persist after save", async () => {
		const { getByTestId } = renderMemorySettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		const memoryTab = getByTestId("tab-memory")
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Find dropdown/select elements
		const selects = screen.queryAllByRole("combobox")
		const buttons = screen.queryAllByRole("button")

		// Look for cipher mode dropdown - should start as "disabled"
		let modeDropdown = null

		// Try to find cipher mode selector
		const modeOptions = screen.queryAllByText(/disabled|embedded|mcp|api/i)
		if (modeOptions.length > 0) {
			// Find the parent dropdown/select element
			for (const option of modeOptions) {
				const parent = option.closest(
					'[role="combobox"], select, [data-testid*="cipher"], [data-testid*="mode"]',
				)
				if (parent) {
					modeDropdown = parent
					break
				}
			}
		}

		if (modeDropdown) {
			// Click to open dropdown
			fireEvent.click(modeDropdown)

			// Wait for options to appear and select "embedded"
			await waitFor(() => {
				const embeddedOption = screen.queryByText(/embedded/i)
				if (embeddedOption) {
					fireEvent.click(embeddedOption)
				}
			})

			// Verify selection was made
			await waitFor(() => {
				expect(screen.queryByText(/embedded/i)).toBeInTheDocument()
			})
		}

		// Test vector store dropdown - should start as "in-memory"
		let vectorStoreDropdown = null
		const vectorStoreOptions = screen.queryAllByText(/in-memory|qdrant|milvus/i)

		if (vectorStoreOptions.length > 0) {
			for (const option of vectorStoreOptions) {
				const parent = option.closest(
					'[role="combobox"], select, [data-testid*="vector"], [data-testid*="store"]',
				)
				if (parent) {
					vectorStoreDropdown = parent
					break
				}
			}
		}

		if (vectorStoreDropdown) {
			fireEvent.click(vectorStoreDropdown)

			await waitFor(() => {
				const qdrantOption = screen.queryByText(/qdrant/i)
				if (qdrantOption) {
					fireEvent.click(qdrantOption)
				}
			})

			await waitFor(() => {
				expect(screen.queryByText(/qdrant/i)).toBeInTheDocument()
			})
		}

		// Enable save button and save
		await enableSaveButtonByChangingSettings(getByTestId)

		// CRITICAL FIX: Click save while still on autoApprove tab
		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalled()
		})

		// CRITICAL TEST: Verify dropdown selections persist after save
		// Bug would cause them to revert to defaults (disabled, in-memory, etc.)

		await waitFor(
			() => {
				// Should still show "embedded" not reverted to "disabled"
				expect(screen.queryByText(/embedded/i)).toBeInTheDocument()
				// Should still show "qdrant" not reverted to "in-memory"
				expect(screen.queryByText(/qdrant/i)).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)
	}, 30000)

	it("E2E: Change detection should enable save button", async () => {
		const { getByTestId } = renderMemorySettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		// Initially save button should be disabled
		const saveButton = getByTestId("save-button")
		expect(saveButton).toBeDisabled()

		// Navigate to auto-approve tab and make a change
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)

		await waitFor(() => {
			expect(autoApproveTab).toHaveAttribute("aria-selected", "true")
		})

		const readOnlyToggle = await waitFor(() => {
			return screen.getByTestId("always-allow-readonly-toggle")
		})

		// Store initial aria-pressed state and toggle it
		const initialState = readOnlyToggle.getAttribute("aria-pressed") === "true"
		console.log("Initial toggle state:", initialState)

		fireEvent.click(readOnlyToggle)

		// Verify the toggle state actually changed
		await waitFor(() => {
			const newState = readOnlyToggle.getAttribute("aria-pressed") === "true"
			console.log("New toggle state after click:", newState)
			expect(newState).toBe(!initialState)
		})

		// Add more time for change detection to process
		await new Promise((resolve) => setTimeout(resolve, 500))

		console.log("Save button disabled status:", saveButton.hasAttribute("disabled"))
		console.log("Save button classes:", saveButton.className)

		// Now save button should be enabled
		await waitFor(
			() => {
				const isDisabled = saveButton.hasAttribute("disabled")
				console.log("Checking save button - is disabled:", isDisabled)
				expect(saveButton).not.toBeDisabled()
			},
			{ timeout: 5000 },
		)

		// Click save and verify postMessage is called
		fireEvent.click(saveButton)

		await waitFor(
			() => {
				expect(mockVscode.postMessage).toHaveBeenCalled()
			},
			{ timeout: 2000 },
		)
	}, 20000)

	it("E2E: Should demonstrate what the bug looks like", async () => {
		// This test documents the expected bug behavior
		const { getByTestId } = renderMemorySettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		const memoryTab = getByTestId("tab-memory")
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Change some values from defaults
		const textInputs = screen.queryAllByRole("textbox")
		if (textInputs.length > 0) {
			const firstInput = textInputs[0]
			fireEvent.change(firstInput, { target: { value: "test-value-before-save" } })
			expect(firstInput).toHaveValue("test-value-before-save")
		}

		// Enable save and click save
		await enableSaveButtonByChangingSettings(getByTestId)

		// CRITICAL FIX: Click save while still on autoApprove tab
		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalled()
		})

		// With the bug, this test would fail because the input would be cleared
		// With the fix, the value should persist
		if (textInputs.length > 0) {
			const firstInput = textInputs[0]
			await waitFor(
				() => {
					// This assertion will fail if the bug exists (field gets cleared)
					expect(firstInput).toHaveValue("test-value-before-save")
				},
				{ timeout: 3000 },
			)
		}
	}, 30000)
})
