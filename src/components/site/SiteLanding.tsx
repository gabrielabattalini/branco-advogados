"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { SERIF, SANS, COR, U, W, Eyebrow } from "./ui";

type Membro = {
  name: string;
  role: string;
  tag: string;
  photo: string;
  bio: string[];
  contacts: string[];
};

const TEAM: Membro[] = [
  { name: "Luiz Carlos Branco", role: "Sócio-fundador", tag: "Professor, Doutor e Pós-Doutor", photo: U + "2025/06/Dr-Branco.webp",
    bio: ["Advogado, Doutor e Mestre em Filosofia do Direito e do Estado pela PUC/SP, com Pós-Doutorado pela Universidade de Salamanca, Espanha.", "Mestre em Direito Civil pela Universidade Paulista; Especialista em Direito Privado pela PUC/Campinas.", "Foi professor de Direito por mais de 25 anos, atualmente professor convidado. Ex-membro julgador do Tribunal de Ética da OAB/SP."],
    contacts: ["+55 11 4586-6329", "+55 11 99989-1300", "luiz@brancoadvogados.com"] },
  { name: "Mauro Araujo", role: "Professor Doutor", tag: "Doutor em Direito pela PUC/SP", photo: U + "2025/06/Dr-Mauro-Araujo.webp",
    bio: ["Mestrado (1997) e Doutorado (2007) em Direito pela PUC/SP.", "Professor Doutor titular do curso de Direito no Centro Universitário Padre Anchieta.", "38 anos de experiência na advocacia e 27 anos de magistério superior. Possui obras e artigos publicados em livros, revistas e periódicos jurídicos."],
    contacts: ["+55 11 4586-6329", "+55 11 97631-8755", "mauro@brancoadvogados.com"] },
  { name: "Débora Stabile", role: "Diretora Executiva", tag: "Advogada · Arquiteta e Urbanista", photo: W + "2026/03/Untitled-design.png.webp",
    bio: ["MLL em Direito Imobiliário (em curso) pela Fundação MP/RS; Pós-graduada em Direito Tributário pela PUC-Campinas.", "Graduada em Arquitetura e Urbanismo (PUC-Campinas) e em Direito (Centro Universitário Padre Anchieta).", "Mais de 20 anos em Direito Civil, Empresarial, Contratual e Imobiliário. Fluente em inglês, preparada para atuar em mercados globais."],
    contacts: ["+55 11 4586-6329", "+55 11 97244-5289", "debora@brancoadvogados.com"] },
  { name: "Matheus Branco", role: "Advogado", tag: "Centro Universitário Padre Anchieta", photo: U + "2025/06/Matheus.webp",
    bio: ["Graduado em Direito pelo Centro Universitário Padre Anchieta (2023)."],
    contacts: ["+55 11 4586-6329", "+55 11 99523-1553", "matheus@brancoadvogados.com"] },
  { name: "Mariana Cassemiro", role: "Advogada", tag: "Pós-graduada em Processo Civil", photo: W + "2026/02/Design-sem-nome-1.jpg.webp",
    bio: ["Graduada em Direito pelo Centro Universitário Padre Anchieta (2011).", "Pós-graduada em Direito Processual Civil pela PUC/SP — COGEAE (2018)."],
    contacts: ["+55 11 4586-6329", "mariana@brancoadvogados.com"] },
  { name: "Karen Araújo", role: "Advogada", tag: "Pós-graduada em Direito do Trabalho", photo: U + "2025/06/Dra-Karen.webp",
    bio: ["Graduada em Direito pelo Centro Universitário Padre Anchieta (2011).", "Pós-graduada em Direito e Processo do Trabalho pela PUC/SP (2020)."],
    contacts: ["+55 11 4586-6329", "+55 11 97543-7101", "karen@brancoadvogados.com"] },
  { name: "Laís Zottini", role: "Advogada", tag: "Centro Universitário Padre Anchieta", photo: U + "2025/06/Dra-Lais-1.webp",
    bio: ["Graduada em Direito pelo Centro Universitário Padre Anchieta (2024)."],
    contacts: ["+55 11 4586-6329", "+55 11 99024-7475", "lais@brancoadvogados.com"] },
  { name: "Júlia Drezza", role: "Advogada", tag: "Pós-graduada em Direito do Trabalho", photo: W + "2026/02/Design-sem-nome.png.webp",
    bio: ["Graduada em Direito pelo Centro Universitário Padre Anchieta (2016).", "Pós-graduada em Direito e Processo do Trabalho pela PUC/RS (2026)."],
    contacts: ["+55 11 4586-6329", "julia@brancoadvogados.com"] },
  { name: "Suelen Ribeiro", role: "Téc. em Administração", tag: "ETEC Benedito Storani", photo: W + "2026/03/SUELEN-RIBEIRO-1.png.webp",
    bio: ["Técnica em Administração desde 2015 — ETEC Benedito Storani."],
    contacts: ["+55 11 4586-6329", "suelen@brancoadvogados.com"] },
  { name: "Gabriel Battaglini", role: "Advogado", tag: "Centro Universitário Padre Anchieta", photo: W + "2026/05/Gabriel-Battaglini.png.webp",
    bio: ["Graduado em Direito pelo Centro Universitário Padre Anchieta (2022)."],
    contacts: ["+55 11 4586-6329", "+55 11 97631-8755", "gabriel@brancoadvogados.com"] },
  { name: "Kawanny Marques", role: "Bacharel em Direito", tag: "Universidade Nove de Julho", photo: W + "2026/05/Kawanny.png.webp",
    bio: ["Graduada em Direito pela Universidade Nove de Julho (2025)."],
    contacts: ["+55 11 4586-6329", "kawanny@brancoadvogados.com"] },
];

