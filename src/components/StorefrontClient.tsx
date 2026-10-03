"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Flame, 
  Menu,
  X,
  ShoppingCart, 
  ChevronDown, 
  Check, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Crown, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  PackageOpen,
  PlusCircle,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  Grid,
  Layers,
  Tag
} from "lucide-react";
import CheckoutModal from "@/components/CheckoutModal";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  nombre: string;
  slug: string;
  imagen_url: string | null;
}

interface Subcategory {
  id: string;
  categoria_id: string;
  nombre: string;
  slug: string;
  imagen_url: string | null;
  activo?: boolean;
}

export interface ProductVariant {
  id: string;
  producto_id: string;
  nombre: string;
  sku?: string | null;
  costo_proveedor?: number;
  precio_base: number;
  activo?: boolean;
  imagen_url: string | null;
  orden?: number;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
}

interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  imagen_oferta_url?: string | null;
  precio_base: number;
  oferta_especial: boolean;
  categoria_id: string;
  categoria_nombre: string;
  subcategoria_id?: string | null;
  subcategoria_nombre?: string | null;
  costo_proveedor?: number;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
}

interface UserProfile {
  id: string;
  nombre?: string;
  apellido?: string;
  nickname: string;
  email: string;
  rango: string;
  telefono_whatsapp?: string | null;
}

interface StorefrontClientProps {
  categories: Category[];
  subcategories?: Subcategory[];
  products: Product[];
  variants?: ProductVariant[];
  tasaVes: number;
  tasaMxn: number;
  initialUser?: UserProfile | null;
}

interface FeedItem {
  id: string;
  nickname_anonimo: string;
  descripcion_entrega: string;
  creado_en: string;
}

type Currency = "USD" | "VES" | "MXN";

export default function StorefrontClient({
  categories,
  subcategories = [],
  products,
  variants = [],
  tasaVes,
  tasaMxn,
  initialUser = null,
}: StorefrontClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string>("all");
  const [catalogViewMode, setCatalogViewMode] = useState<"categories" | "all_products">("categories");
  const [currentCurrency, setCurrentCurrency] = useState<Currency>("USD");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser);

  const supabase = createClient();

  useEffect(() => {
    // Cargar feed de entregas en vivo
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => {
        if (d.feed && d.feed.length > 0) {
          setFeedItems(d.feed);
        } else {
          setFeedItems([
            { id: "1", nickname_anonimo: "Usuario***", descripcion_entrega: "Recarga Inmediata Acreditada", creado_en: "Hace 1 min" }
          ]);
        }
      })
      .catch(() => {
        setFeedItems([
          { id: "1", nickname_anonimo: "Usuario***", descripcion_entrega: "Recarga Inmediata Acreditada", creado_en: "Hace 1 min" }
        ]);
      });

    // Sesión de usuario
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !currentUser) {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) setCurrentUser(data.user);
        }
      } else if (!user && currentUser) {
        setCurrentUser(null);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) setCurrentUser(data.user);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>(subcategories);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>(variants);

  useEffect(() => {
    setCategoriesList(categories);
    setSubcategoriesList(subcategories);
    setProductsList(products);
    setVariantsList(variants);
  }, [categories, subcategories, products, variants]);

  // Sincronización en vivo con la base de datos de Supabase
  const refreshCatalog = async () => {
    try {
      const res = await fetch("/api/catalog");
      if (res.ok) {
        const data = await res.json();
        if (data.categories) setCategoriesList(data.categories);
        if (data.subcategories) setSubcategoriesList(data.subcategories);
        if (data.products) setProductsList(data.products);
        if (data.variants) setVariantsList(data.variants);
      }
    } catch (e) {
      console.error("Error al sincronizar catálogo:", e);
    }
  };

  useEffect(() => {
    refreshCatalog();
    const onFocus = () => refreshCatalog();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Formato de precio según la moneda activa y reglas personalizadas
  const formatPrice = (
    precioUsd: number,
    itemOverrides?: {
      precio_ref_ves?: number | null;
      precio_fijo_ves?: number | null;
      precio_ref_mxn?: number | null;
      precio_fijo_mxn?: number | null;
    }
  ) => {
    if (currentCurrency === "VES") {
      if (itemOverrides?.precio_fijo_ves && Number(itemOverrides.precio_fijo_ves) > 0) {
        return `${Number(itemOverrides.precio_fijo_ves).toFixed(2)} Bs.`;
      }
      const base = itemOverrides?.precio_ref_ves && Number(itemOverrides.precio_ref_ves) > 0
        ? Number(itemOverrides.precio_ref_ves)
        : precioUsd;
      const ves = tasaVes > 0 ? (base * tasaVes).toFixed(2) : "0.00";
      return `${ves} Bs.`;
    }
    if (currentCurrency === "MXN") {
      if (itemOverrides?.precio_fijo_mxn && Number(itemOverrides.precio_fijo_mxn) > 0) {
        return `$${Number(itemOverrides.precio_fijo_mxn).toFixed(2)} MXN`;
      }
      const base = itemOverrides?.precio_ref_mxn && Number(itemOverrides.precio_ref_mxn) > 0
        ? Number(itemOverrides.precio_ref_mxn)
        : precioUsd;
      const mxn = tasaMxn > 0 ? (base * tasaMxn).toFixed(2) : "0.00";
      return `$${mxn} MXN`;
    }
    return `$${Number(precioUsd).toFixed(2)} USD`;
  };

  // Obtener icono / emoji para categoría
  const getCategoryIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("game") || n.includes("juego") || n.includes("free fire")) return "🎮";
    if (n.includes("stream") || n.includes("netflix") || n.includes("pantalla") || n.includes("video")) return "📺";
    if (n.includes("gift") || n.includes("tarjeta") || n.includes("card")) return "🎁";
    if (n.includes("cuenta") || n.includes("account")) return "👑";
    return "⚡";
  };

  // Precalcular estadísticas y precios mínimos de categorías en un solo paso memoizado
  const categoryStats = useMemo(() => {
    const stats: Record<string, { prodsCount: number; minPrice: number | null }> = {};
    for (const cat of categoriesList) {
      const catProds = productsList.filter((p) => p.categoria_id === cat.id);
      const prices: number[] = [];
      for (const p of catProds) {
        if (p.precio_base && Number(p.precio_base) > 0) prices.push(Number(p.precio_base));
        const pVars = variantsList.filter((v) => v.producto_id === p.id && v.activo !== false);
        for (const v of pVars) {
          if (v.precio_base && Number(v.precio_base) > 0) prices.push(Number(v.precio_base));
        }
      }
      stats[cat.id] = {
        prodsCount: catProds.length,
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
      };
    }
    return stats;
  }, [categoriesList, productsList, variantsList]);

  const activeCategoryObj = useMemo(
    () => categoriesList.find((c) => c.id === activeCategoryFilter),
    [categoriesList, activeCategoryFilter]
  );

  // Subcategorías disponibles según la categoría seleccionada (memoizado)
  const availableSubcategories = useMemo(() => {
    return subcategoriesList.filter((s) => {
      if (activeCategoryFilter === "all") return true;
      return s.categoria_id === activeCategoryFilter;
    });
  }, [subcategoriesList, activeCategoryFilter]);

  // Filtrado de productos por categoría y subcategoría desde BD (memoizado)
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      if (activeCategoryFilter !== "all" && p.categoria_id !== activeCategoryFilter) {
        return false;
      }
      if (activeSubcategoryFilter !== "all" && p.subcategoria_id !== activeSubcategoryFilter) {
        return false;
      }
      return true;
    });
  }, [productsList, activeCategoryFilter, activeSubcategoryFilter]);

  // Ofertas especiales configuradas desde el Panel Admin (memoizado)
  const specialOffers = useMemo(() => {
    return productsList.filter((p) => p.oferta_especial);
  }, [productsList]);

  return (
    <div className="min-h-screen text-white relative selection:bg-[#FF007F] selection:text-white pb-24 overflow-x-hidden">
      {/* Fondo Fijo Acelerado por Hardware GPU (elimina 100% de repintados durante el scroll en móviles) */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none -z-10 bg-ferrari-dominant escarchado-dorado transform-gpu will-change-transform" 
      />
      
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR FLOTANTE (CONSERVADA SEGÚN CAPTURA DEL USUARIO) */}
      {/* ========================================================================= */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl glass-pill rounded-full px-4 sm:px-7 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-between transition-all duration-300">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
            aria-label="Abrir Menú"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Llama con aro amarillo pollito brillante */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-0.5 shadow-[0_0_14px_rgba(255,240,31,0.6)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#FFF01F]" />
              </div>
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1 font-sans">
              Soul <span className="text-[#FFF01F]">Store</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links (Inicio en Rosado Urbano con glow) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold">
          <a 
            href="#inicio" 
            className="text-[#FF007F] relative py-1 hover:brightness-125 transition-all flex flex-col items-center"
          >
            <span>Inicio</span>
            <span className="w-5 h-0.5 bg-[#FF007F] rounded-full mt-0.5 shadow-[0_0_8px_#FF007F]"></span>
          </a>
          <button 
            onClick={() => setContactModalOpen(true)}
            className="text-white/80 hover:text-white hover:scale-105 transition"
          >
            Contáctanos
          </button>
          <button 
            onClick={() => setAboutModalOpen(true)}
            className="text-white/80 hover:text-white hover:scale-105 transition"
          >
            Soporte
          </button>
        </nav>

        {/* Right: Currency Selector, Cart, User Session */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Selector de Moneda Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition shadow-sm"
            >
              <span>$ {currentCurrency}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-[#0B0D13]/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl z-50 text-xs">
                <button
                  onClick={() => { setCurrentCurrency("USD"); setCurrencyDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                    currentCurrency === "USD" ? "bg-[#D61A1A] text-white font-bold" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>USD ($)</span>
                  {currentCurrency === "USD" && <Check className="w-3.5 h-3.5 text-[#FFF01F]" />}
                </button>
                <button
                  onClick={() => { setCurrentCurrency("VES"); setCurrencyDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                    currentCurrency === "VES" ? "bg-[#D61A1A] text-white font-bold" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>VES (Bs.)</span>
                  {currentCurrency === "VES" && <Check className="w-3.5 h-3.5 text-[#FFF01F]" />}
                </button>
                <button
                  onClick={() => { setCurrentCurrency("MXN"); setCurrencyDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                    currentCurrency === "MXN" ? "bg-[#D61A1A] text-white font-bold" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>MXN ($)</span>
                  {currentCurrency === "MXN" && <Check className="w-3.5 h-3.5 text-[#FFF01F]" />}
                </button>
              </div>
            )}
          </div>

          {/* Carrito de Compras */}
          <button 
            onClick={() => setCartModalOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition relative"
            aria-label="Carrito de Compras"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>

          {/* Sesión de Usuario / Botón ADMIN */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {currentUser.rango === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF01F] text-[#0B0D13] text-xs font-black uppercase shadow-md hover:bg-yellow-300 transition"
                  title="Panel Administrativo"
                >
                  <Crown className="w-3.5 h-3.5 text-[#D61A1A]" />
                  <span>ADMIN</span>
                </Link>
              )}

              <div 
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-xs font-bold text-black border border-white/20 shadow-md cursor-pointer"
                title={`${currentUser.nickname} (${currentUser.rango})`}
              >
                {currentUser.nickname ? currentUser.nickname[0].toUpperCase() : "S"}
              </div>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setCurrentUser(null);
                  window.location.reload();
                }}
                className="p-1.5 text-white/60 hover:text-[#FFF01F] transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition"
            >
              Ingresar
            </Link>
          )}

        </div>
      </header>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0D13]/95 backdrop-blur-md flex flex-col p-6 text-white md:hidden">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#FFF01F]" />
              <span className="font-extrabold text-lg">Soul Store</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 py-6 text-lg font-bold">
            <a 
              href="#inicio" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#FF007F] flex items-center justify-between"
            >
              <span>Inicio</span>
              <span className="w-2 h-2 rounded-full bg-[#FF007F]"></span>
            </a>
            <button 
              onClick={() => { setMobileMenuOpen(false); setContactModalOpen(true); }}
              className="text-left text-white/90"
            >
              Contáctanos
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setAboutModalOpen(true); }}
              className="text-left text-white/90"
            >
              Soporte y Garantías
            </button>
            <Link 
              href="/tickets" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-white/90"
            >
              Mis Tickets de Soporte
            </Link>
            {currentUser?.rango === "admin" && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#FFF01F] font-black flex items-center gap-2"
              >
                <Crown className="w-5 h-5 text-[#D61A1A]" />
                <span>Panel Administrador</span>
              </Link>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
            {currentUser ? (
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-white">{currentUser.nickname}</p>
                  <p className="text-xs text-[#FFF01F] uppercase font-mono">{currentUser.rango}</p>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600/40 text-red-200 text-xs font-bold"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center rounded-xl bg-white/10 font-bold text-sm"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center rounded-xl bg-[#D61A1A] font-bold text-sm text-white"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CINTILLO EN VIVO: TASAS Y DESPACHO (SOLO VISIBLE PARA ADMINS) */}
      {/* ========================================================================= */}
      {currentUser?.rango === "admin" && (
        <div className="pt-24 pb-2 px-4 max-w-6xl mx-auto">
          <div className="rounded-2xl bg-[#0B0D13]/85 backdrop-blur-md border border-white/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xl">
            {/* Tasas en vivo */}
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFF01F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFF01F]"></span>
              </span>
              <span className="text-[#FFF01F] font-bold">Tasas Binance P2P:</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 text-white font-bold">
                1 USD = {tasaVes.toFixed(2)} VES
              </span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 text-white font-bold">
                1 USD = {tasaMxn.toFixed(2)} MXN
              </span>
            </div>

            {/* Feed de entregas */}
            <div className="flex items-center gap-2 text-white/90 overflow-hidden max-w-sm">
              <span className="text-[#FF007F] font-bold flex items-center gap-1 shrink-0">
                <Zap className="w-3.5 h-3.5 text-[#FF007F]" /> En Vivo:
              </span>
              <div className="truncate">
                {feedItems.length > 0 ? (
                  <span>
                    <strong className="text-[#FFF01F]">{feedItems[0].nickname_anonimo}</strong> recibió {feedItems[0].descripcion_entrega}
                  </span>
                ) : (
                  <span>Despacho automático &lt; 60 seg</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HERO SECTION (IZQUIERDA) & OFERTAS ESPECIALES CONFIGURADAS (DERECHA) */}
      {/* ========================================================================= */}
      <section id="inicio" className={`max-w-6xl mx-auto px-4 pb-12 ${currentUser?.rango === "admin" ? "pt-6" : "pt-24"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* COLUMNA IZQUIERDA: HERO COPY DE ALTA LEGIBILIDAD */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 pt-4">
            <span className="text-xs font-mono font-black tracking-widest uppercase text-[#FFF01F] drop-shadow-sm">
              Inicio
            </span>

            {/* Título en Blanco Puro de Gran Impacto y Acomodado para 100% de Visibilidad */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white leading-[1.06] tracking-tight font-sans drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
              ¡Bienvenido a <span className="text-[#FFF01F] drop-shadow-[0_0_20px_rgba(255,240,31,0.5)]">Soul Store</span>!
            </h1>

            {/* Párrafo descriptivo con contraste y sombra suave sobre el rojo */}
            <p className="text-base sm:text-lg text-white/95 font-medium leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Tu aliado confiable para recargas instantáneas de diamantes, monedas y créditos de tus videojuegos favoritos. Potencia tu experiencia gamer rápido y seguro.
            </p>

            {/* Botones de acción duales estilo Pill */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#catalogo-seccion"
                className="px-7 py-3 rounded-full bg-[#0B0D13] hover:bg-black text-[#FF007F] hover:text-white border border-[#FF007F]/40 font-bold text-sm shadow-[0_8px_25px_rgba(0,0,0,0.6)] transition-all duration-300 flex items-center gap-2 group hover:scale-105 active:scale-95"
              >
                <span>Ver Catálogo</span>
                <ChevronRight className="w-4 h-4 text-[#FF007F] group-hover:translate-x-1 transition-transform" />
              </a>

              <button
                onClick={() => setAboutModalOpen(true)}
                className="px-7 py-3 rounded-full bg-white hover:bg-red-50 border-2 border-[#D61A1A] text-[#D61A1A] font-bold text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Saber de Nosotros
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: OFERTAS ESPECIALES (DINÁMICAS SEGÚN PANEL ADMIN) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black tracking-wider uppercase text-white drop-shadow-md flex items-center gap-2">
                <span>OFERTAS ESPECIALES</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-xs font-mono font-bold">
                  ({specialOffers.length})
                </span>
              </h2>

              {currentUser?.rango === "admin" && (
                <Link
                  href="/admin"
                  className="text-xs text-[#FFF01F] hover:underline font-bold flex items-center gap-1"
                >
                  <span>Configurar en Admin</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Renderizado condicional: solo cuando se configuran ofertas en BD */}
            {specialOffers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specialOffers.map((offer) => {
                  const promoImage = offer.imagen_oferta_url || offer.imagen_url;

                  return (
                    <div 
                      key={offer.id}
                      onClick={() => setSelectedProduct(offer)}
                      className="group relative overflow-hidden rounded-2xl glass-card-dark hover:border-[#FFF01F] transition-all duration-300 cursor-pointer shadow-2xl hover:scale-[1.02] flex flex-col justify-between h-44 sm:h-48 p-4.5 border border-white/15"
                    >
                      {/* Fondo de Imagen Promocional (Exclusiva o Predeterminada) */}
                      {promoImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={promoImage} 
                            alt={offer.nombre} 
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35 group-hover:via-black/65 transition-colors" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D61A1A]/20 via-[#0B0D13] to-black" />
                      )}

                      {/* Header de la Tarjeta de Oferta */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                          {offer.imagen_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                              src={offer.imagen_url} 
                              alt="" 
                              loading="lazy"
                              decoding="async"
                              className="w-4 h-4 rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-[#FFF01F] text-xs">⚡</span>
                          )}
                          <span className="text-[11px] font-black tracking-wider text-white uppercase drop-shadow font-mono">
                            {offer.categoria_nombre || "Especial"}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF007F] to-[#D61A1A] text-white text-[11px] font-black tracking-wider shadow-lg flex items-center gap-1">
                          <span>🔥 PROMO</span>
                        </span>
                      </div>

                      {/* Pie de la Tarjeta con Título, Subcategoría y Precio */}
                      <div className="relative z-10 mt-auto pt-2">
                        {offer.subcategoria_nombre && offer.subcategoria_nombre !== "General" && (
                          <span className="inline-block text-[10px] font-mono text-[#FF007F] font-bold uppercase tracking-wider mb-0.5 drop-shadow">
                            {offer.subcategoria_nombre}
                          </span>
                        )}

                        <p className="text-base font-black text-white group-hover:text-[#FFF01F] transition-colors leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          {offer.nombre}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                          <span className="text-sm font-black text-[#FFF01F] font-mono drop-shadow">
                            {formatPrice(offer.precio_base)}
                          </span>
                          <span className="text-xs text-white bg-[#0B0D13]/80 group-hover:bg-[#FFF01F] group-hover:text-black font-bold px-3 py-1 rounded-full transition flex items-center gap-1 shadow">
                            <span>Comprar</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Mensaje elegante cuando el Admin aún no ha marcado ofertas */
              <div className="glass-card-dark rounded-3xl p-6 sm:p-8 text-center space-y-4 border border-white/15">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black mx-auto shadow-md">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ofertas Especiales en Preparación</h3>
                  <p className="text-xs text-white/80 max-w-sm mx-auto mt-1 leading-relaxed">
                    Las promociones destacadas aparecerán aquí automáticamente en cuanto actives el interruptor <strong>"Oferta Especial"</strong> en tus productos desde el Panel de Administración.
                  </p>
                </div>

                {currentUser?.rango === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF01F] hover:bg-yellow-300 text-[#0B0D13] font-bold text-xs shadow-md transition"
                  >
                    <PlusCircle className="w-4 h-4 text-[#D61A1A]" />
                    <span>Crear Oferta en Panel Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN CATÁLOGO (TOTALMENTE DINÁMICO DESDE BASE DE DATOS) */}
      {/* ========================================================================= */}
      <section id="catalogo-seccion" className="max-w-6xl mx-auto px-4 pt-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono text-[#FFF01F] uppercase tracking-widest font-black drop-shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFF01F]" /> Catálogo Oficial
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-md mt-1">
              {activeCategoryFilter === "all" && catalogViewMode === "categories"
                ? "Explora Nuestras Categorías"
                : activeCategoryFilter !== "all"
                ? (activeCategoryObj?.nombre || "Nuestros Productos")
                : "Nuestros Productos y Recargas"}
            </h3>
            <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-xl font-medium">
              {activeCategoryFilter === "all" && catalogViewMode === "categories"
                ? "Selecciona una categoría de entrada para ver sus subcategorías, paquetes y recargas instantáneas."
                : activeCategoryFilter !== "all"
                ? `Explora los paquetes, servicios y recargas disponibles en ${activeCategoryObj?.nombre || ""}.`
                : "Listado completo de productos y servicios digitales en Soul Store."}
            </p>
          </div>

          {/* Selector de Modo de Vista / Pestañas de Navegación */}
          {categoriesList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#0B0D13]/85 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-xl self-start md:self-end">
              <button
                onClick={() => {
                  setCatalogViewMode("categories");
                  setActiveCategoryFilter("all");
                  setActiveSubcategoryFilter("all");
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategoryFilter === "all" && catalogViewMode === "categories"
                    ? "bg-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.5)] font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-[#FFF01F]" />
                <span>Categorías ({categoriesList.length})</span>
              </button>

              <button
                onClick={() => {
                  setCatalogViewMode("all_products");
                  setActiveCategoryFilter("all");
                  setActiveSubcategoryFilter("all");
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  catalogViewMode === "all_products"
                    ? "bg-[#FFF01F] text-[#0B0D13] shadow-[0_0_15px_rgba(255,240,31,0.5)] font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todos ({productsList.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. MODO ENTRADA: PRESENTACIÓN VISUAL DE CATEGORÍAS */}
        {activeCategoryFilter === "all" && catalogViewMode === "categories" ? (
          categoriesList.length === 0 ? (
            /* Estado vacío si no hay categorías en BD */
            <div className="glass-card-dark rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4 border border-white/20 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-[#FFF01F] mx-auto shadow-inner">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">Catálogo en Preparación</h4>
                <p className="text-sm text-white/80 leading-relaxed">
                  Aún no has configurado categorías desde el Panel de Administración.
                  Crea tus primeras categorías y aparecerán aquí automáticamente.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFF01F] hover:bg-yellow-300 text-[#0B0D13] font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-[#D61A1A]" />
                  <span>Crear Categorías en Panel Admin</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Grid de Categorías de Entrada */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriesList.map((cat) => {
                  const catSubs = subcategoriesList.filter((s) => s.categoria_id === cat.id);
                  const stats = categoryStats[cat.id] || { prodsCount: 0, minPrice: null };

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setActiveCategoryFilter(cat.id);
                        setActiveSubcategoryFilter("all");
                      }}
                      className="glass-card-dark rounded-3xl overflow-hidden border border-white/15 hover:border-[#FFF01F] transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-2xl flex flex-col justify-between group relative"
                    >
                      {/* Imagen / Banner de Portada de la Categoría */}
                      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gradient-to-br from-black via-[#0B0D13] to-red-950">
                        {cat.imagen_url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cat.imagen_url}
                              alt={cat.nombre}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-[#0B0D13]/60 to-black/30" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-tr from-[#D61A1A]/40 via-[#0B0D13] to-[#FF007F]/30">
                            <span className="text-8xl opacity-25 select-none group-hover:scale-110 transition-transform duration-500">
                              {getCategoryIcon(cat.nombre)}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-transparent to-transparent" />
                          </div>
                        )}

                        {/* Badges superiores */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                          <div className="flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full border border-white/15 text-xs font-mono font-bold text-white shadow">
                            <span>{getCategoryIcon(cat.nombre)}</span>
                            <span className="uppercase tracking-wider">Categoría</span>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF007F] to-[#D61A1A] text-white text-[11px] font-black tracking-wider shadow font-mono">
                            {stats.prodsCount} {stats.prodsCount === 1 ? "Producto" : "Productos"}
                          </span>
                        </div>

                        {/* Título sobre el banner inferior */}
                        <div className="absolute bottom-3 left-4 right-4 z-10">
                          <h4 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#FFF01F] transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {cat.nombre}
                          </h4>
                        </div>
                      </div>

                      {/* Contenido / Detalles */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 block mb-1.5 font-bold">
                            Subcategorías / Servicios incluidos:
                          </span>
                          {catSubs.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {catSubs.map((sub) => (
                                <span
                                  key={sub.id}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white/95 font-medium flex items-center gap-1.5"
                                >
                                  {sub.imagen_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={sub.imagen_url} alt="" loading="lazy" decoding="async" className="w-3.5 h-3.5 rounded object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-[#FFF01F]">★</span>
                                  )}
                                  <span>{sub.nombre}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-white/60 italic">Recargas y compras directas</span>
                          )}
                        </div>

                        {/* Footer de la Tarjeta */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-white/60 block">
                              Precios ({currentCurrency})
                            </span>
                            <span className="text-base font-black text-[#FFF01F] font-mono">
                              {stats.minPrice !== null ? `Desde ${formatPrice(stats.minPrice)}` : "Disponible"}
                            </span>
                          </div>

                          <div className="px-4 py-2 rounded-full bg-[#FFF01F] group-hover:bg-yellow-300 text-[#0B0D13] font-black text-xs shadow-md transition flex items-center gap-1.5 group-hover:scale-105 active:scale-95">
                            <span>Explorar {cat.nombre}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#0B0D13]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* 2. MODO VISTA DE PRODUCTOS (DENTRO DE UNA CATEGORÍA O TODOS) */
          <div className="space-y-6">
            {/* Barra de Navegación & Filtro de Subcategorías */}
            <div className="space-y-3">
              {/* Botón Volver & Info de Categoría Activa */}
              {activeCategoryFilter !== "all" && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0B0D13]/85 backdrop-blur-md border border-white/15">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveCategoryFilter("all");
                        setActiveSubcategoryFilter("all");
                        setCatalogViewMode("categories");
                      }}
                      className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition hover:scale-105 active:scale-95 shadow"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#FFF01F]" />
                      <span>← Volver a Categorías</span>
                    </button>

                    <div className="h-5 w-[1px] bg-white/20 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(activeCategoryObj?.nombre || "")}</span>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#FFF01F] block font-bold leading-none">
                          Categoría
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                          {activeCategoryObj?.nombre}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#FF007F]/20 border border-[#FF007F]/40 text-[#FF007F] text-xs font-mono font-bold">
                    {filteredProducts.length} {filteredProducts.length === 1 ? "Producto disponible" : "Productos disponibles"}
                  </span>
                </div>
              )}

              {/* Subcategorías disponibles */}
              {availableSubcategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-mono text-[#FFF01F] font-bold uppercase mr-1 flex items-center gap-1 shrink-0">
                    <Tag className="w-3.5 h-3.5" /> Subcategorías:
                  </span>
                  <button
                    onClick={() => setActiveSubcategoryFilter("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
                      activeSubcategoryFilter === "all"
                        ? "bg-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)] font-black"
                        : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                  >
                    Todas ({activeCategoryFilter === "all" ? productsList.length : productsList.filter(p => p.categoria_id === activeCategoryFilter).length})
                  </button>

                  {availableSubcategories.map((sub) => {
                    const subCount = productsList.filter(p => p.subcategoria_id === sub.id).length;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubcategoryFilter(sub.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                          activeSubcategoryFilter === sub.id
                            ? "bg-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)] font-black"
                            : "bg-white/10 hover:bg-white/20 text-white/80"
                        }`}
                      >
                        {sub.imagen_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={sub.imagen_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        <span>{sub.nombre}</span>
                        <span className="text-[10px] opacity-75 font-mono">({subCount})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grid de Productos */}
            {filteredProducts.length === 0 ? (
              <div className="glass-card-dark rounded-3xl p-10 text-center max-w-md mx-auto space-y-3 border border-white/15">
                <p className="text-sm text-white/80">No hay productos en esta subcategoría o categoría todavía.</p>
                <button
                  onClick={() => {
                    setActiveCategoryFilter("all");
                    setActiveSubcategoryFilter("all");
                    setCatalogViewMode("categories");
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#FFF01F] text-black font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition"
                >
                  ← Ver Todas las Categorías
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((prod) => {
                  const prodVariants = variantsList.filter((v) => v.producto_id === prod.id && v.activo !== false);

                  return (
                    <div 
                      key={prod.id} 
                      className="glass-card-dark rounded-2xl p-5 flex flex-col justify-between relative group hover:border-[#FFF01F]/70"
                    >
                      {prod.oferta_especial && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[10px] font-black uppercase tracking-wider shadow">
                          OFERTA
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-white/80">
                            {prod.categoria_nombre || "General"}
                          </span>
                          {prod.subcategoria_nombre && prod.subcategoria_nombre !== "General" && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FF007F]/20 border border-[#FF007F]/40 text-[10px] font-mono text-[#FF007F]">
                              {prod.subcategoria_nombre}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start gap-3">
                          {prod.imagen_url ? (
                            <img 
                              src={prod.imagen_url} 
                              alt={prod.nombre} 
                              loading="lazy"
                              decoding="async"
                              className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/10 shrink-0" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black font-black text-lg shadow-md shrink-0">
                              ⚡
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-white group-hover:text-[#FFF01F] transition-colors leading-tight">
                              {prod.nombre}
                            </h4>
                            {prod.descripcion && (
                              <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">
                                {prod.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Desglose de Subproductos / Paquetes con su propia imagen, precio y botón de Comprar */}
                        {prodVariants.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFF01F] font-bold block">
                              Paquetes / Opciones ({prodVariants.length}):
                            </span>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {prodVariants.map((v) => (
                                <div 
                                  key={v.id}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 transition"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {v.imagen_url ? (
                                      <img 
                                        src={v.imagen_url} 
                                        alt={v.nombre} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0" 
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-[#0B0D13] border border-white/20 flex items-center justify-center text-[10px] text-[#FFF01F] shrink-0 font-bold">
                                        ★
                                      </div>
                                    )}
                                    <div className="truncate">
                                      <span className="text-xs font-semibold text-white block truncate">
                                        {v.nombre}
                                      </span>
                                      <span className="text-[11px] font-mono text-[#FFF01F] font-bold">
                                        {formatPrice(v.precio_base, v)}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSelectedProduct(prod);
                                      setSelectedVariant(v);
                                    }}
                                    className="px-3 py-1 rounded-full bg-[#FFF01F] hover:bg-yellow-300 text-[#0B0D13] font-bold text-[11px] shadow-sm hover:scale-105 active:scale-95 transition shrink-0"
                                  >
                                    Comprar
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-white/70 uppercase font-mono block">
                            {prodVariants.length > 0 ? `Desde (${currentCurrency})` : `Precio (${currentCurrency})`}
                          </span>
                          <span className="text-base font-black text-[#FFF01F] font-mono">
                            {prodVariants.length > 0
                              ? (() => {
                                  const minVar = prodVariants.reduce((prev, curr) => (Number(curr.precio_base) < Number(prev.precio_base) ? curr : prev), prodVariants[0]);
                                  return `Desde ${formatPrice(minVar.precio_base, minVar)}`;
                                })()
                              : formatPrice(prod.precio_base, prod)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setSelectedVariant(prodVariants.length > 0 ? prodVariants[0] : null);
                          }}
                          className="px-4 py-2 rounded-full bg-white hover:bg-yellow-50 text-[#0B0D13] font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition flex items-center gap-1"
                        >
                          <span>{prodVariants.length > 0 ? "Comprar / Opciones" : "Comprar"}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#D61A1A]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. MODAL DE CHECKOUT (MANTIENE LA FUNCIONALIDAD CON LA NUEVA PALETA) */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          variant={selectedVariant}
          variants={variantsList.filter((v) => v.producto_id === selectedProduct.id && v.activo !== false)}
          tasaVes={tasaVes}
          tasaMxn={tasaMxn}
          defaultCurrency={currentCurrency}
          currentUser={currentUser}
          onClose={() => {
            setSelectedProduct(null);
            setSelectedVariant(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL "SABER DE NOSOTROS" & GARANTÍAS */}
      {/* ========================================================================= */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0D13]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#0B0D13] border border-white/15 relative shadow-2xl my-8 text-white space-y-5">
            <button
              onClick={() => setAboutModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black font-black">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#FF007F] uppercase font-bold tracking-wider">Soul Store Oficial</span>
                <h3 className="text-xl font-black text-white">¿Por Qué Confiar en Nosotros?</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              En <strong>Soul Store</strong> somos tu plataforma líder en recargas gamer y servicios digitales con entrega inmediata. Nuestro sistema automatizado se enlaza con servidores oficiales para procesar tu orden en menos de 60 segundos.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[#FFF01F] font-bold flex items-center gap-1">⚡ Entrega &lt; 60s</span>
                <p className="text-slate-400 text-[11px]">Acreditación directa por Player ID o código digital.</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[#FF007F] font-bold flex items-center gap-1">🔒 Garantía 100%</span>
                <p className="text-slate-400 text-[11px]">Protección total de tu dinero con soporte dedicado.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 to-amber-950/40 border border-[#FFF01F]/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">¿Deseas atención directa?</p>
                <p className="text-[11px] text-slate-400">Canal directo por WhatsApp.</p>
              </div>
              <a
                href="https://wa.me/584248901572?text=Hola%20Soul%20Store!%20Tengo%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => setAboutModalOpen(false)}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL "CONTÁCTANOS" */}
      {/* ========================================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0D13]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#0B0D13] border border-white/15 relative shadow-2xl my-8 text-white space-y-5">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D61A1A] flex items-center justify-center text-white">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#FFF01F] uppercase font-bold tracking-wider">Atención al Cliente</span>
                <h3 className="text-xl font-black text-white">Canales Oficiales</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Estamos disponibles todos los días para resolver dudas sobre pedidos, pagos en Bolívares (VES), Pesos Mexicanos (MXN) o USDT.
            </p>

            <div className="space-y-3">
              <a
                href="https://wa.me/584248901572?text=Hola%20Soul%20Store!%20Requiero%20asistencia."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">WhatsApp Soporte Inmediato</p>
                    <p className="text-[11px] text-emerald-400">+58 424 8901572</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/tickets"
                className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF01F] flex items-center justify-center text-black font-bold">
                    <Zap className="w-5 h-5 text-[#D61A1A]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Sistema de Tickets de Soporte</p>
                    <p className="text-[11px] text-slate-400">Seguimiento formal de incidentes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <button
              onClick={() => setContactModalOpen(false)}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL DE CARRITO */}
      {/* ========================================================================= */}
      {cartModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0D13]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0B0D13] border border-white/15 relative shadow-2xl my-8 text-white space-y-4">
            <button
              onClick={() => setCartModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FFF01F]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Tu Carrito</h3>
                <p className="text-xs text-slate-400">Compras directas instantáneas</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <p className="text-xs text-slate-300">
                Selecciona cualquier producto del catálogo para abrir el formulario de despacho inmediato por Player ID.
              </p>
              <button
                onClick={() => setCartModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-[#D61A1A] hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
              >
                Explorar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FOOTER LIMPIO CON BRANDING */}
      {/* ========================================================================= */}
      <footer className="max-w-6xl mx-auto px-4 mt-20 pt-8 border-t border-white/20 text-xs text-white/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] p-0.5">
            <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
              <Flame className="w-3 h-3 text-[#FFF01F]" />
            </div>
          </div>
          <span className="font-bold text-white">Soul Store</span>
          <span className="text-white/70">© 2026. Todos los derechos reservados.</span>
        </div>

        <div className="flex items-center gap-5 font-semibold text-white/90">
          <button onClick={() => setAboutModalOpen(true)} className="hover:text-[#FFF01F] transition">
            Términos &amp; Garantía
          </button>
          <button onClick={() => setContactModalOpen(true)} className="hover:text-[#FFF01F] transition">
            Contacto
          </button>
          <Link href="/tickets" className="hover:text-[#FFF01F] transition">
            Soporte
          </Link>
          {currentUser?.rango === "admin" && (
            <Link href="/admin" className="hover:text-[#FFF01F] transition text-[#FFF01F]">
              Panel Admin
            </Link>
          )}
        </div>
      </footer>

    </div>
  );
}
