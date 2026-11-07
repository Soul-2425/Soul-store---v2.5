"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  X,
  Camera,
  MessageCircle,
  KeyRound,
  Mail,
  Phone,
  Settings,
  HelpCircle,
  ExternalLink,
  Award,
  LogOut,
  ImageIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageUploadInput from "@/components/ImageUploadInput";

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
  imagen_url?: string | null;
  avatar_url?: string | null;
  categoria?: string | null;
  likes_count: number;
  creado_en: string;
  aprobado_admin?: boolean;
  comentarios?: FeedComment[];
}

interface UserProfile {
  id: string;
  nombre?: string;
  apellido?: string;
  nickname: string;
  email: string;
  telefono_whatsapp?: string | null;
  rango: string;
  avatar_url?: string | null;
}

interface AdminStory {
  id: string;
  nombre: string;
  rol: string;
  avatar: string;
  badge: string;
  colorGradiente: string;
  titulo: string;
  mensaje: string;
  tiempo: string;
  ctaTexto: string;
  ctaEnlace: string;
}

const ADMIN_STORIES: AdminStory[] = [
  {
    id: "story-1",
    nombre: "Soul Store",
    rol: "Admin Principal",
    avatar: "👑",
    badge: "Oficial",
    colorGradiente: "from-[#D61A1A] via-[#FF007F] to-[#FFF01F]",
    titulo: "¡Bienvenido a la Comunidad Soul Store! 🔥",
    mensaje: "Despachos inmediatos 24/7 de recargas gamer y servicios digitales. Todos los pedidos procesados directamente por Player ID con máxima velocidad.",
    tiempo: "Activo ahora",
    ctaTexto: "Ver Catálogo Completo",
    ctaEnlace: "/#catalogo"
  },
  {
    id: "story-2",
    nombre: "Despachos Flash",
    rol: "Bot & Equipo",
    avatar: "⚡",
    badge: "1-3 Min",
    colorGradiente: "from-[#FFF01F] via-amber-500 to-[#D61A1A]",
    titulo: "Velocidad de Entrega Garantizada ⏱️",
    mensaje: "Nuestro promedio de entrega en Free Fire y Blood Strike es de menos de 180 segundos una vez confirmado tu pago. ¡Comprueba las opiniones abajo!",
    tiempo: "En vivo",
    ctaTexto: "Pedir Recarga Flash",
    ctaEnlace: "/#catalogo"
  },
  {
    id: "story-3",
    nombre: "Soporte VIP",
    rol: "Atención al Cliente",
    avatar: "🛡️",
    badge: "Garantía",
    colorGradiente: "from-cyan-400 via-blue-500 to-indigo-600",
    titulo: "Garantía de Satisfacción Total ✅",
    mensaje: "Tu dinero y recargas están 100% protegidas. Si presentas cualquier duda o inconveniente, nuestro equipo de soporte por tickets te atiende al instante.",
    tiempo: "Hace 10m",
    ctaTexto: "Abrir Ticket de Soporte",
    ctaEnlace: "/tickets"
  },
  {
    id: "story-4",
    nombre: "Promos Gamer",
    rol: "Descuentos",
    avatar: "🎁",
    badge: "Ofertas",
    colorGradiente: "from-emerald-400 via-teal-500 to-cyan-500",
    titulo: "Precios Mayoristas para Todos 💎",
    mensaje: "¿Quieres ahorrar más? Tenemos precios especiales por volumen para revendedores y clientes frecuentes en diamantes y tarjetas de regalo.",
    tiempo: "Hoy",
    ctaTexto: "Explorar Promociones",
    ctaEnlace: "/#catalogo"
  },
  {
    id: "story-5",
    nombre: "Comunidad FF",
    rol: "Torneos & Drops",
    avatar: "🎯",
    badge: "Comunidad",
    colorGradiente: "from-fuchsia-500 via-purple-600 to-pink-500",
    titulo: "Apoya el Feed con tu Like ❤️",
    mensaje: "Cada entrega mostrada aquí es verificada. Deja tu opinión si recibiste tu recarga y ayuda a nuevos compradores a confiar en Soul Store.",
    tiempo: "Destacado",
    ctaTexto: "Publicar mi Experiencia",
    ctaEnlace: "#publicar"
  }
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
];

