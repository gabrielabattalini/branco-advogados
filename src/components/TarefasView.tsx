"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus } from "lucide-react";
import type { Status, Area, TarefaFull, Processo } from "@/lib/mock";
import { semana } from "@/lib/mock";
import { AreaTag } from "@/components/AreaTag";
import { Avatar } from "@/components/Avatar";
import { StatusSelect } from "@/components/StatusSelect";
import { NovaTarefaModal } from "@/components/NovaTarefaModal";
import { atualizarStatusTarefa } from "@/lib/actions";

type View = "quadro" | "calendario" | "lista";
type Filtro = "todas" | Area;

const colunas: { key: Status; label: string }[] = [
  { key: "a_fazer", label: "A fazer" },
  { key: "em_curso", label: "Em curso" },
  { key: "concluida", label: "Concluída" },
];

export function TarefasView({
  tarefas,
  processos,
}: {
  tarefas: TarefaFull[];
  processos: Processo[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("quadro");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [showNova, setShowNova] = useState(false);

  const setStatus = async (id: string, status: Status) => {
    await atualizarStatusTarefa(id, status);
    router.refresh();
  };

  const visiveis = tarefas.filter((t) => filtro === "todas" || t.area === filtro);
  const prazoCls = (urgente?: boolean) =>
    urgente ? "font-medium text-danger" : "text-muted";

  const tabBtn = (v: View, label: string) => (
    <button
      onClick={() => setView(v)}
      className={
        "rounded-md px-3 py-1.5 text-sm transition-colors " +
        (view === v
          ? "bg-navy text-cream"
          : "border border-line text-muted hover:bg-surface")
      }
    >
      {label}
    </button>
  );

  const filtroBtn = (f: Filtro, label: string) => (
    <button
      onClick={() => setFiltro(f)}
      className={
        "rounded-md px-3 py-1 text-[13px] transition-colors " +
        (filtro === f
          ? "bg-navy/10 font-medium text-navy"
          : "border border-line text-muted hover:bg-surface")
      }
    >
      {label}
    </button>
  );

  const quadro = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {colunas.map((col) => {
        const items = visiveis.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className="rounded-lg border border-line bg-navy/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted">
                {col.label}
              </span>
              <span className="rounded-full bg-surface px-2 text-[11px] text-faint">
                {items.length}
              </span>
            </div>
            {items.map((t) => (
              <div
                key={t.id}
                className="mb-2 rounded-md border border-line bg-surface p-2.5"
              >
                <div className="text-[12.5px] text-ink">{t.titulo}</div>
                <div className="mt-0.5 font-mono text-[10.5px] text-faint">
                  {t.processo ? "…" + t.processo.slice(-12) : "sem processo"}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <AreaTag area={t.area} />
                  <div className="flex items-center gap-2">
                    <span className={"text-[11px] " + prazoCls(t.prazoUrgente)}>
                      {t.prazo}
                    </span>
                    <Avatar ini={t.responsavel} />
                  </div>
                </div>
                <div className="mt-2">
                  <StatusSelect
                    value={t.status}
                    onChange={(s) => setStatus(t.id, s)}
                  />
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="py-3 text-center text-[11px] text-faint">—</div>
            )}
          </div>
        );
      })}
    </div>
  );

  const calendario = (
    <div className="grid grid-cols-5 gap-2">
      {semana.map((d) => {
        const items = visiveis.filter((t) => t.data === d.data);
        return (
          <div
            key={d.data}
            className={
              "rounded-lg border bg-navy/5 p-2 " +
              (d.hoje ? "border-gold/50" : "border-line")
            }
          >
            <div className="mb-2 text-center">
              <div
                className={
                  "text-[10.5px] " + (d.hoje ? "text-gold" : "text-faint")
                }
              >
                {d.dow}
              </div>
              {d.hoje ? (
                <div className="mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[13px] font-medium text-cream">
                  {d.dia}
                </div>
              ) : (
                <div className="text-[14px] font-medium text-ink">{d.dia}</div>
              )}
            </div>
            {items.map((t) => (
              <div
                key={t.id}
                className="mb-1.5 rounded-md border border-line bg-surface p-2"
              >
                <div className="text-[11.5px] leading-tight text-ink">
                  {t.titulo}
                </div>
                <div className="mt-1.5">
                  <AreaTag area={t.area} />
                </div>
                <div className="mt-1.5">
                  <StatusSelect
                    value={t.status}
                    onChange={(s) => setStatus(t.id, s)}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  const lista = (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {visiveis.map((t, i) => (
        <div
          key={t.id}
          className={
            "flex items-center gap-3 px-4 py-3 " +
            (i > 0 ? "border-t border-line" : "")
          }
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-ink">{t.titulo}</div>
            <div className="font-mono text-[11px] text-faint">
              {t.processo || "sem processo"}
            </div>
          </div>
          <AreaTag area={t.area} />
          <Avatar ini={t.responsavel} />
          <span
            className={"w-12 text-right text-[11px] " + prazoCls(t.prazoUrgente)}
          >
            {t.prazo}
          </span>
          <StatusSelect value={t.status} onChange={(s) => setStatus(t.id, s)} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Tarefas</h1>
        <div className="flex items-center gap-2">
          {tabBtn("quadro", "Quadro")}
          {tabBtn("calendario", "Calendário")}
          {tabBtn("lista", "Lista")}
          <button
            onClick={() => setShowNova(true)}
            className="ml-1 flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
          >
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12px] text-faint">
          <Lock size={13} /> Mostrando apenas as suas tarefas
        </div>
        <div className="flex items-center gap-2">
          {filtroBtn("todas", "Todas")}
          {filtroBtn("trabalhista", "Trabalhista")}
          {filtroBtn("civel", "Cível")}
        </div>
      </div>

      {view === "quadro" && quadro}
      {view === "calendario" && calendario}
      {view === "lista" && lista}

      {showNova && (
        <NovaTarefaModal
          processos={processos}
          onClose={() => setShowNova(false)}
        />
      )}
    </div>
  );
}
