import webpush from 'web-push';
import { sql } from '@/lib/db';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:soporte@soulstore.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
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
    const formattedPayload = {
      title: payload.title || '🟢 Soul Store',
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/images/whatsapp-icon.png',
      badge: payload.badge || '/badge.png',
      tag: payload.tag || `soul-notif-${Date.now()}`,
    };

    // sql directly returns an array with postgres library
    const subs = await sql`
      SELECT endpoint, p256dh, auth 
      FROM public.push_subscriptions 
      WHERE user_id = ${userId}::uuid
    `;

    if (!subs || subs.length === 0) {
      console.log(`[WebPush] No hay suscripciones registradas para el usuario ${userId}`);
      return false;
    }

    const promises = subs.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(formattedPayload));
        console.log(`[WebPush] Notificación enviada con éxito a ${sub.endpoint.slice(0, 30)}...`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM public.push_subscriptions WHERE endpoint = ${sub.endpoint}`;
          console.log(`[WebPush] Suscripción caducada eliminada: ${sub.endpoint.slice(0, 30)}`);
        } else {
          console.error('[WebPush] Error enviando a endpoint:', sub.endpoint, error);
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
    const formattedPayload = {
      title: payload.title || '🟢 Soul Store • Nuevo Pedido',
      body: payload.body,
      url: payload.url || '/admin',
      icon: payload.icon || '/images/whatsapp-icon.png',
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

    const promises = Array.from(uniqueMap.values()).map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(formattedPayload));
        console.log(`[WebPush] Notificación de Admin enviada con éxito.`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM public.push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        } else {
          console.error('[WebPush] Error enviando push a admin:', error);
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
