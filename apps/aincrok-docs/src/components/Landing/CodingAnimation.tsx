import React, { useState, useEffect } from "react"
import styles from "./CodingAnimation.module.css"

interface CodeStep {
	id: string
	type: "user-prompt" | "ai-thinking" | "ai-code" | "completion"
	content: string
	delay: number
}

const codeSteps: CodeStep[] = [
	{
		id: "1",
		type: "user-prompt",
		content: "Create a React component for user authentication",
		delay: 1000,
	},
	{
		id: "2",
		type: "ai-thinking",
		content: "Analyzing requirements...",
		delay: 800,
	},
	{
		id: "3",
		type: "ai-code",
		content: `import React, { useState } from 'react';

interface AuthProps {
  onLogin: (token: string) => void;
}

export const AuthComponent: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (data.token) {
        onLogin(data.token);
      }
    } catch (error) {
      console.error('Auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};`,
		delay: 3000,
	},
	{
		id: "4",
		type: "completion",
		content: "✓ Component created successfully!",
		delay: 500,
	},
]

export default function CodingAnimation(): JSX.Element {
	const [currentStepIndex, setCurrentStepIndex] = useState(-1)
	const [displayedCode, setDisplayedCode] = useState("")
	const [isTyping, setIsTyping] = useState(false)

	useEffect(() => {
		const runAnimation = () => {
			let stepIndex = 0

			const processStep = () => {
				if (stepIndex >= codeSteps.length) {
					// Reset animation after a pause
					setTimeout(() => {
						setCurrentStepIndex(-1)
						setDisplayedCode("")
						stepIndex = 0
						processStep()
					}, 3000)
					return
				}

				const step = codeSteps[stepIndex]
				setCurrentStepIndex(stepIndex)

				if (step.type === "ai-code") {
					setIsTyping(true)
					typeCode(step.content, () => {
						setIsTyping(false)
						setTimeout(() => {
							stepIndex++
							processStep()
						}, step.delay)
					})
				} else {
					setTimeout(() => {
						stepIndex++
						processStep()
					}, step.delay)
				}
			}

			processStep()
		}

		runAnimation()
	}, [])

	const typeCode = (code: string, onComplete: () => void) => {
		setDisplayedCode("")
		let charIndex = 0

		const typeChar = () => {
			if (charIndex < code.length) {
				setDisplayedCode(code.substring(0, charIndex + 1))
				charIndex++
				// Vary typing speed for more natural feel
				const delay = Math.random() * 50 + 20
				setTimeout(typeChar, delay)
			} else {
				onComplete()
			}
		}

		typeChar()
	}

	const getCurrentStep = () => {
		return currentStepIndex >= 0 ? codeSteps[currentStepIndex] : null
	}

	const currentStep = getCurrentStep()

	return (
		<div className={styles.codingAnimation}>
			<div className={styles.demoWindow}>
				<div className={styles.demoWindowHeader}>
					<div className={styles.demoWindowControls}>
						<div className={`${styles.demoControl} ${styles.red}`}></div>
						<div className={`${styles.demoControl} ${styles.yellow}`}></div>
						<div className={`${styles.demoControl} ${styles.green}`}></div>
					</div>
					<div className={styles.demoWindowTitle}>Aincrok - AI Code Assistant</div>
				</div>

				<div className={styles.demoContent}>
					<div className={styles.chatSection}>
						{currentStepIndex >= 0 && (
							<div className={styles.promptMessage}>
								<div className={styles.messageHeader}>
									<span className={styles.userIcon}>👤</span>
									<span className={styles.userName}>Developer</span>
								</div>
								<div className={styles.messageContent}>{codeSteps[0].content}</div>
							</div>
						)}

						{currentStepIndex >= 1 && (
							<div className={styles.aiMessage}>
								<div className={styles.messageHeader}>
									<span className={styles.aiIcon}>🤖</span>
									<span className={styles.aiName}>Aincrok</span>
									{currentStep?.type === "ai-thinking" && (
										<div className={styles.thinkingDots}>
											<span></span>
											<span></span>
											<span></span>
										</div>
									)}
								</div>
								{currentStepIndex >= 2 && (
									<div className={styles.messageContent}>
										I'll create a React authentication component for you.
									</div>
								)}
							</div>
						)}

						{currentStepIndex >= 3 && (
							<div className={styles.completionMessage}>
								<span className={styles.checkIcon}>✓</span>
								<span>Component created successfully!</span>
							</div>
						)}
					</div>

					<div className={styles.codeSection}>
						{currentStepIndex >= 2 && (
							<>
								<div className={styles.codeHeader}>
									<span className={styles.fileName}>AuthComponent.tsx</span>
									<div className={styles.codeActions}>
										<span className={styles.actionIcon}>📄</span>
										<span className={styles.actionIcon}>💾</span>
									</div>
								</div>
								<div className={styles.codeContent}>
									<pre>
										<code>{displayedCode}</code>
									</pre>
									{isTyping && <span className={styles.cursor}>|</span>}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
