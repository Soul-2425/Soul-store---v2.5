"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Save,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  ArrowRight,
  ShieldAlert,
  Percent,
  Sliders
} from "lucide-react";
import AdminRulesModal, { ResellerRule } from "./AdminRulesModal";

interface Category {
  id: string;
  nombre: string;
  slug: string;
}

interface Subcategory {
  id: string;
  categoria_id: string;
  nombre: string;
}

interface Product {
  id: string;
  subcategoria_id: string;
  nombre: string;
  slug: string;
  precio_base: number;
  costo_proveedor: number;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
  activo: boolean;
}

interface Variant {
  id: string;
  producto_id: string;
  nombre: string;
  sku?: string | null;
  costo_proveedor: number;
  precio_base: number;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
  activo: boolean;
}

interface PriceOverride {
  id?: string;
  producto_id: string | null;
  variante_id: string | null;
  rango: string;
  precio_usdt: number | null;
  precio_fijo_ves: number | null;
  precio_ref_ves: number | null;
  precio_fijo_mxn: number | null;
  precio_ref_mxn: number | null;
  modo_ves: "tasa_usdt" | "fijo";
  modo_mxn: "fijo" | "tasa_usdt";
}

interface Rates {
  tasa_ves: number;
  tasa_mxn: number;
}

const RANGOS_BASE = [
  { id: "cliente_4", nombreBase: "Cliente Nivel 4", labelDefault: "Cliente Nivel 4 (General / Nuevo)", tipo: "cliente", badgeDefault: "Base" },
  { id: "cliente_3", nombreBase: "Cliente Nivel 3", labelDefault: "Cliente Nivel 3", tipo: "cliente", badgeDefault: "Nivel 3" },
  { id: "cliente_2", nombreBase: "Cliente Nivel 2", labelDefault: "Cliente Nivel 2", tipo: "cliente", badgeDefault: "Nivel 2" },
  { id: "cliente_1", nombreBase: "Cliente Nivel 1", labelDefault: "Cliente Nivel 1 (Frecuente)", tipo: "cliente", badgeDefault: "Nivel 1" },
  { id: "cliente_especial", nombreBase: "Cliente Especial VIP", labelDefault: "Cliente Especial VIP", tipo: "cliente", badgeDefault: "VIP" },
  { id: "revendedor_4", nombreBase: "Revendedor Nivel 4", labelDefault: "Revendedor Nivel 4", tipo: "revendedor", badgeDefault: "Mín 5$" },
  { id: "revendedor_3", nombreBase: "Revendedor Nivel 3", labelDefault: "Revendedor Nivel 3", tipo: "revendedor", badgeDefault: "Mín 25$" },
  { id: "revendedor_2", nombreBase: "Revendedor Nivel 2", labelDefault: "Revendedor Nivel 2", tipo: "revendedor", badgeDefault: "Mín 50$" },
  { id: "revendedor_1", nombreBase: "Revendedor Nivel 1", labelDefault: "Revendedor Nivel 1 (Mayorista)", tipo: "revendedor", badgeDefault: "Mayorista" },
  { id: "revendedor_especial", nombreBase: "Revendedor Especial VIP", labelDefault: "Revendedor Especial VIP", tipo: "revendedor", badgeDefault: "VIP B2B" },
];

interface AdminPricesManagerProps {
  initialRank?: string;
  onNavigateToResellers?: () => void;
}

