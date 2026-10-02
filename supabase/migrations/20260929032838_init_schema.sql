-- ==========================================================
-- SOUL STORE - ESQUEMA MAESTRO DE BASE DE DATOS (MÓDULOS 1-11)
-- ==========================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- MÓDULO 1: TABLA PRINCIPAL DE USUARIOS Y PERFILES
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    nickname VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono_whatsapp VARCHAR(20),
    password_hash VARCHAR(255),
    rango VARCHAR(30) NOT NULL DEFAULT 'cliente_4',
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_nickname ON public.usuarios(nickname);
CREATE INDEX IF NOT EXISTS idx_usuarios_rango ON public.usuarios(rango);

-- Trigger para sincronizar auth.users con public.usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (
        id,
        nombre,
        apellido,
        nickname,
        email,
        telefono_whatsapp,
        rango,
        auth_provider
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
        NEW.raw_user_meta_data->>'apellido',
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'soul_' || SUBSTRING(NEW.id::text, 1, 8)),
        NEW.email,
        NEW.raw_user_meta_data->>'telefono_whatsapp',
        COALESCE(NEW.raw_user_meta_data->>'rango', 'cliente_4'),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'local')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- MÓDULO 3: SISTEMA MULTIDIVISA P2P
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.tasas_cambio (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    tasa_ves NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tasa_mxn NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    modo_automatico BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    intervalo_minutos INT NOT NULL DEFAULT 15,
    -- Configuración específica VES (Venezuela)
    filtro_monto_ves NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    metodo_pago_ves VARCHAR(50) NOT NULL DEFAULT 'ALL',
    cant_ofertas_ves INT NOT NULL DEFAULT 10,
    margen_spread_ves NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tipo_operacion_ves VARCHAR(10) NOT NULL DEFAULT 'BUY',
    solo_verificados_ves BOOLEAN NOT NULL DEFAULT TRUE,
    -- Configuración específica MXN (México)
    filtro_monto_mxn NUMERIC(15, 2) NOT NULL DEFAULT 200.00,
    metodo_pago_mxn VARCHAR(50) NOT NULL DEFAULT 'ALL',
    cant_ofertas_mxn INT NOT NULL DEFAULT 10,
    margen_spread_mxn NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tipo_operacion_mxn VARCHAR(10) NOT NULL DEFAULT 'BUY',
    solo_verificados_mxn BOOLEAN NOT NULL DEFAULT TRUE
);

