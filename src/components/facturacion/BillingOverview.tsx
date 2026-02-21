"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PaymentRecord {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

interface BillingOverviewProps {
  subscriptionTier: string
  subscriptionStatus: string | null
  trialEndsAt: string | null
  hasStripeCustomer: boolean
  payments: PaymentRecord[]
}

const tierNames: Record<string, string> = {
  essential: "Essential",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activo", variant: "default" },
  trialing: { label: "Prueba gratuita", variant: "secondary" },
  past_due: { label: "Pago pendiente", variant: "destructive" },
  canceled: { label: "Cancelado", variant: "destructive" },
  unpaid: { label: "Impago", variant: "destructive" },
}

export default function BillingOverview({
  subscriptionTier,
  subscriptionStatus,
  trialEndsAt,
  hasStripeCustomer,
  payments,
}: BillingOverviewProps) {
  const [loading, setLoading] = React.useState(false)

  const status = subscriptionStatus ?? "trialing"
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const }

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const handleOpenPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
        return
      }

      window.location.href = data.url
    } catch {
      toast({ title: "Error", description: "No se pudo abrir el portal de facturacion", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan actual
              </CardTitle>
              <CardDescription>
                Tu plan de suscripcion y estado de facturacion
              </CardDescription>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{tierNames[subscriptionTier] ?? subscriptionTier}</p>
              {status === "trialing" && trialDaysLeft !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  {trialDaysLeft > 0
                    ? `Tu prueba gratuita termina en ${trialDaysLeft} dia${trialDaysLeft !== 1 ? "s" : ""}`
                    : "Tu prueba gratuita ha expirado"}
                </p>
              )}
            </div>
            {hasStripeCustomer && (
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                disabled={loading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {loading ? "Abriendo..." : "Gestionar facturacion"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>Ultimos pagos de tu suscripcion</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aun no hay pagos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.amount.toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "succeeded" ? "default" : "destructive"}>
                        {payment.status === "succeeded" ? "Pagado" : "Fallido"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
