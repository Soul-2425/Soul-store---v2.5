-- ==========================================================
-- SOUL STORE - SEMILLERO INICIAL DE DATOS (SEED)
-- ==========================================================

-- Categorías
INSERT INTO public.categorias (id, nombre, slug, imagen_url, activo, orden)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Gaming & Recargas', 'gaming', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop', TRUE, 1),
    ('22222222-2222-2222-2222-222222222222', 'Streaming & Entretenimiento', 'streaming', 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop', TRUE, 2),
    ('33333333-3333-3333-3333-333333333333', 'Bóveda Cuentas & Pases', 'boveda', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', TRUE, 3)
ON CONFLICT (id) DO NOTHING;

-- Subcategorías
INSERT INTO public.subcategorias (id, categoria_id, nombre, slug, imagen_url, activo, orden)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Free Fire', 'free-fire', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop', TRUE, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Netflix', 'netflix', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop', TRUE, 1),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Pases Booyah FF', 'pases-booyah', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- Productos
INSERT INTO public.productos (
    id, subcategoria_id, nombre, slug, descripcion, imagen_url, 
    requisitos_dinamicos, comentario_permitido, requiere_inventario, tiene_caducidad, oferta_especial, 
    costo_proveedor, precio_base, activo, orden
)
VALUES
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Recarga Diamantes Free Fire (Directo por ID)',
        'recarga-diamantes-ff',
        'Acreditación inmediata usando el Player ID de tu cuenta.',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
        '[{"campo": "player_id", "etiqueta": "ID de Jugador", "tipo": "numerico", "requerido": true}, {"campo": "region", "etiqueta": "Región", "tipo": "texto", "requerido": true}]'::jsonb,
        TRUE, FALSE, FALSE, FALSE,
        0.70, 0.85, TRUE, 1
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Pantalla Netflix Premium 4K UHD (30 Días)',
        'netflix-pantalla-premium',
        'Perfil individual con PIN exclusivo y garantía completa durante los 30 días.',
        'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop',
        '[]'::jsonb,
        FALSE, TRUE, TRUE, FALSE,
        2.00, 2.70, TRUE, 2
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Pase Booyah Premium Plus (Envío por Amistad)',
        'pase-booyah-premium-plus',
        'Envío seguro desde cuentas de bóveda mediante solicitud de amistad.',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
        '[{"campo": "player_id", "etiqueta": "ID de Jugador", "tipo": "numerico", "requerido": true}]'::jsonb,
        TRUE, TRUE, TRUE, TRUE,
        1.50, 1.99, TRUE, 3
    )
ON CONFLICT (id) DO NOTHING;

-- Variantes para Free Fire
INSERT INTO public.variantes_producto (id, producto_id, nombre, sku, costo_proveedor, precio_base, activo, orden)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '100 + 10 Diamantes Bonus', 'FF-100D', 0.70, 0.85, TRUE, 1),
    ('10000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '310 + 31 Diamantes Bonus', 'FF-310D', 2.10, 2.50, TRUE, 2),
    ('10000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '520 + 52 Diamantes Bonus', 'FF-520D', 3.50, 4.20, TRUE, 3),
    ('10000000-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '1060 + 106 Diamantes Bonus', 'FF-1060D', 7.00, 8.30, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- Feed de Entregas Demo (Módulo 5)
INSERT INTO public.feed_entregas (pedido_id, pedido_item_id, nickname_anonimo, descripcion_entrega, aprobado_admin)
VALUES
    (NULL, NULL, 'S...99', 'Free Fire - 100 Diamantes', TRUE),
    (NULL, NULL, 'C...12', 'Netflix 1 Pantalla (30 días)', TRUE),
    (NULL, NULL, 'M...77', 'Free Fire - 310 Diamantes', TRUE),
    (NULL, NULL, 'A...04', 'Pase Booyah Premium', TRUE);
