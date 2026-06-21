"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import {
  STATUS_LIST,
  semana,
  corDoStatus,
  HOJE_ISO,
  type Status,
  type TarefaFull,
  type Processo,
} from "@/lib/mock";
import { ehGestor } from "@/lib/papeis";
import type { Responsavel } from "@/lib/data";
import { AreaTag } from "@/components/AreaTag";
import { AvatarGroup } from "@/components/Avatar";
import { StatusSelect } from "@/components/StatusSelect";
import { NovaTarefaModal } from "@/components/NovaTarefaModal";
import { atualizarStatusTarefa } from "@/lib/actions";
import { DOWS, NOMES_MES, gridMes } from "@/lib/calendario";

type View = "calendario" | "quadro" | "lista";
type CalMode = "semana" | "mes";

export function TarefasView({
  tarefas,
  processos,
  responsaveis,
  papel,
  me,
}: {
  tarefas: TarefaFull[];
  processos: Processo[];
  responsaveis: Responsavel[];
  papel: string;
  me: string;
}) {
  const router = useRouter();
  const coord = ehGestor(papel);
  const [view, setView] = useState<View>("calendario");
  const [calMode, setCalMode] = useState<CalMode>("semana");
  const [mesAtual, setMesAtual] = useState({ ano: 2026, mes: 6 });
  const [filtroAdv, setFiltroAdv] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [showNova, setShowNova] = useState(false);
  const [editar, setEditar] = useState<TarefaFull | null>(null);

  const setStatus = async (id: string, status: Status) => {
    await atualizarStatusTarefa(id, status);
    router.refresh();
  };
  const prazoCls = (urgente?: boolean) =>
    urgente ? "font-medium text-danger" : "text-muted";

  const visiveis = tarefas.filter(
    (t) =>
      (!filtroAdv || t.responsaveis.includes(filtroAdv)) &&
      (!filtroStatus || t.status === filtroStatus),
  );

  const selCls =
    "rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-muted outline-none";

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

  const subBtn = (m: CalMode, label: string) => (
    <button
      onClick={() => setCalMode(m)}
      className={
        "rounded-md px-3 py-1 text-[13px] transition-colors " +
        (calMode === m
          ? "bg-navy/10 font-medium text-navy"
          : "border border-line text-muted hover:bg-surface")
      }
    >
      {label}
    </button>
  );

  const cartao = (t: TarefaFull) => (
    <div
      key={t.id}
      className="mb-2 rounded-md border border-line bg-surface p-2.5"
    >
      <button onClick={() => setEditar(t)} className="block w-full text-left">
        <div className="text-[12.5px] text-ink">{t.titulo}</div>
        {t.descricao && (
          <div className="mt-0.5 line-clamp-2 text-[11px] text-muted">
            {t.descricao}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          {coord && <AreaTag area={t.area} />}
          <span className="font-mono text-[10.5px] text-faint">
            {t.processo ? "…" + t.processo.slice(-12) : "sem processo"}
          </span>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusSelect value={t.status} onChange={(s) => setStatus(t.id, s)} />
        <div className="flex items-center gap-2">
          <span className={"text-[11px] " + prazoCls(t.prazoUrgente)}>
            {t.prazo}
          </span>
          <AvatarGroup inis={t.responsaveis} size={20} />
        </div>
      </div>
    </div>
  );

  const quadro = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
      {STATUS_LIST.map((col) => {
        const items = visiveis.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className="rounded-lg border border-line bg-navy/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-muted">
                {col.label}
              </span>
              <span className="rounded-full bg-surface px-2 text-[11px] text-faint">
                {items.length}
              </span>
            </div>
            {items.map(cartao)}
            {items.length === 0 && (
              <div className="py-3 text-center text-[11px] text-faint">—</div>
            )}
          </div>
        );
      })}
    </div>
  );

  const calendarioSemana = (
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
                <button
                  onClick={() => setEditar(t)}
                  className="block w-full text-left"
                >
                  <div className="text-[11.5px] leading-tight text-ink">
                    {t.titulo}
                  </div>
                </button>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <StatusSelect
                    value={t.status}
                    onChange={(s) => setStatus(t.id, s)}
                    compact
                  />
                  <AvatarGroup inis={t.responsaveis} size={18} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  const calendarioMes = (
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
            const items = visiveis.filter((t) => t.data === cel.iso);
            const hoje = cel.iso === HOJE_ISO;
            return (
              <div
                key={cel.iso}
                className={
                  "min-h-[92px] bg-surface p-1.5 " +
                  (cel.doMes ? "" : "opacity-40")
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
                  {items.slice(0, 3).map((t) => {
                    const c = corDoStatus(t.status);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setEditar(t)}
                        title={t.titulo}
                        className={
                          "truncate rounded px-1 py-0.5 text-left text-[10.5px] " +
                          `${c.bg} ${c.text}`
                        }
                      >
                        {t.titulo}
                      </button>
                    );
                  })}
                  {items.length > 3 && (
                    <span className="text-[10px] text-faint">
                      +{items.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const calendario = (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {subBtn("semana", "Semana")}
        {subBtn("mes", "Mês")}
      </div>
      {calMode === "semana" ? calendarioSemana : calendarioMes}
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
          <button
            onClick={() => setEditar(t)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="text-[13px] text-ink">{t.titulo}</div>
            {t.descricao && (
              <div className="line-clamp-1 text-[11px] text-muted">
                {t.descricao}
              </div>
            )}
            <div className="font-mono text-[11px] text-faint">
              {t.processo || "sem processo"}
            </div>
          </button>
          {coord && <AreaTag area={t.area} />}
          <AvatarGroup inis={t.responsaveis} size={22} />
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
          {tabBtn("calendario", "Calendário")}
          {tabBtn("quadro", "Quadro")}
          {tabBtn("lista", "Lista")}
          <button
            onClick={() => setShowNova(true)}
            className="ml-1 flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
          >
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[12px] text-faint">
          <Lock size={13} />
          {coord
            ? "Todas as tarefas do escritório"
            : "Apenas as suas tarefas"}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {coord && (
            <select
              value={filtroAdv}
              onChange={(e) => setFiltroAdv(e.target.value)}
              className={selCls}
              aria-label="Filtrar por advogado"
            >
              <option value="">Todos os advogados</option>
              {responsaveis.map((r) => (
                <option key={r.iniciais} value={r.iniciais}>
                  {r.nome}
                </option>
              ))}
            </select>
          )}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={selCls}
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {STATUS_LIST.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "calendario" && calendario}
      {view === "quadro" && quadro}
      {view === "lista" && lista}

      {showNova && (
        <NovaTarefaModal
          processos={processos}
          responsaveis={responsaveis}
          papel={papel}
          me={me}
          onClose={() => setShowNova(false)}
        />
      )}
      {editar && (
        <NovaTarefaModal
          processos={processos}
          responsaveis={responsaveis}
          tarefa={editar}
          papel={papel}
          me={me}
          onClose={() => setEditar(null)}
        />
      )}
    </div>
  );
}
