import React, { useEffect } from "react"

export default function Root({ children }) {
	useEffect(() => {
		// Force dark theme on mount
		const html = document.documentElement
		html.setAttribute("data-theme", "dark")

		// Remove any light theme classes
		document.body.classList.remove("theme-light")
		document.body.classList.add("theme-dark")

		if (typeof Storage !== "undefined") {
			localStorage.setItem("theme", "dark")
		}

		// Override theme toggle functionality
		const observer = new MutationObserver(() => {
			if (html.getAttribute("data-theme") !== "dark") {
				html.setAttribute("data-theme", "dark")
			}
		})

		observer.observe(html, {
			attributes: true,
			attributeFilter: ["data-theme"],
		})

		return () => observer.disconnect()
	}, [])

	return <>{children}</>
}
