"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Gavel, Lock, Plus } from "lucide-react";
import {
  STATUS_LIST,
  corDoStatus,
  type Status,
  type TarefaFull,
  type Processo,
} from "@/lib/mock";
import { ehGestor } from "@/lib/papeis";
import { hojeISO, semanaUtil, brCurto } from "@/lib/hoje";
import type { Responsavel, AudienciaDTO } from "@/lib/data";
import { AreaTag } from "@/components/AreaTag";
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
  ultimosResp,
  audiencias,
  papel,
  me,
}: {
  tarefas: TarefaFull[];
  processos: Processo[];
  responsaveis: Responsavel[];
  ultimosResp: Record<string, string[]>;
  audiencias: AudienciaDTO[];
  papel: string;
  me: string;
}) {
  const router = useRouter();
  const coord = ehGestor(papel);
  const [view, setView] = useState<View>("calendario");
  const [calMode, setCalMode] = useState<CalMode>("semana");
  const HOJE = hojeISO();
  const semana = semanaUtil(HOJE).map((s) => ({ ...s, hoje: s.data === HOJE }));
  const [mesAtual, setMesAtual] = useState({
    ano: Number(HOJE.slice(0, 4)),
    mes: Number(HOJE.slice(5, 7)),
  });
  const [filtroAdv, setFiltroAdv] = useState("");
  const [statusSel, setStatusSel] = useState<string[]>(
    STATUS_LIST.map((s) => s.key),
  );
  const searchParams = useSearchParams();
  const [showNova, setShowNova] = useState(
    searchParams.get("novo") === "1",
  );
  const [editar, setEditar] = useState<TarefaFull | null>(null);

  const setStatus = async (id: string, status: Status) => {
    await atualizarStatusTarefa(id, status);
    router.refresh();
  };
  const prazoCls = (urgente?: boolean) =>
    urgente ? "font-medium text-danger" : "text-muted";

  // Mostra os responsáveis pelo primeiro nome, separados por " / ".
  const primeiroNome = (ini: string) => {
    const r = responsaveis.find((x) => x.iniciais === ini);
    return (r?.nome ?? ini)
      .replace(/^(Dr\.|Dra\.|Est\.)\s*/i, "")
      .split(/\s+/)[0];
  };
  const nomesResp = (inis: string[]) =>
    inis.length ? inis.map(primeiroNome).join(" / ") : "—";

  const todosMarcados = statusSel.length === STATUS_LIST.length;
  const toggleStatus = (key: string) =>
    setStatusSel((sel) =>
      sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key],
    );
  const toggleTodos = () =>
    setStatusSel(todosMarcados ? [] : STATUS_LIST.map((s) => s.key));

  const visiveis = tarefas.filter(
    (t) =>
      (!filtroAdv || t.responsaveis.includes(filtroAdv)) &&
      statusSel.includes(t.status),
  );

  // Audiências entram no calendário junto das tarefas (menos as canceladas).
  const audVisiveis = audiencias.filter(
    (a) =>
      a.status !== "cancelada" &&
      (!filtroAdv || a.participantes.includes(filtroAdv)),
  );
  const audsDoDia = (iso: string) => audVisiveis.filter((a) => a.data === iso);

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
        <span className={"text-[11px] " + prazoCls(t.prazoUrgente)}>
          {t.prazo}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] font-medium text-navy">
        {nomesResp(t.responsaveis)}
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
            {audsDoDia(d.data).map((a) => (
              <button
                key={a.id}
                onClick={() => router.push("/audiencias")}
                className="mb-1.5 block w-full rounded-md border border-gold/40 bg-gold/10 p-2 text-left"
              >
                <div className="flex items-center gap-1 text-[10px] font-medium text-gold">
                  <Gavel size={11} /> {a.hora} · Audiência
                </div>
                <div className="text-[11.5px] leading-tight text-ink">
                  {a.titulo}
                </div>
              </button>
            ))}
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
                <div className="mt-1.5">
                  <StatusSelect
                    value={t.status}
                    onChange={(s) => setStatus(t.id, s)}
                    compact
                  />
                </div>
                <div className="mt-1 text-[12.5px] font-medium leading-tight text-navy">
                  {nomesResp(t.responsaveis)}
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
            const hoje = cel.iso === HOJE;
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
                  {audsDoDia(cel.iso).slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => router.push("/audiencias")}
                      title={`${a.hora} — ${a.titulo} (audiência)`}
                      className="flex items-center gap-1 truncate rounded bg-gold/20 px-1 py-0.5 text-left text-[10.5px] text-gold"
                    >
                      <Gavel size={9} className="shrink-0" />
                      <span className="truncate">
                        {a.hora} {a.titulo}
                      </span>
                    </button>
                  ))}
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

  // Lista única: tarefas + audiências, ordenadas por data (e hora da audiência).
  const listaItens = [
    ...visiveis.map((t) => ({ kind: "t" as const, data: t.data, hora: "", t })),
    ...audVisiveis.map((a) => ({ kind: "a" as const, data: a.data, hora: a.hora, a })),
  ].sort((x, y) => x.data.localeCompare(y.data) || x.hora.localeCompare(y.hora));

  const lista = (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {listaItens.map((it, i) => {
        const borda = i > 0 ? "border-t border-line" : "";
        if (it.kind === "a") {
          const a = it.a;
          return (
            <button
              key={"a" + a.id}
              onClick={() => router.push("/audiencias")}
              className={"flex w-full items-center gap-3 bg-gold/5 px-4 py-3 text-left " + borda}
            >
              <Gavel size={15} className="shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ink">{a.titulo}</div>
                <div className="text-[11px] text-muted">
                  Audiência · {a.tipo}
                  {a.modalidade ? ` · ${a.modalidade}` : ""}
                  {a.local ? ` · ${a.local}` : ""}
                </div>
              </div>
              <span className="text-[11px] font-medium text-gold">
                {brCurto(a.data)} · {a.hora}
              </span>
            </button>
          );
        }
        const t = it.t;
        return (
          <div key={"t" + t.id} className={"flex items-center gap-3 px-4 py-3 " + borda}>
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
            <div className="text-right">
              <div className="text-[13px] font-medium text-navy">
                {nomesResp(t.responsaveis)}
              </div>
              {(t.solicitante || t.revisor) && (
                <div className="text-[10px] text-faint">
                  {t.solicitante && `Sol: ${primeiroNome(t.solicitante)}`}
                  {t.solicitante && t.revisor && " · "}
                  {t.revisor && `Rev: ${primeiroNome(t.revisor)}`}
                </div>
              )}
            </div>
            <span
              className={"w-12 text-right text-[11px] " + prazoCls(t.prazoUrgente)}
            >
              {t.prazo}
            </span>
            <StatusSelect value={t.status} onChange={(s) => setStatus(t.id, s)} />
          </div>
        );
      })}
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

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 text-[12px] text-faint">
          <Lock size={13} />
          {coord
            ? "Todas as tarefas do escritório"
            : "Apenas as suas tarefas"}
        </div>
        {coord && (
          <select
            value={filtroAdv}
            onChange={(e) => setFiltroAdv(e.target.value)}
            className={selCls}
            aria-label="Filtrar por pessoa"
          >
            <option value="">Todas as pessoas</option>
            {[
              { area: "civel", titulo: "Cível" },
              { area: "trabalhista", titulo: "Trabalhista" },
            ].map((g) => {
              const pessoas = responsaveis.filter((r) =>
                g.area === "trabalhista"
                  ? r.area === "trabalhista"
                  : r.area !== "trabalhista",
              );
              if (pessoas.length === 0) return null;
              return (
                <optgroup key={g.area} label={g.titulo}>
                  {pessoas.map((r) => (
                    <option key={r.iniciais} value={r.iniciais}>
                      {r.nome}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:ml-auto">
          <span className="text-[12px] text-faint">Status:</span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-muted">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-navy"
              checked={todosMarcados}
              onChange={toggleTodos}
            />
            Todos
          </label>
          {STATUS_LIST.map((s) => (
            <label
              key={s.key}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-muted"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-navy"
                checked={statusSel.includes(s.key)}
                onChange={() => toggleStatus(s.key)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {view === "calendario" && calendario}
      {view === "quadro" && quadro}
      {view === "lista" && lista}

      {showNova && (
        <NovaTarefaModal
          processos={processos}
          responsaveis={responsaveis}
          ultimosResp={ultimosResp}
          papel={papel}
          me={me}
          onClose={() => setShowNova(false)}
        />
      )}
      {editar && (
        <NovaTarefaModal
          processos={processos}
          responsaveis={responsaveis}
          ultimosResp={ultimosResp}
          tarefa={editar}
          papel={papel}
          me={me}
          onClose={() => setEditar(null)}
        />
      )}
    </div>
  );
}
