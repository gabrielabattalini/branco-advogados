import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero } from "./ui";
import { SERIF, SANS, COR, U, W } from "./ui";
import Link from "next/link";

const DESTAQUES = [
  { t: "Artigos jurídicos", d: "Publicações em livros, revistas e periódicos jurídicos de referência, fruto de décadas de pesquisa e prática." },
  { t: "Filosofia do Direito", d: "Reflexões sobre os fundamentos do Direito e do Estado, com base em formação doutoral e pós-doutoral." },
  { t: "Formação jurídica", d: "Mais de 25 anos dedicados ao magistério superior e à formação de novos profissionais do Direito." },
];

export default function LivrosPage() {
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="conteudos" />
      <PageHero eyebrow="Publicações" title="Autor de diversas obras e artigos jurídicos" subtitle="A produção acadêmica e técnica do escritório reflete o compromisso com o estudo aprofundado do Direito e com a formação de novas gerações de juristas." />

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "0 40px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={U + "2026/03/livros-1024x683.png"} alt="Livros publicados" style={{ width: "100%", height: 420, objectFit: "cover", display: "block", marginTop: -40, boxShadow: "0 24px 60px rgba(5,98,52,0.18)" }} />
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 96px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Obra em destaque</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 38, lineHeight: 1.12, margin: "0 0 50px", color: COR.green }}>Livros Publicados</h2>

        <div className="site-2col" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 64, alignItems: "center", background: "#fff", border: "1px solid rgba(27,29,27,0.08)", padding: 48 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: "14px -14px -14px 14px", border: "1px solid #b08d4f" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={W + "2026/03/WhatsApp-Image-2026-03-02-at-15.15.01.jpeg.webp"} alt="Manual de Introdução ao Direito" style={{ position: "relative", width: "100%", display: "block", boxShadow: "0 18px 44px rgba(0,0,0,0.18)" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>Editora Millennium</div>
            <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, lineHeight: 1.15, margin: "0 0 22px", color: COR.green }}>Manual de Introdução ao Direito</h3>
            <p style={{ fontSize: 16.5, lineHeight: 1.8, color: "#454840", margin: "0 0 20px" }}>Obra didática que introduz os conceitos fundamentais do Direito, com visões sintéticas sobre as carreiras jurídicas. Indicado para estudantes e profissionais de diversas áreas, oferece uma base jurídica sólida e atualizada.</p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: COR.muted, margin: "0 0 32px", fontStyle: "italic" }}>“Desempenhamos um papel fundamental diante de situações que envolvam conflitos de interesses, auxiliando o cliente a encontrar o melhor caminho para a solução dessas disputas.”</p>
            <Link href="/contato" className="site-btn-green" style={{ display: "inline-block", background: COR.green, color: COR.cream, padding: "15px 32px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Saiba mais</Link>
          </div>
        </div>

        <div className="site-grid-3" style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {DESTAQUES.map((d) => (
            <div key={d.t} style={{ borderTop: "2px solid #b08d4f", paddingTop: 24 }}>
              <h4 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: COR.green, margin: "0 0 10px" }}>{d.t}</h4>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: COR.muted, margin: 0 }}>{d.d}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
