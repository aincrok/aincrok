import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ImagePreview from "../ImagePreview"

// Mock the vscode utility
vi.mock("../../../utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

// Mock DOMPurify
vi.mock("dompurify", () => ({
	default: {
		sanitize: vi.fn((input: string) => input),
	},
}))

// Mock McpRichUtil
vi.mock("../McpRichUtil", () => ({
	getSafeHostname: vi.fn((url: string) => {
		try {
			return new URL(url).hostname
		} catch {
			return "unknown-host"
		}
	}),
	formatUrlForOpening: vi.fn((url: string) => url),
	checkIfImageUrl: vi.fn(() => Promise.resolve(true)),
}))

// Mock console methods to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {})

describe("ImagePreview", () => {
	// Mock timers
	beforeEach(() => {
		vi.useFakeTimers()
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.runOnlyPendingTimers()
		vi.useRealTimers()
	})

	it("should render loading state initially", () => {
		render(<ImagePreview url="https://example.com/image.jpg" />)

		expect(screen.getByText(/Loading image from example.com/)).toBeInTheDocument()
		expect(screen.getByText(/Loading image from example.com/).closest(".image-preview-loading")).toBeInTheDocument()
	})

	it("should show loading spinner and animation", () => {
		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		const spinner = container.querySelector(".loading-spinner")
		expect(spinner).toBeInTheDocument()

		// Check for animation styles
		const style = container.querySelector("style")
		expect(style?.textContent).toContain("@keyframes spin")
		expect(style?.textContent).toContain("transform: rotate(360deg)")
	})

	it("should show elapsed time after 3 seconds", () => {
		render(<ImagePreview url="https://example.com/image.jpg" />)

		// Initially no elapsed time shown
		expect(screen.queryByText(/Waiting for/)).not.toBeInTheDocument()

		// Fast-forward 4 seconds
		vi.advanceTimersByTime(4000)

		expect(screen.getByText(/Waiting for 4s/)).toBeInTheDocument()
	})

	it("should format elapsed time in minutes and seconds", () => {
		render(<ImagePreview url="https://example.com/image.jpg" />)

		// Fast-forward 90 seconds
		vi.advanceTimersByTime(90000)

		expect(screen.getByText(/Waiting for 1m 30s/)).toBeInTheDocument()
	})

	it("should handle successful image load", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		// Find the hidden image element
		const hiddenImg = container.querySelector('img[style*="display: none"]')
		expect(hiddenImg).toBeInTheDocument()

		// Simulate image load
		fireEvent.load(hiddenImg!)

		await waitFor(
			() => {
				expect(screen.queryByText(/Loading image/)).not.toBeInTheDocument()
			},
			{ timeout: 10000 },
		)

		// Should show the actual image
		const visibleImg = container.querySelector('img:not([style*="display: none"])')
		expect(visibleImg).toBeInTheDocument()
		expect(visibleImg).toHaveAttribute("src", "https://example.com/image.jpg")
	}, 15000)

	it("should handle image load error", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		// Find the hidden image element
		const hiddenImg = container.querySelector('img[style*="display: none"]')
		expect(hiddenImg).toBeInTheDocument()

		// Simulate image error
		fireEvent.error(hiddenImg!)

		await waitFor(
			() => {
				expect(screen.getByText("Failed to load image")).toBeInTheDocument()
			},
			{ timeout: 10000 },
		)

		expect(screen.getByText("example.com")).toBeInTheDocument()
		expect(screen.getByText("Click to open in browser")).toBeInTheDocument()
	}, 15000)

	it("should handle timeout after 15 seconds", () => {
		render(<ImagePreview url="https://example.com/image.jpg" />)

		// Fast-forward 15 seconds
		vi.advanceTimersByTime(15000)

		expect(screen.getByText("Failed to load image")).toBeInTheDocument()
		expect(screen.getByText("Click to open in browser")).toBeInTheDocument()
	})

	it("should handle SVG images differently", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.svg" />)

		// For SVG, should use object element in loading state
		const hiddenObject = container.querySelector('object[style*="display: none"]')
		expect(hiddenObject).toBeInTheDocument()
		expect(hiddenObject).toHaveAttribute("type", "image/svg+xml")
	})

	it("should handle SVG loading completion", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.svg" />)

		// Find the hidden object element and simulate load
		const hiddenObject = container.querySelector('object[style*="display: none"]')
		fireEvent.load(hiddenObject!)

		await waitFor(() => {
			expect(screen.queryByText(/Loading image/)).not.toBeInTheDocument()
		})

		// Should show the actual SVG object
		const visibleObject = container.querySelector('object:not([style*="display: none"])')
		expect(visibleObject).toBeInTheDocument()
		expect(visibleObject).toHaveAttribute("data", "https://example.com/image.svg")
	})

	it("should handle non-image URL detection", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(false)

		render(<ImagePreview url="https://example.com/not-image.txt" />)

		await waitFor(() => {
			expect(screen.getByText("Failed to load image")).toBeInTheDocument()
		})
	})

	it("should handle URL check error", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockRejectedValue(new Error("Network error"))

		render(<ImagePreview url="https://example.com/image.jpg" />)

		await waitFor(() => {
			expect(screen.getByText("Failed to load image")).toBeInTheDocument()
		})
	})

	it("should open URL in browser when error state is clicked", async () => {
		const { vscode } = await import("../../../utils/vscode")
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(false)

		render(<ImagePreview url="https://example.com/image.jpg" />)

		await waitFor(() => {
			expect(screen.getByText("Failed to load image")).toBeInTheDocument()
		})

		// Click on error state
		fireEvent.click(screen.getByText("Failed to load image").closest(".image-preview-error")!)

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "openInBrowser",
			url: "https://example.com/image.jpg",
		})
	})

	it("should open URL in browser when successful image is clicked", async () => {
		const { vscode } = await import("../../../utils/vscode")
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		// Simulate image load
		const hiddenImg = container.querySelector('img[style*="display: none"]')
		fireEvent.load(hiddenImg!)

		await waitFor(() => {
			expect(screen.queryByText(/Loading image/)).not.toBeInTheDocument()
		})

		// Click on successful image
		fireEvent.click(container.querySelector(".image-preview")!)

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "openInBrowser",
			url: "https://example.com/image.jpg",
		})
	})

	it("should clean up timers on unmount", () => {
		const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
		const clearIntervalSpy = vi.spyOn(global, "clearInterval")

		const { unmount } = render(<ImagePreview url="https://example.com/image.jpg" />)

		unmount()

		expect(clearTimeoutSpy).toHaveBeenCalled()
		expect(clearIntervalSpy).toHaveBeenCalled()
	})

	it("should calculate aspect ratio for normal images", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		// Mock Image constructor
		const mockImage = {
			width: 800,
			height: 600,
			onload: null as any,
			onerror: null as any,
			crossOrigin: "",
		}

		const ImageSpy = vi.spyOn(global, "Image").mockImplementation(() => mockImage as any)

		render(<ImagePreview url="https://example.com/image.jpg" />)

		// Trigger the image onload
		if (mockImage.onload) {
			mockImage.onload()
		}

		await waitFor(() => {
			expect(screen.queryByText(/Loading image/)).not.toBeInTheDocument()
		})

		expect(ImageSpy).toHaveBeenCalled()
	})

	it("should handle aspect ratio calculation for loaded image", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		// Simulate image load
		const hiddenImg = container.querySelector('img[style*="display: none"]')
		fireEvent.load(hiddenImg!)

		await waitFor(() => {
			const visibleImg = container.querySelector('img:not([style*="display: none"])') as HTMLImageElement
			expect(visibleImg).toBeInTheDocument()

			// Simulate the onLoad event with natural dimensions
			Object.defineProperty(visibleImg, "naturalWidth", { value: 1200 })
			Object.defineProperty(visibleImg, "naturalHeight", { value: 400 })

			fireEvent.load(visibleImg)

			// Should update object-fit for extreme aspect ratio
			expect(visibleImg.style.objectFit).toBe("contain")
		})
	})

	it("should use cover object-fit for normal aspect ratios", async () => {
		const { checkIfImageUrl } = await import("../McpRichUtil")
		vi.mocked(checkIfImageUrl).mockResolvedValue(true)

		const { container } = render(<ImagePreview url="https://example.com/image.jpg" />)

		// Simulate image load
		const hiddenImg = container.querySelector('img[style*="display: none"]')
		fireEvent.load(hiddenImg!)

		await waitFor(() => {
			const visibleImg = container.querySelector('img:not([style*="display: none"])') as HTMLImageElement
			expect(visibleImg).toBeInTheDocument()

			// Simulate normal aspect ratio
			Object.defineProperty(visibleImg, "naturalWidth", { value: 800 })
			Object.defineProperty(visibleImg, "naturalHeight", { value: 600 })

			fireEvent.load(visibleImg)

			expect(visibleImg.style.objectFit).toBe("cover")
		})
	})

	it("should handle different hostname extraction", async () => {
		const { getSafeHostname } = await import("../McpRichUtil")

		render(<ImagePreview url="https://subdomain.example.com/path/image.jpg?query=1" />)

		expect(getSafeHostname).toHaveBeenCalledWith("https://subdomain.example.com/path/image.jpg?query=1")
	})

	it("should memoize component properly", async () => {
		const Component = (await import("../ImagePreview")).default

		const props1 = { url: "https://example.com/image.jpg" }
		const props2 = { url: "https://example.com/image.jpg" }
		const props3 = { url: "https://different.com/image.jpg" }

		// Should be memoized - same URL
		expect((Component as any).type?.compare).toBeDefined()
		expect((Component as any).type?.compare?.(props1, props2)).toBe(true)

		// Should not be memoized - different URL
		expect((Component as any).type?.compare?.(props1, props3)).toBe(false)
	})

	it("should handle console logging", () => {
		render(<ImagePreview url="https://example.com/image.jpg" />)

		// Should log various states
		expect(mockConsoleLog).toHaveBeenCalled()
	})
})
