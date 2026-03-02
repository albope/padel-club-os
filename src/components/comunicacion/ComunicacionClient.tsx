"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import EmptyState from "@/components/onboarding/EmptyState"
import { Megaphone, Mail, Bell, Users, Clock, CheckCircle2, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface BroadcastItem {
  id: string
  title: string
  message: string
  channels: string
  segment: string
  recipientCount: number
  status: string
  createdAt: string
  sentBy: { name: string | null }
}

interface ComunicacionClientProps {
  initialBroadcasts: BroadcastItem[]
}

function etiquetaSegmento(segment: string): string {
  if (segment === "all") return "Todos"
  if (segment === "active") return "Activos"
  if (segment === "inactive") return "Inactivos"
  if (segment.startsWith("level:")) return `Nivel ${segment.split(":")[1]}`
  return segment
}

function BadgeCanal({ channels }: { channels: string }) {
  const incluyePush = channels.includes("push")
  const incluyeEmail = channels.includes("email")

  return (
    <div className="flex gap-1">
      {incluyePush && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Bell className="h-3 w-3" />
          Push
        </Badge>
      )}
      {incluyeEmail && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Mail className="h-3 w-3" />
          Email
        </Badge>
      )}
    </div>
  )
}

function BadgeEstado({ status }: { status: string }) {
  if (status === "sent") {
    return (
      <Badge variant="default" className="text-xs gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Enviado
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Clock className="h-3 w-3 animate-spin" />
      Enviando
    </Badge>
  )
}

export default function ComunicacionClient({ initialBroadcasts }: ComunicacionClientProps) {
  if (initialBroadcasts.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Sin comunicaciones"
        description="Envia comunicados a los socios de tu club por push y email."
        actionLabel="Primer envio"
        actionHref="/dashboard/comunicacion/nuevo"
      />
    )
  }

  return (
    <div className="space-y-1">
      {initialBroadcasts.map((broadcast, index) => (
        <div key={broadcast.id}>
          <div className="flex flex-col gap-2 py-4 px-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{broadcast.title}</h3>
                <BadgeEstado status={broadcast.status} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{broadcast.message}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {broadcast.recipientCount} destinatarios
                </span>
                <Badge variant="outline" className="text-xs">
                  {etiquetaSegmento(broadcast.segment)}
                </Badge>
                <BadgeCanal channels={broadcast.channels} />
                <span>
                  {formatDistanceToNow(new Date(broadcast.createdAt), { addSuffix: true, locale: es })}
                </span>
                {broadcast.sentBy.name && (
                  <span>por {broadcast.sentBy.name}</span>
                )}
              </div>
            </div>
          </div>
          {index < initialBroadcasts.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}
