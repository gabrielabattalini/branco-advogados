"use client";

import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR, U } from "./ui";

const FILES = [
  "2025/06/cdl-2020.webp", "2024/07/Captura-de-Tela-2024-07-24-as-3.44-1.jpg", "2026/02/Design-sem-nome-2.jpg", "2024/07/4-1.jpg",
  "2025/09/CARROSEL_DRB_03.webp", "2026/02/WhatsApp-Image-2025-11-26-at-4.19.44-PM-1.jpeg", "2025/05/Cestas-2025-09.webp", "2025/06/Advocacia-em-tempos-de-Lava-Jato.webp",
  "2025/06/natal-2021-01.webp", "2025/09/CARROSEL_DRB_02.webp", "2025/06/natal-2022-01.webp", "2024/07/remove-1.jpg",
  "2026/02/WhatsApp-Image-2025-11-26-at-4.19.45-PM-1.jpeg", "2024/07/5-1.jpg", "2025/06/cdl-2022-01.webp", "2025/06/encontro-joao-pessoa.webp",
  "2025/06/natal-2024-01.webp", "2024/07/1-1.jpg", "2025/06/natal-2023.webp", "2025/06/natal-2021-02.webp",
  "2025/06/natal-2022-03.webp", "2025/06/cdl-2022-02.webp", "2025/06/natal-2024-03.webp", "2025/06/bollhoff.webp",
  "2024/07/2-1.jpg", "2025/06/acidente-trabalho-scaled.webp", "2024/09/branco_img_banner.jpg", "2025/06/Cartorio-de-Notas.webp",
  "2025/06/teclado-apae.webp", "2025/05/Cestas-2025-11.webp", "2024/07/Captura-de-Tela-2024-07-24-as-3.31-1.jpg", "2024/07/Captura-de-Tela-2024-07-24-as-3.jpg",
  "2025/06/cancer-prostata.webp", "2025/05/Cestas-2025-03.webp", "2025/05/Cestas-2025-04.webp", "2025/06/cdl-2024.webp",
  "2024/07/3-1.jpg", "2026/02/Cidade-Vicentina-cestas-Natal-2025.jpeg", "2025/06/natal-2022-02.webp", "2025/05/Cestas-2025-10.webp",
];
const SRCS = FILES.map((f) => U + f);

export default function GaleriaPage() {
  const [sel, setSel] = useState<number | null>(null);
  const n = SRCS.length;

  useEffect(() => {
    if (sel === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSel(null);
      if (e.key === "ArrowRight") setSel((s) => (s === null ? s : (s + 1) % n));
      if (e.key === "ArrowLeft") setSel((s) => (s === null ? s : (s - 1 + n) % n));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sel, n]);

  const navBtn = { width: 52, height: 52, border: "1px solid rgba(176,141,79,0.5)", background: "none", color: COR.cream, fontSize: 20, cursor: "pointer" } as const;

  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="galeria" />

      <section style={{ background: COR.green, color: COR.cream }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
            <span style={{ width: 46, height: 1, background: COR.gold }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold }}>Momentos &amp; Bastidores</span>
          </div>
          <h1 className="site-h1" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 54, lineHeight: 1.1, margin: "0 0 22px", color: COR.cream }}>Galeria</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,230,220,0.75)", maxWidth: 600, margin: 0 }}>Eventos, participações, ações sociais e o dia a dia do escritório ao longo dos anos.</p>
        </div>
      </section>

      <section className="site-pad" style={{ maxWidth: 1300, margin: "0 auto", padding: "60px 40px 96px" }}>
        <div className="site-gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {SRCS.map((src, i) => (
            <button
              key={src}
              onClick={() => setSel(i)}
              className="site-gallery-tile"
              aria-label="Ampliar foto"
              style={{ position: "relative", cursor: "pointer", overflow: "hidden", backgroundColor: "#e8e6dc", aspectRatio: "1 / 1", backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center", border: "none", padding: 0 }}
            />
          ))}
        </div>
      </section>

      <SiteFooter />

      {sel !== null && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(2,32,17,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <button onClick={(e) => { e.stopPropagation(); setSel((s) => (s === null ? s : (s - 1 + n) % n)); }} aria-label="Anterior" className="site-restrito" style={{ ...navBtn, position: "absolute", left: 28, top: "50%", transform: "translateY(-50%)" }}>‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SRCS[sel]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "88vw", maxHeight: "84vh", objectFit: "contain", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          <button onClick={(e) => { e.stopPropagation(); setSel((s) => (s === null ? s : (s + 1) % n)); }} aria-label="Próxima" className="site-restrito" style={{ ...navBtn, position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)" }}>›</button>
          <button onClick={() => setSel(null)} aria-label="Fechar" className="site-restrito" style={{ ...navBtn, width: 46, height: 46, position: "absolute", top: 28, right: 28, fontSize: 18 }}>✕</button>
        </div>
      )}
    </div>
  );
}
