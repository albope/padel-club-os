import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CourtBlockForm from "@/components/bloqueos/CourtBlockForm"

export default async function NuevoBloqueoPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/login")

  const courts = await db.court.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/bloqueos" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Bloqueo</h1>
          <p className="mt-1 text-muted-foreground">
            Bloquea una pista o todo el club para un horario especifico.
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <CourtBlockForm
          courts={JSON.parse(JSON.stringify(courts))}
        />
      </Card>
    </div>
  )
}
