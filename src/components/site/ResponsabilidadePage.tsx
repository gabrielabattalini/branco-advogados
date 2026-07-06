import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero, SERIF, SANS, COR, U } from "./ui";

// Ações sociais do escritório (doações de equipamentos e apoio a instituições).
const ACOES = [
  {
    img: U + "2025/06/teclado-apae.webp",
    title: "Doação de teclado para a APAE",
    desc: "A APAE realiza um trabalho fundamental na promoção da inclusão e no desenvolvimento de pessoas com deficiência intelectual e múltipla. O escritório Dr. Branco Advogados teve a satisfação de colaborar com essa causa por meio da doação de um teclado, fortalecendo nosso compromisso com a responsabilidade social.",
  },
  {
    img: "",
    title: "Doação de computadores para o Lar Anália Franco",
    desc: "O Lar Anália Franco, em Jundiaí, atua há mais de um século promovendo educação e acolhimento para crianças em situação de vulnerabilidade. Com orgulho, o escritório Dr. Branco Advogados realizou a doação de computadores para apoiar essa importante missão social.",
  },
  {
    img: "",
    title: "Doação de computadores para a Amarati",
    desc: "A Amarati desenvolve um trabalho essencial no acolhimento e desenvolvimento de pessoas especiais em Jundiaí. O escritório Dr. Branco Advogados contribuiu com a doação de computadores, reafirmando nosso compromisso com a inclusão e o apoio a causas sociais relevantes.",
  },
  {
    img: "",
    title: "Contribuição para a APAE",
    desc: "A APAE realiza um trabalho fundamental na promoção da inclusão e no desenvolvimento de pessoas com deficiência intelectual e múltipla. O escritório Dr. Branco Advogados teve a satisfação de colaborar com essa causa por meio da doação de computadores, fortalecendo nosso compromisso com a responsabilidade social.",
  },
  {
    img: "",
    title: "Apoio à Cidade Vicentina",
    desc: "A Cidade Vicentina oferece cuidado e acolhimento a idosos em situação de vulnerabilidade, com dedicação e dignidade. O escritório Dr. Branco Advogados contribuiu com essa missão por meio da doação de computadores, reafirmando nosso compromisso com ações sociais que fazem a diferença.",
  },
  {
    img: U + "2025/06/bollhoff.webp",
    title: "Criação do Instituto Bollhoff de Medula",
    desc: "No dia 9 de setembro, demos um passo importante pela vida! Foi oficializada a criação do Instituto Bollhoff de Medula, em nossa sede em Jundiaí — uma iniciativa dedicada à esperança, à solidariedade e ao compromisso com a saúde.",
  },
];

