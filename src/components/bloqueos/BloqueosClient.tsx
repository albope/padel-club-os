'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ShieldBan, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import EmptyState from '@/components/onboarding/EmptyState'

const MOTIVO_LABEL: Record<string, string> = {
  MAINTENANCE: 'Mantenimiento',
  HOLIDAY: 'Festivo',
  EVENT: 'Evento',
  OTHER: 'Otro',
}

const MOTIVO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  MAINTENANCE: 'default',
  HOLIDAY: 'secondary',
  EVENT: 'outline',
  OTHER: 'secondary',
}

interface CourtBlockItem {
  id: string
  reason: string
  note: string | null
  startTime: string
  endTime: string
  courtId: string | null
  court: { name: string } | null
  createdBy: { name: string | null } | null
  createdAt: string
}

interface BloqueosClientProps {
  initialItems: CourtBlockItem[]
}

type FilterType = 'upcoming' | 'past'

function formatFechaHora(fecha: string, localeCode: string): string {
  const d = new Date(fecha)
  return d.toLocaleDateString(localeCode, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString(localeCode, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BloqueosClient({ initialItems }: BloqueosClientProps) {
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<FilterType>('upcoming')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
  }>({ open: false, title: '', description: '', action: async () => {} })

  const now = new Date()
  const upcomingItems = useMemo(() => items.filter(i => new Date(i.endTime) > now), [items])
  const pastItems = useMemo(() => items.filter(i => new Date(i.endTime) <= now), [items])
  const filteredItems = filter === 'upcoming' ? upcomingItems : pastItems

  const handleDelete = (item: CourtBlockItem) => {
    const label = item.court?.name || 'Todas las pistas'
    setConfirmDialog({
      open: true,
      title: 'Eliminar bloqueo',
      description: `¿Seguro que quieres eliminar el bloqueo de "${label}"? Las reservas ya canceladas se mantendran.`,
      action: async () => {
        setLoadingId(item.id)
        try {
          const response = await fetch(`/api/court-blocks/${item.id}`, { method: 'DELETE' })
          if (!response.ok && response.status !== 204) {
            throw new Error('Error al eliminar.')
          }
          setItems((prev) => prev.filter((i) => i.id !== item.id))
          toast({
            title: "Bloqueo eliminado",
            description: "El bloqueo ha sido eliminado correctamente.",
            variant: "success",
          })
          router.refresh()
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error desconocido'
          toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
          setLoadingId(null)
        }
      },
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={ShieldBan}
            title="Sin bloqueos"
            description="Crea tu primer bloqueo para impedir reservas en horarios especificos (mantenimiento, festivos, eventos)."
            actionLabel="Crear primer bloqueo"
            actionHref="/dashboard/bloqueos/nuevo"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="upcoming">Proximos ({upcomingItems.length})</TabsTrigger>
              <TabsTrigger value="past">Pasados ({pastItems.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="p-6">
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {filter === 'upcoming' ? 'No hay bloqueos proximos.' : 'No hay bloqueos pasados.'}
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Separator />}
                  <li className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                    <Link
                      href={`/dashboard/bloqueos/${item.id}`}
                      className="flex-grow min-w-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg shrink-0">
                          <ShieldBan className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary truncate">
                            {item.court?.name || 'Todas las pistas'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatFechaHora(item.startTime, localeCode)} - {formatFechaHora(item.endTime, localeCode)}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <Badge variant={MOTIVO_VARIANT[item.reason] || 'secondary'}>
                              {MOTIVO_LABEL[item.reason] || item.reason}
                            </Badge>
                            {item.note && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.note}
                              </span>
                            )}
                            {item.createdBy?.name && (
                              <span className="text-xs text-muted-foreground">
                                por {item.createdBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                      {loadingId === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/bloqueos/${item.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(item)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
              onClick={async () => {
                await confirmDialog.action()
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
