"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Calendar,
  MessageCircle,
  Eye,
  Sliders,
  Check,
  ArrowRight,
  Pencil,
} from "lucide-react";
import AdminRulesModal, { ResellerRule } from "./AdminRulesModal";

interface ResellerUser {
  id: string;
  nombre: string;
  apellido: string | null;
  nickname: string;
  email: string;
  telefono_whatsapp: string | null;
  rango: string;
  saldo_usdt: number;
  total_depositado_usdt: number;
  fecha_registro: string;
}

interface DepositRequest {
  id: string;
  usuario_id: string;
  monto_reportado: number;
  moneda: string;
  monto_estimado_usdt: number;
  metodo_pago: string;
  referencia_bancaria: string | null;
  comprobante_url: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  notas_admin: string | null;
  creado_en: string;
  usuario_nickname: string;
  usuario_email: string;
  usuario_rango: string;
  usuario_whatsapp: string | null;
}

export default function AdminResellersControl({
  onNavigateToPrices,
}: {
  onNavigateToPrices?: (rango?: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState<ResellerUser[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [rules, setRules] = useState<ResellerRule[]>([]);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [editedMinDeposits, setEditedMinDeposits] = useState<{ [rango: string]: number }>({});
  const [savingRuleRank, setSavingRuleRank] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("PENDIENTE");
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Modal para ajuste manual de saldo
  const [balanceModalUser, setBalanceModalUser] = useState<ResellerUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustType, setAdjustType] = useState<"SUMAR" | "RESTAR">("SUMAR");
  const [adjustReason, setAdjustReason] = useState("");
  const [newRank, setNewRank] = useState<string>("");
  const [processingAction, setProcessingAction] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resellers");
      if (!res.ok) throw new Error("Error al cargar información de revendedores");
      const data = await res.json();
      setResellers(data.resellers || []);
      setDepositRequests(data.depositRequests || []);
      setRules(data.rules || []);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al cargar datos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Manejo de edición rápida de depósito mínimo en las tarjetas de escalafón
  const handleMinDepositChange = (rango: string, val: string) => {
    const parsed = parseFloat(val);
    setEditedMinDeposits((prev) => ({
      ...prev,
      [rango]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSaveInlineRule = async (rule: ResellerRule) => {
    const nuevoMonto =
      editedMinDeposits[rule.rango] !== undefined
        ? editedMinDeposits[rule.rango]
        : rule.deposito_minimo_usdt;
    setSavingRuleRank(rule.rango);
    try {
      const res = await fetch("/api/admin/resellers/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: [
            {
              rango: rule.rango,
              deposito_minimo_usdt: nuevoMonto,
              nombre_nivel: rule.nombre_nivel,
              beneficio_resumen: rule.beneficio_resumen,
              activo: rule.activo,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar depósito mínimo");

      setRules((prev) =>
        prev.map((r) => (r.rango === rule.rango ? { ...r, deposito_minimo_usdt: nuevoMonto } : r))
      );
      setNotification({
        type: "success",
        text: `Depósito mínimo para ${rule.nombre_nivel} actualizado a ${nuevoMonto} USDT con éxito`,
      });
      setTimeout(() => setNotification(null), 4000);
      setEditedMinDeposits((prev) => {
        const copy = { ...prev };
        delete copy[rule.rango];
        return copy;
      });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al guardar regla" });
    } finally {
      setSavingRuleRank(null);
    }
  };

  // Aprobar o Rechazar Solicitud de Depósito
  const handleProcessDeposit = async (solicitudId: string, accion: "APROBAR" | "RECHAZAR") => {
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/resellers/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitud_id: solicitudId,
          accion,
          notas: accion === "APROBAR" ? "Depósito verificado y acreditado" : "Depósito rechazado tras revisión",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar solicitud");

      setNotification({ type: "success", text: data.message });
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al procesar depósito" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Guardar Ajuste Manual de Saldo y Rango
  const handleSaveManualAdjustment = async () => {
    if (!balanceModalUser) return;
    setProcessingAction(true);
    try {
      const numAmount = parseFloat(adjustAmount);
      let delta = 0;
      if (!isNaN(numAmount) && numAmount > 0) {
        delta = adjustType === "SUMAR" ? numAmount : -numAmount;
      }

      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: balanceModalUser.id,
          nuevo_rango: newRank || undefined,
          ajuste_saldo_usdt: delta !== 0 ? delta : undefined,
          motivo: adjustReason || "Ajuste administrativo manual",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al aplicar ajuste");

      setNotification({ type: "success", text: "Usuario actualizado correctamente" });
      setBalanceModalUser(null);
      setAdjustAmount("");
      setAdjustReason("");
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al ajustar usuario" });
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredRequests = depositRequests.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.estado === filterStatus;
    const matchesSearch =
      r.usuario_nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.referencia_bancaria && r.referencia_bancaria.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredResellers = resellers.filter(
    (u) =>
      u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.telefono_whatsapp && u.telefono_whatsapp.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-slate-400 text-sm font-medium">Cargando Centro de Control de Revendedores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-white">Control de Revendedores B2B</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl">
            Gestiona la aprobación de depósitos de saldo por Binance y Bancos, automatización de escalafón por depósitos (desde 5 USDT para revendedor grado 4) y tarifas preferenciales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToPrices && (
            <button
              type="button"
              onClick={() => onNavigateToPrices()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/30 transition shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Ajustar Precios de Revendedores</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notificación flotante */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
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

      {/* Reglas de Escalafón Activas */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Escalafón Oficial de Revendedores por Depósito Acumulado:</span>
          </h3>
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Editar Mínimos y Rangos</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {rules.map((rule) => {
            const hasUnsavedDeposit =
              editedMinDeposits[rule.rango] !== undefined &&
              editedMinDeposits[rule.rango] !== rule.deposito_minimo_usdt;
            const currentMinVal =
              editedMinDeposits[rule.rango] !== undefined
                ? editedMinDeposits[rule.rango]
                : rule.deposito_minimo_usdt;

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition relative overflow-hidden group shadow-lg ${
                  rule.activo
                    ? "bg-slate-950/70 border-slate-800 hover:border-amber-500/50"
                    : "bg-slate-950/40 border-slate-900 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      {rule.rango}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        rule.activo
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {rule.activo ? "Activo" : "Manual"}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white">{rule.nombre_nivel}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {rule.beneficio_resumen || "Tarifas y beneficios exclusivos del escalafón."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-2.5">
                  {/* Editor de Depósito Mínimo */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">
                      <span>Mín. Depósito:</span>
                      {hasUnsavedDeposit && (
                        <span className="text-amber-400 font-sans normal-case text-[10px] animate-pulse">
                          Sin guardar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1 flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#FFF01F] pointer-events-none">
                          ≥
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={currentMinVal}
                          onChange={(e) => handleMinDepositChange(rule.rango, e.target.value)}
                          className="w-full pl-6 pr-11 py-1.5 rounded-xl bg-black/80 border border-slate-700 focus:border-amber-400 font-mono text-xs font-extrabold text-[#FFF01F] outline-none transition"
                          title="Escribe el nuevo monto mínimo en USDT para este rango"
                        />
                        <span className="absolute right-2 text-[10px] font-mono text-slate-400 pointer-events-none">
                          USDT
                        </span>
                      </div>

                      {hasUnsavedDeposit && (
                        <button
                          type="button"
                          disabled={savingRuleRank === rule.rango}
                          onClick={() => handleSaveInlineRule(rule)}
                          className="px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1 shrink-0"
                          title="Guardar nuevo mínimo de depósito"
                        >
                          {savingRuleRank === rule.rango ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[10px]">OK</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botón para Configurar Precios del Rango */}
                  <button
                    type="button"
                    onClick={() => onNavigateToPrices?.(rule.rango)}
                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/20 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400/60 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 group/btn"
                    title={`Ir a ajustar precios de productos para ${rule.nombre_nivel}`}
                  >
                    <Coins className="w-3.5 h-3.5 text-yellow-400 group-hover/btn:scale-110 transition" />
                    <span>Ajustar Precios</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover/btn:translate-x-1 transition" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: SOLICITUDES DE DEPÓSITO PENDIENTES / RECIENTES                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Solicitudes de Depósito de Saldo ({depositRequests.filter((d) => d.estado === "PENDIENTE").length} pendientes)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Verifica los comprobantes enviados por Binance Pay, Pago Móvil o Transferencia para acreditar el saldo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus("PENDIENTE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === "PENDIENTE"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Pendientes ({depositRequests.filter((d) => d.estado === "PENDIENTE").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === "ALL"
                  ? "bg-slate-700 text-white font-black"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Todas ({depositRequests.length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No hay solicitudes de depósito con el filtro seleccionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-3xl border transition shadow-lg flex flex-col justify-between ${
                  req.estado === "PENDIENTE"
                    ? "bg-slate-900/90 border-amber-500/40 shadow-amber-500/5"
                    : req.estado === "APROBADO"
                    ? "bg-slate-900/50 border-emerald-500/30 opacity-75"
                    : "bg-slate-900/50 border-rose-500/30 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {req.usuario_nickname}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {req.usuario_email}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        req.estado === "PENDIENTE"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : req.estado === "APROBADO"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {req.estado}
                    </span>
                  </div>

                  {/* Datos del Pago */}
                  <div className="mt-3 p-3 rounded-2xl bg-black/50 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monto Reportado:</span>
                      <span className="font-black text-white font-mono">
                        {req.monto_reportado} {req.moneda}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Equivalente Estimado:</span>
                      <span className="font-extrabold text-[#FFF01F] font-mono">
                        ~{Number(req.monto_estimado_usdt).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Método:</span>
                      <span className="font-mono text-cyan-400 text-[11px]">
                        {req.metodo_pago}
                      </span>
                    </div>
                    {req.referencia_bancaria && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-400 text-[11px]">Ref:</span>
                        <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">
                          {req.referencia_bancaria}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Comprobante de Pago */}
                  {req.comprobante_url && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(req.comprobante_url)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Comprobante de Pago</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                {req.estado === "PENDIENTE" && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProcessDeposit(req.id, "APROBAR")}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar Saldo</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProcessDeposit(req.id, "RECHAZAR")}
                      className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 active:scale-95 text-rose-300 font-bold text-xs transition border border-rose-800/60 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: DIRECTORIO DE REVENDEDORES ACTIVOS                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Directorio de Revendedores y Saldos ({filteredResellers.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Controla el saldo disponible, rango asignado y total depositado por cada revendedor.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nickname, email o WhatsApp..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Revendedor / Contacto</th>
                  <th className="p-4">Rango Actual</th>
                  <th className="p-4">Saldo Disponible</th>
                  <th className="p-4">Total Depositado</th>
                  <th className="p-4">Fecha Registro</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredResellers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-bold text-white block">{u.nickname}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{u.email}</span>
                      {u.telefono_whatsapp && (
                        <a
                          href={`https://wa.me/${u.telefono_whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline mt-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{u.telefono_whatsapp}</span>
                        </a>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px]">
                        {u.rango}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-sm font-black text-[#FFF01F] font-mono block">
                        ${Number(u.saldo_usdt || 0).toFixed(2)} USDT
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      ${Number(u.total_depositado_usdt || 0).toFixed(2)} USDT
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {new Date(u.fecha_registro).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setBalanceModalUser(u);
                          setNewRank(u.rango);
                          setAdjustAmount("");
                          setAdjustReason("");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs transition border border-amber-500/30 inline-flex items-center gap-1.5"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ajustar Saldo / Rango</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AJUSTE MANUAL DE SALDO / RANGO                                     */}
      {/* ========================================================================= */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">Ajuste de Saldo &amp; Rango</h3>
                <p className="text-xs text-slate-400">
                  {balanceModalUser.nickname} ({balanceModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="p-3 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Saldo Actual:</span>
                <span className="text-base font-black text-[#FFF01F] font-mono">
                  ${Number(balanceModalUser.saldo_usdt || 0).toFixed(2)} USDT
                </span>
              </div>

              {/* Rango */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Cambiar Rango de Usuario:
                </label>
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none font-mono"
                >
                  <optgroup label="Rangos de Revendedor">
                    <option value="revendedor_4">revendedor_4 (Mín. 5 USDT)</option>
                    <option value="revendedor_3">revendedor_3 (Mín. 25 USDT)</option>
                    <option value="revendedor_2">revendedor_2 (Mín. 50 USDT)</option>
                    <option value="revendedor_1">revendedor_1 (Mayorista 100 USDT)</option>
                    <option value="revendedor_especial">revendedor_especial (VIP)</option>
                  </optgroup>
                  <optgroup label="Rangos de Cliente">
                    <option value="cliente_4">cliente_4 (General)</option>
                    <option value="cliente_3">cliente_3</option>
                    <option value="cliente_2">cliente_2</option>
                    <option value="cliente_1">cliente_1 (Frecuente)</option>
                    <option value="cliente_especial">cliente_especial</option>
                  </optgroup>
                </select>
              </div>

              {/* Ajuste de Saldo */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Ajustar Saldo (Opcional):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl bg-black/60 p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setAdjustType("SUMAR")}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                        adjustType === "SUMAR"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      + Sumar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("RESTAR")}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                        adjustType === "RESTAR"
                          ? "bg-rose-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      - Restar
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Monto en USDT"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Motivo o Nota de Auditoría:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Acreditación por recarga en efectivo / corrección"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={handleSaveManualAdjustment}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black transition disabled:opacity-50"
                >
                  {processingAction ? "Guardando..." : "Guardar Ajuste"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISTA DE COMPROBANTE DE PAGO                                       */}
      {/* ========================================================================= */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-slate-700 rounded-3xl max-w-lg w-full p-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white">Comprobante de Depósito</span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar (✕)
              </button>
            </div>
            <div className="py-3 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={selectedProofUrl}
                alt="Comprobante"
                className="max-h-[70vh] w-auto object-contain rounded-2xl border border-white/10"
              />
            </div>
            <div className="pt-2 text-center">
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-bold"
              >
                <span>Abrir imagen original en nueva pestaña</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Modal para configurar mínimos de depósito y qué rangos exigen depósito */}
      <AdminRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        initialRules={rules}
        onNavigateToPrices={(rango) => onNavigateToPrices?.(rango)}
        onSaved={(updatedRules) => {
          setRules(updatedRules);
          setNotification({
            type: "success",
            text: "Escalafón y montos mínimos de depósito actualizados con éxito",
          });
          setTimeout(() => setNotification(null), 4000);
        }}
      />
    </div>
  );
}
