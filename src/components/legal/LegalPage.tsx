import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface LegalPageProps {
  title: string
  version: string
  updatedAt: string
  description?: string
  children: React.ReactNode
}

export function LegalPage({ title, version, updatedAt, description, children }: LegalPageProps) {
  return (
    <div className="container max-w-4xl py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-4 max-w-3xl text-muted-foreground">{description}</p>}
      <p className="mt-3 text-sm text-muted-foreground">
        Versión {version} · Última actualización: {updatedAt}
      </p>

      <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  )
}
