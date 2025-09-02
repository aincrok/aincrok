import { useEffect, useRef, useState } from "react"

interface ScrollRevealProps {
	children: React.ReactNode
	className?: string
	animation?: "fade-up" | "fade-left" | "fade-right" | "scale" | "stagger"
	delay?: number
	threshold?: number
}

export default function ScrollReveal({
	children,
	className = "",
	animation = "fade-up",
	delay = 0,
	threshold = 0.1,
}: ScrollRevealProps): JSX.Element {
	const [isRevealed, setIsRevealed] = useState(false)
	const elementRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isRevealed) {
						if (delay > 0) {
							setTimeout(() => {
								setIsRevealed(true)
							}, delay)
						} else {
							setIsRevealed(true)
						}
					}
				})
			},
			{ threshold },
		)

		if (elementRef.current) {
			observer.observe(elementRef.current)
		}

		return () => {
			if (elementRef.current) {
				observer.unobserve(elementRef.current)
			}
		}
	}, [delay, threshold, isRevealed])

	const getAnimationClass = () => {
		switch (animation) {
			case "fade-up":
				return "scroll-reveal"
			case "fade-left":
				return "scroll-reveal-left"
			case "fade-right":
				return "scroll-reveal-right"
			case "scale":
				return "scroll-reveal-scale"
			case "stagger":
				return "scroll-reveal-stagger"
			default:
				return "scroll-reveal"
		}
	}

	return (
		<div ref={elementRef} className={`${getAnimationClass()} ${isRevealed ? "revealed" : ""} ${className}`}>
			{children}
		</div>
	)
}
