import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR } from "./ui";

const SOCIAL = [
  { label: "IG", href: "https://www.instagram.com/brancoadvogadosassociados/" },
  { label: "FB", href: "https://www.facebook.com/brancoadvogados/" },
  { label: "IN", href: "https://www.linkedin.com/company/branco-advogados/" },
  { label: "YT", href: "https://www.youtube.com/channel/UCJUu5SUmxNk2BKECyL8sfXw" },
];

function Info({ icon, titulo, children }: { icon: string; titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <span style={{ width: 42, height: 42, flex: "none", border: "1px solid rgba(176,141,79,0.6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 15 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: COR.green, letterSpacing: "0.02em" }}>{titulo}</div>
        <div style={{ fontSize: 14.5, color: COR.muted, marginTop: 4, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

const inp = { background: COR.cream, border: "1px solid rgba(27,29,27,0.12)", padding: "14px 16px", fontFamily: SANS, fontSize: 15, color: COR.ink, outline: "none" } as const;

export default function ContatoPage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="" />

      <section style={{ background: COR.green, color: COR.cream }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "64px 40px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <span style={{ width: 46, height: 1, background: COR.gold }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold }}>Atendimento</span>
          </div>
          <h1 className="site-h1" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 48, lineHeight: 1.1, margin: 0, color: COR.cream }}>Contato</h1>
        </div>
      </section>

      <section className="site-2col site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 40px", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 72 }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 34, lineHeight: 1.12, margin: "0 0 14px", color: COR.green }}>Informações</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "#555850", margin: "0 0 36px", maxWidth: 420 }}>Para qualquer informação, dúvida ou comentário, entre em contato ou preencha o formulário ao lado.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Info icon="◷" titulo="Horário de Atendimento">Segunda a Sexta — 09h às 18h</Info>
            <Info icon="✉" titulo="E-mail"><a href="mailto:branco@brancoadvogados.com.br" style={{ color: "inherit" }}>branco@brancoadvogados.com.br</a></Info>
            <Info icon="✆" titulo="Telefone"><a href="tel:+551145866329" style={{ color: "inherit" }}>+55 (11) 4586-6329</a></Info>
            <Info icon="⌖" titulo="Endereço">R. Dr. Edson Zardetto de Toledo, 145<br />Chácara Urbana — Jundiaí/SP · CEP 13.209-120</Info>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="site-restrito" style={{ width: 42, height: 42, border: "1px solid rgba(5,98,52,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: COR.green, fontSize: 12, fontWeight: 700 }}>{s.label}</a>
            ))}
          </div>
        </div>

        <form action="https://formsubmit.co/branco@brancoadvogados.com.br" method="POST" style={{ background: "#fff", border: "1px solid rgba(27,29,27,0.1)", padding: 44, alignSelf: "start" }}>
          <input type="hidden" name="_subject" value="Novo contato pelo site — Branco Advogados" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />
          <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 24, color: COR.green, margin: "0 0 28px" }}>Envie uma mensagem</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input className="site-input-light" type="text" name="Nome" placeholder="Nome" required style={inp} />
            <input className="site-input-light" type="tel" name="Telefone" placeholder="Telefone" style={inp} />
            <input className="site-input-light" type="email" name="Email" placeholder="E-mail" required style={inp} />
            <textarea className="site-input-light" name="Mensagem" rows={4} placeholder="Mensagem" required style={{ ...inp, resize: "none" }} />
            <button type="submit" className="site-btn-green" style={{ marginTop: 6, background: COR.green, color: COR.cream, border: "none", padding: 16, fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>Enviar</button>
          </div>
        </form>
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "40px 40px 92px" }}>
        <div style={{ border: "1px solid rgba(27,29,27,0.1)", padding: 10, background: "#fff" }}>
          <iframe
            title="Mapa Branco Advogados"
            src="https://maps.google.com/maps?q=R.%20Dr.%20Edson%20Zardetto%20de%20Toledo%2C%20145%2C%20Ch%C3%A1cara%20Urbana%2C%20Jundia%C3%AD%20SP&t=&z=15&ie=UTF8&iwloc=&output=embed"
            style={{ width: "100%", height: 420, border: 0, display: "block", filter: "grayscale(0.2)" }}
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
