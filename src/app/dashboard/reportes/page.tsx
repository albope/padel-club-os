import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { BugReportsClient } from "@/components/platform/BugReportsClient"

export default async function BugReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || !hasPermission(session.user.role, "platform:read")) {
    redirect("/dashboard")
  }

  const reports = await db.bugReport.findMany({
    include: {
      club: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes de la plataforma</h1>
        <p className="text-muted-foreground">
          Feedback contextual enviado por administradores y jugadores.
        </p>
      </div>
      <BugReportsClient initialReports={JSON.parse(JSON.stringify(reports))} />
    </div>
  )
}
