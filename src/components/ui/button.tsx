import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft border-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:opacity-90 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-1.5 border-border bg-background hover:bg-secondary hover:border-gray-300 shadow-subtle hover:shadow-soft",
        secondary:
          "bg-secondary text-secondary-foreground border border-gray-200 hover:bg-secondary-hover hover:border-gray-300 shadow-subtle hover:shadow-soft",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        success: "bg-success text-success-foreground shadow-soft hover:opacity-90 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
        warning: "bg-warning text-warning-foreground shadow-soft hover:opacity-90 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-16 px-8 py-4 text-lg",
        sm: "h-12 rounded-xl px-5 text-sm",
        lg: "h-20 rounded-2xl px-10 text-xl",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
