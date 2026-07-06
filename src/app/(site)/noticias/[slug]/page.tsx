import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { PageHero, SERIF, SANS, COR } from "@/components/site/ui";
import { ARTIGOS, getArtigo } from "@/lib/noticias";

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArtigo(slug);
  if (!a) return { title: "Artigo — Branco Advogados" };
  return { title: `${a.title} — Branco Advogados`, description: a.excerpt };
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArtigo(slug);
  if (!a) notFound();

  const relacionados = ARTIGOS.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <div
      className="site-root"
      style={{ background: COR.cream, fontFamily: SANS, color: COR.ink, overflowX: "hidden" }}
    >
      <SiteHeader active="conteudos" />
      <PageHero eyebrow={a.tag} title={a.title} maxTitle={820} subtitle={a.data} />

      <article
        className="site-pad"
        style={{ maxWidth: 760, margin: "0 auto", padding: "64px 40px 40px" }}
      >
        <Link
          href="/noticias"
          style={{ fontSize: 13, color: COR.green, fontWeight: 600 }}
        >
          ‹ Voltar para Notícias
        </Link>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: COR.muted, margin: "24px 0 28px", fontStyle: "italic" }}>
          {a.excerpt}
        </p>
        {a.corpo.map((par, i) => (
          <p key={i} style={{ fontSize: 16.5, lineHeight: 1.85, color: "#2a2c28", margin: "0 0 18px" }}>
            {par}
          </p>
        ))}

        <div style={{ marginTop: 40, padding: "26px 28px", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: COR.green, marginBottom: 6 }}>
            Precisa de orientação sobre este tema?
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: COR.muted, margin: "0 0 16px" }}>
            Fale com a nossa equipe e receba uma análise para o caso da sua empresa.
          </p>
          <Link
            href="/contato"
            className="site-btn-green"
            style={{ display: "inline-block", background: COR.green, color: COR.cream, padding: "12px 22px", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Falar com o escritório
          </Link>
        </div>
      </article>

      <section
        className="site-pad"
        style={{ maxWidth: 1260, margin: "0 auto", padding: "40px 40px 96px" }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COR.gold, marginBottom: 22 }}>
          Leia também
        </div>
        <div className="site-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {relacionados.map((p) => (
            <Link
              key={p.slug}
              href={`/noticias/${p.slug}`}
              className="site-card-hover"
              style={{ display: "block", background: "#fff", border: "1px solid rgba(27,29,27,0.08)" }}
            >
              <div style={{ height: 6, background: COR.gold }} />
              <div style={{ padding: "26px 26px 28px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: COR.gold, marginBottom: 12 }}>
                  {p.tag}
                </div>
                <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: COR.green, margin: "0 0 10px", lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <span style={{ fontSize: 12, color: "#8a8c80" }}>Ler mais →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
