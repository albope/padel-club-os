"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LogoIcon } from "@/components/ui/logo-icon"
import { LanguageSelector } from "@/components/layout/LanguageSelector"

const navLinkKeys = [
  { href: "#funcionalidades", key: "features" },
  { href: "#como-funciona", key: "howItWorks" },
  { href: "#precios", key: "pricing" },
  { href: "/blog", key: "blog" },
  { href: "/contacto", key: "contact" },
] as const

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isLanding = pathname === "/"
  const t = useTranslations('marketing.navbar')

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
      <nav aria-label="Navegacion principal" className="container flex h-16 items-center justify-between">
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
          {navLinkKeys.map((link) =>
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
                {t(link.key)}
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
                {t(link.key)}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSelector className={cn(isTransparent && "text-white/80 hover:bg-white/10 hover:text-white")} />
          <Button
            variant="ghost"
            className={cn(
              isTransparent && "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            asChild
          >
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button
            className={cn(
              isTransparent &&
                "bg-white text-slate-900 hover:bg-white/90"
            )}
            asChild
          >
            <Link href="/demo?source=navbar">{t('tryFree')}</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
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
        id="mobile-menu"
        aria-hidden={!mobileOpen}
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
          {navLinkKeys.map((link) =>
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
                {t(link.key)}
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
                {t(link.key)}
              </a>
            )
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/demo?source=navbar">{t('tryFree')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
