// Mock implementation of VS Code API for testing
import { vi } from "vitest"
const EventEmitter = require("events")

class Uri {
	constructor(scheme, authority, path, query, fragment) {
		this.scheme = scheme || "file"
		this.authority = authority || ""
		this.path = path || ""
		this.query = query || ""
		this.fragment = fragment || ""
	}

	static file(path) {
		return new Uri("file", "", path)
	}

	static parse(value, strict) {
		// Simple parsing implementation
		const match = value.match(/^([^:]+):\/\/([^/]*)(.*)$/)
		if (match) {
			return new Uri(match[1], match[2], match[3])
		}
		return new Uri("file", "", value)
	}

	static joinPath(base, ...pathSegments) {
		const path = require("path")
		const newPath = path.join(base.path, ...pathSegments)
		return new Uri(base.scheme, base.authority, newPath, base.query, base.fragment)
	}

	toString() {
		return `${this.scheme}://${this.authority}${this.path}${this.query ? "?" + this.query : ""}${
			this.fragment ? "#" + this.fragment : ""
		}`
	}

	toJSON() {
		return {
			$mid: 1,
			scheme: this.scheme,
			authority: this.authority,
			path: this.path,
			query: this.query,
			fragment: this.fragment,
		}
	}

	get fsPath() {
		// Return the full path, preserving leading slash for absolute paths
		return this.path
	}

	with(change) {
		return new Uri(
			change.scheme !== undefined ? change.scheme : this.scheme,
			change.authority !== undefined ? change.authority : this.authority,
			change.path !== undefined ? change.path : this.path,
			change.query !== undefined ? change.query : this.query,
			change.fragment !== undefined ? change.fragment : this.fragment,
		)
	}
}

class Position {
	constructor(line, character) {
		this.line = line
		this.character = character
	}

	isAfter(other) {
		return this.line > other.line || (this.line === other.line && this.character > other.character)
	}

	isAfterOrEqual(other) {
		return this.line > other.line || (this.line === other.line && this.character >= other.character)
	}

	isBefore(other) {
		return this.line < other.line || (this.line === other.line && this.character < other.character)
	}

	isBeforeOrEqual(other) {
		return this.line < other.line || (this.line === other.line && this.character <= other.character)
	}

	isEqual(other) {
		return this.line === other.line && this.character === other.character
	}

	translate(lineDelta, characterDelta) {
		return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0))
	}

	with(line, character) {
		return new Position(line !== undefined ? line : this.line, character !== undefined ? character : this.character)
	}

	compareTo(other) {
		if (this.line < other.line) return -1
		if (this.line > other.line) return 1
		if (this.character < other.character) return -1
		if (this.character > other.character) return 1
		return 0
	}
}

class Range {
	constructor(startLine, startCharacter, endLine, endCharacter) {
		if (arguments.length === 2) {
			this.start = startLine
			this.end = startCharacter
		} else {
			this.start = new Position(startLine, startCharacter)
			this.end = new Position(endLine, endCharacter)
		}
	}

	get isEmpty() {
		return this.start.isEqual(this.end)
	}

	get isSingleLine() {
		return this.start.line === this.end.line
	}

	contains(positionOrRange) {
		if (positionOrRange instanceof Range) {
			return this.contains(positionOrRange.start) && this.contains(positionOrRange.end)
		}
		return (
			positionOrRange.line >= this.start.line &&
			positionOrRange.line <= this.end.line &&
			positionOrRange.character >= this.start.character &&
			positionOrRange.character <= this.end.character
		)
	}

	isEqual(other) {
		return this.start.isEqual(other.start) && this.end.isEqual(other.end)
	}

	intersection(other) {
		const start = this.start.isAfter(other.start) ? this.start : other.start
		const end = this.end.isBefore(other.end) ? this.end : other.end
		return start.isAfter(end) ? undefined : new Range(start, end)
	}

	union(other) {
		const start = this.start.isBefore(other.start) ? this.start : other.start
		const end = this.end.isAfter(other.end) ? this.end : other.end
		return new Range(start, end)
	}

	with(start, end) {
		return new Range(start || this.start, end || this.end)
	}
}

