import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { SkipToContent } from "@/components/layout/SkipToContent"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <Navbar />
      <main id="contenido-principal" className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
