"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { LanguageSelector } from "@/components/layout/LanguageSelector"

const navLinkKeys = [
  { href: "#funcionalidades", key: "features" },
  { href: "#como-funciona", key: "howItWorks" },
  { href: "#precios", key: "pricing" },
  { href: "/blog", key: "blog" },
  { href: "/contacto", key: "contact" },
] as const

/** Isotipo «Marcador»: geometria pura, stroke = currentColor, chip = verde marca */
function Isotipo() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
      <rect x="4" y="10" width="40" height="28" rx="7" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="16" width="13" height="16" rx="3" className="fill-primary" />
    </svg>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("marketing.navbar")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <nav
        aria-label="Navegacion principal"
        className="container flex h-16 items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <Isotipo />
          <span className="font-display text-[17px] tracking-tight" style={{ fontWeight: 750 }}>
            Padel Club <span className="text-primary">OS</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {navLinkKeys.map((link) => {
            const activo =
              link.href.startsWith("/") && pathname.startsWith(link.href)
            const clase = cn(
              "text-sm font-semibold transition-colors",
              activo
                ? "text-foreground"
                : "text-secondary-foreground hover:text-foreground"
            )
            return link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                aria-current={activo ? "page" : undefined}
                className={cn(clase, activo && "border-b-2 border-primary pb-0.5")}
              >
                {t(link.key)}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className={clase}>
                {t(link.key)}
              </a>
            )
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3.5 md:flex">
          <LanguageSelector />
          <Link
            href="/login"
            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            {t("login")}
          </Link>
          <Link
            href="/demo?source=navbar"
            className="rounded-[var(--radius-control)] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("tryFree")}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-11 w-11 items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        aria-hidden={!mobileOpen}
        className={cn(
          "overflow-hidden bg-background transition-all duration-200 md:hidden",
          mobileOpen ? "max-h-96 border-t border-border" : "max-h-0"
        )}
      >
        <div className="container flex flex-col gap-4 py-4">
          {navLinkKeys.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-secondary-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-secondary-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </a>
            )
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/login"
              className="rounded-[var(--radius-control)] border border-border px-4 py-2.5 text-center text-sm font-semibold text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t("login")}
            </Link>
            <Link
              href="/demo?source=navbar"
              className="rounded-[var(--radius-control)] bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t("tryFree")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
