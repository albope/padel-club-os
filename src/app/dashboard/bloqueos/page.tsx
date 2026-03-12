import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import BloqueosClient from "@/components/bloqueos/BloqueosClient"

export default async function BloqueosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/dashboard")

  const courtBlocks = await db.courtBlock.findMany({
    where: { clubId: session.user.clubId },
    include: {
      court: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bloqueos de Pista</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona cierres temporales, festivos, mantenimiento y eventos.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/bloqueos/nuevo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nuevo bloqueo
          </Link>
        </Button>
      </div>

      <BloqueosClient
        initialItems={JSON.parse(JSON.stringify(courtBlocks))}
      />
    </div>
  )
}
