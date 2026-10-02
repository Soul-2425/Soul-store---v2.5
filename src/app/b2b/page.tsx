"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Calculator, 
  Plus, 
  Flame, 
  TrendingUp, 
  Repeat, 
  Search, 
  ArrowUpRight, 
  ShieldCheck, 
  DollarSign,
  UserCheck,
  Tag,
  Phone,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function B2BDashboardPage() {
  // Mock CRM data for demonstration of Module 7
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [sellingPrice, setSellingPrice] = useState<number>(1.50);
  const [costPrice, setCostPrice] = useState<number>(0.85); // Costo Soul Store B2B

  const netProfit = (sellingPrice - costPrice).toFixed(2);
  const marginPercent = costPrice > 0 ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1) : "0.0";

  const clients = [
    {
      id: "1",
      name: "Juan Pérez",
      phone: "+58 414 9876543",
      gameId: "248910291",
      category: "Mis Panas",
      favoriteProduct: "Free Fire - 100 Diamantes",
      costSoulStore: 0.85,
      lastSoldAt: 1.50,
    },
    {
      id: "2",
      name: "Cyber Centro Gaming",
      phone: "+58 424 5551234",
      gameId: "982310442",
      category: "Cyber Clientes",
      favoriteProduct: "Free Fire - 310 Diamantes",
      costSoulStore: 2.50,
      lastSoldAt: 3.80,
    },
    {
      id: "3",
      name: "Alex Rojas",
      phone: "+58 412 8889900",
      gameId: "776102931",
      category: "Mis Panas",
      favoriteProduct: "Pase Booyah",
      costSoulStore: 1.99,
      lastSoldAt: 3.20,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090e] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 p-0.5 shadow-cyanGlow">
                <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold text-white text-lg tracking-wider">
                SOUL<span className="text-cyan-400">B2B</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
              Tier: Revendedor Grado 2 (6% Extra)
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              Volver a la Tienda
            </Link>
            <button className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-cyanGlow text-xs hover:opacity-90 transition">
              + Nueva Orden Rápida
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome & Stats Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-purple-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PANEL EXCLUSIVO PARA SOCIOS REVENDEDORES</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Centro de Operaciones y Agenda B2B
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Gestiona tus clientes fijos, reordena recargas con un clic y calcula tu margen de ganancia neta en tiempo real.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl min-w-[130px]">
                <span className="text-[11px] font-mono text-slate-400 block">Clientes Guardados</span>
                <span className="text-2xl font-bold text-white">24</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl min-w-[130px]">
                <span className="text-[11px] font-mono text-slate-400 block">Ganancia Mes</span>
                <span className="text-2xl font-bold text-emerald-400">+$148.50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Calculadora de Ganancia Neta (Módulo 7.2) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Calculadora de Margen & Ganancia Neta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">COSTO SOUL STORE (USD)</label>
              <input 
                type="number" 
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">PRECIO VENTA A TU CLIENTE (USD)</label>
              <input 
                type="number" 
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Tu Ganancia Neta</span>
              <span className="text-xl font-black text-emerald-400">+${netProfit} USD</span>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Margen Obtenido</span>
              <span className="text-xl font-black text-cyan-400">{marginPercent}%</span>
            </div>
          </div>
        </div>

        {/* Section 2: CRM de Clientes Fijos (Módulo 7.1) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Agenda de Clientes Fijos (CRM)</span>
              </h2>
              <p className="text-xs text-slate-400">Guarda identificadores y agiliza las compras de tus clientes recurrentes.</p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl glass-panel text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Nueva Categoría CRM</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-cyanGlow transition">
                <Plus className="w-4 h-4" />
                <span>Agregar Cliente Fijo</span>
              </button>
            </div>
          </div>

          {/* CRM Filter Pills */}
          <div className="flex gap-2 border-b border-slate-800 pb-3">
            <button 
              onClick={() => setSelectedCategory("todos")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selectedCategory === "todos" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
            >
              Todos (3)
            </button>
            <button 
              onClick={() => setSelectedCategory("Mis Panas")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selectedCategory === "Mis Panas" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
            >
              Mis Panas (2)
            </button>
            <button 
              onClick={() => setSelectedCategory("Cyber Clientes")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selectedCategory === "Cyber Clientes" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
            >
              Cyber Clientes (1)
            </button>
          </div>

          {/* Clientes Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Player ID / Contacto</th>
                    <th className="py-3.5 px-4">Producto Frecuente</th>
                    <th className="py-3.5 px-4">Tu Precio Venta</th>
                    <th className="py-3.5 px-4 text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {clients
                    .filter((c) => selectedCategory === "todos" || c.category === selectedCategory)
                    .map((client) => (
                      <tr key={client.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          {client.name}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono border border-slate-700 text-slate-300">
                            {client.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">
                          <span className="text-cyan-400 font-bold block">{client.gameId}</span>
                          <span className="text-slate-500">{client.phone}</span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-300">
                          {client.favoriteProduct}
                        </td>
                        <td className="py-4 px-4 font-mono text-sm text-emerald-400">
                          ${client.lastSoldAt.toFixed(2)} USD
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow transition inline-flex items-center gap-1.5 active:scale-95">
                            <Repeat className="w-3.5 h-3.5" />
                            <span>Reordenar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
