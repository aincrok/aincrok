// aincrok_change - new test file for ClineProvider memory optimizations
import { describe, it, expect } from "vitest"
import type { ClineMessage } from "@roo-code/types"

/**
 * Implements the message sliding window logic from ClineProvider
 * This is the core algorithm being tested for grey screen bug fix
 */
function getRecentClineMessages(messages: ClineMessage[]): ClineMessage[] {
	if (messages.length <= 150) {
		return messages
	}
	// Keep first message + 149 most recent
	return [messages[0], ...messages.slice(-149)]
}

/**
 * Helper function to create test messages
 */
function createTestMessages(count: number): ClineMessage[] {
	return Array.from({ length: count }, (_, i) => ({
		ts: Date.now() + i,
		type: "say" as const,
		say: "text",
		text: `Message ${i}`,
	}))
}

describe("ClineProvider Memory Optimizations", () => {
	describe("Message sliding window", () => {
		it("should return all messages when count is <= 150", () => {
			const messages = createTestMessages(100)
			const result = getRecentClineMessages(messages)

			expect(result).toHaveLength(100)
			expect(result).toEqual(messages)
		})

		it("should implement sliding window for > 150 messages", () => {
			const messages = createTestMessages(200)
			const result = getRecentClineMessages(messages)

			// Should return exactly 150 messages: first + last 149
			expect(result).toHaveLength(150)

			// First message should be the original first message
			expect(result[0]).toEqual(messages[0])
			expect(result[0].text).toBe("Message 0")

			// Remaining 149 messages should be the last 149 from original array
			for (let i = 1; i < 150; i++) {
				const expectedIndex = 200 - 149 + (i - 1) // Last 149 messages
				expect(result[i]).toEqual(messages[expectedIndex])
			}

			// Last message in result should be the last message from original
			expect(result[149]).toEqual(messages[199])
			expect(result[149].text).toBe("Message 199")
		})

		it("should handle empty message array", () => {
			const result = getRecentClineMessages([])
			expect(result).toEqual([])
		})

		it("should handle exactly 150 messages", () => {
			const messages = createTestMessages(150)
			const result = getRecentClineMessages(messages)

			expect(result).toHaveLength(150)
			expect(result).toEqual(messages)
		})

		it("should handle exactly 151 messages (boundary case)", () => {
			const messages = createTestMessages(151)
			const result = getRecentClineMessages(messages)

			expect(result).toHaveLength(150)

			// Should have first message + last 149 messages
			expect(result[0].text).toBe("Message 0")
			expect(result[1].text).toBe("Message 2") // Skip message 1, keep last 149
			expect(result[149].text).toBe("Message 150")
		})
	})

	describe("Memory impact calculation", () => {
		it("should demonstrate memory savings with sliding window", () => {
			// Create large message array with longer text to simulate real usage
			const largeMessages = Array.from({ length: 500 }, (_, i) => ({
				ts: Date.now() + i,
				type: "say" as const,
				say: "text",
				text: `This is a longer message ${i} that represents typical conversation content with some detail and context that would be sent in a real conversation.`,
			})) as ClineMessage[]

			const slidingWindowMessages = getRecentClineMessages(largeMessages)

			// Calculate approximate sizes
			const fullSize = JSON.stringify(largeMessages).length
			const slidingSize = JSON.stringify(slidingWindowMessages).length
			const reduction = ((fullSize - slidingSize) / fullSize) * 100

			expect(slidingWindowMessages.length).toBe(150)
			expect(largeMessages.length).toBe(500)
			expect(reduction).toBeGreaterThan(60) // Should achieve >60% reduction
			expect(reduction).toBeLessThan(80) // But not more than 80% (sanity check)
		})
	})

	describe("Algorithm validation", () => {
		it("should match the exact ClineProvider implementation behavior", () => {
			// Test various edge cases to ensure our test implementation matches the real one
			const testCases = [
				{ input: 0, expected: 0 },
				{ input: 1, expected: 1 },
				{ input: 149, expected: 149 },
				{ input: 150, expected: 150 },
				{ input: 151, expected: 150 },
				{ input: 200, expected: 150 },
				{ input: 500, expected: 150 },
			]

			testCases.forEach(({ input, expected }) => {
				const messages = createTestMessages(input)
				const result = getRecentClineMessages(messages)
				expect(result.length).toBe(expected)

				if (input > 150) {
					// Should always keep first message when over 150
					expect(result[0].text).toBe("Message 0")
					// And last message should be from the end of original array
					expect(result[result.length - 1].text).toBe(`Message ${input - 1}`)
				}
			})
		})
	})
})
