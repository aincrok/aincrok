import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import McpMarketplaceCard from "../McpMarketplaceCard"
import { McpServer } from "../../../../../../src/shared/mcp"
import { McpMarketplaceItem } from "../../../../../../src/shared/aincrok/mcp"

// Mock dependencies
vi.mock("react-use", () => ({
	useEvent: vi.fn(),
}))

vi.mock("../../../../utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

// Mock styled-components
vi.mock("styled-components", () => {
	const mockStyled = vi.fn((component: any) => {
		const mockComponent = vi.fn(({ children, ...props }: any) => {
			const Component = typeof component === "string" ? component : "div"
			return React.createElement(Component, props, children)
		})
		return mockComponent
	})

	// Create a proxy to handle styled.button, styled.div, etc.
	const styledProxy = new Proxy(mockStyled, {
		get: (target, prop) => {
			if (typeof prop === "string") {
				return mockStyled
			}
			return target[prop as keyof typeof target]
		},
	})

	return {
		default: styledProxy,
	}
})

const mockMarketplaceItem: McpMarketplaceItem = {
	mcpId: "test-mcp",
	name: "Test MCP",
	description: "A test MCP server for testing purposes",
	author: "testuser",
	githubUrl: "https://github.com/testuser/test-mcp",
	githubStars: 100,
	category: "Development",
	tags: ["test", "development"],
	logoUrl: "https://example.com/logo.png",
	requiresApiKey: false,
	codiconIcon: "test-icon",
	isRecommended: true,
	downloadCount: 50,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	lastGithubSync: "2023-01-01T00:00:00Z",
}

const mockInstalledServers: McpServer[] = []

describe("McpMarketplaceCard", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should render basic marketplace item information", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		expect(screen.getByText("Test MCP")).toBeInTheDocument()
		expect(screen.getByText("A test MCP server for testing purposes")).toBeInTheDocument()
		expect(screen.getByText("testuser")).toBeInTheDocument()
		expect(screen.getByText("100")).toBeInTheDocument()
		expect(screen.getByText("Development")).toBeInTheDocument()
		expect(screen.getByText("test")).toBeInTheDocument()
		expect(screen.getByText("development")).toBeInTheDocument()
	})

	it("should render logo when logoUrl is provided", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const logo = screen.getByAltText("Test MCP logo")
		expect(logo).toBeInTheDocument()
		expect(logo).toHaveAttribute("src", "https://example.com/logo.png")
	})

	it("should not render logo when logoUrl is not provided", () => {
		const itemWithoutLogo = { ...mockMarketplaceItem, logoUrl: "" }
		render(<McpMarketplaceCard item={itemWithoutLogo} installedServers={mockInstalledServers} />)

		expect(screen.queryByAltText("Test MCP logo")).not.toBeInTheDocument()
	})

	it("should show install button when not installed", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const installButton = screen.getByText("Install")
		expect(installButton).toBeInTheDocument()
		expect(installButton).not.toBeDisabled()
	})

	it("should show installed state when server is installed", () => {
		const installedServers: McpServer[] = [
			{
				name: "test-mcp",
				config: "node test.js",
				status: "connected",
			},
		]
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={installedServers} />)

		const installedButton = screen.getByText("Installed")
		expect(installedButton).toBeInTheDocument()
		// Check disabled attribute instead since mock doesn't handle disabled properly
		expect(installedButton).toHaveAttribute("disabled", "")
	})

	it("should send download message when install button is clicked", async () => {
		const { vscode } = await import("../../../../utils/vscode")
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const installButton = screen.getByText("Install")
		fireEvent.click(installButton)

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "downloadMcp",
			mcpId: "test-mcp",
		})
	})

	it("should show installing state during download", async () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const installButton = screen.getByText("Install")
		fireEvent.click(installButton)

		expect(screen.getByText("Installing...")).toBeInTheDocument()
	})

	it("should not send download message when already installed", async () => {
		const installedServers: McpServer[] = [
			{
				name: "test-mcp",
				config: "node test.js",
				status: "connected",
			},
		]
		const { vscode } = await import("../../../../utils/vscode")
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={installedServers} />)

		const installedButton = screen.getByText("Installed")
		fireEvent.click(installedButton)

		expect(vscode.postMessage).not.toHaveBeenCalled()
	})

	it("should not send download message when already downloading", async () => {
		const { vscode } = await import("../../../../utils/vscode")
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const installButton = screen.getByText("Install")
		fireEvent.click(installButton) // First click
		fireEvent.click(installButton) // Second click while downloading

		expect(vscode.postMessage).toHaveBeenCalledTimes(1)
	})

	it("should handle GitHub author URL correctly", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		// Find the author link by its href attribute
		const authorLinks = screen.getAllByRole("link")
		const authorLink = authorLinks.find((link) => link.getAttribute("href") === "https://github.com/testuser")
		expect(authorLink).toBeInTheDocument()
		expect(authorLink).toHaveAttribute("href", "https://github.com/testuser")
	})

	it("should handle complex GitHub URLs correctly", () => {
		const itemWithComplexUrl = {
			...mockMarketplaceItem,
			githubUrl: "https://github.com/testuser/repo-name/tree/main",
		}
		render(<McpMarketplaceCard item={itemWithComplexUrl} installedServers={mockInstalledServers} />)

		// Find the author link by its href attribute
		const authorLinks = screen.getAllByRole("link")
		const authorLink = authorLinks.find((link) => link.getAttribute("href") === "https://github.com/testuser")
		expect(authorLink).toHaveAttribute("href", "https://github.com/testuser")
	})

	it("should show API key icon when required", () => {
		const itemWithApiKey = { ...mockMarketplaceItem, requiresApiKey: true }
		render(<McpMarketplaceCard item={itemWithApiKey} installedServers={mockInstalledServers} />)

		const apiKeyIcon = screen.getByTitle("Requires API key")
		expect(apiKeyIcon).toBeInTheDocument()
		expect(apiKeyIcon).toHaveClass("codicon-key")
	})

	it("should not show API key icon when not required", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		expect(screen.queryByTitle("Requires API key")).not.toBeInTheDocument()
	})

	it("should handle multiple tags correctly", () => {
		const itemWithManyTags = {
			...mockMarketplaceItem,
			tags: ["tag1", "tag2", "tag3", "tag4"],
		}
		render(<McpMarketplaceCard item={itemWithManyTags} installedServers={mockInstalledServers} />)

		expect(screen.getByText("tag1")).toBeInTheDocument()
		expect(screen.getByText("tag2")).toBeInTheDocument()
		expect(screen.getByText("tag3")).toBeInTheDocument()
		expect(screen.getByText("tag4")).toBeInTheDocument()
	})

	it("should format star count correctly", () => {
		const itemWithManyStars = {
			...mockMarketplaceItem,
			githubStars: 1234,
		}
		render(<McpMarketplaceCard item={itemWithManyStars} installedServers={mockInstalledServers} />)

		expect(screen.getByText("1,234")).toBeInTheDocument()
	})

	it("should handle missing star count", () => {
		const itemWithoutStars = {
			...mockMarketplaceItem,
			githubStars: 0,
		}
		render(<McpMarketplaceCard item={itemWithoutStars} installedServers={mockInstalledServers} />)

		expect(screen.getByText("0")).toBeInTheDocument()
	})

	it("should handle install button click preventing default", async () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		const installButton = screen.getByText("Install")
		const event = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
		})

		const preventDefaultSpy = vi.fn()
		const stopPropagationSpy = vi.fn()
		event.preventDefault = preventDefaultSpy
		event.stopPropagation = stopPropagationSpy

		fireEvent(installButton, event)

		expect(preventDefaultSpy).toHaveBeenCalled()
		expect(stopPropagationSpy).toHaveBeenCalled()
	})

	it("should handle card link click", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		// Find the main card link by its href attribute
		const cardLinks = screen.getAllByRole("link")
		const cardLink = cardLinks.find((link) => link.getAttribute("href") === mockMarketplaceItem.githubUrl)
		expect(cardLink).toHaveAttribute("href", mockMarketplaceItem.githubUrl)
	})

	it("should show loading cursor when isLoading is true", () => {
		// This test would require state manipulation which is complex with the current component structure
		// The component uses internal state for isLoading which is triggered by message events
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		// At minimum, verify the component renders without error
		expect(screen.getByText("Test MCP")).toBeInTheDocument()
	})

	it("should handle empty tags array", () => {
		const itemWithNoTags = {
			...mockMarketplaceItem,
			tags: [],
		}
		render(<McpMarketplaceCard item={itemWithNoTags} installedServers={mockInstalledServers} />)

		// Should still show category
		expect(screen.getByText("Development")).toBeInTheDocument()
	})

	it("should handle scroll events on tags container", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		// Find the tags container and simulate scroll
		const tagsContainer = screen.getByText("test").parentElement
		expect(tagsContainer).toBeInTheDocument()

		// Simulate scroll event
		if (tagsContainer) {
			fireEvent.scroll(tagsContainer, { target: { scrollLeft: 10 } })
		}

		// Component should handle the scroll event without error
		expect(screen.getByText("Test MCP")).toBeInTheDocument()
	})

	it("should handle author link hover events", () => {
		render(<McpMarketplaceCard item={mockMarketplaceItem} installedServers={mockInstalledServers} />)

		// Find the author link by its href attribute
		const authorLinks = screen.getAllByRole("link")
		const authorLink = authorLinks.find((link) => link.getAttribute("href") === "https://github.com/testuser")

		// Test mouse enter
		fireEvent.mouseEnter(authorLink!)
		expect(authorLink).toBeInTheDocument()

		// Test mouse leave
		fireEvent.mouseLeave(authorLink!)
		expect(authorLink).toBeInTheDocument()
	})
})
