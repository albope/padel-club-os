import { MessageCircleX, FileSpreadsheet, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const puntosDolor = [
  {
    icono: MessageCircleX,
    titulo: "Reservas por WhatsApp",
    antes: "Grupos de WhatsApp, llamadas y libretas de papel. Dobles reservas, malentendidos y horas perdidas gestionando el caos.",
    despues: "Reservas online 24/7 con detección automática de solapamientos. Tus socios reservan solos; tú no tocas el móvil.",
  },
  {
    icono: FileSpreadsheet,
    titulo: "Competiciones en Excel",
    antes: "Ligas en hojas de cálculo actualizadas a mano. Errores, cálculos incorrectos y clasificaciones que nadie sabe dónde encontrar.",
    despues: "Genera ligas y torneos en segundos. Cuadros automáticos, resultados en tiempo real y clasificaciones visibles para todos.",
  },
  {
    icono: Layers,
    titulo: "Gestión fragmentada",
    antes: "WhatsApp para reservas, Excel para competiciones, papel para socios y otra app para pagos. Nada conectado, todo duplicado.",
    despues: "Una sola plataforma para reservas, socios, competiciones y analíticas. Todo conectado, todo en orden.",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonios" className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tu club merece algo mejor
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Conocemos el día a día de un club de pádel. Hemos diseñado la solución para cada uno de estos problemas.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {puntosDolor.map((punto) => (
            <div
              key={punto.titulo}
              className="flex flex-col rounded-xl border bg-card shadow-sm"
            >
              {/* Header de la card */}
              <div className="flex items-center gap-3 border-b px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <punto.icono className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{punto.titulo}</h3>
              </div>

              {/* Bloque "antes" */}
              <div className="px-6 py-5">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5",
                      "bg-red-100 text-xs font-medium text-red-700",
                      "dark:bg-red-950/60 dark:text-red-400"
                    )}
                  >
                    Ahora
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {punto.antes}
                </p>
              </div>

              {/* Separador con flecha */}
              <div className="relative flex items-center px-6">
                <div className="h-px flex-1 bg-border" />
                <span className="mx-3 text-xs font-medium text-muted-foreground">
                  con Padel Club OS
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Bloque "despues" */}
              <div className="px-6 py-5">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5",
                      "bg-emerald-100 text-xs font-medium text-emerald-700",
                      "dark:bg-emerald-950/60 dark:text-emerald-400"
                    )}
                  >
                    Con nosotros
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {punto.despues}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
