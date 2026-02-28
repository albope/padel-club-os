'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LayoutGrid, DollarSign, PartyPopper, Check, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface SetupWizardProps {
  club: {
    name: string
    slug: string
    description: string | null
    phone: string | null
    email: string | null
    openingTime: string | null
    closingTime: string | null
  }
  existingCourts: { id: string; name: string; type: string }[]
}

type PistaLocal = { id: string; name: string; type: string }

const PASOS = [
  { titulo: 'Informacion', icono: Building2 },
  { titulo: 'Pistas', icono: LayoutGrid },
  { titulo: 'Precios', icono: DollarSign },
  { titulo: 'Listo', icono: PartyPopper },
]

const SetupWizard: React.FC<SetupWizardProps> = ({ club, existingCourts }) => {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Paso 1: Info club
  const [description, setDescription] = useState(club.description || '')
  const [phone, setPhone] = useState(club.phone || '')
  const [email, setEmail] = useState(club.email || '')

  // Paso 2: Pistas
  const [pistas, setPistas] = useState<PistaLocal[]>(existingCourts)
  const [nuevaPistaName, setNuevaPistaName] = useState('')
  const [nuevaPistaType, setNuevaPistaType] = useState('Cristal')

  // Paso 3: Precios
  const [precioPorHora, setPrecioPorHora] = useState('')

  const avanzar = () => setPasoActual(prev => Math.min(prev + 1, PASOS.length - 1))
  const retroceder = () => setPasoActual(prev => Math.max(prev - 1, 0))

  // --- Paso 1: Guardar info del club ---
  const guardarInfoClub = async () => {
    if (!description.trim() && !phone.trim() && !email.trim()) {
      toast({ title: "Aviso", description: "Rellena al menos un campo para continuar.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/club', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), phone: phone.trim(), email: email.trim() }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast({ title: "Informacion guardada", description: "Los datos del club se han actualizado." })
      avanzar()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la informacion del club.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // --- Paso 2: Crear pista ---
  const crearPista = async () => {
    if (!nuevaPistaName.trim()) {
      toast({ title: "Error", description: "El nombre de la pista es obligatorio.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nuevaPistaName.trim(), type: nuevaPistaType }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al crear pista')
      }
      const nueva = await res.json()
      setPistas(prev => [...prev, { id: nueva.id, name: nueva.name, type: nueva.type }])
      setNuevaPistaName('')
      toast({ title: "Pista creada", description: `"${nueva.name}" ha sido añadida.` })
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear la pista.'
      toast({ title: "Error", description: mensaje, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // --- Paso 3: Guardar precios ---
  const guardarPrecios = async () => {
    const precio = parseFloat(precioPorHora)
    if (isNaN(precio) || precio <= 0) {
      toast({ title: "Error", description: "Introduce un precio valido mayor que 0.", variant: "destructive" })
      return
    }
    if (pistas.length === 0) {
      toast({ title: "Error", description: "No hay pistas configuradas. Vuelve al paso anterior.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const openHour = parseInt(club.openingTime?.split(':')[0] || '9')
      const closeHour = parseInt(club.closingTime?.split(':')[0] || '23')

      // Generar reglas para todas las horas y todos los dias
      const rules: { dayOfWeek: number; startHour: number; endHour: number; price: number }[] = []
      for (let dia = 0; dia <= 6; dia++) {
        for (let hora = openHour; hora < closeHour; hora++) {
          rules.push({ dayOfWeek: dia, startHour: hora, endHour: hora + 1, price: precio })
        }
      }

      // Aplicar a todas las pistas en paralelo
      const resultados = await Promise.allSettled(
        pistas.map(pista =>
          fetch(`/api/courts/${pista.id}/pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rules }),
          })
        )
      )

      const fallos = resultados.filter(r => r.status === 'rejected').length
      if (fallos > 0) {
        toast({ title: "Aviso", description: `Precios guardados parcialmente. ${fallos} pista(s) con error.`, variant: "destructive" })
      } else {
        toast({ title: "Precios configurados", description: `${precio}€/hora aplicado a ${pistas.length} pista(s).` })
      }
      avanzar()
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los precios.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopiarEnlace = async () => {
    const url = `${window.location.origin}/club/${club.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Enlace copiado", description: "El enlace del portal ha sido copiado al portapapeles." })
    } catch {
      toast({ title: "Error", description: "No se pudo copiar el enlace.", variant: "destructive" })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {PASOS.map((paso, index) => {
          const Icon = paso.icono
          const isCompleted = index < pasoActual
          const isCurrent = index === pasoActual
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className={cn("h-0.5 w-8 sm:w-16", isCompleted ? "bg-primary" : "bg-muted")} />
              )}
              <div className="flex flex-col items-center gap-1">
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
                  {paso.titulo}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Contenido del paso actual */}
      {pasoActual === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informacion del club</CardTitle>
            <CardDescription>Datos basicos que veran tus jugadores en el portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descripcion del club</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu club en unas lineas..."
                className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] resize-y"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="612 345 678"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email de contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@miclub.com"
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pasoActual === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pistas de tu club</CardTitle>
            <CardDescription>Añade las pistas disponibles. Podras editar o añadir mas desde el panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de pistas existentes */}
            {pistas.length > 0 && (
              <div className="space-y-2">
                {pistas.map((pista) => (
                  <div key={pista.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{pista.name}</p>
                      <p className="text-xs text-muted-foreground">{pista.type}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Formulario para añadir nueva pista */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Añadir nueva pista</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="courtName">Nombre</Label>
                  <Input
                    id="courtName"
                    value={nuevaPistaName}
                    onChange={(e) => setNuevaPistaName(e.target.value)}
                    placeholder="Ej: Pista 1"
                    className="mt-1.5"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        crearPista()
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="courtType">Tipo</Label>
                  <Select value={nuevaPistaType} onValueChange={setNuevaPistaType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cristal">Cristal</SelectItem>
                      <SelectItem value="Muro">Muro</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={crearPista}
                disabled={isLoading || !nuevaPistaName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Añadir pista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pasoActual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Precios basicos</CardTitle>
            <CardDescription>
              Establece un precio base por hora. Podras personalizar por dia y franja horaria despues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price">Precio por hora (EUR)</Label>
              <div className="relative mt-1.5">
                <Input
                  id="price"
                  type="number"
                  step="0.5"
                  min="0"
                  value={precioPorHora}
                  onChange={(e) => setPrecioPorHora(e.target.value)}
                  placeholder="20"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€/h</span>
              </div>
            </div>

            {pistas.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Se aplicara a {pistas.length} pista{pistas.length !== 1 ? 's' : ''}: {pistas.map(p => p.name).join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Horario: {club.openingTime || '09:00'} - {club.closingTime || '23:00'} · Todos los dias de la semana
                </p>
              </div>
            )}

            {pistas.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay pistas configuradas. Vuelve al paso anterior para crear al menos una.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {pasoActual === 3 && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">¡Tu club esta listo!</CardTitle>
            <CardDescription>
              Has completado la configuracion basica. Ahora comparte el portal con tus jugadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enlace del portal */}
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Enlace del portal de tu club</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/club/{club.slug}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopiarEnlace}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Resumen de configuracion</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Informacion del club actualizada
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {pistas.length} pista{pistas.length !== 1 ? 's' : ''} configurada{pistas.length !== 1 ? 's' : ''}
                </li>
                {precioPorHora && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Precio base: {precioPorHora}€/hora
                  </li>
                )}
              </ul>
            </div>

            {/* Siguientes pasos */}
            <div>
              <p className="text-sm font-medium mb-2">Siguientes pasos</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Comparte el enlace del portal con tus socios</li>
                <li>• Personaliza precios por dia y franja horaria desde Pistas</li>
                <li>• Sube el logo y banner de tu club en Ajustes</li>
                <li>• Crea tu primera competicion</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegacion */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {pasoActual > 0 && pasoActual < 3 && (
            <Button variant="outline" onClick={retroceder}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Saltar */}
          {pasoActual > 0 && pasoActual < 3 && (
            <Button variant="ghost" size="sm" onClick={avanzar} className="text-muted-foreground">
              Saltar este paso
            </Button>
          )}

          {/* Siguiente/Guardar */}
          {pasoActual === 0 && (
            <Button onClick={guardarInfoClub} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {pasoActual === 1 && (
            <Button onClick={avanzar} disabled={pistas.length === 0}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {pasoActual === 2 && (
            <Button onClick={guardarPrecios} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Finalizar configuracion
            </Button>
          )}
          {pasoActual === 3 && (
            <Button onClick={() => router.push('/dashboard')}>
              Ir al dashboard
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
