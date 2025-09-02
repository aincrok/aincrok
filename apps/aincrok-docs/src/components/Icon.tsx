import React from "react"
import {
	Zap,
	Target,
	Rocket,
	Package,
	Settings,
	Bot,
	Plug,
	Wrench,
	Shield,
	MessageCircle,
	Users,
	Bug,
	Lightbulb,
	Heart,
	AlertTriangle,
	Lock,
	Brain,
	DollarSign,
	Feather,
	Book,
	Github,
	RefreshCw,
} from "lucide-react"

interface IconProps {
	name:
		| "zap"
		| "target"
		| "rocket"
		| "package"
		| "settings"
		| "bot"
		| "plug"
		| "wrench"
		| "shield"
		| "message-circle"
		| "users"
		| "bug"
		| "lightbulb"
		| "heart"
		| "alert-triangle"
		| "lock"
		| "brain"
		| "dollar-sign"
		| "feather"
		| "book"
		| "github"
		| "refresh-cw"
	size?: number
	color?: string
	className?: string
}

const iconMap = {
	zap: Zap,
	target: Target,
	rocket: Rocket,
	package: Package,
	settings: Settings,
	bot: Bot,
	plug: Plug,
	wrench: Wrench,
	shield: Shield,
	"message-circle": MessageCircle,
	users: Users,
	bug: Bug,
	lightbulb: Lightbulb,
	heart: Heart,
	"alert-triangle": AlertTriangle,
	lock: Lock,
	brain: Brain,
	"dollar-sign": DollarSign,
	feather: Feather,
	book: Book,
	github: Github,
	"refresh-cw": RefreshCw,
}

export default function Icon({ name, size = 20, color = "currentColor", className = "" }: IconProps) {
	const IconComponent = iconMap[name]

	if (!IconComponent) {
		console.warn(`Icon "${name}" not found`)
		return null
	}

	return (
		<IconComponent
			size={size}
			color={color}
			className={className}
			style={{
				display: "inline-block",
				verticalAlign: "middle",
			}}
		/>
	)
}
