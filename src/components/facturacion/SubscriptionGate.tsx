"use client"

import React from "react"
import { ShieldAlert, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface SubscriptionGateProps {
  subscriptionStatus: string | null
  trialEndsAt: string | null
  children: React.ReactNode
}

/**
 * Envuelve el contenido del dashboard.
 * Si la suscripcion esta inactiva (canceled, trial expirado), muestra un bloqueo
 * con CTA para ir a facturacion. Permite acceso si esta activa o en periodo de gracia.
 */
export default function SubscriptionGate({
  subscriptionStatus,
  trialEndsAt,
  children,
}: SubscriptionGateProps) {
  const status = subscriptionStatus ?? "trialing"

  // Verificar si la suscripcion esta activa
  const isActive = status === "active" ||
    (status === "trialing" && (!trialEndsAt || new Date(trialEndsAt) > new Date()))

  // past_due: mostrar contenido con warning (ya existe SubscriptionBanner)
  const isPastDue = status === "past_due"

  // Si esta activa o en periodo de gracia, mostrar contenido normal
  if (isActive || isPastDue) {
    return <>{children}</>
  }

  // Suscripcion bloqueada: canceled, expired, trial expirado
  const isCanceled = status === "canceled"
  const isTrialExpired = status === "trialing" && trialEndsAt && new Date(trialEndsAt) <= new Date()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {isCanceled
              ? "Suscripcion cancelada"
              : isTrialExpired
                ? "Prueba gratuita finalizada"
                : "Acceso restringido"
            }
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isCanceled
              ? "Tu suscripcion ha sido cancelada. Para seguir gestionando tu club, elige un plan."
              : isTrialExpired
                ? "Tu periodo de prueba ha terminado. Elige un plan para continuar usando todas las funciones."
                : "Tu suscripcion no esta activa. Actualiza tu plan para recuperar el acceso completo."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-left space-y-2">
            <p className="font-medium text-foreground">Mientras tanto, puedes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ver y exportar tus datos existentes</li>
              <li>Acceder a la configuracion del club</li>
              <li>Gestionar tu facturacion y elegir un plan</li>
            </ul>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard/facturacion">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver planes y suscribirse
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
