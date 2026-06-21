import { getPainel } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { AreaTag } from "@/components/AreaTag";

export const dynamic = "force-dynamic";

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
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-navy">Bom dia, {primeiroNome}</h1>
        <p className="text-sm text-muted">Sexta-feira, 19 de junho de 2026</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-line bg-surface px-4 py-3"
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
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-navy">Minhas tarefas</h2>
            <span className="cursor-pointer text-[13px] text-info">
              Ver todas
            </span>
          </div>
          <ul>
            {tarefas.map((t) => (
              <li
                key={t.id}
                className="flex items-start gap-3 border-t border-line py-2.5 first:border-t-0"
              >
                <div className="mt-0.5 h-4 w-4 rounded-sm border border-faint" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink">{t.titulo}</div>
                  <div className="font-mono text-[11px] text-faint">
                    Proc. {t.processo}
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
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="mb-3 text-[15px] font-medium text-navy">
              Agenda de hoje
            </h2>
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
            </ul>
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-navy">
                Publicações novas
              </h2>
            </div>
            <p className="mb-3 text-[11px] text-faint">
              Número e classe detectados pelo PDF
            </p>
            <ul className="flex flex-col gap-2">
              {publicacoes.map((p) => (
                <li
                  key={p.numero}
                  className="rounded-md border border-line p-2.5"
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
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
