import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { TooltipProvider } from "@src/components/ui"
import SettingsView from "../../settings/SettingsView"

/**
 * Debug test to isolate change detection issue
 */

describe("Memory Change Detection Debug", () => {
	const mockOnDone = vi.fn()
	const mockVscode = {
		postMessage: vi.fn(),
	}

	// Minimal extension state focused on auto-approve toggle
	const baseExtensionState = {
		apiConfiguration: {
			apiProvider: "anthropic",
			apiKey: "test-key",
			apiModelId: "claude-3-sonnet",
		},
		currentApiConfigName: "default",
		listApiConfigMeta: [{ id: "default", label: "Default" }],
		uriScheme: "vscode",
		settingsImportedAt: null,
		alwaysAllowReadOnly: false, // This is what we'll toggle
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

	const renderSettings = (extensionState = baseExtensionState) => {
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
						<SettingsView onDone={mockOnDone} targetSection="autoApprove" />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	it("DEBUG: Should enable save button when alwaysAllowReadOnly is toggled", async () => {
		const { getByTestId } = renderSettings()

		// Wait for component to render and auto-approve tab to be active
		await waitFor(() => {
			expect(getByTestId("save-button")).toBeInTheDocument()
			expect(getByTestId("tab-autoApprove")).toHaveAttribute("aria-selected", "true")
		})

		const saveButton = getByTestId("save-button")

		// Initially save button should be disabled (no changes detected)
		console.log("1. Initial save button state:", saveButton.hasAttribute("disabled") ? "DISABLED" : "ENABLED")
		expect(saveButton).toBeDisabled()

		// Find and click the readonly toggle
		const readOnlyToggle = await waitFor(() => {
			return screen.getByTestId("always-allow-readonly-toggle")
		})

		const initialPressed = readOnlyToggle.getAttribute("aria-pressed")
		console.log("2. Initial toggle aria-pressed:", initialPressed)

		// Click the toggle
		fireEvent.click(readOnlyToggle)

		// Verify toggle state changed
		await waitFor(() => {
			const newPressed = readOnlyToggle.getAttribute("aria-pressed")
			console.log("3. New toggle aria-pressed after click:", newPressed)
			expect(newPressed).not.toBe(initialPressed)
		})

		// Wait for change detection to process
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Check save button state
		console.log("4. Save button state after toggle:", saveButton.hasAttribute("disabled") ? "DISABLED" : "ENABLED")

		// This should now pass - save button should be enabled
		await waitFor(
			() => {
				expect(saveButton).not.toBeDisabled()
			},
			{ timeout: 2000 },
		)

		console.log("5. SUCCESS: Save button is now enabled!")
	}, 10000)

	it("DEBUG: Check extension state context values", async () => {
		let capturedContext: any = null

		// Custom component to capture the context value
		const DebugComponent = () => {
			const context = React.useContext(ExtensionStateContext)
			capturedContext = context
			return <div data-testid="debug">Debug</div>
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
					<ExtensionStateContext.Provider value={baseExtensionState as any}>
						<DebugComponent />
					</ExtensionStateContext.Provider>
				</TooltipProvider>
			</QueryClientProvider>,
		)

		await waitFor(() => {
			expect(screen.getByTestId("debug")).toBeInTheDocument()
		})

		console.log("Extension state context value:", capturedContext)
		expect(capturedContext).toBeTruthy()
		expect(capturedContext.alwaysAllowReadOnly).toBe(false)
	})
})
