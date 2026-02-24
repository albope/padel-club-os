"use client"

import React from "react"
import { AlertTriangle, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SubscriptionBannerProps {
  subscriptionStatus: string | null
  trialEndsAt: string | null
}

export default function SubscriptionBanner({
  subscriptionStatus,
  trialEndsAt,
}: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = React.useState(false)

  const status = subscriptionStatus ?? "trialing"

  // Calcular dias restantes de trial
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  // Solo mostrar banner en estos casos
  const showTrialWarning = status === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 3
  const showTrialExpired = status === "trialing" && trialDaysLeft === 0
  const showPastDue = status === "past_due"
  const showCanceled = status === "canceled"

  if (!showTrialWarning && !showPastDue && !showCanceled) return null

  // No permitir cerrar banners criticos (trial expirado, cancelado)
  const isCritical = showTrialExpired || showCanceled
  if (dismissed && !isCritical) return null

  const bannerConfig = showPastDue
    ? {
        icon: AlertTriangle,
        message: "Tu pago ha fallado. Actualiza tu metodo de pago para evitar la interrupcion del servicio.",
        variant: "destructive" as const,
      }
    : showCanceled
      ? {
          icon: XCircle,
          message: "Tu suscripcion ha sido cancelada. Renueva tu plan para recuperar el acceso completo al dashboard.",
          variant: "destructive" as const,
        }
      : showTrialExpired
        ? {
            icon: XCircle,
            message: "Tu prueba gratuita ha expirado. Elige un plan para continuar usando la plataforma.",
            variant: "destructive" as const,
          }
        : {
            icon: Clock,
            message: `Tu prueba gratuita termina en ${trialDaysLeft} dia${trialDaysLeft !== 1 ? "s" : ""}. Elige un plan para continuar sin interrupciones.`,
            variant: "warning" as const,
          }

  const Icon = bannerConfig.icon

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-4",
        bannerConfig.variant === "destructive"
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <p className="flex-1">{bannerConfig.message}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button asChild size="sm" variant={bannerConfig.variant === "destructive" ? "destructive" : "default"}>
          <Link href="/dashboard/facturacion">
            {showCanceled || showTrialExpired ? "Elegir plan" : showPastDue ? "Actualizar pago" : "Ver planes"}
          </Link>
        </Button>
        {!isCritical && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  )
}
