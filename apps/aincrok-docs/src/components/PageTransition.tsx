import React, { useEffect, useState } from "react"

interface PageTransitionProps {
	children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps): JSX.Element {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		// Trigger fade-in after component mounts
		const timer = setTimeout(() => {
			setIsVisible(true)
		}, 50)

		return () => clearTimeout(timer)
	}, [])

	return (
		<div
			className="page-transition"
			style={{
				opacity: isVisible ? 1 : 0,
				transition: "opacity 0.5s ease-in-out",
				minHeight: "100vh",
			}}>
			{children}
		</div>
	)
}
