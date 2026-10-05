"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Flame, 
  DollarSign, 
  Users, 
  Package, 
  Eye, 
  EyeOff,
  Trash2, 
  Plus, 
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  ShoppingBag,
  ExternalLink,
  FolderPlus,
  RefreshCw,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Calendar,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Percent,
  ArrowUpDown,
  Info,
  Clock,
  Search,
  Filter,
  Layers,
  Grid,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Pencil,
  Settings2,
  CreditCard,
  QrCode,
  FileText
} from "lucide-react";
import ImageUploadInput from "@/components/ImageUploadInput";

interface Category {
  id: string;
  nombre: string;
  slug: string;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
}

interface Subcategory {
  id: string;
  categoria_id: string;
  nombre: string;
  slug: string;
  imagen_url: string | null;
  activo: boolean;
  orden?: number;
  categoria_nombre?: string;
}

interface ProductVariant {
  id: string;
  producto_id: string;
  nombre: string;
  sku?: string | null;
  costo_proveedor: number;
  precio_base: number;
  activo: boolean;
  imagen_url?: string | null;
  orden: number;
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
  costo_proveedor: number;
  activo: boolean;
  oferta_especial: boolean;
  subcategoria_id: string;
  categoria_id?: string;
  categoria_nombre?: string;
  subcategoria_nombre?: string;
  precio_ref_ves?: number | null;
  precio_fijo_ves?: number | null;
  precio_ref_mxn?: number | null;
  precio_fijo_mxn?: number | null;
}

interface PriceOverride {
  id?: string;
  producto_id?: string | null;
  variante_id?: string | null;
  rango: string;
  precio_fijo: number;
}

interface RankRule {
  id: string;
  rango: string;
  porcentaje_ganancia: number;
  descripcion: string;
}

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string | null;
  nickname: string;
  email: string;
  telefono_whatsapp: string | null;
  rango: string;
  auth_provider: string;
  fecha_registro: string;
}

interface AdminOrder {
  id: string;
  pedido_estado: string;
  total_usd: number;
  total_ves: number | null;
  total_mxn: number | null;
  moneda_pago: string;
  tasa_cambio: number | null;
  es_override_duplicado: boolean;
  creado_en: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_whatsapp: string | null;
  usuario_nickname: string;
  usuario_rango: string;
  item_id: string;
  player_id: string | null;
  region: string | null;
  comentario_cliente: string | null;
  item_estado: string;
  precio_unitario: number;
  costo_proveedor: number;
  producto_nombre: string;
  producto_id: string;
  metodo_pago_id?: string | null;
  metodo_pago_nombre?: string | null;
  comprobante_url?: string | null;
  referencia_pago?: string | null;
}

interface PaymentFieldItem {
  id?: string;
  etiqueta: string;
  valor: string;
  copiable?: boolean;
}

interface PaymentMethod {
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
  orden: number;
  creado_en?: string;
  actualizado_en?: string;
}


interface VaultItem {
  id: string;
  producto_id: string;
  producto_nombre: string;
  precio_usd: number;
  variante_id: string | null;
  identificador_publico: string;
  instruccion_entrega: string;
  tipo_entrega: "RAPIDA" | "RESERVA_FECHA";
  fecha_reserva: string | null;
  fecha_vencimiento: string | null;
  estado: "DISPONIBLE" | "RESERVADO" | "POR_CADUCAR" | "OFERTA_ESPECIAL" | "ASIGNADO" | "CADUCADO";
  asignado_a_pedido_item_id: string | null;
  creado_en: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"pedidos" | "catalogo" | "pagos" | "finanzas" | "usuarios" | "tasas" | "boveda">("pedidos");

