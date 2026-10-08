"use client";

import React from "react";
import { Plus, Trash2, Key, Mail, User, Globe, Server, Hash, ShieldCheck, Sparkles } from "lucide-react";

export interface DynamicFieldItem {
  id: string;
  nombre: string;
  placeholder: string;
  tipo: "text" | "password" | "number" | "select";
  obligatorio: boolean;
}

interface DynamicFieldsBuilderProps {
  fields: DynamicFieldItem[];
  onChange: (fields: DynamicFieldItem[]) => void;
  title?: string;
  subtitle?: string;
  levelName?: string;
}

export default function DynamicFieldsBuilder({
  fields = [],
  onChange,
  title = "Datos a Solicitar al Cliente (Campos Dinámicos)",
  subtitle = "Configura los datos que el cliente deberá completar al comprar (ej: Player ID, Región, Correo, Clave, Servidor)",
  levelName = "este nivel",
}: DynamicFieldsBuilderProps) {
  const addPreset = (nombre: string, placeholder: string, tipo: "text" | "password" | "number" = "text") => {
    const newField: DynamicFieldItem = {
      id: String(Date.now()) + Math.random().toString(36).substring(2, 6),
      nombre,
      placeholder,
      tipo,
      obligatorio: true,
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<DynamicFieldItem>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3.5 shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider block">
              {title}
            </span>
            <p className="text-[10px] text-slate-400 leading-tight">
              {subtitle} <span className="text-purple-400 font-semibold">({levelName})</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => addPreset("", "Escribe aquí...", "text")}
          className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-bold font-mono flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Campo Personalizado</span>
        </button>
      </div>

      {/* Botones de Acceso Rápido / Presets populares */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] font-mono text-slate-500 mr-1">Presets Rápidos:</span>
        <button
          type="button"
          onClick={() => addPreset("ID de Jugador", "Ej: 123456789", "text")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <User className="w-3 h-3 text-cyan-400" />
          <span>+ ID Jugador</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset("Región", "Ej: Sudamérica, EE.UU, Europa", "text")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>+ Región</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset("Correo Electrónico", "ejemplo@gmail.com", "text")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <Mail className="w-3 h-3 text-amber-400" />
          <span>+ Correo</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset("Clave / Contraseña", "Ingresa tu contraseña", "password")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <Key className="w-3 h-3 text-pink-400" />
          <span>+ Contraseña / Clave</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset("Servidor", "Ej: SA-1, NA-East", "text")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <Server className="w-3 h-3 text-purple-400" />
          <span>+ Servidor</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset("Riot ID / Tag", "Ej: Player#LAN", "text")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/40 text-[10px] font-mono flex items-center gap-1 transition"
        >
          <Hash className="w-3 h-3 text-rose-400" />
          <span>+ Riot ID / Tag</span>
        </button>
      </div>

      {/* Lista de campos dinámicos configurados */}
      {fields.length === 0 ? (
        <div className="p-3 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
          Sin campos dinámicos específicos aún. Si se deja vacío, el checkout solicitará los campos por defecto (Player ID / Región).
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/30 transition space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1">
                  <span>Campo #{idx + 1}</span>
                  {field.obligatorio && (
                    <span className="text-red-400 text-[10px] font-bold" title="Obligatorio">*</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[10px] font-mono text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.obligatorio}
                      onChange={(e) => updateField(field.id, { obligatorio: e.target.checked })}
                      className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
                    />
                    <span>Obligatorio</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Nombre que verá el cliente *</label>
                  <input
                    type="text"
                    required
                    value={field.nombre}
                    onChange={(e) => updateField(field.id, { nombre: e.target.value })}
                    placeholder="Ej: ID de Jugador, Correo, Clave..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-medium outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Texto de ayuda / Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Ej: Escribe tu ID aquí..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Tipo de Campo</label>
                  <select
                    value={field.tipo}
                    onChange={(e) => updateField(field.id, { tipo: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-purple-500"
                  >
                    <option value="text">Texto</option>
                    <option value="password">Contraseña (Oculta)</option>
                    <option value="number">Número</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
