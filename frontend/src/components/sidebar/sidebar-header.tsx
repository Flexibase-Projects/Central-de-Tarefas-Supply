import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border",
          "px-4 group-data-[collapsible=icon]:px-0",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

export { SidebarHeader }
