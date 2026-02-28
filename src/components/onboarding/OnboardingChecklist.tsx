'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Copy, Eye, EyeOff, Rocket, Building2, LayoutGrid, DollarSign, Palette, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface PasoOnboarding {
  id: string
  completado: boolean
  href: string
}

interface OnboardingChecklistProps {
  pasos: PasoOnboarding[]
  clubSlug: string
}

const PASO_CONFIG: Record<string, { titulo: string; descripcion: string; icono: React.ElementType }> = {
  clubInfo: {
    titulo: 'Completar informacion del club',
    descripcion: 'Añade descripcion, telefono o email de contacto',
    icono: Building2,
  },
  createCourt: {
    titulo: 'Crear al menos una pista',
    descripcion: 'Añade las pistas de tu club para recibir reservas',
    icono: LayoutGrid,
  },
  configurePricing: {
    titulo: 'Configurar precios',
    descripcion: 'Establece precios por pista y franja horaria',
    icono: DollarSign,
  },
  customizePortal: {
    titulo: 'Personalizar portal',
    descripcion: 'Sube el logo o banner y personaliza los colores',
    icono: Palette,
  },
  invitePlayers: {
    titulo: 'Invitar jugadores',
    descripcion: 'Comparte el enlace del portal con tus socios',
    icono: UserPlus,
  },
}

const STORAGE_KEY = 'onboarding-checklist-oculto'

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ pasos, clubSlug }) => {
  // Inicializar oculto como null para evitar flash de hidratacion
  const [oculto, setOculto] = useState<boolean | null>(null)

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY)
    setOculto(guardado === 'true')
  }, [])

  const completados = pasos.filter(p => p.completado).length
  const total = pasos.length
  const todosCompletos = completados === total
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0

  const handleOcultar = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOculto(true)
  }

  const handleMostrar = () => {
    localStorage.removeItem(STORAGE_KEY)
    setOculto(false)
  }

  const handleCopiarEnlace = async () => {
    const url = `${window.location.origin}/club/${clubSlug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Enlace copiado", description: "El enlace del portal ha sido copiado al portapapeles." })
    } catch {
      toast({ title: "Error", description: "No se pudo copiar el enlace.", variant: "destructive" })
    }
  }

  // Durante SSR o antes de leer localStorage, no renderizar nada
  if (oculto === null) return null

  // Si todos completos, no mostrar
  if (todosCompletos) return null

  // Si oculto, mostrar solo un link para re-mostrar
  if (oculto) {
    return (
      <button
        onClick={handleMostrar}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Eye className="h-4 w-4" />
        Mostrar pasos de configuracion ({completados}/{total})
      </button>
    )
  }

  return (
    <Card>
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Configura tu club</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {completados} de {total} pasos completados
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleOcultar} className="text-muted-foreground">
            <EyeOff className="h-4 w-4 mr-1" />
            Ocultar
          </Button>
        </div>
        {/* Barra de progreso */}
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {pasos.map((paso, index) => {
            const config = PASO_CONFIG[paso.id]
            if (!config) return null
            const Icon = config.icono
            const esInvitar = paso.id === 'invitePlayers'

            const contenido = (
              <li
                key={paso.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-3 py-3 transition-colors",
                  !paso.completado && !esInvitar && "hover:bg-muted cursor-pointer",
                  paso.completado && "opacity-60"
                )}
              >
                {/* Indicador */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  paso.completado
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  {paso.completado ? <Check className="h-4 w-4" /> : index + 1}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    paso.completado && "line-through text-muted-foreground"
                  )}>
                    {config.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{config.descripcion}</p>
                </div>

                {/* Accion */}
                {!paso.completado && esInvitar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleCopiarEnlace()
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar enlace
                  </Button>
                )}
                {!paso.completado && !esInvitar && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </li>
            )

            if (!paso.completado && !esInvitar && paso.href) {
              return (
                <Link key={paso.id} href={paso.href} className="block">
                  {contenido}
                </Link>
              )
            }

            return <React.Fragment key={paso.id}>{contenido}</React.Fragment>
          })}
        </ul>

        {/* CTA Configuracion guiada */}
        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/configuracion-inicial">
              <Rocket className="h-4 w-4 mr-2" />
              Configuracion guiada
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnboardingChecklist
