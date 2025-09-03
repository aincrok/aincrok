// aincrok_change - new file
// Core types for Aincrok's Internal Symbolic LSP Layer
// Inspired by Serena's Solid-LSP architecture for semantic code understanding

import * as vscode from "vscode"

/**
 * Represents a symbolic entity discovered through LSP operations
 */
export interface SymbolicEntity {
	/** Unique identifier for the symbol */
	id: string
	/** Symbol name */
	name: string
	/** Symbol kind (class, method, function, etc.) */
	kind: vscode.SymbolKind
	/** File path where the symbol is defined */
	filePath: string
	/** Range within the file */
	range: vscode.Range
	/** Selection range (typically just the name) */
	selectionRange: vscode.Range
	/** Parent symbol if nested */
	parent?: SymbolicEntity
	/** Child symbols if container */
	children?: SymbolicEntity[]
	/** Symbol detail information */
	detail?: string
	/** Documentation if available */
	documentation?: string
	/** Type signature if applicable */
	signature?: string
	/** Whether this symbol is deprecated */
	deprecated?: boolean
	/** Tags associated with the symbol */
	tags?: vscode.SymbolTag[]
}

/**
 * Represents a relationship between symbols
 */
export interface SymbolRelationship {
	/** Type of relationship */
	type: "calls" | "inherits" | "implements" | "uses" | "defines" | "references" | "imports"
	/** Source symbol */
	from: SymbolicEntity
	/** Target symbol */
	to: SymbolicEntity
	/** Location where the relationship is established */
	location: vscode.Location
	/** Additional context about the relationship */
	context?: string
}

/**
 * Context for semantic code operations
 */
export interface CodeContext {
	/** Current workspace folder */
	workspaceFolder?: vscode.WorkspaceFolder
	/** Active text document */
	document?: vscode.TextDocument
	/** Current cursor position */
	position?: vscode.Position
	/** Selected range if any */
	selection?: vscode.Range
	/** Language of the code */
	language?: string
	/** Project-specific context */
	projectContext?: ProjectContext
}

/**
 * Project-specific context information
 */
export interface ProjectContext {
	/** Project type (e.g., 'react', 'node', 'python', etc.) */
	type?: string
	/** Main entry points */
	entryPoints?: string[]
	/** Configuration files */
	configFiles?: string[]
	/** Dependencies */
	dependencies?: Record<string, string>
	/** Build system information */
	buildSystem?: "npm" | "yarn" | "pnpm" | "pip" | "cargo" | "gradle" | "maven" | "unknown"
}

/**
 * Semantic context for AI prompts
 */
export interface SemanticContext {
	/** Relevant symbols for the current operation */
	relevantSymbols: SymbolicEntity[]
	/** Symbol relationships */
	relationships: SymbolRelationship[]
	/** Code snippets with context */
	codeSnippets: CodeSnippet[]
	/** Type information */
	typeInfo?: TypeInformation
	/** Import statements */
	imports?: ImportInfo[]
	/** Project context */
	projectContext?: ProjectContext
}

/**
 * Code snippet with semantic information
 */
export interface CodeSnippet {
	/** The actual code content */
	content: string
	/** File path */
	filePath: string
	/** Range within the file */
	range: vscode.Range
	/** Language */
	language: string
	/** Associated symbols */
	symbols?: SymbolicEntity[]
	/** Relevance score (0-1) */
	relevance?: number
	/** Context about why this snippet is relevant */
	context?: string
}

/**
 * Type information for symbols
 */
export interface TypeInformation {
	/** Type name */
	name: string
	/** Full type signature */
	signature: string
	/** Parameters if function/method */
	parameters?: ParameterInfo[]
	/** Return type */
	returnType?: string
	/** Generic type parameters */
	typeParameters?: string[]
	/** Whether the type is nullable */
	nullable?: boolean
}

/**
 * Parameter information
 */
export interface ParameterInfo {
	/** Parameter name */
	name: string
	/** Parameter type */
	type: string
	/** Whether optional */
	optional?: boolean
	/** Default value if any */
	defaultValue?: string
	/** Documentation */
	documentation?: string
}

/**
 * Import information
 */
export interface ImportInfo {
	/** Module/package being imported */
	module: string
	/** Imported symbols */
	symbols: string[]
	/** Import type */
	type: "default" | "named" | "namespace" | "side-effect"
	/** File path where import is located */
	filePath: string
	/** Range of the import statement */
	range: vscode.Range
}

/**
 * Symbolic edit operation
 */
export interface SymbolicEdit {
	/** Type of edit operation */
	type: "insert" | "replace" | "delete" | "rename"
	/** Target symbol to edit */
	symbol: SymbolicEntity
	/** New content for the symbol */
	newContent?: string
	/** New name for rename operations */
	newName?: string
	/** Position for insert operations */
	insertPosition?: vscode.Position
	/** Whether to update references */
	updateReferences?: boolean
	/** Validation rules */
	validation?: EditValidation
}

/**
 * Edit validation information
 */
export interface EditValidation {
	/** Whether the edit is safe to apply */
	safe: boolean
	/** Validation warnings */
	warnings: string[]
	/** Validation errors */
	errors: string[]
	/** Suggested fixes */
	suggestedFixes?: string[]
	/** Impact analysis */
	impact?: EditImpact
}

/**
 * Edit impact analysis
 */
export interface EditImpact {
	/** Files that will be affected */
	affectedFiles: string[]
	/** Symbols that will be affected */
	affectedSymbols: SymbolicEntity[]
	/** Breaking changes */
	breakingChanges: string[]
	/** Tests that might need updating */
	testFiles?: string[]
}

/**
 * Result of a symbolic edit operation
 */
export interface EditResult {
	/** Whether the edit was successful */
	success: boolean
	/** Files that were modified */
	modifiedFiles: string[]
	/** Applied edits */
	appliedEdits: vscode.WorkspaceEdit[]
	/** Any errors that occurred */
	errors?: string[]
	/** Warnings */
	warnings?: string[]
}

/**
 * Enhancement configuration for existing tools
 */
export interface SymbolicEnhancement {
	/** Whether to enable semantic understanding */
	enableSemanticUnderstanding: boolean
	/** Whether to use symbol-level operations */
	useSymbolicOperations: boolean
	/** Fallback to text-based operations if LSP fails */
	fallbackToTextBased: boolean
	/** Maximum depth for symbol analysis */
	maxAnalysisDepth: number
	/** Languages to enhance */
	supportedLanguages: string[]
}

/**
 * Context for semantic prompt enhancement
 */
export interface SemanticPromptContext {
	/** Original user request */
	userRequest: string
	/** Semantic context gathered from LSP */
	semanticContext: SemanticContext
	/** Optimized prompt with semantic information */
	enhancedPrompt: string
	/** Token count before and after optimization */
	tokenOptimization: {
		before: number
		after: number
		reduction: number
	}
}

/**
 * LSP client configuration
 */
export interface LSPClientConfig {
	/** Language server executable */
	serverPath: string
	/** Server arguments */
	args: string[]
	/** Working directory */
	workingDirectory?: string
	/** Environment variables */
	env?: Record<string, string>
	/** Server options */
	options?: any
	/** Whether to enable for this language */
	enabled: boolean
	/** Initialization options */
	initializationOptions?: any
}

/**
 * Supported language server configurations
 */
export interface LanguageServerConfig {
	typescript: LSPClientConfig
	python: LSPClientConfig
	javascript: LSPClientConfig
	rust: LSPClientConfig
	go: LSPClientConfig
	php: LSPClientConfig
	java: LSPClientConfig
	cpp: LSPClientConfig
}
