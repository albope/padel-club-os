import * as React from "react"
import { temaMarcadorActivo } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

// «Marcador» (Brand Kit): borde 1.5px sand-400 sobre superficie, foco y error
// con anillo suave de 3px, disabled 45%.
const clasesInput = temaMarcadorActivo()
  ? "flex h-10 w-full rounded-md border-[1.5px] border-border-strong bg-card px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/10 disabled:cursor-not-allowed disabled:opacity-[0.45]"
  : "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(clasesInput, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
