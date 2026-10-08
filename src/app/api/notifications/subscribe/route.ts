import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    let userId: string | null = null;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Sin sesión SSR
    }

    const body = await request.json();
    const { subscription, userId: clientUserId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    let isAdmin = Boolean(body.isAdmin || body.is_admin);
    const finalUserId = userId || clientUserId || null;

    const isValidUuid = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
    const validUserId = isValidUuid(finalUserId) ? finalUserId.trim() : null;

    if (validUserId) {
      try {
        const [u] = await sql`SELECT rango FROM public.usuarios WHERE id = ${validUserId}::uuid`;
        if (u && String(u.rango).toLowerCase() === 'admin') {
          isAdmin = true;
        }
      } catch (err) {
        console.warn('Error checking user rank in subscribe:', err);
      }
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Insertar o actualizar suscripción push
    await sql`
      INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, is_admin, created_at)
      VALUES (
        ${validUserId ? validUserId : null}::uuid, 
        ${endpoint}, 
        ${p256dh}, 
        ${auth}, 
        ${userAgent}, 
        ${isAdmin},
        NOW()
      )
      ON CONFLICT (endpoint) DO UPDATE 
      SET user_id = COALESCE(EXCLUDED.user_id, public.push_subscriptions.user_id),
          is_admin = CASE WHEN EXCLUDED.is_admin = TRUE THEN TRUE ELSE public.push_subscriptions.is_admin END,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          user_agent = EXCLUDED.user_agent
    `;

    return NextResponse.json({ success: true, userId: validUserId, isAdmin });
  } catch (error: any) {
    console.error('Error in subscribe route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
