import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"
import SettingsView from "../../settings/SettingsView"

/**
 * Real Case Debug Test - Toggle Functionality
 *
 * This test debugs the actual user-reported issue where:
 * 1. Auto-approve toggles don't work (user says they're "always disabled")
 * 2. Settings don't save after toggling
 * 3. Memory fields get cleared after save
 *
 * This creates a real-world test case to reproduce and fix the issues.
 */

describe("Real Case Debug: Toggle Functionality", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Real extension state mimicking a fresh VS Code extension load
	const realExtensionState = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "",
			apiModelId: "claude-3-sonnet",
			// Memory fields that should persist after save
			cipherMode: "embedded",
			cipherLlmProvider: "anthropic",
			cipherLlmApiKey: "user-provided-key",
			cipherEmbeddingProvider: "openai",
			cipherEmbeddingModel: "text-embedding-3-small",
			cipherVectorStore: "qdrant",
			cipherVectorStoreUrl: "http://localhost:6333",
		},
		currentApiConfigName: "default",
		listApiConfigMeta: [{ id: "default", label: "Default" }],
		uriScheme: "vscode",
		settingsImportedAt: null,
		// Auto-approve settings that should toggle
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

	const renderRealSettings = (extensionState = realExtensionState) => {
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
						{/* Start with autoApprove tab to test toggle functionality */}
						<SettingsView onDone={mockOnDone} targetSection="autoApprove" />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	it("Real Case: Auto-approve readOnly toggle should work and enable save button", async () => {
		console.log("🔍 REAL CASE DEBUG: Starting auto-approve toggle test")

		const { getByTestId } = renderRealSettings()

		// Wait for full render
		await waitFor(
			() => {
				expect(getByTestId("save-button")).toBeInTheDocument()
				expect(getByTestId("tab-autoApprove")).toHaveAttribute("aria-selected", "true")
			},
			{ timeout: 5000 },
		)

		console.log("✅ Settings view rendered with autoApprove tab active")

		// Get initial states
		const saveButton = getByTestId("save-button")
		const initialSaveDisabled = saveButton.hasAttribute("disabled")
		console.log(`💾 Initial save button disabled: ${initialSaveDisabled}`)

		// Find the readOnly toggle
		const readOnlyToggle = await waitFor(
			() => {
				return screen.getByTestId("always-allow-readonly-toggle")
			},
			{ timeout: 5000 },
		)

		console.log("🎯 Found readOnly toggle button")

		// Get initial toggle state
		const initialPressed = readOnlyToggle.getAttribute("aria-pressed")
		const initialVariant = readOnlyToggle.classList.contains("outline") ? "outline" : "default"
		console.log(`🔘 Initial toggle aria-pressed: ${initialPressed}`)
		console.log(`🎨 Initial toggle variant: ${initialVariant}`)

		// Verify toggle is actually clickable
		expect(readOnlyToggle).not.toBeDisabled()
		expect(readOnlyToggle.tagName.toLowerCase()).toBe("button")
		console.log("✅ Toggle button is clickable and is a button element")

		// Click the toggle
		console.log("👆 Clicking readOnly toggle...")
		fireEvent.click(readOnlyToggle)

		// Wait and check if toggle state changed
		await waitFor(
			() => {
				const newPressed = readOnlyToggle.getAttribute("aria-pressed")
				console.log(`🔄 New toggle aria-pressed after click: ${newPressed}`)
				expect(newPressed).not.toBe(initialPressed)
			},
			{ timeout: 3000 },
		)

		console.log("✅ Toggle state changed successfully")

		// Wait for change detection to process
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Check if save button is now enabled
		const finalSaveDisabled = saveButton.hasAttribute("disabled")
		console.log(`💾 Final save button disabled: ${finalSaveDisabled}`)

		if (finalSaveDisabled) {
			// Debug why save button is still disabled
			console.log("❌ ISSUE: Save button still disabled after toggle")
			console.log("🔍 Debugging save button state...")

			// Check button classes and attributes
			console.log(`🎨 Save button classes: ${saveButton.className}`)
			console.log(`📋 Save button attributes:`, {
				disabled: saveButton.hasAttribute("disabled"),
				"data-testid": saveButton.getAttribute("data-testid"),
				"aria-disabled": saveButton.getAttribute("aria-disabled"),
			})
		} else {
			console.log("✅ Save button enabled after toggle!")
		}

		// Try to click save button regardless of enabled state
		console.log("👆 Attempting to click save button...")
		fireEvent.click(saveButton)

		// Check if postMessage was called
		await waitFor(
			() => {
				const postMessageCalls = mockVscode.postMessage.mock.calls.length
				console.log(`📨 PostMessage calls after save click: ${postMessageCalls}`)

				if (postMessageCalls > 0) {
					console.log("✅ Save successfully triggered postMessage!")
					console.log(
						"📤 PostMessage calls:",
						mockVscode.postMessage.mock.calls.map(([msg]) => msg.type),
					)
					expect(mockVscode.postMessage).toHaveBeenCalled()
				} else {
					console.log("❌ ISSUE: Save did not trigger any postMessage calls")
					// Still expect it to be called to fail the test and show the issue
					expect(mockVscode.postMessage).toHaveBeenCalled()
				}
			},
			{ timeout: 3000 },
		)
	}, 30000)

	it("Real Case: Memory field persistence after save", async () => {
		console.log("🔍 REAL CASE DEBUG: Starting memory field persistence test")

		const { getByTestId } = renderRealSettings()

		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
		})

		console.log("✅ Settings view rendered")

		// Switch to memory tab and verify initial values
		const memoryTab = getByTestId("tab-memory")
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		console.log("✅ Memory tab activated")

		// Look for memory field values
		await waitFor(
			() => {
				const embeddedOptions = screen.queryAllByText("Embedded (Zero Config)")
				console.log(`🎯 Found ${embeddedOptions.length} "Embedded (Zero Config)" options`)
				expect(embeddedOptions.length).toBeGreaterThan(0)
			},
			{ timeout: 5000 },
		)

		// Get initial field values before any changes
		const initialApiKeys = screen.queryAllByDisplayValue("user-provided-key")
		const initialModels = screen.queryAllByDisplayValue("text-embedding-3-small")
		const initialUrls = screen.queryAllByDisplayValue("http://localhost:6333")

		console.log(`📝 Initial field counts:`)
		console.log(`   - API key fields: ${initialApiKeys.length}`)
		console.log(`   - Model fields: ${initialModels.length}`)
		console.log(`   - URL fields: ${initialUrls.length}`)

		// Switch back to autoApprove and make a change to enable save
		const autoApproveTab = getByTestId("tab-autoApprove")
		fireEvent.click(autoApproveTab)

		const readOnlyToggle = await waitFor(() => screen.getByTestId("always-allow-readonly-toggle"))
		fireEvent.click(readOnlyToggle)

		// Wait for save to be enabled and click it
		await waitFor(() => {
			const saveButton = getByTestId("save-button")
			if (saveButton.hasAttribute("disabled")) {
				// Force save anyway to test what happens
				console.log("⚠️ Save button still disabled, forcing save...")
			}
			fireEvent.click(saveButton)
		})

		console.log("💾 Save clicked")

		// Switch back to memory tab and check if fields persist
		fireEvent.click(memoryTab)

		await waitFor(() => {
			expect(memoryTab).toHaveAttribute("aria-selected", "true")
		})

		console.log("🔄 Back on memory tab after save")

		// Check if memory fields are still there
		await waitFor(
			() => {
				const persistedApiKeys = screen.queryAllByDisplayValue("user-provided-key")
				const persistedModels = screen.queryAllByDisplayValue("text-embedding-3-small")
				const persistedUrls = screen.queryAllByDisplayValue("http://localhost:6333")

				console.log(`📝 Post-save field counts:`)
				console.log(`   - API key fields: ${persistedApiKeys.length}`)
				console.log(`   - Model fields: ${persistedModels.length}`)
				console.log(`   - URL fields: ${persistedUrls.length}`)

				if (persistedApiKeys.length === 0) {
					console.log("❌ ISSUE: API key fields were cleared after save!")
				} else {
					console.log("✅ API key fields persisted after save")
				}

				if (persistedModels.length === 0) {
					console.log("❌ ISSUE: Model fields were cleared after save!")
				} else {
					console.log("✅ Model fields persisted after save")
				}

				if (persistedUrls.length === 0) {
					console.log("❌ ISSUE: URL fields were cleared after save!")
				} else {
					console.log("✅ URL fields persisted after save")
				}

				// Expect at least the same number of fields as before
				expect(persistedApiKeys.length).toBeGreaterThanOrEqual(initialApiKeys.length)
				expect(persistedModels.length).toBeGreaterThanOrEqual(initialModels.length)
				expect(persistedUrls.length).toBeGreaterThanOrEqual(initialUrls.length)
			},
			{ timeout: 5000 },
		)
	}, 30000)

	it("Real Case: Settings state synchronization debug", async () => {
		console.log("🔍 REAL CASE DEBUG: Settings state synchronization")

		// Create a test that exposes the internal state for debugging
		let capturedStates: any[] = []

		const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
			const extensionState = React.useContext(ExtensionStateContext)

			React.useEffect(() => {
				if (extensionState) {
					capturedStates.push({
						timestamp: Date.now(),
						alwaysAllowReadOnly: extensionState.alwaysAllowReadOnly,
						apiConfiguration: extensionState.apiConfiguration,
					})
				}
			}, [extensionState?.alwaysAllowReadOnly, extensionState?.apiConfiguration])

			return <>{children}</>
		}

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<ExtensionStateContext.Provider value={realExtensionState as any}>
						<DebugWrapper>
							<SettingsView onDone={mockOnDone} targetSection="autoApprove" />
						</DebugWrapper>
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)

		await waitFor(() => {
			expect(screen.getByTestId("save-button")).toBeInTheDocument()
		})

		console.log(`🔍 Captured ${capturedStates.length} state changes during render`)

		// Log initial state
		if (capturedStates.length > 0) {
			const initialState = capturedStates[0]
			console.log("📊 Initial extension state:")
			console.log(`   - alwaysAllowReadOnly: ${initialState.alwaysAllowReadOnly}`)
			console.log(`   - cipherMode: ${initialState.apiConfiguration?.cipherMode}`)
			console.log(`   - cipherLlmApiKey: ${initialState.apiConfiguration?.cipherLlmApiKey}`)
		}

		// Test toggle
		const readOnlyToggle = screen.getByTestId("always-allow-readonly-toggle")
		const initialStateCount = capturedStates.length

		fireEvent.click(readOnlyToggle)

		// Wait for state updates
		await new Promise((resolve) => setTimeout(resolve, 500))

		const newStateCount = capturedStates.length
		console.log(`🔄 State changes after toggle: ${newStateCount - initialStateCount}`)

		if (newStateCount > initialStateCount) {
			const latestState = capturedStates[capturedStates.length - 1]
			console.log("📊 Latest extension state after toggle:")
			console.log(`   - alwaysAllowReadOnly: ${latestState.alwaysAllowReadOnly}`)
			console.log(`   - cipherMode: ${latestState.apiConfiguration?.cipherMode}`)
			console.log(`   - cipherLlmApiKey: ${latestState.apiConfiguration?.cipherLlmApiKey}`)
		} else {
			console.log("❌ ISSUE: No state changes detected after toggle!")
		}

		expect(capturedStates.length).toBeGreaterThan(0)
	}, 30000)
})
