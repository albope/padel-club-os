"use client"

import { useState, useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RECURSOS_AUDITORIA, ACCIONES_AUDITORIA } from "@/lib/audit"
import type { RecursoAuditoria, AccionAuditoria } from "@/lib/audit"

interface AuditLogItem {
  id: string
  recurso: string
  accion: string
  entidadId: string | null
  detalles: Record<string, unknown> | null
  userId: string | null
  userName: string | null
  origen: string
  clubId: string | null
  clubName: string | null
  createdAt: string
}

interface AuditLogClientProps {
  initialLogs: AuditLogItem[]
  initialTotal: number
}

const LIMITE = 50

const coloresRecurso: Record<string, string> = {
  booking: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  court: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  user: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  club: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "recurring-booking": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  broadcast: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

const coloresOrigen: Record<string, string> = {
  usuario: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  sistema: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cron: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
}

export default function AuditLogClient({ initialLogs, initialTotal }: AuditLogClientProps) {
  const t = useTranslations("audit")
  const locale = useLocale()
  const localeCode = locale === "es" ? "es-ES" : "en-GB"

  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [cargando, setCargando] = useState(false)

  // Filtros
  const [recurso, setRecurso] = useState<string>("_all")
  const [accion, setAccion] = useState<string>("_all")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE))

  const buscar = useCallback(async (paginaObj?: { pagina?: number; rec?: string; acc?: string; d?: string; h?: string }) => {
    const p = paginaObj?.pagina ?? page
    const rec = paginaObj?.rec ?? recurso
    const acc = paginaObj?.acc ?? accion
    const d = paginaObj?.d ?? desde
    const h = paginaObj?.h ?? hasta

    setCargando(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMITE) })
      if (rec && rec !== "_all") params.set("recurso", rec)
      if (acc && acc !== "_all") params.set("accion", acc)
      if (d) params.set("desde", d)
      if (h) params.set("hasta", h)

      const res = await fetch(`/api/audit-log?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
        setPage(data.page)
      }
    } finally {
      setCargando(false)
    }
  }, [page, recurso, accion, desde, hasta])

  const cambiarFiltro = (campo: string, valor: string) => {
    const nuevaPagina = 1
    if (campo === "recurso") {
      setRecurso(valor)
      setPage(1)
      buscar({ pagina: nuevaPagina, rec: valor })
    } else if (campo === "accion") {
      setAccion(valor)
      setPage(1)
      buscar({ pagina: nuevaPagina, acc: valor })
    } else if (campo === "desde") {
      setDesde(valor)
      setPage(1)
      buscar({ pagina: nuevaPagina, d: valor })
    } else if (campo === "hasta") {
      setHasta(valor)
      setPage(1)
      buscar({ pagina: nuevaPagina, h: valor })
    }
  }

  const irAPagina = (p: number) => {
    setPage(p)
    buscar({ pagina: p })
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString(localeCode, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearDetalles = (detalles: Record<string, unknown> | null) => {
    if (!detalles) return "-"
    const entries = Object.entries(detalles)
    if (entries.length === 0) return "-"
    return entries
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(", ")}`
        return `${k}: ${String(v)}`
      })
      .join(" | ")
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filtro-recurso">{t("filtros.recurso")}</Label>
          <Select value={recurso} onValueChange={(v) => cambiarFiltro("recurso", v)}>
            <SelectTrigger id="filtro-recurso">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t("filtros.todos")}</SelectItem>
              {RECURSOS_AUDITORIA.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`recursos.${r}` as `recursos.${RecursoAuditoria}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-accion">{t("filtros.accion")}</Label>
          <Select value={accion} onValueChange={(v) => cambiarFiltro("accion", v)}>
            <SelectTrigger id="filtro-accion">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t("filtros.todas")}</SelectItem>
              {ACCIONES_AUDITORIA.map((a) => (
                <SelectItem key={a} value={a}>
                  {t(`acciones.${a}` as `acciones.${AccionAuditoria}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-desde">{t("filtros.desde")}</Label>
          <Input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => cambiarFiltro("desde", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-hasta">{t("filtros.hasta")}</Label>
          <Input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => cambiarFiltro("hasta", e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{t("columnas.fecha")}</TableHead>
              <TableHead scope="col">{t("columnas.origen")}</TableHead>
              <TableHead scope="col">{t("columnas.recurso")}</TableHead>
              <TableHead scope="col">{t("columnas.accion")}</TableHead>
              <TableHead scope="col">{t("columnas.usuario")}</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">{t("columnas.detalles")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("vacio")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className={cargando ? "opacity-50" : ""}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatearFecha(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={coloresOrigen[log.origen] ?? ""}>
                      {t(`origenes.${log.origen}` as "origenes.usuario" | "origenes.sistema" | "origenes.cron")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={coloresRecurso[log.recurso] ?? ""}>
                      {t(`recursos.${log.recurso}` as `recursos.${RecursoAuditoria}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t(`acciones.${log.accion}` as `acciones.${AccionAuditoria}`)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.userName ?? t("sistema")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-xs truncate">
                    {formatearDetalles(log.detalles)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginacion */}
      {total > LIMITE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {t("paginacion.registros")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || cargando}
              onClick={() => irAPagina(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("paginacion.anterior")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} {t("paginacion.de")} {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPaginas || cargando}
              onClick={() => irAPagina(page + 1)}
            >
              {t("paginacion.siguiente")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
