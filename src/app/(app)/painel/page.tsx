import Link from "next/link";
import { Plus, Gavel, Scale, ChevronRight } from "lucide-react";
import { getPainel } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { AreaTag } from "@/components/AreaTag";

export const dynamic = "force-dynamic";

// Cada KPI leva para a aba correspondente (mesma ordem de getPainel).
const KPI_HREFS = ["/tarefas", "/tarefas", "/publicacoes", "/audiencias"];

export default async function PainelPage() {
  const [{ kpis, tarefas, eventos, publicacoes }, sessao] = await Promise.all([
    getPainel(),
    getSessao(),
  ]);
  const primeiroNome =
    (sessao?.nome ?? "")
      .replace(/^(Dr\.|Dra\.|Est\.)\s*/i, "")
      .trim()
      .split(/\s+/)[0] || "bem-vindo(a)";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">
            Bom dia, {primeiroNome}
          </h1>
          <p className="text-sm text-muted">Sexta-feira, 19 de junho de 2026</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tarefas?novo=1"
            className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark"
          >
            <Plus size={16} /> Nova tarefa
          </Link>
          <Link
            href="/audiencias?novo=1"
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-navy hover:bg-surface"
          >
            <Gavel size={16} /> Nova audiência
          </Link>
          <Link
            href="/processos?novo=1"
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-navy hover:bg-surface"
          >
            <Scale size={16} /> Novo processo
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <Link
            key={k.label}
            href={KPI_HREFS[i] ?? "/painel"}
            className="rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-gold/60"
          >
            <div className="text-[13px] text-muted">{k.label}</div>
            <div
              className={
                "mt-1 text-2xl font-medium " +
                (k.danger ? "text-danger" : "text-navy")
              }
            >
              {k.valor}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-navy">Minhas tarefas</h2>
            <Link
              href="/tarefas"
              className="inline-flex items-center gap-1 text-[13px] text-info hover:underline"
            >
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col">
            {tarefas.map((t) => (
              <Link
                key={t.id}
                href="/tarefas"
                className="flex items-start gap-3 rounded-md border-t border-line px-2 py-2.5 transition-colors first:border-t-0 hover:bg-cream/50"
              >
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-faint" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink">{t.titulo}</div>
                  <div className="font-mono text-[11px] text-faint">
                    Proc. {t.processo || "—"}
                  </div>
                </div>
                <AreaTag area={t.area} />
                <span
                  className={
                    "min-w-[42px] text-right text-[11px] " +
                    (t.prazoUrgente ? "font-medium text-danger" : "text-muted")
                  }
                >
                  {t.prazo}
                </span>
              </Link>
            ))}
            {tarefas.length === 0 && (
              <div className="py-6 text-center text-[13px] text-faint">
                Nenhuma tarefa em aberto.
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-navy">
                Agenda de hoje
              </h2>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 text-[13px] text-info hover:underline"
              >
                Ver <ChevronRight size={14} />
              </Link>
            </div>
            <ul className="flex flex-col gap-3">
              {eventos.map((e, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="min-w-[40px] text-[12px] font-medium text-navy">
                    {e.hora}
                  </span>
                  <div className="border-l-2 border-line pl-3">
                    <div className="text-[12px] text-ink">{e.titulo}</div>
                    <div className="text-[11px] text-faint">{e.detalhe}</div>
                  </div>
                </li>
              ))}
              {eventos.length === 0 && (
                <li className="text-[12px] text-faint">
                  Nada na agenda de hoje.
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-navy">
                Publicações novas
              </h2>
              <Link
                href="/publicacoes"
                className="inline-flex items-center gap-1 text-[13px] text-info hover:underline"
              >
                Ver <ChevronRight size={14} />
              </Link>
            </div>
            <p className="mb-3 text-[11px] text-faint">
              Número e classe detectados pelo PDF
            </p>
            <ul className="flex flex-col gap-2">
              {publicacoes.map((p) => (
                <li key={p.numero}>
                  <Link
                    href="/publicacoes"
                    className="block rounded-md border border-line p-2.5 transition-colors hover:border-gold/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-ink">
                        {p.titulo}
                      </span>
                      <AreaTag area={p.area} />
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-faint">
                      {p.numero}
                    </div>
                  </Link>
                </li>
              ))}
              {publicacoes.length === 0 && (
                <li className="text-[12px] text-faint">
                  Nenhuma publicação nova.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
