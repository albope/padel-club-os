import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />

      <div className="container flex flex-col items-center gap-8 pb-20 pt-24 text-center md:pt-32">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm font-medium">
          Nuevo: Portal para jugadores
          <ArrowRight className="h-3.5 w-3.5" />
        </Badge>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          La gestion de tu club de padel,{" "}
          <span className="text-primary">simplificada</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          Reservas, socios, competiciones y pagos en una sola plataforma.
          Moderna, intuitiva y disenada para clubes de padel en Espana.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2 text-base" asChild>
            <Link href="/register">
              Empezar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base" asChild>
            <a href="#funcionalidades">Ver funcionalidades</a>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Sin permanencia. Configura tu club en minutos.
        </p>

        {/* Mockup / visual */}
        <div className="relative mt-8 w-full max-w-5xl">
          <div className="rounded-xl border bg-card p-2 shadow-2xl">
            <div className="rounded-lg bg-muted/50 p-8">
              <div className="grid grid-cols-3 gap-4">
                {/* Mini stats cards simulando el dashboard */}
                <div className="rounded-lg bg-background p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">Reservas hoy</div>
                  <div className="mt-1 text-2xl font-bold">24</div>
                  <div className="mt-1 text-xs text-primary">+12% vs ayer</div>
                </div>
                <div className="rounded-lg bg-background p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">Socios activos</div>
                  <div className="mt-1 text-2xl font-bold">342</div>
                  <div className="mt-1 text-xs text-primary">+8 esta semana</div>
                </div>
                <div className="rounded-lg bg-background p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">Ocupacion</div>
                  <div className="mt-1 text-2xl font-bold">87%</div>
                  <div className="mt-1 text-xs text-primary">Maximo historico</div>
                </div>
              </div>
              {/* Pistas simuladas */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                {["Pista 1", "Pista 2", "Pista 3", "Pista 4"].map((pista) => (
                  <div key={pista} className="rounded-lg border bg-background p-3">
                    <div className="text-xs font-medium">{pista}</div>
                    <div className="mt-2 space-y-1">
                      <div className="h-2 rounded-full bg-primary/20" />
                      <div className="h-2 w-3/4 rounded-full bg-primary" />
                      <div className="h-2 w-1/2 rounded-full bg-primary/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Sombra decorativa */}
          <div className="absolute -inset-x-4 -bottom-4 -z-10 h-full rounded-xl bg-primary/5 blur-2xl" />
        </div>
      </div>
    </section>
  )
}
