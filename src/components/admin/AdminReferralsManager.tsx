"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Gift,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Send,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface ReferralCode {
  id: string;
  codigo: string;
  rango_asignado: string;
  creado_por_admin_id?: string | null;
  expira_en: string;
  duracion_horas: number;
  usado: boolean;
  usado_por_usuario_id?: string | null;
  usado_en?: string | null;
  nota?: string | null;
  creado_en: string;
  usado_por_nickname?: string | null;
  usado_por_email?: string | null;
  usado_por_nombre?: string | null;
  estado_calculado: "ACTIVO" | "USADO" | "EXPIRADO";
}

const RANGOS_OPTIONS = [
  { id: "revendedor_4", label: "Revendedor Nivel 4", tipo: "revendedor", badge: "Base Revendedor" },
  { id: "revendedor_3", label: "Revendedor Nivel 3", tipo: "revendedor", badge: "Nivel 3" },
  { id: "revendedor_2", label: "Revendedor Nivel 2", tipo: "revendedor", badge: "Semi-Mayorista" },
  { id: "revendedor_1", label: "Revendedor Nivel 1", tipo: "revendedor", badge: "Mayorista" },
  { id: "revendedor_especial", label: "Revendedor Especial VIP", tipo: "revendedor", badge: "VIP B2B" },
  { id: "cliente_especial", label: "Cliente Especial VIP", tipo: "cliente", badge: "VIP Cliente" },
  { id: "cliente_1", label: "Cliente Nivel 1 (Frecuente)", tipo: "cliente", badge: "Nivel 1" },
  { id: "cliente_2", label: "Cliente Nivel 2", tipo: "cliente", badge: "Nivel 2" },
  { id: "cliente_3", label: "Cliente Nivel 3", tipo: "cliente", badge: "Nivel 3" },
];

const PRESETS_HORAS = [
  { horas: 6, label: "6 Horas" },
  { horas: 12, label: "12 Horas" },
  { horas: 24, label: "24 Horas (1 Día)" },
  { horas: 48, label: "48 Horas (2 Días)" },
  { horas: 72, label: "72 Horas (3 Días)" },
  { horas: 168, label: "7 Días" },
];

