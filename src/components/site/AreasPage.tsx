import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR, Eyebrow } from "./ui";
import Link from "next/link";

type Area = { id: string; num: string; title: string; bg: string; intro: string; services: { t: string; d: string }[] };

const AREAS: Area[] = [
  { id: "trabalhista", num: "01", title: "Direito Trabalhista", bg: "#f6f3ec",
    intro: "Toda empresa que tem colaboradores ou terceirizados lida, queira ou não, com questões trabalhistas. Nosso trabalho começa antes do processo — na conversa, na orientação e no cuidado com o que acontece todos os dias dentro da empresa.",
    services: [
      { t: "Consultoria Preventiva", d: "Orientação prática para decisões corretas nas rotinas de trabalho, evitando erros que geram ações ou custos futuros." },
      { t: "Contratos e Terceirização", d: "Elaboração e revisão de contratos de trabalho, acordos e terceirizações, com regras claras e menos riscos." },
      { t: "Gestão de Contencioso", d: "Acompanhamento estratégico de processos trabalhistas, com análise técnica e suporte ao empresário." },
      { t: "Processos Administrativos", d: "Atuação junto a órgãos competentes, como DRT e fiscalizações, orientando a empresa até a conclusão." },
      { t: "Gestão de Terceirizadas", d: "Redução de riscos de responsabilidade solidária ou subsidiária na contratação de terceiros." },
      { t: "Reclamações Trabalhistas", d: "Defesa de empresas em reclamações trabalhistas, com foco técnico, estratégico e personalizado." },
    ] },
  { id: "imobiliario", num: "02", title: "Direito Imobiliário", bg: "#ffffff",
    intro: "Segurança jurídica nas operações imobiliárias da empresa — da aquisição e locação à regularização e à estruturação de negócios — com análise cuidadosa de riscos em cada etapa.",
    services: [
      { t: "Contratos Imobiliários", d: "Elaboração e revisão de compra e venda, locação e permuta, protegendo os interesses da empresa." },
      { t: "Due Diligence", d: "Análise de documentação e riscos antes de cada operação imobiliária relevante." },
      { t: "Locações Empresariais", d: "Assessoria em locações comerciais, garantias, renovações e renegociações." },
      { t: "Regularização", d: "Apoio na regularização de imóveis, registros e questões cartorárias." },
      { t: "Incorporação e Loteamento", d: "Suporte jurídico a empreendimentos imobiliários e seus trâmites." },
      { t: "Contencioso Imobiliário", d: "Atuação em disputas possessórias, despejos e cobranças." },
    ] },
  { id: "consumidor", num: "03", title: "Direito do Consumidor", bg: "#f6f3ec",
    intro: "Proteção da empresa nas relações de consumo, com foco na prevenção de conflitos e na adequação das práticas ao Código de Defesa do Consumidor.",
    services: [
      { t: "Adequação ao CDC", d: "Revisão de práticas, contratos e políticas para conformidade com a legislação consumerista." },
      { t: "Defesa em Ações", d: "Atuação na defesa da empresa em ações de consumo individuais e coletivas." },
      { t: "Procon e Órgãos", d: "Acompanhamento de reclamações e processos administrativos junto ao Procon." },
      { t: "Política de Atendimento", d: "Orientação na construção de fluxos de atendimento e SAC que reduzem litígios." },
      { t: "Contratos de Consumo", d: "Elaboração de termos, garantias e contratos claros e seguros." },
      { t: "Gestão de Risco", d: "Mapeamento de riscos consumeristas e adoção de medidas preventivas." },
    ] },
  { id: "civil", num: "04", title: "Direito Civil", bg: "#ffffff",
    intro: "Atuação ampla em obrigações, responsabilidade civil e conflitos patrimoniais, sempre orientada à proteção do negócio e à solução eficiente de disputas.",
    services: [
      { t: "Responsabilidade Civil", d: "Defesa e prevenção em casos de danos materiais e morais." },
      { t: "Obrigações e Cobranças", d: "Recuperação de créditos e execução de obrigações." },
      { t: "Contratos Civis", d: "Elaboração e revisão de contratos entre particulares e empresas." },
      { t: "Família e Sucessões", d: "Orientação em questões patrimoniais, sucessórias e planejamento." },
      { t: "Contencioso Cível", d: "Condução estratégica de ações cíveis em todas as instâncias." },
      { t: "Consultoria Jurídica", d: "Pareceres e orientação para decisões civis seguras." },
    ] },
  { id: "contratos", num: "05", title: "Contratos Empresariais", bg: "#f6f3ec",
    intro: "Contratos bem feitos previnem conflitos. Elaboramos e revisamos instrumentos que deixam regras claras e protegem a empresa em cada negociação.",
    services: [
      { t: "Elaboração de Contratos", d: "Construção de instrumentos sob medida para cada operação." },
      { t: "Revisão e Análise", d: "Leitura crítica para identificar riscos e cláusulas frágeis." },
      { t: "Negociação", d: "Apoio jurídico nas tratativas e no fechamento de acordos." },
      { t: "Contratos Societários", d: "Acordos de sócios e estruturação societária da empresa." },
      { t: "Distratos e Rescisões", d: "Encerramento de relações contratuais com segurança." },
      { t: "Gestão Contratual", d: "Acompanhamento do ciclo de vida dos contratos da empresa." },
    ] },
  { id: "preventivo", num: "06", title: "Apoio Jurídico Preventivo", bg: "#ffffff",
    intro: "Apoio jurídico contínuo para que a empresa tome decisões com mais segurança no dia a dia, antecipando riscos antes que se tornem problemas.",
    services: [
      { t: "Assessoria Recorrente", d: "Acompanhamento jurídico próximo das rotinas e decisões da empresa." },
      { t: "Mapeamento de Riscos", d: "Identificação de pontos de atenção em contratos, rotinas e operações." },
      { t: "Pareceres e Orientações", d: "Respostas técnicas para dúvidas estratégicas do negócio." },
      { t: "Boas Práticas", d: "Apoio na construção de políticas internas e compliance básico." },
      { t: "Treinamento de Equipes", d: "Orientação a gestores sobre rotinas juridicamente seguras." },
      { t: "Suporte a Decisões", d: "Análise jurídica de decisões empresariais relevantes." },
    ] },
];

