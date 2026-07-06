"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Printer, FileText, Download, Eye } from "lucide-react";
import type { CargaTarefa, MembroEquipe } from "@/lib/data";
import { NOMES_MES } from "@/lib/calendario";

// Data (Brasília, UTC-3) de um instante ISO — "yyyy-mm-dd".
function dataBRT(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

type Linha = {
  ini: string;
  nome: string;
  concluidas: number;
  noPrazo: number;
  foraPrazo: number;
  emAtraso: number;
};

export function RelatorioView({
  tarefas,
  equipe,
  hoje,
}: {
  tarefas: CargaTarefa[];
  equipe: MembroEquipe[];
  hoje: string;
}) {
  const [ref, setRef] = useState({
    ano: Number(hoje.slice(0, 4)),
    mes: Number(hoje.slice(5, 7)),
  });
  const [diaAtiv, setDiaAtiv] = useState(hoje);
  const mesKey = `${ref.ano}-${String(ref.mes).padStart(2, "0")}`;

  const linhas = useMemo<Linha[]>(() => {
    return equipe
      .map((m) => {
        // Concluídas no mês de referência (pela data de conclusão em Brasília).
        const concluidasMes = tarefas.filter(
          (t) =>
            t.responsaveis.includes(m.iniciais) &&
            t.status === "concluida" &&
            dataBRT(t.concluidaEm).startsWith(mesKey),
        );
        // No prazo = concluída até a data fatal; fora = concluída depois.
        let noPrazo = 0;
        let foraPrazo = 0;
        for (const t of concluidasMes) {
          const dc = dataBRT(t.concluidaEm);
          if (t.data && dc && dc > t.data) foraPrazo++;
          else noPrazo++;
        }
        // Em atraso hoje = aberta e já vencida (independe do mês).
        const emAtraso = tarefas.filter(
          (t) =>
            t.responsaveis.includes(m.iniciais) &&
            t.status !== "concluida" &&
            t.data &&
            t.data < hoje,
        ).length;
        return {
          ini: m.iniciais,
          nome: m.nome,
          concluidas: concluidasMes.length,
          noPrazo,
          foraPrazo,
          emAtraso,
        };
      })
      .sort((a, b) => b.concluidas - a.concluidas);
  }, [tarefas, equipe, mesKey, hoje]);

  const tot = linhas.reduce(
    (acc, l) => ({
      concluidas: acc.concluidas + l.concluidas,
      noPrazo: acc.noPrazo + l.noPrazo,
      foraPrazo: acc.foraPrazo + l.foraPrazo,
      emAtraso: acc.emAtraso + l.emAtraso,
    }),
    { concluidas: 0, noPrazo: 0, foraPrazo: 0, emAtraso: 0 },
  );
  const pct = (n: number, d: number) =>
    d > 0 ? Math.round((n / d) * 100) : 0;

  const passoMes = (delta: number) =>
    setRef(({ ano, mes }) => {
      const m = mes + delta;
      if (m < 1) return { ano: ano - 1, mes: 12 };
      if (m > 12) return { ano: ano + 1, mes: 1 };
      return { ano, mes: m };
    });

  return (
    <div className="mx-auto max-w-4xl">
      {/* Isola só o relatório na impressão / PDF. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #relatorio-print, #relatorio-print * { visibility: visible !important; }
          #relatorio-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 8mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Relatório mensal</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => passoMes(-1)}
              className="text-muted hover:text-navy"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-40 text-center text-[14px] font-medium capitalize text-navy">
              {NOMES_MES[ref.mes - 1]} de {ref.ano}
            </span>
            <button
              onClick={() => passoMes(1)}
              className="text-muted hover:text-navy"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Relatório diário de atividades (PDF por pessoa, via linha do tempo) */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-cream/40 p-4">
        <div className="flex items-start gap-2.5">
          <FileText size={18} className="mt-0.5 shrink-0 text-navy" />
          <div>
            <div className="text-[14px] font-medium text-navy">
              Relatório diário de atividades
            </div>
            <div className="text-[12px] text-muted">
              O que cada pessoa fez no dia (criou, mandou pra revisão, concluiu,
              comentou), em PDF. Enviado ao sócio às 19h e disponível aqui na hora.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={diaAtiv}
            max={hoje}
            onChange={(e) => setDiaAtiv(e.target.value)}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none"
          />
          <a
            href={`/relatorio/diario?data=${diaAtiv}`}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
          >
            <Eye size={15} /> Ver relatório
          </a>
          <a
            href={`/api/relatorio-diario?data=${diaAtiv}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-navy hover:bg-cream"
          >
            <Download size={15} /> PDF
          </a>
        </div>
      </div>

      <div id="relatorio-print" className="rounded-lg border border-line bg-surface p-6">
        <div className="mb-4 border-b border-line pb-3">
          <div className="font-serif text-xl text-navy">Branco Advogados</div>
          <div className="text-[13px] text-muted">
            Produtividade da equipe ·{" "}
            <span className="capitalize">{NOMES_MES[ref.mes - 1]}</span> de{" "}
            {ref.ano}
          </div>
        </div>

        {/* Resumo do mês */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Concluídas", valor: tot.concluidas, cor: "text-navy" },
            { label: "No prazo", valor: tot.noPrazo, cor: "text-ok" },
            { label: "Fora do prazo", valor: tot.foraPrazo, cor: "text-danger" },
            {
              label: "% no prazo",
              valor: `${pct(tot.noPrazo, tot.concluidas)}%`,
              cor: "text-navy",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-md border border-line p-3">
              <div className="text-[11px] text-muted">{k.label}</div>
              <div className={"mt-0.5 text-2xl font-medium " + k.cor}>
                {k.valor}
              </div>
            </div>
          ))}
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
              <th className="py-2 pr-2 font-medium">Pessoa</th>
              <th className="py-2 px-2 text-right font-medium">Concluídas</th>
              <th className="py-2 px-2 text-right font-medium">No prazo</th>
              <th className="py-2 px-2 text-right font-medium">Fora do prazo</th>
              <th className="py-2 px-2 text-right font-medium">% no prazo</th>
              <th className="py-2 pl-2 text-right font-medium">Em atraso hoje</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.ini} className="border-b border-line/70">
                <td className="py-2 pr-2 text-ink">{l.nome}</td>
                <td className="py-2 px-2 text-right tabular-nums text-ink">
                  {l.concluidas}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-ok">
                  {l.noPrazo}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-danger">
                  {l.foraPrazo || "—"}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-muted">
                  {l.concluidas ? `${pct(l.noPrazo, l.concluidas)}%` : "—"}
                </td>
                <td className="py-2 pl-2 text-right tabular-nums">
                  <span className={l.emAtraso ? "font-medium text-danger" : "text-faint"}>
                    {l.emAtraso || "—"}
                  </span>
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[13px] text-faint">
                  Nenhuma pessoa na equipe.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line font-medium">
              <td className="py-2 pr-2 text-navy">Total</td>
              <td className="py-2 px-2 text-right tabular-nums text-navy">
                {tot.concluidas}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-ok">
                {tot.noPrazo}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-danger">
                {tot.foraPrazo || "—"}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-navy">
                {pct(tot.noPrazo, tot.concluidas)}%
              </td>
              <td className="py-2 pl-2 text-right tabular-nums text-danger">
                {tot.emAtraso || "—"}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-4 text-[10.5px] leading-relaxed text-faint">
          &quot;No prazo&quot; = tarefa concluída até a data fatal do escritório.
          &quot;Em atraso hoje&quot; conta tarefas ainda abertas cuja data fatal já
          passou (independe do mês). Baseado na data de conclusão registrada no
          sistema.
        </p>
      </div>
    </div>
  );
}
