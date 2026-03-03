import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import RecurringBookingForm from "@/components/reservas-recurrentes/RecurringBookingForm"

export default async function EditarReservaRecurrentePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/login")
  const { id } = await params

  const [recurringBooking, courts, users] = await Promise.all([
    db.recurringBooking.findFirst({
      where: { id, clubId: session.user.clubId },
    }),
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

  if (!recurringBooking) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/reservas-recurrentes" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Volver a reservas recurrentes
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Reserva recurrente no encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            La reserva recurrente no existe o no pertenece a tu club.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reservas-recurrentes" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Reserva Recurrente</h1>
          <p className="mt-1 text-muted-foreground">
            Modificando &quot;{recurringBooking.description || `Clase del ${['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][recurringBooking.dayOfWeek]}`}&quot;
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <RecurringBookingForm
          courts={JSON.parse(JSON.stringify(courts))}
          users={JSON.parse(JSON.stringify(users))}
          recurringBooking={JSON.parse(JSON.stringify(recurringBooking))}
        />
      </Card>
    </div>
  )
}
