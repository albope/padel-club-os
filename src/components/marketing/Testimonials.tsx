const testimonios = [
  {
    cita: "Desde que usamos Padel Club OS, la gestion de reservas es automatica. Nuestros socios reservan desde el movil y nosotros nos centramos en lo importante.",
    nombre: "Carlos Martinez",
    rol: "Director",
    club: "Club Padel Valencia",
  },
  {
    cita: "Las competiciones eran un caos de Excel. Ahora generamos ligas, registramos resultados y publicamos clasificaciones en minutos. Los socios estan encantados.",
    nombre: "Laura Gonzalez",
    rol: "Coordinadora deportiva",
    club: "Padel Indoor Sevilla",
  },
  {
    cita: "Probamos otros sistemas pero eran carisimos y rigidos. Padel Club OS tiene todo lo que necesitamos a una fraccion del precio, y encima se actualiza constantemente.",
    nombre: "Miguel Torres",
    rol: "Propietario",
    club: "Padel Center Madrid",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonios" className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Clubes que ya confian en nosotros
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubre por que los clubes de padel eligen Padel Club OS.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          {testimonios.map((t) => (
            <div
              key={t.nombre}
              className="flex flex-col rounded-xl border bg-card p-6"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.cita}&rdquo;
              </blockquote>
              <div className="mt-6 border-t pt-4">
                <div className="font-semibold">{t.nombre}</div>
                <div className="text-sm text-muted-foreground">
                  {t.rol}, {t.club}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
