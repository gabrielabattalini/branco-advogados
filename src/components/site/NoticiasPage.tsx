import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero, SERIF, SANS, COR } from "./ui";
import Link from "next/link";
import { ARTIGOS } from "@/lib/noticias";

export default function NoticiasPage() {
  const destaque = ARTIGOS.find((a) => a.destaque) ?? ARTIGOS[0];
  const demais = ARTIGOS.filter((a) => a.slug !== destaque.slug);
  return (
    <div className="site-root" style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}>
      <SiteHeader active="conteudos" />
      <PageHero eyebrow="Atualidades" title="Notícias & Artigos" maxTitle={680} subtitle="Análises e orientações sobre o universo jurídico empresarial, escritas para ajudar gestores a decidir com mais segurança." />

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "84px 40px 40px" }}>
        <Link href={`/noticias/${destaque.slug}`} className="site-card-hover site-2col" style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr", gap: 0, background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
          <div style={{ background: COR.green, minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 42 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: COR.gold }}>Artigo em destaque</span>
            <span style={{ fontFamily: SERIF, fontSize: 110, lineHeight: 0.7, color: "rgba(176,141,79,0.4)" }}>“</span>
            <span style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,230,220,0.55)" }}>Branco Advogados</span>
          </div>
          <div style={{ padding: "48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COR.gold, marginBottom: 16 }}>Em destaque · {destaque.tag}</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, lineHeight: 1.18, margin: "0 0 18px", color: COR.green }}>{destaque.title}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: COR.muted, margin: "0 0 24px" }}>{destaque.excerpt}</p>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COR.green }}>Ler artigo →</span>
          </div>
        </Link>
      </section>

      <section className="site-pad" style={{ maxWidth: 1260, margin: "0 auto", padding: "40px 40px 96px" }}>
        <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {demais.map((p) => (
            <Link key={p.slug} href={`/noticias/${p.slug}`} className="site-card-hover" style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
              <div style={{ height: 6, background: COR.gold }} />
              <div style={{ padding: "30px 28px 32px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: COR.gold, marginBottom: 14 }}>{p.tag}</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: COR.green, margin: "0 0 12px", lineHeight: 1.28 }}>{p.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: COR.muted, margin: "0 0 20px" }}>{p.excerpt}</p>
                <span style={{ fontSize: 12, color: "#8a8c80", letterSpacing: "0.04em" }}>Ler mais →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
