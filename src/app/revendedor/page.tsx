"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Zap,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Copy,
  Check,
  Flame,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  LogIn,
  Upload,
  Coins
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageUploadInput from "@/components/ImageUploadInput";

interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  rango: string;
  saldo_usdt: number;
  saldo_ves: string;
  saldo_mxn: string;
}

interface Rates {
  tasa_ves: number;
  tasa_mxn: number;
}

interface FrequentClient {
  id: string;
  nombre_cliente: string;
  identificador_juego: string;
  producto_frecuente_id?: string | null;
  variante_frecuente_id?: string | null;
  precio_venta_final?: number | null;
}

interface ResellerOrder {
  id: string;
  estado: string;
  total_usd: number;
  moneda_pago: string;
  creado_en: string;
  producto_nombre: string;
  variante_nombre?: string | null;
  player_id?: string | null;
  precio_unitario: number;
}

export default function ResellerPortalPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [rates, setRates] = useState<Rates>({ tasa_ves: 0, tasa_mxn: 0 });
  const [clientesFrecuentes, setClientesFrecuentes] = useState<FrequentClient[]>([]);
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  // Estado del catálogo para el atajo de pedido rápido
  const [catalog, setCatalog] = useState<{
    categories: any[];
    subcategories: any[];
    products: any[];
    variants: any[];
    overrides?: any[];
  }>({
    categories: [],
    subcategories: [],
    products: [],
    variants: [],
  });

  // Formulario de Pedido Rápido
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [selectedProdId, setSelectedProdId] = useState("");
  const [selectedVarId, setSelectedVarId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [saveFrequent, setSaveFrequent] = useState(false);
  const [frequentName, setFrequentName] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);

  // Modal de Recarga de Saldo
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("USDT");
  const [depositMethod, setDepositMethod] = useState("BINANCE_PAY");
  const [depositProofUrl, setDepositProofUrl] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  // Cargar datos del revendedor y catálogo
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [walletRes, ordersRes, catRes] = await Promise.all([
        fetch("/api/reseller/wallet"),
        fetch("/api/reseller/orders"),
        fetch("/api/catalog"),
      ]);

      if (walletRes.status === 401) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const walletData = await walletRes.json();
      const ordersData = await ordersRes.json();
      const catData = await catRes.json();

      setCurrentUser(walletData.user || null);
      setRates(walletData.rates || { tasa_ves: 0, tasa_mxn: 0 });
      setClientesFrecuentes(walletData.clientesFrecuentes || []);
      setMetodosPago(walletData.metodosPago || []);
      setOrders(ordersData.orders || []);
      setCatalog(catData || { categories: [], subcategories: [], products: [], variants: [] });

      // Preseleccionar primera categoría si existe
      if (catData.categories && catData.categories.length > 0) {
        setSelectedCatId(catData.categories[0].id);
      }
    } catch (err: any) {
      console.error("Error al cargar portal de revendedor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Subcategorías de la categoría seleccionada
  const filteredSubcategories = catalog.subcategories.filter(
    (s) => s.categoria_id === selectedCatId
  );

  // Productos de la subcategoría seleccionada
  const filteredProducts = catalog.products.filter(
    (p) => p.subcategoria_id === (selectedSubId || (filteredSubcategories[0]?.id || ""))
  );

  // Variantes del producto seleccionado
  const selectedProduct = catalog.products.find((p) => p.id === selectedProdId) || filteredProducts[0];
  const filteredVariants = catalog.variants.filter(
    (v) => v.producto_id === (selectedProdId || selectedProduct?.id)
  );

  // Calcular precio del item seleccionado considerando overrides del revendedor
  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;
    const prodId = selectedProduct.id;
    const varId = selectedVarId || (filteredVariants[0]?.id || null);

    const userRango = currentUser?.rango || "revendedor_4";
    const override = catalog.overrides?.find(
      (o: any) =>
        o.rango === userRango &&
        (varId ? o.variante_id === varId : o.producto_id === prodId && !o.variante_id)
    );

    if (override && (override.precio_usdt || override.precio_fijo)) {
      return Number(override.precio_usdt || override.precio_fijo);
    }

    if (varId) {
      const v = filteredVariants.find((x) => x.id === varId);
      if (v) return Number(v.precio_base);
    }

    return Number(selectedProduct.precio_base || 0);
  };

  const itemPriceUsdt = calculateItemPrice();

  // Procesar Pedido Rápido con Saldo Instantáneo
  const handleProcessQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!playerId.trim()) {
      setNotification({ type: "error", text: "Por favor ingresa el Player ID o cuenta de destino." });
      return;
    }

    setProcessingOrder(true);
    setNotification(null);

    try {
      const res = await fetch("/api/reseller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: selectedProduct.id,
          variante_id: selectedVarId || (filteredVariants[0]?.id || null),
          player_id: playerId.trim(),
          guardar_frecuente: saveFrequent,
          nombre_cliente_frecuente: frequentName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pedido");
      }

      setNotification({
        type: "success",
        text: `¡Pedido despachado con éxito! ID: #${data.pedido_id?.slice(0, 8)} - Se descontaron $${data.monto_debitado?.toFixed(2)} USDT.`,
      });

      setPlayerId("");
      setSaveFrequent(false);
      setFrequentName("");
      await loadPortalData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al procesar pedido" });
    } finally {
      setProcessingOrder(false);
    }
  };

  // Enviar Reporte de Depósito para Recarga de Saldo
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositProofUrl) {
      setNotification({ type: "error", text: "Ingresa el monto y sube la captura del comprobante." });
      return;
    }

    setSubmittingDeposit(true);
    try {
      const res = await fetch("/api/reseller/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto_reportado: parseFloat(depositAmount),
          moneda: depositCurrency,
          metodo_pago: depositMethod,
          referencia_bancaria: depositReference.trim() || null,
          comprobante_url: depositProofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar comprobante");

      setNotification({ type: "success", text: data.message });
      setDepositModalOpen(false);
      setDepositAmount("");
      setDepositProofUrl("");
      setDepositReference("");
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Error al enviar depósito" });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Autocompletar Player ID desde cliente frecuente
  const handleSelectFrequent = (client: FrequentClient) => {
    setPlayerId(client.identificador_juego);
    if (client.producto_frecuente_id) {
      setSelectedProdId(client.producto_frecuente_id);
    }
    if (client.variante_frecuente_id) {
      setSelectedVarId(client.variante_frecuente_id);
    }
    setNotification({
      type: "success",
      text: `ID "${client.identificador_juego}" de ${client.nombre_cliente} cargado en el formulario.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-slate-400 text-sm font-medium">Cargando Centro de Despachos B2B...</p>
      </div>
    );
  }

  // Si no ha iniciado sesión
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Portal de Revendedores Soul Store</h1>
            <p className="text-xs text-slate-400 mt-2">
              Inicia sesión para acceder a precios de mayorista, despachos automáticos con saldo y agenda de clientes frecuentes.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión en Soul Store</span>
            </Link>
            <Link
              href="/"
              className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:text-white transition"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isReseller = currentUser.rango.startsWith("revendedor_") || currentUser.rango === "admin";
  const userSaldo = Number(currentUser.saldo_usdt || 0);

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-amber-500 selection:text-black">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full bg-[#0B0D13] rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <span className="font-black text-sm tracking-tight text-white group-hover:text-amber-400 transition">
                Soul Store <span className="text-amber-400 font-mono text-xs">/ B2B</span>
              </span>
            </Link>

            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase hidden sm:inline-block">
              {currentUser.rango}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition"
            >
              Ver Catálogo Regular
            </Link>
            <Link
              href="/feed"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition"
            >
              Feed Social
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Banner si el usuario aún no es revendedor oficial */}
        {!isReseller && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>¡Activa tu Rango de Revendedor!</strong> Realiza un depósito mínimo de <strong>5 USDT</strong> (o equivalente en Bs / MXN) para desbloquear tarifas mayoristas y despacho instantáneo.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDepositModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shrink-0 hover:brightness-110 shadow-md"
            >
              Depositar 5 USDT
            </button>
          </div>
        )}

        {/* Notificaciones */}
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

        {/* ========================================================================= */}
        {/* 1. TARJETA DE BILLETERA / SALDO DISPONIBLE                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-amber-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  Billetera Virtual B2B
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    ${userSaldo.toFixed(2)}
                  </span>
                  <span className="text-amber-400 font-bold text-sm font-mono">USDT</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-400">
                  <span>Equivalente:</span>
                  <span className="text-emerald-400 font-bold">
                    ≈ {currentUser.saldo_ves} Bs.
                  </span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">
                    ≈ ${currentUser.saldo_mxn} MXN
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDepositModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Recargar Saldo</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Despacho 100% Automático sin esperar confirmación bancaria</span>
              </span>
              <span className="font-mono text-slate-500">
                1 USDT = {Number(rates.tasa_ves || 0).toFixed(2)} Bs.
              </span>
            </div>
          </div>

          {/* Estadísticas de Pedidos */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Historial de Operaciones
              </span>
              <div className="text-3xl font-black text-white mt-1 font-mono">
                {orders.length}
              </div>
              <span className="text-xs text-slate-400 block mt-1">
                Recargas tramitadas en tu cuenta
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">En Cola / Proceso:</span>
              <span className="text-amber-400 font-bold">
                {orders.filter((o) => o.estado === "PROCESANDO" || o.estado === "EN_COLA").length}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FORMULARIO DE PEDIDO RÁPIDO & CLIENTES FRECUENTES                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Atajo Rápido */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Atajo de Pedido Rápido (Despacho con Saldo)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecciona el paquete, ingresa el ID y el pedido se procesará al instante sin subir comprobante.
              </p>
            </div>

            <form onSubmit={handleProcessQuickOrder} className="space-y-4 text-xs">
              {/* Selectores en Cascada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    1. Juego o Categoría:
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value);
                      setSelectedSubId("");
                      setSelectedProdId("");
                      setSelectedVarId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white font-medium outline-none focus:border-amber-400"
                  >
                    {catalog.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    2. Subcategoría / Tipo:
                  </label>
                  <select
                    value={selectedSubId || (filteredSubcategories[0]?.id || "")}
                    onChange={(e) => {
                      setSelectedSubId(e.target.value);
                      setSelectedProdId("");
                      setSelectedVarId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white font-medium outline-none focus:border-amber-400"
                  >
                    {filteredSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Producto / Paquete */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  3. Paquete o Recarga Deseada:
                </label>
                {filteredVariants.length > 0 ? (
                  <select
                    value={selectedVarId || (filteredVariants[0]?.id || "")}
                    onChange={(e) => setSelectedVarId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white font-medium outline-none focus:border-amber-400"
                  >
                    {filteredVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {selectedProduct?.nombre} - {v.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedProdId || (selectedProduct?.id || "")}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white font-medium outline-none focus:border-amber-400"
                  >
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Player ID */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  4. Player ID / Cuenta de Destino:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej: 198273645 o email de cuenta"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white font-mono text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Guardar en clientes frecuentes */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={saveFrequent}
                    onChange={(e) => setSaveFrequent(e.target.checked)}
                    className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Guardar en mis Clientes Frecuentes</span>
                </label>

                {saveFrequent && (
                  <input
                    type="text"
                    placeholder="Nombre o apodo del cliente (ej: Juan FF)"
                    value={frequentName}
                    onChange={(e) => setFrequentName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white text-xs outline-none"
                  />
                )}
              </div>

              {/* Resumen de Costo y Botón de Despacho */}
              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    Precio de tu Rango ({currentUser.rango}):
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#FFF01F] font-mono">
                      ${itemPriceUsdt.toFixed(2)} USDT
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (≈ {(itemPriceUsdt * (rates.tasa_ves || 0)).toFixed(2)} Bs.)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processingOrder || userSaldo < itemPriceUsdt}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {processingOrder ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>
                    {userSaldo < itemPriceUsdt
                      ? "Saldo Insuficiente (Recargar)"
                      : "Procesar Pedido Instantáneo"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Agenda de Clientes Frecuentes */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Clientes Frecuentes ({clientesFrecuentes.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toca cualquier cliente para autocompletar su ID al instante.
              </p>

              <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {clientesFrecuentes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">
                    Aún no tienes clientes guardados. Marca la casilla "Guardar en mis Clientes Frecuentes" al realizar un pedido.
                  </p>
                ) : (
                  clientesFrecuentes.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectFrequent(client)}
                      className="w-full p-2.5 rounded-xl bg-black/40 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition text-left flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate group-hover:text-amber-400 transition">
                          {client.nombre_cliente}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 block truncate">
                          ID: {client.identificador_juego}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                        Usar ID &rarr;
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>IDs Guardados</span>
              <span className="font-mono text-white font-bold">{clientesFrecuentes.length}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. HISTORIAL DE RECARGAS REALIZADAS                                       */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Mis Recargas y Despachos Recientes</span>
              </h3>
              <p className="text-xs text-slate-400">
                Consulta el estado de entrega en tiempo real de tus pedidos.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-black/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">ID Pedido</th>
                  <th className="p-3">Producto / Paquete</th>
                  <th className="p-3">Player ID</th>
                  <th className="p-3">Costo Debitado</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                      Aún no has tramitado recargas con saldo.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {o.producto_nombre}
                        {o.variante_nombre ? ` (${o.variante_nombre})` : ""}
                      </td>
                      <td className="p-3 font-mono text-amber-400">
                        {o.player_id || "N/A"}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#FFF01F]">
                        ${Number(o.total_usd).toFixed(2)} USDT
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            o.estado === "COMPLETADO"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : o.estado === "PROCESANDO" || o.estado === "EN_COLA"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {o.estado}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {new Date(o.creado_en).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL DE RECARGA DE SALDO                                                 */}
      {/* ========================================================================= */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Recargar Saldo de Revendedor</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Depósito mínimo: 5 USDT (o su equivalente en Bs. o MXN)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Moneda de Pago:
                  </label>
                  <select
                    value={depositCurrency}
                    onChange={(e) => setDepositCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none"
                  >
                    <option value="USDT">USDT (Binance Pay / TRC20)</option>
                    <option value="VES">Bolívares (VES / Pago Móvil)</option>
                    <option value="MXN">Pesos Mexicanos (MXN / STP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Monto a Recargar:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Monto"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Método de Pago:
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                >
                  <option value="BINANCE_PAY">Binance Pay (Sin comisiones)</option>
                  <option value="PAGO_MOVIL">Pago Móvil (Venezuela)</option>
                  <option value="TRANSFERENCIA_VES">Transferencia Bancaria (Venezuela)</option>
                  <option value="TRANSFERENCIA_MXN">Transferencia SPEI / STP (México)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Referencia o Hash de Pago:
                </label>
                <input
                  type="text"
                  placeholder="Número de referencia bancaria o Binance Order ID"
                  value={depositReference}
                  onChange={(e) => setDepositReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none"
                />
              </div>

              {/* Subida de Comprobante */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Comprobante o Captura de Pago:
                </label>
                <ImageUploadInput
                  label="📷 Comprobante o Captura de Pago:"
                  value={depositProofUrl}
                  onChange={(url) => setDepositProofUrl(url)}
                  placeholder="Sube el comprobante de pago..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingDeposit || !depositProofUrl}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 disabled:opacity-40"
                >
                  {submittingDeposit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submittingDeposit ? "Enviando..." : "Enviar Comprobante"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