class Selection extends Range {
	constructor(anchorLine, anchorCharacter, activeLine, activeCharacter) {
		if (arguments.length === 2) {
			super(anchorLine, anchorCharacter)
			this.anchor = anchorLine
			this.active = anchorCharacter
		} else {
			super(anchorLine, anchorCharacter, activeLine, activeCharacter)
			this.anchor = new Position(anchorLine, anchorCharacter)
			this.active = new Position(activeLine, activeCharacter)
		}
	}

	get isReversed() {
		return this.anchor.isAfter(this.active)
	}
}

class Location {
	constructor(uri, rangeOrPosition) {
		this.uri = uri
		this.range = rangeOrPosition instanceof Range ? rangeOrPosition : new Range(rangeOrPosition, rangeOrPosition)
	}
}

class DiagnosticRelatedInformation {
	constructor(location, message) {
		this.location = location
		this.message = message
	}
}

class Diagnostic {
	constructor(range, message, severity) {
		this.range = range
		this.message = message
		this.severity = severity !== undefined ? severity : DiagnosticSeverity.Error
	}
}

const DiagnosticSeverity = {
	Error: 0,
	Warning: 1,
	Information: 2,
	Hint: 3,
}

class EventEmitterImpl extends EventEmitter {
	constructor() {
		super()
		this.event = (listener, thisArgs, disposables) => {
			this.on("event", listener)
			return {
				dispose: () => this.off("event", listener),
			}
		}
	}

	fire(data) {
		this.emit("event", data)
	}
}

const TreeItemCollapsibleState = {
	None: 0,
	Collapsed: 1,
	Expanded: 2,
}

const ViewColumn = {
	Active: -1,
	Beside: -2,
	One: 1,
	Two: 2,
	Three: 3,
	Four: 4,
	Five: 5,
	Six: 6,
	Seven: 7,
	Eight: 8,
	Nine: 9,
}

const StatusBarAlignment = {
	Left: 1,
	Right: 2,
}

const TextEditorRevealType = {
	Default: 0,
	InCenter: 1,
	InCenterIfOutsideViewport: 2,
	AtTop: 3,
}

const OverviewRulerLane = {
	Left: 1,
	Center: 2,
	Right: 4,
	Full: 7,
}

const DecorationRangeBehavior = {
	OpenOpen: 0,
	ClosedClosed: 1,
	OpenClosed: 2,
	ClosedOpen: 3,
}

const TextEditorSelectionChangeKind = {
	Keyboard: 1,
	Mouse: 2,
	Command: 3,
}

const ConfigurationTarget = {
	Global: 1,
	Workspace: 2,
	WorkspaceFolder: 3,
}

const RelativePattern = class {
	constructor(base, pattern) {
		this.base = base
		this.pattern = pattern
	}
}

const FileType = {
	Unknown: 0,
	File: 1,
	Directory: 2,
	SymbolicLink: 64,
}

const FileChangeType = {
	Changed: 1,
	Created: 2,
	Deleted: 3,
}

const ExtensionKind = {
	UI: 1,
	Workspace: 2,
}

const ExtensionMode = {
	Production: 1,
	Development: 2,
	Test: 3,
}

const CommentThreadCollapsibleState = {
	Collapsed: 0,
	Expanded: 1,
}

const ProgressLocation = {
	SourceControl: 1,
	Window: 10,
	Notification: 15,
}