const ITEMS_PER_PAGE = 10;

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

  // Paginación de 10 en 10
  const [currentPage, setCurrentPage] = useState(1);

  // Historias estilo Instagram
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Modal para Publicar en Feed
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [pubNickname, setPubNickname] = useState("");
  const [pubCategoria, setPubCategoria] = useState("Free Fire");
  const [pubDescripcion, setPubDescripcion] = useState("");
  const [pubComentario, setPubComentario] = useState("");
  const [pubImagenUrl, setPubImagenUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Modal de Perfil de Usuario
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileNickname, setProfileNickname] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingResetPass, setSendingResetPass] = useState(false);

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
              setPubNickname(data.user.nickname || data.user.nombre || "");
              setProfileNickname(data.user.nickname || "");
              setProfileAvatarUrl(data.user.avatar_url || "");
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

  // Temporizador para avance automático de Stories estilo Instagram
  useEffect(() => {
    if (activeStoryIdx === null) {
      setStoryProgress(0);
      return;
    }

    setStoryProgress(0);
    const interval = 80;
    const step = 100 / (4000 / interval); // 4 segundos por historia

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx < ADMIN_STORIES.length - 1) {
            setActiveStoryIdx((curr) => (curr !== null ? curr + 1 : null));
            return 0;
          } else {
            setActiveStoryIdx(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryIdx]);

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

  // 6. Publicar nueva experiencia en el Feed
  const handleCreatePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubDescripcion.trim()) return;

    setPublishing(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname_anonimo: pubNickname.trim() || currentUser?.nickname || "Cliente Verificado",
          descripcion_entrega: pubDescripcion.trim(),
          comentario_cliente: pubComentario.trim() || null,
          categoria: pubCategoria,
          imagen_url: pubImagenUrl.trim() || null,
          avatar_url: currentUser?.avatar_url || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.item) {
        setFeedItems((prev) => [data.item, ...prev]);
        setPublishSuccess(true);
        setTimeout(() => {
          setPublishSuccess(false);
          setPublishModalOpen(false);
          setPubDescripcion("");
          setPubComentario("");
          setPubImagenUrl("");
        }, 1200);
      } else {
        alert(data.error || "No se pudo publicar la referencia.");
      }
    } catch (err) {
      console.error("Error al publicar:", err);
      alert("Error de red al publicar en el feed");
    } finally {
      setPublishing(false);
    }
  };

  // 7. Guardar cambios en el perfil (Avatar y Nickname)
  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: profileNickname.trim(),
          avatar_url: profileAvatarUrl.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setCommentAuthor(data.user.nickname);
        setPubNickname(data.user.nickname);
        setProfileMessage({ type: "success", text: "¡Perfil actualizado con éxito!" });
        setTimeout(() => setProfileMessage(null), 3000);
      } else {
        setProfileMessage({ type: "error", text: data.error || "Error al actualizar perfil" });
      }
    } catch (err: any) {
      setProfileMessage({ type: "error", text: "Error de red al actualizar perfil" });
    } finally {
      setSavingProfile(false);
    }
  };

  // 8. Enviar correo de restablecimiento de contraseña
  const handleRequestPasswordReset = async () => {
    if (!currentUser?.email) return;
    setSendingResetPass(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setProfileMessage({ type: "error", text: error.message });
      } else {
        setProfileMessage({
          type: "success",
          text: `Se ha enviado un enlace de cambio de contraseña a ${currentUser.email}.`,
        });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Error al solicitar restablecimiento" });
    } finally {
      setSendingResetPass(false);
    }
  };

  // 9. Copiar enlace de la entrega
  const handleShareDelivery = (id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/feed#delivery-${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // 10. Filtrado de entregas
  const filteredItems = useMemo(() => {
    let result = feedItems;

    if (filterTag === "LIKED") {
      result = result.filter((item) => likedFeedIds.has(item.id));
    } else if (filterTag === "FREE_FIRE") {
      result = result.filter(
        (item) =>
          item.descripcion_entrega.toLowerCase().includes("free fire") ||
          item.descripcion_entrega.toLowerCase().includes("diamante") ||
          (item.categoria && item.categoria.toLowerCase().includes("free fire"))
      );
    } else if (filterTag === "BLOOD_STRIKE") {
      result = result.filter(
        (item) =>
          item.descripcion_entrega.toLowerCase().includes("blood strike") ||
          item.descripcion_entrega.toLowerCase().includes("oro") ||
          (item.categoria && item.categoria.toLowerCase().includes("blood strike"))
      );
    } else if (filterTag === "MOST_LIKED") {
      result = [...result].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.descripcion_entrega.toLowerCase().includes(q) ||
          item.nickname_anonimo.toLowerCase().includes(q) ||
          (item.comentario_cliente && item.comentario_cliente.toLowerCase().includes(q)) ||
          (item.categoria && item.categoria.toLowerCase().includes(q))
      );
    }

    return result;
  }, [feedItems, searchQuery, filterTag, likedFeedIds]);

  // Al cambiar filtros o búsqueda, volver a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTag]);

  // Paginación en bloques de 10 publicaciones
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Métricas
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
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-[#FF007F] selection:text-white relative overflow-x-hidden font-sans">
      
      {/* Luces de ambiente sutiles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-[#FF007F]/10 via-[#FFF01F]/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR (ESTILO INSTAGRAM CLEAN)                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#07090E]/85 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-0.5 shadow-[0_0_12px_rgba(255,240,31,0.4)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#FFF01F]" />
                </div>
              </div>
              <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1 font-sans">
                Soul <span className="text-[#FFF01F]">Feed</span>
              </span>
            </Link>

            <span className="text-zinc-600 hidden sm:inline">/</span>
            
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En Vivo
            </span>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Botón para Publicar en el Feed */}
            <button
              onClick={() => {
                if (currentUser) {
                  setPubNickname(currentUser.nickname || currentUser.nombre || "");
                }
                setPublishModalOpen(true);
              }}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#D61A1A] hover:brightness-110 text-white font-extrabold text-xs transition shadow-[0_0_15px_rgba(255,0,127,0.35)] flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Publicar en Feed</span>
              <span className="sm:hidden">Publicar</span>
            </button>

            {/* Botón de Perfil */}
            {currentUser ? (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 transition text-xs font-bold text-white shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#FFF01F] p-[1.5px] shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {currentUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentUser.avatar_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-black text-[#FFF01F]">
                        {currentUser.nickname ? currentUser.nickname[0].toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.nickname}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-zinc-300 hover:text-white transition"
              >
                Entrar
              </Link>
            )}

            {/* Volver a la Tienda */}
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white border border-white/10 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tienda</span>
            </Link>

            {currentUser?.rango === "admin" && (
              <Link
                href="/admin?tab=feed"
                className="px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HISTORIAS ESTILO INSTAGRAM DE LOS ADMINS                                */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="p-3 sm:p-4 rounded-3xl bg-[#0E111A]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-400">
                ✦ Canales Oficiales &amp; Admins
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Toca para ver historias</span>
          </div>

          {/* Carrusel de Círculos de Historias */}
          <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {/* Story personal o Crear Story */}
            <button
              onClick={() => setPublishModalOpen(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-dashed border-white/30 flex items-center justify-center group-hover:border-[#FF007F] transition group-hover:scale-105">
                  {currentUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.avatar_url} alt="Tu Avatar" className="w-full h-full rounded-full object-cover p-0.5" />
                  ) : (
                    <User className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#FF007F] text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-[#0E111A]">
                  +
                </div>
              </div>
              <span className="text-[11px] font-semibold text-zinc-300 max-w-[70px] truncate text-center">
                Tu Opinión
              </span>
            </button>

            {/* Historias de los Administradores */}
            {ADMIN_STORIES.map((story, idx) => (
              <button
                key={story.id}
                onClick={() => setActiveStoryIdx(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F] shadow-[0_0_12px_rgba(255,0,127,0.3)] group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#0B0D13] flex items-center justify-center text-xl sm:text-2xl select-none">
                    {story.avatar}
                  </div>
                </div>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] font-bold text-white max-w-[75px] truncate text-center group-hover:text-[#FFF01F] transition">
                    {story.nombre}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 font-bold">
                    {story.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HERO & BARRA DE BÚSQUEDA Y FILTROS                                     */}
      {/* ========================================================================= */}
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-20 relative z-10">
        
        {/* Cabecera / Métricas Rápidas */}
        <div className="flex items-center justify-between p-3.5 mb-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span><strong className="text-white font-mono">{totalEntregas}</strong> entregas verificadas</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <strong className="text-white font-mono">{totalLikes}</strong>
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#FFF01F]" />
              <strong className="text-white font-mono">{totalComentarios}</strong>
            </span>
          </div>
        </div>

        {/* Buscador & Filtros de Categoría */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por juego, producto o cliente..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FFF01F] transition"
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

            <button
              onClick={() => fetchFeed(true)}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition shrink-0"
              title="Actualizar Feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#FFF01F]" : ""}`} />
            </button>
          </div>

          {/* Filtros horizontales */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setFilterTag("ALL")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                filterTag === "ALL"
                  ? "bg-white text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              Todas ({feedItems.length})
            </button>

            <button
              onClick={() => setFilterTag("FREE_FIRE")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                filterTag === "FREE_FIRE"
                  ? "bg-[#FFF01F] text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              🔥 Free Fire
            </button>

            <button
              onClick={() => setFilterTag("BLOOD_STRIKE")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                filterTag === "BLOOD_STRIKE"
                  ? "bg-cyan-400 text-black font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              ⚡ Blood Strike
            </button>

            <button
              onClick={() => setFilterTag("MOST_LIKED")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                filterTag === "MOST_LIKED"
                  ? "bg-rose-500 text-white font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              ❤️ Más Votadas
            </button>

            <button
              onClick={() => setFilterTag("LIKED")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                filterTag === "LIKED"
                  ? "bg-purple-600 text-white font-extrabold shadow"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              ⭐ Mis Likes ({likedFeedIds.size})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PUBLICACIONES ESTILO INSTAGRAM (PAGINADAS DE 10 EN 10)                 */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-[#FFF01F] animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Cargando publicaciones estilo Instagram...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-[#0B0D13]/70 border border-white/10 max-w-md mx-auto">
            <Search className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No se encontraron entregas</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {searchQuery ? "No hay resultados para tu búsqueda." : "Aún no hay publicaciones en este filtro."}
            </p>
            <button
              onClick={() => setPublishModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF007F] text-white font-bold text-xs"
            >
              ¡Sé el primero en publicar!
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedItems.map((item) => {
              const isLiked = likedFeedIds.has(item.id);
              const isCommentsOpen = Boolean(expandedComments[item.id]);
              const commentsCount = item.comentarios?.length || 0;

              return (
                <article
                  key={item.id}
                  id={`delivery-${item.id}`}
                  className="bg-[#0B0D13]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-200 hover:border-white/20"
                >
                  {/* Header del Post: Avatar, Nickname y Fecha */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F]">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center font-black text-sm text-[#FFF01F]">
                          {item.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.avatar_url} alt={item.nickname_anonimo} className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.nickname_anonimo ? item.nickname_anonimo[0].toUpperCase() : "S"}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white">
                            {item.nickname_anonimo || "Cliente Verificado"}
                          </span>
                          <span className="inline-flex items-center text-cyan-400 text-[10px]" title="Entrega Verificada">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-cyan-400/20" />
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {new Date(item.creado_en).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Categoría / Estado */}
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Despachado</span>
                    </span>
                  </div>

                  {/* Cuerpo del Post: Imagen o Banner Visual de la Recarga */}
                  {item.imagen_url ? (
                    <div className="w-full bg-black/60 relative group max-h-[420px] overflow-hidden flex items-center justify-center border-y border-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagen_url}
                        alt={item.descripcion_entrega}
                        loading="lazy"
                        className="w-full h-full object-cover max-h-[420px] transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-xs font-black text-[#FFF01F]">
                        {item.descripcion_entrega}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-6 bg-gradient-to-br from-[#121420] via-[#0D0F18] to-[#07090E] border-y border-white/5 flex flex-col justify-center items-center text-center space-y-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,127,0.1),transparent_70%)] pointer-events-none" />
                      <span className="px-3 py-0.5 rounded-full bg-[#FF007F]/20 text-[#FF007F] font-mono text-[10px] font-black uppercase tracking-wider">
                        {item.categoria || "Gaming"}
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {item.descripcion_entrega}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono">
                        Despachado exitosamente vía Player ID
                      </p>
                    </div>
                  )}

                  {/* Barra de Interacciones (Estilo Instagram: Like, Comentario, Compartir) */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Botón de Like */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(item)}
                          className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition group focus:outline-none"
                        >
                          <Heart
                            className={`w-6 h-6 transition-all duration-200 active:scale-125 ${
                              isLiked
                                ? "fill-rose-500 text-rose-500 scale-105"
                                : "group-hover:text-rose-400"
                            }`}
                          />
                          <span className="font-extrabold text-xs font-mono">{item.likes_count || 0}</span>
                        </button>

                        {/* Botón de Comentarios */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition group focus:outline-none"
                        >
                          <MessageSquare className="w-6 h-6 group-hover:text-[#FFF01F]" />
                          <span className="font-extrabold text-xs font-mono">{commentsCount}</span>
                        </button>

                        {/* Botón Compartir */}
                        <button
                          type="button"
                          onClick={() => handleShareDelivery(item.id)}
                          className="text-zinc-400 hover:text-white transition"
                          title="Compartir entrega"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-zinc-500">
                        {commentsCount === 1 ? "1 comentario" : `${commentsCount} comentarios`}
                      </span>
                    </div>

                    {/* Testimonio / Pie de Foto */}
                    {item.comentario_cliente && (
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white mr-1.5">{item.nickname_anonimo}:</strong>
                        <span>{item.comentario_cliente}</span>
                      </div>
                    )}

                    {/* Sección Desplegable de Comentarios */}
                    {isCommentsOpen && (
                      <div className="pt-3 border-t border-white/5 space-y-3">
                        {item.comentarios && item.comentarios.length > 0 ? (
                          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                            {item.comentarios.map((c) => (
                              <div key={c.id} className="text-xs flex items-start gap-2 bg-white/[0.02] p-2 rounded-xl">
                                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0 mt-0.5">
                                  {c.autor_nombre ? c.autor_nombre[0].toUpperCase() : "U"}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                    <span className="font-bold text-zinc-200">{c.autor_nombre}</span>
                                    <span>
                                      {new Date(c.creado_en).toLocaleDateString("es-ES", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-zinc-300 mt-0.5">{c.comentario}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-[11px] text-zinc-500 py-1">
                            No hay comentarios aún. ¡Sé el primero en comentar!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Input para agregar comentario estilo Instagram */}
                    <div className="pt-2 flex items-center gap-2">
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
                        placeholder="Añade un comentario..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FFF01F]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePostComment(item.id)}
                        disabled={submittingComment === item.id || !newCommentText[item.id]?.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#FFF01F] hover:bg-yellow-300 disabled:opacity-40 text-black font-extrabold text-xs transition shadow shrink-0 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publicar</span>
                      </button>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. CONTROLES DE PAGINACIÓN (10 PUBLICACIONES POR PÁGINA)                   */}
        {/* ========================================================================= */}
        {filteredItems.length > 0 && totalPages > 1 && (
          <div className="mt-10 p-4 rounded-2xl bg-[#0E111A] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-400 font-mono">
              Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong> • ({filteredItems.length} publicaciones)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center gap-1 border border-white/10"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {/* Botones numéricos de página */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Mostrar solo páginas adyacentes si son muchas
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition ${
                        currentPage === pageNum
                          ? "bg-[#FF007F] text-white shadow-[0_0_10px_rgba(255,0,127,0.5)] font-black"
                          : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-zinc-600 px-1 text-xs">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center gap-1 border border-white/10"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 6. MODAL VISOR DE HISTORIAS DE INSTAGRAM                                  */}
      {/* ========================================================================= */}
      {activeStoryIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F121C] border border-white/20 overflow-hidden shadow-2xl relative flex flex-col h-[520px]">
            
            {/* Barra de Progreso Superior */}
            <div className="p-3 pb-0 flex items-center gap-1 z-20">
              {ADMIN_STORIES.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{
                      width:
                        i < activeStoryIdx
                          ? "100%"
                          : i === activeStoryIdx
                          ? `${storyProgress}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Cabecera del Visor */}
            <div className="p-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#FFF01F] p-0.5 flex items-center justify-center text-sm font-black text-black">
                  {ADMIN_STORIES[activeStoryIdx].avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-white">
                      {ADMIN_STORIES[activeStoryIdx].nombre}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 text-[9px] font-mono font-bold">
                      {ADMIN_STORIES[activeStoryIdx].badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {ADMIN_STORIES[activeStoryIdx].tiempo}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIdx(null)}
                className="p-1.5 rounded-full bg-black/50 text-white hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la Historia */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-4 relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#D61A1A] via-[#FF007F] to-[#FFF01F] p-1 shadow-2xl flex items-center justify-center text-4xl">
                <div className="w-full h-full bg-[#0F121C] rounded-[22px] flex items-center justify-center">
                  {ADMIN_STORIES[activeStoryIdx].avatar}
                </div>
              </div>

              <h3 className="text-xl font-black text-white leading-tight">
                {ADMIN_STORIES[activeStoryIdx].titulo}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs">
                {ADMIN_STORIES[activeStoryIdx].mensaje}
              </p>

              <div className="pt-4 w-full">
                {ADMIN_STORIES[activeStoryIdx].ctaEnlace === "#publicar" ? (
                  <button
                    onClick={() => {
                      setActiveStoryIdx(null);
                      setPublishModalOpen(true);
                    }}
                    className="w-full py-3 rounded-2xl bg-[#FFF01F] hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider transition shadow-lg"
                  >
                    {ADMIN_STORIES[activeStoryIdx].ctaTexto}
                  </button>
                ) : (
                  <Link
                    href={ADMIN_STORIES[activeStoryIdx].ctaEnlace}
                    onClick={() => setActiveStoryIdx(null)}
                    className="block w-full py-3 rounded-2xl bg-[#FFF01F] hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider transition shadow-lg"
                  >
                    {ADMIN_STORIES[activeStoryIdx].ctaTexto}
                  </Link>
                )}
              </div>
            </div>

            {/* Controles Táctiles Laterales */}
            <div className="absolute inset-y-16 inset-x-0 flex justify-between pointer-events-none px-2 items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStoryIdx((p) => (p !== null && p > 0 ? p - 1 : null));
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 pointer-events-auto flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStoryIdx((p) =>
                    p !== null && p < ADMIN_STORIES.length - 1 ? p + 1 : null
                  );
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 pointer-events-auto flex items-center justify-center text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL PARA PUBLICAR EN EL FEED                                         */}
      {/* ========================================================================= */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-[#0B0D13] border border-white/20 shadow-2xl relative my-8 text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF007F]/20 text-[#FF007F] flex items-center justify-center font-black">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Publicar en el Feed</h3>
                  <p className="text-xs text-zinc-400">Comparte tu recarga recibida con la comunidad</p>
                </div>
              </div>

              <button
                onClick={() => setPublishModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {publishSuccess ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-black text-white">¡Publicación Exitosa!</h4>
                <p className="text-xs text-zinc-400">Tu experiencia ya aparece en el feed en vivo.</p>
              </div>
            ) : (
              <form onSubmit={handleCreatePublish} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tu Nickname / Nombre:</label>
                  <input
                    type="text"
                    required
                    value={pubNickname}
                    onChange={(e) => setPubNickname(e.target.value)}
                    placeholder="Ej: Carlos_Pro, Dany99"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Categoría / Juego:</label>
                    <select
                      value={pubCategoria}
                      onChange={(e) => setPubCategoria(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F]"
                    >
                      <option value="Free Fire">Free Fire</option>
                      <option value="Blood Strike">Blood Strike</option>
                      <option value="Roblox">Roblox</option>
                      <option value="Call of Duty">Call of Duty</option>
                      <option value="Streaming">Streaming</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Recarga Recibida:</label>
                    <input
                      type="text"
                      required
                      value={pubDescripcion}
                      onChange={(e) => setPubDescripcion(e.target.value)}
                      placeholder="Ej: 2180+218 Diamantes"
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tu Opinión / Reseña:</label>
                  <textarea
                    rows={3}
                    value={pubComentario}
                    onChange={(e) => setPubComentario(e.target.value)}
                    placeholder="Cuéntale a la comunidad cómo fue tu entrega (ej: ¡Llegó al instante en menos de 2 minutos!)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F] resize-none"
                  />
                </div>

                {/* Subida o URL de Imagen/Comprobante */}
                <div>
                  <ImageUploadInput
                    label="Foto / Comprobante de Entrega (Opcional):"
                    value={pubImagenUrl}
                    onChange={setPubImagenUrl}
                    placeholder="https://i.imgur.com/ejemplo.jpg"
                    helperText="Sube una captura de tu cuenta recibiendo la recarga para que se vea como foto de Instagram"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={publishing || !pubDescripcion.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#D61A1A] hover:brightness-110 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5"
                  >
                    {publishing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{publishing ? "Publicando..." : "Publicar en Vivo"}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL DE PERFIL DE USUARIO                                             */}
      {/* ========================================================================= */}
      {profileModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-[#0B0D13] border border-white/20 shadow-2xl relative my-8 text-white space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF007F] to-[#FFF01F] p-0.5">
                  <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#FFF01F]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Mi Perfil Soul Store</h3>
                  <p className="text-xs text-zinc-400">Configura tu avatar y gestiona tus credenciales</p>
                </div>
              </div>

              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMessage && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            {/* SECCIÓN 1: FOTO DE PERFIL / AVATAR */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <span className="text-xs font-bold text-zinc-200 block">Foto de Perfil &amp; Avatar:</span>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F] p-[2.5px] shadow-lg shrink-0">
                  <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                    {profileAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-[#FFF01F]">
                        {profileNickname ? profileNickname[0].toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <span className="text-[11px] text-zinc-400 block">Elige un avatar gamer o pega un enlace:</span>
                  <div className="flex items-center gap-2">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfileAvatarUrl(url)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${
                          profileAvatarUrl === url ? "border-[#FF007F] scale-110" : "border-white/20 hover:border-white/50"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={profileAvatarUrl}
                onChange={(e) => setProfileAvatarUrl(e.target.value)}
                placeholder="O pega URL de imagen (https://...)"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none focus:border-[#FF007F]"
              />
            </div>

            {/* SECCIÓN 2: CAMBIAR NICKNAME */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <label className="text-xs font-bold text-zinc-200 block">Nickname Visible en el Feed:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profileNickname}
                  onChange={(e) => setProfileNickname(e.target.value)}
                  placeholder="Tu nickname"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none focus:border-[#FF007F]"
                />
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={savingProfile || !profileNickname.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#FF007F] hover:bg-[#FF007F]/80 disabled:opacity-40 text-white font-bold text-xs transition shadow shrink-0"
                >
                  {savingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>

            {/* SECCIÓN 3: SOLICITUDES DE SEGURIDAD (CORREO, CONTRASEÑA, WHATSAPP) */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Seguridad de la Cuenta (Cambio con Verificación):</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Para proteger tu saldo y órdenes, las credenciales sensibles son verificadas por el equipo de soporte.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                {/* 1. Solicitar cambio de correo */}
                <Link
                  href={`/tickets?asunto=Solicitud+de+cambio+de+correo+para+${encodeURIComponent(currentUser.email)}`}
                  onClick={() => setProfileModalOpen(false)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition space-y-1 block group"
                >
                  <Mail className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-white text-[11px]">Cambiar Correo</p>
                  <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                </Link>

                {/* 2. Restablecer contraseña */}
                <button
                  type="button"
                  onClick={handleRequestPasswordReset}
                  disabled={sendingResetPass}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition space-y-1 block group"
                >
                  <KeyRound className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-white text-[11px]">Cambiar Clave</p>
                  <p className="text-[10px] text-zinc-500">Enviar link al email</p>
                </button>

                {/* 3. Solicitar cambio de WhatsApp */}
                <Link
                  href={`/tickets?asunto=Solicitud+de+actualizacion+de+WhatsApp+para+${encodeURIComponent(currentUser.nickname)}`}
                  onClick={() => setProfileModalOpen(false)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition space-y-1 block group"
                >
                  <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-white text-[11px]">WhatsApp</p>
                  <p className="text-[10px] text-zinc-500 truncate">{currentUser.telefono_whatsapp || "Sin registrar"}</p>
                </Link>
              </div>
            </div>

            {/* Botón extra para publicar en el feed */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  setPubNickname(currentUser.nickname);
                  setPublishModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#D61A1A] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar en Feed</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FOOTER LIMPIO                                                          */}
      {/* ========================================================================= */}
      <footer className="max-w-3xl mx-auto px-4 py-8 border-t border-white/10 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] p-0.5">
            <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
              <Flame className="w-3 h-3 text-[#FFF01F]" />
            </div>
          </div>
          <span className="font-bold text-white">Soul Store</span>
          <span>© 2026. Todos los derechos reservados.</span>
        </div>

        <div className="flex items-center gap-4 font-semibold text-zinc-400">
          <Link href="/" className="hover:text-white transition">Tienda</Link>
          <Link href="/tickets" className="hover:text-white transition">Soporte</Link>
          <Link href="/#catalogo" className="hover:text-[#FFF01F] transition text-[#FFF01F]">Catálogo</Link>
        </div>
      </footer>

    </div>
  );
}
