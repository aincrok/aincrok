import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createHighlighter, bundledLanguages } from "shiki"
import { normalizeLanguage, getHighlighter, isLanguageLoaded, type ExtendedLanguage } from "../highlighter"

// Mock the shiki module
vi.mock("shiki", () => ({
	createHighlighter: vi.fn(),
	bundledLanguages: {
		javascript: true,
		typescript: true,
		python: true,
		shell: true,
		html: true,
		css: true,
		json: true,
		markdown: true,
		yaml: true,
		sql: true,
		xml: true,
		"c++": true,
		"c#": true,
		ruby: true,
		docker: true,
		log: true,
	},
	bundledThemes: {
		"dark-plus": true,
		"light-plus": true,
	},
}))

describe("highlighter utils", () => {
	// Mock highlighter instance
	const mockHighlighter = {
		loadLanguage: vi.fn().mockResolvedValue(undefined),
	}

	// Mock console methods
	const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
	const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

	beforeEach(() => {
		vi.clearAllMocks()

		// Reset createHighlighter mock to return our mock highlighter
		vi.mocked(createHighlighter).mockResolvedValue(mockHighlighter as any)

		// Reset internal state by reimporting (this is a workaround for singleton state)
		vi.resetModules()
	})

	afterEach(() => {
		consoleWarnSpy.mockClear()
		consoleErrorSpy.mockClear()
	})

	describe("normalizeLanguage", () => {
		it("should return 'txt' for undefined language", () => {
			const result = normalizeLanguage(undefined)
			expect(result).toBe("txt")
		})

		it("should return valid bundled languages as-is", () => {
			const result = normalizeLanguage("javascript")
			expect(result).toBe("javascript")
		})

		it("should handle case-insensitive language names", () => {
			const result = normalizeLanguage("JAVASCRIPT")
			expect(result).toBe("javascript")
		})

		it("should resolve language aliases", () => {
			// JavaScript aliases
			expect(normalizeLanguage("js")).toBe("javascript")
			expect(normalizeLanguage("node")).toBe("javascript")
			expect(normalizeLanguage("nodejs")).toBe("javascript")

			// TypeScript aliases
			expect(normalizeLanguage("ts")).toBe("typescript")

			// Python aliases
			expect(normalizeLanguage("py")).toBe("python")
			expect(normalizeLanguage("python3")).toBe("python")
			expect(normalizeLanguage("py3")).toBe("python")

			// Shell aliases
			expect(normalizeLanguage("sh")).toBe("shell")
			expect(normalizeLanguage("bash")).toBe("shell")
			expect(normalizeLanguage("zsh")).toBe("shell")
			expect(normalizeLanguage("shellscript")).toBe("shell")
			expect(normalizeLanguage("shell-script")).toBe("shell")
			expect(normalizeLanguage("console")).toBe("shell")
			expect(normalizeLanguage("terminal")).toBe("shell")

			// Text aliases
			expect(normalizeLanguage("text")).toBe("txt")
			expect(normalizeLanguage("plaintext")).toBe("txt")
			expect(normalizeLanguage("plain")).toBe("txt")

			// Ruby aliases
			expect(normalizeLanguage("rb")).toBe("ruby")

			// Markdown aliases
			expect(normalizeLanguage("md")).toBe("markdown")

			// C++ aliases
			expect(normalizeLanguage("cpp")).toBe("c++")
			expect(normalizeLanguage("cc")).toBe("c++")

			// C# aliases
			expect(normalizeLanguage("cs")).toBe("c#")
			expect(normalizeLanguage("csharp")).toBe("c#")

			// HTML aliases
			expect(normalizeLanguage("htm")).toBe("html")

			// YAML aliases
			expect(normalizeLanguage("yml")).toBe("yaml")

			// Docker aliases
			expect(normalizeLanguage("dockerfile")).toBe("docker")

			// CSS aliases
			expect(normalizeLanguage("styles")).toBe("css")
			expect(normalizeLanguage("style")).toBe("css")

			// JSON aliases
			expect(normalizeLanguage("jsonc")).toBe("json")
			expect(normalizeLanguage("json5")).toBe("json")

			// XML aliases
			expect(normalizeLanguage("xaml")).toBe("xml")
			expect(normalizeLanguage("xhtml")).toBe("xml")
			expect(normalizeLanguage("svg")).toBe("xml")

			// SQL aliases
			expect(normalizeLanguage("mysql")).toBe("sql")
			expect(normalizeLanguage("postgresql")).toBe("sql")
			expect(normalizeLanguage("postgres")).toBe("sql")
			expect(normalizeLanguage("pgsql")).toBe("sql")
			expect(normalizeLanguage("plsql")).toBe("sql")
			expect(normalizeLanguage("oracle")).toBe("sql")
		})

		it("should warn about unrecognized languages and default to txt", () => {
			const result = normalizeLanguage("unknown-lang")

			expect(result).toBe("txt")
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"[Shiki] Unrecognized language 'unknown-lang', defaulting to txt.",
			)
		})

		it("should only warn once per unrecognized language", () => {
			normalizeLanguage("unknown-lang2")
			normalizeLanguage("unknown-lang2")

			expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"[Shiki] Unrecognized language 'unknown-lang2', defaulting to txt.",
			)
		})

		it("should not warn for 'txt' language", () => {
			const result = normalizeLanguage("txt")

			expect(result).toBe("txt")
			expect(consoleWarnSpy).not.toHaveBeenCalled()
		})

		it("should handle empty string", () => {
			const result = normalizeLanguage("")

			expect(result).toBe("txt")
			expect(consoleWarnSpy).toHaveBeenCalledWith("[Shiki] Unrecognized language '', defaulting to txt.")
		})

		it("should handle case-insensitive aliases", () => {
			expect(normalizeLanguage("JS")).toBe("javascript")
			expect(normalizeLanguage("PY")).toBe("python")
			expect(normalizeLanguage("BASH")).toBe("shell")
		})
	})

	describe("getHighlighter", () => {
		it("should create highlighter instance on first call", async () => {
			const { getHighlighter } = await import("../highlighter")

			const result = await getHighlighter()

			expect(createHighlighter).toHaveBeenCalledWith({
				themes: expect.arrayContaining(["dark-plus", "light-plus"]),
				langs: ["shell", "log"],
			})
			expect(result).toBe(mockHighlighter)
		})

		it("should reuse existing highlighter instance", async () => {
			const { getHighlighter } = await import("../highlighter")

			const result1 = await getHighlighter()
			const result2 = await getHighlighter()

			expect(createHighlighter).toHaveBeenCalledTimes(1)
			expect(result1).toBe(result2)
		})

		it("should load requested language if not already loaded", async () => {
			const { getHighlighter } = await import("../highlighter")

			await getHighlighter("javascript")

			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("javascript")
		})

		it("should not reload already loaded languages", async () => {
			const { getHighlighter } = await import("../highlighter")

			// Initial languages (shell, log) should be loaded during initialization
			await getHighlighter("shell")

			expect(mockHighlighter.loadLanguage).not.toHaveBeenCalledWith("shell")
		})

		it("should handle language aliases", async () => {
			const { getHighlighter } = await import("../highlighter")

			await getHighlighter("js")

			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("javascript")
		})

		it("should not try to load 'txt' language", async () => {
			const { getHighlighter } = await import("../highlighter")

			await getHighlighter("txt")

			expect(mockHighlighter.loadLanguage).not.toHaveBeenCalledWith("txt")
		})

		it("should handle multiple concurrent requests for same language", async () => {
			const { getHighlighter } = await import("../highlighter")

			// Make multiple concurrent requests for the same language
			const promises = [getHighlighter("python"), getHighlighter("python"), getHighlighter("python")]

			await Promise.all(promises)

			// Should only load the language once
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledTimes(1)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("python")
		})

		it("should handle language loading errors", async () => {
			const { getHighlighter } = await import("../highlighter")

			const loadError = new Error("Failed to load language")
			mockHighlighter.loadLanguage.mockRejectedValueOnce(loadError)

			await expect(getHighlighter("python")).rejects.toThrow("Failed to load language")
			expect(consoleErrorSpy).toHaveBeenCalledWith("[Shiki] Failed to load language python:", loadError)
		})

		it("should handle highlighter initialization errors", async () => {
			const { getHighlighter } = await import("../highlighter")

			const initError = new Error("Failed to initialize")
			vi.mocked(createHighlighter).mockRejectedValueOnce(initError)

			await expect(getHighlighter()).rejects.toThrow("Failed to initialize")
			expect(consoleErrorSpy).toHaveBeenCalledWith("[Shiki] Error in getHighlighter:", initError)
		})

		it("should handle undefined language parameter", async () => {
			const { getHighlighter } = await import("../highlighter")

			const result = await getHighlighter(undefined)

			expect(result).toBe(mockHighlighter)
			// Should not try to load any additional language for 'txt'
			expect(mockHighlighter.loadLanguage).not.toHaveBeenCalled()
		})

		it("should track loaded languages correctly", async () => {
			const { getHighlighter } = await import("../highlighter")

			await getHighlighter("javascript")
			await getHighlighter("python")

			// Each language should be loaded exactly once
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledTimes(2)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("javascript")
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("python")
		})

		it("should clean up pending promises after successful load", async () => {
			const { getHighlighter } = await import("../highlighter")

			await getHighlighter("typescript")
			// Make another request for the same language
			await getHighlighter("typescript")

			// Should only load once since it's now in loadedLanguages
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledTimes(1)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("typescript")
		})

		it("should clean up pending promises after failed load", async () => {
			const { getHighlighter } = await import("../highlighter")

			const loadError = new Error("Load failed")
			mockHighlighter.loadLanguage.mockRejectedValueOnce(loadError)

			// First call should fail
			await expect(getHighlighter("ruby")).rejects.toThrow("Load failed")

			// Second call should retry loading (not use cached failed promise)
			mockHighlighter.loadLanguage.mockResolvedValueOnce(undefined)
			await getHighlighter("ruby")

			expect(mockHighlighter.loadLanguage).toHaveBeenCalledTimes(2)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("ruby")
		})
	})

	describe("isLanguageLoaded", () => {
		it("should return true for txt (always loaded)", async () => {
			const { isLanguageLoaded } = await import("../highlighter")

			expect(isLanguageLoaded("txt")).toBe(true)
		})

		it("should return true for initially loaded languages after initialization", async () => {
			const { getHighlighter, isLanguageLoaded } = await import("../highlighter")

			// Languages are only marked as loaded after highlighter initialization
			await getHighlighter()

			expect(isLanguageLoaded("shell")).toBe(true)
			expect(isLanguageLoaded("log")).toBe(true)
		})

		it("should return false for unloaded languages", async () => {
			const { isLanguageLoaded } = await import("../highlighter")

			expect(isLanguageLoaded("javascript")).toBe(false)
		})

		it("should return true for loaded languages", async () => {
			const { getHighlighter, isLanguageLoaded } = await import("../highlighter")

			await getHighlighter("python")
			expect(isLanguageLoaded("python")).toBe(true)
		})

		it("should handle language aliases", async () => {
			const { getHighlighter, isLanguageLoaded } = await import("../highlighter")

			await getHighlighter("js")
			expect(isLanguageLoaded("javascript")).toBe(true)
			expect(isLanguageLoaded("js")).toBe(true)
		})

		it("should handle undefined language", async () => {
			const { isLanguageLoaded } = await import("../highlighter")

			expect(isLanguageLoaded(undefined as any)).toBe(true) // normalizes to txt
		})

		it("should handle unrecognized languages", async () => {
			const { isLanguageLoaded } = await import("../highlighter")

			expect(isLanguageLoaded("unknown")).toBe(true) // normalizes to txt
		})
	})

	describe("integration scenarios", () => {
		it("should handle complex workflow with multiple languages", async () => {
			const { getHighlighter, isLanguageLoaded } = await import("../highlighter")

			// Check initial state
			expect(isLanguageLoaded("javascript")).toBe(false)
			expect(isLanguageLoaded("python")).toBe(false)

			// Load first language
			const highlighter1 = await getHighlighter("js")
			expect(isLanguageLoaded("javascript")).toBe(true)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("javascript")

			// Load second language
			const highlighter2 = await getHighlighter("python")
			expect(isLanguageLoaded("python")).toBe(true)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("python")

			// Both should return same instance
			expect(highlighter1).toBe(highlighter2)
			expect(highlighter1).toBe(mockHighlighter)
		})

		it("should handle concurrent initialization and language loading", async () => {
			const { getHighlighter } = await import("../highlighter")

			// Start multiple operations concurrently
			const promises = [
				getHighlighter("javascript"),
				getHighlighter("python"),
				getHighlighter("typescript"),
				getHighlighter(), // no language
				getHighlighter("js"), // alias for javascript
			]

			const results = await Promise.all(promises)

			// All should return the same instance
			results.forEach((result) => {
				expect(result).toBe(mockHighlighter)
			})

			// Should only initialize once
			expect(createHighlighter).toHaveBeenCalledTimes(1)

			// Should load unique languages (javascript, python, typescript)
			// Note: 'js' is alias for 'javascript', so only 3 unique loads
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledTimes(3)
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("javascript")
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("python")
			expect(mockHighlighter.loadLanguage).toHaveBeenCalledWith("typescript")
		})
	})
})
