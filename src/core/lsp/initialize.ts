// aincrok_change - new file
// Initialization of semantic capabilities for the Aincrok extension

import * as vscode from "vscode"
import { InternalSymbolicLSP } from "./InternalSymbolicLSP"
import { SemanticAgentIntegration } from "./SemanticAgentIntegration"

/**
 * Initialize semantic capabilities for Aincrok
 *
 * This function sets up the LSP integration and semantic agent capabilities
 * that enhance the existing Aincrok tools with semantic understanding.
 */
export async function initializeSemanticCapabilities(context: vscode.ExtensionContext): Promise<void> {
	try {
		console.log("[Aincrok] Initializing semantic capabilities...")

		// Initialize the Internal Symbolic LSP
		const lsp = InternalSymbolicLSP.getInstance(context)
		await lsp.initializeSymbolicAnalysis()

		// Initialize the Semantic Agent Integration
		const agentIntegration = SemanticAgentIntegration.getInstance(context)
		await agentIntegration.initialize()

		console.log("[Aincrok] Semantic capabilities initialized successfully")

		// Register enhanced tool capabilities
		const enhancedCapabilities = agentIntegration.getEnhancedToolCapabilities()
		console.log("[Aincrok] Enhanced tool capabilities:", Object.keys(enhancedCapabilities))
	} catch (error) {
		console.warn("[Aincrok] Failed to initialize semantic capabilities:", error)
		console.warn("[Aincrok] Continuing with basic functionality...")
		// Don't throw the error - allow extension to continue without semantic features
	}
}

/**
 * Get the semantic capabilities if they are initialized
 */
export function getSemanticCapabilities(context: vscode.ExtensionContext): {
	lsp: InternalSymbolicLSP | null
	agentIntegration: SemanticAgentIntegration | null
} {
	try {
		const lsp = InternalSymbolicLSP.getInstance(context)
		const agentIntegration = SemanticAgentIntegration.getInstance(context)
		return { lsp, agentIntegration }
	} catch (error) {
		console.warn("[Aincrok] Semantic capabilities not available:", error)
		return { lsp: null, agentIntegration: null }
	}
}
