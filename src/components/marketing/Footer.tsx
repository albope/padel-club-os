import Link from "next/link"
import { getTranslations } from "next-intl/server"

/** Isotipo «Marcador» sobre tinta: stroke cream (currentColor), chip verde */
function IsotipoFooter() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true">
      <rect x="4" y="10" width="40" height="28" rx="7" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="16" width="13" height="16" rx="3" className="fill-sidebar-primary" />
    </svg>
  )
}

export default async function Footer() {
  const t = await getTranslations("marketing.footer")

  const columnas = [
    {
      titulo: t("product"),
      links: [
        { label: t("features"), href: "/#funcionalidades" },
        { label: t("pricing"), href: "/#precios" },
        { label: t("howItWorks"), href: "/#como-funciona" },
      ],
    },
    {
      titulo: t("company"),
      links: [
        { label: t("about"), href: "/sobre-nosotros" },
        { label: t("blog"), href: "/blog" },
        { label: t("contact"), href: "/contacto" },
      ],
    },
    {
      titulo: t("legal"),
      links: [
        { label: t("legalNotice"), href: "/aviso-legal" },
        { label: t("privacy"), href: "/privacidad" },
        { label: t("terms"), href: "/terminos" },
        { label: t("dpa"), href: "/acuerdo-tratamiento-datos" },
        { label: t("cookies"), href: "/cookies" },
        { label: t("securePayment"), href: "/pago-seguro" },
      ],
    },
  ]

  const redes = [
    { label: "Twitter", href: "https://twitter.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Instagram", href: "https://instagram.com" },
  ]

  return (
    <footer className="club-section-dark">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Marca */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sidebar-primary-foreground"
            >
              <IsotipoFooter />
              <span className="font-display text-base tracking-tight" style={{ fontWeight: 750 }}>
                Padel Club <span className="text-sidebar-primary">OS</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-sidebar-foreground">
              {t("tagline")}
            </p>
            <div className="mt-4 flex gap-3.5 font-mono text-[11px]">
              {redes.map((red) => (
                <a
                  key={red.label}
                  href={red.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sidebar-foreground transition-colors hover:text-sidebar-primary-foreground"
                >
                  {red.label}
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de links */}
          {columnas.map((col) => (
            <div key={col.titulo}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                {col.titulo}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-sidebar-foreground transition-colors hover:text-sidebar-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-sidebar-border pt-5 font-mono text-[11px] text-sidebar-foreground/70 sm:flex-row sm:items-center">
          <span>
            &copy; {new Date().getFullYear()} {t("copyright")}
          </span>
          <span>{t("madeIn")}</span>
        </div>
      </div>
    </footer>
  )
}
