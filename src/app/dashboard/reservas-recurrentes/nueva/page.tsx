import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import RecurringBookingForm from "@/components/reservas-recurrentes/RecurringBookingForm"

export default async function NuevaReservaRecurrentePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/login")

  const [courts, users] = await Promise.all([
    db.court.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reservas-recurrentes" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Reserva Recurrente</h1>
          <p className="mt-1 text-muted-foreground">
            Configura una clase fija que se reservara automaticamente cada semana.
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <RecurringBookingForm
          courts={JSON.parse(JSON.stringify(courts))}
          users={JSON.parse(JSON.stringify(users))}
        />
      </Card>
    </div>
  )
}
