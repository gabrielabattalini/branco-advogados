import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR } from "./ui";

const YT = "https://www.youtube.com/channel/UCJUu5SUmxNk2BKECyL8sfXw";

// Vídeos do canal. Quando o `vid` (ID do YouTube) é preenchido, o card mostra
// a capa real do vídeo e leva direto para ele. Sem `vid`, leva ao canal.
type Video = { title: string; desc: string; vid?: string };

const MINUTO: Video[] = [
  { vid: "rCJ72dhigFQ", title: "Posso ser demitido por justa causa, mesmo em home office?", desc: "Minuto Branco Legal #7 — o que a lei diz sobre a demissão por justa causa no trabalho remoto." },
  { vid: "IU_qq_c_lKA", title: "Minuto Branco Legal", desc: "Conteúdo prático e direto sobre o universo jurídico empresarial." },
];
const ENTREVISTAS: Video[] = [
  { vid: "ir8WIA_O83w", title: "Branco Advogados Associados", desc: "Um panorama do escritório e da atuação em Direito Civil, Trabalhista e Comercial." },
  { vid: "h6kB3TLbMzI", title: "Entrevista — Empresários de Sucesso TV", desc: "Dr. Luiz Carlos Branco no programa Empresários de Sucesso TV." },
  { vid: "zk5o99ARPkY", title: "Entrevista — Empresários de Sucesso TV", desc: "Dr. Luiz Carlos Branco fala sobre advocacia empresarial e prevenção." },
  { vid: "uoCqCfCybdE", title: "Entrevista — Band News", desc: "Dr. Luiz Carlos Branco entrevistado pela Band News." },
];

// Capa do vídeo: usa a thumbnail real do YouTube quando há ID; senão, uma capa
// com a marca do canal. Sempre com o botão vermelho de "play" do YouTube.
function Capa({ vid, alt, aspect = "16/9" }: { vid?: string; alt: string; aspect?: string }) {
  return (
    <div style={{ position: "relative", aspectRatio: aspect, background: COR.green, overflow: "hidden" }}>
      {vid ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`}
          alt={alt}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ position: "absolute", top: 18, left: 18, fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "rgba(176,141,79,0.6)", textTransform: "uppercase" }}>
          Branco Legal
        </span>
      )}
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.28) 100%)" }} />
      <span
        aria-hidden
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 60, height: 42, borderRadius: 10, background: "#ff0000", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}
      >
        <span style={{ width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "15px solid #fff", marginLeft: 3 }} />
      </span>
      <span style={{ position: "absolute", bottom: 12, right: 14, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>
        ▶ Assista no YouTube
      </span>
    </div>
  );
}

function href(v: Video) {
  return v.vid ? `https://www.youtube.com/watch?v=${v.vid}` : YT;
}

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
            <a key={v.title} href={href(v)} target="_blank" rel="noopener noreferrer" className="site-card-hover" style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
              <Capa vid={v.vid} alt={v.title} />
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
        <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {ENTREVISTAS.map((e) => (
            <a key={e.title} href={href(e)} target="_blank" rel="noopener noreferrer" className="site-card-hover" style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
              <Capa vid={e.vid} alt={e.title} />
              <div style={{ padding: "22px 24px 26px" }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: COR.green, margin: "0 0 8px", lineHeight: 1.25 }}>{e.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: COR.muted, margin: 0 }}>{e.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