const workspace = {
	workspaceFolders: [
		{
			uri: Uri.file("/workspace"),
			name: "workspace",
			index: 0,
		},
	],
	rootPath: "/workspace",
	name: "workspace",
	fs: {
		readFile: vi.fn().mockResolvedValue(Buffer.from("")),
		writeFile: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		rename: vi.fn().mockResolvedValue(undefined),
		copy: vi.fn().mockResolvedValue(undefined),
		createDirectory: vi.fn().mockResolvedValue(undefined),
		readDirectory: vi.fn().mockResolvedValue([]),
		stat: vi.fn().mockResolvedValue({ type: FileType.File, ctime: 0, mtime: 0, size: 0 }),
		isWritableFileSystem: vi.fn().mockReturnValue(true),
	},
	getConfiguration: vi.fn((section) => ({
		get: vi.fn((key, defaultValue) => defaultValue),
		has: vi.fn(() => false),
		inspect: vi.fn(() => ({ globalValue: undefined, workspaceValue: undefined })),
		update: vi.fn().mockResolvedValue(undefined),
	})),
	onDidChangeConfiguration: new EventEmitterImpl().event,
	onDidChangeWorkspaceFolders: new EventEmitterImpl().event,
	onDidSaveTextDocument: new EventEmitterImpl().event,
	onDidChangeTextDocument: new EventEmitterImpl().event,
	onDidCreateFiles: new EventEmitterImpl().event,
	onDidDeleteFiles: new EventEmitterImpl().event,
	onDidRenameFiles: new EventEmitterImpl().event,
	openTextDocument: vi.fn().mockResolvedValue({
		uri: Uri.file("/test.txt"),
		fileName: "/test.txt",
		languageId: "plaintext",
		version: 1,
		isDirty: false,
		isClosed: false,
		save: vi.fn().mockResolvedValue(true),
		lineCount: 0,
		lineAt: vi.fn(() => ({ text: "", range: new Range(0, 0, 0, 0) })),
		offsetAt: vi.fn(() => 0),
		positionAt: vi.fn(() => new Position(0, 0)),
		getText: vi.fn(() => ""),
		getWordRangeAtPosition: vi.fn(),
		validateRange: vi.fn((range) => range),
		validatePosition: vi.fn((position) => position),
	}),
	findFiles: vi.fn().mockResolvedValue([]),
	saveAll: vi.fn().mockResolvedValue(true),
	applyEdit: vi.fn().mockResolvedValue(true),
	createFileSystemWatcher: vi.fn(() => ({
		onDidCreate: new EventEmitterImpl().event,
		onDidChange: new EventEmitterImpl().event,
		onDidDelete: new EventEmitterImpl().event,
		dispose: vi.fn(),
	})),
	getWorkspaceFolder: vi.fn((uri) => workspace.workspaceFolders[0]),
	asRelativePath: vi.fn((pathOrUri) => {
		if (typeof pathOrUri === "string") {
			return pathOrUri.replace(/^\/workspace\//, "")
		}
		return pathOrUri.path.replace(/^\/workspace\//, "")
	}),
	updateWorkspaceFolders: vi.fn(),
	registerTaskProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerFileSystemProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerTextDocumentContentProvider: vi.fn(() => ({ dispose: vi.fn() })),
	textDocuments: [],
	notebookDocuments: [],
	isTrusted: true,
	onDidGrantWorkspaceTrust: new EventEmitterImpl().event,
}

const window = {
	activeTextEditor: undefined,
	visibleTextEditors: [],
	terminals: [],
	activeTerminal: undefined,
	activeColorTheme: {
		kind: 1,
	},
	state: {
		focused: true,
	},
	showInformationMessage: vi.fn().mockResolvedValue(undefined),
	showWarningMessage: vi.fn().mockResolvedValue(undefined),
	showErrorMessage: vi.fn().mockResolvedValue(undefined),
	showQuickPick: vi.fn().mockResolvedValue(undefined),
	showInputBox: vi.fn().mockResolvedValue(undefined),
	showOpenDialog: vi.fn().mockResolvedValue(undefined),
	showSaveDialog: vi.fn().mockResolvedValue(undefined),
	createOutputChannel: vi.fn((name) => ({
		name,
		append: vi.fn(),
		appendLine: vi.fn(),
		clear: vi.fn(),
		show: vi.fn(),
		hide: vi.fn(),
		dispose: vi.fn(),
	})),
	createWebviewPanel: vi.fn(() => ({
		webview: {
			html: "",
			options: {},
			asWebviewUri: vi.fn((uri) => uri),
			postMessage: vi.fn().mockResolvedValue(true),
			onDidReceiveMessage: new EventEmitterImpl().event,
		},
		title: "",
		iconPath: undefined,
		viewColumn: ViewColumn.One,
		active: true,
		visible: true,
		onDidChangeViewState: new EventEmitterImpl().event,
		onDidDispose: new EventEmitterImpl().event,
		reveal: vi.fn(),
		dispose: vi.fn(),
	})),
	createTreeView: vi.fn(() => ({
		message: undefined,
		title: undefined,
		selection: [],
		visible: true,
		onDidExpandElement: new EventEmitterImpl().event,
		onDidCollapseElement: new EventEmitterImpl().event,
		onDidChangeSelection: new EventEmitterImpl().event,
		onDidChangeVisibility: new EventEmitterImpl().event,
		reveal: vi.fn().mockResolvedValue(undefined),
		dispose: vi.fn(),
	})),
	createTerminal: vi.fn((options) => ({
		name: options?.name || "Terminal",
		processId: Promise.resolve(1234),
		creationOptions: options || {},
		exitStatus: undefined,
		state: { isInteractedWith: false },
		sendText: vi.fn(),
		show: vi.fn(),
		hide: vi.fn(),
		dispose: vi.fn(),
	})),
	createStatusBarItem: vi.fn((alignment, priority) => ({
		alignment: alignment || StatusBarAlignment.Left,
		priority,
		text: "",
		tooltip: undefined,
		color: undefined,
		backgroundColor: undefined,
		command: undefined,
		accessibilityInformation: undefined,
		show: vi.fn(),
		hide: vi.fn(),
		dispose: vi.fn(),
	})),
	createTextEditorDecorationType: vi.fn(() => ({
		key: "mock-decoration-type",
		dispose: vi.fn(),
	})),
	registerWebviewPanelSerializer: vi.fn(() => ({ dispose: vi.fn() })),
	registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerCustomEditorProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerTerminalLinkProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerTerminalProfileProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerTreeDataProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerFileDecorationProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerUriHandler: vi.fn(() => ({ dispose: vi.fn() })),
	setStatusBarMessage: vi.fn(() => ({ dispose: vi.fn() })),
	withScmProgress: vi.fn((task) => task({})),
	withProgress: vi.fn((options, task) => task({ report: vi.fn() }, new AbortController().signal)),
	showTextDocument: vi.fn().mockResolvedValue({
		document: { uri: Uri.file("/test.txt") },
		selection: new Selection(0, 0, 0, 0),
		viewColumn: ViewColumn.One,
		edit: vi.fn((callback) => {
			const edit = {
				insert: vi.fn(),
				delete: vi.fn(),
				replace: vi.fn(),
				setEndOfLine: vi.fn(),
			}
			callback(edit)
			return Promise.resolve(true)
		}),
		revealRange: vi.fn(),
		setDecorations: vi.fn(),
		dispose: vi.fn(),
	}),
	onDidChangeActiveTextEditor: new EventEmitterImpl().event,
	onDidChangeVisibleTextEditors: new EventEmitterImpl().event,
	onDidChangeTextEditorSelection: new EventEmitterImpl().event,
	onDidChangeTextEditorVisibleRanges: new EventEmitterImpl().event,
	onDidChangeTextEditorOptions: new EventEmitterImpl().event,
	onDidChangeTextEditorViewColumn: new EventEmitterImpl().event,
	onDidChangeActiveColorTheme: new EventEmitterImpl().event,
	onDidChangeWindowState: new EventEmitterImpl().event,
	onDidCloseTerminal: new EventEmitterImpl().event,
	onDidOpenTerminal: new EventEmitterImpl().event,
	onDidChangeActiveTerminal: new EventEmitterImpl().event,
	onDidChangeTerminalState: new EventEmitterImpl().event,
}

const commands = {
	registerCommand: vi.fn((command, callback) => ({
		dispose: vi.fn(),
	})),
	registerTextEditorCommand: vi.fn(() => ({ dispose: vi.fn() })),
	executeCommand: vi.fn().mockResolvedValue(undefined),
	getCommands: vi.fn().mockResolvedValue([]),
}

const languages = {
	registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerCodeActionsProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerCodeLensProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDefinitionProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerImplementationProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerTypeDefinitionProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentHighlightProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentSymbolProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerWorkspaceSymbolProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerReferenceProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerRenameProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentFormattingEditProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentRangeFormattingEditProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerOnTypeFormattingEditProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerSignatureHelpProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentLinkProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerColorProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerFoldingRangeProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDeclarationProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerSelectionRangeProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerCallHierarchyProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerLinkedEditingRangeProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerInlineValuesProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerInlayHintsProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentSemanticTokensProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDocumentRangeSemanticTokensProvider: vi.fn(() => ({ dispose: vi.fn() })),
	setTextDocumentLanguage: vi.fn().mockResolvedValue(undefined),
	match: vi.fn(() => 0),
	getLanguages: vi.fn().mockResolvedValue([]),
	getDiagnostics: vi.fn(() => []),
	createDiagnosticCollection: vi.fn((name) => ({
		name,
		set: vi.fn(),
		delete: vi.fn(),
		clear: vi.fn(),
		forEach: vi.fn(),
		get: vi.fn(),
		has: vi.fn(),
		dispose: vi.fn(),
	})),
	onDidChangeDiagnostics: new EventEmitterImpl().event,
}

const extensions = {
	all: [],
	getExtension: vi.fn(() => undefined),
	onDidChange: new EventEmitterImpl().event,
}

const env = {
	appName: "Visual Studio Code",
	appRoot: "/Applications/Visual Studio Code.app",
	language: "en",
	clipboard: {
		readText: vi.fn().mockResolvedValue(""),
		writeText: vi.fn().mockResolvedValue(undefined),
	},
	machineId: "mock-machine-id",
	sessionId: "mock-session-id",
	shell: "/bin/bash",
	uriScheme: "vscode",
	openExternal: vi.fn().mockResolvedValue(true),
	asExternalUri: vi.fn((uri) => Promise.resolve(uri)),
	remoteName: undefined,
	uiKind: 1, // UIKind.Desktop
	isNewAppInstall: false,
	isTelemetryEnabled: false,
	onDidChangeTelemetryEnabled: new EventEmitterImpl().event,
	onDidChangeShell: new EventEmitterImpl().event,
	createTelemetryLogger: vi.fn(() => ({
		logUsage: vi.fn(),
		logError: vi.fn(),
		dispose: vi.fn(),
	})),
}

const debug = {
	activeDebugSession: undefined,
	activeDebugConsole: {
		append: vi.fn(),
		appendLine: vi.fn(),
	},
	breakpoints: [],
	onDidChangeActiveDebugSession: new EventEmitterImpl().event,
	onDidStartDebugSession: new EventEmitterImpl().event,
	onDidReceiveDebugSessionCustomEvent: new EventEmitterImpl().event,
	onDidTerminateDebugSession: new EventEmitterImpl().event,
	onDidChangeBreakpoints: new EventEmitterImpl().event,
	registerDebugConfigurationProvider: vi.fn(() => ({ dispose: vi.fn() })),
	registerDebugAdapterDescriptorFactory: vi.fn(() => ({ dispose: vi.fn() })),
	registerDebugAdapterTrackerFactory: vi.fn(() => ({ dispose: vi.fn() })),
	startDebugging: vi.fn().mockResolvedValue(true),
	stopDebugging: vi.fn().mockResolvedValue(undefined),
	addBreakpoints: vi.fn(),
	removeBreakpoints: vi.fn(),
}

const tasks = {
	registerTaskProvider: vi.fn(() => ({ dispose: vi.fn() })),
	fetchTasks: vi.fn().mockResolvedValue([]),
	executeTask: vi.fn().mockResolvedValue(undefined),
	onDidStartTask: new EventEmitterImpl().event,
	onDidEndTask: new EventEmitterImpl().event,
	onDidStartTaskProcess: new EventEmitterImpl().event,
	onDidEndTaskProcess: new EventEmitterImpl().event,
}

const scm = {
	createSourceControl: vi.fn((id, label, rootUri) => ({
		id,
		label,
		rootUri,
		inputBox: {
			value: "",
			placeholder: undefined,
			visible: true,
			enabled: true,
		},
		statusBarCommands: undefined,
		acceptInputCommand: undefined,
		quickDiffProvider: undefined,
		commitTemplate: undefined,
		createResourceGroup: vi.fn((id, label) => ({
			id,
			label,
			resourceStates: [],
			hideWhenEmpty: false,
			dispose: vi.fn(),
		})),
		dispose: vi.fn(),
	})),
	inputBox: undefined,
}

const comments = {
	createCommentController: vi.fn((id, label) => ({
		id,
		label,
		options: {},
		commentingRangeProvider: undefined,
		createCommentThread: vi.fn(() => ({
			uri: Uri.file("/test.txt"),
			range: new Range(0, 0, 0, 0),
			comments: [],
			collapsibleState: CommentThreadCollapsibleState.Expanded,
			canReply: true,
			contextValue: undefined,
			label: undefined,
			state: undefined,
			dispose: vi.fn(),
		})),
		dispose: vi.fn(),
	})),
}

const authentication = {
	getSession: vi.fn().mockResolvedValue(undefined),
	registerAuthenticationProvider: vi.fn(() => ({ dispose: vi.fn() })),
	onDidChangeSessions: new EventEmitterImpl().event,
}

const l10n = {
	t: vi.fn((message) => message),
	bundle: undefined,
	uri: undefined,
}

const tests = {
	createTestController: vi.fn((id, label) => ({
		id,
		label,
		items: {
			add: vi.fn(),
			delete: vi.fn(),
			forEach: vi.fn(),
			get: vi.fn(),
			replace: vi.fn(),
			size: 0,
		},
		createRunProfile: vi.fn(() => ({ dispose: vi.fn() })),
		createTestItem: vi.fn((id, label, uri) => ({
			id,
			label,
			uri,
			children: {
				add: vi.fn(),
				delete: vi.fn(),
				forEach: vi.fn(),
				get: vi.fn(),
				replace: vi.fn(),
				size: 0,
			},
			parent: undefined,
			tags: [],
			canResolveChildren: false,
			busy: false,
			description: undefined,
			error: undefined,
			range: undefined,
			sortText: undefined,
		})),
		createTestRun: vi.fn(() => ({
			name: undefined,
			token: { isCancellationRequested: false, onCancellationRequested: new EventEmitterImpl().event },
			isPersisted: true,
			enqueued: vi.fn(),
			started: vi.fn(),
			skipped: vi.fn(),
			failed: vi.fn(),
			errored: vi.fn(),
			passed: vi.fn(),
			appendOutput: vi.fn(),
			end: vi.fn(),
		})),
		resolveHandler: undefined,
		refreshHandler: undefined,
		dispose: vi.fn(),
	})),
}

module.exports = {
	// Classes
	Uri,
	Position,
	Range,
	Selection,
	Location,
	Diagnostic,
	DiagnosticRelatedInformation,
	EventEmitter: EventEmitterImpl,
	RelativePattern,

	// Enums
	DiagnosticSeverity,
	TreeItemCollapsibleState,
	ViewColumn,
	StatusBarAlignment,
	TextEditorRevealType,
	OverviewRulerLane,
	DecorationRangeBehavior,
	TextEditorSelectionChangeKind,
	ConfigurationTarget,
	FileType,
	FileChangeType,
	ExtensionKind,
	ExtensionMode,
	CommentThreadCollapsibleState,
	ProgressLocation,

	// Namespaces
	workspace,
	window,
	commands,
	languages,
	extensions,
	env,
	debug,
	tasks,
	scm,
	comments,
	authentication,
	l10n,
	tests,

	// Additional types needed for tests
	CancellationTokenSource: class {
		constructor() {
			this.token = {
				isCancellationRequested: false,
				onCancellationRequested: new EventEmitterImpl().event,
			}
		}
		cancel() {
			this.token.isCancellationRequested = true
		}
		dispose() {}
	},

	Disposable: class {
		constructor(callOnDispose) {
			this._callOnDispose = callOnDispose
		}
		static from(...disposables) {
			return {
				dispose: () => disposables.forEach((d) => d.dispose()),
			}
		}
		dispose() {
			if (this._callOnDispose) {
				this._callOnDispose()
			}
		}
	},

	WorkspaceEdit: class {
		constructor() {
			this._edits = []
		}
		createFile(uri, options, metadata) {
			this._edits.push({ type: "create", uri, options, metadata })
		}
		deleteFile(uri, options, metadata) {
			this._edits.push({ type: "delete", uri, options, metadata })
		}
		renameFile(oldUri, newUri, options, metadata) {
			this._edits.push({ type: "rename", oldUri, newUri, options, metadata })
		}
		replace(uri, range, newText, metadata) {
			this._edits.push({ type: "replace", uri, range, newText, metadata })
		}
		insert(uri, position, newText, metadata) {
			this._edits.push({ type: "insert", uri, position, newText, metadata })
		}
		delete(uri, range, metadata) {
			this._edits.push({ type: "delete", uri, range, metadata })
		}
		has(uri) {
			return this._edits.some((edit) => edit.uri && edit.uri.toString() === uri.toString())
		}
		set(uri, edits) {
			this._edits.push({ type: "set", uri, edits })
		}
		get(uri) {
			return this._edits.filter((edit) => edit.uri && edit.uri.toString() === uri.toString())
		}
		get size() {
			return this._edits.length
		}
		entries() {
			return this._edits.map((edit) => [edit.uri, [edit]])
		}
	},

	ThemeIcon: class {
		constructor(id, color) {
			this.id = id
			this.color = color
		}
		static File = new this("file")
		static Folder = new this("folder")
	},

	ThemeColor: class {
		constructor(id) {
			this.id = id
		}
	},

	CodeLens: class {
		constructor(range, command) {
			this.range = range
			this.command = command
			this.isResolved = command !== undefined
		}
	},

	MarkdownString: class {
		constructor(value, supportThemeIcons) {
			this.value = value || ""
			this.isTrusted = false
			this.supportThemeIcons = supportThemeIcons
		}
		appendText(value) {
			this.value += value
			return this
		}
		appendMarkdown(value) {
			this.value += value
			return this
		}
		appendCodeblock(code, language) {
			this.value += "\n```" + (language || "") + "\n" + code + "\n```\n"
			return this
		}
	},

	Hover: class {
		constructor(contents, range) {
			this.contents = Array.isArray(contents) ? contents : [contents]
			this.range = range
		}
	},

	DocumentLink: class {
		constructor(range, target) {
			this.range = range
			this.target = target
		}
	},

	CodeAction: class {
		constructor(title, kind) {
			this.title = title
			this.kind = kind
		}
	},

	CodeActionKind: {
		Empty: "",
		QuickFix: "quickfix",
		Refactor: "refactor",
		RefactorExtract: "refactor.extract",
		RefactorInline: "refactor.inline",
		RefactorRewrite: "refactor.rewrite",
		Source: "source",
		SourceOrganizeImports: "source.organizeImports",
		SourceFixAll: "source.fixAll",
	},

	CompletionItem: class {
		constructor(label, kind) {
			this.label = label
			this.kind = kind
		}
	},

	CompletionItemKind: {
		Text: 0,
		Method: 1,
		Function: 2,
		Constructor: 3,
		Field: 4,
		Variable: 5,
		Class: 6,
		Interface: 7,
		Module: 8,
		Property: 9,
		Unit: 10,
		Value: 11,
		Enum: 12,
		Keyword: 13,
		Snippet: 14,
		Color: 15,
		File: 16,
		Reference: 17,
		Folder: 18,
		EnumMember: 19,
		Constant: 20,
		Struct: 21,
		Event: 22,
		Operator: 23,
		TypeParameter: 24,
		User: 25,
		Issue: 26,
	},

	CompletionList: class {
		constructor(items, isIncomplete) {
			this.items = items || []
			this.isIncomplete = isIncomplete || false
		}
	},

	DocumentHighlight: class {
		constructor(range, kind) {
			this.range = range
			this.kind = kind
		}
	},

	DocumentHighlightKind: {
		Text: 0,
		Read: 1,
		Write: 2,
	},

	SymbolInformation: class {
		constructor(name, kind, containerName, location) {
			this.name = name
			this.kind = kind
			this.containerName = containerName
			this.location = location
		}
	},

	SymbolKind: {
		File: 0,
		Module: 1,
		Namespace: 2,
		Package: 3,
		Class: 4,
		Method: 5,
		Property: 6,
		Field: 7,
		Constructor: 8,
		Enum: 9,
		Interface: 10,
		Function: 11,
		Variable: 12,
		Constant: 13,
		String: 14,
		Number: 15,
		Boolean: 16,
		Array: 17,
		Object: 18,
		Key: 19,
		Null: 20,
		EnumMember: 21,
		Struct: 22,
		Event: 23,
		Operator: 24,
		TypeParameter: 25,
	},

	DocumentSymbol: class {
		constructor(name, detail, kind, range, selectionRange) {
			this.name = name
			this.detail = detail
			this.kind = kind
			this.range = range
			this.selectionRange = selectionRange
			this.children = []
		}
	},

	FoldingRange: class {
		constructor(start, end, kind) {
			this.start = start
			this.end = end
			this.kind = kind
		}
	},

	FoldingRangeKind: {
		Comment: 1,
		Imports: 2,
		Region: 3,
	},

	SelectionRange: class {
		constructor(range, parent) {
			this.range = range
			this.parent = parent
		}
	},

	CallHierarchyItem: class {
		constructor(kind, name, detail, uri, range, selectionRange) {
			this.kind = kind
			this.name = name
			this.detail = detail
			this.uri = uri
			this.range = range
			this.selectionRange = selectionRange
		}
	},

	CallHierarchyIncomingCall: class {
		constructor(from, fromRanges) {
			this.from = from
			this.fromRanges = fromRanges
		}
	},

	CallHierarchyOutgoingCall: class {
		constructor(to, fromRanges) {
			this.to = to
			this.fromRanges = fromRanges
		}
	},

	SemanticTokens: class {
		constructor(data, resultId) {
			this.data = data
			this.resultId = resultId
		}
	},

	SemanticTokensEdit: class {
		constructor(start, deleteCount, data) {
			this.start = start
			this.deleteCount = deleteCount
			this.data = data
		}
	},

	SemanticTokensEdits: class {
		constructor(edits, resultId) {
			this.edits = edits
			this.resultId = resultId
		}
	},

	SemanticTokensLegend: class {
		constructor(tokenTypes, tokenModifiers) {
			this.tokenTypes = tokenTypes
			this.tokenModifiers = tokenModifiers
		}
	},

	SemanticTokensBuilder: class {
		constructor(legend) {
			this.legend = legend
			this._tokens = []
		}
		push(line, char, length, tokenType, tokenModifiers) {
			this._tokens.push({ line, char, length, tokenType, tokenModifiers })
		}
		build() {
			return new module.exports.SemanticTokens(new Uint32Array(this._tokens.length * 5))
		}
	},

	LinkedEditingRanges: class {
		constructor(ranges, wordPattern) {
			this.ranges = ranges
			this.wordPattern = wordPattern
		}
	},

	Color: class {
		constructor(red, green, blue, alpha) {
			this.red = red
			this.green = green
			this.blue = blue
			this.alpha = alpha
		}
	},

	ColorInformation: class {
		constructor(range, color) {
			this.range = range
			this.color = color
		}
	},

	ColorPresentation: class {
		constructor(label) {
			this.label = label
		}
	},

	InlayHint: class {
		constructor(position, label, kind) {
			this.position = position
			this.label = label
			this.kind = kind
		}
	},

	InlayHintKind: {
		Type: 1,
		Parameter: 2,
	},

	InlayHintLabelPart: class {
		constructor(value) {
			this.value = value
		}
	},

	EvaluatableExpression: class {
		constructor(range, expression) {
			this.range = range
			this.expression = expression
		}
	},

	InlineValueText: class {
		constructor(range, text) {
			this.range = range
			this.text = text
		}
	},

	InlineValueVariableLookup: class {
		constructor(range, variableName, caseSensitiveLookup) {
			this.range = range
			this.variableName = variableName
			this.caseSensitiveLookup = caseSensitiveLookup
		}
	},

	InlineValueEvaluatableExpression: class {
		constructor(range, expression) {
			this.range = range
			this.expression = expression
		}
	},

	InlineCompletionItem: class {
		constructor(insertText, range, command) {
			this.insertText = insertText
			this.range = range
			this.command = command
		}
	},

	InlineCompletionList: class {
		constructor(items) {
			this.items = items
		}
	},

	ParameterInformation: class {
		constructor(label, documentation) {
			this.label = label
			this.documentation = documentation
		}
	},

	SignatureInformation: class {
		constructor(label, documentation) {
			this.label = label
			this.documentation = documentation
			this.parameters = []
		}
	},

	SignatureHelp: class {
		constructor(signatures, activeSignature, activeParameter) {
			this.signatures = signatures
			this.activeSignature = activeSignature
			this.activeParameter = activeParameter
		}
	},

	TypeHierarchyItem: class {
		constructor(kind, name, detail, uri, range, selectionRange) {
			this.kind = kind
			this.name = name
			this.detail = detail
			this.uri = uri
			this.range = range
			this.selectionRange = selectionRange
		}
	},
}
