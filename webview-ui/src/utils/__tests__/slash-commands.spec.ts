import { describe, it, expect, vi, beforeEach } from "vitest"
import {
	SlashCommand,
	getSupportedSlashCommands,
	SUPPORTED_SLASH_COMMANDS,
	slashCommandRegex,
	slashCommandRegexGlobal,
	shouldShowSlashCommandsMenu,
	getWorkflowCommands,
	getMatchingSlashCommands,
	insertSlashCommand,
	validateSlashCommand,
} from "../slash-commands"

// Mock the dependencies
vi.mock("@roo/modes", () => ({
	getAllModes: vi.fn((customModes?: any[]) => {
		const defaultModes = [
			{ slug: "code", name: "💻 Code" },
			{ slug: "architect", name: "🏗️ Architect" },
			{ slug: "ask", name: "❓ Ask" },
		]
		return customModes ? [...defaultModes, ...customModes] : defaultModes
	}),
}))

vi.mock("./aincrok/path-webview", () => ({
	getBasename: vi.fn((path: string) => {
		// Match the actual implementation: return filename with extension
		return path.replace(/^.*[/\\]/, "")
	}),
}))

describe("slash-commands", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("SlashCommand interface", () => {
		it("should have correct structure", () => {
			const command: SlashCommand = {
				name: "test",
				description: "Test command",
				section: "default",
			}
			expect(command).toHaveProperty("name")
			expect(command).toHaveProperty("description")
			expect(command).toHaveProperty("section")
		})
	})

	describe("getSupportedSlashCommands", () => {
		it("should return base commands with default modes", () => {
			const commands = getSupportedSlashCommands()

			// Check base commands
			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "newtask" }),
					expect.objectContaining({ name: "newrule" }),
					expect.objectContaining({ name: "reportbug" }),
					expect.objectContaining({ name: "smol" }),
				]),
			)

			// Check mode commands
			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "code", description: "Switch to Code mode" }),
					expect.objectContaining({ name: "architect", description: "Switch to Architect mode" }),
					expect.objectContaining({ name: "ask", description: "Switch to Ask mode" }),
				]),
			)
		})

		it("should include custom modes when provided", () => {
			const customModes = [
				{ slug: "custom1", name: "🔧 Custom Mode 1" },
				{ slug: "custom2", name: "Custom Mode 2" },
			]

			const commands = getSupportedSlashCommands(customModes)

			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "custom1", description: "Switch to 🔧 Custom Mode 1 mode" }),
					expect.objectContaining({ name: "custom2", description: "Switch to Custom Mode 2 mode" }),
				]),
			)
		})

		it("should include workflow commands when provided", () => {
			const localWorkflowToggles = {
				"local/workflow1.ts": true,
				"local/workflow2.ts": false,
			}
			const globalWorkflowToggles = {
				"global/workflow3.ts": true,
			}

			const commands = getSupportedSlashCommands(undefined, localWorkflowToggles, globalWorkflowToggles)

			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "workflow1.ts", section: "custom" }),
					expect.objectContaining({ name: "workflow3.ts", section: "custom" }),
				]),
			)

			// Should not include disabled workflows
			expect(commands).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: "workflow2.ts" })]))
		})

		it("should handle empty workflow toggles", () => {
			const commands = getSupportedSlashCommands(undefined, {}, {})

			// Should still contain base commands and modes
			expect(commands.length).toBeGreaterThan(0)
			expect(commands).toEqual(expect.arrayContaining([expect.objectContaining({ name: "newtask" })]))
		})
	})

	describe("SUPPORTED_SLASH_COMMANDS", () => {
		it("should be a default instance with base commands", () => {
			expect(SUPPORTED_SLASH_COMMANDS).toBeDefined()
			expect(Array.isArray(SUPPORTED_SLASH_COMMANDS)).toBe(true)
			expect(SUPPORTED_SLASH_COMMANDS.length).toBeGreaterThan(0)
		})
	})

	describe("slash command regex", () => {
		it("should match valid slash commands", () => {
			expect("/code").toMatch(slashCommandRegex)
			expect("/newtask").toMatch(slashCommandRegex)
			expect("/custom_command").toMatch(slashCommandRegex)
			expect("/test-command").toMatch(slashCommandRegex)
			expect("/command.name").toMatch(slashCommandRegex)
		})

		it("should match slash commands with spaces", () => {
			const match = "/code ".match(slashCommandRegex)
			expect(match).toBeTruthy()
			expect(match?.[1]).toBe("code")
		})

		it("should match slash commands at end of string", () => {
			const match = "/newtask".match(slashCommandRegex)
			expect(match).toBeTruthy()
			expect(match?.[1]).toBe("newtask")
		})

		it("should work with global regex", () => {
			const text = "/code /architect /ask"
			const matches = text.match(slashCommandRegexGlobal)
			expect(matches).toHaveLength(3)
			expect(matches).toEqual(["/code ", "/architect ", "/ask"])
		})
	})

	describe("shouldShowSlashCommandsMenu", () => {
		it("should return true for slash at beginning", () => {
			expect(shouldShowSlashCommandsMenu("/", 1)).toBe(true)
			expect(shouldShowSlashCommandsMenu("/code", 5)).toBe(true)
			expect(shouldShowSlashCommandsMenu("/ne", 3)).toBe(true)
		})

		it("should return true for slash after whitespace", () => {
			expect(shouldShowSlashCommandsMenu("  /", 3)).toBe(true)
			expect(shouldShowSlashCommandsMenu("\t/code", 6)).toBe(true)
			expect(shouldShowSlashCommandsMenu("\n /test", 7)).toBe(true)
		})

		it("should return false when no slash before cursor", () => {
			expect(shouldShowSlashCommandsMenu("hello", 5)).toBe(false)
			expect(shouldShowSlashCommandsMenu("test code", 9)).toBe(false)
		})

		it("should return false when slash is not at beginning or after whitespace", () => {
			expect(shouldShowSlashCommandsMenu("text/command", 12)).toBe(false)
			expect(shouldShowSlashCommandsMenu("hello/world", 11)).toBe(false)
		})

		it("should return false when there's whitespace after slash but before cursor", () => {
			expect(shouldShowSlashCommandsMenu("/ ", 2)).toBe(false)
			expect(shouldShowSlashCommandsMenu("/code ", 6)).toBe(false)
			expect(shouldShowSlashCommandsMenu("/test arg", 9)).toBe(false)
		})

		it("should handle cursor position correctly", () => {
			const text = "/code something"
			expect(shouldShowSlashCommandsMenu(text, 5)).toBe(true) // at end of "code"
			expect(shouldShowSlashCommandsMenu(text, 6)).toBe(false) // at space after "code"
		})
	})

	describe("getWorkflowCommands", () => {
		it("should return empty array for empty toggles", () => {
			const commands = getWorkflowCommands({}, {})
			expect(commands).toEqual([])
		})

		it("should return enabled workflow commands", () => {
			const localToggles = { "path/to/workflow1.ts": true, "disabled.ts": false }
			const globalToggles = { "global/workflow2.ts": true }

			const commands = getWorkflowCommands(localToggles, globalToggles)

			expect(commands).toHaveLength(2)
			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "workflow1.ts", section: "custom" }),
					expect.objectContaining({ name: "workflow2.ts", section: "custom" }),
				]),
			)
		})

		it("should handle undefined toggles", () => {
			const commands = getWorkflowCommands()
			expect(commands).toEqual([])
		})
	})

	describe("getMatchingSlashCommands", () => {
		it("should return all commands when query is empty", () => {
			const commands = getMatchingSlashCommands("")
			expect(commands.length).toBeGreaterThan(0)
			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "newtask" }),
					expect.objectContaining({ name: "code" }),
				]),
			)
		})

		it("should filter commands by query prefix", () => {
			const commands = getMatchingSlashCommands("ne")
			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "newtask" }),
					expect.objectContaining({ name: "newrule" }),
				]),
			)
		})

		it("should return exact matches", () => {
			const commands = getMatchingSlashCommands("code")
			expect(commands).toHaveLength(1)
			expect(commands[0]).toEqual(expect.objectContaining({ name: "code" }))
		})

		it("should return empty array for no matches", () => {
			const commands = getMatchingSlashCommands("xyz123")
			expect(commands).toEqual([])
		})

		it("should be case sensitive", () => {
			const commands = getMatchingSlashCommands("Code")
			expect(commands).toEqual([])
		})

		it("should work with custom modes", () => {
			const customModes = [{ slug: "custom", name: "Custom Mode" }]
			const commands = getMatchingSlashCommands("cust", customModes)
			expect(commands).toEqual(expect.arrayContaining([expect.objectContaining({ name: "custom" })]))
		})

		it("should work with workflow commands", () => {
			const workflowToggles = { "test-workflow.ts": true }
			const commands = getMatchingSlashCommands("test", undefined, workflowToggles)
			expect(commands).toEqual(expect.arrayContaining([expect.objectContaining({ name: "test-workflow.ts" })]))
		})
	})

	describe("insertSlashCommand", () => {
		it("should replace partial command with full command", () => {
			const result = insertSlashCommand("/cod", "code")
			expect(result.newValue).toBe("/code ")
			expect(result.commandIndex).toBe(0)
		})

		it("should replace command in middle of text", () => {
			const result = insertSlashCommand("Hello /cod world", "code")
			expect(result.newValue).toBe("Hello /code world")
			expect(result.commandIndex).toBe(6)
		})

		it("should add space at end if only slash command", () => {
			const result = insertSlashCommand("/newtask", "newtask")
			expect(result.newValue).toBe("/newtask ")
			expect(result.commandIndex).toBe(0)
		})

		it("should preserve text after existing space", () => {
			const result = insertSlashCommand("/cod some args", "code")
			expect(result.newValue).toBe("/code some args")
			expect(result.commandIndex).toBe(0)
		})

		it("should handle command at beginning of text", () => {
			const result = insertSlashCommand("/", "newtask")
			expect(result.newValue).toBe("/newtask ")
			expect(result.commandIndex).toBe(0)
		})
	})

	describe("validateSlashCommand", () => {
		it("should return null for empty command", () => {
			expect(validateSlashCommand("")).toBeNull()
		})

		it("should return 'full' for exact match", () => {
			expect(validateSlashCommand("code")).toBe("full")
			expect(validateSlashCommand("newtask")).toBe("full")
			expect(validateSlashCommand("newrule")).toBe("full")
		})

		it("should return 'partial' for partial match", () => {
			expect(validateSlashCommand("cod")).toBe("partial")
			expect(validateSlashCommand("ne")).toBe("partial")
			expect(validateSlashCommand("arch")).toBe("partial")
		})

		it("should return null for no match", () => {
			expect(validateSlashCommand("xyz")).toBeNull()
			expect(validateSlashCommand("invalid")).toBeNull()
		})

		it("should be case sensitive", () => {
			expect(validateSlashCommand("Code")).toBeNull()
			expect(validateSlashCommand("NEWTASK")).toBeNull()
		})

		it("should work with custom modes", () => {
			const customModes = [{ slug: "custom", name: "Custom Mode" }]
			expect(validateSlashCommand("custom", customModes)).toBe("full")
			expect(validateSlashCommand("cust", customModes)).toBe("partial")
		})

		it("should work with workflow commands", () => {
			const workflowToggles = { "test-workflow.ts": true }
			expect(validateSlashCommand("test-workflow.ts", undefined, workflowToggles)).toBe("full")
			expect(validateSlashCommand("test", undefined, workflowToggles)).toBe("partial")
		})

		it("should handle multiple partial matches", () => {
			// "ne" matches both "newtask" and "newrule"
			expect(validateSlashCommand("ne")).toBe("partial")
		})
	})

	describe("edge cases and error handling", () => {
		it("should handle malformed workflow toggles", () => {
			const commands = getWorkflowCommands({ "": true, undefined: true } as any)
			expect(Array.isArray(commands)).toBe(true)
		})

		it("should handle special characters in workflow names", () => {
			const workflowToggles = { "special-file_name.test.ts": true }
			const commands = getWorkflowCommands(workflowToggles)
			expect(commands[0].name).toBe("special-file_name.test.ts")
		})

		it("should handle very long command names", () => {
			const longCommand = "a".repeat(1000)
			expect(validateSlashCommand(longCommand)).toBeNull()
		})

		it("should handle special cursor positions", () => {
			expect(shouldShowSlashCommandsMenu("/code", 0)).toBe(false) // cursor before slash
			expect(shouldShowSlashCommandsMenu("/code", 1)).toBe(true) // cursor after slash
		})

		it("should handle insertSlashCommand with no slash", () => {
			const result = insertSlashCommand("hello world", "code")
			// When no slash is found, indexOf returns -1
			// text.substring(0, -1 + 1) = text.substring(0, 0) = ""
			// commandEndIndex = text.indexOf(" ", -1) finds first space at index 5
			// result: "" + "code" + " world" = "code world"
			expect(result.newValue).toBe("code world")
			expect(result.commandIndex).toBe(-1)
		})
	})

	describe("integration scenarios", () => {
		it("should handle complete workflow from typing to validation", () => {
			const text = "/cod"
			const cursorPosition = 4

			// Should show menu
			expect(shouldShowSlashCommandsMenu(text, cursorPosition)).toBe(true)

			// Should find matching commands
			const matches = getMatchingSlashCommands("cod")
			expect(matches).toEqual(expect.arrayContaining([expect.objectContaining({ name: "code" })]))

			// Should validate as partial
			expect(validateSlashCommand("cod")).toBe("partial")

			// Should insert full command
			const result = insertSlashCommand(text, "code")
			expect(result.newValue).toBe("/code ")
		})

		it("should handle workflow with custom modes and workflows", () => {
			const customModes = [{ slug: "debug", name: "🪲 Debug Mode" }]
			const workflowToggles = { "debug-helper.ts": true }

			const commands = getSupportedSlashCommands(customModes, workflowToggles)

			expect(commands).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "debug", description: "Switch to Debug Mode mode" }),
					expect.objectContaining({ name: "debug-helper.ts", section: "custom" }),
				]),
			)

			// Both should be valid
			expect(validateSlashCommand("debug", customModes, workflowToggles)).toBe("full")
			expect(validateSlashCommand("debug-helper.ts", customModes, workflowToggles)).toBe("full")

			// Partial matching
			expect(validateSlashCommand("deb", customModes, workflowToggles)).toBe("partial")
		})
	})
})
