import React, { useState } from "react";
import { ImageOff, ShieldAlert } from "lucide-react";

export default function ObsidianImage({ src, alt, width, isError, errorMessage }) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const parsedWidth = width ? (typeof width === "number" ? `${width}px` : width) : null;
  const containerStyle = parsedWidth
    ? { width: parsedWidth, maxWidth: "100%" }
    : { maxWidth: "100%" };

  if (isError || hasError) {
    if (process.env.NODE_ENV === "development" && errorMessage) {
      console.warn(`[ObsidianImage] Failed to load image "${alt || src}":`, errorMessage);
    }
    return (
      <div
        style={containerStyle}
        className="my-3 border border-red-500/30 bg-red-950/20 rounded-lg p-3 flex items-center gap-3 text-red-300 shadow-md max-w-full"
      >
        <ImageOff className="w-5 h-5 text-red-400 shrink-0" />
        <div className="font-mono text-xs overflow-hidden">
          <div className="font-bold text-red-400 uppercase tracking-wide text-[11px]">
            Изображение не найдено
          </div>
          <div className="text-[10px] text-gray-400 truncate mt-0.5">
            {alt || src || "Неизвестный файл"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className="my-3 flex flex-col items-center group relative overflow-hidden rounded-lg border border-cyber-purple/20 bg-[#0e091a]/50 p-1.5 shadow-lg transition-all hover:border-cyber-purple/50 max-w-full"
    >
      {/* Corner indicators */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />

      {loading && (
        <div className="w-full h-36 flex flex-col items-center justify-center gap-2 bg-cyber-purple/5 rounded animate-pulse">
          <div className="w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-cyber-purple font-mono uppercase tracking-wider">
            Загрузка...
          </span>
        </div>
      )}

      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        onLoad={() => {
          if (import.meta.env.DEV) {
            console.error("[IMAGE IMG ONLOAD]", {
              alt,
              src,
            });
          }
          setLoading(false);
        }}
        onError={(event) => {
          if (import.meta.env.DEV) {
            console.error("[IMAGE IMG ONERROR]", {
              alt,
              src: event.currentTarget?.src || src,
            });
          }
          setLoading(false);
          setHasError(true);
        }}
        className={`rounded object-contain select-none max-w-full transition-transform duration-300 group-hover:scale-[1.01] ${
          loading ? "hidden" : "block"
        }`}
        style={parsedWidth ? { width: "100%", height: "auto" } : { maxHeight: "480px" }}
      />

      {alt && !loading && (
        <div className="text-[10px] text-gray-400 font-mono mt-1.5 uppercase tracking-wide truncate max-w-full px-2 text-center">
          {alt}
        </div>
      )}
    </div>
  );
}
