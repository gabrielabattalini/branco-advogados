"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ListChecks, Users } from "lucide-react";
import { hojeISO } from "@/lib/hoje";
import type { CargaTarefa, MembroEquipe } from "@/lib/data";

// Status "em aberto" na ordem fixa da barra empilhada. Cores validadas para
// separação por daltonismo (script do guia dataviz); acompanham legenda + tabela.
const ABERTO = [
  { key: "a_fazer", label: "A fazer", cor: "#8a8578" },
  { key: "em_curso", label: "Em curso", cor: "#056235" },
  { key: "em_correcao", label: "Em correção", cor: "#c0892e" },
  { key: "aguardando", label: "Aguardando", cor: "#3f6f82" },
] as const;
const COR_OK = "#2e7d52";

type AreaFiltro = "todas" | "civel" | "trabalhista";

type Membro = MembroEquipe & {
  byStatus: Record<string, number>;
  aberto: number;
  total: number;
  concluidas: number;
  urgentes: number;
  atrasadas: number;
  pct: number;
};

export function CargaView({
  tarefas,
  equipe,
}: {
  tarefas: CargaTarefa[];
  equipe: MembroEquipe[];
}) {
  const [area, setArea] = useState<AreaFiltro>("todas");
  const HOJE = hojeISO();

  const { membros, kpi, avg, maxOpen } = useMemo(() => {
    const ts = area === "todas" ? tarefas : tarefas.filter((t) => t.area === area);
    const aberta = (t: CargaTarefa) => t.status !== "concluida";

    const membros: Membro[] = equipe.map((m) => {
      const suas = ts.filter((t) => t.responsaveis.includes(m.iniciais));
      const byStatus: Record<string, number> = { a_fazer: 0, em_curso: 0, em_correcao: 0, aguardando: 0, concluida: 0 };
      let urgentes = 0;
      let atrasadas = 0;
      for (const t of suas) {
        byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
        if (aberta(t) && t.prazoUrgente) urgentes++;
        if (aberta(t) && t.data && t.data < HOJE) atrasadas++;
      }
      const abertoN = byStatus.a_fazer + byStatus.em_curso + byStatus.em_correcao + byStatus.aguardando;
      const total = suas.length;
      const concluidas = byStatus.concluida;
      return {
        ...m,
        byStatus,
        aberto: abertoN,
        total,
        concluidas,
        urgentes,
        atrasadas,
        pct: total ? Math.round((concluidas / total) * 100) : 0,
      };
    });
    membros.sort((a, b) => b.aberto - a.aberto || b.total - a.total);

    const kpi = {
      total: ts.length,
      aberto: ts.filter(aberta).length,
      concluidas: ts.filter((t) => t.status === "concluida").length,
      urgentes: ts.filter((t) => aberta(t) && t.prazoUrgente).length,
      atrasadas: ts.filter((t) => aberta(t) && t.data && t.data < HOJE).length,
      semResp: ts.filter((t) => aberta(t) && t.responsaveis.length === 0).length,
    };
    const somaAberto = membros.reduce((s, m) => s + m.aberto, 0);
    const avg = membros.length ? somaAberto / membros.length : 0;
    const maxOpen = Math.max(1, ...membros.map((m) => m.aberto));
    return { membros, kpi, avg, maxOpen };
  }, [tarefas, equipe, area, HOJE]);

  const avgFrac = maxOpen ? avg / maxOpen : 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabeçalho + filtro */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Carga de Trabalho</h1>
          <p className="mt-1 text-sm text-muted">
            Distribuição das tarefas entre a equipe — para equilibrar quem está com mais e quem tem folga.
          </p>
        </div>
        <div className="flex overflow-hidden rounded-md border border-line">
          {([
            ["todas", "Todas"],
            ["civel", "Cível"],
            ["trabalhista", "Trabalhista"],
          ] as [AreaFiltro, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setArea(key)}
              className={
                "px-4 py-2 text-sm transition-colors " +
                (area === key ? "bg-navy text-cream" : "bg-surface text-muted hover:bg-navy/5")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi icon={<ListChecks size={18} />} label="Tarefas" valor={kpi.total} />
        <Kpi icon={<CalendarClock size={18} />} label="Em aberto" valor={kpi.aberto} />
        <Kpi icon={<CheckCircle2 size={18} />} label="Concluídas" valor={kpi.concluidas} tom="ok" />
        <Kpi icon={<AlertTriangle size={18} />} label="Urgentes" valor={kpi.urgentes} tom={kpi.urgentes ? "danger" : undefined} />
        <Kpi icon={<AlertTriangle size={18} />} label="Atrasadas" valor={kpi.atrasadas} tom={kpi.atrasadas ? "danger" : undefined} />
      </div>

      {/* Carga por pessoa */}
      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Carga por pessoa · tarefas em aberto</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {ABERTO.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s.cor }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mb-5 text-xs text-muted">
          Média da equipe: <strong className="text-ink">{avg.toFixed(1)}</strong> em aberto por pessoa
          {kpi.semResp > 0 && <> · <span className="text-danger">{kpi.semResp} sem responsável</span></>}
          <span className="ml-1">(a linha tracejada marca a média)</span>
        </p>

        <div className="flex flex-col gap-2.5">
          {membros.map((m) => {
            const acima = m.aberto > avg * 1.15 && m.aberto > 0;
            return (
              <div key={m.iniciais} className="flex items-center gap-3">
                <div className="flex w-32 shrink-0 items-center gap-2 truncate">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-medium text-navy">
                    {m.iniciais}
                  </span>
                  <span className="truncate text-sm text-ink" title={m.nome}>
                    {primeiroNome(m.nome)}
                  </span>
                </div>

                <div className="relative h-5 flex-1">
                  <div className="flex h-full items-stretch gap-[2px]">
                    {ABERTO.map((s, i) => {
                      const n = m.byStatus[s.key] ?? 0;
                      if (!n) return null;
                      const first = ABERTO.slice(0, i).every((p) => !(m.byStatus[p.key] ?? 0));
                      const last = ABERTO.slice(i + 1).every((p) => !(m.byStatus[p.key] ?? 0));
                      return (
                        <div
                          key={s.key}
                          title={`${s.label}: ${n}`}
                          className={
                            (first ? "rounded-l-[3px] " : "") + (last ? "rounded-r-[3px] " : "")
                          }
                          style={{ width: `${(n / maxOpen) * 100}%`, background: s.cor }}
                        />
                      );
                    })}
                  </div>
                  {/* linha da média */}
                  {avg > 0 && (
                    <div
                      className="pointer-events-none absolute inset-y-[-3px] border-l border-dashed border-ink/35"
                      style={{ left: `${avgFrac * 100}%` }}
                    />
                  )}
                </div>

                <div className={"w-10 shrink-0 text-right text-sm tabular-nums " + (acima ? "font-semibold text-danger" : "text-ink")}>
                  {m.aberto}
                </div>
              </div>
            );
          })}
          {membros.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum membro atribuível.</p>}
        </div>
      </div>

      {/* Tabela de balanceamento */}
      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Balanceamento da equipe</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Membro</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-right font-medium">Em aberto</th>
                <th className="px-3 py-2 text-right font-medium">Concluídas</th>
                <th className="px-3 py-2 text-right font-medium">Urgentes</th>
                <th className="px-3 py-2 text-right font-medium">Atrasadas</th>
                <th className="px-3 py-2 font-medium">% concluído</th>
                <th className="py-2 pl-3 font-medium">Carga</th>
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => {
                const nivel = m.aberto > avg * 1.15 ? "acima" : m.aberto < avg * 0.85 ? "abaixo" : "media";
                return (
                  <tr key={m.iniciais} className="border-b border-line/70 last:border-0">
                    <td className="py-2.5 pr-3">
                      <div className="text-ink">{m.nome}</div>
                      <div className="text-[11px] capitalize text-faint">{m.area === "civel" ? "Cível" : "Trabalhista"}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">{m.total}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">{m.aberto}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ok">{m.concluidas}</td>
                    <td className={"px-3 py-2.5 text-right tabular-nums " + (m.urgentes ? "text-danger" : "text-faint")}>{m.urgentes}</td>
                    <td className={"px-3 py-2.5 text-right tabular-nums " + (m.atrasadas ? "text-danger" : "text-faint")}>{m.atrasadas}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy/10">
                          <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: COR_OK }} />
                        </div>
                        <span className="w-9 text-right text-xs tabular-nums text-muted">{m.pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3">
                      <CargaBadge nivel={nivel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Users size={14} />
          Uma tarefa com vários responsáveis conta para cada um deles — por isso ela reflete a carga real de cada pessoa.
        </p>
      </div>
    </div>
  );
}

function Kpi({ icon, label, valor, tom }: { icon: React.ReactNode; label: string; valor: number; tom?: "ok" | "danger" }) {
  const cor = tom === "ok" ? "text-ok" : tom === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <span className="text-faint">{icon}</span>
        {label}
      </div>
      <div className={"text-2xl font-semibold tabular-nums " + cor}>{valor}</div>
    </div>
  );
}

function CargaBadge({ nivel }: { nivel: "acima" | "media" | "abaixo" }) {
  if (nivel === "acima")
    return <span className="rounded-full bg-danger/12 px-2.5 py-1 text-xs font-medium text-danger">Acima da média</span>;
  if (nivel === "abaixo")
    return <span className="rounded-full bg-ok/12 px-2.5 py-1 text-xs font-medium text-ok">Com folga</span>;
  return <span className="rounded-full bg-navy/8 px-2.5 py-1 text-xs font-medium text-muted">Na média</span>;
}

function primeiroNome(nome: string): string {
  return nome.split(/\s+/)[0] ?? nome;
}
