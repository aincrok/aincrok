import { describe, it, expect, vi, beforeEach } from "vitest"
import { MultiFileSearchReplaceDiffStrategy } from "../multi-file-search-replace"
import { DiffResult } from "../../../../shared/tools"

// Mock dependencies
vi.mock("fastest-levenshtein", () => ({
	distance: vi.fn((a: string, b: string) => {
		// Simple mock that returns 0 for exact matches, length difference for others
		if (a === b) return 0
		return Math.abs(a.length - b.length)
	}),
}))

vi.mock("../../../../integrations/misc/extract-text", () => ({
	addLineNumbers: vi.fn((text: string) =>
		text
			.split("\n")
			.map((line, i) => `${i + 1}: ${line}`)
			.join("\n"),
	),
	everyLineHasLineNumbers: vi.fn((text: string) => text.split("\n").every((line) => /^\d+:/.test(line))),
	stripLineNumbers: vi.fn((text: string) =>
		text
			.split("\n")
			.map((line) => line.replace(/^\d+:\s*/, ""))
			.join("\n"),
	),
}))

vi.mock("../../../../utils/text-normalization", () => ({
	normalizeString: vi.fn((str: string) => str.replace(/[""'']/g, '"')),
}))

describe("MultiFileSearchReplaceDiffStrategy", () => {
	let strategy: MultiFileSearchReplaceDiffStrategy

	beforeEach(() => {
		vi.clearAllMocks()
		strategy = new MultiFileSearchReplaceDiffStrategy()
	})

	describe("constructor", () => {
		it("should use default values", () => {
			const defaultStrategy = new MultiFileSearchReplaceDiffStrategy()
			expect(defaultStrategy.getName()).toBe("MultiFileSearchReplace")
		})

		it("should accept custom fuzzy threshold", () => {
			const customStrategy = new MultiFileSearchReplaceDiffStrategy(0.8)
			expect(customStrategy.getName()).toBe("MultiFileSearchReplace")
		})

		it("should accept custom buffer lines", () => {
			const customStrategy = new MultiFileSearchReplaceDiffStrategy(1.0, 20)
			expect(customStrategy.getName()).toBe("MultiFileSearchReplace")
		})

		it("should accept both custom parameters", () => {
			const customStrategy = new MultiFileSearchReplaceDiffStrategy(0.9, 30)
			expect(customStrategy.getName()).toBe("MultiFileSearchReplace")
		})
	})

	describe("getName", () => {
		it("should return correct strategy name", () => {
			expect(strategy.getName()).toBe("MultiFileSearchReplace")
		})
	})

	describe("getToolDescription", () => {
		it("should return comprehensive tool description", () => {
			const args = { cwd: "/test/workspace" }
			const description = strategy.getToolDescription(args)

			expect(description).toContain("apply_diff")
			expect(description).toContain("PRECISE, TARGETED modifications")
			expect(description).toContain("SEARCH/REPLACE")
			expect(description).toContain("multiple files")
		})

		it("should handle tool options", () => {
			const args = {
				cwd: "/test/workspace",
				toolOptions: { someOption: "value" },
			}
			const description = strategy.getToolDescription(args)

			expect(description).toContain("apply_diff")
		})

		it("should contain usage examples", () => {
			const args = { cwd: "/test/workspace" }
			const description = strategy.getToolDescription(args)

			expect(description).toContain("SEARCH")
			expect(description).toContain("REPLACE")
		})
	})

	describe("applyDiff", () => {
		const mockOriginalContent = "old content\nother line"
		const mockDiffContent = `SEARCH
old content
REPLACE
new content`

		it("should apply simple search and replace", async () => {
			const result = await strategy.applyDiff(mockOriginalContent, mockDiffContent)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.content).toContain("new content")
			}
		})

		it("should handle multiple search/replace blocks", async () => {
			const multiBlockDiff = `SEARCH
old content
REPLACE
new content

SEARCH
other line
REPLACE
modified line`

			const result = await strategy.applyDiff(mockOriginalContent, multiBlockDiff)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.content).toBe("new content\nmodified line")
			}
		})

		it("should handle search content not found", async () => {
			const notFoundDiff = `SEARCH
nonexistent content
REPLACE
replacement`

			const result = await strategy.applyDiff(mockOriginalContent, notFoundDiff)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error).toBeDefined()
			}
		})

		it("should handle fuzzy matching", async () => {
			const fuzzyStrategy = new MultiFileSearchReplaceDiffStrategy(0.8)
			const fuzzyDiff = `SEARCH
old_content
REPLACE
new content`

			const result = await fuzzyStrategy.applyDiff(mockOriginalContent, fuzzyDiff)

			// With fuzzy matching, similar content should be found
			expect(result.success).toBe(true)
		})

		it("should handle empty search content", async () => {
			const emptySearchDiff = `SEARCH

REPLACE
new content`

			const result = await strategy.applyDiff(mockOriginalContent, emptySearchDiff)

			expect(result.success).toBe(false)
		})

		it("should handle malformed diff blocks", async () => {
			const malformedDiff = `SEARCH
content without replace`

			const result = await strategy.applyDiff(mockOriginalContent, malformedDiff)

			expect(result.success).toBe(false)
		})

		it("should handle files with line numbers", async () => {
			const numberedContent = "1: old content\n2: other line"

			vi.mocked(require("../../../../integrations/misc/extract-text").everyLineHasLineNumbers).mockReturnValue(
				true,
			)
			vi.mocked(require("../../../../integrations/misc/extract-text").stripLineNumbers).mockReturnValue(
				"old content\nother line",
			)

			const result = await strategy.applyDiff(numberedContent, mockDiffContent)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.content).toContain("new content")
			}
		})

		it("should preserve file structure in replacements", async () => {
			const structuredContent = `class TestClass {
	private value: string;
	
	constructor() {
		this.value = "old";
	}
	
	getValue() {
		return this.value;
	}
}`

			const structuredDiff = `SEARCH
		this.value = "old";
REPLACE
		this.value = "new";`

			const result = await strategy.applyDiff(structuredContent, structuredDiff)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.content).toContain('this.value = "new";')
			}
		})

		it("should handle special characters in search/replace", async () => {
			const specialContent = 'const regex = /[a-z]+$/; const quote = "hello";'

			const specialDiff = `SEARCH
const regex = /[a-z]+$/;
REPLACE
const regex = /[A-Z]+$/;`

			const result = await strategy.applyDiff(specialContent, specialDiff)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.content).toContain("const regex = /[A-Z]+$/;")
			}
		})
	})

	describe("similarity calculation", () => {
		it("should calculate exact matches correctly", async () => {
			const exactDiff = `SEARCH
exact match
REPLACE
replacement`

			const exactContent = "exact match"

			const result = await strategy.applyDiff(exactContent, exactDiff)

			expect(result.success).toBe(true)
		})

		it("should handle normalized text comparisons", async () => {
			const normalizedContent = 'const text = "smart quotes";'

			const normalizedDiff = `SEARCH
const text = "smart quotes";
REPLACE
const text = "normal quotes";`

			const result = await strategy.applyDiff(normalizedContent, normalizedDiff)

			expect(result.success).toBe(true)
		})

		it("should reject matches below fuzzy threshold", async () => {
			const strictStrategy = new MultiFileSearchReplaceDiffStrategy(1.0) // Exact matches only

			const fuzzyDiff = `SEARCH
completely different content
REPLACE
replacement`

			const result = await strictStrategy.applyDiff("original content", fuzzyDiff)

			expect(result.success).toBe(false)
		})
	})

	describe("buffer lines functionality", () => {
		it("should include buffer lines in context", async () => {
			const customBufferStrategy = new MultiFileSearchReplaceDiffStrategy(1.0, 10)

			const largeContent = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join("\n")

			const bufferDiff = `SEARCH
line 50
REPLACE
modified line 50`

			const result = await customBufferStrategy.applyDiff(largeContent, bufferDiff)

			expect(result.success).toBe(true)
		})

		it("should handle small buffer values", async () => {
			const smallBufferStrategy = new MultiFileSearchReplaceDiffStrategy(1.0, 1)

			const result = await smallBufferStrategy.applyDiff(
				"old content",
				`SEARCH
old content
REPLACE
new content`,
			)

			expect(result.success).toBe(true)
		})

		it("should handle zero buffer", async () => {
			const zeroBufferStrategy = new MultiFileSearchReplaceDiffStrategy(1.0, 0)

			const result = await zeroBufferStrategy.applyDiff(
				"old content",
				`SEARCH
old content
REPLACE
new content`,
			)

			expect(result.success).toBe(true)
		})
	})

	describe("edge cases", () => {
		it("should handle empty files", async () => {
			const emptyDiff = `SEARCH

REPLACE
new content`

			const result = await strategy.applyDiff("", emptyDiff)

			expect(result.success).toBe(false) // Empty search should fail
		})

		it("should handle very large files", async () => {
			const largeContent = Array.from({ length: 10000 }, (_, i) => `line ${i + 1}`).join("\n")

			const largeDiff = `SEARCH
line 5000
REPLACE
modified line 5000`

			const result = await strategy.applyDiff(largeContent, largeDiff)

			expect(result.success).toBe(true)
		})

		it("should handle files with unusual line endings", async () => {
			const crlfContent = "old content\r\nother line\r\n"

			const result = await strategy.applyDiff(
				crlfContent,
				`SEARCH
old content
REPLACE
new content`,
			)

			expect(result.success).toBe(true)
		})

		it("should handle unicode content", async () => {
			const unicodeContent = "const emoji = '🚀'; const chinese = '你好';"

			const unicodeDiff = `SEARCH
const emoji = '🚀';
REPLACE
const emoji = '⭐';`

			const result = await strategy.applyDiff(unicodeContent, unicodeDiff)

			expect(result.success).toBe(true)
		})

		it("should handle null or undefined inputs gracefully", async () => {
			const result = await strategy.applyDiff("", "")

			expect(result.success).toBe(false)
		})
	})
})