-- Fila única inicial
INSERT INTO public.tasas_cambio (
    id, tasa_ves, tasa_mxn, modo_automatico, intervalo_minutos,
    filtro_monto_ves, metodo_pago_ves, cant_ofertas_ves, margen_spread_ves, tipo_operacion_ves, solo_verificados_ves,
    filtro_monto_mxn, metodo_pago_mxn, cant_ofertas_mxn, margen_spread_mxn, tipo_operacion_mxn, solo_verificados_mxn
)
VALUES (
    1, 0.0000, 0.0000, TRUE, 15,
    1000.00, 'ALL', 10, 0.00, 'BUY', TRUE,
    200.00, 'ALL', 10, 0.00, 'BUY', TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- MÓDULO 4: GESTIÓN DE CATÁLOGO DINÁMICO
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategoria_id UUID NOT NULL REFERENCES public.subcategorias(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url TEXT,
    requisitos_dinamicos JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"campo": "id", "etiqueta": "ID de Jugador", "tipo": "numerico", "requerido": true}]
    comentario_permitido BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_inventario BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_caducidad BOOLEAN NOT NULL DEFAULT FALSE,
    oferta_especial BOOLEAN NOT NULL DEFAULT FALSE,
    costo_proveedor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    precio_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.variantes_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL, -- Ej: '100 Diamantes', '310 Diamantes'
    sku VARCHAR(100) UNIQUE,
    costo_proveedor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    precio_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- MÓDULO 6: TIERS DE PRECIO, REGLAS Y OVERRIDE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.reglas_margen_rango (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rango VARCHAR(30) NOT NULL UNIQUE,
    porcentaje_ganancia NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- Ej: 15.00 para 15%
    descripcion VARCHAR(100),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Precios Manuales de Cascada (REGLA DE ORO: Tienen prioridad absoluta sobre el cálculo porcentual)
CREATE TABLE IF NOT EXISTS public.precios_override (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES public.variantes_producto(id) ON DELETE CASCADE,
    rango VARCHAR(30) NOT NULL,
    precio_fijo NUMERIC(10, 2) NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_override_item CHECK (
        (producto_id IS NOT NULL AND variante_id IS NULL) OR
        (producto_id IS NULL AND variante_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_override_producto_rango ON public.precios_override(producto_id, rango) WHERE producto_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_override_variante_rango ON public.precios_override(variante_id, rango) WHERE variante_id IS NOT NULL;

-- Inserción de Rangos Base
INSERT INTO public.reglas_margen_rango (rango, porcentaje_ganancia, descripcion)
VALUES 
    ('admin', 0.00, 'Administrador del sistema'),
    ('disenador', 0.00, 'Diseñador gráfico'),
    ('cliente_4', 20.00, 'Cliente Nivel 4 (General)'),
    ('cliente_3', 15.00, 'Cliente Nivel 3'),
    ('cliente_2', 10.00, 'Cliente Nivel 2'),
    ('cliente_1', 7.00, 'Cliente Nivel 1'),
    ('cliente_especial', 0.00, 'Cliente Especial (Solo Overrides Manuales)'),
    ('revendedor_4', 12.00, 'Revendedor Nivel 4'),
    ('revendedor_3', 9.00, 'Revendedor Nivel 3'),
    ('revendedor_2', 6.00, 'Revendedor Nivel 2'),
    ('revendedor_1', 4.00, 'Revendedor Nivel 1'),
    ('revendedor_especial', 0.00, 'Revendedor Especial (Solo Overrides Manuales)')
ON CONFLICT (rango) DO NOTHING;

-- ==========================================================
-- MÓDULO 2: ARQUITECTURA DE PEDIDOS Y GESTIÓN
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'COMPLETADO', 'CANCELADO')),
    total_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_ves NUMERIC(15, 2),
    total_mxn NUMERIC(15, 2),
    moneda_pago VARCHAR(10) NOT NULL DEFAULT 'USD',
    tasa_cambio NUMERIC(15, 4),
    es_override_duplicado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pedidos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    variante_id UUID REFERENCES public.variantes_producto(id) ON DELETE SET NULL,
    sku VARCHAR(100),
    player_id VARCHAR(100), -- ID del jugador destino
    region VARCHAR(50),
    datos_dinamicos JSONB NOT NULL DEFAULT '{}'::jsonb,
    comentario_cliente TEXT,
    costo_proveedor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'EN_COLA' CHECK (estado IN ('EN_COLA', 'PROCESANDO', 'ENTREGADO', 'FALLIDO', 'CANCELADO')),
    respuesta_proveedor TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON public.pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_pedido ON public.pedidos_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_duplicado ON public.pedidos_items(player_id, sku, creado_en);

-- ==========================================================
-- MÓDULO 8: GESTOR DE INVENTARIO (VENCIMIENTOS Y BÓVEDA SEGURA)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.inventario_boveda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    variante_id UUID REFERENCES public.variantes_producto(id) ON DELETE SET NULL,
    identificador_publico VARCHAR(100) NOT NULL, -- Nick o ID visible al usuario
    instruccion_entrega TEXT NOT NULL, -- Ej: "Envía solicitud de amistad a..."
    datos_sensibles_encriptados BYTEA NOT NULL, -- Encriptado con PGP simétrico
    tipo_entrega VARCHAR(30) NOT NULL DEFAULT 'RAPIDA' CHECK (tipo_entrega IN ('RAPIDA', 'RESERVA_FECHA')),
    fecha_reserva TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'POR_CADUCAR', 'OFERTA_ESPECIAL', 'ASIGNADO', 'CADUCADO')),
    asignado_a_pedido_item_id UUID REFERENCES public.pedidos_items(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boveda_estado ON public.inventario_boveda(estado);
CREATE INDEX IF NOT EXISTS idx_boveda_vencimiento ON public.inventario_boveda(fecha_vencimiento);

-- ==========================================================
-- MÓDULO 7: CRM Y CLIENTES FIJOS PARA REVENDEDORES (B2B)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.revendedor_crm_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revendedor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Mis Panas", "Cyber"
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.revendedor_clientes_fijos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revendedor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_crm_id UUID REFERENCES public.revendedor_crm_categorias(id) ON DELETE SET NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    telefono_whatsapp VARCHAR(20),
    identificador_juego VARCHAR(100),
    producto_frecuente_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    variante_frecuente_id UUID REFERENCES public.variantes_producto(id) ON DELETE SET NULL,
    precio_venta_final NUMERIC(10, 2), -- Precio cobrado por el revendedor para cálculo de ganancia
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_revendedor ON public.revendedor_clientes_fijos(revendedor_id);

-- ==========================================================
-- MÓDULO 5: FEED PÚBLICO Y RESEÑAS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.feed_entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    pedido_item_id UUID REFERENCES public.pedidos_items(id) ON DELETE CASCADE,
    nickname_anonimo VARCHAR(50) NOT NULL, -- Ej: "S...99"
    descripcion_entrega VARCHAR(255) NOT NULL, -- Ej: "Free Fire - 100 Diamantes"
    aprobado_admin BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    aprobado_admin BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_aprobado ON public.feed_entregas(aprobado_admin, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_resenas_aprobado ON public.resenas(aprobado_admin, creado_en DESC);

-- ==========================================================
-- MÓDULO 10: CONFIGURACIÓN HERO Y ANUNCIOS PÚBLICOS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.configuracion_ui (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    hero_titulo VARCHAR(255) NOT NULL DEFAULT 'Bienvenido a Soul Store',
    hero_subtitulo TEXT NOT NULL DEFAULT 'Tu plataforma confiable de recargas, cuentas y entretenimiento digital',
    hero_imagen_url TEXT,
    hero_boton_texto VARCHAR(50) NOT NULL DEFAULT 'Explorar Catálogo',
    hero_boton_enlace VARCHAR(100) NOT NULL DEFAULT '#catalogo',
    anuncio_global TEXT,
    anuncio_activo BOOLEAN NOT NULL DEFAULT FALSE,
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.configuracion_ui (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- MÓDULO 11: TICKETS DE SOPORTE INTEGRADO
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.tickets_soporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ticket VARCHAR(20) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    asunto_motivo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO')),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIA' CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mensajes_soporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets_soporte(id) ON DELETE CASCADE,
    remitente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    es_admin BOOLEAN NOT NULL DEFAULT FALSE,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    adjunto_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_usuario ON public.tickets_soporte(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON public.tickets_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket ON public.mensajes_soporte(ticket_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasas_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas_margen_rango ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_boveda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedor_crm_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedor_clientes_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_ui ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_soporte ENABLE ROW LEVEL SECURITY;

-- 1. Usuarios: Lectura pública de nicknames / perfil propio completo
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins tienen acceso total a usuarios" ON public.usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'
        )
    );

-- 2. Catálogo: Lectura pública para elementos activos
CREATE POLICY "Catálogo visible públicamente" ON public.categorias
    FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admins/Diseñadores gestionan categorias" ON public.categorias
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango IN ('admin', 'disenador'))
    );

CREATE POLICY "Subcategorías visibles públicamente" ON public.subcategorias
    FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admins/Diseñadores gestionan subcategorias" ON public.subcategorias
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango IN ('admin', 'disenador'))
    );

