import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import BroadcastForm from "@/components/comunicacion/BroadcastForm"

export default async function NuevaComunicacionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/dashboard")

  if (!["SUPER_ADMIN", "CLUB_ADMIN"].includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/comunicacion" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo envio</h1>
          <p className="text-muted-foreground">
            Compone y envia un comunicado a los socios de tu club.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <BroadcastForm />
        </CardContent>
      </Card>
    </div>
  )
}
