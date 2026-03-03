import { MessageCircleX, FileSpreadsheet, Layers } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"

const puntoDolorKeys = [
  { icono: MessageCircleX, titleKey: "item1Title", beforeKey: "item1Before", afterKey: "item1After" },
  { icono: FileSpreadsheet, titleKey: "item2Title", beforeKey: "item2Before", afterKey: "item2After" },
  { icono: Layers, titleKey: "item3Title", beforeKey: "item3Before", afterKey: "item3After" },
] as const

export default async function Testimonials() {
  const t = await getTranslations('marketing.testimonials')

  return (
    <section id="testimonios" className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {puntoDolorKeys.map((punto) => (
            <div
              key={punto.titleKey}
              className="flex flex-col rounded-xl border bg-card shadow-sm"
            >
              {/* Header de la card */}
              <div className="flex items-center gap-3 border-b px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <punto.icono className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{t(punto.titleKey)}</h3>
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
                    {t('now')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(punto.beforeKey)}
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
                    {t('withUs')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(punto.afterKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
