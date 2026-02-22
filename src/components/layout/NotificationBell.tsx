'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CalendarDays, Users, Newspaper, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Notificacion {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Icono segun tipo de notificacion
function iconoPorTipo(tipo: string) {
  switch (tipo) {
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'booking_reminder':
      return CalendarDays;
    case 'open_match_created':
    case 'open_match_full':
    case 'open_match_joined':
      return Users;
    case 'news_published':
      return Newspaper;
    case 'competition_result':
      return Trophy;
    default:
      return Bell;
  }
}

// Formato relativo de tiempo
function tiempoRelativo(fecha: string): string {
  const ahora = new Date();
  const notif = new Date(fecha);
  const diffMs = ahora.getTime() - notif.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return notif.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

interface NotificationBellProps {
  urlBase?: string;
}

export function NotificationBell({ urlBase = '' }: NotificationBellProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limite=15');
      if (!res.ok) return;
      const datos = await res.json();
      setNotificaciones(datos.notificaciones);
      setSinLeer(datos.sinLeer);
    } catch {
      // Silenciar errores de red
    }
  }, []);

  // Cargar al montar y polling cada 30s
  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(intervalo);
  }, [cargarNotificaciones]);

  // Recargar al abrir el popover
  useEffect(() => {
    if (abierto) cargarNotificaciones();
  }, [abierto, cargarNotificaciones]);

  const marcarTodasLeidas = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })));
      setSinLeer(0);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron marcar como leidas.', variant: 'destructive' });
    }
  };

  const clickNotificacion = async (notif: Notificacion) => {
    // Marcar como leida
    if (!notif.read) {
      fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' }).catch(() => {});
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setSinLeer((prev) => Math.max(0, prev - 1));
    }

    // Navegar a la URL
    const url = notif.metadata?.url as string | undefined;
    if (url) {
      setAbierto(false);
      router.push(urlBase + url);
    }
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {sinLeer > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {sinLeer > 9 ? '9+' : sinLeer}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          {sinLeer > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={marcarTodasLeidas}
            >
              <Check className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[320px]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            notificaciones.map((notif) => {
              const Icono = iconoPorTipo(notif.type);
              return (
                <button
                  key={notif.id}
                  onClick={() => clickNotificacion(notif)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    !notif.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icono className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    <p className={cn('text-sm leading-tight', !notif.read && 'font-medium')}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {tiempoRelativo(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
