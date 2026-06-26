"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TriagemView } from "@/components/TriagemView";
import { gridMes, DOWS, NOMES_MES } from "@/lib/calendario";
import { hojeISO } from "@/lib/hoje";
import type { PublicacaoCal, Responsavel, TriagemPub } from "@/lib/data";
import type { Processo } from "@/lib/mock";

export function PublicacoesView({
  triagem,
  responsaveis,
  processos,
  ultimosResp,
  papel,
  me,
}: {
  publicacoes: PublicacaoCal[];
  triagem: TriagemPub[];
  responsaveis: Responsavel[];
  processos: Processo[];
  ultimosResp: Record<string, string[]>;
  papel: string;
  me?: string;
}) {
  // Contagem por dia (pendentes em amarelo no calendário).
  const porDia = useMemo(() => {
    const m = new Map<string, { pend: number; total: number }>();
    for (const p of triagem) {
      if (!p.disponibilizacao) continue;
      const e = m.get(p.disponibilizacao) ?? { pend: 0, total: 0 };
      e.total++;
      if (p.status === "pendente") e.pend++;
      m.set(p.disponibilizacao, e);
    }
    return m;
  }, [triagem]);

  // Dia inicial = dia mais recente com pendência (senão, hoje).
  const diaInicial = useMemo(() => {
    const comPend = [...porDia.entries()]
      .filter(([, v]) => v.pend > 0)
      .map(([d]) => d)
      .sort();
    return comPend.length ? comPend[comPend.length - 1] : hojeISO();
  }, [porDia]);

  const [diaSel, setDiaSel] = useState(diaInicial);
  const [ym, setYm] = useState(() => {
    const [y, m] = diaInicial.split("-").map(Number);
    return { ano: y, mes: m };
  });

  const semanas = gridMes(ym.ano, ym.mes);
  const hoje = hojeISO();
  const totalPend = [...porDia.values()].reduce((s, v) => s + v.pend, 0);

  const irMes = (delta: number) => {
    const d = new Date(ym.ano, ym.mes - 1 + delta, 1);
    setYm({ ano: d.getFullYear(), mes: d.getMonth() + 1 });
  };
  const selecionar = (iso: string) => {
    setDiaSel(iso);
    const [y, m] = iso.split("-").map(Number);
    if (y !== ym.ano || m !== ym.mes) setYm({ ano: y, mes: m });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Publicações</h1>
        <span className="text-[13px] text-muted">
          {totalPend > 0 ? (
            <>
              <span className="font-semibold text-navy">{totalPend}</span> publicação(ões)
              a triar
            </>
          ) : (
            "nenhuma pendência"
          )}
        </span>
      </div>

      {/* Calendário seletor */}
      <div className="mb-5 rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            onClick={() => irMes(-1)}
            className="rounded-md p-1 text-muted hover:bg-cream"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[13.5px] font-medium capitalize text-navy">
            {NOMES_MES[ym.mes - 1]} de {ym.ano}
          </span>
          <button
            onClick={() => irMes(1)}
            className="rounded-md p-1 text-muted hover:bg-cream"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DOWS.map((d) => (
            <div key={d} className="py-1 text-center text-[10.5px] font-medium text-faint">
              {d}
            </div>
          ))}
          {semanas.flat().map((c) => {
            const st = porDia.get(c.iso);
            const sel = c.iso === diaSel;
            const pend = st?.pend ?? 0;
            const triado = (st?.total ?? 0) > 0 && pend === 0;
            return (
              <button
                key={c.iso}
                onClick={() => selecionar(c.iso)}
                disabled={!c.doMes}
                className={
                  "relative flex h-11 flex-col items-center justify-center rounded-md border text-[12.5px] transition " +
                  (!c.doMes
                    ? "cursor-default border-transparent text-transparent"
                    : sel
                      ? "border-navy bg-navy text-cream"
                      : pend > 0
                        ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                        : triado
                          ? "border-line bg-white text-muted hover:bg-cream"
                          : "border-line bg-white text-stone-400 hover:bg-cream")
                }
              >
                <span className={c.iso === hoje && !sel ? "font-bold underline" : ""}>
                  {c.dia}
                </span>
                {pend > 0 && (
                  <span
                    className={
                      "mt-0.5 rounded-full px-1.5 text-[9.5px] font-semibold leading-tight " +
                      (sel ? "bg-cream/25 text-cream" : "bg-amber-400/70 text-amber-950")
                    }
                  >
                    {pend}
                  </span>
                )}
                {triado && (
                  <span
                    className={
                      "mt-0.5 text-[9px] " + (sel ? "text-cream/80" : "text-emerald-500")
                    }
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10.5px] text-faint">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-100" />
            pendente a triar
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-emerald-500">✓</span> tudo triado
          </span>
        </div>
      </div>

      {/* Triagem do dia selecionado */}
      <TriagemView
        pubs={triagem}
        processos={processos}
        responsaveis={responsaveis}
        ultimosResp={ultimosResp}
        papel={papel}
        me={me}
        dataFiltro={diaSel}
      />
    </div>
  );
}