  // Control de Acceso Exclusivo para Administradores
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Estados de Métodos de Pago Manuales
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodsCurrencyFilter, setPaymentMethodsCurrencyFilter] = useState<"ALL" | "USD" | "VES" | "MXN">("ALL");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

  // Formulario de Método de Pago
  const [pmMoneda, setPmMoneda] = useState<"USD" | "VES" | "MXN">("VES");
  const [pmNombreMetodo, setPmNombreMetodo] = useState("");
  const [pmBanco, setPmBanco] = useState("");
  const [pmTitular, setPmTitular] = useState("");
  const [pmIdentificacion, setPmIdentificacion] = useState("");
  const [pmDatosCuenta, setPmDatosCuenta] = useState("");
  const [pmTipoCuenta, setPmTipoCuenta] = useState("");
  const [pmInstrucciones, setPmInstrucciones] = useState("");
  const [pmQrImagenUrl, setPmQrImagenUrl] = useState("");
  const [pmActivo, setPmActivo] = useState(true);
  const [pmOrden, setPmOrden] = useState(0);
  const [pmCampos, setPmCampos] = useState<PaymentFieldItem[]>([
    { id: "1", etiqueta: "Banco", valor: "Bancamiga (0172)", copiable: true },
    { id: "2", etiqueta: "Número / Teléfono", valor: "04248901572", copiable: true },
    { id: "3", etiqueta: "Cédula (CI)", valor: "V-28.583.383", copiable: true },
    { id: "4", etiqueta: "Titular", valor: "Carlos J. La Rosa G.", copiable: true },
  ]);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [previewVoucherUrl, setPreviewVoucherUrl] = useState<string | null>(null);

  // Multidivisa P2P Switch state (Módulo 3)
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [intervaloMinutos, setIntervaloMinutos] = useState(15);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [tasaVes, setTasaVes] = useState("0.00");
  const [tasaMxn, setTasaMxn] = useState("0.00");
  const [tasaFecha, setTasaFecha] = useState<string | null>(null);
  const [syncingTasas, setSyncingTasas] = useState(false);
  const [savingTasas, setSavingTasas] = useState(false);

  // Filtros del Algoritmo P2P - Venezuela (VES)
  const [filtroMontoVes, setFiltroMontoVes] = useState("1000");
  const [metodoPagoVes, setMetodoPagoVes] = useState("ALL");
  const [cantOfertasVes, setCantOfertasVes] = useState(10);
  const [margenSpreadVes, setMargenSpreadVes] = useState("0.0");
  const [tipoOperacionVes, setTipoOperacionVes] = useState("BUY");
  const [soloVerificadosVes, setSoloVerificadosVes] = useState(true);
  const [tiempoPagoVes, setTiempoPagoVes] = useState(0); // 0 = Todo, 15, 30, 45, 60, 120, 180
  const [paisVes, setPaisVes] = useState("ALL");
  const [soloTradingVes, setSoloTradingVes] = useState(true);
  const [soloProVes, setSoloProVes] = useState(false);
  const [sinVerifVes, setSinVerifVes] = useState(false);

  // Filtros del Algoritmo P2P - México (MXN)
  const [filtroMontoMxn, setFiltroMontoMxn] = useState("200");
  const [metodoPagoMxn, setMetodoPagoMxn] = useState("ALL");
  const [cantOfertasMxn, setCantOfertasMxn] = useState(10);
  const [margenSpreadMxn, setMargenSpreadMxn] = useState("0.0");
  const [tipoOperacionMxn, setTipoOperacionMxn] = useState("BUY");
  const [soloVerificadosMxn, setSoloVerificadosMxn] = useState(true);
  const [tiempoPagoMxn, setTiempoPagoMxn] = useState(0);
  const [paisMxn, setPaisMxn] = useState("ALL");
  const [soloTradingMxn, setSoloTradingMxn] = useState(true);
  const [soloProMxn, setSoloProMxn] = useState(false);
  const [sinVerifMxn, setSinVerifMxn] = useState(false);

  const [savingP2PConfig, setSavingP2PConfig] = useState(false);
  const [p2pOfferSamples, setP2POfferSamples] = useState<{
    ves: Array<{ nick: string; price: number; minAmount: string; maxAmount: string; paymentMethods?: string[]; isMerchant?: boolean; isPro?: boolean; payTimeLimit?: number }>;
    mxn: Array<{ nick: string; price: number; minAmount: string; maxAmount: string; paymentMethods?: string[]; isMerchant?: boolean; isPro?: boolean; payTimeLimit?: number }>;
  } | null>(null);

  // Simulación "Ver como..." (Módulo 6.1)
  const [viewAsRole, setViewAsRole] = useState("admin");

  // Estado del catálogo dinámico
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Estado de usuarios registrados
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estado de pedidos / despachos
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Bóveda de Inventario Seguro (Módulo 8)
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [vaultProdId, setVaultProdId] = useState("");
  const [vaultIdentificador, setVaultIdentificador] = useState("");
  const [vaultInstruccion, setVaultInstruccion] = useState("");
  const [vaultSecret, setVaultSecret] = useState("");
  const [vaultTipoEntrega, setVaultTipoEntrega] = useState<"RAPIDA" | "RESERVA_FECHA">("RAPIDA");
  const [vaultFechaReserva, setVaultFechaReserva] = useState("");
  const [vaultFechaVencimiento, setVaultFechaVencimiento] = useState("");

  // Estados de Subcategorías y Variantes/Subproductos
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Búsqueda y filtrado del catálogo
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogFilterCategory, setCatalogFilterCategory] = useState("all");
  const [catalogFilterSubcategory, setCatalogFilterSubcategory] = useState("all");
  const [catalogFilterStatus, setCatalogFilterStatus] = useState<"all" | "visible" | "hidden" | "offer">("all");

  // Modal Unificado de Catálogo (Fases: Categoría + Subcategoría + Producto + Subproductos)
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [unifiedMode, setUnifiedMode] = useState<"existing_cat" | "new_cat">("existing_cat");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState("");

  const [unifiedSubcatMode, setUnifiedSubcatMode] = useState<"existing_subcat" | "new_subcat">("existing_subcat");
  const [selectedSubcatId, setSelectedSubcatId] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [newSubcatImage, setNewSubcatImage] = useState("");

  const [unifiedProdName, setUnifiedProdName] = useState("");
  const [unifiedProdDesc, setUnifiedProdDesc] = useState("");
  const [unifiedProdPrice, setUnifiedProdPrice] = useState("");
  const [unifiedProdCost, setUnifiedProdCost] = useState("");
  const [unifiedProdImage, setUnifiedProdImage] = useState("");
  const [unifiedProdActive, setUnifiedProdActive] = useState(true);
  const [unifiedProdSpecial, setUnifiedProdSpecial] = useState(false);
  const [unifiedSpecialImageType, setUnifiedSpecialImageType] = useState<"default" | "exclusive">("default");
  const [unifiedSpecialImage, setUnifiedSpecialImage] = useState("");

  // Modal para configurar imagen/banner exclusivo de Oferta Especial en productos existentes
  const [showPromoImageModal, setShowPromoImageModal] = useState(false);
  const [targetProductForPromo, setTargetProductForPromo] = useState<Product | null>(null);
  const [promoChoice, setPromoChoice] = useState<"default" | "exclusive">("default");
  const [exclusivePromoImageUrl, setExclusivePromoImageUrl] = useState("");
  const [savingPromoImage, setSavingPromoImage] = useState(false);

  // Subproductos desglosables en el creador unificado
  const [subproductsList, setSubproductsList] = useState<Array<{
    id: string;
    nombre: string;
    precio_base: string;
    costo_proveedor: string;
    imagen_url: string;
  }>>([]);

  // Configuración de Precios por Rango y Overrides
  const [overrides, setOverrides] = useState<PriceOverride[]>([]);
  const [rankRules, setRankRules] = useState<RankRule[]>([]);

  // Configuración Avanzada de Divisas y Rangos en el Creador Unificado
  const [showUnifiedAdvancedPricing, setShowUnifiedAdvancedPricing] = useState(false);
  const [unifiedVesMode, setUnifiedVesMode] = useState<"auto" | "ref" | "fixed">("auto");
  const [unifiedRefVes, setUnifiedRefVes] = useState("");
  const [unifiedFijoVes, setUnifiedFijoVes] = useState("");
  const [unifiedMxnMode, setUnifiedMxnMode] = useState<"auto" | "fixed" | "ref">("auto");
  const [unifiedFijoMxn, setUnifiedFijoMxn] = useState("");
  const [unifiedRefMxn, setUnifiedRefMxn] = useState("");
  const [unifiedRankPricingMode, setUnifiedRankPricingMode] = useState<"auto" | "manual">("auto");
  const [unifiedRankPrices, setUnifiedRankPrices] = useState<Record<string, string>>({});

  // Modal para Editar Producto Completo
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdDesc, setEditProdDesc] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdCost, setEditProdCost] = useState("");
  const [editProdImage, setEditProdImage] = useState("");
  const [editProdActive, setEditProdActive] = useState(true);
  const [editProdSpecial, setEditProdSpecial] = useState(false);
  const [editSpecialImageType, setEditSpecialImageType] = useState<"default" | "exclusive">("default");
  const [editSpecialImage, setEditSpecialImage] = useState("");
  const [editSubcatId, setEditSubcatId] = useState("");
  const [editVesMode, setEditVesMode] = useState<"auto" | "ref" | "fixed">("auto");
  const [editRefVes, setEditRefVes] = useState("");
  const [editFijoVes, setEditFijoVes] = useState("");
  const [editMxnMode, setEditMxnMode] = useState<"auto" | "fixed" | "ref">("auto");
  const [editFijoMxn, setEditFijoMxn] = useState("");
  const [editRefMxn, setEditRefMxn] = useState("");
  const [editRankPricingMode, setEditRankPricingMode] = useState<"auto" | "manual">("auto");
  const [editRankPrices, setEditRankPrices] = useState<Record<string, string>>({});
  const [savingEditProduct, setSavingEditProduct] = useState(false);

  // Modal para Editar Subproducto / Variante
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editingVariantParentProd, setEditingVariantParentProd] = useState<Product | null>(null);
  const [editVarName, setEditVarName] = useState("");
  const [editVarPrice, setEditVarPrice] = useState("");
  const [editVarCost, setEditVarCost] = useState("");
  const [editVarImage, setEditVarImage] = useState("");
  const [editVarActive, setEditVarActive] = useState(true);
  const [editVarVesMode, setEditVarVesMode] = useState<"auto" | "ref" | "fixed">("auto");
  const [editVarRefVes, setEditVarRefVes] = useState("");
  const [editVarFijoVes, setEditVarFijoVes] = useState("");
  const [editVarMxnMode, setEditVarMxnMode] = useState<"auto" | "fixed" | "ref">("auto");
  const [editVarFijoMxn, setEditVarFijoMxn] = useState("");
  const [editVarRefMxn, setEditVarRefMxn] = useState("");
  const [editVarRankPricingMode, setEditVarRankPricingMode] = useState<"auto" | "manual">("auto");
  const [editVarRankPrices, setEditVarRankPrices] = useState<Record<string, string>>({});
  const [savingEditVariant, setSavingEditVariant] = useState(false);

  // Modal rápido para añadir subproducto a un producto existente
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [targetProductForVariant, setTargetProductForVariant] = useState<Product | null>(null);
  const [varName, setVarName] = useState("");
  const [varPrice, setVarPrice] = useState("");
  const [varCost, setVarCost] = useState("");
  const [varImage, setVarImage] = useState("");

  // Formularios de creación simples auxiliares
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catActive, setCatActive] = useState(true);

  const [prodName, setProdName] = useState("");
  const [prodCatId, setProdCatId] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCost, setProdCost] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodActive, setProdActive] = useState(true);
  const [prodSpecialOffer, setProdSpecialOffer] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cargar catálogo completo desde la base de datos
  const fetchCatalogData = async () => {
    try {
      setLoadingCatalog(true);
      const res = await fetch("/api/admin/catalog");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
        setProducts(data.products || []);
        setVariants(data.variants || []);
        if (data.overrides) setOverrides(data.overrides || []);
        if (data.rankRules) setRankRules(data.rankRules || []);
        if (data.categories?.length > 0 && !selectedCatId) {
          setSelectedCatId(data.categories[0].id);
        }
        if (data.categories?.length > 0 && !prodCatId) {
          setProdCatId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos del catálogo:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rango: newRole }),
      });
      if (res.ok) {
        showNotification("success", `Rango actualizado con éxito a "${newRole}".`);
        fetchUsers();
      } else {
        showNotification("error", "No se pudo actualizar el rango.");
      }
    } catch (err) {
      showNotification("error", "Error de red al actualizar rango.");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          estado_item: newStatus,
          estado_pedido: newStatus === "ENTREGADO" ? "COMPLETADO" : newStatus === "FALLIDO" ? "CANCELADO" : "PROCESANDO",
        }),
      });
      if (res.ok) {
        showNotification("success", `Pedido actualizado a "${newStatus}".`);
        fetchOrders();
      } else {
        showNotification("error", "Error al actualizar estado.");
      }
    } catch {
      showNotification("error", "Error de red al actualizar pedido.");
    }
  };

  const getWhatsAppNotifyLink = (order: AdminOrder) => {
    const rawPhone = order.usuario_whatsapp?.replace(/[^0-9]/g, "") || "";
    const text = encodeURIComponent(
      `¡Hola ${order.usuario_nombre}! 👋 Tu recarga de *${order.producto_nombre}* para el Player ID *${order.player_id || "N/A"}* ha sido marcada como *${order.item_estado}* en Soul Store. ¡Gracias por confiar en nosotros!`
    );
    return `https://wa.me/${rawPhone}?text=${text}`;
  };

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/rates");
      const data = await res.json();
      if (res.ok) {
        setModoAutomatico(data.modo_automatico);
        setTasaVes(String(data.tasa_ves));
        setTasaMxn(String(data.tasa_mxn));
        setTasaFecha(data.ultima_actualizacion);
        if (data.intervalo_minutos) setIntervaloMinutos(Number(data.intervalo_minutos));

        // VES (Venezuela)
        if (data.ves) {
          if (data.ves.filtro_monto) setFiltroMontoVes(String(data.ves.filtro_monto));
          if (data.ves.metodo_pago) setMetodoPagoVes(data.ves.metodo_pago);
          if (data.ves.cant_ofertas) setCantOfertasVes(Number(data.ves.cant_ofertas));
          if (data.ves.margen_spread !== undefined) setMargenSpreadVes(String(data.ves.margen_spread));
          if (data.ves.tipo_operacion) setTipoOperacionVes(data.ves.tipo_operacion);
          if (data.ves.solo_verificados !== undefined) setSoloVerificadosVes(Boolean(data.ves.solo_verificados));
          if (data.ves.tiempo_pago !== undefined) setTiempoPagoVes(Number(data.ves.tiempo_pago));
          if (data.ves.pais) setPaisVes(data.ves.pais);
          if (data.ves.solo_trading !== undefined) setSoloTradingVes(Boolean(data.ves.solo_trading));
          if (data.ves.solo_pro !== undefined) setSoloProVes(Boolean(data.ves.solo_pro));
          if (data.ves.sin_verif !== undefined) setSinVerifVes(Boolean(data.ves.sin_verif));
        }

        // MXN (México)
        if (data.mxn) {
          if (data.mxn.filtro_monto) setFiltroMontoMxn(String(data.mxn.filtro_monto));
          if (data.mxn.metodo_pago) setMetodoPagoMxn(data.mxn.metodo_pago);
          if (data.mxn.cant_ofertas) setCantOfertasMxn(Number(data.mxn.cant_ofertas));
          if (data.mxn.margen_spread !== undefined) setMargenSpreadMxn(String(data.mxn.margen_spread));
          if (data.mxn.tipo_operacion) setTipoOperacionMxn(data.mxn.tipo_operacion);
          if (data.mxn.solo_verificados !== undefined) setSoloVerificadosMxn(Boolean(data.mxn.solo_verificados));
          if (data.mxn.tiempo_pago !== undefined) setTiempoPagoMxn(Number(data.mxn.tiempo_pago));
          if (data.mxn.pais) setPaisMxn(data.mxn.pais);
          if (data.mxn.solo_trading !== undefined) setSoloTradingMxn(Boolean(data.mxn.solo_trading));
          if (data.mxn.solo_pro !== undefined) setSoloProMxn(Boolean(data.mxn.solo_pro));
          if (data.mxn.sin_verif !== undefined) setSinVerifMxn(Boolean(data.mxn.sin_verif));
        }
      }
    } catch (err) {
      console.error("Error al cargar tasas:", err);
    }
  };

  // Timer para cuenta regresiva y sincronización automática periódica
  useEffect(() => {
    if (!modoAutomatico || !intervaloMinutos || intervaloMinutos <= 0) {
      setCountdownSeconds(null);
      return;
    }

    const intervalSeconds = intervaloMinutos * 60;

    const tick = () => {
      if (!tasaFecha) {
        setCountdownSeconds(intervalSeconds);
        return;
      }
      const last = new Date(tasaFecha).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - last) / 1000);
      const remaining = Math.max(0, intervalSeconds - elapsed);
      setCountdownSeconds(remaining);

      // Si llegó a cero y no estamos sincronizando ya, ejecutar sincronización automática
      if (remaining <= 0 && !syncingTasas) {
        handleSyncP2P(true);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [
    modoAutomatico, 
    intervaloMinutos, 
    tasaFecha, 
    syncingTasas, 
    filtroMontoVes, 
    metodoPagoVes, 
    cantOfertasVes, 
    margenSpreadVes, 
    tipoOperacionVes, 
    soloVerificadosVes, 
    tiempoPagoVes,
    paisVes,
    soloTradingVes,
    soloProVes,
    sinVerifVes,
    filtroMontoMxn, 
    metodoPagoMxn, 
    cantOfertasMxn, 
    margenSpreadMxn, 
    tipoOperacionMxn, 
    soloVerificadosMxn,
    tiempoPagoMxn,
    paisMxn,
    soloTradingMxn,
    soloProMxn,
    sinVerifMxn
  ]);

  const handleToggleModo = async () => {
    const nextModo = !modoAutomatico;
    setModoAutomatico(nextModo);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo_automatico: nextModo }),
      });
      if (res.ok) {
        showNotification("success", nextModo ? "Modo automático activado (Bot Binance P2P)." : "Suiche activado: Modo manual activo.");
      }
    } catch (err) {
      showNotification("error", "Error al actualizar modo de tasas");
    }
  };

  const handleSyncP2P = async (isBackground = false) => {
    if (!isBackground) setSyncingTasas(true);
    try {
      const res = await fetch("/api/cron/p2p?force=true", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervalo_minutos: Number(intervaloMinutos) || 15,
          // VES
          filtro_monto_ves: parseFloat(filtroMontoVes) || 1000,
          metodo_pago_ves: metodoPagoVes,
          cant_ofertas_ves: parseInt(String(cantOfertasVes)) || 10,
          margen_spread_ves: parseFloat(margenSpreadVes) || 0,
          tipo_operacion_ves: tipoOperacionVes,
          solo_verificados_ves: soloVerificadosVes,
          tiempo_pago_ves: Number(tiempoPagoVes) || 0,
          pais_ves: paisVes,
          solo_trading_ves: soloTradingVes,
          solo_pro_ves: soloProVes,
          sin_verif_ves: sinVerifVes,
          // MXN
          filtro_monto_mxn: parseFloat(filtroMontoMxn) || 200,
          metodo_pago_mxn: metodoPagoMxn,
          cant_ofertas_mxn: parseInt(String(cantOfertasMxn)) || 10,
          margen_spread_mxn: parseFloat(margenSpreadMxn) || 0,
          tipo_operacion_mxn: tipoOperacionMxn,
          solo_verificados_mxn: soloVerificadosMxn,
          tiempo_pago_mxn: Number(tiempoPagoMxn) || 0,
          pais_mxn: paisMxn,
          solo_trading_mxn: soloTradingMxn,
          solo_pro_mxn: soloProMxn,
          sin_verif_mxn: sinVerifMxn,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasaVes(String(data.tasa_ves));
        setTasaMxn(String(data.tasa_mxn));
        setTasaFecha(data.timestamp || new Date().toISOString());
        if (data.muestras_ofertas) {
          setP2POfferSamples(data.muestras_ofertas);
        }
        if (!isBackground) {
          showNotification("success", `Tasas calculadas: VES ${data.tasa_ves} Bs. | MXN $${data.tasa_mxn} (Auto-sync cada ${data.intervalo_minutos} min)`);
        }
      } else {
        if (!isBackground) showNotification("error", data.message || "Error al sincronizar con Binance P2P");
      }
    } catch (err) {
      if (!isBackground) showNotification("error", "Error de red al consultar Binance P2P");
    } finally {
      if (!isBackground) setSyncingTasas(false);
    }
  };

  const handleSaveP2PConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingP2PConfig(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervalo_minutos: Number(intervaloMinutos) || 15,
          // VES
          filtro_monto_ves: parseFloat(filtroMontoVes) || 1000,
          metodo_pago_ves: metodoPagoVes,
          cant_ofertas_ves: parseInt(String(cantOfertasVes)) || 10,
          margen_spread_ves: parseFloat(margenSpreadVes) || 0,
          tipo_operacion_ves: tipoOperacionVes,
          solo_verificados_ves: soloVerificadosVes,
          tiempo_pago_ves: Number(tiempoPagoVes) || 0,
          pais_ves: paisVes,
          solo_trading_ves: soloTradingVes,
          solo_pro_ves: soloProVes,
          sin_verif_ves: sinVerifVes,
          // MXN
          filtro_monto_mxn: parseFloat(filtroMontoMxn) || 200,
          metodo_pago_mxn: metodoPagoMxn,
          cant_ofertas_mxn: parseInt(String(cantOfertasMxn)) || 10,
          margen_spread_mxn: parseFloat(margenSpreadMxn) || 0,
          tipo_operacion_mxn: tipoOperacionMxn,
          solo_verificados_mxn: soloVerificadosMxn,
          tiempo_pago_mxn: Number(tiempoPagoMxn) || 0,
          pais_mxn: paisMxn,
          solo_trading_mxn: soloTradingMxn,
          solo_pro_mxn: soloProMxn,
          sin_verif_mxn: sinVerifMxn,
        }),
      });

      if (res.ok) {
        showNotification("success", "Configuración de algoritmos y periodicidad guardada exitosamente.");
        fetchRates();
      } else {
        showNotification("error", "Error al guardar parámetros del algoritmo");
      }
    } catch (err) {
      showNotification("error", "Error de red al guardar filtros");
    } finally {
      setSavingP2PConfig(false);
    }
  };

  const handleSaveManualRates = async () => {
    setSavingTasas(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasa_ves: parseFloat(tasaVes),
          tasa_mxn: parseFloat(tasaMxn),
          modo_automatico: false,
        }),
      });
      if (res.ok) {
        setModoAutomatico(false);
        showNotification("success", "Tasas manuales guardadas exitosamente.");
        fetchRates();
      } else {
        showNotification("error", "Error al guardar tasas manuales");
      }
    } catch (err) {
      showNotification("error", "Error de red al guardar tasas");
    } finally {
      setSavingTasas(false);
    }
  };

  const fetchVaultItems = async () => {
    try {
      setLoadingVault(true);
      const res = await fetch("/api/admin/vault");
      const data = await res.json();
      if (res.ok) setVaultItems(data.vault || []);
    } catch (err) {
      console.error("Error al cargar bóveda:", err);
    } finally {
      setLoadingVault(false);
    }
  };

  const handleCreateVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultProdId || !vaultIdentificador.trim() || !vaultInstruccion.trim() || !vaultSecret.trim()) {
      showNotification("error", "Por favor completa todos los campos requeridos de la bóveda.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: vaultProdId,
          identificador_publico: vaultIdentificador.trim(),
          instruccion_entrega: vaultInstruccion.trim(),
          datos_sensibles: vaultSecret.trim(),
          tipo_entrega: vaultTipoEntrega,
          fecha_reserva: vaultTipoEntrega === "RESERVA_FECHA" && vaultFechaReserva ? new Date(vaultFechaReserva).toISOString() : null,
          fecha_vencimiento: vaultFechaVencimiento ? new Date(vaultFechaVencimiento).toISOString() : null,
        }),
      });

      if (res.ok) {
        showNotification("success", "Ítem encriptado y guardado en la bóveda.");
        setShowVaultModal(false);
        setVaultIdentificador("");
        setVaultInstruccion("");
        setVaultSecret("");
        setVaultFechaReserva("");
        setVaultFechaVencimiento("");
        fetchVaultItems();
      } else {
        const err = await res.json();
        showNotification("error", err.error || "Error al registrar en bóveda");
      }
    } catch (err) {
      showNotification("error", "Error de red al guardar en bóveda");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealSecret = async (itemId: string) => {
    if (revealedSecrets[itemId]) {
      setRevealedSecrets(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      return;
    }

    try {
      const res = await fetch(`/api/admin/vault/${itemId}`);
      const data = await res.json();
      if (res.ok && data.item) {
        setRevealedSecrets(prev => ({
          ...prev,
          [itemId]: data.item.credenciales_desencriptadas,
        }));
      } else {
        showNotification("error", "No se pudieron desencriptar las credenciales.");
      }
    } catch (err) {
      showNotification("error", "Error de red al desencriptar.");
    }
  };

  const handleDeleteVaultItem = async (item: VaultItem) => {
    if (!confirm(`¿Eliminar definitivamente "${item.identificador_publico}" de la bóveda?`)) return;

    try {
      const res = await fetch(`/api/admin/vault/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setVaultItems(prev => prev.filter(i => i.id !== item.id));
        showNotification("success", "Ítem eliminado de la bóveda.");
      } else {
        showNotification("error", "No se pudo eliminar el ítem.");
      }
    } catch (err) {
      showNotification("error", "Error de red al eliminar.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Cargar métodos de pago
  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const res = await fetch("/api/admin/payment-methods");
      const data = await res.json();
      if (res.ok && data.metodos) {
        setPaymentMethods(data.metodos);
      }
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleOpenCreatePaymentModal = () => {
    setEditingPaymentMethod(null);
    setPmMoneda("VES");
    setPmNombreMetodo("");
    setPmBanco("");
    setPmTitular("");
    setPmIdentificacion("");
    setPmDatosCuenta("");
    setPmTipoCuenta("");
    setPmInstrucciones("");
    setPmQrImagenUrl("");
    setPmActivo(true);
    setPmOrden(0);
    setPmCampos([
      { id: "1", etiqueta: "Banco", valor: "Bancamiga (0172)", copiable: true },
      { id: "2", etiqueta: "Número / Teléfono", valor: "04248901572", copiable: true },
      { id: "3", etiqueta: "Cédula (CI)", valor: "V-28.583.383", copiable: true },
      { id: "4", etiqueta: "Titular", valor: "Carlos J. La Rosa G.", copiable: true },
    ]);
    setShowPaymentModal(true);
  };

  const handleOpenEditPaymentModal = (pm: PaymentMethod) => {
    setEditingPaymentMethod(pm);
    setPmMoneda(pm.moneda);
    setPmNombreMetodo(pm.nombre_metodo);
    setPmBanco(pm.banco || "");
    setPmTitular(pm.titular || "");
    setPmIdentificacion(pm.identificacion || "");
    setPmDatosCuenta(pm.datos_cuenta || "");
    setPmTipoCuenta(pm.tipo_cuenta || "");
    setPmInstrucciones(pm.instrucciones || "");
    setPmQrImagenUrl(pm.qr_imagen_url || "");
    setPmActivo(pm.activo);
    setPmOrden(pm.orden || 0);

    if (pm.campos && Array.isArray(pm.campos) && pm.campos.length > 0) {
      setPmCampos(
        pm.campos.map((c, idx) => ({
          id: c.id || String(idx + 1),
          etiqueta: c.etiqueta || "",
          valor: c.valor || "",
          copiable: c.copiable !== false,
        }))
      );
    } else {
      // Reconstruir campos desde los datos existentes si campos estaba vacío
      const parsed: PaymentFieldItem[] = [];
      if (pm.banco) parsed.push({ id: "1", etiqueta: "Banco", valor: pm.banco, copiable: true });
      if (pm.datos_cuenta) parsed.push({ id: "2", etiqueta: "Datos de Cuenta / Teléfono", valor: pm.datos_cuenta, copiable: true });
      if (pm.identificacion) parsed.push({ id: "3", etiqueta: "Cédula (CI) / Doc", valor: pm.identificacion, copiable: true });
      if (pm.titular) parsed.push({ id: "4", etiqueta: "Titular", valor: pm.titular, copiable: true });
      if (parsed.length === 0) {
        parsed.push({ id: "1", etiqueta: "Datos de Pago", valor: "", copiable: true });
      }
      setPmCampos(parsed);
    }
    setShowPaymentModal(true);
  };

  const handleApplyPaymentPreset = (tipo: "pago_movil" | "binance" | "transferencia" | "spei") => {
    if (tipo === "pago_movil") {
      setPmMoneda("VES");
      if (!pmNombreMetodo.trim()) setPmNombreMetodo("Pago Móvil - Bancamiga");
      setPmCampos([
        { id: "1", etiqueta: "Banco", valor: "Bancamiga (0172)", copiable: true },
        { id: "2", etiqueta: "Número / Teléfono", valor: "04248901572", copiable: true },
        { id: "3", etiqueta: "Cédula (CI)", valor: "V-28.583.383", copiable: true },
        { id: "4", etiqueta: "Titular", valor: "Carlos J. La Rosa G.", copiable: true },
      ]);
    } else if (tipo === "binance") {
      setPmMoneda("USD");
      if (!pmNombreMetodo.trim()) setPmNombreMetodo("Binance Pay USDT");
      setPmCampos([
        { id: "1", etiqueta: "Binance Pay ID", valor: "", copiable: true },
        { id: "2", etiqueta: "Correo Binance", valor: "", copiable: true },
        { id: "3", etiqueta: "Titular / Nickname", valor: "", copiable: true },
      ]);
    } else if (tipo === "transferencia") {
      setPmCampos([
        { id: "1", etiqueta: "Banco", valor: "Bancamiga (0172)", copiable: true },
        { id: "2", etiqueta: "Nº de Cuenta", valor: "", copiable: true },
        { id: "3", etiqueta: "Tipo de Cuenta", valor: "Corriente", copiable: false },
        { id: "4", etiqueta: "Titular", valor: "Carlos J. La Rosa G.", copiable: true },
        { id: "5", etiqueta: "Cédula / RIF", valor: "V-28.583.383", copiable: true },
      ]);
    } else if (tipo === "spei") {
      setPmMoneda("MXN");
      if (!pmNombreMetodo.trim()) setPmNombreMetodo("SPEI / Transferencia México");
      setPmCampos([
        { id: "1", etiqueta: "Banco / Institución", valor: "STP / Mercado Pago", copiable: true },
        { id: "2", etiqueta: "CLABE Interbancaria", valor: "", copiable: true },
        { id: "3", etiqueta: "Beneficiario / Titular", valor: "", copiable: true },
      ]);
    }
  };

  const handleAddPaymentCampo = () => {
    setPmCampos((prev) => [
      ...prev,
      { id: Date.now().toString(), etiqueta: "", valor: "", copiable: true },
    ]);
  };

  const handleUpdatePaymentCampo = (index: number, key: "etiqueta" | "valor" | "copiable", value: any) => {
    setPmCampos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleRemovePaymentCampo = (index: number) => {
    setPmCampos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmNombreMetodo.trim()) {
      showNotification("error", "El nombre del método de pago es obligatorio.");
      return;
    }

    // Filtrar campos que tengan contenido
    const validCampos = pmCampos.filter((c) => c.etiqueta.trim() || c.valor.trim());
    if (validCampos.length === 0) {
      showNotification("error", "Debes configurar al menos un campo de pago visible para los clientes.");
      return;
    }

    const bancoCampo = validCampos.find((c) => /banco|instituci[oó]n|plataforma/i.test(c.etiqueta));
    const titularCampo = validCampos.find((c) => /titular|beneficiario|nombre/i.test(c.etiqueta));
    const idCampo = validCampos.find((c) => /c[eé]dula|ci|rif|rfc|documento|id/i.test(c.etiqueta));
    const computedDatosCuenta = validCampos.map((c) => `${c.etiqueta}: ${c.valor}`).join(" | ");

    try {
      setSavingPaymentMethod(true);
      const payload = {
        moneda: pmMoneda,
        nombre_metodo: pmNombreMetodo.trim(),
        banco: pmBanco.trim() || bancoCampo?.valor || null,
        titular: pmTitular.trim() || titularCampo?.valor || null,
        identificacion: pmIdentificacion.trim() || idCampo?.valor || null,
        datos_cuenta: computedDatosCuenta,
        tipo_cuenta: pmTipoCuenta.trim() || null,
        instrucciones: pmInstrucciones.trim() || null,
        qr_imagen_url: pmQrImagenUrl.trim() || null,
        campos: validCampos,
        activo: pmActivo,
        orden: Number(pmOrden) || 0,
      };

      let res;
      if (editingPaymentMethod) {
        res = await fetch(`/api/admin/payment-methods/${editingPaymentMethod.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showNotification("success", editingPaymentMethod ? "Método de pago actualizado." : "Nuevo método de pago guardado.");
        setShowPaymentModal(false);
        fetchPaymentMethods();
      } else {
        const d = await res.json();
        showNotification("error", d.error || "Error al guardar método de pago.");
      }
    } catch {
      showNotification("error", "Error de red al guardar método de pago.");
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const handleTogglePaymentMethod = async (pm: PaymentMethod) => {
    try {
      const nextStatus = !pm.activo;
      const res = await fetch(`/api/admin/payment-methods/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nextStatus }),
      });
      if (res.ok) {
        setPaymentMethods(prev => prev.map(m => m.id === pm.id ? { ...m, activo: nextStatus } : m));
        showNotification("success", `Método ${nextStatus ? "activado" : "desactivado"}.`);
      }
    } catch {
      showNotification("error", "Error al cambiar estado del método.");
    }
  };

  const handleDeletePaymentMethod = async (pm: PaymentMethod) => {
    if (!confirm(`¿Eliminar método de pago "${pm.nombre_metodo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/payment-methods/${pm.id}`, { method: "DELETE" });
      if (res.ok) {
        setPaymentMethods(prev => prev.filter(m => m.id !== pm.id));
        showNotification("success", "Método de pago eliminado.");
      }
    } catch {
      showNotification("error", "Error al eliminar método de pago.");
    }
  };

  // Verificación de credenciales de admin al montar y carga de datos
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.rango === "admin") {
            setIsAuthorized(true);
            fetchCatalogData();
            fetchUsers();
            fetchOrders();
            fetchRates();
            fetchVaultItems();
            fetchPaymentMethods();
            return;
          }
        }
        setIsAuthorized(false);
      } catch (err) {
        setIsAuthorized(false);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAdmin();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Crear o actualizar categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setActionLoading(true);
      const isEditing = !!editingCategory;
      const url = isEditing
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: catName.trim(),
          imagen_url: catImageUrl.trim() || null,
          activo: catActive,
        }),
      });

      if (res.ok) {
        showNotification(
          "success",
          isEditing
            ? `Categoría "${catName}" actualizada con éxito.`
            : `Categoría "${catName}" creada en la base de datos.`
        );
        setCatName("");
        setCatImageUrl("");
        setEditingCategory(null);
        setShowCategoryModal(false);
        fetchCatalogData();
      } else {
        const error = await res.json();
        showNotification("error", error.error || "No se pudo guardar la categoría");
      }
    } catch (err) {
      showNotification("error", "Error de conexión al guardar categoría");
    } finally {
      setActionLoading(false);
    }
  };

  // Alternar visibilidad de categoría
  const handleToggleCategoryVisibility = async (category: Category) => {
    try {
      const newStatus = !category.activo;
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: newStatus }),
      });

      if (res.ok) {
        setCategories(categories.map((c) => (c.id === category.id ? { ...c, activo: newStatus } : c)));
        showNotification(
          "success",
          `Categoría "${category.nombre}" ahora está ${newStatus ? "VISIBLE" : "OCULTA"} en la tienda pública.`
        );
      }
    } catch (err) {
      showNotification("error", "Error al actualizar visibilidad");
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.nombre}" de la base de datos? Se borrarán sus productos.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== category.id));
        showNotification("success", `Categoría "${category.nombre}" eliminada de la base de datos.`);
        fetchCatalogData();
      }
    } catch (err) {
      showNotification("error", "Error al eliminar categoría");
    }
  };

  // Crear producto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCatId) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria_id: prodCatId,
          nombre: prodName.trim(),
          descripcion: prodDesc.trim() || null,
          precio_base: parseFloat(prodPrice) || 0,
          costo_proveedor: parseFloat(prodCost) || 0,
          imagen_url: prodImageUrl.trim() || null,
          activo: prodActive,
          oferta_especial: prodSpecialOffer,
        }),
      });

      if (res.ok) {
        showNotification("success", `Producto "${prodName}" creado en la base de datos.`);
        setProdName("");
        setProdPrice("");
        setProdCost("");
        setProdDesc("");
        setProdImageUrl("");
        setShowProductModal(false);
        fetchCatalogData();
      } else {
        const error = await res.json();
        showNotification("error", error.error || "No se pudo crear el producto");
      }
    } catch (err) {
      showNotification("error", "Error al conectar con la base de datos");
    } finally {
      setActionLoading(false);
    }
  };

  // Alternar visibilidad de producto
  const handleToggleProductVisibility = async (product: Product) => {
    try {
      const newStatus = !product.activo;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: newStatus }),
      });

      if (res.ok) {
        setProducts(products.map((p) => (p.id === product.id ? { ...p, activo: newStatus } : p)));
        showNotification(
          "success",
          `Producto "${product.nombre}" ahora está ${newStatus ? "VISIBLE" : "OCULTO"} en la tienda pública.`
        );
      }
    } catch (err) {
      showNotification("error", "Error al cambiar estado de producto");
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar producto "${product.nombre}" de la base de datos?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== product.id));
        showNotification("success", `Producto "${product.nombre}" eliminado definitivamente.`);
      }
    } catch (err) {
      showNotification("error", "Error al eliminar producto");
    }
  };

  // Alternar Oferta Especial (HOT) de un producto
  const handleToggleProductSpecial = async (product: Product) => {
    try {
      const nextSpecial = !product.oferta_especial;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oferta_especial: nextSpecial }),
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === product.id ? { ...p, oferta_especial: nextSpecial } : p));
        showNotification(
          "success",
          `Oferta Especial ${nextSpecial ? "ACTIVADA 🔥" : "DESACTIVADA"} para "${product.nombre}".`
        );
        // Si se acaba de activar, abrimos el modal para que el admin elija si quiere una imagen exclusiva o la predeterminada
        if (nextSpecial) {
          setTargetProductForPromo({ ...product, oferta_especial: true });
          setPromoChoice(product.imagen_oferta_url ? "exclusive" : "default");
          setExclusivePromoImageUrl(product.imagen_oferta_url || "");
          setShowPromoImageModal(true);
        }
      }
    } catch {
      showNotification("error", "Error al actualizar oferta especial.");
    }
  };

  // Guardar configuración de Banner / Imagen de Oferta Especial
  const handleSavePromoImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductForPromo) return;

    try {
      setSavingPromoImage(true);
      const finalPromoUrl = promoChoice === "exclusive" && exclusivePromoImageUrl.trim() ? exclusivePromoImageUrl.trim() : null;

      const res = await fetch(`/api/admin/products/${targetProductForPromo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oferta_especial: true,
          imagen_oferta_url: finalPromoUrl,
        }),
      });

      if (res.ok) {
        setProducts(prev =>
          prev.map(p =>
            p.id === targetProductForPromo.id
              ? { ...p, oferta_especial: true, imagen_oferta_url: finalPromoUrl }
              : p
          )
        );
        showNotification(
          "success",
          finalPromoUrl
            ? `Banner exclusivo asignado a "${targetProductForPromo.nombre}".`
            : `Se usará la imagen predeterminada de "${targetProductForPromo.nombre}" en Ofertas Especiales.`
        );
        setShowPromoImageModal(false);
      } else {
        const error = await res.json();
        showNotification("error", error.error || "No se pudo actualizar la imagen de oferta");
      }
    } catch {
      showNotification("error", "Error de red al actualizar la imagen de oferta");
    } finally {
      setSavingPromoImage(false);
    }
  };

  // Alternar visibilidad de subcategoría
  const handleToggleSubcategoryVisibility = async (subcat: Subcategory) => {
    try {
      const nextStatus = !subcat.activo;
      const res = await fetch(`/api/admin/subcategories/${subcat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nextStatus }),
      });
      if (res.ok) {
        setSubcategories(subcategories.map(s => s.id === subcat.id ? { ...s, activo: nextStatus } : s));
        showNotification("success", `Subcategoría "${subcat.nombre}" ahora está ${nextStatus ? "VISIBLE" : "OCULTA"}.`);
      }
    } catch {
      showNotification("error", "Error al actualizar subcategoría.");
    }
  };

  // Eliminar subcategoría
  const handleDeleteSubcategory = async (subcat: Subcategory) => {
    if (!confirm(`¿Eliminar la subcategoría "${subcat.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/subcategories/${subcat.id}`, { method: "DELETE" });
      if (res.ok) {
        setSubcategories(subcategories.filter(s => s.id !== subcat.id));
        showNotification("success", `Subcategoría "${subcat.nombre}" eliminada.`);
        fetchCatalogData();
      }
    } catch {
      showNotification("error", "Error al eliminar subcategoría.");
    }
  };

  // Crear Registro Unificado (Categoría + Subcategoría + Producto + Subproductos)
  const handleCreateUnifiedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unifiedProdName.trim()) {
      showNotification("error", "El nombre del producto es obligatorio.");
      return;
    }

    if (unifiedMode === "new_cat" && !newCatName.trim()) {
      showNotification("error", "Escribe el nombre de la nueva categoría.");
      return;
    }
    if (unifiedMode === "existing_cat" && !selectedCatId) {
      showNotification("error", "Selecciona una categoría o pulsa '+' para crearla.");
      return;
    }

    try {
      setActionLoading(true);

      const promoImageVal = unifiedProdSpecial
        ? (unifiedSpecialImageType === "exclusive" && unifiedSpecialImage.trim() ? unifiedSpecialImage.trim() : null)
        : null;

      const validSubPrices = subproductsList
        .map(sp => parseFloat(sp.precio_base))
        .filter(p => !isNaN(p) && p > 0);
      const computedBasePrice = parseFloat(unifiedProdPrice) || (validSubPrices.length > 0 ? Math.min(...validSubPrices) : 0);

      const validSubCosts = subproductsList
        .map(sp => parseFloat(sp.costo_proveedor))
        .filter(c => !isNaN(c) && c > 0);
      const computedBaseCost = parseFloat(unifiedProdCost) || (validSubCosts.length > 0 ? Math.min(...validSubCosts) : 0);

      if (computedBasePrice === 0 && subproductsList.length === 0) {
        showNotification("error", "Debes ingresar el precio de venta o agregar al menos un subproducto con precio.");
        setActionLoading(false);
        return;
      }

      const payload = {
        categoria: unifiedMode === "new_cat"
          ? { nombre: newCatName.trim(), imagen_url: newCatImage.trim() || null }
          : { id: selectedCatId },
        subcategoria: unifiedSubcatMode === "new_subcat"
          ? { nombre: newSubcatName.trim(), imagen_url: newSubcatImage.trim() || null }
          : selectedSubcatId ? { id: selectedSubcatId } : null,
        producto: {
          nombre: unifiedProdName.trim(),
          descripcion: unifiedProdDesc.trim() || null,
          precio_base: computedBasePrice,
          costo_proveedor: computedBaseCost,
          imagen_url: unifiedProdImage.trim() || null,
          imagen_oferta_url: promoImageVal,
          activo: unifiedProdActive,
          oferta_especial: unifiedProdSpecial,
          precio_ref_ves: unifiedVesMode === "ref" && unifiedRefVes ? parseFloat(unifiedRefVes) : null,
          precio_fijo_ves: unifiedVesMode === "fixed" && unifiedFijoVes ? parseFloat(unifiedFijoVes) : null,
          precio_ref_mxn: unifiedMxnMode === "ref" && unifiedRefMxn ? parseFloat(unifiedRefMxn) : null,
          precio_fijo_mxn: unifiedMxnMode === "fixed" && unifiedFijoMxn ? parseFloat(unifiedFijoMxn) : null,
        },
        overrides: unifiedRankPricingMode === "manual"
          ? Object.entries(unifiedRankPrices)
              .filter(([_, v]) => v && v.trim() !== "" && !isNaN(parseFloat(v)))
              .map(([rango, v]) => ({ rango, precio_fijo: parseFloat(v) }))
          : [],
        subproductos: subproductsList.map((sp) => ({
          nombre: sp.nombre.trim(),
          precio_base: parseFloat(sp.precio_base) || 0,
          costo_proveedor: parseFloat(sp.costo_proveedor) || 0,
          imagen_url: sp.imagen_url.trim() || null,
        })),
      };

      const res = await fetch("/api/admin/catalog/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification("success", "¡Ítem guardado con éxito con todas sus fases y subproductos!");
        setShowUnifiedModal(false);
        // Reset
        setNewCatName("");
        setNewCatImage("");
        setUnifiedMode("existing_cat");
        setNewSubcatName("");
        setNewSubcatImage("");
        setUnifiedSubcatMode("existing_subcat");
        setUnifiedProdName("");
        setUnifiedProdDesc("");
        setUnifiedProdPrice("");
        setUnifiedProdCost("");
        setUnifiedProdImage("");
        setUnifiedProdSpecial(false);
        setUnifiedSpecialImageType("default");
        setUnifiedSpecialImage("");
        setUnifiedVesMode("auto");
        setUnifiedRefVes("");
        setUnifiedFijoVes("");
        setUnifiedMxnMode("auto");
        setUnifiedFijoMxn("");
        setUnifiedRefMxn("");
        setUnifiedRankPricingMode("auto");
        setUnifiedRankPrices({});
        setShowUnifiedAdvancedPricing(false);
        setSubproductsList([]);
        fetchCatalogData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "No se pudo registrar el ítem en el catálogo.");
      }
    } catch {
      showNotification("error", "Error de red al guardar en catálogo.");
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================================
  // CONTROLADOR DE EDICIÓN DE PRODUCTO COMPLETO
  // ========================================================
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.nombre);
    setEditProdDesc(prod.descripcion || "");
    setEditProdPrice(String(prod.precio_base ?? ""));
    setEditProdCost(String(prod.costo_proveedor ?? ""));
    setEditProdImage(prod.imagen_url || "");
    setEditProdActive(prod.activo);
    setEditProdSpecial(prod.oferta_especial);
    setEditSpecialImageType(prod.imagen_oferta_url ? "exclusive" : "default");
    setEditSpecialImage(prod.imagen_oferta_url || "");
    setEditSubcatId(prod.subcategoria_id || "");

    // Configuración Moneda VES
    if (prod.precio_fijo_ves && Number(prod.precio_fijo_ves) > 0) {
      setEditVesMode("fixed");
      setEditFijoVes(String(prod.precio_fijo_ves));
      setEditRefVes("");
    } else if (prod.precio_ref_ves && Number(prod.precio_ref_ves) > 0) {
      setEditVesMode("ref");
      setEditRefVes(String(prod.precio_ref_ves));
      setEditFijoVes("");
    } else {
      setEditVesMode("auto");
      setEditRefVes("");
      setEditFijoVes("");
    }

    // Configuración Moneda MXN
    if (prod.precio_fijo_mxn && Number(prod.precio_fijo_mxn) > 0) {
      setEditMxnMode("fixed");
      setEditFijoMxn(String(prod.precio_fijo_mxn));
      setEditRefMxn("");
    } else if (prod.precio_ref_mxn && Number(prod.precio_ref_mxn) > 0) {
      setEditMxnMode("ref");
      setEditRefMxn(String(prod.precio_ref_mxn));
      setEditFijoMxn("");
    } else {
      setEditMxnMode("auto");
      setEditFijoMxn("");
      setEditRefMxn("");
    }

    // Configuración de Overrides por Rango
    const prodOverrides = overrides.filter(o => o.producto_id === prod.id);
    if (prodOverrides.length > 0) {
      setEditRankPricingMode("manual");
      const mapped: Record<string, string> = {};
      prodOverrides.forEach(o => {
        mapped[o.rango] = String(o.precio_fijo);
      });
      setEditRankPrices(mapped);
    } else {
      setEditRankPricingMode("auto");
      setEditRankPrices({});
    }

    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSavingEditProduct(true);
      const promoImageVal = editProdSpecial
        ? (editSpecialImageType === "exclusive" && editSpecialImage.trim() ? editSpecialImage.trim() : null)
        : null;

      const overrideList = editRankPricingMode === "manual"
        ? Object.entries(editRankPrices)
            .filter(([_, v]) => v && v.trim() !== "" && !isNaN(parseFloat(v)))
            .map(([rango, v]) => ({ rango, precio_fijo: parseFloat(v) }))
        : [];

      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editProdName.trim(),
          descripcion: editProdDesc.trim() || null,
          subcategoria_id: editSubcatId || undefined,
          precio_base: parseFloat(editProdPrice) || 0,
          costo_proveedor: parseFloat(editProdCost) || 0,
          activo: editProdActive,
          oferta_especial: editProdSpecial,
          imagen_url: editProdImage.trim() || null,
          imagen_oferta_url: promoImageVal,
          precio_ref_ves: editVesMode === "ref" && editRefVes ? parseFloat(editRefVes) : null,
          precio_fijo_ves: editVesMode === "fixed" && editFijoVes ? parseFloat(editFijoVes) : null,
          precio_ref_mxn: editMxnMode === "ref" && editRefMxn ? parseFloat(editRefMxn) : null,
          precio_fijo_mxn: editMxnMode === "fixed" && editFijoMxn ? parseFloat(editFijoMxn) : null,
          overrides: overrideList,
        }),
      });

      if (res.ok) {
        showNotification("success", `Producto "${editProdName}" actualizado correctamente.`);
        setShowEditProductModal(false);
        setEditingProduct(null);
        fetchCatalogData();
      } else {
        const err = await res.json();
        showNotification("error", err.error || "No se pudo actualizar el producto.");
      }
    } catch {
      showNotification("error", "Error de red al actualizar producto.");
    } finally {
      setSavingEditProduct(false);
    }
  };

  // ========================================================
  // CONTROLADOR DE EDICIÓN DE SUBPRODUCTO / VARIANTE
  // ========================================================
  const handleOpenEditVariant = (variant: ProductVariant, parentProd: Product) => {
    setEditingVariant(variant);
    setEditingVariantParentProd(parentProd);
    setEditVarName(variant.nombre);
    setEditVarPrice(String(variant.precio_base ?? ""));
    setEditVarCost(String(variant.costo_proveedor ?? ""));
    setEditVarImage(variant.imagen_url || "");
    setEditVarActive(variant.activo);

    if (variant.precio_fijo_ves && Number(variant.precio_fijo_ves) > 0) {
      setEditVarVesMode("fixed");
      setEditVarFijoVes(String(variant.precio_fijo_ves));
      setEditVarRefVes("");
    } else if (variant.precio_ref_ves && Number(variant.precio_ref_ves) > 0) {
      setEditVarVesMode("ref");
      setEditVarRefVes(String(variant.precio_ref_ves));
      setEditVarFijoVes("");
    } else {
      setEditVarVesMode("auto");
      setEditVarRefVes("");
      setEditVarFijoVes("");
    }

    if (variant.precio_fijo_mxn && Number(variant.precio_fijo_mxn) > 0) {
      setEditVarMxnMode("fixed");
      setEditVarFijoMxn(String(variant.precio_fijo_mxn));
      setEditVarRefMxn("");
    } else if (variant.precio_ref_mxn && Number(variant.precio_ref_mxn) > 0) {
      setEditVarMxnMode("ref");
      setEditVarRefMxn(String(variant.precio_ref_mxn));
      setEditVarFijoMxn("");
    } else {
      setEditVarMxnMode("auto");
      setEditVarFijoMxn("");
      setEditVarRefMxn("");
    }

    const varOverrides = overrides.filter(o => o.variante_id === variant.id);
    if (varOverrides.length > 0) {
      setEditVarRankPricingMode("manual");
      const mapped: Record<string, string> = {};
      varOverrides.forEach(o => {
        mapped[o.rango] = String(o.precio_fijo);
      });
      setEditVarRankPrices(mapped);
    } else {
      setEditVarRankPricingMode("auto");
      setEditVarRankPrices({});
    }

    setShowEditVariantModal(true);
  };

  const handleSaveEditVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      setSavingEditVariant(true);
      const overrideList = editVarRankPricingMode === "manual"
        ? Object.entries(editVarRankPrices)
            .filter(([_, v]) => v && v.trim() !== "" && !isNaN(parseFloat(v)))
            .map(([rango, v]) => ({ rango, precio_fijo: parseFloat(v) }))
        : [];

      const res = await fetch(`/api/admin/variants/${editingVariant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editVarName.trim(),
          precio_base: parseFloat(editVarPrice) || 0,
          costo_proveedor: parseFloat(editVarCost) || 0,
          imagen_url: editVarImage.trim() || null,
          activo: editVarActive,
          precio_ref_ves: editVarVesMode === "ref" && editVarRefVes ? parseFloat(editVarRefVes) : null,
          precio_fijo_ves: editVarVesMode === "fixed" && editVarFijoVes ? parseFloat(editVarFijoVes) : null,
          precio_ref_mxn: editVarMxnMode === "ref" && editVarRefMxn ? parseFloat(editVarRefMxn) : null,
          precio_fijo_mxn: editVarMxnMode === "fixed" && editVarFijoMxn ? parseFloat(editVarFijoMxn) : null,
          overrides: overrideList,
        }),
      });

      if (res.ok) {
        showNotification("success", `Subproducto "${editVarName}" actualizado.`);
        setShowEditVariantModal(false);
        setEditingVariant(null);
        fetchCatalogData();
      } else {
        const err = await res.json();
        showNotification("error", err.error || "No se pudo actualizar el subproducto.");
      }
    } catch {
      showNotification("error", "Error de red al actualizar subproducto.");
    } finally {
      setSavingEditVariant(false);
    }
  };

  // Añadir variante/subproducto a un producto existente
  const handleAddVariantToProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductForVariant || !varName.trim()) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: targetProductForVariant.id,
          nombre: varName.trim(),
          precio_base: parseFloat(varPrice) || targetProductForVariant.precio_base,
          costo_proveedor: parseFloat(varCost) || targetProductForVariant.costo_proveedor,
          imagen_url: varImage.trim() || targetProductForVariant.imagen_url || null,
          activo: true,
        }),
      });

      if (res.ok) {
        showNotification("success", `Subproducto "${varName}" agregado a "${targetProductForVariant.nombre}".`);
        setShowAddVariantModal(false);
        setTargetProductForVariant(null);
        setVarName("");
        setVarPrice("");
        setVarCost("");
        setVarImage("");
        fetchCatalogData();
      } else {
        showNotification("error", "Error al crear subproducto.");
      }
    } catch {
      showNotification("error", "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar variante/subproducto
  const handleDeleteVariant = async (variantId: string, varNombre: string) => {
    if (!confirm(`¿Eliminar el subproducto "${varNombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, { method: "DELETE" });
      if (res.ok) {
        setVariants(variants.filter(v => v.id !== variantId));
        showNotification("success", `Subproducto eliminado con éxito.`);
      } else {
        showNotification("error", "Error al eliminar subproducto.");
      }
    } catch {
      showNotification("error", "Error de red.");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#09090e] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
          <span className="text-sm font-mono text-slate-400">Verificando credenciales de Administrador...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#09090e] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-red-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Acceso Restringido</h2>
          <p className="text-sm text-slate-400">
            Esta sección es de uso exclusivo para Administradores de Soul Store. Tu cuenta no cuenta con los permisos necesarios.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm shadow-glow transition"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090e] text-slate-100 flex flex-col">
      {/* Top Navbar Admin */}
      <header className="glass-panel border-b border-slate-800/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 p-0.5 shadow-glow">
                <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4 h-4 text-fuchsia-400" />
                </div>
              </div>
              <span className="font-extrabold text-white text-lg tracking-wider">
                SOUL<span className="text-pink-400">ADMIN</span>
              </span>
            </Link>

            {/* Simulación "Ver como..." (Módulo 6.1) */}
            <div className="hidden lg:flex items-center gap-2 ml-6 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <Eye className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-slate-400">Simular Rol:</span>
              <select 
                value={viewAsRole}
                onChange={(e) => setViewAsRole(e.target.value)}
                className="bg-transparent text-white font-mono font-semibold outline-none cursor-pointer"
              >
                <option value="admin" className="bg-slate-900">Admin (Control Total)</option>
                <option value="disenador" className="bg-slate-900">Diseñador Gráfico</option>
                <option value="revendedor_1" className="bg-slate-900">Revendedor Grado 1</option>
                <option value="cliente_especial" className="bg-slate-900">Cliente Especial</option>
                <option value="cliente_4" className="bg-slate-900">Cliente Grado 4 (General)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link 
              href="/" 
              className="text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel hover:border-slate-600"
            >
              <span>Ver Tienda Pública</span>
              <ExternalLink className="w-3.5 h-3.5 text-fuchsia-400" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-glow">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className="bg-black/40 border-b border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "pedidos"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Gestión de Pedidos & Despachos</span>
            {orders.filter((o) => o.item_estado === "EN_COLA").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-mono text-[10px] animate-pulse">
                {orders.filter((o) => o.item_estado === "EN_COLA").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("catalogo")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "catalogo"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Gestor de Catálogo Dinámico</span>
          </button>

          <button
            onClick={() => setActiveTab("finanzas")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "finanzas"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Financiero</span>
          </button>

          <button
            onClick={() => setActiveTab("usuarios")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "usuarios"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestor de Usuarios</span>
          </button>

          <button
            onClick={() => setActiveTab("tasas")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "tasas"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Multidivisa & Suiche P2P</span>
          </button>

          <button
            onClick={() => setActiveTab("pagos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "pagos"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#FFF01F]" />
            <span>Métodos de Pago</span>
            {paymentMethods.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[#FFF01F] text-[10px] font-mono border border-white/10">
                {paymentMethods.filter(p => p.activo).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("boveda")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "boveda"
                ? "bg-fuchsia-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white glass-panel"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Bóveda Segura</span>
            {vaultItems.filter(i => i.estado === "OFERTA_ESPECIAL").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {vaultItems.filter(i => i.estado === "OFERTA_ESPECIAL").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {statusMessage && (
        <div className={`p-3 px-4 text-xs font-medium flex items-center justify-between transition ${
          statusMessage.type === "success" 
            ? "bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200" 
            : "bg-red-950/80 border-b border-red-500/40 text-red-200"
        }`}>
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* ======================================================== */}
        {/* TAB 0: GESTIÓN DE PEDIDOS & DESPACHOS (Módulo 2) */}
        {/* ======================================================== */}
        {activeTab === "pedidos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                  <span>Cola de Pedidos y Despachos FIFO</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Gestiona las órdenes entrantes, cambia estados de entrega y notifica al cliente por WhatsApp en 1 clic.
                </p>
              </div>

              <button
                onClick={fetchOrders}
                className="px-3.5 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white flex items-center gap-1.5 self-start"
              >
                <span>Refrescar Cola</span>
              </button>
            </div>

            {loadingOrders ? (
              <div className="glass-panel p-8 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
                <span>Cargando órdenes desde Supabase...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="font-bold text-white text-base">No hay pedidos registrados todavía</h3>
                <p className="text-xs text-slate-400">
                  Las órdenes que generen tus clientes aparecerán aquí automáticamente en tiempo real.
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/90 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Orden / Fecha</th>
                        <th className="py-3 px-4">Cliente / Contacto</th>
                        <th className="py-3 px-4">Producto & Player ID</th>
                        <th className="py-3 px-4">Método & Comprobante</th>
                        <th className="py-3 px-4">Total Pagado</th>
                        <th className="py-3 px-4">Estado Entrega</th>
                        <th className="py-3 px-4 text-right">Notificar WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                      {orders.map((o) => (
                        <tr key={o.item_id} className="hover:bg-slate-900/40">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-white block">
                              #SOUL-{o.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(o.creado_en).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {o.es_override_duplicado && (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/40 mt-1">
                                ⚠️ Override
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{o.usuario_nombre}</span>
                            <span className="text-[11px] font-mono text-cyan-400 block">{o.usuario_whatsapp || "Sin WhatsApp"}</span>
                            <span className="text-[10px] text-slate-500">{o.usuario_email}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{o.producto_nombre}</span>
                            {o.player_id && (
                              <span className="text-[11px] font-mono text-fuchsia-400 block">
                                ID: {o.player_id} ({o.region || "Global"})
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-white block truncate max-w-[170px]">
                              {o.metodo_pago_nombre || "Pago Manual"}
                            </span>
                            {o.referencia_pago && (
                              <span className="text-[11px] text-cyan-400 block font-semibold truncate max-w-[170px]">
                                Ref: {o.referencia_pago}
                              </span>
                            )}
                            {o.comprobante_url ? (
                              <button
                                onClick={() => setPreviewVoucherUrl(o.comprobante_url!)}
                                className="inline-flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 underline font-bold mt-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver Comprobante</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 block">Sin comprobante</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {o.moneda_pago === "VES" && o.total_ves ? (
                              <div>
                                <span className="text-emerald-400">{o.total_ves} VES</span>
                                <span className="text-[10px] text-slate-500 block">(${o.total_usd} USD)</span>
                              </div>
                            ) : o.moneda_pago === "MXN" && o.total_mxn ? (
                              <div>
                                <span className="text-cyan-400">${o.total_mxn} MXN</span>
                                <span className="text-[10px] text-slate-500 block">(${o.total_usd} USD)</span>
                              </div>
                            ) : (
                              <span className="text-white">${o.total_usd} USD</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={o.item_estado}
                              onChange={(e) => handleUpdateOrderStatus(o.id, o.item_id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold outline-none cursor-pointer border ${
                                o.item_estado === "ENTREGADO"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : o.item_estado === "PROCESANDO"
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                  : o.item_estado === "FALLIDO"
                                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              <option value="EN_COLA" className="bg-slate-900 text-amber-300">EN_COLA</option>
                              <option value="PROCESANDO" className="bg-slate-900 text-cyan-300">PROCESANDO</option>
                              <option value="ENTREGADO" className="bg-slate-900 text-emerald-300">ENTREGADO</option>
                              <option value="FALLIDO" className="bg-slate-900 text-red-300">FALLIDO</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <a
                              href={getWhatsAppNotifyLink(o)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs inline-flex items-center gap-1.5 transition"
                            >
                              <span>Avisar WhatsApp</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: GESTOR DE CATÁLOGO DINÁMICO (CLASIFICADO & BUSCADOR) */}
        {/* ======================================================== */}
        {activeTab === "catalogo" && (
          <div className="space-y-8">
            
            {/* Header del Catálogo con Botón Principal Unificado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Package className="w-6 h-6 text-fuchsia-400" />
                  <span>Gestor de Catálogo Clasificado</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Administra en un solo lugar la jerarquía completa: Categorías &rarr; Subcategorías &rarr; Productos &rarr; Subproductos / Paquetes.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Botón Principal Unificado */}
                <button
                  onClick={() => setShowUnifiedModal(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white text-xs font-black shadow-glow flex items-center gap-2 transition hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>+ Crear en Catálogo (Completo)</span>
                </button>

                {/* Botón rápido auxiliar para categoría */}
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCatActive(true);
                    setCatName("");
                    setCatImageUrl("");
                    setShowCategoryModal(true);
                  }}
                  className="px-3.5 py-3 rounded-2xl glass-panel hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Crear solo categoría rápida"
                >
                  <FolderPlus className="w-4 h-4 text-fuchsia-400" />
                  <span>+ Categoría</span>
                </button>
              </div>
            </div>

            {/* BARRA DE HERRAMIENTAS: BUSCADOR EN VIVO Y FILTROS */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Buscador Universal en Tiempo Real */}
                <div className="md:col-span-6 relative">
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    placeholder="Buscar producto, subcategoría o categoría..."
                    className="w-full px-4 py-2.5 pl-10 pr-9 rounded-2xl bg-slate-950 border border-slate-800 focus:border-fuchsia-500 text-xs text-white outline-none font-medium placeholder:text-slate-500 transition"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  {catalogSearchQuery && (
                    <button
                      onClick={() => setCatalogSearchQuery("")}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtro por Categoría */}
                <div className="md:col-span-3">
                  <select
                    value={catalogFilterCategory}
                    onChange={(e) => {
                      setCatalogFilterCategory(e.target.value);
                      setCatalogFilterSubcategory("all");
                    }}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-fuchsia-500 font-mono"
                  >
                    <option value="all">Todas las Categorías ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.activo ? "" : "(Oculta)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Subcategoría */}
                <div className="md:col-span-3">
                  <select
                    value={catalogFilterSubcategory}
                    onChange={(e) => setCatalogFilterSubcategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-fuchsia-500 font-mono"
                  >
                    <option value="all">Todas las Subcategorías</option>
                    {subcategories
                      .filter((s) => catalogFilterCategory === "all" || s.categoria_id === catalogFilterCategory)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.categoria_nombre || "General"})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Pills de Estado & Conteo */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 text-[11px] mr-1">Filtrar por:</span>
                  <button
                    onClick={() => setCatalogFilterStatus("all")}
                    className={`px-3 py-1 rounded-xl transition ${
                      catalogFilterStatus === "all"
                        ? "bg-fuchsia-600 text-white font-bold"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => setCatalogFilterStatus("visible")}
                    className={`px-3 py-1 rounded-xl transition ${
                      catalogFilterStatus === "visible"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Visibles ({products.filter((p) => p.activo).length})
                  </button>
                  <button
                    onClick={() => setCatalogFilterStatus("hidden")}
                    className={`px-3 py-1 rounded-xl transition ${
                      catalogFilterStatus === "hidden"
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Ocultos ({products.filter((p) => !p.activo).length})
                  </button>
                  <button
                    onClick={() => setCatalogFilterStatus("offer")}
                    className={`px-3 py-1 rounded-xl transition ${
                      catalogFilterStatus === "offer"
                        ? "bg-pink-600 text-white font-bold"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    🔥 Ofertas ({products.filter((p) => p.oferta_especial).length})
                  </button>
                </div>

                <span className="text-slate-400 text-[11px]">
                  Mostrando{" "}
                  <strong className="text-white">
                    {
                      products.filter((prod) => {
                        if (catalogSearchQuery.trim()) {
                          const q = catalogSearchQuery.toLowerCase().trim();
                          const matchName = prod.nombre?.toLowerCase().includes(q);
                          const matchCat = prod.categoria_nombre?.toLowerCase().includes(q);
                          const matchSubcat = prod.subcategoria_nombre?.toLowerCase().includes(q);
                          const matchDesc = prod.descripcion?.toLowerCase().includes(q);
                          if (!matchName && !matchCat && !matchSubcat && !matchDesc) return false;
                        }
                        if (catalogFilterCategory !== "all" && prod.categoria_id !== catalogFilterCategory) return false;
                        if (catalogFilterSubcategory !== "all" && prod.subcategoria_id !== catalogFilterSubcategory) return false;
                        if (catalogFilterStatus === "visible" && !prod.activo) return false;
                        if (catalogFilterStatus === "hidden" && prod.activo) return false;
                        if (catalogFilterStatus === "offer" && !prod.oferta_especial) return false;
                        return true;
                      }).length
                    }
                  </strong>{" "}
                  productos filtrados
                </span>
              </div>
            </div>

            {/* SECCIÓN 1: CATEGORÍAS & SUBCATEGORÍAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <span>Categorías y Subcategorías ({categories.length})</span>
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  {categories.filter((c) => c.activo).length} Visibles en Tienda
                </span>
              </div>

              {loadingCatalog ? (
                <div className="glass-panel p-8 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
                  <span>Consultando base de datos de Supabase...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="glass-panel p-10 rounded-3xl border border-dashed border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-500">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base">Aún no has creado ninguna categoría</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Usa el Creador Unificado para registrar tu primera categoría con su imagen y productos en un solo paso.
                  </p>
                  <button
                    onClick={() => setShowUnifiedModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold hover:scale-105 shadow-glow"
                  >
                    Abrir Creador de Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                    const relatedSubcats = subcategories.filter((s) => s.categoria_id === cat.id);
                    const prodCount = products.filter((p) => p.categoria_id === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        className={`glass-panel p-5 rounded-3xl border transition space-y-4 ${
                          cat.activo ? "border-slate-800" : "border-amber-500/30 opacity-75 bg-slate-950/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Imagen de Categoría */}
                            <div className="w-12 h-12 rounded-2xl bg-black/60 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                              {cat.imagen_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <Tag className="w-5 h-5 text-fuchsia-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                                <span>{cat.nombre}</span>
                                {!cat.activo && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Oculto
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500">{prodCount} productos vinculados</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCatName(cat.nombre);
                                setCatImageUrl(cat.imagen_url || "");
                                setCatActive(cat.activo);
                                setShowCategoryModal(true);
                              }}
                              title="Editar categoría e imagen"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-fuchsia-400 hover:bg-slate-800 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              title="Eliminar categoría"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Subcategorías dentro de esta categoría */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-mono uppercase text-slate-500 block">Subcategorías:</span>
                          {relatedSubcats.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic block">General / Sin subcategorías</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {relatedSubcats.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                                >
                                  {sub.imagen_url && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={sub.imagen_url} alt={sub.nombre} className="w-3.5 h-3.5 rounded object-cover" />
                                  )}
                                  <span>{sub.nombre}</span>
                                  <button
                                    onClick={() => handleDeleteSubcategory(sub)}
                                    className="text-slate-500 hover:text-red-400 ml-1"
                                    title="Eliminar subcategoría"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Visibilidad Switch */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Visibilidad en tienda:</span>
                          <button
                            onClick={() => handleToggleCategoryVisibility(cat)}
                            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                          >
                            {cat.activo ? (
                              <>
                                <span className="text-emerald-400">Visible</span>
                                <ToggleRight className="w-7 h-7 text-emerald-400" />
                              </>
                            ) : (
                              <>
                                <span className="text-slate-500">Oculto</span>
                                <ToggleLeft className="w-7 h-7 text-slate-600" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: PRODUCTOS Y SUBPRODUCTOS CLASIFICADOS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-fuchsia-400" />
                  <span>Productos y Subproductos Registrados ({products.length})</span>
                </h2>
                <button
                  onClick={() => setShowUnifiedModal(true)}
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Producto</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="glass-panel p-10 rounded-3xl border border-dashed border-slate-800 text-center space-y-3">
                  <p className="text-sm text-slate-400">No hay productos registrados en la base de datos todavía.</p>
                  <button
                    onClick={() => setShowUnifiedModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold shadow-glow"
                  >
                    Crear Primer Producto
                  </button>
                </div>
              ) : (
                /* Cuadrícula / Tarjetas Ricas Clasificadas */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products
                    .filter((prod) => {
                      if (catalogSearchQuery.trim()) {
                        const q = catalogSearchQuery.toLowerCase().trim();
                        const matchName = prod.nombre?.toLowerCase().includes(q);
                        const matchCat = prod.categoria_nombre?.toLowerCase().includes(q);
                        const matchSubcat = prod.subcategoria_nombre?.toLowerCase().includes(q);
                        const matchDesc = prod.descripcion?.toLowerCase().includes(q);
                        if (!matchName && !matchCat && !matchSubcat && !matchDesc) return false;
                      }
                      if (catalogFilterCategory !== "all" && prod.categoria_id !== catalogFilterCategory) return false;
                      if (catalogFilterSubcategory !== "all" && prod.subcategoria_id !== catalogFilterSubcategory) return false;
                      if (catalogFilterStatus === "visible" && !prod.activo) return false;
                      if (catalogFilterStatus === "hidden" && prod.activo) return false;
                      if (catalogFilterStatus === "offer" && !prod.oferta_especial) return false;
                      return true;
                    })
                    .map((prod) => {
                      const prodVariants = variants.filter((v) => v.producto_id === prod.id);

                      return (
                        <div
                          key={prod.id}
                          className={`glass-panel p-5 rounded-3xl border space-y-4 transition ${
                            prod.oferta_especial
                              ? "border-pink-500/40 bg-pink-950/10"
                              : prod.activo
                              ? "border-slate-800"
                              : "border-slate-800/50 opacity-70 bg-slate-950/40"
                          }`}
                        >
                          {/* Top: Imagen, Título y Clasificación */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Miniatura de Imagen de Producto */}
                              <div className="w-14 h-14 rounded-2xl bg-black/60 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                {prod.imagen_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-tr from-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-black text-base">
                                    ⚡
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-white text-sm truncate leading-tight">
                                    {prod.nombre}
                                  </h3>
                                  {prod.oferta_especial && (
                                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold border border-pink-500/40 flex items-center gap-1">
                                      🔥 OFERTA
                                    </span>
                                  )}
                                </div>

                                {/* Clasificación jerárquica */}
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                    {prod.categoria_nombre || "General"}
                                  </span>
                                  <span>&rarr;</span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-fuchsia-300">
                                    {prod.subcategoria_nombre || "General"}
                                  </span>
                                </div>
                              </div>
                            </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  title="Editar producto, divisas y precios por rango"
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod)}
                                  title="Eliminar producto"
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Badges de Divisas Especiales & Rangos */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {prod.precio_fijo_ves ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold" title="Precio fijo en Bolívares">
                                  🇻🇪 Fijo: {Number(prod.precio_fijo_ves).toLocaleString()} Bs
                                </span>
                              ) : prod.precio_ref_ves ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 text-[10px] font-mono text-amber-300" title="Base USD referencial para calcular Bs">
                                  🇻🇪 Ref USD: ${Number(prod.precio_ref_ves).toFixed(2)}
                                </span>
                              ) : null}

                              {prod.precio_fijo_mxn ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold" title="Precio fijo directo en Pesos Mexicanos (Sin dependencia)">
                                  🇲🇽 Fijo: ${Number(prod.precio_fijo_mxn).toFixed(2)} MXN
                                </span>
                              ) : prod.precio_ref_mxn ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300" title="Base USD referencial para calcular MXN">
                                  🇲🇽 Ref USD: ${Number(prod.precio_ref_mxn).toFixed(2)}
                                </span>
                              ) : null}

                              {(() => {
                                const prodOverrides = overrides.filter(o => o.producto_id === prod.id);
                                if (prodOverrides.length > 0) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-950/50 border border-purple-500/40 text-[10px] font-mono text-purple-300 font-bold" title="Precios manuales por rango de cliente">
                                      👑 {prodOverrides.length} rangos fijos
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Precios Principales */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-900 text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">
                                  {prodVariants.length > 0 ? "Precio Venta (Desde)" : "Precio Venta"}
                                </span>
                                <span className="font-black text-white text-sm">
                                  {prodVariants.length > 0
                                    ? `Desde $${Math.min(...prodVariants.map(v => Number(v.precio_base) || Number(prod.precio_base))).toFixed(2)} USD`
                                    : `$${Number(prod.precio_base).toFixed(2)} USD`}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">
                                  {prodVariants.length > 0 ? "Costo Soul (Desde)" : "Costo Soul"}
                                </span>
                                <span className="font-bold text-slate-400 text-sm">
                                  {prodVariants.length > 0
                                    ? `Desde $${Math.min(...prodVariants.map(v => Number(v.costo_proveedor) || Number(prod.costo_proveedor))).toFixed(2)} USD`
                                    : `$${Number(prod.costo_proveedor).toFixed(2)} USD`}
                                </span>
                              </div>
                            </div>

                            {/* SUBPRODUCTOS / VARIANTES DESGLOSADAS */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                                  <span>Subproductos / Paquetes ({prodVariants.length})</span>
                                </span>

                                <button
                                  onClick={() => {
                                    setTargetProductForVariant(prod);
                                    setVarName("");
                                    setVarPrice(String(prod.precio_base));
                                    setVarCost(String(prod.costo_proveedor));
                                    setVarImage(prod.imagen_url || "");
                                    setShowAddVariantModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600 text-fuchsia-300 hover:text-white border border-fuchsia-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Subproducto</span>
                                </button>
                              </div>

                              {prodVariants.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic pl-1">
                                  Sin subproductos desglosados (Venta única directa por ${Number(prod.precio_base).toFixed(2)} USD).
                                </p>
                              ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {prodVariants.map((v) => (
                                    <div
                                      key={v.id}
                                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {v.imagen_url ? (
                                          /* eslint-disable-next-line @next/next/no-img-element */
                                          <img src={v.imagen_url} alt={v.nombre} className="w-6 h-6 rounded-md object-cover border border-white/10" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px]">
                                            💎
                                          </div>
                                        )}
                                        <span className="font-semibold text-slate-200 truncate">{v.nombre}</span>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 font-mono">
                                        <span className="font-bold text-emerald-400">${Number(v.precio_base).toFixed(2)}</span>
                                        {v.precio_fijo_ves && (
                                          <span className="text-[9px] text-amber-400 bg-amber-950/50 px-1 py-0.5 rounded border border-amber-500/30 font-bold" title="Fijo en Bs">
                                            🇻🇪 {Number(v.precio_fijo_ves).toLocaleString()} Bs
                                          </span>
                                        )}
                                        {v.precio_ref_ves && (
                                          <span className="text-[9px] text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-500/20" title="Ref USD para Bs">
                                            🇻🇪 Ref ${Number(v.precio_ref_ves).toFixed(2)}
                                          </span>
                                        )}
                                        {v.precio_fijo_mxn && (
                                          <span className="text-[9px] text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded border border-emerald-500/30 font-bold" title="Fijo en MXN">
                                            🇲🇽 ${Number(v.precio_fijo_mxn).toFixed(2)}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditVariant(v, prod)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 transition"
                                          title="Editar subproducto, divisas y precios por rango"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteVariant(v.id, v.nombre)}
                                          className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-950/30 transition"
                                          title="Eliminar subproducto"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          {/* BARRA DE ACCIONES INFERIOR */}
                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            {/* Toggle Oferta Especial & Botón Banner */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleToggleProductSpecial(prod)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                  prod.oferta_especial
                                    ? "bg-pink-600 text-white shadow-glow"
                                    : "bg-slate-900 text-slate-400 hover:text-white"
                                }`}
                              >
                                <span>{prod.oferta_especial ? "🔥 Oferta Activa" : "Activar Oferta"}</span>
                              </button>

                              {prod.oferta_especial && (
                                <button
                                  onClick={() => {
                                    setTargetProductForPromo(prod);
                                    setPromoChoice(prod.imagen_oferta_url ? "exclusive" : "default");
                                    setExclusivePromoImageUrl(prod.imagen_oferta_url || "");
                                    setShowPromoImageModal(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                                  title="Configurar banner o imagen exclusiva para Ofertas Especiales"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                                  <span>{prod.imagen_oferta_url ? "🖼️ Banner Propio" : "🖼️ Banner Default"}</span>
                                </button>
                              )}
                            </div>

                            {/* Toggle Visibilidad */}
                            <button
                              onClick={() => handleToggleProductVisibility(prod)}
                              className="flex items-center gap-1.5 cursor-pointer text-xs"
                            >
                              {prod.activo ? (
                                <>
                                  <span className="text-emerald-400 font-semibold text-xs">Visible</span>
                                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-500 font-semibold text-xs">Oculto</span>
                                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: FINANZAS */}
        {activeTab === "finanzas" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 block mb-1">GANANCIA NETA TOTAL</span>
                <span className="text-3xl font-black text-emerald-400">$3,840.50</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 block mb-1">BRUTA CLIENTES DIRECTOS</span>
                <span className="text-3xl font-black text-white">$2,190.00</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 block mb-1">BRUTA REVENDEDORES (B2B)</span>
                <span className="text-3xl font-black text-cyan-400">$6,450.20</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 block mb-1">DIVISAS PROCESADAS</span>
                <div className="space-y-1 mt-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>USD:</span>
                    <span className="font-bold text-white">$4,250.00</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>VES:</span>
                    <span className="font-bold text-fuchsia-400">185,400 Bs.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USUARIOS */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Gestor de Usuarios en Base de Datos ({users.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Lista en vivo de usuarios registrados en Supabase. Puedes cambiar el rango para asignar permisos o tiers de precio.
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="px-3.5 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white flex items-center gap-1.5 self-start"
              >
                <span>Refrescar Lista</span>
              </button>
            </div>

            {loadingUsers ? (
              <div className="glass-panel p-8 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
                <span>Cargando usuarios desde Supabase...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-400">
                No hay usuarios registrados aún.
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/90 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Nombre / Apellido</th>
                        <th className="py-3 px-4">Nickname</th>
                        <th className="py-3 px-4">Correo Electrónico</th>
                        <th className="py-3 px-4">WhatsApp</th>
                        <th className="py-3 px-4">Rango Asignado</th>
                        <th className="py-3 px-4 text-right">Cambiar Rango</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/40">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {u.nombre} {u.apellido || ""}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-cyan-400">
                            {u.nickname}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {u.telefono_whatsapp || "N/A"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                                u.rango === "admin"
                                  ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
                                  : u.rango.startsWith("revendedor")
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {u.rango}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={u.rango}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none focus:border-fuchsia-500 cursor-pointer"
                            >
                              <option value="admin">admin (Control Total)</option>
                              <option value="disenador">disenador</option>
                              <option value="revendedor_1">revendedor_1 (4% Margen)</option>
                              <option value="revendedor_2">revendedor_2 (6% Margen)</option>
                              <option value="revendedor_3">revendedor_3 (9% Margen)</option>
                              <option value="revendedor_4">revendedor_4 (12% Margen)</option>
                              <option value="revendedor_especial">revendedor_especial</option>
                              <option value="cliente_1">cliente_1 (7% Margen)</option>
                              <option value="cliente_2">cliente_2 (10% Margen)</option>
                              <option value="cliente_3">cliente_3 (15% Margen)</option>
                              <option value="cliente_4">cliente_4 (20% Margen)</option>
                              <option value="cliente_especial">cliente_especial</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TASAS */}
        {activeTab === "tasas" && (
          <div className="space-y-6 max-w-5xl">
            {/* Box 1: Estado General, Cuenta Regresiva y Tasas en Vivo */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">Modo Automático (Bot Binance P2P)</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      modoAutomatico ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {modoAutomatico ? "Auto Binance P2P" : "Manual fijado"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {modoAutomatico 
                      ? "El bot consulta promedios en Binance P2P automáticamente con los filtros independientes de cada moneda." 
                      : "SUICHE ACTIVADO: Las tasas están fijadas manualmente por el Administrador."}
                  </span>
                  {tasaFecha && (
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      Última sincronización: {new Date(tasaFecha).toLocaleString()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleToggleModo}
                  className="text-fuchsia-400 hover:scale-105 transition self-start sm:self-center"
                  title={modoAutomatico ? "Desactivar modo automático" : "Activar modo automático"}
                >
                  {modoAutomatico ? (
                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Frecuencia de Actualización y Temporizador */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-Actualización Periódica</span>
                    <span className="text-[11px] text-slate-400">
                      Frecuencia con la que el bot busca y actualiza las tasas automáticamente.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={intervaloMinutos}
                    onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value={5}>Cada 5 minutos</option>
                    <option value={10}>Cada 10 minutos</option>
                    <option value={15}>Cada 15 minutos (Por defecto)</option>
                    <option value={30}>Cada 30 minutos</option>
                    <option value={60}>Cada 60 minutos (1 hora)</option>
                  </select>
                  {modoAutomatico && countdownSeconds !== null && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono" title="Tiempo restante para la siguiente sincronización automática">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasas Actuales en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-slate-300">TASA VES (Bs./USD)</label>
                    <span className="text-[10px] text-emerald-400 font-bold">Venezuela</span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    value={tasaVes}
                    disabled={modoAutomatico}
                    onChange={(e) => setTasaVes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:border-fuchsia-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                    1 USD = {tasaVes} Bs. (Calculado para compras desde {filtroMontoVes} Bs.{metodoPagoVes !== "ALL" ? ` vía ${metodoPagoVes}` : ""})
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-slate-300">TASA MXN ($/USD)</label>
                    <span className="text-[10px] text-cyan-400 font-bold">México</span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    value={tasaMxn}
                    disabled={modoAutomatico}
                    onChange={(e) => setTasaMxn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:border-cyan-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                    1 USD = ${tasaMxn} MXN (Calculado para compras desde ${filtroMontoMxn} MXN{metodoPagoMxn !== "ALL" ? ` vía ${metodoPagoMxn}` : ""})
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleSyncP2P(false)}
                  disabled={syncingTasas}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingTasas ? "animate-spin" : ""}`} />
                  <span>{syncingTasas ? "Consultando Binance P2P con tus filtros..." : "Sincronizar con Binance P2P Ahora"}</span>
                </button>

                {!modoAutomatico && (
                  <button
                    onClick={handleSaveManualRates}
                    disabled={savingTasas}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {savingTasas ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Guardar Tasas Manuales</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Configuraciones Independientes del Algoritmo P2P (VES vs MXN) */}
            <form onSubmit={handleSaveP2PConfig} className="glass-panel p-6 rounded-2xl border border-fuchsia-500/20 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-white text-base">Filtros Oficiales de Binance P2P por Moneda</h3>
                    <p className="text-xs text-slate-400">
                      Configura con exactitud los mismos filtros que en la app móvil de Binance: tiempo de pago, métodos, tipo de anuncio y montos rápidos.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingP2PConfig}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-glow self-start sm:self-auto"
                >
                  {savingP2PConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar Parámetros P2P</span>
                </button>
              </div>

              {/* Grid 2 Columnas: VES vs MXN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* TARJETA 🇻🇪 VENEZUELA (VES) */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇻🇪</span>
                      <h4 className="font-bold text-emerald-400 text-sm">Filtros Binance Venezuela (VES)</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      Bolívares
                    </span>
                  </div>

                  {/* 1. Límite de tiempo de pago (minutos) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Límite de tiempo de pago (minutos)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Todo", val: 0 },
                        { label: "15", val: 15 },
                        { label: "30", val: 30 },
                        { label: "45", val: 45 },
                        { label: "60", val: 60 },
                        { label: "120", val: 120 },
                        { label: "180", val: 180 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setTiempoPagoVes(p.val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            tiempoPagoVes === p.val
                              ? "bg-slate-800 text-white border-2 border-slate-200 shadow-md"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Método de pago */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Método de pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "ALL", name: "Todo", hot: false },
                        { id: "BancoDeVenezuela", name: "Banco de Venezuela", hot: true },
                        { id: "BANESCO", name: "Banesco", hot: true },
                        { id: "Mercantil", name: "Mercantil", hot: true },
                        { id: "PagoMovil", name: "Pago Movil", hot: true },
                        { id: "BBVAProvincial", name: "Provincial", hot: true },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetodoPagoVes(m.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                            metodoPagoVes === m.id
                              ? "bg-slate-800 text-white border-2 border-emerald-400 shadow-md"
                              : "bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {m.hot && <span className="text-[10px] ml-1">🔥</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. País / Región */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      País / Región
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "ALL", name: "Todo" },
                        { id: "VE", name: "Venezuela" },
                        { id: "CO", name: "Colombia" },
                        { id: "PA", name: "Panamá" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPaisVes(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            paisVes === c.id
                              ? "bg-slate-800 text-white border-2 border-emerald-400 shadow-md"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Tipo de anuncio */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                      Tipo de anuncio
                    </label>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Solo anuncios para trading</span>
                        <span className="text-[10px] text-slate-400">Filtra anuncios disponibles para comercio inmediato</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloTradingVes}
                        onChange={(e) => setSoloTradingVes(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-amber-400 block">Solo anuncios de comerciantes verificados</span>
                        <span className="text-[10px] text-slate-400">Insignia dorada de verificación oficial en Binance</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloVerificadosVes}
                        onChange={(e) => setSoloVerificadosVes(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Solo anuncios de comerciantes Pro</span>
                        <span className="text-[10px] text-slate-400">Comerciantes de alta categoría Pro Merchant</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloProVes}
                        onChange={(e) => setSoloProVes(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Anuncios que no necesitan verificación</span>
                        <span className="text-[10px] text-slate-400">Permite anuncios de usuarios comunes sin insignia</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={sinVerifVes}
                        onChange={(e) => setSinVerifVes(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 5. Cantidad con accesos rápidos */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Cantidad / Monto Mínimo de Orden
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="50"
                        min="100"
                        value={filtroMontoVes}
                        onChange={(e) => setFiltroMontoVes(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold focus:border-emerald-500 outline-none pr-16"
                        placeholder="1000"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 font-bold">
                        VES
                      </span>
                    </div>

                    {/* Botones rápidos de cantidad de la app */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "Bs500", val: "500" },
                        { label: "Bs1,000", val: "1000" },
                        { label: "Bs3K", val: "3000" },
                        { label: "Bs20K", val: "20000" },
                        { label: "Bs30K", val: "30000" },
                      ].map((b) => (
                        <button
                          key={b.val}
                          type="button"
                          onClick={() => setFiltroMontoVes(b.val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                            filtroMontoVes === b.val
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Parámetros de Tienda (Muestra, Spread, TradeType) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Muestra Ofertas
                      </label>
                      <select
                        value={cantOfertasVes}
                        onChange={(e) => setCantOfertasVes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-emerald-500 outline-none"
                      >
                        <option value={5}>5 ofertas</option>
                        <option value={10}>10 ofertas</option>
                        <option value={15}>15 ofertas</option>
                        <option value={20}>20 ofertas</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Margen Spread (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={margenSpreadVes}
                        onChange={(e) => setMargenSpreadVes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-emerald-500 outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Tipo de Operación
                      </label>
                      <select
                        value={tipoOperacionVes}
                        onChange={(e) => setTipoOperacionVes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-emerald-500 outline-none"
                      >
                        <option value="BUY">BUY - Comprar USDT (Tasa de Reposición Tienda)</option>
                        <option value="SELL">SELL - Vender USDT (Tasa de Liquidación)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* TARJETA 🇲🇽 MÉXICO (MXN) */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-cyan-500/30 space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇲🇽</span>
                      <h4 className="font-bold text-cyan-400 text-sm">Filtros Binance México (MXN)</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                      Pesos Mexicanos
                    </span>
                  </div>

                  {/* 1. Límite de tiempo de pago (minutos) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Límite de tiempo de pago (minutos)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Todo", val: 0 },
                        { label: "15", val: 15 },
                        { label: "30", val: 30 },
                        { label: "45", val: 45 },
                        { label: "60", val: 60 },
                        { label: "120", val: 120 },
                        { label: "180", val: 180 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setTiempoPagoMxn(p.val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            tiempoPagoMxn === p.val
                              ? "bg-slate-800 text-white border-2 border-slate-200 shadow-md"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Método de pago */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Método de pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "ALL", name: "Todo", hot: false },
                        { id: "STP", name: "STP", hot: true },
                        { id: "BBVABank", name: "BBVA México", hot: true },
                        { id: "BANK", name: "BANK (SPEI)", hot: true },
                        { id: "Mercadopago", name: "Mercado Pago", hot: true },
                        { id: "SpecificBank", name: "Banco Específico", hot: false },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetodoPagoMxn(m.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                            metodoPagoMxn === m.id
                              ? "bg-slate-800 text-white border-2 border-cyan-400 shadow-md"
                              : "bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {m.hot && <span className="text-[10px] ml-1">🔥</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. País / Región */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      País / Región
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "ALL", name: "Todo" },
                        { id: "MX", name: "México" },
                        { id: "US", name: "Estados Unidos" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPaisMxn(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            paisMxn === c.id
                              ? "bg-slate-800 text-white border-2 border-cyan-400 shadow-md"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Tipo de anuncio */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                      Tipo de anuncio
                    </label>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Solo anuncios para trading</span>
                        <span className="text-[10px] text-slate-400">Filtra anuncios disponibles para comercio inmediato</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloTradingMxn}
                        onChange={(e) => setSoloTradingMxn(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-amber-400 block">Solo anuncios de comerciantes verificados</span>
                        <span className="text-[10px] text-slate-400">Insignia dorada de verificación oficial en Binance</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloVerificadosMxn}
                        onChange={(e) => setSoloVerificadosMxn(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Solo anuncios de comerciantes Pro</span>
                        <span className="text-[10px] text-slate-400">Comerciantes de alta categoría Pro Merchant</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soloProMxn}
                        onChange={(e) => setSoloProMxn(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">Anuncios que no necesitan verificación</span>
                        <span className="text-[10px] text-slate-400">Permite anuncios de usuarios comunes sin insignia</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={sinVerifMxn}
                        onChange={(e) => setSinVerifMxn(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 5. Cantidad con accesos rápidos */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono text-slate-300 block font-bold">
                      Cantidad / Monto Mínimo de Orden
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="10"
                        min="20"
                        value={filtroMontoMxn}
                        onChange={(e) => setFiltroMontoMxn(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold focus:border-cyan-500 outline-none pr-16"
                        placeholder="200"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 font-bold">
                        MXN
                      </span>
                    </div>

                    {/* Botones rápidos de cantidad de la app */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "$100", val: "100" },
                        { label: "$200", val: "200" },
                        { label: "$500", val: "500" },
                        { label: "$1,000", val: "1000" },
                        { label: "$5,000", val: "5000" },
                      ].map((b) => (
                        <button
                          key={b.val}
                          type="button"
                          onClick={() => setFiltroMontoMxn(b.val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                            filtroMontoMxn === b.val
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                              : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Parámetros de Tienda (Muestra, Spread, TradeType) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Muestra Ofertas
                      </label>
                      <select
                        value={cantOfertasMxn}
                        onChange={(e) => setCantOfertasMxn(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-cyan-500 outline-none"
                      >
                        <option value={5}>5 ofertas</option>
                        <option value={10}>10 ofertas</option>
                        <option value={15}>15 ofertas</option>
                        <option value={20}>20 ofertas</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Margen Spread (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={margenSpreadMxn}
                        onChange={(e) => setMargenSpreadMxn(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-cyan-500 outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-mono text-slate-300 block font-bold mb-1">
                        Tipo de Operación
                      </label>
                      <select
                        value={tipoOperacionMxn}
                        onChange={(e) => setTipoOperacionMxn(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:border-cyan-500 outline-none"
                      >
                        <option value="BUY">BUY - Comprar USDT (Tasa de Reposición Tienda)</option>
                        <option value="SELL">SELL - Vender USDT (Tasa de Liquidación)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </form>

            {/* Box 3: Transparencia y Auditoría en Vivo de Comerciantes Detectados */}
            {p2pOfferSamples && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Muestra en Vivo de Comerciantes Filtrados por Binance P2P
                    </h4>
                    <span className="text-xs text-slate-400">
                      Verificación en tiempo real de que las órdenes corresponden a compras minoristas con comerciantes verificados.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VES Offers */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-xs font-mono text-emerald-400 font-bold block">
                        🇻🇪 Venezuela (Filtro: {filtroMontoVes} Bs.)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {metodoPagoVes !== "ALL" ? metodoPagoVes : "Todos los métodos"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {p2pOfferSamples.ves.map((item, idx) => (
                        <div key={idx} className="text-xs p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{item.nick}</span>
                              {item.isMerchant && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  ✓ Verificado
                                </span>
                              )}
                              {item.isPro && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  ⭐ Pro
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              {item.price.toFixed(2)} Bs.
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Lím: {Number(item.minAmount).toLocaleString()} - {Number(item.maxAmount).toLocaleString()} Bs.</span>
                            {item.payTimeLimit && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800">
                                ⏱ {item.payTimeLimit} min
                              </span>
                            )}
                          </div>
                          {item.paymentMethods && item.paymentMethods.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {item.paymentMethods.slice(0, 3).map((pm, pidx) => (
                                <span key={pidx} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                                  {pm}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MXN Offers */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-xs font-mono text-cyan-400 font-bold block">
                        🇲🇽 México (Filtro: ${filtroMontoMxn} MXN)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {metodoPagoMxn !== "ALL" ? metodoPagoMxn : "Todos los métodos"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {p2pOfferSamples.mxn.map((item, idx) => (
                        <div key={idx} className="text-xs p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{item.nick}</span>
                              {item.isMerchant && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  ✓ Verificado
                                </span>
                              )}
                              {item.isPro && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  ⭐ Pro
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-cyan-400 text-sm">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Lím: ${Number(item.minAmount).toLocaleString()} - ${Number(item.maxAmount).toLocaleString()} MXN</span>
                            {item.payTimeLimit && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800">
                                ⏱ {item.payTimeLimit} min
                              </span>
                            )}
                          </div>
                          {item.paymentMethods && item.paymentMethods.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {item.paymentMethods.slice(0, 3).map((pm, pidx) => (
                                <span key={pidx} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                                  {pm}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BÓVEDA SEGURA (MÓDULO 8) */}
        {activeTab === "boveda" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Bóveda de Inventario Seguro (Cuentas & Licencias)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Almacenamiento con cifrado simétrico AES-256 (pgcrypto). Protege cuentas y claves sensibles.
                </p>
              </div>

              <button
                onClick={() => {
                  if (products.length > 0 && !vaultProdId) {
                    setVaultProdId(products[0].id);
                  }
                  setShowVaultModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-glow transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Cargar Ítem a la Bóveda</span>
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Total en Bóveda</span>
                <span className="text-2xl font-bold text-white font-mono">{vaultItems.length}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
                <span className="text-xs text-emerald-300 block mb-1">Disponibles</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {vaultItems.filter(i => i.estado === "DISPONIBLE").length}
                </span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
                <span className="text-xs text-amber-300 block mb-1">Ofertas (≤15 días)</span>
                <span className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1">
                  <Flame className="w-5 h-5 text-amber-400 inline" />
                  {vaultItems.filter(i => i.estado === "OFERTA_ESPECIAL").length}
                </span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10">
                <span className="text-xs text-cyan-300 block mb-1">Reservados / Asignados</span>
                <span className="text-2xl font-bold text-cyan-400 font-mono">
                  {vaultItems.filter(i => i.estado === "RESERVADO" || i.estado === "ASIGNADO").length}
                </span>
              </div>
            </div>

            {/* Vault items list */}
            {loadingVault ? (
              <div className="flex items-center justify-center p-12 glass-panel rounded-2xl">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : vaultItems.length === 0 ? (
              <div className="text-center p-12 glass-panel rounded-2xl border border-slate-800 space-y-3">
                <Lock className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">La bóveda de inventario está vacía</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Carga cuentas, pases o pines con encriptación para habilitar entregas rápidas y reservas automáticas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultItems.map((item) => {
                  const isRevealed = Boolean(revealedSecrets[item.id]);
                  const secret = revealedSecrets[item.id];
                  const isCopied = copiedId === item.id;

                  return (
                    <div 
                      key={item.id} 
                      className={`glass-panel p-5 rounded-2xl border space-y-4 transition ${
                        item.estado === "OFERTA_ESPECIAL" 
                          ? "border-amber-500/40 bg-amber-950/10" 
                          : item.estado === "DISPONIBLE" 
                          ? "border-emerald-500/30" 
                          : "border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">{item.identificador_publico}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.estado === "OFERTA_ESPECIAL"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : item.estado === "DISPONIBLE"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : item.estado === "RESERVADO"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {item.estado === "OFERTA_ESPECIAL" ? "🔥 Oferta (≤15d)" : item.estado}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            Producto: <strong className="text-white">{item.producto_nombre}</strong> (${item.precio_usd} USD)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteVaultItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tipo de entrega & Caducidad */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                          item.tipo_entrega === "RAPIDA" 
                            ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20" 
                            : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        }`}>
                          {item.tipo_entrega === "RAPIDA" ? <Sparkles className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          <span>{item.tipo_entrega === "RAPIDA" ? "Entrega Rápida" : "Reserva por Fecha"}</span>
                        </span>

                        {item.fecha_vencimiento && (
                          <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-mono">
                            Vence: {new Date(item.fecha_vencimiento).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Instrucción de entrega */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-xs text-slate-300 space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Instrucción de Entrega:</span>
                        <p className="line-clamp-2">{item.instruccion_entrega}</p>
                      </div>

                      {/* Credenciales Cifradas con pgcrypto */}
                      <div className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Credenciales Sensibles (AES-256)</span>
                          </span>

                          <button
                            onClick={() => handleRevealSecret(item.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                          >
                            {isRevealed ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Ocultar</span>
                              </>
                            ) : (
                              <>
                                <Key className="w-3.5 h-3.5" />
                                <span>Revelar Clave</span>
                              </>
                            )}
                          </button>
                        </div>

                        {isRevealed && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <code className="text-xs font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30 flex-1 break-all select-all">
                              {secret}
                            </code>
                            <button
                              onClick={() => copyToClipboard(secret, item.id)}
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex-shrink-0"
                              title="Copiar credenciales"
                            >
                              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: MÉTODOS DE PAGO MANUALES PERSONALIZABLES */}
        {/* ======================================================== */}
        {activeTab === "pagos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-[#FFF01F]" />
                  <span>Métodos de Pago Manuales (Multi-Divisa)</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Agrega y personaliza las cuentas bancarias, Pago Móvil, Binance Pay o SPEI por moneda (USD, VES, MXN) para el checkout de tus clientes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPaymentMethods}
                  className="px-3.5 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refrescar</span>
                </button>
                <button
                  onClick={handleOpenCreatePaymentModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Método de Pago</span>
                </button>
              </div>
            </div>

            {/* Filtros de Moneda */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setPaymentMethodsCurrencyFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                  paymentMethodsCurrencyFilter === "ALL"
                    ? "bg-[#FFF01F] text-black shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Todas las Monedas ({paymentMethods.length})
              </button>
              <button
                onClick={() => setPaymentMethodsCurrencyFilter("USD")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                  paymentMethodsCurrencyFilter === "USD"
                    ? "bg-[#D61A1A] text-white shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                USD / USDT ({paymentMethods.filter((p) => p.moneda === "USD").length})
              </button>
              <button
                onClick={() => setPaymentMethodsCurrencyFilter("VES")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                  paymentMethodsCurrencyFilter === "VES"
                    ? "bg-[#D61A1A] text-white shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                VES - Bolívares ({paymentMethods.filter((p) => p.moneda === "VES").length})
              </button>
              <button
                onClick={() => setPaymentMethodsCurrencyFilter("MXN")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                  paymentMethodsCurrencyFilter === "MXN"
                    ? "bg-[#D61A1A] text-white shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                MXN - Pesos ({paymentMethods.filter((p) => p.moneda === "MXN").length})
              </button>
            </div>

            {/* Listado de Métodos de Pago */}
            {loadingPaymentMethods ? (
              <div className="glass-panel p-8 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
                <span>Cargando métodos de pago...</span>
              </div>
            ) : paymentMethods.filter(
                (p) =>
                  paymentMethodsCurrencyFilter === "ALL" ||
                  p.moneda === paymentMethodsCurrencyFilter
              ).length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
                <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="font-bold text-white text-base">No hay métodos de pago en esta categoría</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Agrega cuentas bancarias, billeteras o códigos QR para que tus clientes puedan pagar al instante.
                </p>
                <button
                  onClick={handleOpenCreatePaymentModal}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Método</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods
                  .filter(
                    (p) =>
                      paymentMethodsCurrencyFilter === "ALL" ||
                      p.moneda === paymentMethodsCurrencyFilter
                  )
                  .map((pm) => (
                    <div
                      key={pm.id}
                      className={`glass-panel p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                        pm.activo
                          ? "border-slate-800 hover:border-slate-700 bg-slate-900/60"
                          : "border-slate-900 opacity-60 bg-slate-950/40"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              pm.moneda === "USD"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : pm.moneda === "VES"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                            }`}
                          >
                            {pm.moneda}
                          </span>

                          <button
                            onClick={() => handleTogglePaymentMethod(pm)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                            title={pm.activo ? "Desactivar método" : "Activar método"}
                          >
                            {pm.activo ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-600" />
                            )}
                            <span className="text-[11px] font-mono">
                              {pm.activo ? "Activo" : "Inactivo"}
                            </span>
                          </button>
                        </div>

                        {/* Título y Banco */}
                        <div>
                          <h4 className="font-bold text-white text-base leading-snug">
                            {pm.nombre_metodo}
                          </h4>
                          <span className="text-xs text-fuchsia-400 font-mono">
                            {pm.banco || pm.tipo_cuenta || "Manual"}
                          </span>
                        </div>

                        {/* Coordenadas de pago / Campos dinámicos */}
                        {pm.campos && pm.campos.length > 0 ? (
                          <div className="p-3 rounded-xl bg-black/60 border border-slate-800/80 space-y-1.5 font-mono text-xs">
                            {pm.campos.map((c, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-2">
                                <span className="text-slate-500 text-[10px] shrink-0 font-mono uppercase">
                                  {c.etiqueta}:
                                </span>
                                <span className="font-semibold text-white text-right break-all flex items-center gap-1.5 justify-end">
                                  <span>{c.valor}</span>
                                  {c.copiable !== false && (
                                    <span title="Copiable por cliente">
                                      <Copy className="w-2.5 h-2.5 text-[#FFF01F] shrink-0" />
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-black/60 border border-slate-800/80 space-y-1.5 font-mono text-xs">
                            {pm.titular && (
                              <div className="flex justify-between text-slate-300">
                                <span className="text-slate-500 text-[10px]">Titular:</span>
                                <span className="font-semibold text-white truncate max-w-[170px]">{pm.titular}</span>
                              </div>
                            )}
                            {pm.identificacion && (
                              <div className="flex justify-between text-slate-300">
                                <span className="text-slate-500 text-[10px]">Doc/CI/RFC:</span>
                                <span className="font-semibold text-white">{pm.identificacion}</span>
                              </div>
                            )}
                            {pm.tipo_cuenta && (
                              <div className="flex justify-between text-slate-300">
                                <span className="text-slate-500 text-[10px]">Tipo:</span>
                                <span className="text-slate-400">{pm.tipo_cuenta}</span>
                              </div>
                            )}
                            <div className="pt-1 border-t border-slate-800 flex justify-between items-start text-[#FFF01F]">
                              <span className="text-slate-500 text-[10px] shrink-0">Cuenta/Pago:</span>
                              <span className="font-bold text-right break-all pl-2">{pm.datos_cuenta}</span>
                            </div>
                          </div>
                        )}

                        {/* QR si existe */}
                        {pm.qr_imagen_url && (
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <img
                              src={pm.qr_imagen_url}
                              alt="QR"
                              className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 shrink-0"
                            />
                            <div className="text-[11px] text-slate-400">
                              <span className="text-white font-bold block flex items-center gap-1">
                                <QrCode className="w-3 h-3 text-[#FFF01F]" />
                                QR Configurado
                              </span>
                              <span>Visible en el checkout</span>
                            </div>
                          </div>
                        )}

                        {/* Instrucciones */}
                        {pm.instrucciones && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{pm.instrucciones}"
                          </p>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          Orden: {pm.orden}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditPaymentModal(pm)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Editar método"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(pm)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-500/20 transition"
                            title="Eliminar método"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: CREADOR UNIFICADO DE CATÁLOGO (4 FASES INTEGRALES) */}
      {/* ======================================================== */}
      {showUnifiedModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-7 rounded-3xl border border-fuchsia-500/40 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Header del Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Creador Unificado de Catálogo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura Categoría, Subcategoría, Producto y Subproductos en un solo flujo organizado.
                </p>
              </div>

              <button
                onClick={() => setShowUnifiedModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnifiedItem} className="space-y-6">
              
              {/* ========================================================== */}
              {/* FASE 1: CATEGORÍA */}
              {/* ========================================================== */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-fuchsia-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-4 h-4" /> 1. Categoría Principal *
                  </span>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setUnifiedMode("existing_cat")}
                      disabled={categories.length === 0}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        unifiedMode === "existing_cat"
                          ? "bg-fuchsia-600 text-white font-bold"
                          : "text-slate-400 hover:text-white disabled:opacity-40"
                      }`}
                    >
                      Existente ({categories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnifiedMode("new_cat")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        unifiedMode === "new_cat"
                          ? "bg-fuchsia-600 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      + Nueva
                    </button>
                  </div>
                </div>

                {unifiedMode === "existing_cat" && categories.length > 0 ? (
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">SELECCIONA CATEGORÍA EXISTENTE</label>
                    <select
                      value={selectedCatId}
                      onChange={(e) => {
                        setSelectedCatId(e.target.value);
                        setSelectedSubcatId("");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-semibold outline-none focus:border-fuchsia-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.activo ? "" : "(Oculta)"}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">NOMBRE DE LA NUEVA CATEGORÍA *</label>
                      <input
                        type="text"
                        required={unifiedMode === "new_cat"}
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ej: Free Fire, Cuentas Streaming, Gift Cards..."
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-fuchsia-500 text-sm text-white outline-none"
                      />
                    </div>

                    <ImageUploadInput
                      label="Imagen de la Categoría (Opcional)"
                      value={newCatImage}
                      onChange={setNewCatImage}
                      placeholder="https://... o sube una imagen"
                      helperText="Se mostrará como avatar de la categoría en la tienda y el panel"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* FASE 2: SUBCATEGORÍA */}
              {/* ========================================================== */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> 2. Subcategoría (Opcional)
                  </span>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setUnifiedSubcatMode("existing_subcat")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        unifiedSubcatMode === "existing_subcat"
                          ? "bg-cyan-600 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Existente / General
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnifiedSubcatMode("new_subcat")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        unifiedSubcatMode === "new_subcat"
                          ? "bg-cyan-600 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      + Nueva Subcategoría
                    </button>
                  </div>
                </div>

                {unifiedSubcatMode === "existing_subcat" ? (
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">SELECCIONA SUBCATEGORÍA VINCULADA</label>
                    <select
                      value={selectedSubcatId}
                      onChange={(e) => setSelectedSubcatId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-semibold outline-none focus:border-cyan-500"
                    >
                      <option value="">General (Sin subcategoría específica)</option>
                      {subcategories
                        .filter((s) => s.categoria_id === selectedCatId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">NOMBRE DE LA NUEVA SUBCATEGORÍA *</label>
                      <input
                        type="text"
                        required={unifiedSubcatMode === "new_subcat"}
                        value={newSubcatName}
                        onChange={(e) => setNewSubcatName(e.target.value)}
                        placeholder="Ej: Recarga Directa por ID, Pases de Batalla..."
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white outline-none"
                      />
                    </div>

                    <ImageUploadInput
                      label="Imagen de la Subcategoría (Opcional)"
                      value={newSubcatImage}
                      onChange={setNewSubcatImage}
                      placeholder="https://... o sube una imagen"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* FASE 3: PRODUCTO PRINCIPAL */}
              {/* ========================================================== */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4" /> 3. Datos del Producto Principal *
                </span>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">NOMBRE DEL PRODUCTO *</label>
                  <input
                    type="text"
                    required
                    value={unifiedProdName}
                    onChange={(e) => setUnifiedProdName(e.target.value)}
                    placeholder="Ej: Diamantes Free Fire, Netflix Ultra HD"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      PRECIO VENTA (USD) {subproductsList.length > 0 ? "(Opcional si usas subproductos)" : "*"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required={subproductsList.length === 0}
                      value={unifiedProdPrice}
                      onChange={(e) => setUnifiedProdPrice(e.target.value)}
                      placeholder={subproductsList.length > 0 ? "Opcional (se toma el menor)" : "0.95"}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-bold font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      COSTO PROVEEDOR (USD) {subproductsList.length > 0 ? "(Opcional)" : ""}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={unifiedProdCost}
                      onChange={(e) => setUnifiedProdCost(e.target.value)}
                      placeholder={subproductsList.length > 0 ? "Opcional" : "0.68"}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-bold font-mono outline-none"
                    />
                  </div>
                </div>

                {subproductsList.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Derivado en {subproductsList.length} subproductos con precios distintos:</span>
                    </span>
                    <span className="font-bold text-white bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      {(() => {
                        const prices = subproductsList.map(s => parseFloat(s.precio_base)).filter(p => !isNaN(p) && p > 0);
                        return prices.length > 0 ? `Precio Base: Desde $${Math.min(...prices).toFixed(2)} USD` : "Define precios abajo";
                      })()}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">DESCRIPCIÓN / INSTRUCCIONES</label>
                  <textarea
                    value={unifiedProdDesc}
                    onChange={(e) => setUnifiedProdDesc(e.target.value)}
                    placeholder="Instrucciones para la recarga, requisitos o detalles del servicio..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white outline-none h-18 resize-none"
                  />
                </div>

                <ImageUploadInput
                  label="Imagen del Producto"
                  value={unifiedProdImage}
                  onChange={setUnifiedProdImage}
                  placeholder="https://... o arrastra una imagen"
                  helperText="Se mostrará en la tienda pública, ofertas y tarjetas de catálogo"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Visible en tienda al guardar</span>
                    <input
                      type="checkbox"
                      checked={unifiedProdActive}
                      onChange={(e) => setUnifiedProdActive(e.target.checked)}
                      className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">🔥 Marcar Oferta Especial</span>
                    <input
                      type="checkbox"
                      checked={unifiedProdSpecial}
                      onChange={(e) => setUnifiedProdSpecial(e.target.checked)}
                      className="w-4 h-4 accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pregunta interactiva para la imagen de Oferta Especial */}
                {unifiedProdSpecial && (
                  <div className="p-3.5 rounded-2xl bg-pink-950/30 border border-pink-500/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Imagen para el Banner de Oferta Especial
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      ¿Deseas usar la imagen predeterminada del producto o subir una imagen exclusiva para el banner promocional de Ofertas Especiales?
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUnifiedSpecialImageType("default")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition flex items-center gap-2.5 ${
                          unifiedSpecialImageType === "default"
                            ? "bg-pink-600/30 border-pink-400 text-white shadow-sm"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-base shrink-0">📷</span>
                        <div className="min-w-0">
                          <span className="block font-bold">Imagen predeterminada</span>
                          <span className="text-[10px] text-slate-400 block truncate">Usa la misma imagen del producto</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUnifiedSpecialImageType("exclusive")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition flex items-center gap-2.5 ${
                          unifiedSpecialImageType === "exclusive"
                            ? "bg-pink-600/30 border-pink-400 text-white shadow-sm"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-base shrink-0">✨</span>
                        <div className="min-w-0">
                          <span className="block font-bold">Imagen exclusiva</span>
                          <span className="text-[10px] text-slate-400 block truncate">Banner promocional destacado</span>
                        </div>
                      </button>
                    </div>

                    {unifiedSpecialImageType === "exclusive" && (
                      <div className="pt-2">
                        <ImageUploadInput
                          label="Banner / Imagen Exclusiva de Oferta Especial"
                          value={unifiedSpecialImage}
                          onChange={setUnifiedSpecialImage}
                          placeholder="https://... o arrastra una imagen"
                          helperText="Esta imagen se mostrará únicamente en la sección de Ofertas Especiales de la página principal"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* FASE 4: SUBPRODUCTOS / VARIANTES DESGLOSABLES */}
              {/* ========================================================== */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> 4. Desglose de Subproductos / Paquetes (Opcional)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Agrega denominaciones (ej. 100 Diamantes, 310 Diamantes, 520 Diamantes, etc.) con su propio precio e imagen.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSubproductsList((prev) => [
                        ...prev,
                        {
                          id: String(Date.now()),
                          nombre: "",
                          precio_base: unifiedProdPrice || "",
                          costo_proveedor: unifiedProdCost || "",
                          imagen_url: unifiedProdImage || "",
                        },
                      ]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Paquete</span>
                  </button>
                </div>

                {subproductsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No has agregado subproductos aún. Si vendes un solo paquete general, puedes dejarlo vacío.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subproductsList.map((sp, idx) => (
                      <div
                        key={sp.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            Paquete #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSubproductsList((prev) => prev.filter((p) => p.id !== sp.id));
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Quitar subproducto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">Nombre Paquete *</label>
                            <input
                              type="text"
                              required
                              value={sp.nombre}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubproductsList((prev) =>
                                  prev.map((item) => (item.id === sp.id ? { ...item, nombre: val } : item))
                                );
                              }}
                              placeholder="Ej: 100 Diamantes"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">Precio Venta (USD) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={sp.precio_base}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubproductsList((prev) =>
                                  prev.map((item) => (item.id === sp.id ? { ...item, precio_base: val } : item))
                                );
                              }}
                              placeholder="0.95"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">Costo Proveedor (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sp.costo_proveedor}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubproductsList((prev) =>
                                  prev.map((item) => (item.id === sp.id ? { ...item, costo_proveedor: val } : item))
                                );
                              }}
                              placeholder="0.68"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                        </div>

                        {/* Imagen del subproducto */}
                        <ImageUploadInput
                          label="Imagen específica del subproducto (Opcional)"
                          value={sp.imagen_url}
                          onChange={(val) => {
                            setSubproductsList((prev) =>
                              prev.map((item) => (item.id === sp.id ? { ...item, imagen_url: val } : item))
                            );
                          }}
                          placeholder="https://... o subir imagen de este paquete"
                          helperText="Si no se sube, se usará la imagen general del producto"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* FASE 5: CONFIGURACIÓN AVANZADA DE DIVISAS (VES/MXN) Y PRECIOS POR RANGO (OPCIONAL) */}
              {/* ========================================================== */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowUnifiedAdvancedPricing(!showUnifiedAdvancedPricing)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-1.5 uppercase tracking-wider group-hover:text-yellow-300 transition">
                      <Settings2 className="w-4 h-4 text-yellow-400" /> 5. Divisas Especiales (VES/MXN) y Precios por Rango (Opcional)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configura cálculo específico en Bolívares, precio fijo en Pesos Mexicanos y precios manuales por rango de cliente.
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white transition shrink-0 ml-2">
                    {showUnifiedAdvancedPricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showUnifiedAdvancedPricing && (
                  <div className="space-y-5 pt-3 border-t border-slate-800/80">
                    {/* MONEDA: BOLÍVARES (VES) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                          <span>🇻🇪</span> BOLÍVARES (VES) - CÁLCULO DE PRECIO
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Tasa P2P actual: {tasaVes} Bs/$</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setUnifiedVesMode("auto")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedVesMode === "auto"
                              ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">⚡ Automático</span>
                          <span className="text-[10px] text-slate-500 block">Usa precio USD × tasa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnifiedVesMode("ref")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedVesMode === "ref"
                              ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">🎯 Base USD Especial</span>
                          <span className="text-[10px] text-slate-500 block">Ej: $1.05 USD para Bs</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnifiedVesMode("fixed")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedVesMode === "fixed"
                              ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">🔒 Precio Fijo Bs</span>
                          <span className="text-[10px] text-slate-500 block">Monto exacto en Bs</span>
                        </button>
                      </div>

                      {unifiedVesMode === "ref" && (
                        <div className="pt-1">
                          <label className="text-[11px] font-mono text-slate-300 block mb-1">
                            BASE USD REFERENCIAL PARA VES (Ej: Si el producto está en $0.95 USDT pero para calcular Bs quieres usar $1.05)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={unifiedRefVes}
                              onChange={(e) => setUnifiedRefVes(e.target.value)}
                              placeholder="1.05"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                            />
                            {unifiedRefVes && !isNaN(parseFloat(unifiedRefVes)) && parseFloat(tasaVes) > 0 && (
                              <span className="text-[11px] font-mono text-amber-300 shrink-0 font-bold bg-amber-950/60 px-2 py-1.5 rounded-lg border border-amber-500/30">
                                ≈ {(parseFloat(unifiedRefVes) * parseFloat(tasaVes)).toFixed(2)} Bs
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {unifiedVesMode === "fixed" && (
                        <div className="pt-1">
                          <label className="text-[11px] font-mono text-slate-300 block mb-1">
                            PRECIO FIJO EN BOLÍVARES (VES) - NO CAMBIA CON LA TASA
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-400">Bs.</span>
                            <input
                              type="number"
                              step="0.01"
                              value={unifiedFijoVes}
                              onChange={(e) => setUnifiedFijoVes(e.target.value)}
                              placeholder="45.00"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MONEDA: PESOS MEXICANOS (MXN) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
                          <span>🇲🇽</span> PESOS MEXICANOS (MXN) - CÁLCULO O PRECIO FIJO
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Tasa P2P actual: {tasaMxn} MXN/$</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setUnifiedMxnMode("auto")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedMxnMode === "auto"
                              ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">⚡ Automático</span>
                          <span className="text-[10px] text-slate-500 block">Usa precio USD × tasa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnifiedMxnMode("fixed")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedMxnMode === "fixed"
                              ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">🔒 Precio Fijo MXN</span>
                          <span className="text-[10px] text-slate-500 block">Sin depender del dólar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnifiedMxnMode("ref")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedMxnMode === "ref"
                              ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">🎯 Base USD Especial</span>
                          <span className="text-[10px] text-slate-500 block">Base referencial USD</span>
                        </button>
                      </div>

                      {unifiedMxnMode === "fixed" && (
                        <div className="pt-1">
                          <label className="text-[11px] font-mono text-slate-300 block mb-1">
                            PRECIO FIJO DIRECTO EN PESOS MEXICANOS (MXN) - INDEPENDIENTE DEL DÓLAR
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400">$ MXN</span>
                            <input
                              type="number"
                              step="0.01"
                              value={unifiedFijoMxn}
                              onChange={(e) => setUnifiedFijoMxn(e.target.value)}
                              placeholder="25.00"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            💡 El cliente pagará exactamente este monto en MXN sin importar las fluctuaciones del dólar o de Binance.
                          </span>
                        </div>
                      )}

                      {unifiedMxnMode === "ref" && (
                        <div className="pt-1">
                          <label className="text-[11px] font-mono text-slate-300 block mb-1">
                            BASE USD REFERENCIAL PARA MXN
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={unifiedRefMxn}
                              onChange={(e) => setUnifiedRefMxn(e.target.value)}
                              placeholder="1.00"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                            />
                            {unifiedRefMxn && !isNaN(parseFloat(unifiedRefMxn)) && parseFloat(tasaMxn) > 0 && (
                              <span className="text-[11px] font-mono text-emerald-300 shrink-0 font-bold bg-emerald-950/60 px-2 py-1.5 rounded-lg border border-emerald-500/30">
                                ≈ ${(parseFloat(unifiedRefMxn) * parseFloat(tasaMxn)).toFixed(2)} MXN
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PRECIOS POR RANGO DE CLIENTE */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 font-mono">
                          <span>👑</span> PRECIOS POR RANGO DE CLIENTE
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Descuentos escalonados B2B</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUnifiedRankPricingMode("auto")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedRankPricingMode === "auto"
                              ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">📊 Margen Porcentual</span>
                          <span className="text-[10px] text-slate-500 block">Reglas automáticas (4% al 20%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnifiedRankPricingMode("manual")}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                            unifiedRankPricingMode === "manual"
                              ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-[11px]">✍️ Manual Fijo por Rango</span>
                          <span className="text-[10px] text-slate-500 block">Fijar precio USD por nivel</span>
                        </button>
                      </div>

                      {unifiedRankPricingMode === "manual" && (
                        <div className="pt-2 space-y-2">
                          <p className="text-[11px] text-slate-300">
                            Ingresa el precio de venta en USD exclusivo para cada rango (los que dejes vacíos usarán el cálculo porcentual automático):
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {(rankRules.length > 0
                              ? rankRules
                              : [
                                  { id: "1", rango: "default", porcentaje_ganancia: 20, descripcion: "Cliente Estándar" },
                                  { id: "2", rango: "bronce", porcentaje_ganancia: 15, descripcion: "Bronce" },
                                  { id: "3", rango: "plata", porcentaje_ganancia: 12, descripcion: "Plata" },
                                  { id: "4", rango: "oro", porcentaje_ganancia: 8, descripcion: "Oro" },
                                  { id: "5", rango: "diamante", porcentaje_ganancia: 4, descripcion: "Diamante Mayorista" },
                                ]
                            ).map((r) => (
                              <div key={r.rango} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold uppercase text-purple-300">{r.rango}</span>
                                  <span className="text-slate-500">+{r.porcentaje_ganancia}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400 font-mono">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={unifiedRankPrices[r.rango] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setUnifiedRankPrices((prev) => ({ ...prev, [r.rango]: val }));
                                    }}
                                    placeholder={unifiedProdPrice || "0.00"}
                                    className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción Final */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUnifiedModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-black text-xs shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando todo en BD...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Guardar en Catálogo Completo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: AÑADIR SUBPRODUCTO A PRODUCTO EXISTENTE */}
      {/* ======================================================== */}
      {showAddVariantModal && targetProductForVariant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-cyan-500/40 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Añadir Subproducto a "{targetProductForVariant.nombre}"</span>
            </h3>

            <form onSubmit={handleAddVariantToProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">NOMBRE DEL SUBPRODUCTO / PAQUETE *</label>
                <input
                  type="text"
                  required
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Ej: 520 + 52 Diamantes, 3 Meses Pantalla..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-sm text-white font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">PRECIO VENTA (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={varPrice}
                    onChange={(e) => setVarPrice(e.target.value)}
                    placeholder="4.75"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-sm text-white font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">COSTO PROVEEDOR (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={varCost}
                    onChange={(e) => setVarCost(e.target.value)}
                    placeholder="3.50"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <ImageUploadInput
                label="Imagen del Subproducto (Opcional)"
                value={varImage}
                onChange={setVarImage}
                placeholder="https://... o subir archivo"
                helperText="Si no se especifica, tomará la imagen del producto principal"
              />

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50"
                >
                  {actionLoading ? "Guardando..." : "Guardar Subproducto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CREAR SOLO CATEGORÍA RÁPIDA (CON UPLOAD DE IMAGEN) */}
      {/* ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-fuchsia-500/30 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-fuchsia-400" />
              <span>{editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">NOMBRE DE LA CATEGORÍA *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Free Fire, Streaming, Cuentas"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-fuchsia-500 text-sm text-white outline-none"
                />
              </div>

              <ImageUploadInput
                label="Imagen de la Categoría"
                value={catImageUrl}
                onChange={setCatImageUrl}
                placeholder="https://... o subir archivo"
                helperText="Sube una foto o icono representativo de la categoría"
              />

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-300">Visible en tienda al guardar</span>
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50"
                >
                  {actionLoading
                    ? "Guardando en BD..."
                    : editingCategory
                    ? "Guardar Cambios"
                    : "Crear Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIGURAR BANNER / IMAGEN DE OFERTA ESPECIAL */}
      {/* ======================================================== */}
      {showPromoImageModal && targetProductForPromo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-pink-500/40 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider block">
                    Oferta Especial (HOT)
                  </span>
                  <h3 className="font-bold text-white text-base">
                    Banner de "{targetProductForPromo.nombre}"
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPromoImageModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoImage} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Selecciona cómo deseas que aparezca este producto en la sección destacada de <strong>Ofertas Especiales</strong> en la página principal:
              </p>

              {/* Opciones de Imagen: Predeterminada vs Exclusiva */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPromoChoice("default")}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    promoChoice === "default"
                      ? "bg-pink-950/40 border-pink-500 text-white shadow-glow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📷</span>
                    <span className="font-bold text-xs">Imagen Predeterminada</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Usa la foto general del producto sin subir un banner adicional.
                  </p>
                  {targetProductForPromo.imagen_url && (
                    <div className="mt-2.5 w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={targetProductForPromo.imagen_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPromoChoice("exclusive")}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    promoChoice === "exclusive"
                      ? "bg-pink-950/40 border-pink-500 text-white shadow-glow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <span className="font-bold text-xs">Imagen Exclusiva</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sube un banner publicitario diseñado para llamar la atención en la sección de ofertas.
                  </p>
                </button>
              </div>

              {promoChoice === "exclusive" && (
                <div className="pt-2">
                  <ImageUploadInput
                    label="Banner Exclusivo para Ofertas Especiales"
                    value={exclusivePromoImageUrl}
                    onChange={setExclusivePromoImageUrl}
                    placeholder="https://... o arrastra una imagen desde tu PC / teléfono"
                    helperText="Esta imagen se verá con efecto visual destacado en el bloque de Ofertas Especiales"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPromoImageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPromoImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPromoImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Aplicar Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGAR ÍTEM A LA BÓVEDA SEGURA */}
      {showVaultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-emerald-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Cargar Ítem Cifrado a la Bóveda</span>
            </h3>

            <form onSubmit={handleCreateVaultItem} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">PRODUCTO ASOCIADO *</label>
                <select
                  required
                  value={vaultProdId}
                  onChange={(e) => setVaultProdId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">
                      {p.nombre} (${p.precio_base} USD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">IDENTIFICADOR PÚBLICO / NICK VISIBLE *</label>
                <input
                  type="text"
                  required
                  value={vaultIdentificador}
                  onChange={(e) => setVaultIdentificador(e.target.value)}
                  placeholder="Ej: Cuenta FF Sakura #02 - LVL 75 o Pase Booyah Código #1"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">INSTRUCCIONES DE ENTREGA PARA EL CLIENTE *</label>
                <textarea
                  required
                  rows={2}
                  value={vaultInstruccion}
                  onChange={(e) => setVaultInstruccion(e.target.value)}
                  placeholder="Ej: Iniciar sesión con los datos provistos y confirmar código de verificación en WhatsApp."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>CREDENCIALES SENSIBLES (SE CIFRAN CON PGCRYPTO) *</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={vaultSecret}
                  onChange={(e) => setVaultSecret(e.target.value)}
                  placeholder="usuario: gamer@gmail.com | pass: Secreto123! | 2FA: BackupCodes"
                  className="w-full px-3 py-2 rounded-lg bg-black/80 border border-emerald-500/40 text-xs font-mono text-emerald-200 outline-none resize-none"
                />
                <span className="text-[10px] text-slate-400 block">
                  🔒 La información sensible se guarda mediante encriptación simétrica en PostgreSQL y nunca se muestra en texto plano a los clientes.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">MODO DE ENTREGA</label>
                  <select
                    value={vaultTipoEntrega}
                    onChange={(e) => setVaultTipoEntrega(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="RAPIDA">Entrega Rápida (Inmediata)</option>
                    <option value="RESERVA_FECHA">Reserva Programada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">FECHA DE VENCIMIENTO (OPCIONAL)</label>
                  <input
                    type="date"
                    value={vaultFechaVencimiento}
                    onChange={(e) => setVaultFechaVencimiento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Si vence en ≤ 15 días, pasa a OFERTA ESPECIAL.
                  </span>
                </div>
              </div>

              {vaultTipoEntrega === "RESERVA_FECHA" && (
                <div>
                  <label className="block text-xs font-mono text-cyan-300 mb-1">FECHA DE RESERVA PROGRAMADA *</label>
                  <input
                    type="date"
                    required
                    value={vaultFechaReserva}
                    onChange={(e) => setVaultFechaReserva(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-xs text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50"
                >
                  {actionLoading ? "Cifrando y Guardando..." : "Guardar en Bóveda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR PRODUCTO COMPLETO (DIVISAS & RANGOS) */}
      {/* ======================================================== */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-7 rounded-3xl border border-amber-500/40 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black text-lg">
                  <Pencil className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                    <span>Modificar Producto: {editingProduct.nombre}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Edita precios base, divisas (VES/MXN), descuentos por rango e imagen.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-5">
              
              {/* DATOS BÁSICOS */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4" /> Datos Generales
                </span>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">NOMBRE DEL PRODUCTO *</label>
                  <input
                    type="text"
                    required
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">SUBCATEGORÍA VINCULADA</label>
                  <select
                    value={editSubcatId}
                    onChange={(e) => setEditSubcatId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-semibold outline-none focus:border-amber-500"
                  >
                    <option value="">General (Sin subcategoría específica)</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.categoria_nombre ? `(${s.categoria_nombre})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">PRECIO VENTA BASE (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editProdPrice}
                      onChange={(e) => setEditProdPrice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-bold font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">COSTO PROVEEDOR (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProdCost}
                      onChange={(e) => setEditProdCost(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">DESCRIPCIÓN / INSTRUCCIONES</label>
                  <textarea
                    value={editProdDesc}
                    onChange={(e) => setEditProdDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white outline-none h-18 resize-none"
                  />
                </div>

                <ImageUploadInput
                  label="Imagen Principal del Producto"
                  value={editProdImage}
                  onChange={setEditProdImage}
                  placeholder="https://... o subir archivo"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Visible en tienda pública</span>
                    <input
                      type="checkbox"
                      checked={editProdActive}
                      onChange={(e) => setEditProdActive(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">🔥 Oferta Especial (HOT)</span>
                    <input
                      type="checkbox"
                      checked={editProdSpecial}
                      onChange={(e) => setEditProdSpecial(e.target.checked)}
                      className="w-4 h-4 accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>

                {editProdSpecial && (
                  <div className="p-3.5 rounded-2xl bg-pink-950/30 border border-pink-500/40 space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      Banner Promocional de Oferta Especial
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditSpecialImageType("default")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                          editSpecialImageType === "default"
                            ? "bg-pink-600/30 border-pink-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="block font-bold">📷 Predeterminada</span>
                        <span className="text-[10px] text-slate-400 block truncate">Usa foto del producto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditSpecialImageType("exclusive")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                          editSpecialImageType === "exclusive"
                            ? "bg-pink-600/30 border-pink-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="block font-bold">✨ Banner Exclusivo</span>
                        <span className="text-[10px] text-slate-400 block truncate">Banner destacado</span>
                      </button>
                    </div>

                    {editSpecialImageType === "exclusive" && (
                      <div className="pt-1">
                        <ImageUploadInput
                          label="Banner Exclusivo de Oferta"
                          value={editSpecialImage}
                          onChange={setEditSpecialImage}
                          placeholder="https://... o arrastra una imagen"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONFIGURACIÓN DE DIVISAS: VES Y MXN */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> Configuración de Precios en Divisas Locales (VES / MXN)
                </span>

                {/* BOLÍVARES (VES) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      🇻🇪 BOLÍVARES (VES)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Tasa P2P: {tasaVes} Bs/$</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVesMode("auto")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVesMode === "auto"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">⚡ Automático</span>
                      <span className="text-[10px] text-slate-500 block">USD × Tasa P2P</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVesMode("ref")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVesMode === "ref"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🎯 Base USD Especial</span>
                      <span className="text-[10px] text-slate-500 block">Ej: $1.05 USD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVesMode("fixed")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVesMode === "fixed"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🔒 Precio Fijo Bs</span>
                      <span className="text-[10px] text-slate-500 block">Sin tasa</span>
                    </button>
                  </div>

                  {editVesMode === "ref" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        BASE USD REFERENCIAL PARA VES (Ej: Si el producto vale $0.95 en USDT pero para Bs quieres calcular a $1.05)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editRefVes}
                          onChange={(e) => setEditRefVes(e.target.value)}
                          placeholder="1.05"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                        />
                        {editRefVes && !isNaN(parseFloat(editRefVes)) && parseFloat(tasaVes) > 0 && (
                          <span className="text-[11px] font-mono text-amber-300 shrink-0 font-bold bg-amber-950/60 px-2 py-1.5 rounded-lg border border-amber-500/30">
                            ≈ {(parseFloat(editRefVes) * parseFloat(tasaVes)).toFixed(2)} Bs
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {editVesMode === "fixed" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        PRECIO FIJO EN BOLÍVARES (VES)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">Bs.</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editFijoVes}
                          onChange={(e) => setEditFijoVes(e.target.value)}
                          placeholder="45.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PESOS MEXICANOS (MXN) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      🇲🇽 PESOS MEXICANOS (MXN)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Tasa P2P: {tasaMxn} MXN/$</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMxnMode("auto")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editMxnMode === "auto"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">⚡ Automático</span>
                      <span className="text-[10px] text-slate-500 block">USD × Tasa P2P</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditMxnMode("fixed")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editMxnMode === "fixed"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🔒 Precio Fijo MXN</span>
                      <span className="text-[10px] text-slate-500 block">Sin depender de USD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditMxnMode("ref")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editMxnMode === "ref"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🎯 Base USD Especial</span>
                      <span className="text-[10px] text-slate-500 block">Base referencial</span>
                    </button>
                  </div>

                  {editMxnMode === "fixed" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        PRECIO FIJO DIRECTO EN PESOS MEXICANOS (MXN) - INDEPENDIENTE DEL DÓLAR
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">$ MXN</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editFijoMxn}
                          onChange={(e) => setEditFijoMxn(e.target.value)}
                          placeholder="25.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        💡 El cliente pagará exactamente este monto fijo en MXN sin depender de la tasa de Binance ni del dólar.
                      </span>
                    </div>
                  )}

                  {editMxnMode === "ref" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        BASE USD REFERENCIAL PARA MXN
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editRefMxn}
                          onChange={(e) => setEditRefMxn(e.target.value)}
                          placeholder="1.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                        />
                        {editRefMxn && !isNaN(parseFloat(editRefMxn)) && parseFloat(tasaMxn) > 0 && (
                          <span className="text-[11px] font-mono text-emerald-300 shrink-0 font-bold bg-emerald-950/60 px-2 py-1.5 rounded-lg border border-emerald-500/30">
                            ≈ ${(parseFloat(editRefMxn) * parseFloat(tasaMxn)).toFixed(2)} MXN
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CONFIGURACIÓN DE PRECIOS POR RANGO DE CLIENTE */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4" /> Precios por Rango de Cliente
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRankPricingMode("auto")}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      editRankPricingMode === "auto"
                        ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-[11px]">📊 Margen Porcentual</span>
                    <span className="text-[10px] text-slate-500 block">Reglas automáticas (4% al 20%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRankPricingMode("manual")}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      editRankPricingMode === "manual"
                        ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-[11px]">✍️ Manual Fijo por Rango</span>
                    <span className="text-[10px] text-slate-500 block">Fijar precio USD por nivel</span>
                  </button>
                </div>

                {editRankPricingMode === "manual" && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Ingresa el precio de venta en USD exclusivo para cada rango (los que dejes vacíos usarán el cálculo automático):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(rankRules.length > 0
                        ? rankRules
                        : [
                            { id: "1", rango: "default", porcentaje_ganancia: 20, descripcion: "Cliente Estándar" },
                            { id: "2", rango: "bronce", porcentaje_ganancia: 15, descripcion: "Bronce" },
                            { id: "3", rango: "plata", porcentaje_ganancia: 12, descripcion: "Plata" },
                            { id: "4", rango: "oro", porcentaje_ganancia: 8, descripcion: "Oro" },
                            { id: "5", rango: "diamante", porcentaje_ganancia: 4, descripcion: "Diamante Mayorista" },
                          ]
                      ).map((r) => (
                        <div key={r.rango} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold uppercase text-purple-300">{r.rango}</span>
                            <span className="text-slate-500">+{r.porcentaje_ganancia}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-mono">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editRankPrices[r.rango] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditRankPrices((prev) => ({ ...prev, [r.rango]: val }));
                              }}
                              placeholder={editProdPrice || "0.00"}
                              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingEditProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span>Guardar Cambios del Producto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR SUBPRODUCTO / VARIANTE */}
      {/* ======================================================== */}
      {showEditVariantModal && editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 sm:p-7 rounded-3xl border border-cyan-500/40 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white font-black text-lg">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">
                    Editar Subproducto: {editingVariant.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Producto principal: {editingVariantParentProd?.nombre || "General"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditVariantModal(false);
                  setEditingVariant(null);
                  setEditingVariantParentProd(null);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVariant} className="space-y-5">
              
              {/* DATOS BÁSICOS DEL SUBPRODUCTO */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-4 h-4" /> Datos del Paquete / Denominación
                </span>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">NOMBRE DEL SUBPRODUCTO *</label>
                  <input
                    type="text"
                    required
                    value={editVarName}
                    onChange={(e) => setEditVarName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">PRECIO VENTA (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editVarPrice}
                      onChange={(e) => setEditVarPrice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white font-bold font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">COSTO PROVEEDOR (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editVarCost}
                      onChange={(e) => setEditVarCost(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <ImageUploadInput
                  label="Imagen del Subproducto (Opcional)"
                  value={editVarImage}
                  onChange={setEditVarImage}
                  placeholder="https://... o subir imagen"
                  helperText="Si no se especifica, tomará la imagen del producto principal"
                />

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">Activo y disponible para compra</span>
                  <input
                    type="checkbox"
                    checked={editVarActive}
                    onChange={(e) => setEditVarActive(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* DIVISAS LOCALES PARA EL SUBPRODUCTO */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> Divisas para este Subproducto (VES / MXN)
                </span>

                {/* BOLÍVARES (VES) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">🇻🇪 BOLÍVARES (VES)</span>
                    <span className="text-[10px] font-mono text-slate-400">Tasa: {tasaVes} Bs/$</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVarVesMode("auto")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarVesMode === "auto"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">⚡ Automático</span>
                      <span className="text-[10px] text-slate-500 block">USD × Tasa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVarVesMode("ref")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarVesMode === "ref"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🎯 Base USD Especial</span>
                      <span className="text-[10px] text-slate-500 block">Ej: $1.05 USD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVarVesMode("fixed")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarVesMode === "fixed"
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🔒 Precio Fijo Bs</span>
                      <span className="text-[10px] text-slate-500 block">Sin tasa</span>
                    </button>
                  </div>

                  {editVarVesMode === "ref" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        BASE USD REFERENCIAL PARA VES (Ej: $1.05 para calcular en Bs)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editVarRefVes}
                          onChange={(e) => setEditVarRefVes(e.target.value)}
                          placeholder="1.05"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {editVarVesMode === "fixed" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        PRECIO FIJO EN BOLÍVARES (VES)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">Bs.</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editVarFijoVes}
                          onChange={(e) => setEditVarFijoVes(e.target.value)}
                          placeholder="45.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PESOS MEXICANOS (MXN) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 font-mono">🇲🇽 PESOS MEXICANOS (MXN)</span>
                    <span className="text-[10px] font-mono text-slate-400">Tasa: {tasaMxn} MXN/$</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVarMxnMode("auto")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarMxnMode === "auto"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">⚡ Automático</span>
                      <span className="text-[10px] text-slate-500 block">USD × Tasa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVarMxnMode("fixed")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarMxnMode === "fixed"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🔒 Precio Fijo MXN</span>
                      <span className="text-[10px] text-slate-500 block">Sin depender de USD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVarMxnMode("ref")}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        editVarMxnMode === "ref"
                          ? "bg-emerald-600/20 border-emerald-500/50 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px]">🎯 Base USD Especial</span>
                      <span className="text-[10px] text-slate-500 block">Base referencial</span>
                    </button>
                  </div>

                  {editVarMxnMode === "fixed" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        PRECIO FIJO DIRECTO EN PESOS MEXICANOS (MXN)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">$ MXN</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editVarFijoMxn}
                          onChange={(e) => setEditVarFijoMxn(e.target.value)}
                          placeholder="25.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {editVarMxnMode === "ref" && (
                    <div className="pt-1">
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        BASE USD REFERENCIAL PARA MXN
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editVarRefMxn}
                          onChange={(e) => setEditVarRefMxn(e.target.value)}
                          placeholder="1.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PRECIOS POR RANGO PARA EL SUBPRODUCTO */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4" /> Precios por Rango de Cliente para este Subproducto
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditVarRankPricingMode("auto")}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      editVarRankPricingMode === "auto"
                        ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-[11px]">📊 Margen Porcentual</span>
                    <span className="text-[10px] text-slate-500 block">Reglas automáticas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditVarRankPricingMode("manual")}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      editVarRankPricingMode === "manual"
                        ? "bg-purple-600/20 border-purple-500/50 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-[11px]">✍️ Manual Fijo por Rango</span>
                    <span className="text-[10px] text-slate-500 block">Precio USD por nivel</span>
                  </button>
                </div>

                {editVarRankPricingMode === "manual" && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Ingresa el precio de venta en USD exclusivo de este paquete para cada rango:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(rankRules.length > 0
                        ? rankRules
                        : [
                            { id: "1", rango: "default", porcentaje_ganancia: 20, descripcion: "Cliente Estándar" },
                            { id: "2", rango: "bronce", porcentaje_ganancia: 15, descripcion: "Bronce" },
                            { id: "3", rango: "plata", porcentaje_ganancia: 12, descripcion: "Plata" },
                            { id: "4", rango: "oro", porcentaje_ganancia: 8, descripcion: "Oro" },
                            { id: "5", rango: "diamante", porcentaje_ganancia: 4, descripcion: "Diamante Mayorista" },
                          ]
                      ).map((r) => (
                        <div key={r.rango} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold uppercase text-purple-300">{r.rango}</span>
                            <span className="text-slate-500">+{r.porcentaje_ganancia}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-mono">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editVarRankPrices[r.rango] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditVarRankPrices((prev) => ({ ...prev, [r.rango]: val }));
                              }}
                              placeholder={editVarPrice || "0.00"}
                              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditVariantModal(false);
                    setEditingVariant(null);
                    setEditingVariantParentProd(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditVariant}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingEditVariant ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Guardar Cambios del Subproducto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR / EDITAR MÉTODO DE PAGO MANUAL */}
      {/* ======================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 sm:p-7 rounded-3xl border border-fuchsia-500/40 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingPaymentMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configura los datos para que el cliente transfiera en el checkout
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPaymentMethod(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              {/* Moneda y Nombre del Método */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1 font-bold">
                    MONEDA *
                  </label>
                  <select
                    value={pmMoneda}
                    onChange={(e) => setPmMoneda(e.target.value as "USD" | "VES" | "MXN")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono outline-none"
                  >
                    <option value="VES">VES (Bolívares)</option>
                    <option value="USD">USD / USDT</option>
                    <option value="MXN">MXN (Pesos Mexicanos)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-slate-300 block mb-1 font-bold">
                    NOMBRE DEL MÉTODO *
                  </label>
                  <input
                    type="text"
                    required
                    value={pmNombreMetodo}
                    onChange={(e) => setPmNombreMetodo(e.target.value)}
                    placeholder="Ej: Pago Móvil Mercantil, Binance Pay USDT..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-fuchsia-500 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Sección Dinámica: Creador de Campos Visibles para el Cliente */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-[11px] font-mono text-[#FFF01F] font-bold uppercase tracking-wider block">
                      CAMPOS VISIBLES PARA EL CLIENTE ({pmCampos.length}) *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Crea los datos que el cliente o revendedor verá en el checkout (ej: Banco, Teléfono, CI, Titular).
                    </p>
                  </div>

                  {/* Plantillas Rápidas */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">Plantilla:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPaymentPreset("pago_movil")}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Pago Móvil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPaymentPreset("binance")}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Binance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPaymentPreset("spei")}
                      className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>SPEI MX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPaymentPreset("transferencia")}
                      className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Transferencia</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Campos Editables */}
                <div className="space-y-2.5">
                  {pmCampos.map((campo, index) => (
                    <div
                      key={campo.id || index}
                      className="p-3 rounded-2xl bg-black/50 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-mono font-bold">
                          Campo #{index + 1}
                        </span>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 font-mono select-none">
                            <input
                              type="checkbox"
                              checked={campo.copiable !== false}
                              onChange={(e) => handleUpdatePaymentCampo(index, "copiable", e.target.checked)}
                              className="w-3.5 h-3.5 accent-[#FFF01F] rounded cursor-pointer"
                            />
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3 text-[#FFF01F]" />
                              <span>Botón Copiar Individual</span>
                            </span>
                          </label>

                          {pmCampos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentCampo(index)}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                              title="Eliminar campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            value={campo.etiqueta}
                            onChange={(e) => handleUpdatePaymentCampo(index, "etiqueta", e.target.value)}
                            placeholder="Nombre: Banco, Número, CI..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-fuchsia-500 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            required
                            value={campo.valor}
                            onChange={(e) => handleUpdatePaymentCampo(index, "valor", e.target.value)}
                            placeholder="Dato visible: 04248901572, Mercantil..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#FFF01F] text-xs text-white outline-none font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddPaymentCampo}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-fuchsia-500/40 hover:border-fuchsia-500 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 text-fuchsia-300 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Otro Campo Visible</span>
                  </button>
                </div>

                {/* Vista Previa en Vivo (Checkout) */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-fuchsia-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-fuchsia-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                      Vista previa en Checkout (Cliente / Revendedor):
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pmCampos.filter((c) => c.etiqueta.trim() || c.valor.trim()).length} campos visibles
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {pmCampos
                      .filter((c) => c.etiqueta.trim() || c.valor.trim())
                      .map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-white/10 text-xs gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block truncate">
                              {c.etiqueta || "Campo"}:
                            </span>
                            <span className="font-bold text-white font-mono break-all block mt-0.5">
                              {c.valor || "---"}
                            </span>
                          </div>
                          {c.copiable !== false && (
                            <span className="px-2 py-1 rounded-lg bg-white/10 text-slate-300 text-[10px] font-mono flex items-center gap-1 shrink-0 select-none">
                              <Copy className="w-3 h-3 text-[#FFF01F]" />
                              <span>Copiar</span>
                            </span>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Botón Universal Copiar Todo */}
                  <div className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 text-[#FFF01F] text-xs font-bold font-mono flex items-center justify-center gap-2 select-none">
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copiar Todo (Disponible para todos los métodos)</span>
                  </div>
                </div>
              </div>

              {/* Instrucciones adicionales */}
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  INSTRUCCIONES / NOTAS PARA EL CLIENTE
                </label>
                <textarea
                  rows={2}
                  value={pmInstrucciones}
                  onChange={(e) => setPmInstrucciones(e.target.value)}
                  placeholder="Ej: Por favor enviar el monto exacto, colocar tu referencia bancaria y subir la captura del comprobante."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-fuchsia-500 text-xs text-white outline-none"
                />
              </div>

              {/* QR de Pago */}
              <ImageUploadInput
                label="Código QR de Pago (Opcional)"
                value={pmQrImagenUrl}
                onChange={(url) => setPmQrImagenUrl(url)}
                placeholder="https://... o sube el QR"
                helperText="Sube el código QR de Pago Móvil o Binance Pay para que los clientes escaneen"
              />

              {/* Orden y Activo */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-mono text-slate-300 font-bold">
                    Orden de Visualización:
                  </label>
                  <input
                    type="number"
                    value={pmOrden}
                    onChange={(e) => setPmOrden(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono text-center"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pmActivo}
                    onChange={(e) => setPmActivo(e.target.checked)}
                    className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Método Activo en Tienda
                  </span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setEditingPaymentMethod(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPaymentMethod}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPaymentMethod ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>{editingPaymentMethod ? "Actualizar Método" : "Guardar Método"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VISOR DE COMPROBANTE DE PAGO */}
      {/* ======================================================== */}
      {previewVoucherUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-[#0B0D13] border border-white/20 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FFF01F]" />
                <span>Comprobante de Pago del Cliente</span>
              </h3>
              <button
                onClick={() => setPreviewVoucherUrl(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={previewVoucherUrl}
                alt="Comprobante"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewVoucherUrl(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
