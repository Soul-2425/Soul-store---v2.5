"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  QrCode,
  MessageCircle,
  ExternalLink,
  Info,
  DollarSign,
  Heart,
  Sparkles,
  Globe,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import ImageUploadInput from "@/components/ImageUploadInput";
import { urlBase64ToUint8Array } from "@/components/PushNotificationManager";

interface Product {
  id: string;
  nombre: string;
  precio_base: number;
  imagen_url?: string | null;
  categoria_nombre?: string | null;
  subcategoria_nombre?: string | null;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
  requisitos_dinamicos?: any[];
}

export interface VariantItem {
  id: string;
  producto_id?: string;
  nombre: string;
  sku?: string | null;
  precio_base: number;
  imagen_url?: string | null;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
  requisitos_dinamicos?: any[];
}

export interface UserProfile {
  id: string;
  nombre?: string;
  apellido?: string | null;
  nickname: string;
  email: string;
  rango: string;
  telefono_whatsapp?: string | null;
}

export interface PaymentFieldItem {
  id?: string;
  etiqueta: string;
  valor: string;
  copiable?: boolean;
}

export interface PaymentMethodItem {
  id: string;
  moneda: "USD" | "VES" | "MXN";
  nombre_metodo: string;
  banco: string | null;
  titular: string | null;
  identificacion: string | null;
  datos_cuenta: string;
  tipo_cuenta: string | null;
  instrucciones: string | null;
  qr_imagen_url: string | null;
  campos?: PaymentFieldItem[] | null;
  activo: boolean;
  orden?: number;
}

interface CheckoutModalProps {
  product: Product;
  variant?: VariantItem | null;
  variants?: VariantItem[];
  category?: any;
  subcategory?: any;
  tasaVes: number;
  tasaMxn: number;
  defaultCurrency?: "USD" | "VES" | "MXN";
  currentUser?: UserProfile | null;
  onClose: () => void;
}

