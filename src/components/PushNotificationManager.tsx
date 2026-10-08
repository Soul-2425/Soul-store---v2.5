"use client";

import { useEffect, useState } from "react";

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

export const DEFAULT_VAPID_PUBLIC_KEY =
  "BHMT_to0ViXP-2jqt3MSXODstv5Xqq7YsdaouWOeLRtKPsC6AXl6WAqGqSYovGXRVtGk86A4JO7M2tzjS_rfZkI";

// Convertir base64 VAPID a Uint8Array
export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Suscribir el dispositivo actual a Web Push y sincronizar con la BD
 */
export async function subscribeCurrentDevice(isAdmin: boolean = false, clientUserId?: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return {
      success: false,
      error: "Web Push no soportado en este navegador. En iPhone/iPad requiere 'Compartir > Agregar a pantalla de inicio'.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Permiso de notificaciones no concedido en el navegador." };
    }

    // Asegurar que el Service Worker esté registrado
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    // Esperar activación activa con timeout de seguridad
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado al conectar Service Worker.")), 6000)
      ),
    ]);

    const activeReg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
    const appServerKey = urlBase64ToUint8Array(vapidKey);

    let sub = await activeReg.pushManager.getSubscription();

    if (!sub) {
      try {
        sub = await activeReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      } catch (subErr) {
        console.warn("[WebPush] Primer intento de suscripción falló, reintentando tras desuscribir previo:", subErr);
        // Si falló por clave antigua, desuscribir e intentar de nuevo
        const oldSub = await activeReg.pushManager.getSubscription();
        if (oldSub) await oldSub.unsubscribe();
        sub = await activeReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }
    }

    if (sub) {
      localStorage.setItem("soul_push_endpoint", sub.endpoint);

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          isAdmin,
          userId: clientUserId,
        }),
      });

      const data = await res.json();
      return { success: true, subscription: sub, data };
    }

    return { success: false, error: "No se pudo generar la suscripción push." };
  } catch (err: any) {
    console.error("[WebPush] Error suscribiendo dispositivo:", err);
    return { success: false, error: err.message || "Error al suscribir dispositivo a alertas." };
  }
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      initServiceWorker();
    }
  }, []);

  const initServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      if (Notification.permission === "granted") {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          localStorage.setItem("soul_push_endpoint", sub.endpoint);
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: sub.toJSON() }),
          }).catch(console.error);
        } else {
          subscribeCurrentDevice(false);
        }
      }
    } catch (error) {
      console.warn("Service Worker registration check:", error);
    }
  };

  const handleGrant = async () => {
    const res = await subscribeCurrentDevice(false);
    if (res.success) {
      setPermission("granted");
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("soul_push_prompt_dismissed", "true");
    }
  };

  if (!isSupported) return null;
  if (dismissed || permission === "granted" || permission === "denied") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 bg-[#0B0D13]/95 border border-purple-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black text-sm font-black shadow-md shrink-0">
            🔔
          </div>
          <div>
            <p className="text-xs font-black text-white">Activar Alertas de Pedidos</p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Recibe notificaciones en tu teléfono cuando tu pedido sea procesado y entregado.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleGrant}
          className="flex-1 py-1.5 px-3 bg-[#FFF01F] hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs transition shadow-md"
        >
          Activar Alertas
        </button>
        <button
          onClick={handleDismiss}
          className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-slate-300 font-semibold rounded-xl text-xs transition"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
