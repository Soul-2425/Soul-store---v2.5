import webpush from 'web-push';
import { sql } from '@/lib/db';

const DEFAULT_VAPID_PUBLIC_KEY =
  'BHMT_to0ViXP-2jqt3MSXODstv5Xqq7YsdaouWOeLRtKPsC6AXl6WAqGqSYovGXRVtGk86A4JO7M2tzjS_rfZkI';
const DEFAULT_VAPID_PRIVATE_KEY =
  'SIvsoB1puhpIjcFsdZCfBILvXJGJ9iOBYRG6qdlAoBQ';
const DEFAULT_VAPID_SUBJECT = 'mailto:soporte@soulstore.com';

function ensureVapidConfig() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    return true;
  } catch (err) {
    console.error('[WebPush] Error al configurar VAPID details:', err);
    return false;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

/**
 * Enviar notificación push a un usuario específico
 */
export async function sendPushNotification(userId: string | null | undefined, payload: PushNotificationPayload) {
  if (!userId) return false;

  try {
    if (!ensureVapidConfig()) {
      console.error('[WebPush] No se pudo inicializar la configuración VAPID.');
      return false;
    }

    const formattedPayload = {
      title: payload.title || '🟢 Soul Store',
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/badge.png',
      tag: payload.tag || `soul-notif-${Date.now()}`,
    };

    const subs = await sql`
      SELECT endpoint, p256dh, auth 
      FROM public.push_subscriptions 
      WHERE user_id = ${userId}::uuid
    `;

    if (!subs || subs.length === 0) {
      console.log(`[WebPush] No hay suscripciones registradas para el usuario ${userId}`);
      return false;
    }

    console.log(`[WebPush] Enviando notificación a ${subs.length} dispositivo(s) para usuario ${userId}`);

    const pushOptions: webpush.RequestOptions = {
      TTL: 86400, // 24 horas
      urgency: 'high', // Prioridad ALTA para despertar Android Doze mode
    };

    const promises = subs.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(formattedPayload), pushOptions);
        console.log(`[WebPush] Notificación enviada con éxito a ${sub.endpoint.slice(0, 35)}...`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM public.push_subscriptions WHERE endpoint = ${sub.endpoint}`;
          console.log(`[WebPush] Suscripción caducada eliminada: ${sub.endpoint.slice(0, 35)}`);
        } else {
          console.error('[WebPush] Error enviando a endpoint:', sub.endpoint.slice(0, 35), error?.message || error);
        }
      }
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('[WebPush] Error general en sendPushNotification:', error);
    return false;
  }
}

/**
 * Notificar a los administradores del sistema (estilo WhatsApp)
 */
export async function notifyAdmins(payload: PushNotificationPayload) {
  try {
    if (!ensureVapidConfig()) {
      console.error('[WebPush] No se pudo inicializar la configuración VAPID para administradores.');
      return false;
    }

    const formattedPayload = {
      title: payload.title || '🟢 Soul Store • Nuevo Pedido',
      body: payload.body,
      url: payload.url || '/admin',
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/badge.png',
      tag: payload.tag || `admin-order-${Date.now()}`,
    };

    // 1. Obtener endpoints de administradores (por rol 'admin' o suscripción marcada como is_admin)
    const adminSubs = await sql`
      SELECT ps.endpoint, ps.p256dh, ps.auth 
      FROM public.push_subscriptions ps
      LEFT JOIN public.usuarios u ON ps.user_id = u.id
      WHERE lower(COALESCE(u.rango, '')) = 'admin' OR ps.is_admin = TRUE
    `;

    const uniqueMap = new Map<string, any>();
    (adminSubs || []).forEach((s: any) => uniqueMap.set(s.endpoint, s));

    if (uniqueMap.size === 0) {
      console.warn('[WebPush] No hay administradores suscritos a notificaciones push aún.');
      return false;
    }

    console.log(`[WebPush] Enviando notificación a ${uniqueMap.size} dispositivo(s) de administradores...`);

    const pushOptions: webpush.RequestOptions = {
      TTL: 86400, // 24 horas
      urgency: 'high', // Prioridad ALTA para que suene y despierte el móvil en la barra del sistema
    };

    const promises = Array.from(uniqueMap.values()).map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(formattedPayload), pushOptions);
        console.log(`[WebPush] Notificación de Admin entregada con éxito a ${sub.endpoint.slice(0, 35)}`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM public.push_subscriptions WHERE endpoint = ${sub.endpoint}`;
          console.log(`[WebPush] Suscripción admin caducada eliminada: ${sub.endpoint.slice(0, 35)}`);
        } else {
          console.error('[WebPush] Error enviando push a admin:', error?.message || error);
        }
      }
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('[WebPush] Error en notifyAdmins:', error);
    return false;
  }
}
