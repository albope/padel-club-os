import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import LeadsClient from "@/components/leads/LeadsClient"

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || !hasPermission(session.user.role, "leads:read")) {
    redirect("/dashboard")
  }

  const leads = await db.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solicitudes</h1>
        <p className="text-muted-foreground">
          Solicitudes de demo y mensajes de contacto recibidos desde la web.
        </p>
      </div>

      <LeadsClient initialLeads={JSON.parse(JSON.stringify(leads))} />
    </div>
  )
}
