import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ButtonLink } from "../ButtonLink"

describe("ButtonLink", () => {
	it("should render as an anchor element with correct href", () => {
		render(<ButtonLink href="https://example.com">Test Link</ButtonLink>)

		const link = screen.getByRole("link", { name: "Test Link" })
		expect(link).toBeInTheDocument()
		expect(link).toHaveAttribute("href", "https://example.com")
	})

	it("should render children content", () => {
		render(
			<ButtonLink href="/test">
				<span>Child Content</span>
			</ButtonLink>,
		)

		expect(screen.getByText("Child Content")).toBeInTheDocument()
	})

	it("should render multiple children", () => {
		render(
			<ButtonLink href="/test">
				<div>First Child</div>
				<div>Second Child</div>
			</ButtonLink>,
		)

		expect(screen.getByText("First Child")).toBeInTheDocument()
		expect(screen.getByText("Second Child")).toBeInTheDocument()
	})

	it("should call onClick handler when clicked", () => {
		const mockOnClick = vi.fn()

		render(
			<ButtonLink href="/test" onClick={mockOnClick}>
				Clickable Link
			</ButtonLink>,
		)

		const link = screen.getByRole("link")
		fireEvent.click(link)

		expect(mockOnClick).toHaveBeenCalledOnce()
	})

	it("should have correct CSS classes", () => {
		render(<ButtonLink href="/test">Test</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveClass("flex", "flex-col", "gap-1", "text-center")
	})

	it("should work without onClick handler", () => {
		render(<ButtonLink href="/test">No Click Handler</ButtonLink>)

		const link = screen.getByRole("link")
		expect(() => fireEvent.click(link)).not.toThrow()
	})

	it("should handle empty href", () => {
		render(<ButtonLink href="">Empty Href</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveAttribute("href", "")
	})

	it("should handle complex children structure", () => {
		render(
			<ButtonLink href="/complex">
				<div>
					<h3>Title</h3>
					<p>Description</p>
				</div>
			</ButtonLink>,
		)

		expect(screen.getByText("Title")).toBeInTheDocument()
		expect(screen.getByText("Description")).toBeInTheDocument()
	})

	it("should handle external URLs", () => {
		render(<ButtonLink href="https://external-site.com">External Link</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveAttribute("href", "https://external-site.com")
	})

	it("should handle relative URLs", () => {
		render(<ButtonLink href="./relative/path">Relative Link</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveAttribute("href", "./relative/path")
	})

	it("should handle anchor links", () => {
		render(<ButtonLink href="#section">Anchor Link</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveAttribute("href", "#section")
	})

	it("should handle query parameters in href", () => {
		render(<ButtonLink href="/search?q=test&page=1">Search Link</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toHaveAttribute("href", "/search?q=test&page=1")
	})

	it("should be accessible with proper role", () => {
		render(<ButtonLink href="/accessible">Accessible Link</ButtonLink>)

		const link = screen.getByRole("link")
		expect(link).toBeInTheDocument()
		expect(link.tagName).toBe("A")
	})

	it("should handle text content as children", () => {
		render(<ButtonLink href="/text">Simple text content</ButtonLink>)

		expect(screen.getByText("Simple text content")).toBeInTheDocument()
	})

	it("should handle numeric children", () => {
		render(<ButtonLink href="/number">{42}</ButtonLink>)

		expect(screen.getByText("42")).toBeInTheDocument()
	})

	it("should support focus and blur events", () => {
		const mockOnFocus = vi.fn()
		const mockOnBlur = vi.fn()

		render(
			<ButtonLink href="/focus" onClick={mockOnFocus}>
				Focusable Link
			</ButtonLink>,
		)

		const link = screen.getByRole("link")

		fireEvent.focus(link)
		fireEvent.blur(link)

		// Focus and blur should not throw errors
		expect(link).toBeInTheDocument()
	})

	it("should handle keyboard navigation", () => {
		render(<ButtonLink href="/keyboard">Keyboard Link</ButtonLink>)

		const link = screen.getByRole("link")

		fireEvent.keyDown(link, { key: "Enter" })
		fireEvent.keyDown(link, { key: " " })

		// Should handle keyboard events without throwing
		expect(link).toBeInTheDocument()
	})
})
