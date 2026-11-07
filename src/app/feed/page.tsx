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
  ImageIcon,
  Lock,
  UserCheck
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

interface AdminProfileStory {
  id: string;
  nombre: string;
  nickname: string;
  rol: string;
  avatar_url?: string | null;
  avatar_emoji?: string;
  badge: string;
  titulo: string;
  mensaje: string;
  telefono_whatsapp?: string | null;
  tiempo: string;
}

// Administradores oficiales por defecto (se complementan con los administradores de la base de datos)
const DEFAULT_ADMIN_STORIES: AdminProfileStory[] = [
  {
    id: "admin-soul",
    nombre: "Soul Store",
    nickname: "soul_oficial",
    rol: "Administrador Principal",
    avatar_emoji: "👑",
    badge: "Oficial",
    titulo: "¡Bienvenido al Equipo Soul Store! 🔥",
    mensaje: "Canal de atención y despacho prioritario. Administramos recargas inmediatas 24/7 y garantías de satisfacción en cada compra.",
    tiempo: "En Línea",
    telefono_whatsapp: "+584120000000",
  },
  {
    id: "admin-soporte",
    nickname: "soporte_vip",
    nombre: "Soporte Soul Store",
    rol: "Atención al Cliente & Garantías",
    avatar_emoji: "🛡️",
    badge: "Soporte 24/7",
    titulo: "Garantía & Resolución de Dudas ⏱️",
    mensaje: "¿Necesitas ayuda con tu pedido o dudas sobre métodos de pago? Puedes escribirnos por WhatsApp o abrir un ticket directo.",
    tiempo: "Activo",
    telefono_whatsapp: "+584120000000",
  },
  {
    id: "admin-despachos",
    nickname: "despachos_flash",
    nombre: "Despachos Inmediatos",
    rol: "Operaciones & Logística",
    avatar_emoji: "⚡",
    badge: "Flash 1-3m",
    titulo: "Velocidad de Entrega Garantizada ✅",
    mensaje: "Todas las recargas registradas se envían directamente por ID en tiempo récord. Puedes ver las opiniones verificadas abajo.",
    tiempo: "En vivo",
    telefono_whatsapp: "+584120000000",
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
  const [adminsList, setAdminsList] = useState<AdminProfileStory[]>(DEFAULT_ADMIN_STORIES);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
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

  // Visor de Perfil / Historia de Administrador
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfileStory | null>(null);

  // Modal para Publicar en Feed
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [pubNickname, setPubNickname] = useState("");
  const [pubCategoria, setPubCategoria] = useState("Free Fire");
  const [pubDescripcion, setPubDescripcion] = useState("");
  const [pubComentario, setPubComentario] = useState("");
  const [pubImagenUrl, setPubImagenUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{ message: string; autoAprobado: boolean } | null>(null);

  // Modal de Perfil de Usuario
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileNickname, setProfileNickname] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingResetPass, setSendingResetPass] = useState(false);

  const supabase = createClient();

  // 1. Validar sesión del usuario (Acceso exclusivo a usuarios registrados)
  useEffect(() => {
    const checkUser = async () => {
      try {
        setAuthChecking(true);
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
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error validando autenticación en feed:", err);
      } finally {
        setAuthChecking(false);
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

  // 3. Cargar publicaciones y lista de Administradores
  const fetchFeed = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data.feed && Array.isArray(data.feed)) {
        setFeedItems(data.feed);
      }

      // Si vienen administradores registrados de la BD, mapearlos a las historias
      if (data.admins && Array.isArray(data.admins) && data.admins.length > 0) {
        const mappedAdmins: AdminProfileStory[] = data.admins.map((adm: any, idx: number) => ({
          id: adm.id,
          nombre: adm.nombre || adm.nickname || "Administrador",
          nickname: adm.nickname || "admin",
          rol: "Administrador Oficial",
          avatar_url: adm.avatar_url,
          avatar_emoji: idx === 0 ? "👑" : idx === 1 ? "🛡️" : "⚡",
          badge: idx === 0 ? "Oficial" : "Admin VIP",
          titulo: `Atención con ${adm.nombre || adm.nickname} 👑`,
          mensaje: "Administrador oficial verificado de Soul Store. Encargado de la supervisión de pagos, despachos y soporte directo a la comunidad.",
          tiempo: "En Línea",
          telefono_whatsapp: adm.telefono_whatsapp || "+584120000000",
        }));

        setAdminsList(mappedAdmins);
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

  // 6. Publicar nueva experiencia en el Feed (con Aprobación de Admin)
  const handleCreatePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubDescripcion.trim()) return;

    setPublishing(true);
    setPublishFeedback(null);

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
          es_admin: currentUser?.rango === "admin",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.aprobado_admin && data.item) {
          setFeedItems((prev) => [data.item, ...prev]);
        }
        setPublishFeedback({
          message: data.message,
          autoAprobado: Boolean(data.aprobado_admin),
        });

        setTimeout(() => {
          setPublishFeedback(null);
          setPublishModalOpen(false);
          setPubDescripcion("");
          setPubComentario("");
          setPubImagenUrl("");
        }, 3000);
      } else {
        alert(data.error || "No se pudo procesar la publicación.");
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
    } catch {
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

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-[#FF007F] selection:text-white relative overflow-x-hidden font-sans">
      
      {/* Luces de ambiente sutiles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-[#FF007F]/10 via-[#FFF01F]/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR                                                        */}
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
            {/* Botón para Publicar en el Feed (Disponible para usuarios autenticados) */}
            {currentUser && (
              <button
                onClick={() => {
                  setPubNickname(currentUser.nickname || currentUser.nombre || "");
                  setPublishModalOpen(true);
                }}
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#D61A1A] hover:brightness-110 text-white font-extrabold text-xs transition shadow-[0_0_15px_rgba(255,0,127,0.35)] flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Publicar Experiencia</span>
                <span className="sm:hidden">Publicar</span>
              </button>
            )}

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
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-zinc-300 hover:text-white transition"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl bg-[#FF007F] hover:bg-[#FF007F]/80 text-xs font-bold text-white transition shadow"
                >
                  Registrarse
                </Link>
              </div>
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
      {/* 2. CÍRCULOS SUPERIORES: EXCLUSIVAMENTE ADMINISTRADORES                     */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="p-3 sm:p-4 rounded-3xl bg-[#0E111A]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-400">
                👑 Administradores Oficiales Soul Store
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Toca para ver perfil y contacto</span>
          </div>

          {/* Carrusel de Círculos ÚNICAMENTE de Administradores */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {adminsList.map((admin) => (
              <button
                key={admin.id}
                onClick={() => setSelectedAdmin(admin)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F] shadow-[0_0_15px_rgba(255,0,127,0.35)] group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#0B0D13] flex items-center justify-center overflow-hidden">
                    {admin.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={admin.avatar_url} alt={admin.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl select-none">{admin.avatar_emoji || "👑"}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] font-black text-white max-w-[85px] truncate text-center group-hover:text-[#FFF01F] transition">
                    {admin.nombre}
                  </span>
                  <span className="text-[9px] font-mono text-fuchsia-400 font-bold">
                    {admin.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROTECCIÓN: EL FEED SE ACCEDE SOLO CUANDO UNO SE REGISTRA             */}
      {/* ========================================================================= */}
      {!authChecking && !currentUser ? (
        <section className="max-w-md mx-auto my-12 px-4 text-center">
          <div className="p-8 sm:p-9 rounded-3xl bg-[#0B0D13]/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F] p-0.5 mx-auto shadow-[0_0_25px_rgba(255,0,127,0.4)]">
              <div className="w-full h-full bg-[#0B0D13] rounded-[22px] flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#FFF01F]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-[#FF007F]/20 text-[#FF007F] text-[11px] font-mono font-bold uppercase tracking-wider">
                Comunidad Exclusiva
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Acceso al Feed Soul Store
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                El feed de entregas en vivo es exclusivo para miembros. Regístrate gratis o inicia sesión para ver todas las publicaciones, dar likes y dejar opiniones.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/register"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] to-[#D61A1A] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Crear Cuenta Gratis</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/login"
                className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center justify-center"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/"
                className="block py-1 text-xs text-zinc-500 hover:text-zinc-300 transition"
              >
                &larr; Volver a la Tienda
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* ========================================================================= */
        /* 4. CONTENIDO DEL FEED (USUARIOS REGISTRADOS)                              */
        /* ========================================================================= */
        <main className="max-w-3xl mx-auto px-4 pt-4 pb-20 relative z-10">
          
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

          {/* Publicaciones Estilo Instagram (Paginadas de 10 en 10) */}
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
                ¡Comparte tu experiencia!
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

                    {/* Cuerpo del Post: Foto o Tarjeta Visual de la Recarga */}
                    {item.imagen_url ? (
                      <div className="w-full bg-black/60 relative group max-h-[440px] overflow-hidden flex items-center justify-center border-y border-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imagen_url}
                          alt={item.descripcion_entrega}
                          loading="lazy"
                          className="w-full h-full object-cover max-h-[440px] transition-transform duration-300 group-hover:scale-[1.02]"
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

                    {/* Barra de Interacciones (Estilo Instagram) */}
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

          {/* Controles de Paginación 10 en 10 */}
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

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
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
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE PERFIL DE ADMINISTRADOR (AL TOCAR SU CÍRCULO)                 */}
      {/* ========================================================================= */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F121C] border border-white/20 overflow-hidden shadow-2xl relative flex flex-col p-6 text-center space-y-5">
            
            <button
              onClick={() => setSelectedAdmin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar del Administrador */}
            <div className="w-20 h-20 rounded-full mx-auto p-[3px] bg-gradient-to-tr from-[#FF007F] via-[#D61A1A] to-[#FFF01F] shadow-[0_0_25px_rgba(255,0,127,0.4)]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {selectedAdmin.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedAdmin.avatar_url} alt={selectedAdmin.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl select-none">{selectedAdmin.avatar_emoji || "👑"}</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-black text-white">{selectedAdmin.nombre}</h3>
                <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
              </div>
              <p className="text-xs font-mono text-fuchsia-400 font-bold">@{selectedAdmin.nickname}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                🟢 {selectedAdmin.tiempo} • Administrador Oficial
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">
                Rol en Soul Store:
              </span>
              <p className="text-xs text-zinc-300 font-medium">{selectedAdmin.rol}</p>
              <p className="text-xs text-zinc-400 leading-relaxed pt-1 border-t border-white/5">
                {selectedAdmin.mensaje}
              </p>
            </div>

            {/* Acciones de Contacto Directo con el Admin */}
            <div className="space-y-2.5 pt-1">
              {selectedAdmin.telefono_whatsapp && (
                <a
                  href={`https://wa.me/${selectedAdmin.telefono_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `¡Hola ${selectedAdmin.nombre}! Te escribo desde el Feed de Soul Store para una consulta.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chatear por WhatsApp</span>
                </a>
              )}

              <Link
                href={`/tickets?asunto=${encodeURIComponent(`Consulta con Administrador ${selectedAdmin.nombre}`)}`}
                onClick={() => setSelectedAdmin(null)}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 border border-white/10"
              >
                <HelpCircle className="w-4 h-4 text-[#FFF01F]" />
                <span>Abrir Ticket de Soporte</span>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL PARA PUBLICAR EN EL FEED (CON SUBIDA DE FOTO Y REVISIÓN ADMIN)    */}
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
                  <p className="text-xs text-zinc-400">Sube tu foto y comprobante de recarga</p>
                </div>
              </div>

              <button
                onClick={() => setPublishModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {publishFeedback ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-black text-white">
                  {publishFeedback.autoAprobado ? "¡Publicación Aprobada y en Vivo!" : "¡Publicación Enviada con Éxito!"}
                </h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  {publishFeedback.message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreatePublish} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tu Nickname o Nombre:</label>
                  <input
                    type="text"
                    required
                    value={pubNickname}
                    onChange={(e) => setPubNickname(e.target.value)}
                    placeholder="Ej: Dany99, CarlosGamer"
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
                    <label className="font-bold text-zinc-300 block mb-1">Recarga Recibida (*):</label>
                    <input
                      type="text"
                      required
                      value={pubDescripcion}
                      onChange={(e) => setPubDescripcion(e.target.value)}
                      placeholder="Ej: 2180+218 Diamantes"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tu Opinión / Comentario:</label>
                  <textarea
                    rows={3}
                    value={pubComentario}
                    onChange={(e) => setPubComentario(e.target.value)}
                    placeholder="Cuéntale a la comunidad cómo fue tu entrega (ej: ¡Llegó al instante en menos de 2 minutos!)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#FF007F] resize-none"
                  />
                </div>

                {/* Subida de Fotos y Capturas para la Publicación */}
                <div>
                  <ImageUploadInput
                    label="📷 Sube la Foto / Captura de tu Entrega:"
                    value={pubImagenUrl}
                    onChange={setPubImagenUrl}
                    placeholder="https://ejemplo.com/captura.jpg"
                    helperText="Toca arriba para elegir una captura desde tu galería o computadora (se verá como foto de Instagram)"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {currentUser?.rango === "admin"
                      ? "👑 Modo Administrador: Tu publicación se aprobará y mostrará inmediatamente."
                      : "Nota: Por seguridad, tu publicación pasará por aprobación del administrador antes de aparecer en el feed."}
                  </span>
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
                    <span>{publishing ? "Enviando..." : "Publicar"}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE MI PERFIL                                                     */}
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
                  <p className="text-xs text-zinc-400">Configura tu avatar y solicita cambios de seguridad</p>
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
                  <span className="text-[11px] text-zinc-400 block">Elige un avatar o pega una URL:</span>
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
                placeholder="Pega la URL de tu imagen personalizada (https://...)"
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
                Para proteger tu saldo y recargas, los cambios de credenciales son atendidos por soporte.
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

            {/* Acciones de Cierre y Publicación */}
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
      {/* 8. FOOTER                                                                 */}
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
