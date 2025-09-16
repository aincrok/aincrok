import { describe, it, expect } from "vitest"
import { prettyModelName } from "../prettyModelName"

describe("prettyModelName utils", () => {
	describe("prettyModelName", () => {
		it("should return empty string for empty input", () => {
			const result = prettyModelName("")
			expect(result).toBe("")
		})

		it("should return empty string for null or undefined input", () => {
			const resultNull = prettyModelName(null as any)
			expect(resultNull).toBe("")

			const resultUndefined = prettyModelName(undefined as any)
			expect(resultUndefined).toBe("")
		})

		it("should format simple model name without project or tag", () => {
			const result = prettyModelName("claude-3-opus")
			expect(result).toBe("Claude 3 Opus ")
		})

		it("should format model name with project", () => {
			const result = prettyModelName("anthropic/claude-3-opus")
			expect(result).toBe("Anthropic / Claude 3 Opus ")
		})

		it("should format model name with tag", () => {
			const result = prettyModelName("claude-3-opus:beta")
			expect(result).toBe("Claude 3 Opus (Beta)")
		})

		it("should format model name with project and tag", () => {
			const result = prettyModelName("anthropic/claude-3-opus:beta")
			expect(result).toBe("Anthropic / Claude 3 Opus (Beta)")
		})

		it("should handle model name with multiple hyphens", () => {
			const result = prettyModelName("gpt-4-turbo-preview")
			expect(result).toBe("Gpt 4 Turbo Preview ")
		})

		it("should handle complex project/model structure", () => {
			const result = prettyModelName("openai/gpt-4-turbo:latest")
			expect(result).toBe("Openai / Gpt 4 Turbo (Latest)")
		})

		it("should capitalize first letter of project name", () => {
			const result = prettyModelName("anthropic/claude-instant")
			expect(result).toBe("Anthropic / Claude Instant ")
		})

		it("should capitalize first letter of each word in model name", () => {
			const result = prettyModelName("meta/llama-2-70b-chat")
			expect(result).toBe("Meta / Llama 2 70b Chat ")
		})

		it("should capitalize first letter of tag", () => {
			const result = prettyModelName("model:experimental")
			expect(result).toBe("Model (Experimental)")
		})

		it("should handle single word model names", () => {
			const result = prettyModelName("claude")
			expect(result).toBe("Claude ")
		})

		it("should handle single word project names", () => {
			const result = prettyModelName("ai/model")
			expect(result).toBe("Ai / Model ")
		})

		it("should handle empty parts gracefully", () => {
			const result = prettyModelName("project/")
			expect(result).toBe("Project ")
		})

		it("should handle model name starting with hyphen", () => {
			const result = prettyModelName("-model-name")
			expect(result).toBe("Model Name ")
		})

		it("should handle model name ending with hyphen", () => {
			const result = prettyModelName("model-name-")
			expect(result).toBe("Model Name ")
		})

		it("should handle consecutive hyphens", () => {
			const result = prettyModelName("model--name--test")
			expect(result).toBe("Model Name Test ")
		})

		it("should handle multiple slashes in project part", () => {
			const result = prettyModelName("org/team/model-name")
			// Only takes first part before first slash as project, rest becomes model name
			expect(result).toBe("Org / Team ")
		})

		it("should handle multiple colons in tag part", () => {
			const result = prettyModelName("model:tag:subtag")
			// Only takes first part after first colon as tag
			expect(result).toBe("Model (Tag)")
		})

		it("should handle special characters in model names", () => {
			const result = prettyModelName("model_with_underscores")
			expect(result).toBe("Model_with_underscores ")
		})

		it("should handle numbers in model names", () => {
			const result = prettyModelName("gpt-4o-mini")
			expect(result).toBe("Gpt 4o Mini ")
		})

		it("should handle mixed case input", () => {
			const result = prettyModelName("OpenAI/GPT-4-Turbo:LATEST")
			expect(result).toBe("OpenAI / GPT 4 Turbo (LATEST)")
		})

		it("should handle very long model names", () => {
			const longName = "very-long-model-name-with-many-parts-separated-by-hyphens"
			const result = prettyModelName(longName)
			expect(result).toBe("Very Long Model Name With Many Parts Separated By Hyphens ")
		})

		it("should handle model names with only project part", () => {
			const result = prettyModelName("anthropic/")
			expect(result).toBe("Anthropic ")
		})

		it("should handle model names with only tag part", () => {
			const result = prettyModelName(":beta")
			expect(result).toBe(" (Beta)")
		})

		it("should handle edge case with just colon", () => {
			const result = prettyModelName(":")
			expect(result).toBe(" ")
		})

		it("should handle edge case with just slash", () => {
			const result = prettyModelName("/")
			expect(result).toBe(" ")
		})

		it("should handle real-world model examples", () => {
			// Anthropic models
			expect(prettyModelName("anthropic/claude-3-opus-20240229")).toBe("Anthropic / Claude 3 Opus 20240229 ")
			expect(prettyModelName("anthropic/claude-3-sonnet:beta")).toBe("Anthropic / Claude 3 Sonnet (Beta)")

			// OpenAI models
			expect(prettyModelName("openai/gpt-4-turbo")).toBe("Openai / Gpt 4 Turbo ")
			expect(prettyModelName("gpt-3.5-turbo")).toBe("Gpt 3.5 Turbo ")

			// Meta models
			expect(prettyModelName("meta/llama-2-70b-chat:latest")).toBe("Meta / Llama 2 70b Chat (Latest)")

			// Google models
			expect(prettyModelName("google/gemini-pro")).toBe("Google / Gemini Pro ")
		})

		it("should handle whitespace in input", () => {
			const result = prettyModelName("  anthropic/claude-3-opus  ")
			// Function doesn't trim input, so whitespace is preserved
			expect(result).toBe("  anthropic / Claude 3 Opus   ")
		})

		it("should preserve original capitalization in complex cases", () => {
			const result = prettyModelName("DeepSeek/DeepSeek-V2.5:API")
			expect(result).toBe("DeepSeek / DeepSeek V2.5 (API)")
		})
	})
})
