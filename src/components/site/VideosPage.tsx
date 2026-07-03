import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR } from "./ui";

const YT = "https://www.youtube.com/channel/UCJUu5SUmxNk2BKECyL8sfXw";

const MINUTO = [
  { title: "Contratei errado. E agora?", desc: "Os cuidados essenciais na contratação para evitar passivos trabalhistas." },
  { title: "O que olhar antes de assinar", desc: "Pontos de atenção em contratos empresariais antes da assinatura." },
  { title: "Locação comercial sem surpresas", desc: "O que a empresa precisa saber ao alugar um imóvel." },
];
const ENTREVISTAS = [
  { title: "Prevenção como estratégia", meta: "Entrevista · YouTube" },
  { title: "Relações de consumo e a empresa", meta: "Entrevista · YouTube" },
  { title: "45 anos de advocacia", meta: "Entrevista · YouTube" },
];

export default function VideosPage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="conteudos" />

      <section style={{ background: COR.green, color: COR.cream }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
            <span style={{ width: 46, height: 1, background: COR.gold }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold }}>Conteúdo em Vídeo</span>
          </div>
          <h1 className="site-h1" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 54, lineHeight: 1.1, margin: "0 0 22px", maxWidth: 740, color: COR.cream }}>Minuto Branco Legal &amp; Entrevistas</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,230,220,0.75)", maxWidth: 620, margin: "0 0 36px" }}>Conteúdo prático e direto sobre o universo jurídico empresarial, para ajudar empresários a tomar decisões mais seguras.</p>
          <a href={YT} target="_blank" rel="noopener noreferrer" className="site-btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: COR.gold, color: COR.green, padding: "14px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>▶ Canal no YouTube</a>
        </div>
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 40px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Série</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.12, margin: "0 0 44px", color: COR.green }}>Minuto Branco Legal</h2>
        <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {MINUTO.map((v) => (
            <a key={v.title} href={YT} target="_blank" rel="noopener noreferrer" className="site-card-hover" style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
              <div style={{ position: "relative", aspectRatio: "16/9", background: COR.green, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "rgba(176,141,79,0.55)", textTransform: "uppercase", position: "absolute", top: 18, left: 18 }}>Minuto Legal</span>
                <span style={{ width: 56, height: 56, border: "1.5px solid #b08d4f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 18 }}>▶</span>
              </div>
              <div style={{ padding: "22px 24px 26px" }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: COR.green, margin: "0 0 8px", lineHeight: 1.25 }}>{v.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: COR.muted, margin: 0 }}>{v.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "64px 40px 96px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Conversas</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.12, margin: "0 0 44px", color: COR.green }}>Entrevistas</h2>
        <div className="site-2col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
          <a href={YT} target="_blank" rel="noopener noreferrer" className="site-card-hover" style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", background: "#0a7d45", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 64, height: 64, border: "1.5px solid #b08d4f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 20 }}>▶</span>
            </div>
            <div style={{ padding: "28px 30px 32px" }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: COR.green, margin: "0 0 10px" }}>Direito empresarial na prática</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: COR.muted, margin: 0 }}>Uma conversa sobre como a orientação jurídica preventiva transforma a rotina e a segurança das empresas.</p>
            </div>
          </a>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {ENTREVISTAS.map((e) => (
              <a key={e.title} href={YT} target="_blank" rel="noopener noreferrer" className="site-card-hover" style={{ display: "flex", gap: 18, alignItems: "center", background: "#fff", border: "1px solid rgba(27,29,27,0.08)", padding: 16 }}>
                <span style={{ width: 64, height: 48, flex: "none", background: COR.green, display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 14 }}>▶</span>
                <div>
                  <h4 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: COR.green, margin: "0 0 4px", lineHeight: 1.25 }}>{e.title}</h4>
                  <p style={{ fontSize: 12.5, color: "#8a8c80", margin: 0 }}>{e.meta}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
