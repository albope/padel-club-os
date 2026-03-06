'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings2, LayoutGrid, Users, Calendar, Check, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import ImportPistasClient from '@/components/pistas/ImportPistasClient'
import ImportSociosClient from '@/components/socios/ImportSociosClient'
import ImportReservasClient from '@/components/migracion/ImportReservasClient'

interface MigracionWizardProps {
  club: {
    bookingDuration: number
    maxAdvanceBooking: number
    cancellationHours: number
    enableOpenMatches: boolean
    enablePlayerBooking: boolean
  }
  courtCount: number
  memberCount: number
}

const PASOS = [
  { nameKey: 'migration.stepConfig', icono: Settings2 },
  { nameKey: 'migration.stepCourts', icono: LayoutGrid },
  { nameKey: 'migration.stepMembers', icono: Users },
  { nameKey: 'migration.stepBookings', icono: Calendar },
]

const MigracionWizard: React.FC<MigracionWizardProps> = ({ club, courtCount, memberCount }) => {
  const router = useRouter()
  const t = useTranslations()
  const [pasoActual, setPasoActual] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Paso 0: Config
  const [bookingDuration, setBookingDuration] = useState(String(club.bookingDuration))
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState(String(club.maxAdvanceBooking))
  const [cancellationHours, setCancellationHours] = useState(String(club.cancellationHours))
  const [enableOpenMatches, setEnableOpenMatches] = useState(club.enableOpenMatches)
  const [enablePlayerBooking, setEnablePlayerBooking] = useState(club.enablePlayerBooking)

  // Contadores actualizables
  const [courts, setCourts] = useState(courtCount)
  const [members, setMembers] = useState(memberCount)

  const avanzar = () => setPasoActual(prev => Math.min(prev + 1, PASOS.length - 1))
  const retroceder = () => setPasoActual(prev => Math.max(prev - 1, 0))

  const guardarConfig = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/club', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingDuration: parseInt(bookingDuration),
          maxAdvanceBooking: parseInt(maxAdvanceBooking),
          cancellationHours: parseInt(cancellationHours),
          enableOpenMatches,
          enablePlayerBooking,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast({ title: t('migration.configSaved'), variant: "success" })
      avanzar()
    } catch {
      toast({ title: "Error", description: t('migration.configError'), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const completedSteps = [
    true, // config siempre tiene datos (pre-populated)
    courts > 0,
    members > 0,
    false, // reservas se importan al final
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {PASOS.map((paso, index) => {
          const Icon = paso.icono
          const isCompleted = completedSteps[index] && index < pasoActual
          const isCurrent = index === pasoActual
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className={cn("h-0.5 w-8 sm:w-12", isCompleted ? "bg-primary" : "bg-muted")} />
              )}
              <button
                onClick={() => setPasoActual(index)}
                className="flex flex-col items-center gap-1"
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted ? "bg-primary text-primary-foreground" :
                  isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-xs hidden sm:block",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {t(paso.nameKey)}
                </span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Paso 0: Config basica */}
      {pasoActual === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('migration.configTitle')}</CardTitle>
            <CardDescription>{t('migration.configDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bookingDuration">{t('migration.bookingDuration')}</Label>
                <Select value={bookingDuration} onValueChange={setBookingDuration}>
                  <SelectTrigger className="mt-1.5" id="bookingDuration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxAdvance">{t('migration.maxAdvanceBooking')}</Label>
                <Input
                  id="maxAdvance"
                  type="number"
                  min="1"
                  max="90"
                  value={maxAdvanceBooking}
                  onChange={(e) => setMaxAdvanceBooking(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="cancellation">{t('migration.cancellationHours')}</Label>
                <Input
                  id="cancellation"
                  type="number"
                  min="0"
                  max="48"
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t('migration.enablePlayerBooking')}</p>
                  <p className="text-xs text-muted-foreground">{t('migration.enablePlayerBookingDesc')}</p>
                </div>
                <Switch checked={enablePlayerBooking} onCheckedChange={setEnablePlayerBooking} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t('migration.enableOpenMatches')}</p>
                  <p className="text-xs text-muted-foreground">{t('migration.enableOpenMatchesDesc')}</p>
                </div>
                <Switch checked={enableOpenMatches} onCheckedChange={setEnableOpenMatches} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 1: Pistas */}
      {pasoActual === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('migration.courtsTitle')}</CardTitle>
            <CardDescription>
              {courts > 0
                ? t('migration.courtsExisting', { count: courts })
                : t('migration.courtsEmpty')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportPistasClient />
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Socios */}
      {pasoActual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('migration.membersTitle')}</CardTitle>
            <CardDescription>
              {members > 0
                ? t('migration.membersExisting', { count: members })
                : t('migration.membersEmpty')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportSociosClient />
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Reservas */}
      {pasoActual === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('migration.bookingsTitle')}</CardTitle>
            <CardDescription>{t('migration.bookingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {courts === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">{t('migration.bookingsNeedCourts')}</p>
                <Button variant="link" onClick={() => setPasoActual(1)} className="mt-2">
                  {t('migration.goToCourts')}
                </Button>
              </div>
            ) : (
              <ImportReservasClient />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navegacion */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {pasoActual > 0 && (
            <Button variant="outline" onClick={retroceder}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('migration.previous')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {pasoActual < PASOS.length - 1 && pasoActual > 0 && (
            <Button variant="ghost" size="sm" onClick={avanzar} className="text-muted-foreground">
              {t('migration.skip')}
            </Button>
          )}

          {pasoActual === 0 && (
            <Button onClick={guardarConfig} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('migration.saveAndContinue')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {pasoActual > 0 && pasoActual < PASOS.length - 1 && (
            <Button onClick={() => {
              // Refresco de contadores al avanzar
              fetch('/api/club', { method: 'GET' }).then(r => r.json()).then(data => {
                if (data.courtCount !== undefined) setCourts(data.courtCount)
                if (data.memberCount !== undefined) setMembers(data.memberCount)
              }).catch(() => {})
              avanzar()
            }}>
              {t('migration.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {pasoActual === PASOS.length - 1 && (
            <Button onClick={() => router.push('/dashboard')}>
              {t('migration.complete')}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MigracionWizard
