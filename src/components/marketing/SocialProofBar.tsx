import { getTranslations } from "next-intl/server"

const beneficioKeys = [
  { titleKey: "item1Title", descKey: "item1Desc" },
  { titleKey: "item2Title", descKey: "item2Desc" },
  { titleKey: "item3Title", descKey: "item3Desc" },
  { titleKey: "item4Title", descKey: "item4Desc" },
] as const

/** Mini-marcador: rect verde con chip, gesto de marca reutilizado del mock */
function MiniMarcador() {
  return (
    <div className="relative h-6 w-[34px] rounded-[var(--radius-control)] border-2 border-primary" aria-hidden="true">
      <div className="absolute bottom-1 left-1 top-1 w-2 rounded-[2px] bg-primary" />
    </div>
  )
}

export default async function SocialProofBar() {
  const t = await getTranslations("marketing.socialProof")

  return (
    <section className="container pb-16 md:pb-24">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {beneficioKeys.map((b) => (
          <div
            key={b.titleKey}
            className="grid content-start gap-2 rounded-[var(--radius-module)] border border-border bg-surface-raised p-5"
          >
            <MiniMarcador />
            <h3 className="mt-1 font-display text-[15px] font-bold">{t(b.titleKey)}</h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{t(b.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
