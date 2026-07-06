import { SERIF, SANS, COR } from "./ui";

const SOCIAL = [
  { label: "IG", href: "https://www.instagram.com/brancoadvogadosassociados/" },
  { label: "FB", href: "https://www.facebook.com/brancoadvogados/" },
  { label: "IN", href: "https://www.linkedin.com/company/branco-advogados/" },
  { label: "YT", href: "https://www.youtube.com/channel/UCJUu5SUmxNk2BKECyL8sfXw" },
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
                className="site-restrito"
                style={{ width: 42, height: 42, border: "1px solid rgba(176,141,79,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8e6dc", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}
              >
                {s.label}
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
