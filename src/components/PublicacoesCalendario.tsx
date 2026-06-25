"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DOWS, NOMES_MES, gridMes } from "@/lib/calendario";
import { hojeISO } from "@/lib/hoje";
import { AreaTag } from "@/components/AreaTag";
import type { PublicacaoCal } from "@/lib/data";

const STATUS_PUB: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-gold/15 text-gold" },
  processada: { label: "Processada", cls: "bg-ok/15 text-ok" },
  ignorada: { label: "Ignorada", cls: "bg-line text-faint" },
};

const corArea = (area: string) =>
  area === "trabalhista"
    ? "bg-trab-bg text-trab-text"
    : "bg-civ-bg text-civ-text";

const brData = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function PublicacoesCalendario({
  publicacoes,
}: {
  publicacoes: PublicacaoCal[];
}) {
  const HOJE = hojeISO();
  // Abre no dia da publicação mais recente (assim, ao importar datas antigas,
  // o calendário já mostra onde há publicação em vez de abrir num mês vazio).
  const datas = publicacoes.map((p) => p.data).filter(Boolean);
  const ref =
    datas.length > 0 ? datas.reduce((a, b) => (a > b ? a : b)) : HOJE;
  const [mesAtual, setMesAtual] = useState({
    ano: Number(ref.slice(0, 4)),
    mes: Number(ref.slice(5, 7)),
  });
  const [diaSel, setDiaSel] = useState<string>(ref);

  const doDia = (iso: string) => publicacoes.filter((p) => p.data === iso);
  const selecionadas = doDia(diaSel);

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-4">
        <button
          onClick={() =>
            setMesAtual(({ ano, mes }) =>
              mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 },
            )
          }
          className="text-muted hover:text-navy"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-medium capitalize text-navy">
          {NOMES_MES[mesAtual.mes - 1]} de {mesAtual.ano}
        </span>
        <button
          onClick={() =>
            setMesAtual(({ ano, mes }) =>
              mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 },
            )
          }
          className="text-muted hover:text-navy"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {DOWS.map((d) => (
          <div
            key={d}
            className="bg-cream py-1.5 text-center text-[11px] text-muted"
          >
            {d}
          </div>
        ))}
        {gridMes(mesAtual.ano, mesAtual.mes)
          .flat()
          .map((cel) => {
            const items = doDia(cel.iso);
            const hoje = cel.iso === HOJE;
            const sel = cel.iso === diaSel;
            return (
              <button
                key={cel.iso}
                onClick={() => setDiaSel(cel.iso)}
                className={
                  "min-h-[92px] bg-surface p-1.5 text-left transition-colors hover:bg-cream/60 " +
                  (cel.doMes ? "" : "opacity-40 ") +
                  (sel ? "ring-2 ring-inset ring-gold" : "")
                }
              >
                <div className="mb-1 flex justify-end">
                  {hoje ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[11px] font-medium text-cream">
                      {cel.dia}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">{cel.dia}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {items.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      title={`${p.tribunal} · ${p.tipo}`}
                      className={
                        "truncate rounded px-1 py-0.5 text-[10.5px] " +
                        corArea(p.area)
                      }
                    >
                      {p.tribunal} · {p.tipo}
                    </span>
                  ))}
                  {items.length > 3 && (
                    <span className="text-[10px] text-faint">
                      +{items.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      <div className="mt-5">
        <h2 className="mb-2 text-[13px] font-medium text-navy">
          Publicações de {brData(diaSel)}
          <span className="ml-2 text-[12px] font-normal text-faint">
            {selecionadas.length}{" "}
            {selecionadas.length === 1 ? "publicação" : "publicações"}
          </span>
        </h2>
        {selecionadas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-[13px] text-faint">
            Nenhuma publicação neste dia.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selecionadas.map((p) => {
              const st = STATUS_PUB[p.statusTriagem] ?? STATUS_PUB.pendente;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-line bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[12.5px] text-ink">
                        {p.numero}
                      </div>
                      <div className="mt-0.5 text-[12px] text-muted">
                        {p.tribunal} · {p.tipo}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={"rounded px-2 py-0.5 text-[10.5px] " + st.cls}
                      >
                        {st.label}
                      </span>
                      <AreaTag area={p.area} />
                    </div>
                  </div>
                  {p.partes && (
                    <div className="mt-1.5 text-[12.5px] text-ink">
                      {p.partes}
                    </div>
                  )}
                  {p.despacho && (
                    <div className="mt-1 text-[12px] text-muted">
                      {p.despacho}
                    </div>
                  )}
                  {p.prazo && (
                    <div className="mt-1.5 text-[11.5px] text-muted">
                      Prazo:{" "}
                      <span className="font-medium text-ink">{p.prazo}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
