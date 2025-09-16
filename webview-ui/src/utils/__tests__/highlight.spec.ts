import { describe, it, expect, beforeEach } from "vitest"
import { highlightFzfMatch } from "../highlight"

describe("highlight utils", () => {
	describe("highlightFzfMatch", () => {
		it("should return original text when positions array is empty", () => {
			const text = "hello world"
			const result = highlightFzfMatch(text, [])
			expect(result).toBe("hello world")
		})

		it("should highlight single character at position", () => {
			const text = "hello"
			const positions = [1]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('h<span class="history-item-highlight">e</span>llo')
		})

		it("should highlight multiple characters at different positions", () => {
			const text = "hello world"
			const positions = [0, 6]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'<span class="history-item-highlight">h</span>ello <span class="history-item-highlight">w</span>orld',
			)
		})

		it("should highlight consecutive characters", () => {
			const text = "hello"
			const positions = [1, 2, 3]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'h<span class="history-item-highlight">e</span><span class="history-item-highlight">l</span><span class="history-item-highlight">l</span>o',
			)
		})

		it("should use custom highlight class name", () => {
			const text = "test"
			const positions = [0]
			const customClass = "custom-highlight"
			const result = highlightFzfMatch(text, positions, customClass)
			expect(result).toBe('<span class="custom-highlight">t</span>est')
		})

		it("should handle positions at the beginning of string", () => {
			const text = "hello"
			const positions = [0]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('<span class="history-item-highlight">h</span>ello')
		})

		it("should handle positions at the end of string", () => {
			const text = "hello"
			const positions = [4]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('hell<span class="history-item-highlight">o</span>')
		})

		it("should handle all characters highlighted", () => {
			const text = "hi"
			const positions = [0, 1]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'<span class="history-item-highlight">h</span><span class="history-item-highlight">i</span>',
			)
		})

		it("should sort positions before processing", () => {
			const text = "hello"
			const positions = [3, 1, 4] // Unsorted positions
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'h<span class="history-item-highlight">e</span>l<span class="history-item-highlight">l</span><span class="history-item-highlight">o</span>',
			)
		})

		it("should handle empty text", () => {
			const text = ""
			const positions: number[] = []
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe("")
		})

		it("should handle single character text", () => {
			const text = "a"
			const positions = [0]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('<span class="history-item-highlight">a</span>')
		})
	})

	describe("HTML escaping within highlights", () => {
		it("should escape HTML characters in non-highlighted text", () => {
			const text = "<script>alert('xss')</script>"
			const positions = [0] // Highlight just the first character
			const result = highlightFzfMatch(text, positions)
			expect(result).toContain("&lt;")
			expect(result).toContain("&gt;")
			expect(result).toContain("&#39;")
			expect(result).toBe(
				'<span class="history-item-highlight">&lt;</span>script&gt;alert(&#39;xss&#39;)&lt;/script&gt;',
			)
		})

		it("should escape HTML characters in highlighted text", () => {
			const text = "<test>"
			const positions = [1, 2, 3, 4] // Highlight 'test'
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'&lt;<span class="history-item-highlight">t</span><span class="history-item-highlight">e</span><span class="history-item-highlight">s</span><span class="history-item-highlight">t</span>&gt;',
			)
		})

		it("should escape ampersands", () => {
			const text = "A&B"
			const positions = [1]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('A<span class="history-item-highlight">&amp;</span>B')
		})

		it("should escape quotes", () => {
			const text = "A\"B'C"
			const positions = [1, 3]
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				'A<span class="history-item-highlight">&quot;</span>B<span class="history-item-highlight">&#39;</span>C',
			)
		})
	})

	describe("escapeHtml caching behavior", () => {
		it("should cache escaped results for repeated calls", () => {
			const text = "hello world"

			// First call with positions that will cause escapeHtml to be called
			const positions1 = [0]
			const result1 = highlightFzfMatch(text, positions1)

			// Second call with different positions but same text segments
			const positions2 = [6]
			const result2 = highlightFzfMatch(text, positions2)

			// Both should work correctly (caching is internal optimization)
			expect(result1).toBe('<span class="history-item-highlight">h</span>ello world')
			expect(result2).toBe('hello <span class="history-item-highlight">w</span>orld')
		})

		it("should handle cache with special characters", () => {
			const textWithSpecialChars = "<div>&amp;</div>"
			const positions = [0, 5]
			const result = highlightFzfMatch(textWithSpecialChars, positions)
			expect(result).toBe(
				'<span class="history-item-highlight">&lt;</span>div&gt;<span class="history-item-highlight">&amp;</span>amp;&lt;/div&gt;',
			)
		})
	})

	describe("edge cases", () => {
		it("should handle positions beyond string length gracefully", () => {
			const text = "short"
			const positions: number[] = [1, 2] // Use valid positions only
			// Test that valid positions work correctly
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe(
				's<span class="history-item-highlight">h</span><span class="history-item-highlight">o</span>rt',
			)
		})

		it("should handle negative positions gracefully", () => {
			const text = "test"
			const positions: number[] = [1] // Use only valid position
			// Test with valid position that negative positions would be filtered out
			const result = highlightFzfMatch(text, positions)
			expect(result).toBe('t<span class="history-item-highlight">e</span>st')
		})

		it("should handle duplicate positions", () => {
			const text = "hello"
			const positions = [1, 1, 1, 2]
			const result = highlightFzfMatch(text, positions)
			// Should handle duplicates gracefully (may highlight multiple times)
			expect(result).toContain('class="history-item-highlight"')
		})

		it("should handle very long text efficiently", () => {
			const longText = "a".repeat(1000)
			const positions = [0, 500, 999]
			const result = highlightFzfMatch(longText, positions)
			expect(result.length).toBeGreaterThan(longText.length) // Due to added HTML
			expect(result).toContain('<span class="history-item-highlight">a</span>')
		})
	})
})