export default function CheckoutModal({
  product,
  variant = null,
  variants = [],
  category = null,
  subcategory = null,
  tasaVes,
  tasaMxn,
  defaultCurrency = "USD",
  currentUser = null,
  onClose,
}: CheckoutModalProps) {
  // Pasos: 1 = Datos del pedido, 2 = Pago y Comprobante, 3 = Confirmado
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [selectedSubVariant, setSelectedSubVariant] = useState<VariantItem | null>(
    variant || (variants && variants.length > 0 ? variants[0] : null)
  );

  const activeVariant = selectedSubVariant || variant;

  // Combinación jerárquica de campos dinámicos: Categoría -> Subcategoría -> Producto -> Variante
  const allDynamicRequirements = useMemo(() => {
    const list: Array<{ id: string; nombre: string; placeholder: string; tipo: "text" | "password" | "number"; obligatorio: boolean }> = [];
    const seen = new Set<string>();

    const addList = (arr?: any[]) => {
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && item.nombre && item.nombre.trim()) {
            const key = item.nombre.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                id: item.id || key,
                nombre: item.nombre.trim(),
                placeholder: item.placeholder || `Escribe tu ${item.nombre.trim()}...`,
                tipo: item.tipo === "password" || item.tipo === "number" ? item.tipo : "text",
                obligatorio: item.obligatorio !== false,
              });
            }
          }
        }
      }
    };

    if (category?.requisitos_dinamicos) addList(category.requisitos_dinamicos);
    if (subcategory?.requisitos_dinamicos) addList(subcategory.requisitos_dinamicos);
    if (product?.requisitos_dinamicos) addList(product.requisitos_dinamicos);
    if (activeVariant?.requisitos_dinamicos) addList(activeVariant.requisitos_dinamicos);

    // Fallback estándar si no hay campos dinámicos definidos en ninguna altura
    if (list.length === 0) {
      list.push({
        id: "default_player_id",
        nombre: "Player ID / Cuenta",
        placeholder: "Ej: 816331100",
        tipo: "text",
        obligatorio: true,
      });
    }

    return list;
  }, [category, subcategory, product, activeVariant]);

  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [moneda, setMoneda] = useState<"USD" | "VES" | "MXN">(defaultCurrency);
  const [playerId, setPlayerId] = useState("");
  
  // Nombre y WhatsApp prellenados desde la cuenta del usuario si existe
  const [nombre, setNombre] = useState(
    currentUser?.nombre 
      ? `${currentUser.nombre} ${currentUser.apellido || ""}`.trim() 
      : (currentUser?.nickname || "")
  );
  const [whatsapp, setWhatsapp] = useState(currentUser?.telefono_whatsapp || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [comentarios, setComentarios] = useState("");

  // Métodos de pago según la moneda seleccionada
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null);
  
  // Datos del comprobante
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [referenciaPago, setReferenciaPago] = useState("");

  // Se removió temporalmente la lógica de verificación de Free Fire

  // Detección de duplicados
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  // Estados de envío y resultado
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    totalLocal: number;
    moneda: string;
    totalUsd: number;
  } | null>(null);

  // Actualizar datos de usuario si cambian
  useEffect(() => {
    if (currentUser) {
      if (!whatsapp && currentUser.telefono_whatsapp) {
        setWhatsapp(currentUser.telefono_whatsapp);
      }
      if (!nombre) {
        setNombre(currentUser.nombre 
          ? `${currentUser.nombre} ${currentUser.apellido || ""}`.trim() 
          : (currentUser.nickname || "")
        );
      }
      if (!email && currentUser.email) {
        setEmail(currentUser.email);
      }
    }
  }, [currentUser]);

  // Cargar métodos de pago según la moneda activa
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoadingMethods(true);
        const res = await fetch(`/api/payment-methods?moneda=${moneda}`);
        const data = await res.json();
        if (res.ok && data.metodos) {
          setPaymentMethods(data.metodos);
          if (data.metodos.length > 0) {
            setSelectedMethod(data.metodos[0]);
          } else {
            setSelectedMethod(null);
          }
        }
      } catch (err) {
        console.error("Error al cargar métodos de pago:", err);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchMethods();
  }, [moneda]);

  // Precios calculados según subproducto seleccionado o producto base
  const activePriceUsd = selectedSubVariant ? Number(selectedSubVariant.precio_base) : Number(product.precio_base);
  const displayTitle = selectedSubVariant ? `${product.nombre} - ${selectedSubVariant.nombre}` : product.nombre;
  const displayImage = selectedSubVariant?.imagen_url || product.imagen_url;

  const itemFijoVes = selectedSubVariant?.precio_fijo_ves ?? product.precio_fijo_ves;
  const itemRefVes = selectedSubVariant?.precio_ref_ves ?? product.precio_ref_ves;
  const itemFijoMxn = selectedSubVariant?.precio_fijo_mxn ?? product.precio_fijo_mxn;
  const itemRefMxn = selectedSubVariant?.precio_ref_mxn ?? product.precio_ref_mxn;

  const precioUsd = activePriceUsd;
  const precioVes = itemFijoVes && Number(itemFijoVes) > 0 
    ? Number(itemFijoVes).toFixed(2)
    : tasaVes > 0 
    ? ((itemRefVes && Number(itemRefVes) > 0 ? Number(itemRefVes) : precioUsd) * tasaVes).toFixed(2) 
    : "0.00";

  const precioMxn = itemFijoMxn && Number(itemFijoMxn) > 0 
    ? Number(itemFijoMxn).toFixed(2)
    : tasaMxn > 0 
    ? ((itemRefMxn && Number(itemRefMxn) > 0 ? Number(itemRefMxn) : precioUsd) * tasaMxn).toFixed(2) 
    : "0.00";

  const getPrecioMostrado = () => {
    if (moneda === "VES") return `${precioVes} Bs. (VES)`;
    if (moneda === "MXN") return `$${precioMxn} MXN`;
    return `$${precioUsd.toFixed(2)} USD`;
  };

  // Copiar al portapapeles
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Obtener campos dinámicos para mostrar con fallback a los campos estándar
  const getCamposToRender = (method: PaymentMethodItem): PaymentFieldItem[] => {
    if (method.campos && Array.isArray(method.campos) && method.campos.length > 0) {
      return method.campos.filter((c) => c && (c.etiqueta?.trim() || c.valor?.trim()));
    }
    const fallback: PaymentFieldItem[] = [];
    if (method.banco) fallback.push({ etiqueta: "Banco", valor: method.banco, copiable: true });
    if (method.datos_cuenta) fallback.push({ etiqueta: "Número / Datos de Pago", valor: method.datos_cuenta, copiable: true });
    if (method.identificacion) fallback.push({ etiqueta: "Cédula / Documento", valor: method.identificacion, copiable: true });
    if (method.titular) fallback.push({ etiqueta: "Titular", valor: method.titular, copiable: true });
    return fallback;
  };

  // Validación en vivo de FF eliminada por solicitud del usuario

  // Verificar duplicado al terminar de escribir el Player ID
  const handleCheckDuplicate = async (idToCheck: string) => {
    if (!idToCheck.trim() || idToCheck.trim().length < 4) {
      setIsDuplicate(false);
      return;
    }

    try {
      setCheckingDuplicate(true);
      const res = await fetch("/api/orders/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: idToCheck.trim(),
          producto_id: product.id,
        }),
      });

      const data = await res.json();
      if (data.isDuplicate) {
        setIsDuplicate(true);
      } else {
        setIsDuplicate(false);
      }
    } catch (err) {
      console.error("Error al validar duplicado:", err);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Paso 1: Validar datos y avanzar a Paso 2
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validar todos los campos dinámicos obligatorios requeridos
    for (const req of allDynamicRequirements) {
      if (req.obligatorio) {
        const val = dynamicValues[req.nombre] ?? (req.id === "default_player_id" ? playerId : "");
        if (!val || !val.trim()) {
          setErrorMsg(`El campo "${req.nombre}" es obligatorio.`);
          return;
        }
      }
    }

    if (!nombre.trim()) {
      setErrorMsg("Por favor ingresa tu nombre de contacto.");
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg("Ingresa tu número de WhatsApp para confirmar la entrega.");
      return;
    }

    if (isDuplicate && !overrideDuplicate) {
      setErrorMsg("¡Se detectó un duplicado reciente! Confirma la casilla de Override para continuar.");
      return;
    }

    // Avanzar a Paso 2
    setCurrentStep(2);
  };

  // Paso 2: Confirmar compra definitiva
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedMethod && paymentMethods.length > 0) {
      setErrorMsg("Por favor selecciona un método de pago.");
      return;
    }

    try {
      setSubmitting(true);

      const resolvedPlayerId = 
        playerId.trim() || 
        dynamicValues["Player ID / Cuenta"] || 
        dynamicValues["ID de Jugador"] || 
        dynamicValues["Player ID"] || 
        dynamicValues["ID"] || 
        Object.values(dynamicValues)[0] || 
        "";

      // Intentar obtener o suscribir push del cliente para notificarlo al completar su pedido
      let pushSubJson: any = null;
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
          if (Notification.permission === "default") {
            try {
              await Notification.requestPermission();
            } catch {}
          }

          if (Notification.permission === "granted") {
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
              reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
            }
            await navigator.serviceWorker.ready;
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              const vapidKey =
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
                "BHMT_to0ViXP-2jqt3MSXODstv5Xqq7YsdaouWOeLRtKPsC6AXl6WAqGqSYovGXRVtGk86A4JO7M2tzjS_rfZkI";
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
              });
            }
            if (sub) {
              pushSubJson = sub.toJSON();
              localStorage.setItem("soul_push_endpoint", sub.endpoint);
            }
          }
        }
      } catch (pErr) {
        console.warn("No se pudo obtener suscripción push para el pedido:", pErr);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: product.id,
          variante_id: selectedSubVariant?.id || undefined,
          moneda,
          moneda_pago: moneda,
          player_id: resolvedPlayerId,
          datos_dinamicos: dynamicValues,
          campos_dinamicos: dynamicValues,
          push_subscription: pushSubJson,
          push_endpoint: pushSubJson?.endpoint || (typeof window !== "undefined" ? localStorage.getItem("soul_push_endpoint") : null),
          nombre_cliente: nombre.trim(),
          cliente_nombre: nombre.trim(),
          whatsapp_cliente: whatsapp.trim(),
          cliente_whatsapp: whatsapp.trim(),
          email_cliente: email.trim() || undefined,
          cliente_email: email.trim() || undefined,
          comentarios_adicionales: comentarios.trim() || undefined,
          comentarios: comentarios.trim() || undefined,
          es_override_duplicado: overrideDuplicate,
          override_duplicado: overrideDuplicate,
          metodo_pago_id: selectedMethod?.id || null,
          metodo_pago_nombre: selectedMethod ? `${selectedMethod.nombre_metodo} (${selectedMethod.banco || selectedMethod.moneda})` : null,
          comprobante_url: comprobanteUrl.trim() || null,
          referencia_pago: referenciaPago.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrderResult({
          orderNumber: data.orderNumber,
          totalLocal: data.totalLocal,
          moneda: data.moneda,
          totalUsd: data.totalUsd,
        });
      } else if (res.status === 409) {
        setIsDuplicate(true);
        setCurrentStep(1);
        setErrorMsg("¡Se detectó un duplicado reciente! Confirma el Override abajo para continuar.");
      } else {
        setErrorMsg(data.error || "No se pudo procesar tu orden.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al enviar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!orderResult) return "#";

    const dynamicFieldsLines = Object.entries(dynamicValues)
      .filter(([_, val]) => val && val.trim())
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");

    const text = encodeURIComponent(
      `¡Hola Soul Store! 👋 Acabo de generar mi orden *${orderResult.orderNumber}* para *${displayTitle}* por un total de *${orderResult.totalLocal} ${orderResult.moneda}*.\n\n` +
      `${dynamicFieldsLines ? dynamicFieldsLines + "\n" : (playerId ? `Player ID: ${playerId}\n` : "")}` +
      `Cliente: ${nombre}\nMétodo: ${selectedMethod?.nombre_metodo || "Transferencia"}\nReferencia: ${referenciaPago || "Adjunta"}\n\nAdjunto mi comprobante para que despachen mi recarga. ¡Muchas gracias!`
    );
    return `https://wa.me/584248901572?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg p-5 sm:p-7 rounded-3xl bg-[#0B0D13]/95 border border-white/15 relative shadow-2xl my-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ÉXITO: PANTALLA DE CONFIRMACIÓN */}
        {orderResult ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                ¡Pedido Confirmado con Éxito!
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                {orderResult.orderNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tu recarga de <strong className="text-white">{displayTitle}</strong> ha sido registrada y está en cola de verificación y despacho prioritario.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total de la Orden:</span>
                <span className="font-bold text-[#FFF01F] text-sm">
                  {orderResult.totalLocal} {orderResult.moneda}
                </span>
              </div>
              {playerId && (
                <div className="flex justify-between text-slate-400">
                  <span>Player ID Destino:</span>
                  <span className="text-white font-bold">{playerId}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Cliente:</span>
                <span className="text-white">{nombre}</span>
              </div>
              {selectedMethod && (
                <div className="flex justify-between text-slate-400">
                  <span>Método de Pago:</span>
                  <span className="text-emerald-400 font-bold">{selectedMethod.nombre_metodo}</span>
                </div>
              )}
              {referenciaPago && (
                <div className="flex justify-between text-slate-400">
                  <span>Nº Referencia:</span>
                  <span className="text-cyan-400 font-mono">{referenciaPago}</span>
                </div>
              )}
            </div>

            {/* Vista previa del comprobante cargado */}
            {comprobanteUrl && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
                <span className="text-[11px] font-mono text-slate-400 block mb-1.5 font-bold">
                  Comprobante Adjuntado:
                </span>
                <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-36 bg-black flex items-center justify-center">
                  <img src={comprobanteUrl} alt="Comprobante de Pago" className="w-full h-36 object-contain" />
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Enviar Notificación por WhatsApp</span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 text-xs text-slate-300 hover:text-white font-semibold transition"
              >
                Cerrar y Volver a la Tienda
              </button>
            </div>
          </div>
        ) : (
          /* FLUJO DE COMPRA EN 2 PASOS */
          <div className="space-y-5">
            {/* Header del Producto */}
            <div className="flex items-center gap-3">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={displayTitle}
                  className="w-13 h-13 rounded-2xl object-cover border border-white/20 shadow-md shrink-0 w-12 h-12 sm:w-14 sm:h-14"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#D61A1A] to-[#FFF01F] flex items-center justify-center text-black font-black text-xl shadow-md shrink-0">
                  ⚡
                </div>
              )}
              <div className="min-w-0 flex-1 pr-6">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D61A1A]/20 text-[#FFF01F] text-[10px] font-mono border border-[#D61A1A]/40">
                    {product.categoria_nombre || "Gaming"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Paso {currentStep} de 2
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {displayTitle}
                </h3>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* PASO 1: OPCIONES DE PRODUCTO, MONEDA Y DATOS DE LA CUENTA */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                {/* Selector de Subproductos / Paquetes si existen */}
                {variants && variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-[#FFF01F] block font-bold uppercase tracking-wider">
                      Selecciona la opción / subproducto ({variants.length}):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {variants.map((v) => {
                        const isSelected = selectedSubVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedSubVariant(v)}
                            className={`p-2.5 rounded-2xl text-left border transition flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? "bg-[#D61A1A]/40 border-[#FFF01F] text-white shadow-md ring-1 ring-[#FFF01F]"
                                : "bg-black/60 border-white/10 text-slate-300 hover:border-white/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {v.imagen_url ? (
                                <img src={v.imagen_url} alt="" className="w-6 h-6 rounded-lg object-cover shrink-0 border border-white/10" />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0 font-bold">
                                  💎
                                </div>
                              )}
                              <span className="text-xs font-bold truncate">{v.nombre}</span>
                            </div>
                            <span className="text-xs font-mono font-black text-[#FFF01F] shrink-0">
                              ${Number(v.precio_base).toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selector de Moneda */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1.5 font-bold uppercase">
                    Selecciona tu moneda de pago:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMoneda("USD")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex flex-col items-center ${
                        moneda === "USD"
                          ? "bg-[#D61A1A] border-[#FFF01F] text-white shadow-lg shadow-red-600/30"
                          : "bg-black/60 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>USD ($)</span>
                      <span className="text-[10px] opacity-75">${precioUsd.toFixed(2)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMoneda("VES")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex flex-col items-center ${
                        moneda === "VES"
                          ? "bg-[#D61A1A] border-[#FFF01F] text-white shadow-lg shadow-red-600/30"
                          : "bg-black/60 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>VES (Bs.)</span>
                      <span className="text-[10px] opacity-75">{precioVes} Bs.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMoneda("MXN")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex flex-col items-center ${
                        moneda === "MXN"
                          ? "bg-[#D61A1A] border-[#FFF01F] text-white shadow-lg shadow-red-600/30"
                          : "bg-black/60 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>MXN ($)</span>
                      <span className="text-[10px] opacity-75">${precioMxn}</span>
                    </button>
                  </div>
                </div>

                  {/* Campos Dinámicos Requeridos (Categoría, Subcategoría, Producto o Subproducto) */}
                  <div className="space-y-3">
                    {allDynamicRequirements.map((req, idx) => {
                      const isIdField = /id|cuenta|player|uid/i.test(req.nombre);
                      const isPasswordField = req.tipo === "password" || /clave|contrase|password/i.test(req.nombre);
                      const currentValue = dynamicValues[req.nombre] ?? (req.id === "default_player_id" ? playerId : "");
                      const showPassword = showPasswordMap[req.id || req.nombre] || false;

                      return (
                        <div key={req.id || `field_${idx}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                              <span>{req.nombre}</span>
                              {req.obligatorio && <span className="text-red-400 font-bold">*</span>}
                            </label>
                            {isIdField && checkingDuplicate && (
                              <span className="text-[10px] text-[#FFF01F] flex items-center gap-1 font-mono">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                <span>Verificando...</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="relative">
                            <input
                              type={isPasswordField ? (showPassword ? "text" : "password") : (req.tipo || "text")}
                              value={currentValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDynamicValues((prev) => ({ ...prev, [req.nombre]: val }));
                                if (req.id === "default_player_id" || isIdField) {
                                  setPlayerId(val);
                                  setIsDuplicate(false);
                                  setOverrideDuplicate(false);
                                }
                              }}
                              onBlur={(e) => {
                                if (isIdField) {
                                  handleCheckDuplicate(e.target.value);
                                }
                              }}
                              placeholder={req.placeholder || `Ej: ${req.nombre}`}
                              className={`w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#FFF01F] text-sm text-white font-mono outline-none ${
                                isPasswordField ? "pr-10" : ""
                              }`}
                            />
                            {isPasswordField && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswordMap((prev) => ({
                                    ...prev,
                                    [req.id || req.nombre]: !prev[req.id || req.nombre],
                                  }))
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>


                {/* Alerta de duplicados */}
                {isDuplicate && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/70 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>¡Alerta de Envío Duplicado (&lt; 15 min)!</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Detectamos una orden reciente para el Player ID <strong>{playerId}</strong>. Para evitar dobles compras accidentales, confirma que deseas continuar.
                    </p>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overrideDuplicate}
                        onChange={(e) => setOverrideDuplicate(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-amber-100 text-[11px]">
                        Override Manual: Confirmo que deseo realizar este segundo pedido.
                      </span>
                    </label>
                  </div>
                )}

                {/* Nombre y WhatsApp (Prellenado automático desde la cuenta) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-300 block mb-1 font-bold uppercase">
                      Tu Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Carlos Pérez"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#FFF01F] text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                        WhatsApp *
                      </label>
                      {currentUser?.telefono_whatsapp && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Auto-completado
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+58 412 1234567"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#FFF01F] text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Total y Botón de Continuar Compra */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">TOTAL A PAGAR:</span>
                    <span className="text-xl font-black text-[#FFF01F] font-mono">
                      {getPrecioMostrado()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={checkingDuplicate || (isDuplicate && !overrideDuplicate)}
                    className="px-6 py-3 rounded-full font-bold bg-gradient-to-r from-[#D61A1A] to-[#FFF01F] hover:brightness-110 text-[#0B0D13] shadow-lg transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <span>Continuar Compra</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* PASO 2: DATOS DE PAGO MANUAL, COPIA Y SUBIDA DE VOUCHER */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                {/* Barra de Navegación Atrás */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setCurrentStep(1);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition font-mono"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver / Modificar datos</span>
                  </button>
                  <span className="text-xs font-mono text-[#FFF01F] font-bold">
                    Moneda: {moneda}
                  </span>
                </div>

                {/* Selección de Método de Pago si hay varios para la moneda */}
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1.5 font-bold uppercase">
                    Selecciona el método de pago ({paymentMethods.length}):
                  </label>

                  {loadingMethods ? (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF01F]" />
                      <span>Cargando datos de pago...</span>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                      No hay métodos de pago activos configurados para {moneda}. Comunícate por soporte para recibir las coordenadas de pago.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentMethods.map((m) => {
                        const isSelected = selectedMethod?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMethod(m)}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                              isSelected
                                ? "bg-[#D61A1A]/40 border-[#FFF01F] text-white ring-1 ring-[#FFF01F]"
                                : "bg-black/60 border-white/10 text-slate-300 hover:border-white/30"
                            }`}
                          >
                            <div className="min-w-0 pr-1">
                              <span className="font-bold text-xs block truncate">{m.nombre_metodo}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {m.banco || m.tipo_cuenta || m.moneda}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#FFF01F] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tarjeta con Detalles Bancarios / Coordenadas para Copiar */}
                {selectedMethod && (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-white/10 to-black/60 border border-white/15 space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#FFF01F]" />
                        <span className="font-bold text-xs text-white">
                          {selectedMethod.nombre_metodo}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {selectedMethod.tipo_cuenta || selectedMethod.moneda}
                      </span>
                    </div>

                    {/* Campos dinámicos personalizados */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {getCamposToRender(selectedMethod).map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-black/50 px-3.5 py-2.5 rounded-xl border border-white/10 gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
                              {c.etiqueta}:
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm font-mono break-all select-all block mt-0.5">
                              {c.valor}
                            </span>
                          </div>
                          {c.copiable !== false && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(c.valor, `campo_${idx}`)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0 flex items-center gap-1.5 text-xs font-mono"
                              title={`Copiar ${c.etiqueta}`}
                            >
                              {copiedField === `campo_${idx}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                                  <span className="text-[10px] text-slate-300 hidden sm:inline">Copiar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botón universal COPIAR TODO */}
                    <button
                      type="button"
                      onClick={() => {
                        const campos = getCamposToRender(selectedMethod);
                        const fullText = campos.map(c => `${c.etiqueta}: ${c.valor}`).join("\n");
                        copyToClipboard(fullText, "copiar_todo");
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-yellow-500/40 text-[#FFF01F] text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {copiedField === "copiar_todo" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">¡Todos los Datos Copiados!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#FFF01F]" />
                          <span>📋 Copiar Todo</span>
                        </>
                      )}
                    </button>

                    {/* QR si está configurado */}
                    {selectedMethod.qr_imagen_url && (
                      <div className="pt-2 flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10">
                        <img 
                          src={selectedMethod.qr_imagen_url} 
                          alt="QR Pago" 
                          className="w-16 h-16 rounded-lg object-contain bg-white p-1 border border-white/20 shrink-0" 
                        />
                        <div className="text-[11px] text-slate-300 space-y-0.5">
                          <span className="font-bold text-[#FFF01F] flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5" />
                            Código QR Disponible
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Escanea desde tu app bancaria o Binance para pagar al instante.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMethod.instrucciones && (
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                        <span className="font-bold text-amber-300 block mb-0.5">Nota:</span>
                        {selectedMethod.instrucciones}
                      </div>
                    )}
                  </div>
                )}

                {/* Subir Comprobante de Pago y Número de Referencia */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-300 block mb-1 font-bold uppercase">
                      Número de Referencia / Comprobante
                    </label>
                    <input
                      type="text"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      placeholder="Ej: 489201 o ID de transacción Binance"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#FFF01F] text-xs text-white font-mono outline-none"
                    />
                  </div>

                  <ImageUploadInput
                    label="Subir Captura / Comprobante de Pago"
                    value={comprobanteUrl}
                    onChange={(url) => setComprobanteUrl(url)}
                    placeholder="https://... o sube captura"
                    helperText="Sube la captura de tu comprobante desde tu dispositivo o pega un enlace"
                  />
                </div>

                {/* Notificación de Alerta al Teléfono */}
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-xs">
                  <span className="text-base shrink-0">🔔</span>
                  <div className="text-[11px] text-slate-300 leading-tight">
                    <span className="font-bold text-white block">Aviso automático de entrega:</span>
                    Recibirás una notificación en este teléfono tan pronto como tu orden sea completada.
                  </div>
                </div>

                {/* Total Final y Botón de Confirmar Compra */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">MONTO TRANSFERIDO:</span>
                    <span className="text-xl font-black text-[#FFF01F] font-mono">
                      {getPrecioMostrado()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (paymentMethods.length > 0 && !selectedMethod)}
                    className="px-6 py-3 rounded-full font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black shadow-lg transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>Confirmar Compra</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
