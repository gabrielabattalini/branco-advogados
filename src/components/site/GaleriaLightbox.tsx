"use client";

import { useEffect, useState } from "react";
import { COR } from "./ui";

type Foto = { src: string; cap: string };

// Grade de fotos que abrem em tela cheia (lightbox), com navegação por setas.
export function GaleriaLightbox({
  fotos,
  colunas = 3,
}: {
  fotos: Foto[];
  colunas?: number;
}) {
  const [aberta, setAberta] = useState<number | null>(null);

  useEffect(() => {
    if (aberta === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberta(null);
      else if (e.key === "ArrowRight")
        setAberta((i) => (i === null ? i : (i + 1) % fotos.length));
      else if (e.key === "ArrowLeft")
        setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta, fotos.length]);

  const foto = aberta !== null ? fotos[aberta] : null;

  return (
    <>
      <div
        className={colunas === 3 ? "site-grid-3" : "site-gallery-grid"}
        style={{ display: "grid", gridTemplateColumns: `repeat(${colunas},1fr)`, gap: 20 }}
      >
        {fotos.map((p, i) => (
          <figure
            key={p.cap + i}
            onClick={() => setAberta(i)}
            className="site-gallery-tile"
            style={{ margin: 0, background: COR.cream, border: "1px solid rgba(27,29,27,0.08)", overflow: "hidden", cursor: "zoom-in" }}
          >
            <div
              style={{ width: "100%", aspectRatio: "4 / 3", backgroundColor: "#e8e6dc", backgroundImage: `url("${p.src}")`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <figcaption style={{ padding: "16px 20px", fontSize: 13, letterSpacing: "0.03em", color: COR.green, fontWeight: 600 }}>
              {p.cap}
            </figcaption>
          </figure>
        ))}
      </div>

      {foto && (
        <div
          role="dialog"
          aria-label={foto.cap}
          onClick={() => setAberta(null)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(4,49,27,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setAberta(null); }}
            aria-label="Fechar"
            style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: "none", color: COR.cream, fontSize: 30, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length)); }}
                aria-label="Anterior"
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: COR.cream, fontSize: 40, cursor: "pointer", padding: 12 }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setAberta((i) => (i === null ? i : (i + 1) % fotos.length)); }}
                aria-label="Próxima"
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: COR.cream, fontSize: 40, cursor: "pointer", padding: 12 }}
              >
                ›
              </button>
            </>
          )}
          <img
            src={foto.src}
            alt={foto.cap}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "min(1100px, 92vw)", maxHeight: "80vh", objectFit: "contain", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          />
          <div style={{ marginTop: 16, color: COR.cream, fontSize: 14, letterSpacing: "0.04em" }}>
            {foto.cap}
          </div>
        </div>
      )}
    </>
  );
}
