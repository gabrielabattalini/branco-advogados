"use client";

import { useState } from "react";
import Link from "next/link";
import { SANS, COR, U } from "./ui";

const AREAS = [
  { label: "Direito Trabalhista", href: "/areas#trabalhista" },
  { label: "Direito Imobiliário", href: "/areas#imobiliario" },
  { label: "Direito do Consumidor", href: "/areas#consumidor" },
  { label: "Direito Civil", href: "/areas#civil" },
  { label: "Contratos Empresariais", href: "/areas#contratos" },
  { label: "Apoio Jurídico Preventivo", href: "/areas#preventivo" },
];
const CONTEUDOS = [
  { label: "Livros publicados", href: "/livros" },
  { label: "Premiações", href: "/premiacoes" },
  { label: "Vídeos", href: "/videos" },
  { label: "Notícias", href: "/noticias" },
  { label: "Responsabilidade Social", href: "/responsabilidade-social" },
];

type Active = "escritorio" | "areas" | "conteudos" | "galeria" | "";

export default function SiteHeader({ active = "" }: { active?: Active }) {
  const [open, setOpen] = useState<null | "areas" | "conteudos">(null);
  const [mobile, setMobile] = useState(false);

  const linkStyle = (key: Active) => ({
    fontSize: 13.5,
    fontWeight: 600,
    letterSpacing: "0.01em",
    padding: "8px 0",
    color: active === key ? COR.green : COR.ink,
    borderBottom: active === key ? "2px solid #b08d4f" : "2px solid transparent",
  });

  const dropItem = {
    display: "block",
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: 500,
    color: "#2c302b",
    borderLeft: "2px solid transparent",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div className="site-root">
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "rgba(246,243,236,0.94)",
          backdropFilter: "saturate(140%) blur(12px)",
          WebkitBackdropFilter: "saturate(140%) blur(12px)",
          borderBottom: "1px solid rgba(27,29,27,0.12)",
          fontFamily: SANS,
        }}
      >
        <div
          className="site-pad"
          style={{ maxWidth: 1260, margin: "0 auto", padding: "0 40px", height: 86, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center" }} aria-label="Branco Advogados — início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={U + "2024/07/Design-sem-nome-3.png"} alt="Branco Advogados" style={{ height: 54, width: "auto", display: "block" }} />
          </Link>

          {/* Navegação desktop */}
          <nav className="site-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 32 }} onMouseLeave={() => setOpen(null)}>
            <Link href="/" className="site-nav-link" style={linkStyle("escritorio")}>
              O Escritório
            </Link>

            <div style={{ position: "relative" }} onMouseEnter={() => setOpen("areas")}>
              <button style={{ ...linkStyle("areas"), background: "none", border: "none", borderBottom: linkStyle("areas").borderBottom, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: SANS }}>
                Áreas de Atuação
                <span style={{ fontSize: 8, color: COR.gold }}>▼</span>
              </button>
              <div style={{ position: "absolute", top: "100%", left: -12, paddingTop: 12, display: open === "areas" ? "block" : "none", zIndex: 50 }}>
                <div style={{ background: "#fff", border: "1px solid rgba(27,29,27,0.1)", boxShadow: "0 18px 44px rgba(5,98,52,0.16)", padding: "8px 0", minWidth: 232 }}>
                  {AREAS.map((a) => (
                    <Link key={a.href} href={a.href} className="site-drop-item" style={dropItem} onClick={() => setOpen(null)}>
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position: "relative" }} onMouseEnter={() => setOpen("conteudos")}>
              <button style={{ ...linkStyle("conteudos"), background: "none", border: "none", borderBottom: linkStyle("conteudos").borderBottom, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: SANS }}>
                Conteúdos
                <span style={{ fontSize: 8, color: COR.gold }}>▼</span>
              </button>
              <div style={{ position: "absolute", top: "100%", left: -12, paddingTop: 12, display: open === "conteudos" ? "block" : "none", zIndex: 50 }}>
                <div style={{ background: "#fff", border: "1px solid rgba(27,29,27,0.1)", boxShadow: "0 18px 44px rgba(5,98,52,0.16)", padding: "8px 0", minWidth: 232 }}>
                  {CONTEUDOS.map((c) => (
                    <Link key={c.href} href={c.href} className="site-drop-item" style={dropItem} onClick={() => setOpen(null)}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/galeria" className="site-nav-link" style={linkStyle("galeria")}>
              Galeria
            </Link>

            <Link
              href="/login"
              className="site-restrito"
              style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COR.muted, border: "1px solid rgba(27,29,27,0.18)", padding: "10px 16px" }}
            >
              Área Restrita
            </Link>

            <Link href="/contato" className="site-contato-btn" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COR.cream, background: COR.green, padding: "13px 26px", border: "1px solid #056234" }}>
              Contato
            </Link>
          </nav>

          {/* Botão mobile */}
          <button
            className="site-mobile-btn"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
            style={{ width: 48, height: 48, flex: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, background: "none", border: "1px solid rgba(5,98,52,0.28)", cursor: "pointer" }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 24,
                  height: 2,
                  background: COR.green,
                  display: "block",
                  transition: "all .28s ease",
                  transform: mobile && i === 0 ? "translateY(7px) rotate(45deg)" : mobile && i === 2 ? "translateY(-7px) rotate(-45deg)" : "none",
                  opacity: mobile && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>

        {/* Painel mobile */}
        {mobile && (
          <div style={{ background: COR.cream, borderTop: "1px solid rgba(27,29,27,0.1)", boxShadow: "0 24px 40px rgba(5,98,52,0.12)", maxHeight: "calc(100vh - 86px)", overflowY: "auto", fontFamily: SANS }}>
            <div style={{ padding: "12px 28px 32px", display: "flex", flexDirection: "column" }}>
              <Link href="/" onClick={() => setMobile(false)} style={{ padding: "15px 4px", fontSize: 15, fontWeight: 600, color: COR.ink, borderBottom: "1px solid rgba(27,29,27,0.08)" }}>
                O Escritório
              </Link>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold, margin: "20px 0 2px" }}>Áreas de Atuação</div>
              {AREAS.map((a) => (
                <Link key={a.href} href={a.href} onClick={() => setMobile(false)} style={{ padding: "11px 4px 11px 14px", fontSize: 14, color: "#2c302b" }}>
                  {a.label}
                </Link>
              ))}
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold, margin: "20px 0 2px" }}>Conteúdos</div>
              {CONTEUDOS.map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setMobile(false)} style={{ padding: "11px 4px 11px 14px", fontSize: 14, color: "#2c302b" }}>
                  {c.label}
                </Link>
              ))}
              <Link href="/galeria" onClick={() => setMobile(false)} style={{ padding: "15px 4px", fontSize: 15, fontWeight: 600, color: COR.ink, borderTop: "1px solid rgba(27,29,27,0.08)", marginTop: 14 }}>
                Galeria
              </Link>
              <Link href="/login" onClick={() => setMobile(false)} style={{ padding: "13px 4px", fontSize: 13.5, fontWeight: 600, color: COR.muted }}>
                Área Restrita
              </Link>
              <Link href="/contato" onClick={() => setMobile(false)} style={{ textAlign: "center", marginTop: 12, background: COR.green, color: COR.cream, padding: 16, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Contato
              </Link>
            </div>
          </div>
        )}
      </header>
      <div style={{ height: 86 }} />
    </div>
  );
}
