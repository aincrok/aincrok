import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, waitFor, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import SettingsView from "../../settings/SettingsView"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"

/**
 * Memory Field Clearing Bug - Focused Test
 *
 * This test demonstrates the specific bug where memory configuration fields
 * are cleared after clicking the save button. This is a TDD test that should
 * fail until the bug is fixed.
 */

describe("Memory Field Clearing Bug", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Extension state with memory configuration
	const extensionStateWithMemoryFields = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
			// Memory fields that get cleared after save
			cipherMode: "embedded",
			cipherLlmProvider: "anthropic",
			cipherLlmApiKey: "test-cipher-key",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "text-embedding-3-small",
			cipherEmbeddingDimensions: 1536,
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
		// @ts-ignore
		global.vscode = mockVscode
		global.ResizeObserver = vi.fn().mockImplementation(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}))
	})

	const renderMemorySettings = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		return render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<ExtensionStateContext.Provider value={extensionStateWithMemoryFields as any}>
						<SettingsView onDone={mockOnDone} targetSection="memory" />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	it("FAIL: should not clear cipher fields after save", async () => {
		const { getByTestId } = renderMemorySettings()

		// Wait for component to render
		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		// Navigate to memory tab if not already active
		const memoryTab = await waitFor(() => {
			return screen.getByTestId("tab-memory")
		})

		fireEvent.click(memoryTab)

		// Wait for memory tab to become active
		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Verify cipher mode field shows "embedded" initially
		await waitFor(
			() => {
				// Look for cipher mode dropdown showing "embedded"
				const embeddedOption = screen.queryByText("Embedded (Zero Config)")
				expect(embeddedOption).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)

		// Make a small change to enable save button
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)

		await waitFor(() => {
			expect(autoApproveTab).toHaveAttribute("aria-selected", "true")
		})

		const readOnlyToggle = await waitFor(() => {
			return screen.getByTestId("always-allow-readonly-toggle")
		})
		fireEvent.click(readOnlyToggle)

		// Go back to memory tab
		fireEvent.click(memoryTab)
		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Save button should now be enabled
		await waitFor(() => {
			const saveButton = getByTestId("save-button")
			expect(saveButton).not.toBeDisabled()
		})

		// Click save
		const saveButton = getByTestId("save-button")
		fireEvent.click(saveButton)

		// Verify that cipher field postMessage calls were sent
		await waitFor(() => {
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherMode",
				text: "embedded",
			})
			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "cipherLlmProvider",
				text: "anthropic",
			})
		})

		// The BUG: After save, the cipher fields should still be visible but they get cleared
		// This test should FAIL until the bug is fixed
		await waitFor(
			() => {
				const embeddedOption = screen.queryByText("Embedded (Zero Config)")
				expect(embeddedOption).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)

		// Additional verification: Check if cipher field values are still in the DOM
		await waitFor(() => {
			// The embedded mode should still be selected/visible
			const modeDropdown = screen.queryByDisplayValue("embedded")
			expect(modeDropdown).toBeInTheDocument()
		})
	})

	it("should demonstrate postMessage calls are sent but fields get reset", async () => {
		// This test verifies that the postMessage calls are working but the bug persists
		const { getByTestId } = renderMemorySettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		// Navigate to memory tab
		const memoryTab = await waitFor(() => screen.getByTestId("tab-memory"))
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		// Make a change to enable save
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)
		const readOnlyToggle = await waitFor(() => screen.getByTestId("always-allow-readonly-toggle"))
		fireEvent.click(readOnlyToggle)

		// Go back to memory
		fireEvent.click(memoryTab)

		// Click save
		const saveButton = getByTestId("save-button")
		await waitFor(() => expect(saveButton).not.toBeDisabled())
		fireEvent.click(saveButton)

		// Verify postMessage was called correctly
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

		// The issue is that even though postMessage calls are sent correctly,
		// the extension sends back state that doesn't include cipher fields,
		// causing them to be reset to defaults in the UI
	})
})
