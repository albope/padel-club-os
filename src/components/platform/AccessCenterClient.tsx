'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, ExternalLink, Eye, Loader2, Search, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

export interface SupportAccess {
  membershipId: string
  userId: string
  userName: string
  userEmail: string
  role: 'CLUB_ADMIN' | 'STAFF' | 'PLAYER'
  clubId: string
  clubName: string
  clubSlug: string
  isDemo: boolean
  isPublished: boolean
}

const ROLE_LABELS: Record<SupportAccess['role'], string> = {
  CLUB_ADMIN: 'Administrador',
  STAFF: 'Personal',
  PLAYER: 'Jugador',
}

export function AccessCenterClient({ accesses }: { accesses: SupportAccess[] }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SupportAccess | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    if (!normalized) return accesses
    return accesses.filter((access) =>
      [access.clubName, access.clubSlug, access.userName, access.userEmail, access.role]
        .some((value) => value.toLocaleLowerCase('es').includes(normalized))
    )
  }, [accesses, query])

  const start = async () => {
    if (!selected || reason.trim().length < 10) return
    setLoading(true)
    try {
      const response = await fetch('/api/platform/impersonation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.userId,
          clubId: selected.clubId,
          reason: reason.trim(),
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'No se pudo iniciar el acceso.')
      window.location.assign(body.redirectUrl)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Acceso no iniciado',
        description: error instanceof Error ? error.message : 'Vuelve a intentarlo.',
      })
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="p-4">
        <Label htmlFor="support-search" className="sr-only">Buscar acceso</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="support-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar club, persona, correo o rol…"
            className="pl-9"
          />
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.map((access) => (
          <Card key={access.membershipId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              {access.role === 'PLAYER'
                ? <UserRound className="h-5 w-5" />
                : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{access.userName}</p>
                <Badge variant="secondary">{ROLE_LABELS[access.role]}</Badge>
                {access.isDemo && <Badge>Demo</Badge>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{access.userEmail}</p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {access.clubName}
                {!access.isPublished && <span className="text-warning-foreground">(borrador)</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline" size="sm">
                <Link href={`/club/${access.clubSlug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Portal
                </Link>
              </Button>
              <Button type="button" size="sm" onClick={() => {
                setSelected(access)
                setReason('')
              }}>
                <Eye className="mr-1.5 h-4 w-4" />
                Acceder
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No hay accesos activos que coincidan con la búsqueda.
          </Card>
        )}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && !loading && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso temporal de soporte</DialogTitle>
            <DialogDescription>
              Verás la plataforma como {selected?.userName} en {selected?.clubName}. El acceso caduca
              en 30 minutos, es de solo lectura y queda auditado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-reason">Motivo del acceso</Label>
            <Textarea
              id="support-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder="Ej.: revisar la incidencia comunicada por el cliente…"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Mínimo 10 caracteres. No incluyas contraseñas.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={loading} onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={loading || reason.trim().length < 10} onClick={start}>
              {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Iniciar acceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
