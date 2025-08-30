// aincrok_change - new file: DialogErrorBoundary for grey screen fix (Phase 1 Critical)
import React, { Component, ErrorInfo, ReactNode } from "react"
import { telemetryClient } from "../../utils/TelemetryClient"
import { TelemetryEventName } from "@roo-code/types"

interface Props {
	children: ReactNode
	fallback?: ReactNode
	timeoutMs?: number
	maxRetries?: number
}

interface State {
	hasError: boolean
	errorMessage?: string
	retryCount: number
	timeoutId?: NodeJS.Timeout
}

/**
 * DialogErrorBoundary - Prevents grey screen caused by stuck dialog states
 *
 * Features:
 * - Catches React errors in dialog components
 * - 30-second timeout mechanism for stuck dialogs
 * - Automatic retry (max 3 attempts)
 * - ESC key recovery handler
 * - Telemetry logging for error tracking
 *
 * Part of H3: Dialog State Corruption Hypothesis testing
 */
export class DialogErrorBoundary extends Component<Props, State> {
	private escKeyHandler: ((event: KeyboardEvent) => void) | null = null

	constructor(props: Props) {
		super(props)
		this.state = {
			hasError: false,
			retryCount: 0,
		}
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state to show fallback UI
		return {
			hasError: true,
			errorMessage: error.message,
			retryCount: 0,
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("[DialogErrorBoundary] Dialog error caught:", error, errorInfo)

		// Log to telemetry for hypothesis testing
		telemetryClient.capture(TelemetryEventName.DIALOG_ERROR_BOUNDARY_TRIGGERED, {
			errorMessage: error.message,
			errorStack: error.stack,
			componentStack: errorInfo.componentStack,
			retryCount: this.state.retryCount,
		})

		// Set up timeout mechanism to prevent permanent grey overlays
		this.setupTimeoutRecovery()

		// Set up ESC key recovery
		this.setupEscKeyRecovery()
	}

	componentDidMount() {
		// Set up timeout for any existing dialogs
		if (this.props.timeoutMs) {
			this.setupTimeoutRecovery()
		}
	}

	componentWillUnmount() {
		// Clean up timeout and event listeners
		if (this.state.timeoutId) {
			clearTimeout(this.state.timeoutId)
		}
		if (this.escKeyHandler) {
			document.removeEventListener("keydown", this.escKeyHandler)
		}
	}

	private setupTimeoutRecovery() {
		const timeoutMs = this.props.timeoutMs || 30000 // 30 seconds default

		const timeoutId = setTimeout(() => {
			console.warn("[DialogErrorBoundary] Dialog timeout - attempting recovery")
			this.attemptRecovery()
		}, timeoutMs)

		this.setState({ timeoutId })
	}

	private setupEscKeyRecovery() {
		this.escKeyHandler = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				console.log("[DialogErrorBoundary] ESC key pressed - attempting recovery")
				this.attemptRecovery()
			}
		}

		document.addEventListener("keydown", this.escKeyHandler)
	}

	private attemptRecovery = () => {
		const maxRetries = this.props.maxRetries || 3

		if (this.state.retryCount < maxRetries) {
			console.log(`[DialogErrorBoundary] Attempting recovery ${this.state.retryCount + 1}/${maxRetries}`)

			// Clear timeout
			if (this.state.timeoutId) {
				clearTimeout(this.state.timeoutId)
			}

			// Reset error state and increment retry count
			this.setState({
				hasError: false,
				errorMessage: undefined,
				retryCount: this.state.retryCount + 1,
				timeoutId: undefined,
			})

			// Log recovery attempt
			telemetryClient.capture(TelemetryEventName.DIALOG_ERROR_RECOVERY_ATTEMPTED, {
				retryCount: this.state.retryCount + 1,
				maxRetries,
			})
		} else {
			console.error("[DialogErrorBoundary] Max retries exceeded - providing fallback UI")

			// Log recovery failure
			telemetryClient.capture(TelemetryEventName.DIALOG_ERROR_RECOVERY_FAILED, {
				retryCount: this.state.retryCount,
				maxRetries,
				finalError: this.state.errorMessage,
			})
		}
	}

	render() {
		if (this.state.hasError) {
			// Check if we've exceeded max retries
			const maxRetries = this.props.maxRetries || 3
			if (this.state.retryCount >= maxRetries) {
				// Provide fallback UI or user-defined fallback
				return (
					this.props.fallback || (
						<div
							className="dialog-error-fallback"
							style={{
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: "rgba(0, 0, 0, 0.5)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								zIndex: 9999,
							}}>
							<div
								style={{
									backgroundColor: "var(--vscode-editor-background)",
									color: "var(--vscode-editor-foreground)",
									padding: "20px",
									borderRadius: "8px",
									border: "1px solid var(--vscode-widget-border)",
									maxWidth: "400px",
									textAlign: "center",
								}}>
								<h3>Dialog Error</h3>
								<p>A dialog component encountered an error. Press ESC or click outside to dismiss.</p>
								<button
									onClick={this.attemptRecovery}
									style={{
										marginTop: "10px",
										padding: "8px 16px",
										backgroundColor: "var(--vscode-button-background)",
										color: "var(--vscode-button-foreground)",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
									}}>
									Close Dialog
								</button>
							</div>
						</div>
					)
				)
			} else {
				// Show retry indicator
				return (
					<div
						className="dialog-error-retry"
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							backgroundColor: "var(--vscode-notifications-background)",
							color: "var(--vscode-notifications-foreground)",
							padding: "10px 20px",
							borderRadius: "4px",
							border: "1px solid var(--vscode-notifications-border)",
							zIndex: 10000,
						}}>
						Recovering dialog... (Attempt {this.state.retryCount + 1}/{maxRetries})
					</div>
				)
			}
		}

		return this.props.children
	}
}

export default DialogErrorBoundary
