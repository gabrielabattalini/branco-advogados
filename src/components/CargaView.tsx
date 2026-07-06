"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ListChecks, Users } from "lucide-react";
import { hojeISO } from "@/lib/hoje";
import type { CargaTarefa, MembroEquipe } from "@/lib/data";

// Status na ordem fixa. Cores validadas para separação por daltonismo
// (script do guia dataviz); acompanham sempre legenda + rótulos + tabela.
const ABERTO = [
  { key: "a_fazer", label: "A fazer", cor: "#8a8578" },
  { key: "em_curso", label: "Em curso", cor: "#056235" },
  { key: "em_correcao", label: "Em correção", cor: "#c0892e" },
  { key: "aguardando", label: "Aguardando", cor: "#3f6f82" },
] as const;
const STATUS_ALL = [...ABERTO, { key: "concluida", label: "Concluída", cor: "#2e7d52" }] as const;
const COR_OK = "#2e7d52";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

type AreaFiltro = "todas" | "civel" | "trabalhista";

// Piso do alerta de sobrecarga (o efetivo é o maior entre isto e 1,75× a média).
const LIMITE_SOBRECARGA = 12;

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

  const d = useMemo(() => {
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
      return { ...m, byStatus, aberto: abertoN, total, concluidas, urgentes, atrasadas, pct: total ? Math.round((concluidas / total) * 100) : 0 };
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

    // Distribuições
    const porStatus = STATUS_ALL.map((s) => ({ ...s, n: ts.filter((t) => t.status === s.key).length }));
    const porArea = [
      { label: "Cível", n: ts.filter((t) => t.area === "civel").length, cor: "#056235" },
      { label: "Trabalhista", n: ts.filter((t) => t.area === "trabalhista").length, cor: "#b0894f" },
    ];
    const porOrigem = [
      { label: "Manual", n: ts.filter((t) => t.origem !== "aasp").length, cor: "#3f6f82" },
      { label: "Triagem AASP", n: ts.filter((t) => t.origem === "aasp").length, cor: "#b0894f" },
    ];
    const nr = { sem: 0, um: 0, dois: 0, tres: 0 };
    for (const t of ts) {
      const c = t.responsaveis.length;
      if (c === 0) nr.sem++;
      else if (c === 1) nr.um++;
      else if (c === 2) nr.dois++;
      else nr.tres++;
    }
    const porNResp = [
      { label: "Individual (1)", n: nr.um },
      { label: "Em dupla (2)", n: nr.dois },
      { label: "Em grupo (3+)", n: nr.tres },
      { label: "Sem responsável", n: nr.sem },
    ];

    // Ranking de conclusão
    const ranking = membros.filter((m) => m.total > 0).slice().sort((a, b) => b.pct - a.pct || b.concluidas - a.concluidas);

    // Solicitante / revisor
    const nomeIni = new Map(equipe.map((m) => [m.iniciais, primeiroNome(m.nome)]));
    const contar = (campo: "solicitante" | "revisor") => {
      const map = new Map<string, number>();
      for (const t of ts) {
        const v = t[campo];
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([ini, n]) => ({ nome: nomeIni.get(ini) ?? ini, n }))
        .sort((a, b) => b.n - a.n);
    };
    const solic = contar("solicitante");
    const revis = contar("revisor");

    // Entradas por mês (stacked por status), últimos 6
    const mesMap = new Map<string, Record<string, number>>();
    for (const t of ts) {
      const mm = (t.criadoEm || "").slice(0, 7);
      if (!mm) continue;
      if (!mesMap.has(mm)) mesMap.set(mm, { a_fazer: 0, em_curso: 0, em_correcao: 0, aguardando: 0, concluida: 0 });
      const bucket = mesMap.get(mm)!;
      bucket[t.status] = (bucket[t.status] ?? 0) + 1;
    }
    const porMes = [...mesMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-6)
      .map(([mm, c]) => ({ mm, c, total: Object.values(c).reduce((s, x) => s + x, 0) }));
    const maxMes = Math.max(1, ...porMes.map((m) => m.total));

    // Conclusões por data (usa concluidaEm, carimbado a partir de agora)
    const concl = ts.filter((t) => t.status === "concluida" && t.concluidaEm);
    const semMap = new Map<string, number>();
    for (const t of concl) {
      const k = segundaDaSemana(t.concluidaEm);
      semMap.set(k, (semMap.get(k) ?? 0) + 1);
    }
    const porSemana = [...semMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-8).map(([k, n]) => ({ k, n }));
    const maxSem = Math.max(1, ...porSemana.map((x) => x.n));

    const tempoMap = new Map<string, { soma: number; n: number }>();
    for (const t of concl) {
      const dias = (new Date(t.concluidaEm).getTime() - new Date(t.criadoEm).getTime()) / 86400000;
      if (!(dias >= 0)) continue;
      for (const ini of t.responsaveis) {
        const o = tempoMap.get(ini) ?? { soma: 0, n: 0 };
        o.soma += dias;
        o.n++;
        tempoMap.set(ini, o);
      }
    }
    const tempoMedio = [...tempoMap.entries()]
      .map(([ini, o]) => ({ nome: nomeIni.get(ini) ?? ini, dias: o.soma / o.n }))
      .sort((a, b) => a.dias - b.dias);
    const maxTempo = Math.max(1, ...tempoMedio.map((x) => x.dias));

    // Sobrecarga: quem está bem acima da média (e do limite) em tarefas abertas.
    const limite = Math.max(LIMITE_SOBRECARGA, Math.ceil(avg * 1.75));
    const sobrecarregados = membros
      .filter((m) => m.aberto > limite)
      .map((m) => ({ nome: primeiroNome(m.nome), aberto: m.aberto }));

    return { ts, membros, kpi, avg, maxOpen, porStatus, porArea, porOrigem, porNResp, ranking, solic, revis, porMes, maxMes, porSemana, maxSem, tempoMedio, maxTempo, totalConcl: concl.length, sobrecarregados, limite };
  }, [tarefas, equipe, area, HOJE]);

  const avgFrac = d.maxOpen ? d.avg / d.maxOpen : 0;
  const maxStatus = Math.max(1, ...d.porStatus.map((s) => s.n));
  const maxAO = Math.max(1, ...d.porArea.map((x) => x.n), ...d.porOrigem.map((x) => x.n));
  const maxNResp = Math.max(1, ...d.porNResp.map((x) => x.n));
  const maxSolic = Math.max(1, ...d.solic.map((x) => x.n));
  const maxRevis = Math.max(1, ...d.revis.map((x) => x.n));

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
              className={"px-4 py-2 text-sm transition-colors " + (area === key ? "bg-navy text-cream" : "bg-surface text-muted hover:bg-navy/5")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi icon={<ListChecks size={18} />} label="Tarefas" valor={d.kpi.total} />
        <Kpi icon={<CalendarClock size={18} />} label="Em aberto" valor={d.kpi.aberto} />
        <Kpi icon={<CheckCircle2 size={18} />} label="Concluídas" valor={d.kpi.concluidas} tom="ok" />
        <Kpi icon={<AlertTriangle size={18} />} label="Urgentes" valor={d.kpi.urgentes} tom={d.kpi.urgentes ? "danger" : undefined} />
        <Kpi icon={<AlertTriangle size={18} />} label="Atrasadas" valor={d.kpi.atrasadas} tom={d.kpi.atrasadas ? "danger" : undefined} />
      </div>

      {/* Alerta de sobrecarga */}
      {d.sobrecarregados.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/[0.06] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-[13px] text-ink">
            <span className="font-semibold text-danger">
              Sobrecarga na equipe.
            </span>{" "}
            Acima de {d.limite} tarefas em aberto:{" "}
            {d.sobrecarregados
              .map((m) => `${m.nome} (${m.aberto})`)
              .join(", ")}
            . Vale redistribuir no balanceamento abaixo.
          </div>
        </div>
      )}

      {/* Carga por pessoa */}
      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Carga por pessoa · tarefas em aberto</h2>
          <Legenda itens={ABERTO} />
        </div>
        <p className="mb-5 text-xs text-muted">
          Média da equipe: <strong className="text-ink">{d.avg.toFixed(1)}</strong> em aberto por pessoa
          {d.kpi.semResp > 0 && <> · <span className="text-danger">{d.kpi.semResp} sem responsável</span></>}
          <span className="ml-1">(a linha tracejada marca a média)</span>
        </p>
        <div className="flex flex-col gap-2.5">
          {d.membros.map((m) => {
            const acima = m.aberto > d.avg * 1.15 && m.aberto > 0;
            return (
              <div key={m.iniciais} className="flex items-center gap-3">
                <div className="flex w-32 shrink-0 items-center gap-2 truncate">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-medium text-navy">{m.iniciais}</span>
                  <span className="truncate text-sm text-ink" title={m.nome}>{primeiroNome(m.nome)}</span>
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
                          className={(first ? "rounded-l-[3px] " : "") + (last ? "rounded-r-[3px] " : "")}
                          style={{ width: `${(n / d.maxOpen) * 100}%`, background: s.cor }}
                        />
                      );
                    })}
                  </div>
                  {d.avg > 0 && (
                    <div className="pointer-events-none absolute inset-y-[-3px] border-l border-dashed border-ink/35" style={{ left: `${avgFrac * 100}%` }} />
                  )}
                </div>
                <div className={"w-10 shrink-0 text-right text-sm tabular-nums " + (acima ? "font-semibold text-danger" : "text-ink")}>{m.aberto}</div>
              </div>
            );
          })}
          {d.membros.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum membro atribuível.</p>}
        </div>
      </div>

      {/* Tabela de balanceamento */}
      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
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
              {d.membros.map((m) => {
                const nivel = m.aberto > d.avg * 1.15 ? "acima" : m.aberto < d.avg * 0.85 ? "abaixo" : "media";
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
                    <td className="py-2.5 pl-3"><CargaBadge nivel={nivel} /></td>
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

      {/* Distribuições */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Distribuições</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Secao title="Por status">
          {d.porStatus.map((s) => (
            <Barra key={s.key} label={s.label} valor={s.n} max={maxStatus} cor={s.cor} />
          ))}
        </Secao>
        <Secao title="Tarefas por nº de responsáveis">
          {d.porNResp.map((x) => (
            <Barra key={x.label} label={x.label} valor={x.n} max={maxNResp} cor="#556b57" />
          ))}
        </Secao>
        <Secao title="Por área">
          {d.porArea.map((x) => (
            <Barra key={x.label} label={x.label} valor={x.n} max={maxAO} cor={x.cor} />
          ))}
        </Secao>
        <Secao title="Por origem">
          {d.porOrigem.map((x) => (
            <Barra key={x.label} label={x.label} valor={x.n} max={maxAO} cor={x.cor} />
          ))}
        </Secao>
      </div>

      {/* Produtividade & risco */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Produtividade &amp; ritmo</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Secao title="Ranking de conclusão">
          {d.ranking.map((m) => (
            <Barra key={m.iniciais} label={primeiroNome(m.nome)} valor={m.pct} max={100} cor={COR_OK} sufixo="%" />
          ))}
          {d.ranking.length === 0 && <p className="py-4 text-center text-sm text-muted">Sem tarefas.</p>}
        </Secao>
        <Secao title="Entradas por mês" legenda={STATUS_ALL}>
          {d.porMes.map((m) => (
            <div key={m.mm} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-sm text-ink">{fmtMes(m.mm)}</div>
              <div className="flex h-4 flex-1 items-stretch gap-[2px]">
                {STATUS_ALL.map((s, i) => {
                  const n = m.c[s.key] ?? 0;
                  if (!n) return null;
                  const first = STATUS_ALL.slice(0, i).every((p) => !(m.c[p.key] ?? 0));
                  const last = STATUS_ALL.slice(i + 1).every((p) => !(m.c[p.key] ?? 0));
                  return (
                    <div
                      key={s.key}
                      title={`${s.label}: ${n}`}
                      className={(first ? "rounded-l-[3px] " : "") + (last ? "rounded-r-[3px] " : "")}
                      style={{ width: `${(n / d.maxMes) * 100}%`, background: s.cor }}
                    />
                  );
                })}
              </div>
              <div className="w-8 shrink-0 text-right text-sm tabular-nums text-ink">{m.total}</div>
            </div>
          ))}
          {d.porMes.length === 0 && <p className="py-4 text-center text-sm text-muted">Sem histórico.</p>}
        </Secao>
      </div>

      {/* Conclusões por data */}
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">Conclusões · por data</h2>
        <span className="text-[11px] text-faint">
          {d.totalConcl} com data registrada · conta a partir de agora
        </span>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Secao title="Concluídas por semana">
          {d.porSemana.map((s) => (
            <Barra key={s.k} label={fmtDia(s.k)} valor={s.n} max={d.maxSem} cor={COR_OK} />
          ))}
          {d.porSemana.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">Ainda sem conclusões com data registrada.</p>
          )}
        </Secao>
        <Secao title="Tempo médio até concluir">
          {d.tempoMedio.map((x) => (
            <Barra key={x.nome} label={x.nome} valor={Math.round(x.dias)} max={d.maxTempo} cor="#3f6f82" sufixo=" d" />
          ))}
          {d.tempoMedio.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">Preenche conforme as tarefas forem concluídas.</p>
          )}
        </Secao>
      </div>

      {/* Solicitante & revisor */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Solicitações &amp; revisões</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Secao title="Quem mais solicita">
          {d.solic.map((x) => (
            <Barra key={x.nome} label={x.nome} valor={x.n} max={maxSolic} cor="#3f6f82" />
          ))}
          {d.solic.length === 0 && <p className="py-4 text-center text-sm text-muted">Nenhum solicitante registrado.</p>}
        </Secao>
        <Secao title="Quem mais revisa">
          {d.revis.map((x) => (
            <Barra key={x.nome} label={x.nome} valor={x.n} max={maxRevis} cor="#b0894f" />
          ))}
          {d.revis.length === 0 && <p className="py-4 text-center text-sm text-muted">Nenhum revisor registrado.</p>}
        </Secao>
      </div>
    </div>
  );
}

function Secao({ title, children, legenda }: { title: string; children: React.ReactNode; legenda?: readonly { key: string; label: string; cor: string }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {legenda && <Legenda itens={legenda} />}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Barra({ label, valor, max, cor, sufixo = "" }: { label: string; valor: number; max: number; cor: string; sufixo?: string }) {
  const w = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 truncate text-sm text-ink" title={label}>{label}</div>
      <div className="h-3 flex-1 overflow-hidden rounded-[3px] bg-navy/8">
        <div className="h-full rounded-[3px]" style={{ width: `${w}%`, background: cor }} title={`${valor}${sufixo}`} />
      </div>
      <div className="w-12 shrink-0 text-right text-sm tabular-nums text-ink">{valor}{sufixo}</div>
    </div>
  );
}

function Legenda({ itens }: { itens: readonly { key: string; label: string; cor: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {itens.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s.cor }} />
          {s.label}
        </span>
      ))}
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
  if (nivel === "acima") return <span className="rounded-full bg-danger/12 px-2.5 py-1 text-xs font-medium text-danger">Acima da média</span>;
  if (nivel === "abaixo") return <span className="rounded-full bg-ok/12 px-2.5 py-1 text-xs font-medium text-ok">Com folga</span>;
  return <span className="rounded-full bg-navy/8 px-2.5 py-1 text-xs font-medium text-muted">Na média</span>;
}

function primeiroNome(nome: string): string {
  return nome.split(/\s+/)[0] ?? nome;
}

function fmtMes(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  const idx = Number(m) - 1;
  return `${MESES[idx] ?? m}/${(y ?? "").slice(2)}`;
}

function fmtDia(iso: string): string {
  const [, m, dd] = iso.split("-");
  return `${dd}/${m}`;
}

// Segunda-feira (UTC) da semana de um ISO — chave estável para agrupar por semana.
function segundaDaSemana(iso: string): string {
  const dt = new Date(iso);
  const off = (dt.getUTCDay() + 6) % 7; // 0 = segunda
  dt.setUTCDate(dt.getUTCDate() - off);
  return dt.toISOString().slice(0, 10);
}