export default function AdminReferralsManager() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [codigos, setCodigos] = useState<ReferralCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVO" | "USADO" | "EXPIRADO">("ALL");

  // Formulario de creación
  const [codigoSufijo, setCodigoSufijo] = useState("");
  const [rangoAsignado, setRangoAsignado] = useState("revendedor_4");
  const [duracionHoras, setDuracionHoras] = useState<number>(24);
  const [nota, setNota] = useState("");

  // Notificaciones y portapapeles
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<ReferralCode | null>(null);

  // Cargar datos
  const loadReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals");
      if (!res.ok) throw new Error("Error al obtener códigos de referidos");
      const data = await res.json();
      setCodigos(data.codigos || []);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al cargar códigos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  // Generar sufijo aleatorio
  const handleGenerateRandom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = rangoAsignado.startsWith("revendedor") ? "REV" : "VIP";
    setCodigoSufijo(`${prefix}-${rand}`);
  };

  // Crear código
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoSufijo.trim()) {
      setNotification({ type: "error", text: "Por favor escribe o genera un código" });
      return;
    }

    setCreating(true);
    try {
      const codigoCompleto = codigoSufijo.trim().toUpperCase().startsWith("SOUL-")
        ? codigoSufijo.trim().toUpperCase()
        : `SOUL-${codigoSufijo.trim().toUpperCase()}`;

      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigoCompleto,
          rango_asignado: rangoAsignado,
          duracion_horas: duracionHoras,
          nota: nota.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el código");

      setNotification({ type: "success", text: `Código ${codigoCompleto} generado con éxito` });
      setNewlyCreatedCode(data.codigo);
      setCodigoSufijo("");
      setNota("");
      await loadReferrals();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al procesar solicitud" });
    } finally {
      setCreating(false);
    }
  };

  // Eliminar código
  const handleDeleteCode = async (id: string, codeName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el código ${codeName}?`)) return;

    try {
      const res = await fetch(`/api/admin/referrals?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar código");

      setNotification({ type: "success", text: "Código eliminado correctamente" });
      setCodigos((prev) => prev.filter((c) => c.id !== id));
      if (newlyCreatedCode?.id === id) {
        setNewlyCreatedCode(null);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al eliminar código" });
    }
  };

  // Copiar al portapapeles
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copiar mensaje listo para WhatsApp
  const handleCopyWhatsAppMessage = (c: ReferralCode) => {
    const rangoObj = RANGOS_OPTIONS.find((r) => r.id === c.rango_asignado);
    const nombreRango = rangoObj ? rangoObj.label : c.rango_asignado;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://soulstore.com";
    const linkRegistro = `${origin}/register?codigo=${encodeURIComponent(c.codigo)}`;

    const msg = `🔥 *¡Invitación Especial Soul Store!* 🔥\n\nHola, tienes un código de acceso exclusivo de *1 solo uso* para registrarte con el rango *${nombreRango}*:\n\n🎟️ *Tu Código:* \`${c.codigo}\`\n⏳ *Vigencia:* ${c.duracion_horas} horas.\n\n🔗 *Regístrate directamente aquí:* ${linkRegistro}\n\n_O si ya tienes cuenta, canjéalo en tu Perfil en "Código Promocional"._`;

    handleCopyText(msg, `wa-${c.id}`);
  };

  // Métricas
  const totalActivos = useMemo(() => codigos.filter((c) => c.estado_calculado === "ACTIVO").length, [codigos]);
  const totalUsados = useMemo(() => codigos.filter((c) => c.estado_calculado === "USADO").length, [codigos]);
  const totalExpirados = useMemo(() => codigos.filter((c) => c.estado_calculado === "EXPIRADO").length, [codigos]);

  // Filtrado
  const filteredCodigos = useMemo(() => {
    return codigos.filter((c) => {
      const matchesSearch =
        searchTerm === "" ||
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nota && c.nota.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.usado_por_nickname && c.usado_por_nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.usado_por_email && c.usado_por_email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === "ALL" || c.estado_calculado === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [codigos, searchTerm, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SISTEMA DE ASIGNACIÓN DIRECTA DE RANGOS</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Gift className="w-6 h-6 text-[#FFF01F]" />
              <span>Gestor de Referidos y Códigos de Rango</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Crea códigos de referidos de <strong>1 solo uso</strong> con caducidad en horas para invitar directamente a nuevos revendedores o clientes VIP. El código les asigna el rango seleccionado automáticamente al registrarse o canjearlo en su perfil.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReferrals}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start md:self-auto flex items-center gap-2 text-xs font-bold"
            title="Recargar lista de códigos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Notificación de Feedback */}
        {notification && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2.5 animate-in fade-in ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Códigos</span>
            <span className="text-xl font-black text-white">{codigos.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block">Disponibles (Activos)</span>
            <span className="text-xl font-black text-emerald-300">{totalActivos}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20">
            <span className="text-[10px] font-mono text-purple-400 uppercase block">Canjeados (Usados)</span>
            <span className="text-xl font-black text-purple-300">{totalUsados}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
            <span className="text-[10px] font-mono text-rose-400 uppercase block">Caducados</span>
            <span className="text-xl font-black text-rose-300">{totalExpirados}</span>
          </div>
        </div>
      </div>

      {/* Formulario de Creación de Código de Rango */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Generar Nuevo Código de Referido para Asignar Rango:</span>
        </h2>

        <form onSubmit={handleCreateCode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Código Personalizable (Prefijo SOUL- + Sufijo) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  Código (Prefijo SOUL-):
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>🎲 Generar Aleatorio</span>
                </button>
              </div>

              <div className="flex items-center rounded-xl bg-black/60 border border-slate-700 focus-within:border-amber-400 overflow-hidden transition">
                <span className="px-3 py-2.5 bg-slate-800 text-xs font-mono font-black text-amber-400 border-r border-slate-700">
                  SOUL-
                </span>
                <input
                  type="text"
                  required
                  value={codigoSufijo.replace(/^SOUL-/i, "")}
                  onChange={(e) => setCodigoSufijo(e.target.value.toUpperCase().replace(/\s+/g, "-"))}
                  placeholder="REV4-PROMO"
                  className="w-full px-3 py-2.5 bg-transparent font-mono text-xs font-black text-white uppercase outline-none placeholder-slate-600"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 block truncate">
                Vista previa:{" "}
                <strong className="text-white">
                  {codigoSufijo ? (codigoSufijo.startsWith("SOUL-") ? codigoSufijo : `SOUL-${codigoSufijo}`) : "SOUL-..."}
                </strong>
              </span>
            </div>

            {/* 2. Rango que se otorgará */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Rango que Asignará al Canjear:
              </label>
              <select
                value={rangoAsignado}
                onChange={(e) => setRangoAsignado(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none font-bold transition"
              >
                {RANGOS_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.badge})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 block">
                El usuario subirá a este rango de forma inmediata.
              </span>
            </div>

            {/* 3. Caducidad en Horas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Caducidad (Horas de Validez):
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={duracionHoras}
                  onChange={(e) => setDuracionHoras(parseInt(e.target.value, 10))}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none font-mono font-bold"
                >
                  {PRESETS_HORAS.map((p) => (
                    <option key={p.horas} value={p.horas}>
                      {p.label}
                    </option>
                  ))}
                  <option value={1}>1 Hora</option>
                  <option value={3}>3 Horas</option>
                  <option value={336}>14 Días (336 Horas)</option>
                  <option value={720}>30 Días (720 Horas)</option>
                </select>
                <div className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono font-bold">
                  1 Solo Uso
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Una vez transcurrido este tiempo el código expirará.
              </span>
            </div>
          </div>

          {/* Nota opcional y Botón de envío */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Nota o Nombre del Destinatario (Opcional):
              </label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Para Juan Pérez - WhatsApp +58 412..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none placeholder-slate-600"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition disabled:opacity-50"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Crear Código de Rango</span>
              </button>
            </div>
          </div>
        </form>

        {/* Tarjeta de Código recién creado para compartir rápido */}
        {newlyCreatedCode && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-xs text-white">¡Código listo para compartir!</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono font-black text-[11px]">
                  {newlyCreatedCode.codigo}
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">
                Vence en {newlyCreatedCode.duracion_horas}h • 1 Solo Uso
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyText(newlyCreatedCode.codigo, `quick-${newlyCreatedCode.id}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                {copiedId === `quick-${newlyCreatedCode.id}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copiar Código</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyWhatsAppMessage(newlyCreatedCode)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/40 transition"
              >
                {copiedId === `wa-${newlyCreatedCode.id}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Copiar Mensaje Listo para WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listado y Búsqueda de Códigos Existentes */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nota o usuario..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterStatus === "ALL"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Todos ({codigos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ACTIVO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterStatus === "ACTIVO"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                  : "bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-slate-800"
              }`}
            >
              Disponibles ({totalActivos})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("USADO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterStatus === "USADO"
                  ? "bg-purple-500 text-white font-black shadow-md"
                  : "bg-slate-900 text-purple-400 hover:text-purple-300 border border-slate-800"
              }`}
            >
              Canjeados ({totalUsados})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("EXPIRADO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterStatus === "EXPIRADO"
                  ? "bg-rose-500 text-white font-black shadow-md"
                  : "bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800"
              }`}
            >
              Caducados ({totalExpirados})
            </button>
          </div>
        </div>

        {/* Tabla / Lista de Códigos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {filteredCodigos.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No se encontraron códigos de referido con los filtros actuales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Código Promocional</th>
                    <th className="p-4">Rango Asignado</th>
                    <th className="p-4">Caducidad / Estado</th>
                    <th className="p-4">Canjeado Por</th>
                    <th className="p-4">Nota / Destinatario</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCodigos.map((c) => {
                    const rangoObj = RANGOS_OPTIONS.find((r) => r.id === c.rango_asignado);
                    const isCopied = copiedId === c.id;
                    const isWaCopied = copiedId === `wa-${c.id}`;

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition">
                        {/* Código */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-white px-2.5 py-1 rounded-xl bg-black/70 border border-slate-700">
                              {c.codigo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(c.codigo, c.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Copiar código"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            Creado: {new Date(c.creado_en).toLocaleString()}
                          </span>
                        </td>

                        {/* Rango */}
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl font-bold text-xs border ${
                              c.rango_asignado.startsWith("revendedor")
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30"
                            }`}
                          >
                            {rangoObj ? rangoObj.label : c.rango_asignado}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                            {c.rango_asignado}
                          </span>
                        </td>

                        {/* Estado y Caducidad */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {c.estado_calculado === "ACTIVO" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                DISPONIBLE
                              </span>
                            )}
                            {c.estado_calculado === "USADO" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                CANJEADO
                              </span>
                            )}
                            {c.estado_calculado === "EXPIRADO" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                EXPIRADO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Vence: {new Date(c.expira_en).toLocaleString()} ({c.duracion_horas}h)</span>
                          </span>
                        </td>

                        {/* Usuario que lo usó */}
                        <td className="p-4">
                          {c.usado ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-bold text-white text-xs">
                                  {c.usado_por_nickname || "Usuario"}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {c.usado_por_email || "Email no disponible"}
                              </span>
                              {c.usado_en && (
                                <span className="text-[9px] text-slate-500 block">
                                  Canjeado: {new Date(c.usado_en).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">— Sin canjear —</span>
                          )}
                        </td>

                        {/* Nota */}
                        <td className="p-4">
                          <p className="text-slate-300 text-xs max-w-xs truncate">
                            {c.nota || <span className="text-slate-600 italic">Sin nota</span>}
                          </p>
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.estado_calculado === "ACTIVO" && (
                              <button
                                type="button"
                                onClick={() => handleCopyWhatsAppMessage(c)}
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                                title="Copiar mensaje de invitación para WhatsApp"
                              >
                                {isWaCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden lg:inline text-[11px]">WhatsApp</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteCode(c.id, c.codigo)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition"
                              title="Eliminar código"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
