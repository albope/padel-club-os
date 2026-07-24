import { cn } from "@/lib/utils"
import Image from "next/image"
import { DEFAULT_IMAGES } from "@/lib/default-images"

/** Chip de categoria del blog por color semantico (mock Marcador). */
export const chipCategoriaBase =
  "justify-self-start rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"

export function claseCategoria(cat: string): string {
  switch (cat) {
    case "Negocio":
      return "bg-warning-bg text-warning-foreground border-warning-border"
    case "Tecnología":
      return "bg-info-bg text-info-foreground border-info-border"
    case "Consejos":
      return "bg-dataviz-4/10 text-dataviz-4 border-dataviz-4/25"
    case "Gestión":
    case "Industria":
      return "bg-success-bg text-primary border-success-border"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

/**
 * Placeholder rayado (patron del mock) para huecos de imagen sin foto propia.
 * Fase 6: hasta la sesion fotografica (brief-fotografia.md) todos los huecos
 * usan este patron, nunca stock generico. Usa tokens (no hex crudos).
 * `variant="oscuro"` se pensó para usarse dentro de una isla `.dark`.
 */
export function PlaceholderFoto({
  variant = "claro",
  label = "FOTO",
  className,
}: {
  variant?: "claro" | "oscuro"
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      role="img"
      aria-label={label === "FOTO" ? "Material de padel" : label}
    >
      <Image
        src={DEFAULT_IMAGES.news}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className={cn("object-cover", variant === "oscuro" && "brightness-75")}
      />
    </div>
  )
}
