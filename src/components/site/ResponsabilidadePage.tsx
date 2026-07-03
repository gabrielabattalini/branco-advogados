import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero, SERIF, SANS, COR } from "./ui";

const PILLARS = [
  { icon: "✦", title: "Educação jurídica", desc: "Formação e orientação de novos profissionais do Direito, com mais de 25 anos dedicados ao magistério superior." },
  { icon: "◈", title: "Orientação acessível", desc: "Esclarecimento de dúvidas e orientação responsável para que mais pessoas compreendam seus direitos." },
  { icon: "❖", title: "Ética e comunidade", desc: "Atuação pautada por valores éticos e por compromisso com o desenvolvimento da comunidade local." },
];

export default function ResponsabilidadePage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="conteudos" />
      <PageHero eyebrow="Compromisso" title="Responsabilidade Social" maxTitle={720} subtitle="Acreditamos que o Direito também é instrumento de transformação. Devolver à sociedade parte do que construímos faz parte da nossa forma de atuar." />

      <section className="site-2col site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "88px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div style={{ position: "relative", background: COR.green, minHeight: 460, display: "flex", flexDirection: "column", justifyContent: "center", padding: 56 }}>
          <div style={{ position: "absolute", top: -16, left: -16, width: 120, height: 120, borderTop: "1px solid #b08d4f", borderLeft: "1px solid #b08d4f" }} />
          <div style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 500, color: COR.cream, lineHeight: 1.05 }}>Desde<br />1980</div>
          <div style={{ width: 54, height: 2, background: COR.gold, margin: "28px 0" }} />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(232,230,220,0.72)", margin: 0, maxWidth: 300 }}>Mais de quatro décadas devolvendo à sociedade parte do que construímos.</p>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 18 }}>Nossa visão</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.15, margin: "0 0 24px", color: COR.green }}>Conhecimento jurídico a serviço das pessoas</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: "#454840", margin: "0 0 20px" }}>Ao longo de mais de quatro décadas, o compromisso do escritório nunca foi apenas técnico. A formação de novos profissionais, a orientação responsável e a atenção às necessidades reais das pessoas sempre fizeram parte da nossa atuação.</p>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: "#454840", margin: 0 }}>Levamos para fora dos processos o mesmo cuidado que temos dentro deles — com ética, proximidade e respeito por cada história.</p>
        </div>
      </section>

      <section style={{ background: "#fff", borderTop: "1px solid rgba(27,29,27,0.08)", borderBottom: "1px solid rgba(27,29,27,0.08)" }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "88px 40px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 16 }}>Frentes de atuação social</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.15, margin: 0, color: COR.green }}>Como contribuímos</h2>
          </div>
          <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {PILLARS.map((p) => (
              <div key={p.title} style={{ border: "1px solid rgba(27,29,27,0.1)", padding: "38px 32px", background: COR.cream }}>
                <div style={{ width: 48, height: 48, border: "1px solid #b08d4f", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 20, marginBottom: 24 }}>{p.icon}</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: COR.green, margin: "0 0 12px" }}>{p.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: COR.muted, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "88px 40px", textAlign: "center" }} className="site-pad">
        <div style={{ fontFamily: SERIF, fontSize: 60, color: COR.gold, lineHeight: 0.5 }}>“</div>
        <p style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 28, lineHeight: 1.45, color: COR.green, margin: "0 0 28px", fontStyle: "italic" }}>Uma advocacia que cuida das empresas também cuida das pessoas que as constroem.</p>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a8c80" }}>Branco Advogados</div>
      </section>

      <SiteFooter />
    </div>
  );
}
