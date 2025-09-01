import React, { useState, useEffect } from "react"
import { ConversionTracker } from "../Analytics"
import styles from "./InteractiveDemo.module.css"

interface DemoStep {
	id: string
	title: string
	description: string
	code: string
	result: string
	icon: string
}

const demoSteps: DemoStep[] = [
	{
		id: "code-generation",
		title: "Code Generation",
		description: "Generate complete functions with natural language",
		code: '// User: Create a function to validate email addresses\n\nfunction validateEmail(email: string): boolean {\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  return emailRegex.test(email.toLowerCase());\n}\n\n// Test the function\nconsole.log(validateEmail("user@example.com")); // true',
		result: "✅ Function created with proper validation logic and TypeScript types",
		icon: "🤖",
	},
	{
		id: "code-review",
		title: "Code Review & Optimization",
		description: "Get intelligent suggestions for code improvements",
		code: "// Original code\nfor (let i = 0; i < users.length; i++) {\n  if (users[i].active) {\n    activeUsers.push(users[i]);\n  }\n}\n\n// Aincrok suggestion:\nconst activeUsers = users.filter(user => user.active);",
		result: "💡 Optimized to functional programming style with better readability",
		icon: "🔍",
	},
	{
		id: "debugging",
		title: "Smart Debugging",
		description: "Find and fix bugs with AI-powered analysis",
		code: '// Bug found in async function\nasync function fetchUserData(id) {\n  const response = await fetch(`/api/users/${id}`);\n  return response.json(); // Missing error handling!\n}\n\n// Fixed version:\nasync function fetchUserData(id: string) {\n  try {\n    const response = await fetch(`/api/users/${id}`);\n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}`);\n    }\n    return await response.json();\n  } catch (error) {\n    console.error("Failed to fetch user:", error);\n    throw error;\n  }\n}',
		result: "🐛 Added proper error handling and TypeScript types",
		icon: "🔧",
	},
	{
		id: "documentation",
		title: "Auto Documentation",
		description: "Generate comprehensive documentation automatically",
		code: "/**\n * Calculates the compound interest for an investment\n * @param principal - The initial investment amount\n * @param rate - The annual interest rate (as decimal)\n * @param time - The investment period in years\n * @param compound - The number of times interest is compounded per year\n * @returns The final amount after compound interest\n * @example\n * calculateCompoundInterest(1000, 0.05, 5, 12) // Returns 1283.36\n */\nfunction calculateCompoundInterest(\n  principal: number,\n  rate: number,\n  time: number,\n  compound: number = 1\n): number {\n  return principal * Math.pow(1 + rate / compound, compound * time);\n}",
		result: "📚 Complete JSDoc documentation with examples and type annotations",
		icon: "📝",
	},
]

export const InteractiveDemo: React.FC = () => {
	const [activeStep, setActiveStep] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const [typedCode, setTypedCode] = useState("")
	const [showResult, setShowResult] = useState(false)

	useEffect(() => {
		// Typewriter effect for code
		const currentStep = demoSteps[activeStep]
		if (!currentStep) return

		setTypedCode("")
		setShowResult(false)
		setIsAnimating(true)

		let index = 0
		const typeInterval = setInterval(() => {
			setTypedCode(currentStep.code.substring(0, index))
			index++

			if (index > currentStep.code.length) {
				clearInterval(typeInterval)
				setIsAnimating(false)
				setTimeout(() => setShowResult(true), 500)
			}
		}, 30)

		return () => clearInterval(typeInterval)
	}, [activeStep])

	const handleStepClick = (stepIndex: number) => {
		if (stepIndex !== activeStep) {
			setActiveStep(stepIndex)
		}
	}

	return (
		<ConversionTracker
			conversionType="demo_interaction"
			triggerOn="view"
			scrollThreshold={40}
			className={styles.demoContainer}>
			<div className={styles.demoHeader}>
				<h2 className={styles.demoTitle}>See Aincrok in Action</h2>
				<p className={styles.demoSubtitle}>
					Experience the power of AI-assisted coding with these interactive examples
				</p>
			</div>

			<div className={styles.demoContent}>
				<div className={styles.stepTabs}>
					{demoSteps.map((step, index) => (
						<button
							key={step.id}
							className={`${styles.stepTab} ${index === activeStep ? styles.active : ""}`}
							onClick={() => handleStepClick(index)}>
							<span className={styles.stepIcon}>{step.icon}</span>
							<span className={styles.stepTitle}>{step.title}</span>
						</button>
					))}
				</div>

				<div className={styles.demoViewer}>
					<div className={styles.demoStep}>
						<div className={styles.stepHeader}>
							<h3 className={styles.stepTitle}>
								{demoSteps[activeStep]?.icon} {demoSteps[activeStep]?.title}
							</h3>
							<p className={styles.stepDescription}>{demoSteps[activeStep]?.description}</p>
						</div>

						<div className={styles.codeSection}>
							<div className={styles.codeHeader}>
								<div className={styles.windowControls}>
									<span className={styles.control} style={{ backgroundColor: "#ff5f57" }}></span>
									<span className={styles.control} style={{ backgroundColor: "#ffbd2e" }}></span>
									<span className={styles.control} style={{ backgroundColor: "#28ca42" }}></span>
								</div>
								<span className={styles.fileName}>demo.ts</span>
							</div>
							<div className={styles.codeContent}>
								<pre>
									<code>{typedCode}</code>
									{isAnimating && <span className={styles.cursor}>|</span>}
								</pre>
							</div>
						</div>

						{showResult && (
							<div className={styles.resultSection}>
								<div className={styles.resultHeader}>
									<span className={styles.resultIcon}>⚡</span>
									<span>Aincrok Result</span>
								</div>
								<div className={styles.resultContent}>{demoSteps[activeStep]?.result}</div>
							</div>
						)}
					</div>
				</div>

				<div className={styles.demoActions}>
					<button
						className={styles.prevButton}
						onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
						disabled={activeStep === 0}>
						← Previous
					</button>
					<div className={styles.stepIndicators}>
						{demoSteps.map((_, index) => (
							<button
								key={index}
								className={`${styles.indicator} ${index === activeStep ? styles.active : ""}`}
								onClick={() => handleStepClick(index)}
							/>
						))}
					</div>
					<button
						className={styles.nextButton}
						onClick={() => setActiveStep(Math.min(demoSteps.length - 1, activeStep + 1))}
						disabled={activeStep === demoSteps.length - 1}>
						Next →
					</button>
				</div>
			</div>
		</ConversionTracker>
	)
}
