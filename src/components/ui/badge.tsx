import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { temaMarcadorActivo } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

// «Marcador» (Brand Kit): chips rectangulares radio 6, icono 12px, estado
// siempre con icono+texto ademas del color. Variantes info/success/warning/
// error solo tienen tokens bajo el flag.
const variantesEstado = {
  info: "border-info-border bg-info-bg text-info-foreground",
  success: "border-success-border bg-success-bg text-success-foreground",
  warning: "border-warning-border bg-warning-bg text-warning-foreground",
  error: "border-error-border bg-error-bg text-error-foreground",
}

const badgeVariants = temaMarcadorActivo()
  ? cva(
      "inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring [&_svg]:h-3 [&_svg]:w-3",
      {
        variants: {
          variant: {
            default: "border-transparent bg-primary text-primary-foreground",
            secondary: "border-border bg-secondary text-secondary-foreground",
            destructive: "border-transparent bg-destructive text-destructive-foreground",
            outline: "text-foreground",
            ...variantesEstado,
          },
        },
        defaultVariants: {
          variant: "default",
        },
      }
    )
  : cva(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      {
        variants: {
          variant: {
            default:
              "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary:
              "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive:
              "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground",
            ...variantesEstado,
          },
        },
        defaultVariants: {
          variant: "default",
        },
      }
    )

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
