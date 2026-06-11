import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background text-sm transition-all duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input hover:border-ring/50 focus-visible:border-input focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:ring-offset-0",
        error: "border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-[3px] focus-visible:ring-[rgba(239,68,68,0.15)] focus-visible:ring-offset-0",
        success: "border-primary hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:ring-offset-0",
        ghost: "border-transparent bg-muted/50 hover:bg-muted focus-visible:bg-background focus-visible:border-input focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:ring-offset-0",
      },
      size: {
        default: "h-12 px-4 py-3",
        sm: "h-10 px-3 py-2 text-xs rounded-xl",
        lg: "h-14 px-5 py-4 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }