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
  Tag,
  Tv,
  Gamepad2,
  Gift,
  ListFilter
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

/* Componente de Tag Graffiti Estilo Urbano "SOUL STORE" */
function GraffitiTag({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div 
      className={`font-graffiti select-none pointer-events-none tracking-normal uppercase font-black leading-[0.8] text-center text-[#FF007F] drop-shadow-[0_2px_10px_rgba(255,0,127,0.7)] ${className}`}
      style={style}
    >
      <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight">SOUL</div>
      <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight -mt-2">STORE</div>
    </div>
  );
}

/* Carrusel móvil aislado para evitar re-renderizados globales */
function MobileOffersCarousel({ 
  offers, 
  onSelect, 
  formatPrice 
}: { 
  offers: Product[]; 
  onSelect: (p: Product) => void; 
  formatPrice: (price: number, item?: any) => string; 
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const currentOffer = offers[activeIdx] || offers[0];
  const promoImg = currentOffer?.imagen_oferta_url || currentOffer?.imagen_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80";

  if (!currentOffer) return null;

  return (
    <div className="space-y-3">
      <div 
        onClick={() => onSelect(currentOffer)}
        className="group relative h-48 rounded-3xl overflow-hidden border border-white/15 shadow-2xl p-4 flex flex-col justify-between cursor-pointer bg-[#12141D]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={promoImg} 
          alt={currentOffer.nombre} 
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/80 border border-white/10 text-white text-[11px] font-bold font-mono">
            ✦ {currentOffer.categoria_nombre || "Gaming"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#FF007F] text-white text-[11px] font-black uppercase">
            ▶ PROMO
          </span>
        </div>

        <div className="relative z-10 mt-auto">
          <span className="text-[11px] font-mono text-[#FF007F] font-bold uppercase tracking-wider block">
            {currentOffer.subcategoria_nombre || "FREE FIRE"}
          </span>
          <p className="text-base font-black text-white leading-tight">
            {currentOffer.nombre}
          </p>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
            <span className="text-sm font-black text-[#FFF01F] font-mono">
              {formatPrice(currentOffer.precio_base, currentOffer)}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs shadow flex items-center gap-1">
              <span>Comprar</span>
              <span>&rarr;</span>
            </span>
          </div>
        </div>
      </div>

      {/* Indicadores de Paginación Móvil */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {offers.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setActiveIdx(idx); }}
            className={`rounded-full transition-all ${
              activeIdx === idx
                ? "w-4 h-2 bg-[#D61A1A] shadow-[0_0_8px_#D61A1A]"
                : "w-2 h-2 bg-white/30"
            }`}
            aria-label={`Ver oferta ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

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
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => {
        if (d.feed && d.feed.length > 0) {
          setFeedItems(d.feed);
        } else {
          setFeedItems([
            { id: "1", nickname_anonimo: "Gamer***", descripcion_entrega: "100+10 Diamantes Acreditados", creado_en: "Hace 1 min" }
          ]);
        }
      })
      .catch(() => {
        setFeedItems([
          { id: "1", nickname_anonimo: "Gamer***", descripcion_entrega: "100+10 Diamantes Acreditados", creado_en: "Hace 1 min" }
        ]);
      });

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

  // Formateo de precio según la moneda activa
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

  // Icono para cada categoría según nombre
  const getCategoryIconComponent = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("stream") || n.includes("netflix") || n.includes("pantalla") || n.includes("video")) {
      return <Tv className="w-8 h-8 text-cyan-400" />;
    }
    if (n.includes("game") || n.includes("juego") || n.includes("free fire")) {
      return <Gamepad2 className="w-8 h-8 text-[#FFF01F]" />;
    }
    if (n.includes("promo") || n.includes("paquete") || n.includes("oferta")) {
      return <Gift className="w-8 h-8 text-[#FF007F]" />;
    }
    return <Crown className="w-8 h-8 text-amber-400" />;
  };

  // Estadísticas memoizadas de categorías
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

  const availableSubcategories = useMemo(() => {
    return subcategoriesList.filter((s) => {
      if (activeCategoryFilter === "all") return true;
      return s.categoria_id === activeCategoryFilter;
    });
  }, [subcategoriesList, activeCategoryFilter]);

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

  // Lista de exactamente 4 ofertas especiales para PC (o las configuradas en BD)
  const specialOffersList = useMemo(() => {
    const dbOffers = productsList.filter((p) => p.oferta_especial);
    const nonOffers = productsList.filter((p) => !p.oferta_especial);

    // Asegurar 4 elementos para llenar exactamente el cuadro en PC
    const combined = [...dbOffers];
    for (const prod of nonOffers) {
      if (combined.length >= 4) break;
      combined.push(prod);
    }

    // Fallbacks si la base de datos tiene menos de 4 productos en total
    if (combined.length === 0) {
      combined.push({
        id: "mock-1",
        nombre: "Free Fire 100+10 Diamantes",
        slug: "free-fire-100-10",
        descripcion: "Recarga directa por Player ID",
        imagen_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
        precio_base: 0.95,
        oferta_especial: true,
        categoria_id: "gaming",
        categoria_nombre: "Gaming",
        subcategoria_nombre: "Free Fire"
      });
    }

    // Si aún faltan para llegar a 4 en PC, duplicar referencias con variantes o mocks
    while (combined.length < 4) {
      const base = combined[combined.length % combined.length];
      combined.push({
        ...base,
        id: `${base.id}-copy-${combined.length}`,
        nombre: combined.length === 1 ? "Pase Booyah / Premium" : combined.length === 2 ? "Mobile Legends 86+8" : "Roblox 400 Robux",
        precio_base: combined.length === 1 ? 2.00 : combined.length === 2 ? 1.50 : 4.99,
      });
    }

    return combined.slice(0, 4);
  }, [productsList]);

  return (
    <div className="min-h-screen text-white relative selection:bg-[#FF007F] selection:text-white pb-24 overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* CAPA DE FONDO FIJO CON ROJO Y AMARILLO VIBRANTE (EXACTO AL DISEÑO)        */}
      {/* ========================================================================= */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none -z-10 bg-soul-fiery overflow-hidden transform-gpu will-change-transform"
      >
        {/* Viñeta suave en bordes sin oscurecer los colores vibrantes del fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

        {/* Letras rosadas de Graffiti moviéndose por toda la página */}
        <div className="absolute top-[8%] -left-8 md:left-4 animate-graffiti-1 opacity-70">
          <GraffitiTag />
        </div>

        <div className="absolute top-[14%] -right-12 md:right-8 animate-graffiti-2 opacity-65">
          <GraffitiTag />
        </div>

        <div className="absolute top-[52%] -left-14 md:left-10 animate-graffiti-3 opacity-60">
          <GraffitiTag />
        </div>

        <div className="absolute top-[58%] -right-14 md:right-10 animate-graffiti-4 opacity-65">
          <GraffitiTag />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR (HEADER SEGÚN IMAGEN DEL DISEÑO)                        */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0D13]/70 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3 transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
              aria-label="Abrir Menú"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              {/* Círculo dorado con llama interior */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-0.5 shadow-[0_0_12px_rgba(255,240,31,0.5)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#FFF01F]" />
                </div>
              </div>
              <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1 font-sans">
                Soul <span className="text-[#FFF01F]">Store</span>
              </span>
            </Link>
          </div>

          {/* Center: Navegación de Escritorio con subrayado rosado activo */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            <a 
              href="#inicio" 
              className="text-white relative py-1 hover:text-[#FFF01F] transition flex flex-col items-center group"
            >
              <span className="text-white">Inicio</span>
              <span className="w-7 h-0.5 bg-[#FF007F] rounded-full mt-1 shadow-[0_0_8px_#FF007F]"></span>
            </a>
            <button 
              onClick={() => setContactModalOpen(true)}
              className="text-zinc-300 hover:text-white transition"
            >
              Contáctanos
            </button>
            <button 
              onClick={() => setAboutModalOpen(true)}
              className="text-zinc-300 hover:text-white transition"
            >
              Soporte
            </button>
          </nav>

          {/* Right: Selector de Moneda, Carrito y Botón Ingresar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Selector de Moneda Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition shadow-sm"
              >
                <span>$ {currentCurrency}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/70" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-[#0B0D13]/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl z-50 text-xs">
                  <button
                    onClick={() => { setCurrentCurrency("USD"); setCurrencyDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      currentCurrency === "USD" ? "bg-[#FF007F] text-white font-bold" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span>USD ($)</span>
                    {currentCurrency === "USD" && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button
                    onClick={() => { setCurrentCurrency("VES"); setCurrencyDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      currentCurrency === "VES" ? "bg-[#FF007F] text-white font-bold" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span>VES (Bs.)</span>
                    {currentCurrency === "VES" && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button
                    onClick={() => { setCurrentCurrency("MXN"); setCurrencyDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      currentCurrency === "MXN" ? "bg-[#FF007F] text-white font-bold" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span>MXN ($)</span>
                    {currentCurrency === "MXN" && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              )}
            </div>

            {/* Carrito de Compras */}
            <button 
              onClick={() => setCartModalOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white transition relative"
              aria-label="Carrito de Compras"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>

            {/* Botón Ingresar / Perfil / Admin */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.rango === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF01F] text-[#0B0D13] text-xs font-black uppercase shadow-md hover:bg-yellow-300 transition"
                    title="Panel Administrativo"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#D61A1A]" />
                    <span className="hidden sm:inline">ADMIN</span>
                  </Link>
                )}

                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#FFF01F] flex items-center justify-center text-xs font-bold text-black border border-white/20 shadow-md cursor-pointer"
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
                className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition"
              >
                Ingresar
              </Link>
            )}

          </div>
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
                  className="py-3 text-center rounded-xl bg-[#FF007F] font-bold text-sm text-white"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO SECTION & OFERTAS ESPECIALES (CUADRO PRINCIPAL CON 4 CUADROS)      */}
      {/* ========================================================================= */}
      <section id="inicio" className="max-w-6xl mx-auto px-4 pt-24 sm:pt-28 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* COLUMNA IZQUIERDA: MENSAJE DE BIENVENIDA */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-white leading-[1.08] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              ¡Bienvenido a <span className="text-[#FFF01F] drop-shadow-[0_0_20px_rgba(255,240,31,0.5)]">Soul Store!</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Tu aliado confiable para recargas instantáneas de diamantes, monedas y créditos de tus videojuegos favoritos. Potencia tu experiencia gamer rápido y seguro.
            </p>

            {/* Botones de acción Ver Catálogo y Saber de Nosotros */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalogo-seccion"
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95"
              >
                <span>Ver Catálogo</span>
                <ChevronRight className="w-4 h-4 text-black stroke-[3]" />
              </a>

              <button
                onClick={() => setAboutModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-black/40 border border-[#FF007F]/50 text-white font-semibold text-xs sm:text-sm hover:border-[#FF007F] hover:bg-black/60 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Saber de Nosotros
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: OFERTAS ESPECIALES */}
          {/* EN PC: ES UN CUADRO Y DENTRO DE ESE CUADRO OTRAS 4 CUADROS DE OFERTAS ESPECIALES */}
          <div className="lg:col-span-6 space-y-3">
            
            {/* Header del Cuadro de Ofertas Especiales */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white drop-shadow">
                  OFERTAS ESPECIALES
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[11px] font-black font-mono shadow-[0_0_10px_#FF007F]">
                  ({specialOffersList.length})
                </span>
              </div>

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

            {/* ============================================================== */}
            {/* VISTA PC: UN CUADRO GRANDE CONTENIENDO LOS 4 CUADROS DE OFERTA */}
            {/* ============================================================== */}
            <div className="hidden sm:block p-4 sm:p-5 rounded-3xl bg-[#0B0D13]/85 border border-white/15 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-2 gap-3.5">
                {specialOffersList.map((offer) => {
                  const promoImage = offer.imagen_oferta_url || offer.imagen_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80";

                  return (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedProduct(offer)}
                      className="group relative h-44 rounded-2xl overflow-hidden border border-white/15 hover:border-[#FFF01F] transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between p-3.5 bg-[#12141D]"
                    >
                      {/* Imagen de Fondo de la Oferta */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={promoImage} 
                        alt={offer.nombre} 
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35 group-hover:via-black/60 transition-colors" />

                      {/* Badges superiores: GAMING + PROMO */}
                      <div className="relative z-10 flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                          ✦ {offer.categoria_nombre || "Gaming"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[10px] font-black uppercase tracking-wider shadow">
                          ▶ PROMO
                        </span>
                      </div>

                      {/* Datos y Botón Comprar */}
                      <div className="relative z-10 mt-auto">
                        <span className="text-[10px] font-mono text-[#FF007F] font-bold uppercase tracking-wider block">
                          {offer.subcategoria_nombre || "FREE FIRE"}
                        </span>
                        <p className="text-sm font-black text-white group-hover:text-[#FFF01F] transition-colors leading-tight truncate">
                          {offer.nombre}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/15">
                          <span className="text-xs font-black text-[#FFF01F] font-mono">
                            {formatPrice(offer.precio_base, offer)}
                          </span>
                          <button className="px-3 py-1 rounded-full bg-white text-black font-bold text-[11px] group-hover:bg-[#FFF01F] transition-all shadow flex items-center gap-1">
                            <span>Comprar</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación de 4 puntos debajo del cuadro en PC */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D61A1A] shadow-[0_0_8px_#D61A1A]"></span>
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* VISTA MÓVIL: CARRUSEL DESLIZANTE CON LOS PUNTOS DE PAGINACIÓN */}
            {/* ============================================================== */}
            <div className="block sm:hidden">
              <MobileOffersCarousel 
                offers={specialOffersList} 
                onSelect={setSelectedProduct} 
                formatPrice={formatPrice} 
              />
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECCIÓN CATEGORÍAS (EXACTA A LA CAPTURA DEL DISEÑO)                    */}
      {/* ========================================================================= */}
      <section id="catalogo-seccion" className="max-w-6xl mx-auto px-4 pt-6">
        
        {/* Encabezado según Imagen */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            {/* Tag oficial en escritorio */}
            <span className="hidden sm:inline-block text-xs font-mono text-[#FF007F] uppercase tracking-widest font-black mb-1">
              ✦ CATÁLOGO OFICIAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase sm:normal-case">
              {activeCategoryFilter === "all" && catalogViewMode === "categories"
                ? "Explora Nuestras Categorías"
                : activeCategoryFilter !== "all"
                ? (activeCategoryObj?.nombre || "Categoría")
                : "Todos los Productos"}
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
              Selecciona una categoría de entrada para ver sus subcategorías, paquetes y recargas.
            </p>
          </div>

          {/* Filtros tipo Pill a la derecha */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              onClick={() => {
                setCatalogViewMode("categories");
                setActiveCategoryFilter("all");
                setActiveSubcategoryFilter("all");
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategoryFilter === "all" && catalogViewMode === "categories"
                  ? "bg-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)] font-black"
                  : "bg-black/50 text-white/80 border border-white/10 hover:text-white"
              }`}
            >
              Categorías ({categoriesList.length})
            </button>

            <button
              onClick={() => {
                setCatalogViewMode("all_products");
                setActiveCategoryFilter("all");
                setActiveSubcategoryFilter("all");
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                catalogViewMode === "all_products"
                  ? "bg-[#FFF01F] text-black shadow-[0_0_12px_rgba(255,240,31,0.5)] font-black"
                  : "bg-black/50 text-white/80 border border-white/10 hover:text-white"
              }`}
            >
              Todos ({productsList.length})
            </button>
          </div>
        </div>

        {/* 1. MODO CUADRÍCULA DE CATEGORÍAS (4 COLUMNAS EN PC, 2 EN MÓVIL) */}
        {activeCategoryFilter === "all" && catalogViewMode === "categories" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4.5">
            {categoriesList.map((cat) => {
              const stats = categoryStats[cat.id] || { prodsCount: 0, minPrice: null };

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryFilter(cat.id);
                    setActiveSubcategoryFilter("all");
                  }}
                  className="rounded-2xl bg-[#141620]/90 border border-white/10 hover:border-[#FF007F]/60 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-xl p-4 flex flex-col justify-between h-44 sm:h-48 group relative"
                >
                  {/* Fila Superior: Badge CATEGORÍA + Badge Contador */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-white text-[10px] font-mono uppercase tracking-wider">
                      ✦ CATEGORÍA
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[10px] font-mono font-bold">
                      {stats.prodsCount} {stats.prodsCount === 1 ? "Producto" : "Productos"}
                    </span>
                  </div>

                  {/* Centro de la Tarjeta: Icono Representativo con Glow Suave */}
                  <div className="my-auto flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#FF007F]/40 transition-all duration-300 shadow-inner">
                      {getCategoryIconComponent(cat.nombre)}
                    </div>
                  </div>

                  {/* Pie de la Tarjeta: Nombre de la Categoría y Cantidad */}
                  <div className="text-center pt-2">
                    <h3 className="text-base font-black text-white group-hover:text-[#FFF01F] transition-colors leading-tight">
                      {cat.nombre}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {stats.prodsCount} {stats.prodsCount === 1 ? "Producto" : "Productos"}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Tarjeta de "Todos los Productos" para completar las 4 columnas */}
            <div
              onClick={() => {
                setCatalogViewMode("all_products");
                setActiveCategoryFilter("all");
              }}
              className="rounded-2xl bg-[#141620]/90 border border-white/10 hover:border-[#FFF01F]/60 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-xl p-4 flex flex-col justify-between h-44 sm:h-48 group relative"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-white text-[10px] font-mono uppercase tracking-wider">
                  ✦ CATÁLOGO
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF01F] text-black text-[10px] font-mono font-bold">
                  {productsList.length} Total
                </span>
              </div>

              <div className="my-auto flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#FFF01F]/40 transition-all duration-300 shadow-inner">
                  <ListFilter className="w-8 h-8 text-[#FFF01F]" />
                </div>
              </div>

              <div className="text-center pt-2">
                <h3 className="text-base font-black text-white group-hover:text-[#FFF01F] transition-colors leading-tight">
                  Todos
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Ver Todo ({productsList.length})
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 2. MODO VISTA DE PRODUCTOS (CUANDO SE HACE CLIC EN UNA CATEGORÍA O TODOS) */
          <div className="space-y-6">
            
            {/* Barra de Navegación & Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#0B0D13]/85 border border-white/15">
              <button
                onClick={() => {
                  setActiveCategoryFilter("all");
                  setActiveSubcategoryFilter("all");
                  setCatalogViewMode("categories");
                }}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#FFF01F]" />
                <span>← Volver a Categorías</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#FFF01F] font-bold">
                  {activeCategoryObj ? activeCategoryObj.nombre : "Todos los Productos"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF007F] text-white text-xs font-mono font-bold">
                  {filteredProducts.length} disponibles
                </span>
              </div>
            </div>

            {/* Subcategorías disponibles */}
            {availableSubcategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-black/40 border border-white/10">
                <span className="text-xs font-mono text-[#FFF01F] font-bold uppercase mr-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Subcategorías:
                </span>
                <button
                  onClick={() => setActiveSubcategoryFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    activeSubcategoryFilter === "all"
                      ? "bg-[#FF007F] text-white shadow font-black"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  Todas
                </button>

                {availableSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategoryFilter(sub.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      activeSubcategoryFilter === sub.id
                        ? "bg-[#FF007F] text-white shadow font-black"
                        : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                  >
                    <span>{sub.nombre}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Cuadrícula de Productos */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl p-10 text-center max-w-md mx-auto space-y-3 bg-[#0B0D13]/80 border border-white/15">
                <PackageOpen className="w-10 h-10 text-[#FFF01F] mx-auto" />
                <p className="text-sm text-white/80">No hay productos en esta categoría por ahora.</p>
                <button
                  onClick={() => {
                    setActiveCategoryFilter("all");
                    setActiveSubcategoryFilter("all");
                    setCatalogViewMode("categories");
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#FFF01F] text-black font-bold text-xs"
                >
                  Ver Categorías
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((prod) => {
                  const prodVariants = variantsList.filter((v) => v.producto_id === prod.id && v.activo !== false);

                  return (
                    <div 
                      key={prod.id} 
                      className="rounded-2xl p-4.5 bg-[#141620]/90 border border-white/15 hover:border-[#FFF01F] transition-all flex flex-col justify-between group shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300">
                            {prod.categoria_nombre || "General"}
                          </span>
                          {prod.oferta_especial && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[10px] font-black uppercase tracking-wider">
                              OFERTA
                            </span>
                          )}
                        </div>

                        <div className="flex items-start gap-3">
                          {prod.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={prod.imagen_url} 
                              alt={prod.nombre} 
                              loading="lazy"
                              decoding="async"
                              className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black font-black text-lg shadow shrink-0">
                              ⚡
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-white group-hover:text-[#FFF01F] transition-colors leading-tight">
                              {prod.nombre}
                            </h4>
                            {prod.descripcion && (
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {prod.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Variantes del Producto */}
                        {prodVariants.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-[#FFF01F] font-bold block">
                              Opciones ({prodVariants.length}):
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {prodVariants.map((v) => (
                                <div 
                                  key={v.id}
                                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between text-xs transition"
                                >
                                  <span className="truncate pr-1 font-medium">{v.nombre}</span>
                                  <span className="font-mono text-[#FFF01F] font-bold shrink-0">
                                    {formatPrice(v.precio_base, v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                            Precio
                          </span>
                          <span className="text-base font-black text-[#FFF01F] font-mono">
                            {formatPrice(prod.precio_base, prod)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setSelectedVariant(prodVariants.length > 0 ? prodVariants[0] : null);
                          }}
                          className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-[#FFF01F] transition flex items-center gap-1 shadow"
                        >
                          <span>Comprar</span>
                          <ChevronRight className="w-3.5 h-3.5 text-black" />
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
      {/* 4. MODAL DE CHECKOUT & PAGO                                               */}
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
      {/* 5. MODAL SABER DE NOSOTROS                                                */}
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
              En <strong>Soul Store</strong> somos tu plataforma gamer con entrega inmediata. Nuestro sistema se enlaza directamente para procesar tus recargas y entregas en menos de 60 segundos.
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
      {/* 6. MODAL CONTÁCTANOS                                                      */}
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
              <div className="w-12 h-12 rounded-2xl bg-[#FF007F] flex items-center justify-center text-white">
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
      {/* 7. MODAL DE CARRITO                                                       */}
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
                className="px-5 py-2.5 rounded-full bg-[#FF007F] hover:bg-[#FF1493] text-white font-bold text-xs shadow-md transition"
              >
                Explorar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="max-w-6xl mx-auto px-4 mt-20 pt-8 border-t border-white/15 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] p-0.5">
            <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
              <Flame className="w-3 h-3 text-[#FFF01F]" />
            </div>
          </div>
          <span className="font-bold text-white">Soul Store</span>
          <span>© 2026. Todos los derechos reservados.</span>
        </div>

        <div className="flex items-center gap-5 font-semibold text-zinc-400">
          <button onClick={() => setAboutModalOpen(true)} className="hover:text-white transition">
            Términos &amp; Garantía
          </button>
          <button onClick={() => setContactModalOpen(true)} className="hover:text-white transition">
            Contacto
          </button>
          <Link href="/tickets" className="hover:text-white transition">
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