const PRACTICES = [
  { num: "01", title: "Direito Trabalhista", desc: "Consultoria preventiva e defesa estratégica nas relações de trabalho.", href: "/areas#trabalhista" },
  { num: "02", title: "Direito Imobiliário", desc: "Segurança jurídica em negócios, contratos e operações imobiliárias.", href: "/areas#imobiliario" },
  { num: "03", title: "Direito do Consumidor", desc: "Proteção da empresa nas relações de consumo e prevenção de litígios.", href: "/areas#consumidor" },
  { num: "04", title: "Direito Civil", desc: "Atuação ampla em conflitos e obrigações no âmbito civil.", href: "/areas#civil" },
  { num: "05", title: "Contratos Empresariais", desc: "Elaboração e revisão de contratos com regras claras e seguras.", href: "/areas#contratos" },
  { num: "06", title: "Apoio Jurídico Preventivo", desc: "Orientação contínua para decisões empresariais bem fundamentadas.", href: "/areas#preventivo" },
];

const ESTRUTURA = [W + "2024/07/2-1.jpg.webp", W + "2024/07/3-1.jpg.webp", W + "2024/07/4-1.jpg.webp", W + "2024/07/5-1.jpg.webp"];

const CONTEUDOS = [
  { eyebrow: "Publicações", title: "Livros publicados", desc: "Autor de obras e artigos jurídicos de referência.", href: "/livros" },
  { eyebrow: "Reconhecimento", title: "Premiações", desc: "Distinções que reconhecem a qualidade do trabalho.", href: "/premiacoes" },
  { eyebrow: "Conteúdo", title: "Vídeos", desc: "Minuto Branco Legal e entrevistas em vídeo.", href: "/videos" },
  { eyebrow: "Atualidades", title: "Notícias", desc: "Artigos e novidades do universo jurídico empresarial.", href: "/noticias" },
];

const HERO_BG = U + "2024/09/branco_img_banner.jpg";

function Contador({ target, pad }: { target: number; pad: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const fmt = (v: number) => String(v).padStart(pad, "0");
    const run = () => {
      if (done) return;
      done = true;
      const dur = 1100;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(target * e));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => { if (entries.some((en) => en.isIntersecting)) { run(); obs.disconnect(); } }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, pad]);
  return <span ref={ref}>{"0".padStart(pad, "0")}</span>;
}