// Projeto de Natal — cestas natalinas a entidades beneficentes, ano a ano.
const NATAL = [
  {
    ano: "2025",
    img: U + "2026/02/Cidade-Vicentina-cestas-Natal-2025.jpeg",
    desc: "Doação de mais de 150 cestas de Natal para instituições beneficentes de Jundiaí. Entre elas APAE, Casa de Nazaré, Cidade Vicentina, Casa Transitória e outras.",
  },
  {
    ano: "2024",
    img: U + "2025/06/natal-2024-01.webp",
    desc: "Há 45 anos, espalhando solidariedade no Natal! Nosso Projeto de Responsabilidade Social leva cestas natalinas a entidades beneficentes, reforçando o compromisso com um fim de ano mais digno para todos.",
  },
  {
    ano: "2023",
    img: U + "2025/06/natal-2023.webp",
    desc: "Em 2023, o escritório Dr. Branco Advogados seguiu com seu compromisso social realizando a doação de cestas básicas para instituições. Nosso objetivo é ir além do jurídico, contribuindo com ações que promovem dignidade e esperança para quem mais precisa, especialmente em datas tão significativas como o Natal.",
  },
  {
    ano: "2022",
    img: U + "2025/06/natal-2022-01.webp",
    desc: "Neste fim de ano, o escritório Dr. Branco Advogados realizou a doação de cestas de Natal para a Santa Casa Marta e para a instituição Maria de Magdala. Com esse gesto, buscamos levar um pouco mais de acolhimento e esperança às pessoas atendidas por essas entidades, reforçando nosso compromisso com a solidariedade e o bem coletivo.",
  },
  {
    ano: "2021",
    img: U + "2025/06/natal-2021-01.webp",
    desc: "No Natal de 2021, o escritório Dr. Branco Advogados realizou a doação de cestas básicas para instituições de Jundiaí, contribuindo para um fim de ano mais digno e acolhedor para diversas famílias. Acreditamos que a solidariedade é um valor que deve estar presente em cada etapa do nosso trabalho.",
  },
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
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(232,230,220,0.72)", margin: 0, maxWidth: 300 }}>Há 45 anos, espalhando solidariedade e devolvendo à sociedade parte do que construímos.</p>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 18 }}>Nossa visão</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.15, margin: "0 0 24px", color: COR.green }}>Conhecimento jurídico a serviço das pessoas</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: "#454840", margin: "0 0 20px" }}>Ao longo de mais de quatro décadas, o compromisso do escritório nunca foi apenas técnico. A orientação responsável, a atenção às necessidades reais das pessoas e o apoio a instituições beneficentes sempre fizeram parte da nossa atuação.</p>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: "#454840", margin: 0 }}>Levamos para fora dos processos o mesmo cuidado que temos dentro deles — com ética, proximidade e respeito por cada história.</p>
        </div>
      </section>

      <section style={{ background: "#fff", borderTop: "1px solid rgba(27,29,27,0.08)", borderBottom: "1px solid rgba(27,29,27,0.08)" }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "88px 40px" }}>
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 16 }}>Ações realizadas</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.15, margin: 0, color: COR.green }}>Doações e apoio a instituições</h2>
          </div>
          <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {ACOES.map((a) => (
              <div key={a.title} style={{ border: "1px solid rgba(27,29,27,0.1)", background: COR.cream, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {a.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.img} alt={a.title} style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: 190, background: COR.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 48, height: 48, border: "1px solid #b08d4f", display: "flex", alignItems: "center", justifyContent: "center", color: COR.gold, fontSize: 20 }}>❖</span>
                  </div>
                )}
                <div style={{ padding: "28px 26px 30px" }}>
                  <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: COR.green, margin: "0 0 12px", lineHeight: 1.3 }}>{a.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: COR.muted, margin: 0 }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 40px" }}>
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 16 }}>Projeto de Natal</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 36, lineHeight: 1.15, margin: "0 0 16px", color: COR.green }}>45 anos espalhando solidariedade</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: COR.muted, margin: 0 }}>Todos os anos, nosso Projeto de Responsabilidade Social leva cestas natalinas a entidades beneficentes de Jundiaí e região.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {NATAL.map((n, i) => (
            <div key={n.ano} className="site-2col" style={{ display: "grid", gridTemplateColumns: i % 2 === 0 ? "1fr 1.3fr" : "1.3fr 1fr", gap: 36, alignItems: "center", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.img} alt={`Natal ${n.ano}`} style={{ width: "100%", height: 260, objectFit: "cover", display: "block", order: i % 2 === 0 ? 0 : 2 }} />
              <div style={{ padding: "34px 40px" }}>
                <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: COR.gold, lineHeight: 1, marginBottom: 14 }}>Natal {n.ano}</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "#454840", margin: 0 }}>{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "40px 40px 96px", textAlign: "center" }} className="site-pad">
        <div style={{ fontFamily: SERIF, fontSize: 60, color: COR.gold, lineHeight: 0.5 }}>“</div>
        <p style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 28, lineHeight: 1.45, color: COR.green, margin: "0 0 28px", fontStyle: "italic" }}>Uma advocacia que cuida das empresas também cuida das pessoas que as constroem.</p>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a8c80" }}>Branco Advogados</div>
      </section>

      <SiteFooter />
    </div>
  );
}
