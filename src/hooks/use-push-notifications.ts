'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Convertir VAPID key de base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { data: session } = useSession();
  const [soportado, setSoportado] = useState(false);
  const [permiso, setPermiso] = useState<NotificationPermission>('default');
  const [suscrito, setSuscrito] = useState(false);

  useEffect(() => {
    setSoportado('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermiso(Notification.permission);
    }
  }, []);

  // Verificar si ya esta suscrito
  useEffect(() => {
    if (!soportado || !session?.user) return;

    navigator.serviceWorker.ready.then((registro) => {
      registro.pushManager.getSubscription().then((sub) => {
        setSuscrito(!!sub);
      });
    });
  }, [soportado, session]);

  const suscribirse = useCallback(async () => {
    if (!soportado) return false;

    try {
      // Pedir permiso
      const resultado = await Notification.requestPermission();
      setPermiso(resultado);
      if (resultado !== 'granted') return false;

      // Obtener VAPID key del servidor
      const resKey = await fetch('/api/notifications/vapid-key');
      if (!resKey.ok) return false;
      const { publicKey } = await resKey.json();

      // Suscribirse en el Push Manager
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Enviar suscripcion al servidor
      const subJson = suscripcion.toJSON();
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (res.ok) {
        setSuscrito(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[PUSH_SUSCRIPCION_ERROR]", error);
      return false;
    }
  }, [soportado]);

  const desuscribirse = useCallback(async () => {
    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        const endpoint = suscripcion.endpoint;
        await suscripcion.unsubscribe();
        await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: 'DELETE',
        });
      }
      setSuscrito(false);
      return true;
    } catch (error) {
      console.error("[PUSH_DESUSCRIPCION_ERROR]", error);
      return false;
    }
  }, []);

  return {
    soportado,
    permiso,
    suscrito,
    suscribirse,
    desuscribirse,
  };
}
