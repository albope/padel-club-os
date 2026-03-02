import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ComunicacionClient from "@/components/comunicacion/ComunicacionClient"

export default async function ComunicacionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/dashboard")

  // Solo admins pueden ver esta pagina
  if (!["SUPER_ADMIN", "CLUB_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const broadcasts = await db.broadcast.findMany({
    where: { clubId: session.user.clubId },
    include: { sentBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicacion</h1>
          <p className="text-muted-foreground">
            Envia comunicados a los socios de tu club por push y email.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/comunicacion/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo envio
          </Link>
        </Button>
      </div>

      <ComunicacionClient
        initialBroadcasts={JSON.parse(JSON.stringify(broadcasts))}
      />
    </div>
  )
}
