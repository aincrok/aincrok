import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
	children: React.ReactNode
	description?: string
}

export const SectionHeader = ({ description, children, className, ...props }: SectionHeaderProps) => {
	return (
		<div
			className={cn(
				"sticky top-0 z-10 text-vscode-sideBar-foreground bg-vscode-sideBar-background brightness-90 px-5 py-2.5",
				className,
			)}
			{...props}>
			<div className="space-y-0">
				<h4 className="m-0 text-base font-medium">{children}</h4>
				{description && (
					<p className="text-vscode-descriptionForeground text-xs leading-tight m-0">{description}</p>
				)}
			</div>
		</div>
	)
}
