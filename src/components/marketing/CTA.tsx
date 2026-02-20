import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CTA() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
          {/* Patron decorativo */}
          <div className="absolute inset-0 -z-0 opacity-10">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Digitaliza tu club hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              Unete a los clubes que ya gestionan reservas, socios y competiciones
              con Padel Club OS. Configura tu club en menos de 5 minutos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 text-base"
                asChild
              >
                <Link href="/register">
                  Crear mi club gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <a href="#precios">Ver planes</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
