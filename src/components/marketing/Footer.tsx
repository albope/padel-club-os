import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { LogoIcon } from "@/components/ui/logo-icon"

const columnas = [
  {
    titulo: "Producto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Precios", href: "#precios" },
      { label: "Testimonios", href: "#testimonios" },
    ],
  },
  {
    titulo: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "/sobre-nosotros" },
      { label: "Blog", href: "/blog" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    titulo: "Legal",
    links: [
      { label: "Privacidad", href: "/privacidad" },
      { label: "Terminos de uso", href: "/terminos" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Marca */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon tamano="md" />
              <span className="text-lg font-bold">Padel Club OS</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              La plataforma de gestion para clubes de padel en Espana.
              Moderna, accesible y sin complicaciones.
            </p>
          </div>

          {/* Columnas de links */}
          {columnas.map((col) => (
            <div key={col.titulo}>
              <h4 className="text-sm font-semibold">{col.titulo}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Padel Club OS. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
