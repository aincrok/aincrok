// aincrok_change - new dedicated memory dashboard view
// Separate from MemoryView (settings) - this is the dashboard with analytics and exploration
import React from "react"
import MemoryDashboard from "./MemoryDashboard"

interface MemoryDashboardViewProps {
	onDone: () => void
}

export default function MemoryDashboardView({ onDone: _onDone }: MemoryDashboardViewProps) {
	return <MemoryDashboard />
}
