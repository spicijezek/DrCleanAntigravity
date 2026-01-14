import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

const StyledSelect = React.forwardRef<HTMLSelectElement, StyledSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative h-11 w-full rounded-lg border border-input bg-background">
        <select
          ref={ref}
          className={cn(
            "absolute inset-0 h-full w-full bg-transparent pl-3 pr-10 text-sm font-medium text-foreground appearance-none focus:outline-none cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    )
  }
)
StyledSelect.displayName = "StyledSelect"

export { StyledSelect }