export default function AreasPage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="areas" />

      <section style={{ background: COR.green, color: COR.cream }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
            <span style={{ width: 46, height: 1, background: COR.gold }} />
            <Eyebrow>Atuação Empresarial</Eyebrow>
          </div>
          <h1 className="site-h1" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 56, lineHeight: 1.08, margin: "0 0 24px", maxWidth: 820, color: COR.cream }}>Áreas de Atuação</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,230,220,0.75)", maxWidth: 640, margin: 0 }}>Atuação sólida e estratégica nas principais frentes do direito empresarial, sempre orientada à prevenção de conflitos e à segurança jurídica do seu negócio.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 40 }}>
            {AREAS.map((a) => (
              <a key={a.id} href={`#${a.id}`} className="site-chip" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.03em", color: "#e8e6dc", border: "1px solid rgba(176,141,79,0.45)", padding: "10px 18px" }}>{a.title}</a>
            ))}
          </div>
        </div>
      </section>

      {AREAS.map((a) => (
        <section key={a.id} id={a.id} style={{ scrollMarginTop: 96, background: a.bg, borderBottom: "1px solid rgba(27,29,27,0.08)" }}>
          <div className="site-2col site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "92px 40px", display: "grid", gridTemplateColumns: "0.82fr 1.18fr", gap: 72 }}>
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: SERIF, fontSize: 96, fontWeight: 300, color: "rgba(176,141,79,0.4)", lineHeight: 1 }}>{a.num}</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 38, lineHeight: 1.12, margin: "14px 0 24px", color: COR.green }}>{a.title}</h2>
              <div style={{ width: 54, height: 2, background: COR.gold, marginBottom: 24 }} />
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#4a4d44", margin: "0 0 32px" }}>{a.intro}</p>
              <Link href="/contato" className="site-btn-green" style={{ display: "inline-block", background: COR.green, color: COR.cream, padding: "14px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fale com um especialista</Link>
            </div>
            <div className="site-service-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(27,29,27,0.1)", border: "1px solid rgba(27,29,27,0.1)", alignSelf: "start" }}>
              {a.services.map((s) => (
                <div key={s.t} className="site-service" style={{ background: a.bg, padding: "30px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ width: 7, height: 7, background: COR.gold, transform: "rotate(45deg)", flex: "none" }} />
                    <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: COR.green, margin: 0, lineHeight: 1.2 }}>{s.t}</h3>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: COR.muted, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <SiteFooter />
    </div>
  );
}
