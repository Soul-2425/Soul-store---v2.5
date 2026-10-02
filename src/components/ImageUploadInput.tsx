"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Link as LinkIcon, X, Check, Loader2 } from "lucide-react";

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  placeholder = "https://ejemplo.com/imagen.png",
  helperText = "Sube una imagen desde tu PC/móvil o ingresa un enlace",
}: ImageUploadInputProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimizar y comprimir imagen en cliente a WebP (~40-80KB)
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)");
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 800; // Máximo ancho/alto para avatar/producto
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/webp", 0.85));
          };
          img.onerror = () => resolve(e.target?.result as string);
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onChange(dataUrl);
    } catch (err) {
      console.error("Error al procesar imagen:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded transition ${
              mode === "upload" ? "bg-fuchsia-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded transition ${
              mode === "url" ? "bg-fuchsia-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Pegar URL
          </button>
        </div>
      </div>

      {/* Si ya hay imagen seleccionada, mostrar previsualización */}
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700">
          <div className="w-14 h-14 rounded-lg bg-black/50 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {value.startsWith("data:") ? "Imagen cargada localmente (WebP optimizado)" : value}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-mono">
              <Check className="w-3 h-3" /> Imagen lista
            </span>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition"
            title="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : mode === "upload" ? (
        /* Zona de subida de archivo / drag & drop */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-fuchsia-500 bg-fuchsia-500/10"
              : "border-slate-700 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs text-fuchsia-400 font-medium py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Optimizando imagen...</span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Upload className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200">
                  Haz clic para buscar imagen o arrástrala aquí
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Soporta PNG, JPG, WEBP, GIF (Se optimiza automáticamente)
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Input para pegar URL directa */
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-fuchsia-500 text-xs text-white outline-none pl-9 font-mono"
          />
          <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      )}

      {helperText && !value && (
        <span className="text-[10px] text-slate-400 font-mono block pl-1">
          {helperText}
        </span>
      )}
    </div>
  );
}
