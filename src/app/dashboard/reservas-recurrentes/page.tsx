import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import ReservasRecurrentesClient from "@/components/reservas-recurrentes/ReservasRecurrentesClient"

export default async function ReservasRecurrentesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/dashboard")

  const recurringBookings = await db.recurringBooking.findMany({
    where: { clubId: session.user.clubId },
    include: {
      court: { select: { name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservas Recurrentes</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona las clases fijas y reservas automaticas semanales de tu club.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reservas-recurrentes/nueva">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva reserva recurrente
          </Link>
        </Button>
      </div>

      <ReservasRecurrentesClient
        initialItems={JSON.parse(JSON.stringify(recurringBookings))}
      />
    </div>
  )
}
