import type { CSSProperties, ReactNode } from "react";

// Fontes carregadas via next/font no layout do grupo (site) — referenciadas
// pelas variáveis CSS.
export const SERIF = "var(--font-spectral), Georgia, serif";
export const SANS = "var(--font-mulish), system-ui, sans-serif";

export const COR = {
  cream: "#f6f3ec",
  green: "#056234",
  greenDark: "#04311b",
  gold: "#b08d4f",
  goldLight: "#cda85f",
  ink: "#1b1d1b",
  muted: "#6a6d62",
};

export const U = "https://brancoadvogados.com/wp-content/uploads/";
export const W = "https://brancoadvogados.com/wp-content/webp-express/webp-images/uploads/";

export const wrap: CSSProperties = { maxWidth: 1260, margin: "0 auto" };

export function Eyebrow({ children, color = COR.gold }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color }}>
      {children}
    </div>
  );
}

// Hero verde padrão das páginas internas.
export function PageHero({
  eyebrow,
  title,
  subtitle,
  maxTitle = 760,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  maxTitle?: number;
  children?: ReactNode;
}) {
  return (
    <section style={{ background: COR.green, color: COR.cream }}>
      <div style={{ ...wrap, padding: "84px 40px 80px" }} className="site-pad">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
          <span style={{ width: 46, height: 1, background: COR.gold }} />
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <h1
          style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 54, lineHeight: 1.1, margin: "0 0 22px", maxWidth: maxTitle, color: COR.cream }}
          className="site-h1"
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,230,220,0.75)", maxWidth: 620, margin: 0 }}>{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
