import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import AuditLogClient from "@/components/audit-log/AuditLogClient"
import { getTranslations } from "next-intl/server"

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect("/dashboard")

  // Solo admins pueden ver esta pagina
  if (!session.user.role || !["SUPER_ADMIN", "CLUB_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const t = await getTranslations("audit")

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.auditLog.count({
      where: { clubId: session.user.clubId },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="text-muted-foreground">{t("descripcion")}</p>
      </div>

      <AuditLogClient
        initialLogs={JSON.parse(JSON.stringify(logs))}
        initialTotal={total}
      />
    </div>
  )
}
