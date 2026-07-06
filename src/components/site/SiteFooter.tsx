import { SERIF, SANS, COR } from "./ui";

// Ícones das redes como SVG embutido (nada externo — não depende de CDN).
const ICONES: Record<string, string> = {
  Instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  Facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  YouTube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
};

const SOCIAL = [
  { label: "Instagram", href: "https://www.instagram.com/brancoadvogadosassociados/" },
  { label: "Facebook", href: "https://www.facebook.com/brancoadvogados/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/branco-advogados/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCJUu5SUmxNk2BKECyL8sfXw" },
];

function InfoLinha({ icon, titulo, children }: { icon: string; titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <span style={{ width: 40, height: 40, flex: "none", border: "1px solid rgba(176,141,79,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 15 }}>
        {icon}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: COR.cream, letterSpacing: "0.02em" }}>{titulo}</div>
        <div style={{ fontSize: 14.5, color: "rgba(232,230,220,0.7)", marginTop: 4, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(232,230,220,0.25)",
  padding: "12px 2px",
  fontFamily: SANS,
  fontSize: 15,
  color: COR.cream,
  outline: "none",
} as const;

export default function SiteFooter() {
  return (
    <footer id="contato" style={{ fontFamily: SANS, background: COR.green, color: "#e8e6dc" }}>
      <div className="site-2col site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "96px 40px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.32em", color: COR.gold, textTransform: "uppercase" }}>Fale Conosco</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, lineHeight: 1.12, margin: "18px 0", color: COR.cream }}>Informações</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "rgba(232,230,220,0.78)", maxWidth: 440, margin: "0 0 40px" }}>
            Para qualquer informação, dúvida ou comentário, entre em contato ou preencha o formulário ao lado.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <InfoLinha icon="◷" titulo="Horário de Atendimento">Segunda a Sexta — 09h às 18h</InfoLinha>
            <InfoLinha icon="✉" titulo="E-mail">
              <a href="mailto:branco@brancoadvogados.com.br" style={{ color: "inherit" }}>branco@brancoadvogados.com.br</a>
            </InfoLinha>
            <InfoLinha icon="✆" titulo="Telefone">
              <a href="tel:+551145866329" style={{ color: "inherit" }}>+55 (11) 4586-6329</a>
            </InfoLinha>
            <InfoLinha icon="⌖" titulo="Endereço">
              R. Dr. Edson Zardetto de Toledo, 145
              <br />
              Chácara Urbana — Jundiaí/SP
              <br />
              CEP 13.209-120
            </InfoLinha>
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="site-restrito"
                style={{ width: 42, height: 42, border: "1px solid rgba(176,141,79,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8e6dc" }}
              >
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
                  <path d={ICONES[s.label]} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <form action="https://formsubmit.co/branco@brancoadvogados.com.br" method="POST" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(176,141,79,0.22)", padding: 44 }}>
          <input type="hidden" name="_subject" value="Novo contato pelo site — Branco Advogados" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />
          <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 24, color: COR.cream, margin: "0 0 28px" }}>Envie uma mensagem</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <input className="site-input" type="text" name="Nome" placeholder="Nome" required style={inputStyle} />
            <input className="site-input" type="tel" name="Telefone" placeholder="Telefone" style={inputStyle} />
            <input className="site-input" type="email" name="Email" placeholder="E-mail" required style={inputStyle} />
            <textarea className="site-input" name="Mensagem" rows={3} placeholder="Mensagem" required style={{ ...inputStyle, resize: "none" }} />
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.5, color: "rgba(232,230,220,0.7)", marginTop: 4 }}>
              <input type="checkbox" name="Consentimento LGPD" value="Aceito" required style={{ marginTop: 3, accentColor: COR.gold }} />
              <span>
                Li e concordo com a{" "}
                <a href="/privacidade" style={{ color: COR.goldLight, textDecoration: "underline" }}>
                  Política de Privacidade
                </a>{" "}
                e autorizo o contato.
              </span>
            </label>
            <button type="submit" className="site-btn-gold" style={{ marginTop: 8, background: COR.gold, color: COR.green, border: "none", padding: 15, fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>
              Enviar
            </button>
          </div>
        </form>
      </div>

      <div style={{ maxWidth: 1260, margin: "64px auto 0", padding: "26px 40px", borderTop: "1px solid rgba(232,230,220,0.14)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }} className="site-pad">
        <span style={{ fontSize: 12.5, color: "rgba(232,230,220,0.55)" }}>© {new Date().getFullYear()} Branco Advogados. Todos os direitos reservados.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <a href="/privacidade" style={{ fontSize: 12.5, color: "rgba(232,230,220,0.7)" }}>
            Política de Privacidade
          </a>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold }}>Advocacia Empresarial · Jundiaí/SP</span>
        </div>
      </div>
    </footer>
  );
}
