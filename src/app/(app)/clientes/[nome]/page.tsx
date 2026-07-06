import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Briefcase,
  CalendarClock,
  ListChecks,
  Phone,
  Mail,
  IdCard,
  Gavel,
} from "lucide-react";
import { getFichaCliente } from "@/lib/data";
import { AreaTag } from "@/components/AreaTag";
import { AvatarGroup } from "@/components/Avatar";
import { statusLabel, corDoStatus } from "@/lib/mock";
import { brCurto } from "@/lib/hoje";

export const dynamic = "force-dynamic";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  const { nome } = await params;
  const ficha = await getFichaCliente(decodeURIComponent(nome));
  if (!ficha) notFound();
  const { contato, processos, tarefas, audiencias, totais } = ficha;

  const kpis = [
    { icon: Briefcase, label: "Processos", valor: totais.processos },
    { icon: ListChecks, label: "Tarefas abertas", valor: totais.tarefasAbertas },
    {
      icon: CalendarClock,
      label: "Audiências futuras",
      valor: totais.audienciasFuturas,
    },
  ];

  const contatoLinhas: [typeof IdCard, string][] = contato
    ? ([
        [IdCard, contato.documento],
        [Phone, contato.telefone],
        [Mail, contato.email],
      ].filter(([, v]) => !!v) as [typeof IdCard, string][])
    : [];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/contatos"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Contatos
      </Link>

      <div className="mb-3 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-serif text-2xl text-navy">{ficha.nome}</div>
            <div className="mt-1 text-[12px] text-muted">
              {contato
                ? contato.tipo === "pj"
                  ? "Pessoa jurídica"
                  : "Pessoa física"
                : "Cliente"}
              {contato?.profissao ? ` · ${contato.profissao}` : ""}
            </div>
          </div>
        </div>
        {contatoLinhas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
            {contatoLinhas.map(([Icone, v], i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[13px] text-ink"
              >
                <Icone size={14} className="text-faint" />
                {v}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-md border border-line bg-cream/40 p-3"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <k.icon size={13} /> {k.label}
              </div>
              <div className="mt-1 text-2xl font-medium text-navy">
                {k.valor}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mb-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-2 text-[15px] font-medium text-navy">Processos</h2>
        {processos.length === 0 && (
          <p className="py-2 text-[12px] text-faint">
            Nenhum processo cadastrado para este cliente.
          </p>
        )}
        {processos.map((p, i) => (
          <Link
            key={p.id}
            href={`/processos/${p.id}`}
            className={
              "flex items-center gap-3 py-2.5 hover:bg-cream/60 " +
              (i > 0 ? "border-t border-line" : "")
            }
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[13px] text-ink">{p.numero}</div>
              <div className="text-[11px] text-faint">
                {p.tribunal} · contra {p.parteContraria}
              </div>
            </div>
            <AreaTag area={p.area} />
            <span className="whitespace-nowrap rounded bg-ok/15 px-2 py-0.5 text-[11px] text-ok">
              {p.status}
            </span>
          </Link>
        ))}
      </section>

      <section className="mb-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-2 text-[15px] font-medium text-navy">Tarefas</h2>
        {tarefas.length === 0 && (
          <p className="py-2 text-[12px] text-faint">Nenhuma tarefa.</p>
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
              <div className="font-mono text-[11px] text-faint">
                {t.processo}
              </div>
            </div>
            <AvatarGroup inis={t.responsaveis} />
            <span className="w-12 text-right text-[11px] text-muted">
              {t.prazo}
            </span>
            <span
              className={
                "whitespace-nowrap rounded px-2 py-0.5 text-[11px] " +
                `${corDoStatus(t.status).bg} ${corDoStatus(t.status).text}`
              }
            >
              {statusLabel[t.status] ?? t.status}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-2 text-[15px] font-medium text-navy">Audiências</h2>
        {audiencias.length === 0 && (
          <p className="py-2 text-[12px] text-faint">Nenhuma audiência.</p>
        )}
        {audiencias.map((a, i) => (
          <div
            key={a.id}
            className={
              "flex items-center gap-3 py-2.5 " +
              (i > 0 ? "border-t border-line" : "") +
              (a.status === "cancelada" ? " opacity-50" : "")
            }
          >
            <Gavel size={15} className="shrink-0 text-gold" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-ink">{a.titulo}</div>
              <div className="text-[11px] text-faint">
                {a.tipo} · {a.modalidade}
                {a.local ? ` · ${a.local}` : ""}
              </div>
            </div>
            <span className="whitespace-nowrap text-[11px] font-medium text-gold">
              {brCurto(a.data)} · {a.hora}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
