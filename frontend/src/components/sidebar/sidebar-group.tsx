import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ label, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn("relative flex w-full flex-col p-2", className)}
        {...props}
      >
        {label && (
          <div
            data-sidebar="group-label"
            className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70"
          >
            {label}
          </div>
        )}
        <div data-sidebar="group-content" role="group">
          {children}
        </div>
      </div>
    )
  }
)
SidebarGroup.displayName = "SidebarGroup"

export { SidebarGroup }
