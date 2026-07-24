"use client"

import { useState } from "react"
import type { BugReportCategory, BugReportStatus, UserRole } from "@prisma/client"
import { ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

interface ReportRow {
  id: string
  category: BugReportCategory
  status: BugReportStatus
  title: string
  description: string
  pageUrl: string | null
  viewport: string | null
  userAgent: string | null
  createdAt: string
  resolvedAt: string | null
  club: { name: string; slug: string }
  user: { name: string | null; email: string | null; role: UserRole }
}

const STATUSES: BugReportStatus[] = [
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]

export function BugReportsClient({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = useState(initialReports)
  const [updating, setUpdating] = useState<string | null>(null)

  const changeStatus = async (id: string, status: BugReportStatus) => {
    setUpdating(id)
    try {
      const response = await fetch(`/api/bug-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "No se pudo actualizar.")
      setReports((current) =>
        current.map((report) => report.id === id ? { ...report, status } : report),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay reportes recibidos.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_210px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{report.category}</Badge>
                <Badge variant={report.status === "NEW" ? "destructive" : "secondary"}>
                  {report.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString("es-ES")}
                </span>
              </div>
              <h2 className="mt-3 font-semibold">{report.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {report.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{report.club.name}</span>
                <span>{report.user.name || report.user.email || "Usuario"}</span>
                <span>{report.user.role}</span>
                {report.viewport && <span>{report.viewport}</span>}
                {report.pageUrl && (
                  <a
                    href={report.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {report.pageUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor={`status-${report.id}`} className="text-xs font-medium">
                Estado
              </label>
              <div className="flex items-center gap-2">
                <select
                  id={`status-${report.id}`}
                  value={report.status}
                  disabled={updating === report.id}
                  onChange={(event) =>
                    changeStatus(report.id, event.target.value as BugReportStatus)
                  }
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {updating === report.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
