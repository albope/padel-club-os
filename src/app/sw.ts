/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Declaracion de tipos para el service worker
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
} & SerwistGlobalConfig;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Manejar notificaciones push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const datos = event.data.json();
    const opciones: NotificationOptions = {
      body: datos.message || datos.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: datos.tag || "padel-notificacion",
      data: {
        url: datos.url || "/",
      },
    };

    event.waitUntil(
      self.registration.showNotification(datos.title || "Padel Club OS", opciones)
    );
  } catch (error) {
    console.error("[SW_PUSH_ERROR]", error);
  }
});

// Al hacer clic en una notificacion, abrir la URL correspondiente
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientes) => {
      for (const cliente of clientes) {
        if (cliente.url.includes(url) && "focus" in cliente) {
          return cliente.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

serwist.addEventListeners();
