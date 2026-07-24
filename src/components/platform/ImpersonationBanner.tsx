'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function ImpersonationBanner() {
  const { data: session } = useSession()
  const [stopping, setStopping] = useState(false)

  if (!session?.user?.actorId) return null

  const stop = async () => {
    setStopping(true)
    try {
      const response = await fetch('/api/platform/impersonation/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'No se pudo finalizar el acceso.')
      window.location.assign(body.redirectUrl || '/dashboard/accesos')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo recuperar tu sesión',
        description: error instanceof Error ? error.message : 'Vuelve a intentarlo.',
      })
      setStopping(false)
    }
  }

  return (
    <div
      role="status"
      className="relative z-[70] flex min-h-11 items-center justify-center gap-3 border-b border-warning-border bg-warning-bg px-4 py-2 text-sm text-warning-foreground"
    >
      <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Acceso de soporte como <strong>{session.user.name || session.user.email}</strong>.
        {session.user.impersonationReadOnly ? ' Modo solo lectura.' : ''}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 border-warning-border bg-surface-raised/70 text-warning-foreground hover:bg-surface-raised"
        disabled={stopping}
        onClick={stop}
      >
        {stopping ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LogOut className="mr-1.5 h-3.5 w-3.5" />}
        Volver a soporte
      </Button>
    </div>
  )
}
