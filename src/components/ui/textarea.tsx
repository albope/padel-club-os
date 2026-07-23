import * as React from "react"

import { temaMarcadorActivo } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

// «Marcador»: mismo tratamiento que Input (borde 1.5px, foco anillo suave 3px)
const clasesTextarea = temaMarcadorActivo()
  ? "flex min-h-[80px] w-full rounded-md border-[1.5px] border-border-strong bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/10 disabled:cursor-not-allowed disabled:opacity-[0.45]"
  : "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(clasesTextarea, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