CREATE POLICY "Productos visibles públicamente" ON public.productos
    FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admins/Diseñadores gestionan productos" ON public.productos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango IN ('admin', 'disenador'))
    );

CREATE POLICY "Variantes visibles públicamente" ON public.variantes_producto
    FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admins/Diseñadores gestionan variantes" ON public.variantes_producto
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango IN ('admin', 'disenador'))
    );

-- 3. Tasas y Configuración UI: Lectura pública
CREATE POLICY "Tasas visibles para todos" ON public.tasas_cambio
    FOR SELECT USING (TRUE);
CREATE POLICY "Admins configuran tasas" ON public.tasas_cambio
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

CREATE POLICY "Configuración UI pública" ON public.configuracion_ui
    FOR SELECT USING (TRUE);
CREATE POLICY "Admins configuran UI" ON public.configuracion_ui
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

-- 4. Pedidos: Usuario ve sus propios pedidos
CREATE POLICY "Usuarios ven sus pedidos" ON public.pedidos
    FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuarios crean sus pedidos" ON public.pedidos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Admins gestionan pedidos" ON public.pedidos
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

CREATE POLICY "Usuarios ven sus items de pedido" ON public.pedidos_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedidos_items.pedido_id AND usuario_id = auth.uid())
    );
CREATE POLICY "Usuarios insertan items de pedido" ON public.pedidos_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedidos_items.pedido_id AND usuario_id = auth.uid())
    );
CREATE POLICY "Admins gestionan items de pedido" ON public.pedidos_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

