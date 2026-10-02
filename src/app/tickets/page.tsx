"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Headphones, 
  Send, 
  Clock, 
  CheckCheck, 
  MessageSquare, 
  Flame, 
  Plus, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  X,
  User,
  ShieldAlert
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Ticket {
  id: string;
  codigo_ticket: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  pedido_id: string | null;
  asunto_motivo: string;
  descripcion: string;
  estado: "ABIERTO" | "EN_PROCESO" | "RESUELTO" | "CERRADO";
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  creado_en: string;
  actualizado_en: string;
  mensajes_no_leidos?: number;
}

interface Message {
  id: string;
  ticket_id: string;
  remitente_id: string | null;
  remitente_nombre: string | null;
  es_admin: boolean;
  mensaje: string;
  leido: boolean;
  adjunto_url: string | null;
  creado_en: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Modal para crear nuevo ticket
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newAsunto, setNewAsunto] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newPrioridad, setNewPrioridad] = useState<"BAJA" | "MEDIA" | "ALTA" | "URGENTE">("MEDIA");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Cargar lista de tickets desde la base de datos
  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok && data.tickets) {
        setTickets(data.tickets);
        if (data.tickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // 2. Cargar mensajes del ticket seleccionado
  const fetchMessages = async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchMessages(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Suscripción en tiempo real vía Supabase Realtime
  useEffect(() => {
    if (!selectedTicketId) return;

    const channel = supabase
      .channel(`chat_ticket_${selectedTicketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_soporte",
          filter: `ticket_id=eq.${selectedTicketId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicketId]);

  // 4. Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId || sendingMessage) return;

    const textToSend = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: textToSend,
          es_admin: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // 5. Crear nuevo ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsunto.trim() || !newDescripcion.trim() || creatingTicket) return;

    setCreatingTicket(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asunto_motivo: newAsunto.trim(),
          descripcion: newDescripcion.trim(),
          prioridad: newPrioridad,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        setShowNewTicketModal(false);
        setNewAsunto("");
        setNewDescripcion("");
        setNewPrioridad("MEDIA");
        await fetchTickets();
        setSelectedTicketId(data.ticket.id);
      }
    } catch (err) {
      console.error("Error al crear ticket:", err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="min-h-screen bg-[#09090e] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-cyan-500 p-0.5 shadow-glow">
                <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4 h-4 text-fuchsia-400" />
                </div>
              </div>
              <span className="font-extrabold text-white text-lg tracking-wider">
                SOUL<span className="text-fuchsia-400">SOPORTE</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Activo</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="text-xs text-slate-300 hover:text-white transition px-3 py-1.5 rounded-lg glass-panel hover:border-slate-700"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Support Interface */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Tickets List */}
        <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden max-h-[82vh]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-fuchsia-400" />
              <span>Tickets de Soporte</span>
              <span className="text-xs font-mono text-slate-500">({tickets.length})</span>
            </h2>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="p-1.5 px-2.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition text-xs font-bold flex items-center gap-1 shadow-glow"
              title="Crear nuevo ticket"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {loadingTickets ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center p-8 space-y-2">
                <Headphones className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No tienes tickets creados aún.</p>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="text-xs text-fuchsia-400 hover:underline font-bold"
                >
                  Abrir primer ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-fuchsia-600/15 border border-fuchsia-500/40 shadow-glow"
                        : "hover:bg-slate-900/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-fuchsia-300">
                        {t.codigo_ticket}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.estado === "ABIERTO"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : t.estado === "EN_PROCESO"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : t.estado === "RESUELTO"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.estado}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white line-clamp-1">
                      {t.asunto_motivo}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>{t.usuario_nombre || "Cliente"}</span>
                      <span>{new Date(t.actualizado_en).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread */}
        <div className="md:col-span-2 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden max-h-[82vh]">
          {selectedTicket ? (
            <>
              {/* Ticket Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-black/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-fuchsia-400">
                      {selectedTicket.codigo_ticket}
                    </span>
                    <span className="text-slate-600">•</span>
                    <h3 className="font-bold text-white text-sm">
                      {selectedTicket.asunto_motivo}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Cliente: <strong className="text-slate-200">{selectedTicket.usuario_nombre}</strong></span>
                    <span>•</span>
                    <span className={`uppercase font-bold ${
                      selectedTicket.prioridad === "URGENTE" ? "text-red-400" :
                      selectedTicket.prioridad === "ALTA" ? "text-amber-400" : "text-slate-400"
                    }`}>
                      Prioridad {selectedTicket.prioridad}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300">
                    {selectedTicket.estado}
                  </span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#08080c]/50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 text-xs">
                    No hay mensajes en este ticket. Envía el primero para iniciar la conversación.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.es_admin;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-mono text-slate-500">
                            {isAdmin ? "🛡️ Soporte Soul Store" : (m.remitente_nombre || "Tú")}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {new Date(m.creado_en).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-sm"
                              : "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-glow rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.mensaje}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-black/40 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje al soporte de Soul Store..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-fuchsia-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enviar</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">
                Selecciona un ticket para ver la conversación
              </p>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-bold text-xs shadow-glow hover:bg-fuchsia-500 transition"
              >
                + Crear Nuevo Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREAR NUEVO TICKET */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-fuchsia-500/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Headphones className="w-5 h-5 text-fuchsia-400" />
                <span>Nuevo Ticket de Soporte</span>
              </h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">ASUNTO O MOTIVO *</label>
                <input
                  type="text"
                  required
                  value={newAsunto}
                  onChange={(e) => setNewAsunto(e.target.value)}
                  placeholder="Ej: Acreditación de diamantes Free Fire pendiente"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-fuchsia-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">PRIORIDAD</label>
                <select
                  value={newPrioridad}
                  onChange={(e) => setNewPrioridad(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-fuchsia-500 outline-none"
                >
                  <option value="BAJA">Baja (Consultas generales)</option>
                  <option value="MEDIA">Media (Dudas de pagos o métodos)</option>
                  <option value="ALTA">Alta (Retraso en entrega)</option>
                  <option value="URGENTE">Urgente (Error en Player ID / Doble cargo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">DESCRIPCIÓN DETALLADA *</label>
                <textarea
                  required
                  rows={4}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder="Describe qué ocurrió, tu Player ID y cualquier detalle de la transacción..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-fuchsia-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Abrir Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
