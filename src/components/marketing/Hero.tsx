import Link from "next/link"
import { getTranslations } from "next-intl/server"

type Estado = "reservada" | "abierta" | "clase" | "libre"

// Mini-grid decorativo del hero (4 pistas x 4 franjas). Los estados son
// ilustrativos, como los KPIs (24 / 342 / 87%).
const filas: { hora: string; celdas: Estado[] }[] = [
  { hora: "17:00", celdas: ["reservada", "reservada", "libre", "reservada"] },
  { hora: "18:30", celdas: ["reservada", "reservada", "abierta", "reservada"] },
  { hora: "20:00", celdas: ["clase", "reservada", "reservada", "abierta"] },
  { hora: "21:30", celdas: ["reservada", "libre", "reservada", "reservada"] },
]

const claseCelda: Record<Estado, string> = {
  reservada: "border-primary bg-primary text-primary-foreground",
  abierta: "border-primary bg-primary text-primary-foreground",
  clase: "border-success-border bg-success-bg text-success",
  libre: "border-dashed border-border-strong bg-surface-raised text-muted-foreground",
}

export default async function Hero() {
  const t = await getTranslations("marketing.hero")

  const etiquetaCelda: Record<Estado, string> = {
    reservada: t("cellReserved"),
    abierta: t("cellOpen"),
    clase: t("cellClass"),
    libre: t("cellFree"),
  }

  const kpis = [
    { label: t("bookingsToday"), valor: "24", sub: t("vsYesterday") },
    { label: t("activeMembers"), valor: "342", sub: t("thisWeek") },
    { label: t("occupancy"), valor: "87%", sub: t("historicMax") },
  ]

  return (
    <section className="container grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      {/* Columna izquierda */}
      <div className="grid gap-6">
        <div className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          <span className="inline-block h-0.5 w-7 bg-primary" aria-hidden="true" />
          {t("badge")}
        </div>
        <h1
          className="font-display text-4xl leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-[56px]"
          style={{ fontWeight: 800 }}
        >
          {t("headlinePart1")} {t("headlinePart2")}
        </h1>
        <p className="max-w-[480px] text-[17px] leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/demo?source=hero"
            className="rounded-[var(--radius-control)] bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("ctaPrimary")}
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-foreground"
          >
            {t("ctaSecondary")}
            <span className="font-mono text-xs text-muted-foreground/70" aria-hidden="true">
              &#9656;
            </span>
          </a>
        </div>
        <p className="text-xs text-muted-foreground/70">{t("trustLine")}</p>
      </div>

      {/* Columna derecha: tarjeta KPIs + mini-grid */}
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface-raised shadow-[0_24px_60px_-24px_hsl(36_8%_10%/0.25)]">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 p-5 [font-variant-numeric:tabular-nums]">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[var(--radius-module)] border border-border p-3.5">
              <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
                {kpi.label}
              </div>
              <div className="font-display text-[26px]" style={{ fontWeight: 750 }}>
                {kpi.valor}
              </div>
              <div className="text-[11.5px] font-semibold text-success">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Mini-grid de pistas */}
        <div className="grid gap-2 px-5 pb-5 [font-variant-numeric:tabular-nums]">
          {filas.map((fila) => (
            <div key={fila.hora} className="grid grid-cols-[52px_repeat(4,1fr)] items-stretch gap-1.5">
              <span className="flex items-center font-mono text-[11px] text-muted-foreground/70">
                {fila.hora}
              </span>
              {fila.celdas.map((estado, i) => (
                <div
                  key={i}
                  className={`flex h-9 items-center overflow-hidden whitespace-nowrap rounded-[var(--radius-control)] border px-2.5 text-[11.5px] font-semibold ${claseCelda[estado]}`}
                >
                  {etiquetaCelda[estado]}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-[52px_repeat(4,1fr)] gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
            <span />
            {[1, 2, 3, 4].map((n) => (
              <span key={n}>{t("court", { number: n })}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
