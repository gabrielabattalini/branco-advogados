"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react";
import type { ItemAgenda, Responsavel } from "@/lib/data";
import { ehGestor } from "@/lib/papeis";
import { AvatarGroup } from "@/components/Avatar";
import { NovoEventoModal } from "@/components/NovoEventoModal";
import {
  dataPorExtenso,
  mesAnoExtenso,
  brCurto,
  addDiasISO,
} from "@/lib/hoje";

const tipoMap: Record<string, { label: string; bar: string; tag: string }> = {
  reuniao: { label: "Reunião", bar: "bg-info", tag: "bg-info/15 text-info" },
  audiencia: {
    label: "Audiência",
    bar: "bg-gold",
    tag: "bg-trab-bg text-trab-text",
  },
  prazo: { label: "Prazo", bar: "bg-danger", tag: "bg-danger/15 text-danger" },
  atendimento: { label: "Atendimento", bar: "bg-ok", tag: "bg-ok/15 text-ok" },
};

type View = "dia" | "semana" | "mes";

function diaSemanaIdx(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).getDay(); // 0=domingo
}
function addMesISO(iso: string, n: number): string {
  const [y, m] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1, 12);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-01`;
}

export function AgendaView({
  itens,
  responsaveis,
  papel,
  hoje,
}: {
  itens: ItemAgenda[];
  responsaveis: Responsavel[];
  papel: string;
  hoje: string;
}) {
  const [showNovo, setShowNovo] = useState(false);
  const [dia, setDia] = useState(hoje);
  const [view, setView] = useState<View>("dia");
  const coord = ehGestor(papel);

  // Intervalo visível conforme a visão.
  let inicio = dia;
  let fim = dia;
  let header = "";
  if (view === "dia") {
    header = dataPorExtenso(dia);
  } else if (view === "semana") {
    inicio = addDiasISO(dia, -diaSemanaIdx(dia));
    fim = addDiasISO(inicio, 6);
    header = `Semana de ${brCurto(inicio)} a ${brCurto(fim)}`;
  } else {
    inicio = dia.slice(0, 8) + "01";
    fim = addDiasISO(addMesISO(dia, 1), -1);
    header = mesAnoExtenso(dia);
  }

  const visiveis = itens
    .filter((i) => i.data && i.data >= inicio && i.data <= fim)
    .sort((a, b) =>
      a.data === b.data
        ? a.hora.localeCompare(b.hora)
        : a.data.localeCompare(b.data),
    );

  // Agrupa por dia (usado nas visões semana/mês).
  const grupos: { data: string; itens: ItemAgenda[] }[] = [];
  for (const it of visiveis) {
    const g = grupos.find((x) => x.data === it.data);
    if (g) g.itens.push(it);
    else grupos.push({ data: it.data, itens: [it] });
  }

  function navegar(dir: number) {
    if (view === "dia") setDia(addDiasISO(dia, dir));
    else if (view === "semana") setDia(addDiasISO(dia, dir * 7));
    else setDia(addMesISO(dia, dir));
  }

  const ehHoje = dia === hoje;
  const vazioMsg =
    view === "dia"
      ? "Nenhum evento neste dia."
      : view === "semana"
        ? "Nenhum evento nesta semana."
        : "Nenhum evento neste mês.";

  function chip(v: View, txt: string) {
    return (
      <button
        onClick={() => setView(v)}
        className={
          "rounded-md px-3 py-1.5 text-sm " +
          (view === v
            ? "bg-navy text-cream"
            : "border border-line text-muted hover:bg-cream")
        }
      >
        {txt}
      </button>
    );
  }

  function card(e: ItemAgenda, idx: number) {
    const t = tipoMap[e.tipo] ?? tipoMap.reuniao;
    return (
      <div key={idx} className="flex gap-3">
        <div className="w-12 pt-2 text-[12px] font-medium text-navy">
          {e.hora}
        </div>
        <div className="flex flex-1 overflow-hidden rounded-md border border-line bg-surface">
          <div className={"w-1 shrink-0 " + t.bar} />
          <div className="flex-1 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className={"rounded px-2 py-0.5 text-[10px] " + t.tag}>
                {t.label}
              </span>
              {e.participantes.length > 0 ? (
                <AvatarGroup inis={e.participantes} size={22} />
              ) : (
                <span className="text-[11px] text-faint">sem pessoas</span>
              )}
            </div>
            <div className="mt-1.5 text-[13px] text-ink">{e.titulo}</div>
            {e.detalhe && (
              <div className="text-[11px] text-faint">{e.detalhe}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Agenda</h1>
        <div className="flex items-center gap-2">
          {chip("dia", "Dia")}
          {chip("semana", "Semana")}
          {chip("mes", "Mês")}
          <button
            onClick={() => setShowNovo(true)}
            className="ml-1 flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
          >
            <Plus size={16} /> Novo evento
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navegar(-1)}
            aria-label="Anterior"
            className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted hover:bg-cream"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[12rem] text-center font-medium text-navy">
            {header}
          </span>
          <button
            onClick={() => navegar(1)}
            aria-label="Próximo"
            className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted hover:bg-cream"
          >
            <ChevronRight size={16} />
          </button>
          {!ehHoje && (
            <button
              onClick={() => setDia(hoje)}
              className="ml-1 rounded-md border border-gold/50 bg-gold/10 px-2.5 py-1 text-[12px] font-medium text-gold hover:bg-gold/20"
            >
              Hoje
            </button>
          )}
          {ehHoje && view === "dia" && (
            <span className="ml-1 rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold">
              Hoje
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-[12px] text-faint">
        <Lock size={13} />
        {coord ? "Toda a agenda do escritório" : "Apenas a sua agenda"}
      </div>

      {visiveis.length === 0 ? (
        <div className="rounded-md border border-line bg-surface px-4 py-10 text-center text-[13px] text-faint">
          {vazioMsg}
        </div>
      ) : view === "dia" ? (
        <div className="flex flex-col gap-2.5">
          {visiveis.map((e, idx) => card(e, idx))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <div key={g.data}>
              <div className="mb-2 border-b border-line pb-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                {dataPorExtenso(g.data)}
                {g.data === hoje && (
                  <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] normal-case text-gold">
                    Hoje
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2.5">
                {g.itens.map((e, idx) => card(e, idx))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNovo && (
        <NovoEventoModal
          responsaveis={responsaveis}
          dataInicial={dia}
          onClose={() => setShowNovo(false)}
        />
      )}
    </div>
  );
}
