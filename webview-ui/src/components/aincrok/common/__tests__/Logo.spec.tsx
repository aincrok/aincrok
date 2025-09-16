import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import Logo from "../Logo"

describe("Logo", () => {
	it("should render SVG logo with default dimensions", () => {
		const { container } = render(<Logo />)

		const svg = container.querySelector("svg")
		expect(svg).toBeInTheDocument()
		expect(svg).toHaveAttribute("width", "100")
		expect(svg).toHaveAttribute("height", "100")
	})

	it("should render with custom width and height", () => {
		const { container } = render(<Logo width={200} height={150} />)

		const svg = container.querySelector("svg")
		expect(svg).toBeInTheDocument()
		expect(svg).toHaveAttribute("width", "200")
		expect(svg).toHaveAttribute("height", "150")
	})

	it("should have correct SVG attributes", () => {
		const { container } = render(<Logo />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveAttribute("id", "Kilo_Code_Branding")
		expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg")
		expect(svg).toHaveAttribute("version", "1.1")
		expect(svg).toHaveAttribute("viewBox", "0 0 50 50")
	})

	it("should have correct CSS classes", () => {
		const { container } = render(<Logo />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveClass("mb-4", "mt-4")
	})

	it("should contain the logo path element", () => {
		const { container } = render(<Logo />)

		const path = container.querySelector("path")
		expect(path).toBeInTheDocument()
		expect(path).toHaveAttribute("fill", "var(--vscode-descriptionForeground)")
	})

	it("should have the complete path data", () => {
		const { container } = render(<Logo />)

		const path = container.querySelector("path")
		const expectedPathData =
			"M0,0v50h50V0H0ZM46.2962963,46.2962963H3.7037037V3.7037037h42.5925926v42.5925926ZM30.5555522,35.9548042h4.6296296v3.7037037h-5.8201058l-2.5132275-2.5132275v-5.8201058h3.7037037v4.6296296ZM38.8888855,35.9548042h-3.7037037v-4.6296296h-4.6296296v-3.7037037h5.8201058l2.5132275,2.5132275v5.8201058ZM23.1481481,30.5557103h-3.7037037v-3.7037037h3.7037037v3.7037037ZM11.1111111,26.8520066h3.7037037v8.3333333h8.3333333v3.7037037h-9.5238095l-2.5132275-2.5132275v-9.5238095ZM38.8888855,19.4444444v3.7037037h-12.037037v-3.7037037h4.1390959v-4.6296296h-4.1390959v-3.7037037h5.3295721l2.5132275,2.5132275v5.8201058h4.1942374ZM14.8148148,15.2777778h4.6296296l3.7037037,3.7037037v4.1666667h-3.7037037v-4.1666667h-4.6296296v4.1666667h-3.7037037v-12.037037h3.7037037v4.1666667ZM23.1481481,15.2777778h-3.7037037v-4.1666667h3.7037037v4.1666667Z"

		expect(path).toHaveAttribute("d", expectedPathData)
	})

	it("should handle zero dimensions", () => {
		const { container } = render(<Logo width={0} height={0} />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveAttribute("width", "0")
		expect(svg).toHaveAttribute("height", "0")
	})

	it("should handle large dimensions", () => {
		const { container } = render(<Logo width={1000} height={800} />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveAttribute("width", "1000")
		expect(svg).toHaveAttribute("height", "800")
	})

	it("should handle only width specified", () => {
		const { container } = render(<Logo width={250} />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveAttribute("width", "250")
		expect(svg).toHaveAttribute("height", "100") // default height
	})

	it("should handle only height specified", () => {
		const { container } = render(<Logo height={250} />)

		const svg = container.querySelector("svg")
		expect(svg).toHaveAttribute("width", "100") // default width
		expect(svg).toHaveAttribute("height", "250")
	})

	it("should use CSS custom property for fill color", () => {
		const { container } = render(<Logo />)

		const path = container.querySelector("path")
		expect(path).toHaveAttribute("fill", "var(--vscode-descriptionForeground)")
	})

	it("should render consistently with same props", () => {
		const { container: container1 } = render(<Logo width={150} height={150} />)
		const { container: container2 } = render(<Logo width={150} height={150} />)

		expect(container1.innerHTML).toBe(container2.innerHTML)
	})
})
