import React from "react"

export default function InteractiveBackground(): JSX.Element {
	// Create multiple particles for the animation
	const particles = Array.from({ length: 50 }, (_, i) => ({
		id: i,
		left: Math.random() * 100,
		delay: Math.random() * 20,
		duration: 15 + Math.random() * 10,
		size: 2 + Math.random() * 4,
	}))

	return (
		<div className="css-tech-background">
			{/* Base gradient background */}
			<div className="tech-base-gradient" />

			{/* Animated grid overlay */}
			<div className="tech-grid-pattern" />

			{/* Floating particles */}
			<div className="tech-particles-container">
				{particles.map((particle) => (
					<div
						key={particle.id}
						className="css-tech-particle"
						style={{
							left: `${particle.left}%`,
							animationDelay: `${particle.delay}s`,
							animationDuration: `${particle.duration}s`,
							width: `${particle.size}px`,
							height: `${particle.size}px`,
						}}
					/>
				))}
			</div>

			{/* Atmospheric orbs with better visibility */}
			<div className="atmospheric-orbs">
				<div className="visible-orb orb-1"></div>
				<div className="visible-orb orb-2"></div>
				<div className="visible-orb orb-3"></div>
			</div>

			{/* Flying crows container */}
			<div className="flying-crows-background">
				{/* Generate multiple darker flying crows */}
				{Array.from({ length: 10 }, (_, i) => (
					<div key={i} className={`flying-crow flying-crow-${i + 1}`}>
						<svg width="60" height="32" viewBox="0 0 60 32" className="detailed-crow">
							{/* Full detailed crow with colors and textures */}

							{/* Main body - with gradient and texture */}
							<ellipse
								cx="30"
								cy="16"
								rx="8"
								ry="4"
								fill="url(#crowBodyGradient)"
								stroke="#1a1a1a"
								stroke-width="0.5"
							/>

							{/* Head - detailed with features */}
							<circle
								cx="40"
								cy="14"
								r="3.5"
								fill="url(#crowHeadGradient)"
								stroke="#1a1a1a"
								stroke-width="0.5"
							/>

							{/* Beak - realistic coloring */}
							<path
								d="M43,14 L48,12.5 L48,15.5 L43,14 Z"
								fill="#333333"
								stroke="#1a1a1a"
								stroke-width="0.3"
							/>

							{/* Eye - bright and visible */}
							<circle cx="41" cy="13" r="0.8" fill="#1a1a1a" />
							<circle cx="41.3" cy="12.7" r="0.3" fill="#ffdd44" />
							<circle cx="41.2" cy="12.5" r="0.1" fill="#ffffff" />

							{/* Left wing - detailed with feather textures */}
							<g className="left-wing">
								{/* Wing base */}
								<path
									d="M22,16 L8,12 L2,14 L4,18 L8,20 L22,18 Z"
									fill="url(#crowWingGradient)"
									stroke="#1a1a1a"
									stroke-width="0.5"
								/>

								{/* Primary feathers */}
								<path
									d="M8,14 L3,12 L2,16 L4,19 L7,18 Z"
									fill="#2a2a2a"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>
								<path
									d="M11,15 L6,13 L5,17 L7,20 L10,19 Z"
									fill="#333333"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>
								<path
									d="M14,15.5 L9,13.5 L8,18 L10,21 L13,20 Z"
									fill="#2a2a2a"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>

								{/* Wing details */}
								<path
									d="M4,14 L3,11 M6,15 L5,12 M8,16 L7,13 M10,16.5 L9,13.5"
									stroke="#444444"
									stroke-width="0.2"
									fill="none"
								/>
							</g>

							{/* Right wing - detailed with feather textures */}
							<g className="right-wing">
								{/* Wing base */}
								<path
									d="M38,16 L52,12 L58,14 L56,18 L52,20 L38,18 Z"
									fill="url(#crowWingGradient)"
									stroke="#1a1a1a"
									stroke-width="0.5"
								/>

								{/* Primary feathers */}
								<path
									d="M52,14 L57,12 L58,16 L56,19 L53,18 Z"
									fill="#2a2a2a"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>
								<path
									d="M49,15 L54,13 L55,17 L53,20 L50,19 Z"
									fill="#333333"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>
								<path
									d="M46,15.5 L51,13.5 L52,18 L50,21 L47,20 Z"
									fill="#2a2a2a"
									stroke="#1a1a1a"
									stroke-width="0.3"
								/>

								{/* Wing details */}
								<path
									d="M56,14 L57,11 M54,15 L55,12 M52,16 L53,13 M50,16.5 L51,13.5"
									stroke="#444444"
									stroke-width="0.2"
									fill="none"
								/>
							</g>

							{/* Tail - detailed with individual feathers */}
							<path
								d="M22,17 L14,18 L12,22 L14,25 L22,21 Z"
								fill="url(#crowWingGradient)"
								stroke="#1a1a1a"
								stroke-width="0.5"
							/>
							<path
								d="M16,19 L13,23 M17,19 L14,24 M18,19 L15,24 M19,19 L16,23"
								stroke="#333333"
								stroke-width="0.2"
								fill="none"
							/>

							{/* Legs/Feet - tucked up in flight */}
							<ellipse
								cx="28"
								cy="19"
								rx="1.5"
								ry="1"
								fill="#444444"
								stroke="#1a1a1a"
								stroke-width="0.2"
							/>
							<ellipse
								cx="32"
								cy="19"
								rx="1.5"
								ry="1"
								fill="#444444"
								stroke="#1a1a1a"
								stroke-width="0.2"
							/>

							{/* Gradients for realistic coloring */}
							<defs>
								<radialGradient id="crowBodyGradient" cx="0.3" cy="0.2">
									<stop offset="0%" stop-color="#4a4a4a" />
									<stop offset="100%" stop-color="#1a1a1a" />
								</radialGradient>
								<radialGradient id="crowHeadGradient" cx="0.3" cy="0.2">
									<stop offset="0%" stop-color="#3a3a3a" />
									<stop offset="100%" stop-color="#0a0a0a" />
								</radialGradient>
								<linearGradient id="crowWingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stop-color="#333333" />
									<stop offset="50%" stop-color="#1a1a1a" />
									<stop offset="100%" stop-color="#0a0a0a" />
								</linearGradient>
							</defs>
						</svg>
					</div>
				))}
			</div>

			{/* Mouse interaction overlay */}
			<div className="mouse-interaction-overlay" />
		</div>
	)
}
