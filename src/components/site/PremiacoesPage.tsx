import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero, SERIF, SANS, COR, U } from "./ui";
import { GaleriaLightbox } from "./GaleriaLightbox";

const CARDS = [
  { big: "45", sup: "+", title: "Anos de história", desc: "Uma das mais longevas bancas de advocacia empresarial de Jundiaí e região." },
  { big: "Ph", sup: "D", title: "Titulação máxima", desc: "Doutorado e Pós-Doutorado pela Universidade de Salamanca, na Espanha." },
  { big: "OAB", sup: "", title: "Tribunal de Ética", desc: "Ex-membro julgador do Tribunal de Ética da OAB/SP." },
];

// Prêmios e destaques do escritório, do mais recente ao mais antigo.
const ITEMS = [
  { year: "2025", title: "Prêmio Destaque CDL Jundiaí", desc: "Pelo 5º ano consecutivo, somos destaque na categoria Advocacia pelo Prêmio CDL Jundiaí." },
  { year: "2024", title: "Advogado mais lembrado de Jundiaí", desc: "O Doutor Branco foi reconhecido pela CDL de Jundiaí como o advogado mais lembrado de Jundiaí e região em 2024. Uma conquista que reforça sua dedicação e a confiança conquistada junto à comunidade." },
  { year: "2023", title: "Advogado mais lembrado de Jundiaí", desc: "O Doutor Branco foi reconhecido pela CDL de Jundiaí como o advogado mais lembrado de Jundiaí e região em 2023. Uma conquista que reforça sua dedicação e a confiança conquistada junto à comunidade." },
  { year: "2022", title: "Prêmio Destaque CDL Jundiaí", desc: "O Doutor Luiz Carlos Branco foi reconhecido pela CDL Jundiaí como o advogado mais lembrado de Jundiaí e região, destacando sua dedicação, excelência e a confiança conquistada junto à comunidade." },
  { year: "2020", title: "1º lugar na preferência da população", desc: "Concedido pela CDL Jundiaí e Sincomércio Jundiaí e Região ao Doutor Luiz Carlos Branco, em reconhecimento por conquistar o 1º lugar na preferência e lembrança da população jundiaiense na categoria Advogado." },
  { year: "2006", title: "Encontro Brasileiro de Faculdades de Direito", desc: "Realizado em João Pessoa, o Encontro Brasileiro de Faculdades de Direito, presidido pelo Doutor Luiz Carlos Branco, reuniu instituições de ensino jurídico de todo o país para discutir diretrizes acadêmicas, desafios do ensino superior e perspectivas para a formação jurídica no Brasil." },
];

const PHOTOS = [
  { src: U + "2025/06/cdl-2024.webp", cap: "CDL Jundiaí" },
  { src: U + "2025/06/encontro-joao-pessoa.webp", cap: "Encontro Nacional · João Pessoa" },
  { src: U + "2025/06/Advocacia-em-tempos-de-Lava-Jato.webp", cap: "Publicação · Advocacia em tempos de Lava Jato" },
  { src: U + "2025/06/cdl-2022-01.webp", cap: "CDL Jundiaí · 2022" },
  { src: U + "2025/06/bollhoff.webp", cap: "Parceria empresarial" },
  { src: U + "2025/06/cdl-2020.webp", cap: "CDL Jundiaí · 2020" },
];

export default function PremiacoesPage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="conteudos" />
      <PageHero eyebrow="Reconhecimento" title="Premiações & Destaques" subtitle="Mais de quatro décadas de trabalho sério construíram uma trajetória reconhecida pela qualidade técnica, pela ética e pela contribuição acadêmica ao Direito." />

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "88px 40px 40px" }}>
        <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {CARDS.map((c) => (
            <div key={c.title} style={{ background: "#fff", border: "1px solid rgba(27,29,27,0.08)", padding: "40px 34px" }}>
              <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 600, color: COR.gold, lineHeight: 1 }}>{c.big}<span style={{ fontSize: 28 }}>{c.sup}</span></div>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: COR.green, margin: "20px 0 10px" }}>{c.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: COR.muted, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "48px 40px 96px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Trajetória reconhecida</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.12, margin: "0 0 44px", color: COR.green, maxWidth: 680 }}>Distinções que refletem o compromisso com a excelência</h2>
        <div style={{ borderTop: "1px solid rgba(27,29,27,0.12)" }}>
          {ITEMS.map((it) => (
            <div key={it.title} className="site-2col" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 40, padding: "34px 0", borderBottom: "1px solid rgba(27,29,27,0.12)" }}>
              <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: COR.gold, letterSpacing: "0.04em" }}>{it.year}</div>
              <div>
                <h3 style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, color: COR.green, margin: "0 0 8px" }}>{it.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: COR.muted, margin: 0, maxWidth: 760 }}>{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff", borderTop: "1px solid rgba(27,29,27,0.08)" }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "88px 40px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Momentos</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.12, margin: "0 0 44px", color: COR.green, maxWidth: 680 }}>Destaques & Reconhecimentos</h2>
          <GaleriaLightbox fotos={PHOTOS} />
          <p style={{ marginTop: 18, fontSize: 12.5, color: COR.muted }}>
            Clique em uma foto para ampliar.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
