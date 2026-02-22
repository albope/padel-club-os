"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LogoIcon } from "@/components/ui/logo-icon"

const navLinks = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isLanding = pathname === "/"

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isTransparent = isLanding && !scrolled && !mobileOpen

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isTransparent
          ? "border-transparent bg-transparent"
          : "border-b bg-background/95 backdrop-blur-xl shadow-sm"
      )}
    >
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon tamano="md" />
          <span
            className={cn(
              "text-lg font-bold transition-colors duration-300",
              isTransparent ? "text-white" : "text-foreground"
            )}
          >
            Padel Club OS
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isTransparent
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isTransparent
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            className={cn(
              isTransparent && "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            asChild
          >
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button
            className={cn(
              isTransparent &&
                "bg-white text-slate-900 hover:bg-white/90"
            )}
            asChild
          >
            <Link href="/register">Prueba gratis 14 días</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <X className={cn("h-6 w-6", isTransparent ? "text-white" : "text-foreground")} />
          ) : (
            <Menu className={cn("h-6 w-6", isTransparent ? "text-white" : "text-foreground")} />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden md:hidden transition-all duration-200",
          mobileOpen
            ? "max-h-80 border-t"
            : "max-h-0",
          !isTransparent && mobileOpen && "border-t"
        )}
      >
        <div className={cn(
          "container flex flex-col gap-4 py-4",
          isTransparent ? "bg-slate-900/95 backdrop-blur-xl" : "bg-background"
        )}>
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isTransparent
                    ? "text-white/80 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isTransparent
                    ? "text-white/80 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            )
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Prueba gratis 14 días</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
