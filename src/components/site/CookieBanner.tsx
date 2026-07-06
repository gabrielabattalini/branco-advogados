"use client";

import { useEffect, useState } from "react";
import { COR, SANS } from "./ui";

const CHAVE = "lgpd-cookies-consentimento";

// Aviso de cookies (LGPD). Aparece até o visitante escolher. A escolha fica no
// localStorage; scripts não essenciais (analytics/marketing) devem checar
// localStorage[CHAVE] === "todos" antes de carregar.
export function CookieBanner() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE)) setMostrar(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  const escolher = (valor: "todos" | "essenciais") => {
    try {
      localStorage.setItem(CHAVE, valor);
    } catch {
      /* ignora */
    }
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 760,
        margin: "0 auto",
        background: COR.greenDark,
        color: COR.cream,
        border: `1px solid rgba(176,141,79,0.4)`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        fontFamily: SANS,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 14,
      }}
    >
      <p style={{ flex: "1 1 320px", margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "rgba(246,243,236,0.9)" }}>
        Usamos cookies essenciais para o funcionamento do site. Com o seu aceite,
        podemos usar também cookies de análise para melhorar sua experiência. Veja
        a{" "}
        <a href="/privacidade" style={{ color: COR.goldLight, textDecoration: "underline" }}>
          Política de Privacidade
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => escolher("essenciais")}
          style={{
            background: "transparent",
            color: COR.cream,
            border: "1px solid rgba(246,243,236,0.4)",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Só essenciais
        </button>
        <button
          onClick={() => escolher("todos")}
          style={{
            background: COR.gold,
            color: COR.green,
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
