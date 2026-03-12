import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CourtBlockForm from "@/components/bloqueos/CourtBlockForm"

export default async function EditarBloqueoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/login")
  const { id } = await params

  const [courtBlock, courts] = await Promise.all([
    db.courtBlock.findFirst({
      where: { id, clubId: session.user.clubId },
      select: {
        id: true,
        reason: true,
        note: true,
        startTime: true,
        endTime: true,
        courtId: true,
      },
    }),
    db.court.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!courtBlock) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/bloqueos" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Volver a bloqueos
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Bloqueo no encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            El bloqueo no existe o no pertenece a tu club.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/bloqueos" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Bloqueo</h1>
          <p className="mt-1 text-muted-foreground">
            Modifica los detalles del bloqueo.
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <CourtBlockForm
          courts={JSON.parse(JSON.stringify(courts))}
          courtBlock={JSON.parse(JSON.stringify(courtBlock))}
        />
      </Card>
    </div>
  )
}