const statNum: CSSProperties = { fontFamily: SERIF, fontSize: 89, fontWeight: 600, color: COR.green, lineHeight: 1 };

export default function SiteLanding() {
  const [sel, setSel] = useState<number | null>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const bg = heroBgRef.current;
        if (!bg || !bg.parentElement) return;
        const rect = bg.parentElement.getBoundingClientRect();
        const h = rect.height || 1;
        const p = Math.max(0, Math.min(1, -rect.top / h));
        bg.style.transform = `translateY(${p * 54}px) scale(${1.06 + p * 0.22})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = sel !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sel]);

  const member = sel !== null ? TEAM[sel] : null;

  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="escritorio" />

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", backgroundColor: COR.greenDark }}>
        <div ref={heroBgRef} style={{ position: "absolute", inset: "-7%", backgroundImage: `url('${HERO_BG}')`, backgroundSize: "cover", backgroundPosition: "center", transformOrigin: "center center", willChange: "transform" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,rgba(4,49,27,0.94) 0%,rgba(5,98,52,0.82) 42%,rgba(4,40,22,0.55) 100%)" }} />
        <div className="site-hero-inner" style={{ position: "relative", maxWidth: 1260, margin: "0 auto", padding: "128px 40px 132px" }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
              <span style={{ width: 46, height: 1, background: COR.gold }} />
              <span style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.goldLight }}>Desde 1980 · Jundiaí / SP</span>
            </div>
            <h1 className="site-hero-title" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 62, lineHeight: 1.07, letterSpacing: "-0.01em", margin: "0 0 40px", color: COR.cream }}>
              Uma advocacia séria, ética e bem estruturada.
            </h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/areas" className="site-btn-gold" style={{ background: COR.gold, color: COR.greenDark, padding: "16px 34px", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Áreas de Atuação</Link>
              <a href="#contato" className="site-btn-ghost" style={{ background: "transparent", color: COR.cream, border: "1px solid rgba(246,243,236,0.45)", padding: "16px 34px", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fale Conosco</a>
            </div>
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section id="historia" style={{ background: "#fff", borderTop: "1px solid rgba(27,29,27,0.08)", borderBottom: "1px solid rgba(27,29,27,0.08)" }}>
        <div className="site-hist-grid site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "96px 40px", display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 80 }}>
          <div>
            <Eyebrow>O Escritório</Eyebrow>
            <h2 className="site-hist-title" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 58, lineHeight: 1.12, margin: "8px 0 0", color: COR.green }}>Nossa História</h2>
            <div style={{ width: 54, height: 2, background: COR.gold, marginTop: 5 }} />
            <p style={{ fontSize: 19, lineHeight: 1.3, color: COR.muted, marginTop: 13 }}>
              Sede própria em Jundiaí-SP.
              <br />
              <strong style={{ color: COR.green }}>Não temos filiais.</strong>
            </p>
            <div style={{ position: "relative", marginTop: 40 }}>
              <div style={{ position: "absolute", top: -14, left: -14, width: 96, height: 96, borderTop: "1px solid #b08d4f", borderLeft: "1px solid #b08d4f" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={U + "2025/06/Dr-Branco.webp"} alt="Dr. Luiz Carlos Branco — Fundador" style={{ position: "relative", width: "100%", display: "block" }} />
              <div style={{ marginTop: 18, borderLeft: "2px solid #b08d4f", paddingLeft: 16 }}>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: COR.green }}>Dr. Luiz Carlos Branco</div>
                <div style={{ fontSize: 16.5, letterSpacing: "0.04em", color: "#8a8c80", marginTop: 3 }}>Fundador · Desde 1980</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.85, color: "#454840" }}>
            <p style={{ margin: "0 0 22px" }}>O <strong style={{ color: COR.green }}>Branco Advogados</strong> nasceu em maio de 1980, em Jundiaí-SP, a partir da iniciativa do advogado Luiz Carlos Branco. Desde o início, a ideia do escritório sempre foi clara em oferecer uma advocacia séria, ética e bem estruturada, capaz de orientar clientes com segurança e visão de longo prazo.</p>
            <p style={{ margin: "0 0 22px" }}>Ao longo dos anos, o escritório acompanhou de perto as mudanças do mercado, da legislação e das relações empresariais. Essa vivência prática permitiu ao <strong style={{ color: COR.green }}>Branco Advogados</strong> construir uma atuação sólida, baseada não apenas em resolver problemas quando eles surgem, mas principalmente em ajudar empresas a evitá-los por meio de orientação correta, preventiva e decisões bem fundamentadas.</p>
            <p style={{ margin: "0 0 22px" }}>Com mais de 45 anos de atuação, o escritório construiu uma história marcada pela confiança de seus clientes, pela continuidade do trabalho e pelo compromisso com a qualidade técnica. O crescimento aconteceu de forma consistente, sem abrir mão dos valores que sempre nortearam a atuação do escritório com ética, responsabilidade e atenção às necessidades reais do cliente.</p>
            <p style={{ margin: 0 }}>Hoje, o <strong style={{ color: COR.green }}>Branco Advogados</strong> é reconhecido como um escritório experiente, com forte atuação nas áreas de Direito Civil, Trabalhista, Imobiliário e do Consumidor, oferecendo suporte jurídico estratégico para empresas que buscam segurança, organização e previsibilidade em suas decisões.</p>

            <div className="site-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32, marginTop: 52, paddingTop: 44, borderTop: "1px solid rgba(27,29,27,0.1)" }}>
              <div><div className="site-stat-num" style={statNum}><Contador target={45} pad={0} /><span style={{ color: COR.gold }}>+</span></div><div style={{ fontSize: 19, color: COR.muted, marginTop: 10 }}>Anos de história</div></div>
              <div><div className="site-stat-num" style={statNum}><Contador target={25} pad={0} /><span style={{ color: COR.gold }}>+</span></div><div style={{ fontSize: 20, color: COR.muted, marginTop: 10, lineHeight: "24.15px" }}>Anos de atuação acadêmica</div></div>
              <div><div className="site-stat-num" style={statNum}><Contador target={6} pad={2} /></div><div style={{ fontSize: 20, color: COR.muted, marginTop: 10, letterSpacing: "0.02em" }}>Áreas do direito</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "96px 40px" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 18px" }}>
          <Eyebrow>Equipe</Eyebrow>
          <h2 className="site-title" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 44, lineHeight: 1.12, margin: "18px 0 22px", color: COR.green }}>Conheça nosso time</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.75, color: "#555850" }}>Uma equipe de advogados experientes, com titulações e professores de Direito, alinhada aos valores do escritório. Cada profissional contribui com conhecimento técnico, responsabilidade e compromisso com a qualidade do atendimento.</p>
        </div>
        <div className="site-team-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginTop: 56 }}>
          {TEAM.map((m, i) => (
            <button key={m.name} onClick={() => setSel(i)} className="site-team-card" style={{ textAlign: "left", cursor: "pointer", background: "#fff", border: "1px solid rgba(27,29,27,0.08)", padding: 0, font: "inherit" }}>
              <div style={{ position: "relative", overflow: "hidden", backgroundColor: "#e8e6dc", aspectRatio: "1 / 1.12", backgroundImage: `url("${m.photo}")`, backgroundSize: "cover", backgroundPosition: "top center", filter: "grayscale(0.18)" }} />
              <div style={{ padding: "20px 20px 22px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COR.gold, marginBottom: 8 }}>{m.role}</div>
                <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: COR.green, lineHeight: 1.15 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#8a8c80", marginTop: 12, letterSpacing: "0.04em" }}>Ver perfil →</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ESTRUTURA */}
      <section style={{ background: COR.green, color: COR.cream }}>
        <div className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "96px 40px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 48 }}>
            <div>
              <Eyebrow>Nossa Sede</Eyebrow>
              <h2 className="site-title" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 58, lineHeight: 1.1, margin: "18px 0 0", color: COR.cream }}>Estrutura</h2>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "rgba(232,230,220,0.7)", maxWidth: 420, margin: 0 }}>Um ambiente preparado para receber clientes com discrição, conforto e a seriedade que cada caso exige.</p>
          </div>
          <div className="site-estrutura-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridAutoRows: "300px", gap: 16 }}>
            {ESTRUTURA.map((src) => (
              <div key={src} className="site-estrutura-tile" style={{ height: "100%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Estrutura do escritório" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÁREAS PREVIEW */}
      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "96px 40px" }}>
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
          <Eyebrow>Atuação</Eyebrow>
          <h2 className="site-title" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 44, lineHeight: 1.12, margin: "18px 0 0", color: COR.green }}>Áreas de Atuação</h2>
        </div>
        <div className="site-areas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(27,29,27,0.1)", border: "1px solid rgba(27,29,27,0.1)" }}>
          {PRACTICES.map((p) => (
            <Link key={p.num} href={p.href} className="site-prac-card" style={{ background: COR.cream, padding: "42px 36px", display: "block", cursor: "pointer" }}>
              <div className="site-prac-num" style={{ fontFamily: SERIF, fontSize: 30, color: COR.gold, fontWeight: 500 }}>{p.num}</div>
              <h3 className="site-prac-title" style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, color: COR.green, margin: "18px 0 12px", lineHeight: 1.2 }}>{p.title}</h3>
              <p className="site-prac-desc" style={{ fontSize: 14.5, lineHeight: 1.65, color: COR.muted, margin: 0 }}>{p.desc}</p>
              <div className="site-prac-more" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COR.green, marginTop: 22 }}>Saiba mais →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CONTEÚDOS TEASER */}
      <section style={{ background: "#fff", borderTop: "1px solid rgba(27,29,27,0.08)" }}>
        <div className="site-grid-4 site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {CONTEUDOS.map((c) => (
            <Link key={c.title} href={c.href} className="site-teaser" style={{ display: "block", borderBottom: "2px solid transparent", paddingBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold }}>{c.eyebrow}</div>
              <h3 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: COR.green, margin: "14px 0 8px" }}>{c.title}</h3>
              <p style={{ fontSize: 14, color: COR.muted, margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />

      {/* MODAL PERFIL */}
      {member && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(3,40,22,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div onClick={(e) => e.stopPropagation()} className="site-modal-card" style={{ background: COR.cream, maxWidth: 880, width: "100%", maxHeight: "86vh", overflowY: "auto", display: "grid", gridTemplateColumns: "0.78fr 1.22fr", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div className="site-modal-img" style={{ backgroundColor: "#e8e6dc", minHeight: 360, backgroundImage: `url("${member.photo}")`, backgroundSize: "cover", backgroundPosition: "top center" }} />
            <div style={{ padding: "44px 44px 48px", position: "relative" }}>
              <button onClick={() => setSel(null)} aria-label="Fechar" className="site-restrito" style={{ position: "absolute", top: 22, right: 22, width: 34, height: 34, border: "1px solid rgba(27,29,27,0.2)", background: "none", cursor: "pointer", fontSize: 16, color: COR.green, lineHeight: 1 }}>✕</button>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold }}>{member.role}</div>
              <h3 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: COR.green, margin: "12px 0 6px", lineHeight: 1.1 }}>{member.name}</h3>
              <div style={{ fontSize: 14, fontStyle: "italic", color: COR.muted, marginBottom: 24 }}>{member.tag}</div>
              <div style={{ width: 46, height: 2, background: COR.gold, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {member.bio.map((line, i) => (<p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: "#454840", margin: 0 }}>{line}</p>))}
              </div>
              <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid rgba(27,29,27,0.12)", display: "flex", flexDirection: "column", gap: 9 }}>
                {member.contacts.map((c) => (<div key={c} style={{ fontSize: 13.5, color: COR.green, letterSpacing: "0.02em" }}>{c}</div>))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
