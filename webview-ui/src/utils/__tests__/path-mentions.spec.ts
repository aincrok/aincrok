import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { escapeSpaces, convertToMentionPath } from "../path-mentions"

describe("path-mentions utils", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
	})

	afterEach(() => {
		consoleErrorSpy.mockRestore()
	})

	describe("escapeSpaces", () => {
		it("should return path unchanged when no spaces", () => {
			const path = "/home/user/documents/file.txt"
			const result = escapeSpaces(path)
			expect(result).toBe("/home/user/documents/file.txt")
		})

		it("should escape single space", () => {
			const path = "my file.txt"
			const result = escapeSpaces(path)
			expect(result).toBe("my\\ file.txt")
		})

		it("should escape multiple spaces", () => {
			const path = "my file with spaces.txt"
			const result = escapeSpaces(path)
			expect(result).toBe("my\\ file\\ with\\ spaces.txt")
		})

		it("should escape consecutive spaces", () => {
			const path = "file  with  double  spaces.txt"
			const result = escapeSpaces(path)
			expect(result).toBe("file\\ \\ with\\ \\ double\\ \\ spaces.txt")
		})

		it("should handle empty string", () => {
			const path = ""
			const result = escapeSpaces(path)
			expect(result).toBe("")
		})

		it("should handle path with only spaces", () => {
			const path = "   "
			const result = escapeSpaces(path)
			expect(result).toBe("\\ \\ \\ ")
		})

		it("should handle spaces at beginning and end", () => {
			const path = " file.txt "
			const result = escapeSpaces(path)
			expect(result).toBe("\\ file.txt\\ ")
		})
	})

	describe("convertToMentionPath", () => {
		describe("without cwd parameter", () => {
			it("should return path unchanged when no cwd provided", () => {
				const path = "/home/user/documents/file.txt"
				const result = convertToMentionPath(path)
				expect(result).toBe(path)
			})

			it("should return path unchanged when empty cwd provided", () => {
				const path = "/home/user/documents/file.txt"
				const result = convertToMentionPath(path, "")
				expect(result).toBe(path)
			})
		})

		describe("file:// protocol handling", () => {
			it("should strip file:// protocol", () => {
				const path = "file:///home/user/file.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/file.txt")
			})

			it("should handle file:// with spaces", () => {
				const path = "file:///home/user/my%20file.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/my\\ file.txt")
			})

			it("should handle Windows paths with file:// protocol", () => {
				const path = "file:///C:/Users/John/Documents/file.txt"
				const cwd = "C:/Users/John"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/Documents/file.txt")
			})
		})

		describe("vscode-remote:// protocol handling", () => {
			it("should strip vscode-remote:// protocol", () => {
				const path = "vscode-remote://ssh-remote+hostname/home/user/file.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("home/user/file.txt") // Returns the path without protocol, not relative
			})

			it("should handle vscode-remote:// without path after hostname", () => {
				const path = "vscode-remote://ssh-remote+hostname"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("")
			})

			it("should handle vscode-remote:// with empty path", () => {
				const path = "vscode-remote://ssh-remote+hostname/"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("")
			})
		})

		describe("Windows path handling", () => {
			it("should fix Windows paths with leading slash", () => {
				const path = "/C:/Users/John/Documents/file.txt"
				const cwd = "C:/Users/John"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/Documents/file.txt")
			})

			it("should handle Windows paths with backslashes", () => {
				const path = "C:\\Users\\John\\Documents\\file.txt"
				const cwd = "C:\\Users\\John"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/Documents/file.txt")
			})

			it("should normalize mixed path separators", () => {
				const path = "C:/Users\\John/Documents\\file.txt"
				const cwd = "C:\\Users/John"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/Documents/file.txt")
			})
		})

		describe("relative path conversion", () => {
			it("should convert path within cwd to relative mention", () => {
				const path = "/home/user/projects/myapp/src/file.js"
				const cwd = "/home/user/projects/myapp"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/src/file.js")
			})

			it("should handle exact cwd match", () => {
				const path = "/home/user/projects/myapp"
				const cwd = "/home/user/projects/myapp"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/")
			})

			it("should handle cwd with trailing slash", () => {
				const path = "/home/user/projects/myapp/src/file.js"
				const cwd = "/home/user/projects/myapp/"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/src/file.js")
			})

			it("should handle case-insensitive path matching", () => {
				const path = "/HOME/USER/Projects/myapp/src/file.js"
				const cwd = "/home/user/projects/myapp"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/src/file.js")
			})

			it("should escape spaces in relative paths", () => {
				const path = "/home/user/my project/src/my file.js"
				const cwd = "/home/user/my project"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/src/my\\ file.js")
			})

			it("should return absolute path when not within cwd", () => {
				const path = "/different/path/file.txt"
				const cwd = "/home/user/projects"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("/different/path/file.txt")
			})

			it("should handle partial path matches (should not match)", () => {
				const path = "/home/user/projects-backup/file.txt"
				const cwd = "/home/user/projects"
				const result = convertToMentionPath(path, cwd)
				// The function uses case-insensitive startsWith, so this will match
				expect(result).toBe("@/-backup/file.txt")
			})
		})

		describe("URL decoding", () => {
			it("should decode URL-encoded characters", () => {
				const path = "/home/user/file%20with%20spaces.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/file\\ with\\ spaces.txt")
			})

			it("should handle special characters", () => {
				const path = "/home/user/file%21%40%23.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/file!@#.txt")
			})

			it("should handle malformed URL encoding gracefully", () => {
				const path = "/home/user/file%ZZ.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)

				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Error decoding URI component in convertToMentionPath:",
					expect.any(URIError),
					"/home/user/file%ZZ.txt",
				)
				expect(result).toBe("@/file%ZZ.txt")
			})

			it("should handle incomplete percent encoding", () => {
				const path = "/home/user/file%2.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)

				expect(consoleErrorSpy).toHaveBeenCalled()
				expect(result).toBe("@/file%2.txt")
			})
		})

		describe("edge cases", () => {
			it("should handle empty path", () => {
				const path = ""
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("")
			})

			it("should handle root path", () => {
				const path = "/"
				const cwd = "/"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/")
			})

			it("should handle path without leading slash", () => {
				const path = "relative/path/file.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("relative/path/file.txt")
			})

			it("should handle very long paths", () => {
				const longPath = "/home/user/" + "very/".repeat(50) + "long/path.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(longPath, cwd)
				expect(result.startsWith("@/")).toBe(true)
				expect(result.includes("very/")).toBe(true)
			})

			it("should handle paths with Unicode characters", () => {
				const path = "/home/user/文档/файл.txt"
				const cwd = "/home/user"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/文档/файл.txt")
			})

			it("should handle cwd longer than path", () => {
				const path = "/home/user"
				const cwd = "/home/user/very/deep/directory"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("/home/user")
			})
		})

		describe("complex scenarios", () => {
			it("should handle file:// protocol with URL encoding and Windows paths", () => {
				const path = "file:///C:/Users/John%20Doe/My%20Documents/file.txt"
				const cwd = "C:/Users/John Doe"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/My\\ Documents/file.txt")
			})

			it("should handle vscode-remote with URL encoding", () => {
				const path = "vscode-remote://ssh-remote+server/home/user/my%20project/file.js"
				const cwd = "/home/user/my project"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("home/user/my project/file.js") // Returns path without protocol
			})

			it("should handle mixed case with spaces and special characters", () => {
				const path = "/Home/User/My Project (v2)/src/File!.js"
				const cwd = "/home/user/my project (v2)"
				const result = convertToMentionPath(path, cwd)
				expect(result).toBe("@/src/File!.js")
			})
		})
	})
})
