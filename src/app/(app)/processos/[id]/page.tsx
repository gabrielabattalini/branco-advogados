import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, FileText, Download } from "lucide-react";
import { getFichaProcesso, getResponsaveis } from "@/lib/data";
import { AreaTag } from "@/components/AreaTag";
import { AvatarGroup } from "@/components/Avatar";
import { statusLabel, corDoStatus } from "@/lib/mock";

export const dynamic = "force-dynamic";

const estadoPub: Record<string, { label: string; cls: string }> = {
  pendente: { label: "pendente", cls: "text-muted" },
  processada: { label: "gerou tarefa", cls: "text-info" },
  ignorada: { label: "arquivada", cls: "text-faint" },
};

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ficha, responsaveis] = await Promise.all([
    getFichaProcesso(id),
    getResponsaveis(),
  ]);
  if (!ficha) notFound();
  const { processo: p, tarefas, documentos, publicacoes } = ficha;
  const primeiroNome = (ini: string) =>
    responsaveis.find((r) => r.iniciais === ini)?.nome.split(/\s+/)[0] ?? ini;

  const meta: [string, string][] = [
    ["Cliente", p.cliente],
    ["Parte contrária", p.parteContraria],
    ["Responsável", p.responsavel],
    ["Valor da causa", p.valorCausa],
    ["Distribuído em", p.distribuido],
    ["Fase", p.fase],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/processos"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Processos
      </Link>

      <div className="mb-3 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[16px] text-ink">{p.numero}</div>
            <div className="mt-1 text-[12px] text-muted">{p.tribunal}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AreaTag area={p.area} />
            <span className="rounded bg-ok/15 px-2 py-0.5 text-[11px] text-ok">
              {p.status}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          {meta.map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] text-faint">{label}</div>
              {label === "Cliente" && value ? (
                <Link
                  href={`/clientes/${encodeURIComponent(value)}`}
                  className="text-[13px] text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                >
                  {value}
                </Link>
              ) : (
                <div className="text-[13px] text-ink">{value}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <section className="mb-3 rounded-lg border border-line bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-navy">Tarefas</h2>
          <Link
            href="/tarefas"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-cream"
          >
            <Plus size={14} /> Nova tarefa
          </Link>
        </div>
        {tarefas.length === 0 && (
          <p className="py-2 text-[12px] text-faint">
            Nenhuma tarefa neste processo.
          </p>
        )}
        {tarefas.map((t, i) => (
          <div
            key={t.id}
            className={
              "flex items-center gap-3 py-2.5 " +
              (i > 0 ? "border-t border-line" : "")
            }
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-ink">{t.titulo}</div>
              {(t.solicitante || t.revisor) && (
                <div className="text-[10px] text-faint">
                  {t.solicitante && `Sol: ${primeiroNome(t.solicitante)}`}
                  {t.solicitante && t.revisor && " · "}
                  {t.revisor && `Rev: ${primeiroNome(t.revisor)}`}
                </div>
              )}
            </div>
            <AvatarGroup inis={t.responsaveis} />
            <span className="w-12 text-right text-[11px] text-muted">
              {t.prazo}
            </span>
            <span
              className={
                "rounded px-2 py-0.5 text-[11px] " +
                `${corDoStatus(t.status).bg} ${corDoStatus(t.status).text}`
              }
            >
              {statusLabel[t.status] ?? t.status}
            </span>
          </div>
        ))}
      </section>

      <section className="mb-3 rounded-lg border border-line bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-navy">Documentos</h2>
          <Link
            href="/documentos"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-cream"
          >
            <Plus size={14} /> Anexar
          </Link>
        </div>
        <div className="mb-1 text-[11px] text-faint">
          {p.cliente} › {p.numero}
        </div>
        {documentos.length === 0 && (
          <p className="py-2 text-[12px] text-faint">Nenhum documento ainda.</p>
        )}
        {documentos.map((d, i) => (
          <div
            key={d.ordem}
            className={
              "flex items-center gap-3 py-2.5 " +
              (i > 0 ? "border-t border-line" : "")
            }
          >
            <span className="w-6 font-mono text-[12px] text-faint">
              {d.ordem}
            </span>
            <FileText size={18} className="text-muted" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-ink">{d.nome}</div>
              <div className="text-[11px] text-faint">Adicionado {d.data}</div>
            </div>
            {d.temArquivo ? (
              <a
                href={`/api/documentos/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-line px-2.5 py-1 text-[11px] text-navy hover:bg-cream"
              >
                <Download size={13} /> Abrir
              </a>
            ) : (
              <span className="whitespace-nowrap text-[11px] text-faint">
                sem arquivo
              </span>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-navy">Publicações</h2>
          <span className="text-[11px] text-faint">via AASP</span>
        </div>
        {publicacoes.length === 0 && (
          <p className="py-2 text-[12px] text-faint">
            Nenhuma publicação ainda.
          </p>
        )}
        {publicacoes.map((pub, i) => {
          const est = estadoPub[pub.estado] ?? estadoPub.pendente;
          return (
            <div
              key={pub.id}
              className={
                "flex items-center gap-3 py-2.5 " +
                (i > 0 ? "border-t border-line" : "")
              }
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ink">{pub.titulo}</div>
                <div className="text-[11px] text-faint">{pub.origem}</div>
              </div>
              <span className={"whitespace-nowrap text-[11px] " + est.cls}>
                {est.label}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
