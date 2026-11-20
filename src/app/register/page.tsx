"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock, User, Phone, Tag, ArrowRight, AlertCircle, Loader2, CheckCircle2, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codigoReferido, setCodigoReferido] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeInfo, setCodeInfo] = useState<{ valid: boolean; rango_asignado?: string; nombre_rango?: string; error?: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  // Leer si vino con enlace de invitación: ?codigo=SOUL-... o ?ref=SOUL-...
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("codigo") || params.get("ref");
      if (ref) {
        const clean = ref.toUpperCase().trim();
        setCodigoReferido(clean);
        validateCode(clean);
      }
    }
  }, []);

  const validateCode = async (codeToTest: string) => {
    const clean = codeToTest.trim().toUpperCase();
    if (!clean) {
      setCodeInfo(null);
      return;
    }
    setValidatingCode(true);
    try {
      const res = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: clean }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCodeInfo({
          valid: true,
          rango_asignado: data.rango_asignado,
          nombre_rango: data.nombre_rango,
        });
      } else {
        setCodeInfo({ valid: false, error: data.error || "Código promocional no válido" });
      }
    } catch {
      setCodeInfo({ valid: false, error: "Error de conexión al validar código" });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    if (codigoReferido.trim() && codeInfo && !codeInfo.valid) {
      setErrorMsg(`El código promocional no es válido: ${codeInfo.error}`);
      return;
    }

    setLoading(true);

    try {
      const targetRango = codeInfo?.valid && codeInfo.rango_asignado ? codeInfo.rango_asignado : "cliente_4";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            nickname,
            telefono_whatsapp: telefonoWhatsapp,
            rango: targetRango,
          },
        },
      });

      if (error) throw error;

      // Autoiniciar sesión inmediatamente para que entre directo con sesión activa
      if (!data.session) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      // Si ingresó código promocional válido, marcarlo como usado
      if (codigoReferido.trim() && codeInfo?.valid) {
        try {
          await fetch("/api/referrals/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codigo: codigoReferido.trim(),
              user_id: data.user?.id,
            }),
          });
        } catch (redeemErr) {
          console.warn("Error al registrar canje de código:", redeemErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "Error al registrar la cuenta.");
      } else {
        setErrorMsg("Error desconocido al registrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "Error al conectar con Google.");
      }
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090e] relative overflow-hidden py-12">
      {/* Background Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-fuchsia-500/20 relative z-10 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-cyan-500 p-0.5 shadow-glow">
              <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-fuchsia-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-wider text-white">
              SOUL<span className="text-cyan-400">STORE</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Crea tu Cuenta</h2>
          <p className="text-xs text-slate-400 mt-1">
            Regístrate en un clic con Google o completa tus datos
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>¡Cuenta creada con éxito! Redirigiendo...</span>
          </div>
        )}

        {/* Botón de Registro Rápido con Google */}
        <button
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          type="button"
          className="w-full py-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 text-white text-sm font-semibold transition flex items-center justify-center gap-3 mb-6 shadow-sm active:scale-95 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                />
              </svg>
              <span>Registrarse con Google</span>
            </>
          )}
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-[#111119] text-[11px] font-mono text-slate-500 uppercase">
            o regístrate con correo
          </span>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">NOMBRE *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Carlos"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">APELLIDO</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="La Rosa"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">NICKNAME *</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="SoulGamer99"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">WHATSAPP *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="tel"
                  required
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  placeholder="+58 412 1234567"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">CORREO ELECTRÓNICO *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">CONTRASEÑA *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-fuchsia-500 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-slate-300">REPETIR CONTRASEÑA *</label>
              {confirmPassword.length > 0 && (
                <span className={`text-[10px] font-mono font-bold ${password === confirmPassword ? "text-emerald-400" : "text-amber-400"}`}>
                  {password === confirmPassword ? "✓ Coinciden" : "✕ No coinciden"}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña exactamente"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border text-sm text-white placeholder-slate-500 outline-none transition ${
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "border-amber-500/80 focus:border-amber-500"
                    : confirmPassword.length > 0 && password === confirmPassword
                    ? "border-emerald-500/80 focus:border-emerald-500"
                    : "border-slate-700/80 focus:border-fuchsia-500"
                }`}
              />
            </div>
          </div>

          {/* Código de Invitación / Referido para asignación directa de rango */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>CÓDIGO DE INVITACIÓN / REFERIDO (OPCIONAL)</span>
              </label>
              {validatingCode && (
                <span className="text-[10px] font-mono text-amber-400 animate-pulse">Verificando...</span>
              )}
            </div>
            <div className="relative">
              <Gift className="w-4 h-4 absolute left-3 top-3 text-amber-400/70" />
              <input
                type="text"
                value={codigoReferido}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/\s+/g, "");
                  setCodigoReferido(val);
                  if (val.length >= 6) {
                    validateCode(val);
                  } else {
                    setCodeInfo(null);
                  }
                }}
                placeholder="Ej: SOUL-REV4-VIP"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 focus:border-amber-400 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none uppercase transition shadow-inner"
              />
            </div>
            {codeInfo && (
              <div
                className={`mt-1.5 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border animate-in fade-in ${
                  codeInfo.valid
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {codeInfo.valid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>¡Código Válido! Te otorgará el rango: {codeInfo.nombre_rango}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{codeInfo.error}</span>
                  </>
                )}
              </div>
            )}
            <span className="text-[10px] text-slate-500 mt-1 block">
              Si un administrador te dio un código exclusivo de revendedor o cliente VIP, ingrésalo aquí.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Completar Registro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
