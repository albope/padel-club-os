import { Metadata } from "next"
import Hero from "@/components/marketing/Hero"
import SocialProofBar from "@/components/marketing/SocialProofBar"
import PainPoints from "@/components/marketing/PainPoints"
import Features from "@/components/marketing/Features"
import HowItWorks from "@/components/marketing/HowItWorks"
import Pricing from "@/components/marketing/Pricing"
import FAQ from "@/components/marketing/FAQ"
import CTA from "@/components/marketing/CTA"
import { SITE_URL, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Padel Club OS - Gestion de clubes de padel",
  description:
    "La plataforma de gestion para clubes de padel en Espana. Reservas online, ligas, rankings ELO, partidas abiertas y mucho mas. Prueba gratis 14 dias.",
  openGraph: {
    title: "Padel Club OS - Gestion de clubes de padel",
    description:
      "La plataforma de gestion para clubes de padel en Espana. Reservas online, ligas, rankings ELO, partidas abiertas y mucho mas.",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  description:
    "Plataforma de gestion para clubes de padel en Espana. Reservas online, ligas, rankings, partidas abiertas y mas.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "contacto@padelclubos.com",
    contactType: "customer service",
    availableLanguage: "Spanish",
  },
  sameAs: [],
}

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "19",
    highPrice: "99",
    priceCurrency: "EUR",
    offerCount: "3",
  },
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <Hero />
      <SocialProofBar />
      <PainPoints />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  )
}
