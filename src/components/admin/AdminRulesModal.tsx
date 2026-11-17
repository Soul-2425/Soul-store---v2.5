"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Coins,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

export interface ResellerRule {
  id?: string;
  rango: string;
  deposito_minimo_usdt: number;
  nombre_nivel: string;
  beneficio_resumen?: string | null;
  activo: boolean;
}

const ALL_AVAILABLE_RANKS = [
  { id: "revendedor_4", label: "Revendedor Nivel 4", tipo: "revendedor", defaultMin: 5 },
  { id: "revendedor_3", label: "Revendedor Nivel 3", tipo: "revendedor", defaultMin: 25 },
  { id: "revendedor_2", label: "Revendedor Nivel 2", tipo: "revendedor", defaultMin: 50 },
  { id: "revendedor_1", label: "Revendedor Nivel 1 (Mayorista)", tipo: "revendedor", defaultMin: 100 },
  { id: "revendedor_especial", label: "Revendedor Especial VIP", tipo: "revendedor", defaultMin: 200 },
  { id: "cliente_especial", label: "Cliente Especial VIP", tipo: "cliente", defaultMin: 15 },
  { id: "cliente_1", label: "Cliente Nivel 1 (Frecuente)", tipo: "cliente", defaultMin: 10 },
  { id: "cliente_2", label: "Cliente Nivel 2", tipo: "cliente", defaultMin: 5 },
  { id: "cliente_3", label: "Cliente Nivel 3", tipo: "cliente", defaultMin: 0 },
  { id: "cliente_4", label: "Cliente Nivel 4 (Público General)", tipo: "cliente", defaultMin: 0 },
];

export default function AdminRulesModal({
  isOpen,
  onClose,
  initialRules = [],
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRules: ResellerRule[];
  onSaved: (updatedRules: ResellerRule[]) => void;
}) {
  const [localRules, setLocalRules] = useState<ResellerRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      // Combinar reglas guardadas con los rangos disponibles
      const merged: ResellerRule[] = ALL_AVAILABLE_RANKS.map((r) => {
        const found = initialRules.find((x) => x.rango === r.id);
        if (found) {
          return {
            ...found,
            deposito_minimo_usdt: Number(found.deposito_minimo_usdt),
          };
        }
        return {
          rango: r.id,
          nombre_nivel: r.label,
          deposito_minimo_usdt: r.defaultMin,
          beneficio_resumen: r.tipo === "revendedor" ? `Acceso a tarifas de ${r.label}` : "Tarifa preferencial",
          activo: r.tipo === "revendedor",
        };
      });
      setLocalRules(merged);
    }
  }, [isOpen, initialRules]);

  if (!isOpen) return null;

  const handleUpdateRule = (rango: string, field: keyof ResellerRule, value: any) => {
    setLocalRules((prev) =>
      prev.map((item) => (item.rango === rango ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/resellers/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: localRules }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar reglas");

      setFeedback({ type: "success", text: data.message || "Reglas guardadas exitosamente." });
      onSaved(data.rules || localRules);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e1017] border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 space-y-4 text-white animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Configuración de Depósitos Mínimos por Rango
              </h3>
              <p className="text-xs text-slate-400">
                Define qué rangos exigen depósito previo y el monto en USDT requerido para desbloquearlos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Explicación rápida */}
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Cuando un usuario deposita vía Binance o Banco y el admin aprueba su recarga, el sistema evalúa su total depositado contra estos umbrales y lo asciende de rango automáticamente.
          </span>
        </div>

        {/* Lista de Rangos Configurables */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Rangos de Revendedores B2B:
          </div>

          {localRules
            .filter((r) => r.rango.startsWith("revendedor_"))
            .map((rule) => {
              return (
                <div
                  key={rule.rango}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    rule.activo
                      ? "bg-black/50 border-amber-500/30"
                      : "bg-black/20 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs block">
                        {rule.nombre_nivel}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                        {rule.rango}
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Beneficio o notas..."
                      value={rule.beneficio_resumen || ""}
                      onChange={(e) =>
                        handleUpdateRule(rule.rango, "beneficio_resumen", e.target.value)
                      }
                      className="mt-1 w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Switch de activación */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={rule.activo}
                        onChange={(e) =>
                          handleUpdateRule(rule.rango, "activo", e.target.checked)
                        }
                        className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-400">
                        {rule.activo ? "Activo" : "Inactivo"}
                      </span>
                    </label>

                    {/* Input de Monto Mínimo */}
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700">
                      <span className="text-amber-400 font-mono text-xs font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={rule.deposito_minimo_usdt}
                        onChange={(e) =>
                          handleUpdateRule(
                            rule.rango,
                            "deposito_minimo_usdt",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-transparent font-mono text-xs font-bold text-white outline-none text-right"
                      />
                      <span className="text-[10px] font-mono text-slate-400">USDT</span>
                    </div>
                  </div>
                </div>
              );
            })}

          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 pt-3">
            Rangos de Clientes Especiales (Opcional):
          </div>

          {localRules
            .filter((r) => r.rango.startsWith("cliente_"))
            .map((rule) => {
              return (
                <div
                  key={rule.rango}
                  className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    rule.activo
                      ? "bg-black/50 border-fuchsia-500/30"
                      : "bg-black/20 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white text-xs block">
                      {rule.nombre_nivel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rule.rango}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={rule.activo}
                        onChange={(e) =>
                          handleUpdateRule(rule.rango, "activo", e.target.checked)
                        }
                        className="rounded bg-black border-slate-700 text-fuchsia-500 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-400">
                        {rule.activo ? "Por Depósito" : "Sin Depósito"}
                      </span>
                    </label>

                    {rule.activo && (
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700">
                        <span className="text-fuchsia-400 font-mono text-xs font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={rule.deposito_minimo_usdt}
                          onChange={(e) =>
                            handleUpdateRule(
                              rule.rango,
                              "deposito_minimo_usdt",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-transparent font-mono text-xs font-bold text-white outline-none text-right"
                        />
                        <span className="text-[10px] font-mono text-slate-400">USDT</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Acciones */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? "Guardando..." : "Guardar Reglas"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