export default function AdminPricesManager({
  initialRank,
  onNavigateToResellers,
}: AdminPricesManagerProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRango, setSelectedRango] = useState<string>(initialRank || "revendedor_4");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [rates, setRates] = useState<Rates>({ tasa_ves: 0, tasa_mxn: 0 });
  const [overrides, setOverrides] = useState<PriceOverride[]>([]);
  const [rules, setRules] = useState<ResellerRule[]>([]);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos
  const loadPricesData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prices");
      if (!res.ok) throw new Error("Error al obtener catálogo y precios");
      const data = await res.json();
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
      setProducts(data.products || []);
      setVariants(data.variants || []);
      setRates(data.rates || { tasa_ves: 0, tasa_mxn: 0 });
      setOverrides(data.overrides || []);
      setRules(data.rules || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricesData();
  }, []);

  useEffect(() => {
    if (initialRank) {
      setSelectedRango(initialRank);
    }
  }, [initialRank]);

  // Lista plana de items a configurar (productos y sus variantes)
  const flatItems = useMemo(() => {
    const list: Array<{
      key: string;
      producto_id: string;
      variante_id: string | null;
      nombre: string;
      categoria_id: string;
      categoria_nombre: string;
      costo_proveedor: number;
      precio_base: number;
      precio_ref_ves?: number | null;
      precio_fijo_ves?: number | null;
      precio_ref_mxn?: number | null;
      precio_fijo_mxn?: number | null;
    }> = [];

    for (const prod of products) {
      const sub = subcategories.find((s) => s.id === prod.subcategoria_id);
      const cat = categories.find((c) => c.id === sub?.categoria_id);
      const prodVars = variants.filter((v) => v.producto_id === prod.id);

      if (prodVars.length > 0) {
        for (const v of prodVars) {
          list.push({
            key: `var_${v.id}`,
            producto_id: prod.id,
            variante_id: v.id,
            nombre: `${prod.nombre} - ${v.nombre}`,
            categoria_id: cat?.id || "general",
            categoria_nombre: cat?.nombre || "General",
            costo_proveedor: Number(v.costo_proveedor || 0),
            precio_base: Number(v.precio_base || 0),
            precio_ref_ves: v.precio_ref_ves,
            precio_fijo_ves: v.precio_fijo_ves,
            precio_ref_mxn: v.precio_ref_mxn,
            precio_fijo_mxn: v.precio_fijo_mxn,
          });
        }
      } else {
        list.push({
          key: `prod_${prod.id}`,
          producto_id: prod.id,
          variante_id: null,
          nombre: prod.nombre,
          categoria_id: cat?.id || "general",
          categoria_nombre: cat?.nombre || "General",
          costo_proveedor: Number(prod.costo_proveedor || 0),
          precio_base: Number(prod.precio_base || 0),
          precio_ref_ves: prod.precio_ref_ves,
          precio_fijo_ves: prod.precio_fijo_ves,
          precio_ref_mxn: prod.precio_ref_mxn,
          precio_fijo_mxn: prod.precio_fijo_mxn,
        });
      }
    }

    return list;
  }, [products, variants, subcategories, categories]);

  // Filtrado por búsqueda y categoría
  const filteredItems = useMemo(() => {
    return flatItems.filter((item) => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCat === "all" || item.categoria_id === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [flatItems, searchTerm, selectedCat]);

  // Obtener el override actual de un item para el rango seleccionado
  const getItemOverride = (producto_id: string, variante_id: string | null): PriceOverride => {
    const existing = overrides.find(
      (o) =>
        o.rango === selectedRango &&
        (variante_id ? o.variante_id === variante_id : o.producto_id === producto_id && !o.variante_id)
    );

    if (existing) return existing;

    // Valores por defecto
    const item = flatItems.find(
      (i) => i.producto_id === producto_id && (variante_id ? i.variante_id === variante_id : !i.variante_id)
    );

    return {
      producto_id,
      variante_id,
      rango: selectedRango,
      precio_usdt: item ? item.precio_base : 0,
      precio_fijo_ves: item?.precio_fijo_ves || null,
      precio_ref_ves: item?.precio_ref_ves || (item ? item.precio_base : null),
      precio_fijo_mxn: item?.precio_fijo_mxn || null,
      precio_ref_mxn: item?.precio_ref_mxn || (item ? item.precio_base : null),
      modo_ves: item?.precio_fijo_ves ? "fijo" : "tasa_usdt",
      modo_mxn: item?.precio_fijo_mxn ? "fijo" : "tasa_usdt",
    };
  };

  // Manejar cambio en un campo de override
  const handleUpdateField = (
    producto_id: string,
    variante_id: string | null,
    field: keyof PriceOverride,
    value: any
  ) => {
    setOverrides((prev) => {
      const idx = prev.findIndex(
        (o) =>
          o.rango === selectedRango &&
          (variante_id ? o.variante_id === variante_id : o.producto_id === producto_id && !o.variante_id)
      );

      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      } else {
        const item = flatItems.find(
          (i) => i.producto_id === producto_id && (variante_id ? i.variante_id === variante_id : !i.variante_id)
        );
        const newItem: PriceOverride = {
          producto_id,
          variante_id,
          rango: selectedRango,
          precio_usdt: item ? item.precio_base : 0,
          precio_fijo_ves: null,
          precio_ref_ves: item ? item.precio_base : null,
          precio_fijo_mxn: null,
          precio_ref_mxn: item ? item.precio_base : null,
          modo_ves: "tasa_usdt",
          modo_mxn: "fijo",
          [field]: value,
        };
        return [...prev, newItem];
      }
    });
  };

  // Guardar cambios en lote
  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Filtrar solo los overrides del rango actual para guardar
      const itemsToSave = overrides.filter((o) => o.rango === selectedRango);

      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSave }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar precios");

      setSuccessMessage(`¡Configuración de precios para "${selectedRango}" guardada con éxito! (${data.guardados} items)`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-fuchsia-400" />
        <p className="text-slate-400 text-sm font-medium">Cargando matriz inteligente de precios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y Selector de Rangos */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-[#FFF01F]" />
              <span>Gestor Exclusivo de Precios Multi-Rango y Moneda</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configura tarifas personalizadas en USDT, precios desacoplados en MXN (fijos en pesos) o referencias en Bs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToResellers && (
              <button
                type="button"
                onClick={onNavigateToResellers}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/30 transition shadow-sm"
                title="Volver al Control de Revendedores"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 rotate-180" />
                <span>← Volver a Revendedores</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/30 transition shadow-sm"
              title="Configurar mínimos de depósito y qué rangos exigen depósito"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Configurar Mínimos de Depósito</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>
        </div>

        {/* Tasas de cambio vigentes informativas */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">Tasas vigentes:</span>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
            1 USDT = {Number(rates.tasa_ves || 0).toFixed(2)} Bs. (VES)
          </span>
          <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
            1 USDT = {Number(rates.tasa_mxn || 0).toFixed(2)} MXN
          </span>
        </div>

        {/* Notificaciones */}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selector de Rangos */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Selecciona el Rango a Configurar:
            </label>
            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Sliders className="w-3 h-3" />
              <span>Editar requisitos de depósito</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGOS_BASE.map((r) => {
              const isSelected = selectedRango === r.id;
              const isReseller = r.tipo === "revendedor";
              const rule = rules.find((rl) => rl.rango === r.id);
              
              let label = r.labelDefault;
              let badge = r.badgeDefault;
              
              if (rule) {
                if (rule.nombre_nivel) {
                  label = rule.deposito_minimo_usdt > 0 && rule.activo
                    ? `${rule.nombre_nivel} (Desde ${rule.deposito_minimo_usdt} USDT)`
                    : rule.nombre_nivel;
                }
                if (rule.activo && rule.deposito_minimo_usdt > 0) {
                  badge = `Mín ${rule.deposito_minimo_usdt}$`;
                } else if (!rule.activo) {
                  badge = "Manual";
                }
              }

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRango(r.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? isReseller
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        : "bg-fuchsia-600 text-white border-fuchsia-400 shadow-glow"
                      : "bg-slate-950/60 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      isSelected
                        ? "bg-black/20 text-current font-extrabold"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtros de Tabla */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto o recarga..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-fuchsia-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-fuchsia-500"
          >
            <option value="all">Todas las categorías ({flatItems.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matriz / Tabla Interactiva */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Producto / Paquete</th>
                <th className="p-4">Costo Prov.</th>
                <th className="p-4">Base USDT</th>
                <th className="p-4">Precio USDT ({selectedRango})</th>
                <th className="p-4">Moneda VES (Bs.)</th>
                <th className="p-4">Moneda MXN ($)</th>
                <th className="p-4">Margen Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const override = getItemOverride(item.producto_id, item.variante_id);
                const precioUsdt = Number(override.precio_usdt || item.precio_base || 0);
                const costo = Number(item.costo_proveedor || 0);
                const gananciaUsdt = precioUsdt - costo;
                const margenPct = costo > 0 ? ((gananciaUsdt / costo) * 100).toFixed(1) : "0.0";
                const margenNegativo = gananciaUsdt < 0;

                // Cálculo VES
                let vesTexto = "0.00 Bs.";
                if (override.modo_ves === "fijo" && override.precio_fijo_ves) {
                  vesTexto = `${Number(override.precio_fijo_ves).toFixed(2)} Bs. (Fijo)`;
                } else {
                  const baseVes = override.precio_ref_ves ? Number(override.precio_ref_ves) : precioUsdt;
                  const calculo = baseVes * (rates.tasa_ves || 0);
                  vesTexto = `${calculo.toFixed(2)} Bs. (Tasa)`;
                }

                // Cálculo MXN
                let mxnTexto = "$0.00 MXN";
                if (override.modo_mxn === "fijo" && override.precio_fijo_mxn) {
                  mxnTexto = `$${Number(override.precio_fijo_mxn).toFixed(2)} MXN (Fijo)`;
                } else {
                  const baseMxn = override.precio_ref_mxn ? Number(override.precio_ref_mxn) : precioUsdt;
                  const calculo = baseMxn * (rates.tasa_mxn || 0);
                  mxnTexto = `$${calculo.toFixed(2)} MXN (Tasa)`;
                }

                return (
                  <tr key={item.key} className="hover:bg-slate-800/40 transition">
                    {/* Nombre y Categoría */}
                    <td className="p-4 max-w-xs">
                      <span className="font-bold text-white block">{item.nombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {item.categoria_nombre}
                      </span>
                    </td>

                    {/* Costo Proveedor */}
                    <td className="p-4 font-mono text-slate-400">
                      ${costo.toFixed(2)}
                    </td>

                    {/* Precio Base */}
                    <td className="p-4 font-mono text-slate-400">
                      ${item.precio_base.toFixed(2)}
                    </td>

                    {/* Precio USDT para este rango */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={override.precio_usdt ?? item.precio_base}
                          onChange={(e) =>
                            handleUpdateField(
                              item.producto_id,
                              item.variante_id,
                              "precio_usdt",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1.5 rounded-lg bg-black/60 border border-slate-700 font-mono text-xs text-[#FFF01F] font-bold outline-none focus:border-fuchsia-500"
                        />
                      </div>
                    </td>

                    {/* Configuración VES */}
                    <td className="p-4 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <select
                          value={override.modo_ves || "tasa_usdt"}
                          onChange={(e) =>
                            handleUpdateField(
                              item.producto_id,
                              item.variante_id,
                              "modo_ves",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 rounded bg-black/40 border border-slate-800 text-[10px] text-slate-300 outline-none"
                        >
                          <option value="tasa_usdt">Tasa × USDT</option>
                          <option value="fijo">Fijo en Bs.</option>
                        </select>

                        {override.modo_ves === "fijo" ? (
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Bs. Fijo"
                            value={override.precio_fijo_ves ?? ""}
                            onChange={(e) =>
                              handleUpdateField(
                                item.producto_id,
                                item.variante_id,
                                "precio_fijo_ves",
                                parseFloat(e.target.value) || null
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-black/60 border border-slate-700 font-mono text-[11px] text-emerald-400 outline-none"
                          />
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Base USD"
                            value={override.precio_ref_ves ?? override.precio_usdt ?? item.precio_base}
                            onChange={(e) =>
                              handleUpdateField(
                                item.producto_id,
                                item.variante_id,
                                "precio_ref_ves",
                                parseFloat(e.target.value) || null
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-black/60 border border-slate-700 font-mono text-[11px] text-emerald-400 outline-none"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono block truncate">
                        {vesTexto}
                      </span>
                    </td>

                    {/* Configuración MXN */}
                    <td className="p-4 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <select
                          value={override.modo_mxn || "fijo"}
                          onChange={(e) =>
                            handleUpdateField(
                              item.producto_id,
                              item.variante_id,
                              "modo_mxn",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 rounded bg-black/40 border border-slate-800 text-[10px] text-slate-300 outline-none"
                        >
                          <option value="fijo">Fijo Directo ($ MXN)</option>
                          <option value="tasa_usdt">Tasa × USDT</option>
                        </select>

                        {override.modo_mxn === "fijo" ? (
                          <input
                            type="number"
                            step="1"
                            placeholder="$ MXN"
                            value={override.precio_fijo_mxn ?? ""}
                            onChange={(e) =>
                              handleUpdateField(
                                item.producto_id,
                                item.variante_id,
                                "precio_fijo_mxn",
                                parseFloat(e.target.value) || null
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-black/60 border border-slate-700 font-mono text-[11px] text-cyan-400 outline-none"
                          />
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Base USD"
                            value={override.precio_ref_mxn ?? override.precio_usdt ?? item.precio_base}
                            onChange={(e) =>
                              handleUpdateField(
                                item.producto_id,
                                item.variante_id,
                                "precio_ref_mxn",
                                parseFloat(e.target.value) || null
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-black/60 border border-slate-700 font-mono text-[11px] text-cyan-400 outline-none"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono block truncate">
                        {mxnTexto}
                      </span>
                    </td>

                    {/* Margen */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
                          margenNegativo
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {margenNegativo ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        <span>{gananciaUsdt >= 0 ? `+$${gananciaUsdt.toFixed(2)}` : `-$${Math.abs(gananciaUsdt).toFixed(2)}`}</span>
                        <span>({margenPct}%)</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para configurar mínimos de depósito y qué rangos exigen depósito */}
      <AdminRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        initialRules={rules}
        onNavigateToPrices={(rango) => setSelectedRango(rango)}
        onSaved={(updatedRules) => {
          setRules(updatedRules);
          setSuccessMessage("Reglas de escalafón y montos mínimos de depósito actualizados con éxito");
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />
    </div>
  );
}
