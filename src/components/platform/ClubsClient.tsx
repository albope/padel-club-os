'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  Building2,
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react'

export interface ClubItem {
  id: string
  name: string
  slug: string
  subscriptionTier: string
  subscriptionStatus: string | null
  trialEndsAt: string | null
  esDemo: boolean
  stripeSubscriptionId: string | null
  _count: { courts: number; members: number; bookings: number }
}

interface ResultadoDemo {
  clubId: string
  clubName: string
  slug: string
  adminEmail: string
  adminPassword: string
  playerEmail: string
  playerName: string
  playerPassword: string
  contadores: { pistas: number; socios: number; reservas: number }
}

interface ClubsClientProps {
  initialClubs: ClubItem[]
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  essential: 'Essential (legado)',
}

function estadoClub(club: ClubItem): { label: string; className: string } {
  const status = club.subscriptionStatus ?? 'trialing'
  if (status === 'active') {
    return { label: 'Activo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
  }
  if (status === 'trialing') {
    if (!club.trialEndsAt) {
      return { label: 'Trial', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    }
    const diasRestantes = Math.ceil(
      (new Date(club.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (diasRestantes > 0) {
      return { label: `Trial (${diasRestantes}d)`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    }
    return { label: 'Trial caducado', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  }
  return { label: 'Cancelado', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
}

function BotonCopiar({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      aria-label={`Copiar ${etiqueta}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1500)
        } catch {
          toast({ title: 'Error', description: 'No se pudo copiar.', variant: 'destructive' })
        }
      }}
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

export default function ClubsClient({ initialClubs }: ClubsClientProps) {
  const [clubs, setClubs] = useState(initialClubs)
  const [busqueda, setBusqueda] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Dialog generador de demos
  const [demoDialogOpen, setDemoDialogOpen] = useState(false)
  const [demoNombre, setDemoNombre] = useState('')
  const [demoPistas, setDemoPistas] = useState('2')
  const [demoSocios, setDemoSocios] = useState('12')
  const [creandoDemo, setCreandoDemo] = useState(false)
  const [resultadoDemo, setResultadoDemo] = useState<ResultadoDemo | null>(null)

  // Confirmacion reutilizable
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
  }>({ open: false, title: '', description: '', action: async () => {} })

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clubs
    return clubs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    )
  }, [clubs, busqueda])

  const patchClub = async (
    club: ClubItem,
    cambios: Record<string, unknown>,
    mensajeExito: string
  ) => {
    setLoadingId(club.id)
    try {
      const response = await fetch(`/api/platform/clubs/${club.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Error al actualizar')
      }
      const actualizado = await response.json()
      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, ...actualizado } : c))
      )
      toast({ title: 'Hecho', description: mensajeExito, variant: 'success' })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al actualizar el club.',
        variant: 'destructive',
      })
    } finally {
      setLoadingId(null)
    }
  }

  const eliminarDemo = (club: ClubItem) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar club demo',
      description: `¿Seguro que quieres eliminar "${club.name}" (${club.slug}) y todos sus datos y usuarios demo? Esta acción no se puede deshacer.`,
      action: async () => {
        setLoadingId(club.id)
        try {
          const response = await fetch(`/api/platform/demo-clubs/${club.id}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            const data = await response.json().catch(() => null)
            throw new Error(data?.error || 'Error al eliminar')
          }
          setClubs((prev) => prev.filter((c) => c.id !== club.id))
          toast({ title: 'Hecho', description: 'Club demo eliminado.', variant: 'success' })
        } catch (e) {
          toast({
            title: 'Error',
            description: e instanceof Error ? e.message : 'Error al eliminar el club demo.',
            variant: 'destructive',
          })
        } finally {
          setLoadingId(null)
        }
      },
    })
  }

  const crearDemo = async () => {
    if (demoNombre.trim().length < 2) {
      toast({ title: 'Error', description: 'Escribe el nombre del club.', variant: 'destructive' })
      return
    }
    setCreandoDemo(true)
    try {
      const response = await fetch('/api/platform/demo-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName: demoNombre.trim(),
          numCourts: parseInt(demoPistas, 10),
          numPlayers: parseInt(demoSocios, 10),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al crear la demo')
      setResultadoDemo(data)
      setClubs((prev) => [
        ...prev,
        {
          id: data.clubId,
          name: data.clubName,
          slug: data.slug,
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          trialEndsAt: null,
          esDemo: true,
          stripeSubscriptionId: null,
          _count: {
            courts: data.contadores.pistas,
            members: data.contadores.socios,
            bookings: data.contadores.reservas,
          },
        },
      ].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al crear la demo.',
        variant: 'destructive',
      })
    } finally {
      setCreandoDemo(false)
    }
  }

  const cerrarDialogDemo = (open: boolean) => {
    setDemoDialogOpen(open)
    if (!open) {
      setResultadoDemo(null)
      setDemoNombre('')
      setDemoPistas('2')
      setDemoSocios('12')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Label htmlFor="buscar-club" className="sr-only">
            Buscar club
          </Label>
          <Input
            id="buscar-club"
            placeholder="Buscar por nombre o slug..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button onClick={() => setDemoDialogOpen(true)}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Crear club demo
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Club</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Pistas</TableHead>
              <TableHead className="text-right">Socios</TableHead>
              <TableHead className="text-right">Reservas 30d</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <Building2 className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                  No hay clubes que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((club) => {
              const estado = estadoClub(club)
              return (
                <TableRow key={club.id} className={loadingId === club.id ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{club.name}</div>
                        <div className="text-xs text-muted-foreground">{club.slug}</div>
                      </div>
                      {club.esDemo && (
                        <Badge variant="secondary" className="shrink-0">Demo</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{TIER_LABELS[club.subscriptionTier] ?? club.subscriptionTier}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.className}`}>
                      {estado.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{club._count.courts}</TableCell>
                  <TableCell className="text-right">{club._count.members}</TableCell>
                  <TableCell className="text-right">{club._count.bookings}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Acciones de ${club.name}`}
                          disabled={loadingId === club.id}
                        >
                          {loadingId === club.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/club/${club.slug}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                            Ver portal
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Suscripción</DropdownMenuLabel>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                            Extender trial
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {[7, 30, 90].map((dias) => (
                              <DropdownMenuItem
                                key={dias}
                                onClick={() =>
                                  patchClub(club, { extenderTrialDias: dias }, `Trial extendido ${dias} días.`)
                                }
                              >
                                +{dias} días
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Cambiar estado</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(['active', 'trialing', 'canceled'] as const).map((estado) => (
                              <DropdownMenuItem
                                key={estado}
                                disabled={club.subscriptionStatus === estado}
                                onClick={() =>
                                  patchClub(club, { subscriptionStatus: estado }, `Estado cambiado a ${estado}.`)
                                }
                              >
                                {estado === 'active' ? 'Activo' : estado === 'trialing' ? 'Trial' : 'Cancelado'}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Cambiar plan</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(['starter', 'pro', 'enterprise'] as const).map((tier) => (
                              <DropdownMenuItem
                                key={tier}
                                disabled={club.subscriptionTier === tier}
                                onClick={() =>
                                  patchClub(club, { subscriptionTier: tier }, `Plan cambiado a ${TIER_LABELS[tier]}.`)
                                }
                              >
                                {TIER_LABELS[tier]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            patchClub(
                              club,
                              { esDemo: !club.esDemo },
                              club.esDemo ? 'Club desmarcado como demo.' : 'Club marcado como demo.'
                            )
                          }
                        >
                          {club.esDemo ? 'Quitar marca de demo' : 'Marcar como demo'}
                        </DropdownMenuItem>
                        {club.esDemo && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => eliminarDemo(club)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Eliminar club demo
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Los cambios de suscripción pueden tardar hasta 5 minutos en reflejarse en la sesión del
        club afectado (o al volver a iniciar sesión).
      </p>

      {/* Dialog: generador de demos */}
      <Dialog open={demoDialogOpen} onOpenChange={cerrarDialogDemo}>
        <DialogContent className="sm:max-w-lg">
          {!resultadoDemo ? (
            <>
              <DialogHeader>
                <DialogTitle>Crear club demo</DialogTitle>
                <DialogDescription>
                  Genera un club ficticio con datos realistas (reservas, socios, partidas y
                  rankings) y credenciales de admin y jugador para enseñárselo a un lead.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-nombre">Nombre del club</Label>
                  <Input
                    id="demo-nombre"
                    placeholder="Ej: Club Pádel A Coruña"
                    value={demoNombre}
                    onChange={(e) => setDemoNombre(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa el nombre del club del lead: la demo se sentirá hecha a medida.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-pistas">Pistas</Label>
                    <Select value={demoPistas} onValueChange={setDemoPistas}>
                      <SelectTrigger id="demo-pistas">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? 'pista' : 'pistas'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-socios">Socios</Label>
                    <Select value={demoSocios} onValueChange={setDemoSocios}>
                      <SelectTrigger id="demo-socios">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} socios
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={crearDemo} disabled={creandoDemo}>
                  {creandoDemo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Creando demo (puede tardar unos segundos)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Crear demo
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Demo lista: {resultadoDemo.clubName}</DialogTitle>
                <DialogDescription>
                  Guarda estas credenciales ahora — no se pueden recuperar después.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="mb-1 font-medium">Portal del club</div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/club/${resultadoDemo.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/club/${resultadoDemo.slug}`}
                    </a>
                    <BotonCopiar
                      valor={`${typeof window !== 'undefined' ? window.location.origin : ''}/club/${resultadoDemo.slug}`}
                      etiqueta="URL del portal"
                    />
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="mb-1 font-medium">Cuenta admin (dashboard en /login)</div>
                  <div className="flex items-center gap-1">
                    <code className="truncate">{resultadoDemo.adminEmail}</code>
                    <BotonCopiar valor={resultadoDemo.adminEmail} etiqueta="email admin" />
                  </div>
                  <div className="flex items-center gap-1">
                    <code>{resultadoDemo.adminPassword}</code>
                    <BotonCopiar valor={resultadoDemo.adminPassword} etiqueta="password admin" />
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="mb-1 font-medium">
                    Cuenta jugador ({resultadoDemo.playerName})
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="truncate">{resultadoDemo.playerEmail}</code>
                    <BotonCopiar valor={resultadoDemo.playerEmail} etiqueta="email jugador" />
                  </div>
                  <div className="flex items-center gap-1">
                    <code>{resultadoDemo.playerPassword}</code>
                    <BotonCopiar valor={resultadoDemo.playerPassword} etiqueta="password jugador" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {resultadoDemo.contadores.pistas} pistas · {resultadoDemo.contadores.socios}{' '}
                  socios · {resultadoDemo.contadores.reservas} reservas generadas. Podrás
                  eliminar este club desde la tabla cuando la demo termine.
                </p>
                <Button className="w-full" onClick={() => cerrarDialogDemo(false)}>
                  Entendido, credenciales guardadas
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmacion */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDialog.action()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
