import { describe, it, expect } from "vitest"
import { findMatchingTemplate, findMatchingResourceOrTemplate } from "../mcp"

// Mock types for testing
type MockMcpResource = {
	uri: string
	name: string
	mimeType?: string
	description?: string
}

type MockMcpResourceTemplate = {
	uriTemplate: string
	name: string
	description?: string
	mimeType?: string
}

describe("mcp utils", () => {
	describe("findMatchingTemplate", () => {
		it("should return undefined for empty templates array", () => {
			const uri = "file:///test/path.txt"
			const result = findMatchingTemplate(uri, [])
			expect(result).toBeUndefined()
		})

		it("should return undefined when no templates match", () => {
			const uri = "file:///test/path.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///other/{file}",
					name: "Other Template",
				},
				{
					uriTemplate: "http://example.com/{id}",
					name: "HTTP Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toBeUndefined()
		})

		it("should match exact URI without parameters", () => {
			const uri = "file:///test/path.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/path.txt",
					name: "Exact Match",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should match URI with single parameter", () => {
			const uri = "file:///test/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Single Parameter",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should match URI with multiple parameters", () => {
			const uri = "file:///projects/myproject/src/file.ts"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///projects/{project}/src/{file}",
					name: "Multiple Parameters",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should match first matching template when multiple matches exist", () => {
			const uri = "file:///test/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "First Match",
				},
				{
					uriTemplate: "file:///{folder}/{filename}",
					name: "Second Match",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle special regex characters in template", () => {
			const uri = "file:///test[1].txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test[1].txt",
					name: "Special Characters",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle complex URI patterns", () => {
			const uri = "https://api.example.com/v1/users/123/posts/456"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "https://api.example.com/v1/users/{userId}/posts/{postId}",
					name: "API Pattern",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should not match when parameter contains slash", () => {
			const uri = "file:///test/nested/path/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Should Not Match",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toBeUndefined()
		})

		it("should handle empty URI", () => {
			const uri = ""
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "",
					name: "Empty Template",
				},
				{
					uriTemplate: "file:///{file}",
					name: "Non-Empty Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle template with no parameters", () => {
			const uri = "file:///static/resource.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///static/resource.txt",
					name: "Static Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle template with parameter at the beginning", () => {
			const uri = "myscheme://test/path"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "{scheme}://test/path",
					name: "Parameter at Start",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle template with parameter at the end", () => {
			const uri = "file:///test/document"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Parameter at End",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle template with adjacent parameters", () => {
			const uri = "custom://userpassword/resource"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "custom://{user}{password}/resource",
					name: "Adjacent Parameters",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})
	})

	describe("findMatchingResourceOrTemplate", () => {
		it("should return undefined when no resources or templates provided", () => {
			const uri = "file:///test/path.txt"
			const result = findMatchingResourceOrTemplate(uri, [], [])
			expect(result).toBeUndefined()
		})

		it("should find exact resource match", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/document.txt",
					name: "Test Document",
					mimeType: "text/plain",
				},
				{
					uri: "file:///test/other.txt",
					name: "Other Document",
				},
			]
			const templates: MockMcpResourceTemplate[] = []

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toEqual(resources[0])
		})

		it("should prefer exact resource match over template match", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/document.txt",
					name: "Exact Resource",
				},
			]
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Template Match",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toEqual(resources[0])
		})

		it("should fall back to template match when no exact resource match", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/other.txt",
					name: "Different Resource",
				},
			]
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Template Match",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toEqual(templates[0])
		})

		it("should return undefined when no matches found", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///other/document.txt",
					name: "Different Path",
				},
			]
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "http://example.com/{file}",
					name: "Different Scheme",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toBeUndefined()
		})

		it("should handle multiple exact matches and return first", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/document.txt",
					name: "First Match",
				},
				{
					uri: "file:///test/document.txt",
					name: "Second Match",
				},
			]
			const templates: MockMcpResourceTemplate[] = []

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toEqual(resources[0])
		})

		it("should work with only resources array", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/document.txt",
					name: "Found Resource",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, resources)
			expect(result).toEqual(resources[0])
		})

		it("should work with only templates array", () => {
			const uri = "file:///test/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Found Template",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, [], templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle empty URI", () => {
			const uri = ""
			const resources: MockMcpResource[] = [
				{
					uri: "",
					name: "Empty Resource",
				},
			]
			const templates: MockMcpResourceTemplate[] = []

			const result = findMatchingResourceOrTemplate(uri, resources, templates)
			expect(result).toEqual(resources[0])
		})

		it("should handle resource with all optional properties", () => {
			const uri = "file:///test/document.txt"
			const resources: MockMcpResource[] = [
				{
					uri: "file:///test/document.txt",
					name: "Full Resource",
					mimeType: "text/plain",
					description: "A test document",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, resources, [])
			expect(result).toEqual(resources[0])
		})

		it("should handle template with all optional properties", () => {
			const uri = "file:///test/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{filename}",
					name: "Full Template",
					description: "Template for test files",
					mimeType: "text/plain",
				},
			]

			const result = findMatchingResourceOrTemplate(uri, [], templates)
			expect(result).toEqual(templates[0])
		})
	})

	describe("edge cases", () => {
		it("should handle malformed URI gracefully", () => {
			const uri = "not-a-valid-uri"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///{file}",
					name: "Valid Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toBeUndefined()
		})

		it("should handle template with malformed parameter syntax", () => {
			const uri = "file:///test/document.txt"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "file:///test/{unclosed",
					name: "Malformed Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toBeUndefined()
		})

		it("should handle very long URIs", () => {
			const longPath = "very/".repeat(100) + "long/path.txt"
			const uri = `file:///${longPath}`
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: `file:///${longPath}`,
					name: "Long Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0])
		})

		it("should handle URI with query parameters", () => {
			const uri = "https://example.com/api/users/123?include=profile&sort=name"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "https://example.com/api/users/{id}",
					name: "Query Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			// The regex ([^/]+) matches everything including query params, so it should match
			expect(result).toEqual(templates[0])
		})

		it("should handle URI with fragment", () => {
			const uri = "https://example.com/page#section"
			const templates: MockMcpResourceTemplate[] = [
				{
					uriTemplate: "https://example.com/page#section",
					name: "Fragment Template",
				},
			]
			const result = findMatchingTemplate(uri, templates)
			expect(result).toEqual(templates[0]) // Should match exact fragment
		})
	})
})
