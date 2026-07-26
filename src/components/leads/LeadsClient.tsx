'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import EmptyState from '@/components/onboarding/EmptyState'
import { Inbox, Loader2, Mail, MailOpen, Send } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export interface LeadItem {
  id: string
  nombre: string
  email: string
  asunto: string
  mensaje: string
  leido: boolean
  tipo: string | null
  clubNombre: string | null
  numeroPistas: number | null
  softwareActual: string | null
  urgencia: string | null
  paginaOrigen: string | null
  utmSource: string | null
  createdAt: string
}

interface LeadsClientProps {
  initialLeads: LeadItem[]
}

type FiltroTipo = 'todas' | 'demo' | 'general' | 'no-leidas'

const URGENCIA_LABELS: Record<string, { label: string; className: string }> = {
  urgente: { label: 'Urgente', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  'proximo-mes': { label: 'Próximo mes', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  explorando: { label: 'Explorando', className: 'bg-muted text-muted-foreground' },
}

const SOFTWARE_LABELS: Record<string, string> = {
  ninguno: 'Sin software',
  matchpoint: 'TPC Matchpoint',
  playtomic: 'Playtomic',
  doinsport: 'Doinsport',
  otro: 'Otro software',
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [filtro, setFiltro] = useState<FiltroTipo>('todas')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [replyLead, setReplyLead] = useState<LeadItem | null>(null)
  const [replySubject, setReplySubject] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const filtradas = useMemo(() => {
    switch (filtro) {
      case 'demo':
        return leads.filter(l => l.tipo === 'demo')
      case 'general':
        return leads.filter(l => l.tipo !== 'demo')
      case 'no-leidas':
        return leads.filter(l => !l.leido)
      default:
        return leads
    }
  }, [leads, filtro])

  const noLeidas = leads.filter(l => !l.leido).length

  const toggleLeido = async (lead: LeadItem) => {
    setLoadingId(lead.id)
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido: !lead.leido }),
      })
      if (!response.ok) throw new Error()
      setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, leido: !lead.leido } : l)))
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar la solicitud.', variant: 'destructive' })
    } finally {
      setLoadingId(null)
    }
  }

  const openReply = (lead: LeadItem) => {
    const firstName = lead.nombre.trim().split(/\s+/)[0] || lead.nombre
    setReplyLead(lead)
    setReplySubject(`Re: ${lead.asunto || 'Tu solicitud en Padel Club OS'}`)
    setReplyMessage(`Hola ${firstName},\n\n`)
  }

  const closeReply = () => {
    if (sendingReply) return
    setReplyLead(null)
    setReplySubject('')
    setReplyMessage('')
  }

  const sendReply = async () => {
    if (!replyLead || !replySubject.trim() || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      const response = await fetch(`/api/leads/${replyLead.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asunto: replySubject.trim(),
          mensaje: replyMessage.trim(),
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo enviar el email.')
      }

      setLeads(prev => prev.map(lead => (
        lead.id === replyLead.id ? { ...lead, leido: true } : lead
      )))
      toast({
        title: 'Email enviado',
        description: `La respuesta se ha enviado a ${replyLead.email}.`,
      })
      setReplyLead(null)
      setReplySubject('')
      setReplyMessage('')
    } catch (error) {
      toast({
        title: 'No se pudo enviar',
        description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as FiltroTipo)}>
        <TabsList>
          <TabsTrigger value="todas">Todas ({leads.length})</TabsTrigger>
          <TabsTrigger value="demo">Demos ({leads.filter(l => l.tipo === 'demo').length})</TabsTrigger>
          <TabsTrigger value="general">Contacto ({leads.filter(l => l.tipo !== 'demo').length})</TabsTrigger>
          <TabsTrigger value="no-leidas">No leídas ({noLeidas})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin solicitudes"
          description="Cuando llegue una solicitud de demo o un mensaje de contacto aparecerá aquí."
        />
      ) : (
        <div className="space-y-4">
          {filtradas.map(lead => {
            const urgencia = lead.urgencia ? URGENCIA_LABELS[lead.urgencia] : null
            return (
              <Card key={lead.id} className={`p-4 sm:p-5 ${lead.leido ? 'opacity-70' : 'border-primary/40'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{lead.nombre}</span>
                      <Badge variant={lead.tipo === 'demo' ? 'default' : 'secondary'}>
                        {lead.tipo === 'demo' ? 'Solicitud de demo' : 'Contacto'}
                      </Badge>
                      {urgencia && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencia.className}`}>
                          {urgencia.label}
                        </span>
                      )}
                      {!lead.leido && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Nueva
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {lead.email}
                      </a>
                      <span>
                        {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleLeido(lead)}
                    disabled={loadingId === lead.id}
                  >
                    {lead.leido ? (
                      <>
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        Marcar no leída
                      </>
                    ) : (
                      <>
                        <MailOpen className="h-4 w-4" aria-hidden="true" />
                        Marcar leída
                      </>
                    )}
                  </Button>
                </div>

                {lead.tipo === 'demo' && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    {lead.clubNombre && (
                      <span><span className="text-muted-foreground">Club:</span> {lead.clubNombre}</span>
                    )}
                    {lead.numeroPistas != null && (
                      <span><span className="text-muted-foreground">Pistas:</span> {lead.numeroPistas}</span>
                    )}
                    {lead.softwareActual && (
                      <span>
                        <span className="text-muted-foreground">Software:</span>{' '}
                        {SOFTWARE_LABELS[lead.softwareActual] ?? lead.softwareActual}
                      </span>
                    )}
                    {lead.paginaOrigen && (
                      <span><span className="text-muted-foreground">Origen:</span> {lead.paginaOrigen}</span>
                    )}
                  </div>
                )}

                {lead.mensaje && (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{lead.mensaje}</p>
                )}

                <div className="mt-3">
                  <Button size="sm" onClick={() => openReply(lead)}>
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Responder por email
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={replyLead !== null} onOpenChange={(open) => !open && closeReply()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Responder por email</DialogTitle>
            <DialogDescription>
              {replyLead
                ? `La respuesta se enviará a ${replyLead.nombre} (${replyLead.email}).`
                : 'Prepara la respuesta a esta solicitud.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reply-subject">Asunto</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(event) => setReplySubject(event.target.value)}
                maxLength={160}
                disabled={sendingReply}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-message">Mensaje</Label>
              <Textarea
                id="reply-message"
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                rows={10}
                maxLength={10_000}
                disabled={sendingReply}
                autoFocus
              />
              <p className="text-right text-xs text-muted-foreground">
                {replyMessage.length}/10.000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeReply} disabled={sendingReply}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={sendReply}
              disabled={sendingReply || !replySubject.trim() || !replyMessage.trim()}
            >
              {sendingReply ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {sendingReply ? 'Enviando...' : 'Enviar respuesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
