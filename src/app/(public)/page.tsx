import Hero from "@/components/marketing/Hero"
import SocialProofBar from "@/components/marketing/SocialProofBar"
import PainPoints from "@/components/marketing/PainPoints"
import Features from "@/components/marketing/Features"
import HowItWorks from "@/components/marketing/HowItWorks"
import Pricing from "@/components/marketing/Pricing"
import FAQ from "@/components/marketing/FAQ"
import CTA from "@/components/marketing/CTA"

export default function LandingPage() {
  return (
    <>
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
