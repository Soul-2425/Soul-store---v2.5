export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'admin'
  | 'disenador'
  | 'cliente_4'
  | 'cliente_3'
  | 'cliente_2'
  | 'cliente_1'
  | 'cliente_especial'
  | 'revendedor_4'
  | 'revendedor_3'
  | 'revendedor_2'
  | 'revendedor_1'
  | 'revendedor_especial';

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          apellido: string | null;
          nickname: string;
          email: string;
          telefono_whatsapp: string | null;
          rango: UserRole;
          auth_provider: string;
          fecha_registro: string;
          actualizado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          apellido?: string | null;
          nickname: string;
          email: string;
          telefono_whatsapp?: string | null;
          rango?: UserRole;
          auth_provider?: string;
        };
        Update: {
          nombre?: string;
          apellido?: string | null;
          nickname?: string;
          telefono_whatsapp?: string | null;
          rango?: UserRole;
        };
      };
      tasas_cambio: {
        Row: {
          id: number;
          tasa_ves: number;
          tasa_mxn: number;
          modo_automatico: boolean;
          ultima_actualizacion: string;
          actualizado_por: string | null;
        };
        Insert: {
          tasa_ves?: number;
          tasa_mxn?: number;
          modo_automatico?: boolean;
          actualizado_por?: string | null;
        };
        Update: {
          tasa_ves?: number;
          tasa_mxn?: number;
          modo_automatico?: boolean;
          actualizado_por?: string | null;
        };
      };
      categorias: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          imagen_url: string | null;
          activo: boolean;
          orden: number;
          creado_en: string;
        };
        Insert: {
          nombre: string;
          slug: string;
          imagen_url?: string | null;
          activo?: boolean;
          orden?: number;
        };
        Update: {
          nombre?: string;
          slug?: string;
          imagen_url?: string | null;
          activo?: boolean;
          orden?: number;
        };
      };
      subcategorias: {
        Row: {
          id: string;
          categoria_id: string;
          nombre: string;
          slug: string;
          imagen_url: string | null;
          activo: boolean;
          orden: number;
          creado_en: string;
        };
        Insert: {
          categoria_id: string;
          nombre: string;
          slug: string;
          imagen_url?: string | null;
          activo?: boolean;
          orden?: number;
        };
        Update: {
          categoria_id?: string;
          nombre?: string;
          slug?: string;
          imagen_url?: string | null;
          activo?: boolean;
          orden?: number;
        };
      };
      productos: {
        Row: {
          id: string;
          subcategoria_id: string;
          nombre: string;
          slug: string;
          descripcion: string | null;
          imagen_url: string | null;
          requisitos_dinamicos: Json;
          comentario_permitido: boolean;
          requiere_inventario: boolean;
          tiene_caducidad: boolean;
          oferta_especial: boolean;
          costo_proveedor: number;
          precio_base: number;
          activo: boolean;
          orden: number;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          subcategoria_id: string;
          nombre: string;
          slug: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          requisitos_dinamicos?: Json;
          comentario_permitido?: boolean;
          requiere_inventario?: boolean;
          tiene_caducidad?: boolean;
          oferta_especial?: boolean;
          costo_proveedor?: number;
          precio_base?: number;
          activo?: boolean;
          orden?: number;
        };
        Update: {
          subcategoria_id?: string;
          nombre?: string;
          slug?: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          requisitos_dinamicos?: Json;
          comentario_permitido?: boolean;
          requiere_inventario?: boolean;
          tiene_caducidad?: boolean;
          oferta_especial?: boolean;
          costo_proveedor?: number;
          precio_base?: number;
          activo?: boolean;
          orden?: number;
        };
      };
      variantes_producto: {
        Row: {
          id: string;
          producto_id: string;
          nombre: string;
          sku: string | null;
          costo_proveedor: number;
          precio_base: number;
          activo: boolean;
          orden: number;
          creado_en: string;
        };
        Insert: {
          producto_id: string;
          nombre: string;
          sku?: string | null;
          costo_proveedor?: number;
          precio_base?: number;
          activo?: boolean;
          orden?: number;
        };
        Update: {
          nombre?: string;
          sku?: string | null;
          costo_proveedor?: number;
          precio_base?: number;
          activo?: boolean;
          orden?: number;
        };
      };
      pedidos: {
        Row: {
          id: string;
          usuario_id: string;
          estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'CANCELADO';
          total_usd: number;
          total_ves: number | null;
          total_mxn: number | null;
          moneda_pago: string;
          tasa_cambio: number | null;
          es_override_duplicado: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          usuario_id: string;
          estado?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'CANCELADO';
          total_usd: number;
          total_ves?: number | null;
          total_mxn?: number | null;
          moneda_pago?: string;
          tasa_cambio?: number | null;
          es_override_duplicado?: boolean;
        };
        Update: {
          estado?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'CANCELADO';
          total_usd?: number;
          total_ves?: number | null;
          total_mxn?: number | null;
        };
      };
      pedidos_items: {
        Row: {
          id: string;
          pedido_id: string;
          producto_id: string;
          variante_id: string | null;
          sku: string | null;
          player_id: string | null;
          region: string | null;
          datos_dinamicos: Json;
          comentario_cliente: string | null;
          costo_proveedor: number;
          precio_unitario: number;
          estado: 'EN_COLA' | 'PROCESANDO' | 'ENTREGADO' | 'FALLIDO' | 'CANCELADO';
          respuesta_proveedor: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          pedido_id: string;
          producto_id: string;
          variante_id?: string | null;
          sku?: string | null;
          player_id?: string | null;
          region?: string | null;
          datos_dinamicos?: Json;
          comentario_cliente?: string | null;
          costo_proveedor?: number;
          precio_unitario: number;
          estado?: 'EN_COLA' | 'PROCESANDO' | 'ENTREGADO' | 'FALLIDO' | 'CANCELADO';
        };
        Update: {
          estado?: 'EN_COLA' | 'PROCESANDO' | 'ENTREGADO' | 'FALLIDO' | 'CANCELADO';
          respuesta_proveedor?: string | null;
        };
      };
      configuracion_ui: {
        Row: {
          id: number;
          hero_titulo: string;
          hero_subtitulo: string;
          hero_imagen_url: string | null;
          hero_boton_texto: string;
          hero_boton_enlace: string;
          anuncio_global: string | null;
          anuncio_activo: boolean;
          actualizado_en: string;
        };
        Update: {
          hero_titulo?: string;
          hero_subtitulo?: string;
          hero_imagen_url?: string | null;
          hero_boton_texto?: string;
          hero_boton_enlace?: string;
          anuncio_global?: string | null;
          anuncio_activo?: boolean;
        };
      };
    };
  };
}
