export interface NotificationVariables {
  producto?: string | null;
  variante?: string | null;
  cliente?: string | null;
  pedido_id?: string | null;
  monto?: string | number | null;
  moneda?: string | null;
  metodo_pago?: string | null;
  whatsapp?: string | null;
  jugador_id?: string | null;
  [key: string]: any;
}

export const DEFAULT_NOTIFICATION_TEMPLATES = {
  admin_titulo_template: "🟢 Nuevo Pedido: {producto} - {variante}",
  admin_cuerpo_template: "📦 Se registró un nuevo pedido de {cliente} por ${monto} {moneda} ({metodo_pago}). Toca aquí para revisar el comprobante y despachar.",
  admin_url_template: "/admin?tab=pedidos&order_id={pedido_id}",
  cliente_titulo_template: "🟢 Soul Store • ¡Tu recarga de {producto} ({variante}) está lista! ✅",
  cliente_cuerpo_template: "🎉 ¡Hola {cliente}! Tu pedido #{pedido_id} de {producto} ({variante}) ha sido completado con éxito. Revisa tu cuenta.",
};

export function interpolateTemplate(template: string, vars: NotificationVariables): string {
  if (!template) return "";
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const strVal = val !== null && val !== undefined ? String(val) : "";
    result = result.replace(new RegExp(`\\{${key}\\}`, "gi"), strVal);
  }
  // Limpiar paréntesis o guiones vacíos si no hay variante
  result = result
    .replace(/\(\s*\)/g, "")
    .replace(/\s-\s(?=[\s\.,]|$)/g, " ")
    .replace(/\s\s+/g, " ")
    .trim();
  return result;
}
