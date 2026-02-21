import React from "react"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CourtPricingForm from "@/components/pistas/CourtPricingForm"

interface CourtPricingPageProps {
  params: {
    courtId: string
  }
}

const CourtPricingPage = async ({ params }: CourtPricingPageProps) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.clubId) {
    redirect("/login")
  }

  const court = await db.court.findFirst({
    where: {
      id: params.courtId,
      clubId: session.user.clubId,
    },
  })

  if (!court) {
    return (
      <div>
        <h1>Pista no encontrada</h1>
        <p className="text-muted-foreground">
          La pista que buscas no existe o no pertenece a tu club.
        </p>
      </div>
    )
  }

  const club = await db.club.findUnique({
    where: { id: session.user.clubId },
    select: { openingTime: true, closingTime: true },
  })

  const pricings = await db.courtPricing.findMany({
    where: { courtId: params.courtId, clubId: session.user.clubId },
    orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/pistas/${params.courtId}`}>
          <span className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Precios - {court.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Configura los precios por dia y franja horaria.
          </p>
        </div>
      </div>

      <CourtPricingForm
        courtId={params.courtId}
        openingHour={parseInt(club?.openingTime?.split(":")[0] ?? "9")}
        closingHour={parseInt(club?.closingTime?.split(":")[0] ?? "23")}
        initialPricings={pricings.map((p) => ({
          dayOfWeek: p.dayOfWeek,
          startHour: p.startHour,
          endHour: p.endHour,
          price: p.price,
        }))}
      />
    </div>
  )
}

export default CourtPricingPage
