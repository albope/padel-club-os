'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, Loader2, CheckCircle2, AlertCircle, CreditCard, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

interface StripeConnectCardProps {
  subscriptionTier: string | null
}

interface ConnectStatus {
  accountId: string | null
  onboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export default function StripeConnectCard({ subscriptionTier }: StripeConnectCardProps) {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)

  const canUseOnline = subscriptionTier === 'pro' || subscriptionTier === 'enterprise'

  useEffect(() => {
    if (!canUseOnline) {
      setIsLoading(false)
      return
    }

    fetch('/api/stripe/connect/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudo consultar el estado de Stripe Connect.', variant: 'destructive' })
      })
      .finally(() => setIsLoading(false))
  }, [canUseOnline])

  const handleOnboarding = async () => {
    setIsActioning(true)
    try {
      const res = await fetch('/api/stripe/connect/onboarding', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo iniciar la conexion.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexion.', variant: 'destructive' })
    } finally {
      setIsActioning(false)
    }
  }

  const handleDashboard = async () => {
    setIsActioning(true)
    try {
      const res = await fetch('/api/stripe/connect/dashboard', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo abrir el dashboard.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexion.', variant: 'destructive' })
    } finally {
      setIsActioning(false)
    }
  }

  // Plan no compatible
  if (!canUseOnline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos online de reservas
          </CardTitle>
          <CardDescription>
            Recibe pagos de tus jugadores directamente al reservar pista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Los pagos online estan disponibles en los planes Pro y Enterprise.
              Actualiza tu plan para aceptar pagos online de tus jugadores.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="#pricing-plans">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Ver planes
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos online de reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sin cuenta creada
  if (!status?.accountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos online de reservas
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta bancaria para recibir pagos online de tus jugadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm">
                Al conectar tu cuenta de Stripe, tus jugadores podran pagar las reservas online.
                Los fondos se transfieren directamente a tu cuenta bancaria.
              </p>
              <p className="text-xs text-muted-foreground">
                Comision de la plataforma: 5% por transaccion
              </p>
            </div>
            <Button onClick={handleOnboarding} disabled={isActioning} className="w-full sm:w-auto">
              {isActioning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Conectar cuenta de Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Verificacion pendiente
  if (!status.onboarded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagos online de reservas
            </CardTitle>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Verificacion pendiente
            </Badge>
          </div>
          <CardDescription>
            Completa la verificacion de tu cuenta para empezar a recibir pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu cuenta de Stripe esta creada pero la verificacion no se ha completado.
              Haz clic en el boton para continuar donde lo dejaste.
            </p>
            <Button onClick={handleOnboarding} disabled={isActioning}>
              {isActioning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Completar verificacion
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Cuenta activa
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos online de reservas
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pagos activos
          </Badge>
        </div>
        <CardDescription>
          Tu cuenta de Stripe esta configurada y lista para recibir pagos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Cobros</p>
              <p className="text-sm font-medium flex items-center gap-1">
                {status.chargesEnabled ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Habilitados</>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Pendiente</>
                )}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Transferencias</p>
              <p className="text-sm font-medium flex items-center gap-1">
                {status.payoutsEnabled ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Habilitadas</>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Pendiente</>
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Comision de la plataforma: 5% por transaccion. Los fondos se transfieren a tu cuenta bancaria segun el calendario de Stripe.
          </p>
          <Button variant="outline" onClick={handleDashboard} disabled={isActioning}>
            {isActioning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Dashboard de Stripe
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
