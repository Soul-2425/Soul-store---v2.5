# 🛍️ Soul Store — Plataforma E-commerce y Panel de Gestión v2.5

Plataforma moderna de venta, distribución y recargas de productos digitales, suscripciones y servicios para gaming y entretenimiento (B2B / B2C).

---

## ⚡ Tecnologías
- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Estilos:** Tailwind CSS con estética Cyberpunk / Gaming oscura
- **Base de Datos:** PostgreSQL en Supabase
- **Almacenamiento:** Cloudflare R2
- **Caché / Rate Limit:** Upstash Redis
- **Algoritmo P2P:** Sincronización en tiempo real con Binance P2P (VES y MXN)

---

## 🚀 Despliegue en Vercel

### Paso 1: Importar Repositorio en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona el repositorio: `Soul-store---v2.5`.
4. Deja el **Framework Preset** como `Next.js` y el **Root Directory** como `./`.

### Paso 2: Configurar Variables de Entorno en Vercel
En la sección **Environment Variables**, agrega las siguientes variables (copiadas desde tu archivo `.env.local`):

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima pública de Supabase |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Transaction pooler o directa) |
| `DATABASE_PASSWORD` | Contraseña de la base de datos |
| `UPSTASH_REDIS_REST_URL` | URL REST de Upstash Redis (Opcional) |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST de Upstash Redis (Opcional) |
| `CLOUDFLARE_R2_ACCOUNT_ID` | ID de Cuenta de Cloudflare R2 |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Access Key ID de Cloudflare R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Secret Access Key de Cloudflare R2 |
| `CLOUDFLARE_R2_BUCKET_NAME` | Nombre del Bucket en R2 |
| `CLOUDFLARE_R2_PUBLIC_URL` | URL pública de tu bucket R2 |

### Paso 3: Desplegar
Haz clic en **"Deploy"**. Vercel compilará automáticamente el proyecto y te asignará un dominio HTTPS listo para producción.

---

## 💻 Desarrollo Local
```bash
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.
