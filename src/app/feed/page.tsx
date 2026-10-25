"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  ArrowLeft,
  Heart,
  MessageSquare,
  Send,
  Check,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Search,
  Share2,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Clock,
  ThumbsUp,
  User,
  Crown,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface FeedComment {
  id: string;
  autor_nombre: string;
  comentario: string;
  creado_en: string;
}

export interface FeedItem {
  id: string;
  nickname_anonimo: string;
  descripcion_entrega: string;
  comentario_cliente?: string | null;
  likes_count: number;
  creado_en: string;
  comentarios?: FeedComment[];
}

interface UserProfile {
  id: string;
  nombre?: string;
  apellido?: string;
  nickname: string;
  email: string;
  rango: string;
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("ALL");
  const [likedFeedIds, setLikedFeedIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [commentAuthor, setCommentAuthor] = useState("");
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  // 1. Cargar sesión de usuario
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setCurrentUser(data.user);
              setCommentAuthor(data.user.nickname || data.user.nombre || "");
            }
          }
        }
      } catch (err) {
        console.error("Error cargando usuario:", err);
      }
    };
    checkUser();
  }, [supabase]);

  // 2. Cargar likes almacenados localmente
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLikes = JSON.parse(localStorage.getItem("soul_feed_likes") || "[]");
        setLikedFeedIds(new Set(savedLikes));
      } catch {}
    }
  }, []);

  // 3. Cargar entregas del Feed desde la API
  const fetchFeed = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data.feed && Array.isArray(data.feed)) {
        setFeedItems(data.feed);
      }
    } catch (err) {
      console.error("Error al obtener el feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // 4. Manejo de Like interactivo
  const handleToggleLike = async (item: FeedItem) => {
    const isCurrentlyLiked = likedFeedIds.has(item.id);
    const newLiked = new Set(likedFeedIds);

    if (isCurrentlyLiked) {
      newLiked.delete(item.id);
    } else {
      newLiked.add(item.id);
    }

    setLikedFeedIds(newLiked);
    if (typeof window !== "undefined") {
      localStorage.setItem("soul_feed_likes", JSON.stringify(Array.from(newLiked)));
    }

    // Actualización optimista del contador
    setFeedItems((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? {
              ...f,
              likes_count: isCurrentlyLiked
                ? Math.max(0, (f.likes_count || 0) - 1)
                : (f.likes_count || 0) + 1,
            }
          : f
      )
    );

    let clientId = currentUser?.id;
    if (!clientId && typeof window !== "undefined") {
      clientId = localStorage.getItem("soul_client_ident") || "";
      if (!clientId) {
        clientId = "client_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("soul_client_ident", clientId);
      }
    }

    try {
      const res = await fetch("/api/feed/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feed_id: item.id,
          identificador: clientId || "guest_device",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedItems((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, likes_count: data.likes_count } : f))
        );
      }
    } catch (e) {
      console.error("Error al enviar like:", e);
    }
  };

  // 5. Publicar comentario en una entrega
  const handlePostComment = async (feedId: string) => {
    const text = (newCommentText[feedId] || "").trim();
    if (!text) return;

    const author =
      commentAuthor.trim() ||
      currentUser?.nickname ||
      currentUser?.nombre ||
      "Cliente Verificado";

    setSubmittingComment(feedId);

    try {
      const res = await fetch("/api/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feed_id: feedId,
          autor_nombre: author,
          comentario: text,
          usuario_id: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.comment) {
        setFeedItems((prev) =>
          prev.map((f) =>
            f.id === feedId
              ? {
                  ...f,
                  comentarios: [...(f.comentarios || []), data.comment],
                }
              : f
          )
        );
        setNewCommentText((prev) => ({ ...prev, [feedId]: "" }));
      }
    } catch (e) {
      console.error("Error al publicar comentario:", e);
    } finally {
      setSubmittingComment(null);
    }
  };

  // 6. Copiar enlace de la entrega
  const handleShareDelivery = (id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/feed#delivery-${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // 7. Filtrado de entregas
  const filteredItems = useMemo(() => {
    let result = feedItems;

    // Filtro por tag rápido
    if (filterTag === "LIKED") {
      result = result.filter((item) => likedFeedIds.has(item.id));
    } else if (filterTag === "FREE_FIRE") {
      result = result.filter((item) =>
        item.descripcion_entrega.toLowerCase().includes("free fire") ||
        item.descripcion_entrega.toLowerCase().includes("diamante")
      );
    } else if (filterTag === "BLOOD_STRIKE") {
      result = result.filter((item) =>
        item.descripcion_entrega.toLowerCase().includes("blood strike") ||
        item.descripcion_entrega.toLowerCase().includes("oro")
      );
    } else if (filterTag === "MOST_LIKED") {
      result = [...result].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    // Filtro por término de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.descripcion_entrega.toLowerCase().includes(q) ||
          item.nickname_anonimo.toLowerCase().includes(q) ||
          (item.comentario_cliente && item.comentario_cliente.toLowerCase().includes(q))
      );
    }

    return result;
  }, [feedItems, searchQuery, filterTag, likedFeedIds]);

  // Métricas para la cabecera
  const totalEntregas = feedItems.length;
  const totalLikes = useMemo(
    () => feedItems.reduce((acc, curr) => acc + (curr.likes_count || 0), 0),
    [feedItems]
  );
  const totalComentarios = useMemo(
    () => feedItems.reduce((acc, curr) => acc + (curr.comentarios?.length || 0), 0),
    [feedItems]
  );

  return (
    <div className="min-h-screen bg-[#06080D] text-white selection:bg-[#FF007F] selection:text-white relative overflow-x-hidden font-sans">
      
      {/* Fondo con brillo ambiental */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#FF007F]/10 via-[#FFF01F]/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-t from-emerald-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* ========================================================================= */}
      {/* HEADER / NAVBAR                                                          */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#06080D]/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Volver a Inicio */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-0.5 shadow-[0_0_12px_rgba(255,240,31,0.5)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#FFF01F]" />
                </div>
              </div>
              <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1 font-sans">
                Soul <span className="text-[#FFF01F]">Store</span>
              </span>
            </Link>

            <span className="text-zinc-600 hidden sm:inline">/</span>
            
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Feed en Vivo
            </span>
          </div>

          {/* Navegación Derecha */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Tienda</span>
            </Link>

            <Link
              href="/#catalogo"
              className="hidden md:flex px-3.5 py-1.5 rounded-xl bg-[#FFF01F] hover:bg-yellow-300 text-black font-extrabold text-xs transition shadow-[0_0_15px_rgba(255,240,31,0.3)] items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Catálogo</span>
            </Link>

            {currentUser?.rango === "admin" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION DEDICADO AL FEED                                             */}
      {/* ========================================================================= */}
      <main className="max-w-6xl mx-auto px-4 pt-10 pb-20 relative z-10">
        
        {/* Cabecera Principal */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>COMUNIDAD &amp; ENTREGAS EN VIVO</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            Feed de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF01F] via-yellow-300 to-[#FF007F]">Entregas &amp; Opiniones</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mt-3">
            Comprueba en tiempo real cada recarga despachada con éxito por Soul Store.
            Apoya a la comunidad con tu like y déjanos tu experiencia.
          </p>
        </div>

        {/* Tarjetas de Métricas de Confianza */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalEntregas}</p>
              <p className="text-xs text-zinc-400 font-medium">Entregas Verificadas</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalLikes}</p>
              <p className="text-xs text-zinc-400 font-medium">Likes de la Comunidad</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF01F]/15 border border-[#FFF01F]/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-[#FFF01F]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalComentarios}</p>
              <p className="text-xs text-zinc-400 font-medium">Opiniones de Clientes</p>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda, Filtros Rápidos y Botón Actualizar */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Input de búsqueda */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por juego, producto o cliente (ej: Free Fire, 2180, Booyah)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FFF01F] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botón de recarga en vivo */}
            <button
              onClick={() => fetchFeed(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#FFF01F]" : ""}`} />
              <span>{refreshing ? "Actualizando..." : "Actualizar"}</span>
            </button>
          </div>

          {/* Filtros por Categoría */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1 shrink-0">Filtrar:</span>
            
            <button
              onClick={() => setFilterTag("ALL")}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterTag === "ALL"
                  ? "bg-white text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              Todas ({feedItems.length})
            </button>

            <button
              onClick={() => setFilterTag("FREE_FIRE")}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterTag === "FREE_FIRE"
                  ? "bg-[#FFF01F] text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              🔥 Free Fire
            </button>

            <button
              onClick={() => setFilterTag("BLOOD_STRIKE")}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterTag === "BLOOD_STRIKE"
                  ? "bg-cyan-400 text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              ⚡ Blood Strike
            </button>

            <button
              onClick={() => setFilterTag("MOST_LIKED")}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterTag === "MOST_LIKED"
                  ? "bg-rose-500 text-white font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              ❤️ Más Votadas
            </button>

            <button
              onClick={() => setFilterTag("LIKED")}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterTag === "LIKED"
                  ? "bg-purple-600 text-white font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              ⭐ Mis Likes ({likedFeedIds.size})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRILLA DE ENTREGAS & RESEÑAS                                              */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#FFF01F] animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Cargando entregas en vivo...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-[#0B0D13]/70 border border-white/10 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No se encontraron entregas</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {searchQuery ? "No hay resultados para tu búsqueda." : "Aún no hay entregas bajo este filtro."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const isLiked = likedFeedIds.has(item.id);
              const isCommentsOpen = Boolean(expandedComments[item.id]);
              const commentsCount = item.comentarios?.length || 0;

              return (
                <div
                  key={item.id}
                  id={`delivery-${item.id}`}
                  className="bg-[#0B0D13]/85 backdrop-blur-md border border-white/10 hover:border-purple-500/40 rounded-3xl p-5 shadow-2xl transition-all duration-300 flex flex-col justify-between gap-4 hover:shadow-purple-500/10 group scroll-mt-24"
                >
                  {/* Top: Avatar, Nickname y Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-0.5 shrink-0 shadow-md">
                          <div className="w-full h-full bg-[#0B0D13] rounded-[14px] flex items-center justify-center font-black text-sm text-[#FFF01F]">
                            {item.nickname_anonimo ? item.nickname_anonimo[0].toUpperCase() : "S"}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">
                            {item.nickname_anonimo || "Cliente Verificado"}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {new Date(item.creado_en).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold font-mono text-emerald-400 inline-flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Entregado</span>
                      </span>
                    </div>

                    {/* Descripción de la Recarga / Entrega */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 mb-2 group-hover:border-[#FFF01F]/20 transition">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Recarga Despachada:</span>
                      <p className="text-sm font-black text-[#FFF01F] tracking-tight">
                        {item.descripcion_entrega}
                      </p>
                    </div>

                    {/* Comentario del Cliente (si existe) */}
                    {item.comentario_cliente && (
                      <p className="text-xs text-zinc-300 italic bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-xl mb-2">
                        "{item.comentario_cliente}"
                      </p>
                    )}
                  </div>

                  {/* Acciones: Likes, Comentarios y Compartir */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Botón de Like */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                          isLiked
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md shadow-rose-500/10 scale-105"
                            : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                        <span>{item.likes_count || 0}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Botón para compartir entrega */}
                        <button
                          type="button"
                          onClick={() => handleShareDelivery(item.id)}
                          title="Copiar enlace directo a esta entrega"
                          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition text-xs"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Botón para desplegar comentarios */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{commentsCount} {commentsCount === 1 ? "Comentario" : "Comentarios"}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCommentsOpen ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Desplegable de Comentarios */}
                    {isCommentsOpen && (
                      <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in duration-200">
                        {/* Lista de comentarios existentes */}
                        {item.comentarios && item.comentarios.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {item.comentarios.map((c) => (
                              <div
                                key={c.id}
                                className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-left"
                              >
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                                  <span className="font-bold text-white">{c.autor_nombre}</span>
                                  <span>{new Date(c.creado_en).toLocaleDateString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <p className="text-zinc-300">{c.comentario}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-500 text-center py-1">
                            Aún no hay comentarios. ¡Sé el primero en opinar!
                          </p>
                        )}

                        {/* Input para agregar nuevo comentario */}
                        <div className="space-y-2 pt-1">
                          {!currentUser && (
                            <input
                              type="text"
                              value={commentAuthor}
                              onChange={(e) => setCommentAuthor(e.target.value)}
                              placeholder="Tu nombre o apodo (opcional)"
                              className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FFF01F]"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newCommentText[item.id] || ""}
                              onChange={(e) =>
                                setNewCommentText((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handlePostComment(item.id);
                              }}
                              placeholder="Escribe una opinión..."
                              className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FFF01F]"
                            />
                            <button
                              type="button"
                              onClick={() => handlePostComment(item.id)}
                              disabled={submittingComment === item.id || !newCommentText[item.id]?.trim()}
                              className="px-3 py-1.5 rounded-xl bg-[#FFF01F] hover:bg-yellow-300 disabled:opacity-40 text-black font-extrabold text-xs transition shadow shrink-0 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Enviar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA al pie del Feed: Ir al Catálogo */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-red-950/40 via-purple-950/30 to-amber-950/40 border border-white/10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFF01F]/5 blur-3xl rounded-full pointer-events-none" />
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
            ¿Listo para tu próxima recarga?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Entregas inmediatas 24/7 con los mejores precios del mercado en Free Fire, Blood Strike y más.
          </p>
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFF01F] hover:bg-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_25px_rgba(255,240,31,0.4)] hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explorar Catálogo &amp; Precios</span>
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
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
          <Link href="/" className="hover:text-white transition">
            Inicio
          </Link>
          <Link href="/tickets" className="hover:text-white transition">
            Soporte &amp; Tickets
          </Link>
          <Link href="/#catalogo" className="hover:text-[#FFF01F] transition text-[#FFF01F]">
            Catálogo
          </Link>
        </div>
      </footer>

    </div>
  );
}
