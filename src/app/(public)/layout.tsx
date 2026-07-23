import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { SkipToContent } from "@/components/layout/SkipToContent"

// Identidad «Marcador» — Fase 6. La superficie publica es Marcador de forma
// INCONDICIONAL (no depende de NEXT_PUBLIC_TEMA_MARCADOR): el wrapper aplica
// la clase .theme-marcador (tokens papel/tinta/verde) + las fuentes Marcador
// remapeando --font-sora/--font-inter/--font-mono solo en este subarbol.
// La clase .marketing-marcador fuerza claro (globals.css excluye este wrapper
// del bloque dark), como en el mock light-only.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sora",
  axes: ["wdth"],
})
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
})

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`marketing-marcador theme-marcador font-sans ${archivo.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col bg-background text-foreground`}
    >
      <SkipToContent />
      <Navbar />
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
