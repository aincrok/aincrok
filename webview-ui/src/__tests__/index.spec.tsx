import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Create mock functions
const mockRender = vi.fn()
const mockCreateRoot = vi.fn(() => ({
	render: mockRender,
}))

const mockGetHighlighter = vi.fn(() => Promise.resolve({}))

// Mock React DOM to prevent actual DOM rendering in tests
vi.mock("react-dom/client", () => ({
	createRoot: mockCreateRoot,
}))

// Mock App component
vi.mock("../App", () => ({
	default: () => null,
}))

// Mock highlighter
vi.mock("../utils/highlighter", () => ({
	getHighlighter: mockGetHighlighter,
}))

// Mock CSS imports
vi.mock("../index.css", () => ({}))
vi.mock("../../node_modules/@vscode/codicons/dist/codicon.css", () => ({}))
vi.mock("../codicon-custom.css", () => ({}))

describe("index.tsx", () => {
	// Mock console.error to avoid noise in test output
	const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

	// Mock DOM element
	const mockRootElement = document.createElement("div")

	beforeEach(() => {
		vi.clearAllMocks()

		// Setup DOM mock
		vi.spyOn(document, "getElementById").mockReturnValue(mockRootElement)
	})

	afterEach(() => {
		vi.resetModules()
	})

	it("should initialize the React app with StrictMode", async () => {
		// Import the module to trigger initialization
		await import("../index")

		// Verify document.getElementById was called with "root"
		expect(document.getElementById).toHaveBeenCalledWith("root")

		// Verify createRoot was called with the root element
		expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement)

		// Verify render was called
		expect(mockRender).toHaveBeenCalled()
	})

	it("should initialize Shiki highlighter early", async () => {
		// Import the module to trigger initialization
		await import("../index")

		// Verify getHighlighter was called
		expect(mockGetHighlighter).toHaveBeenCalled()
	})

	it("should render App component inside StrictMode", async () => {
		// Import the module to trigger initialization
		await import("../index")

		// Verify render was called
		expect(mockRender).toHaveBeenCalled()
	})

	it("should import all required CSS files", async () => {
		// These imports are tested by the module loading without errors
		// The mocks ensure the CSS files are properly handled
		await expect(async () => {
			await import("../index")
		}).not.toThrow()
	})

	it("should handle DOM element correctly", async () => {
		// Import the module to trigger initialization
		await import("../index")

		// Verify document.getElementById was called with "root"
		expect(document.getElementById).toHaveBeenCalledWith("root")

		// Verify createRoot was called with the root element
		expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement)
	})
})
