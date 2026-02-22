'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { toast } from '@/hooks/use-toast';

export function PushNotificationPrompt() {
  const { soportado, permiso, suscrito, suscribirse } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo si: soportado, no suscrito, permiso no denegado, no descartado previamente
    if (!soportado || suscrito || permiso === 'denied') return;

    const descartado = localStorage.getItem('push_prompt_descartado');
    if (descartado) return;

    // Mostrar despues de 3 segundos
    const timeout = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timeout);
  }, [soportado, suscrito, permiso]);

  if (!visible) return null;

  const activar = async () => {
    const exito = await suscribirse();
    if (exito) {
      toast({ title: 'Notificaciones activadas', description: 'Recibiras alertas de tus reservas y partidas.', variant: 'success' });
      setVisible(false);
    } else {
      toast({ title: 'Error', description: 'No se pudieron activar las notificaciones.', variant: 'destructive' });
    }
  };

  const descartar = () => {
    localStorage.setItem('push_prompt_descartado', 'true');
    setVisible(false);
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border bg-card p-3 text-sm shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium">Activa las notificaciones</p>
        <p className="text-xs text-muted-foreground">
          Recibe alertas de reservas, partidas y noticias del club.
        </p>
      </div>
      <Button size="sm" onClick={activar}>
        Activar
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={descartar}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