-- 5. CRM Revendedor: Solo el revendedor dueño
CREATE POLICY "Revendedor gestiona sus categorias CRM" ON public.revendedor_crm_categorias
    FOR ALL USING (revendedor_id = auth.uid());
CREATE POLICY "Revendedor gestiona sus clientes fijos" ON public.revendedor_clientes_fijos
    FOR ALL USING (revendedor_id = auth.uid());

-- 6. Feed y Reseñas
CREATE POLICY "Feed aprobado es público" ON public.feed_entregas
    FOR SELECT USING (aprobado_admin = TRUE);
CREATE POLICY "Admins gestionan feed" ON public.feed_entregas
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

CREATE POLICY "Reseñas aprobadas son públicas" ON public.resenas
    FOR SELECT USING (aprobado_admin = TRUE);
CREATE POLICY "Usuarios crean reseñas de sus compras" ON public.resenas
    FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Admins gestionan reseñas" ON public.resenas
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

-- 7. Bóveda: Solo Admin (los clientes reciben datos vía funciones seguras)
CREATE POLICY "Solo admin gestiona boveda" ON public.inventario_boveda
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

-- 8. Tickets de Soporte
CREATE POLICY "Usuarios gestionan sus tickets" ON public.tickets_soporte
    FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios crean tickets" ON public.tickets_soporte
    FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Admins gestionan todos los tickets" ON public.tickets_soporte
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

CREATE POLICY "Usuarios ven mensajes de sus tickets" ON public.mensajes_soporte
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.tickets_soporte WHERE id = mensajes_soporte.ticket_id AND usuario_id = auth.uid())
    );
CREATE POLICY "Usuarios envian mensajes a sus tickets" ON public.mensajes_soporte
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.tickets_soporte WHERE id = mensajes_soporte.ticket_id AND usuario_id = auth.uid())
    );
CREATE POLICY "Admins gestionan mensajes de soporte" ON public.mensajes_soporte
    FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));

-- 9. Tasas de Cambio & Algoritmo Multi-Divisa Binance P2P
CREATE TABLE IF NOT EXISTS public.tasas_cambio (
    id SERIAL PRIMARY KEY,
    moneda VARCHAR(10) NOT NULL UNIQUE,
    tasa NUMERIC(14, 4) NOT NULL DEFAULT 1.0,
    modo_automatico BOOLEAN NOT NULL DEFAULT TRUE,
    intervalo_minutos INT NOT NULL DEFAULT 15,
    -- Configuración específica Venezuela (VES)
    filtro_monto_ves NUMERIC(14, 2) DEFAULT 1000,
    metodo_pago_ves VARCHAR(50) DEFAULT 'ALL',
    cant_ofertas_ves INT DEFAULT 10,
    margen_spread_ves NUMERIC(5, 2) DEFAULT 0.0,
    tipo_operacion_ves VARCHAR(10) DEFAULT 'BUY',
    solo_verificados_ves BOOLEAN DEFAULT TRUE,
    tiempo_pago_ves INT DEFAULT 0,
    pais_ves VARCHAR(10) DEFAULT 'ALL',
    solo_trading_ves BOOLEAN DEFAULT TRUE,
    solo_pro_ves BOOLEAN DEFAULT FALSE,
    sin_verif_ves BOOLEAN DEFAULT FALSE,
    -- Configuración específica México (MXN)
    filtro_monto_mxn NUMERIC(14, 2) DEFAULT 200,
    metodo_pago_mxn VARCHAR(50) DEFAULT 'ALL',
    cant_ofertas_mxn INT DEFAULT 10,
    margen_spread_mxn NUMERIC(5, 2) DEFAULT 0.0,
    tipo_operacion_mxn VARCHAR(10) DEFAULT 'BUY',
    solo_verificados_mxn BOOLEAN DEFAULT TRUE,
    tiempo_pago_mxn INT DEFAULT 0,
    pais_mxn VARCHAR(10) DEFAULT 'ALL',
    solo_trading_mxn BOOLEAN DEFAULT TRUE,
    solo_pro_mxn BOOLEAN DEFAULT FALSE,
    sin_verif_mxn BOOLEAN DEFAULT FALSE,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasas_cambio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica de tasas" ON public.tasas_cambio FOR SELECT USING (true);
CREATE POLICY "Admins gestionan tasas" ON public.tasas_cambio FOR ALL USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rango = 'admin'));
