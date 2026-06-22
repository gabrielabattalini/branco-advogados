"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { Modal } from "@/components/Modal";
import { AreaTag } from "@/components/AreaTag";
import {
  classificarArea,
  HOJE_ISO,
  STATUS_LIST,
  type Processo,
  type TarefaFull,
} from "@/lib/mock";
import { ehGestor } from "@/lib/papeis";
import { brData } from "@/lib/audiencia";
import { somarDiasUteis, somarDiasCorridos } from "@/lib/diasUteis";
import type { Responsavel } from "@/lib/data";
import { criarTarefa, editarTarefa, excluirTarefa } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function NovaTarefaModal({
  processos,
  responsaveis,
  tarefa,
  papel,
  me,
  onClose,
}: {
  processos: Processo[];
  responsaveis: Responsavel[];
  tarefa?: TarefaFull;
  papel: string;
  me?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const edicao = !!tarefa;
  const coord = ehGestor(papel);
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [numero, setNumero] = useState(tarefa?.processo ?? "");
  const [procBusca, setProcBusca] = useState("");
  const [procAberto, setProcAberto] = useState(false);
  const [resps, setResps] = useState<string[]>(
    tarefa?.responsaveis ?? (me ? [me] : []),
  );
  const [status, setStatus] = useState<string>(tarefa?.status ?? "a_fazer");

  // Prazo: calcular por dias (úteis/corridos) ou informar a data final direto.
  const [modoPrazo, setModoPrazo] = useState<"dias" | "data">(
    edicao ? "data" : "dias",
  );
  const [prazoBase, setPrazoBase] = useState(HOJE_ISO);
  const [prazoDias, setPrazoDias] = useState(5);
  const [prazoTipo, setPrazoTipo] = useState<"uteis" | "corridos">("uteis");
  const [prazoData, setPrazoData] = useState(tarefa?.data ?? HOJE_ISO);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const area = numero ? classificarArea(numero) : "civel";
  const procSel = processos.find((p) => p.numero === numero);
  const q = procBusca.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  const procFiltrados = (
    q
      ? processos.filter(
          (p) =>
            p.cliente.toLowerCase().includes(q) ||
            p.numero.toLowerCase().includes(q) ||
            (qd.length > 0 && p.numero.replace(/\D/g, "").includes(qd)),
        )
      : processos
  ).slice(0, 8);

  const dataFinal =
    modoPrazo === "dias"
      ? prazoTipo === "uteis"
        ? somarDiasUteis(prazoBase, prazoDias)
        : somarDiasCorridos(prazoBase, prazoDias)
      : prazoData;

  const toggleResp = (ini: string) =>
    setResps((rs) =>
      rs.includes(ini) ? rs.filter((x) => x !== ini) : [...rs, ini],
    );

  const pill = (ativo: boolean) =>
    "rounded-md px-2.5 py-1 text-[12px] transition-colors " +
    (ativo ? "bg-navy text-cream" : "border border-line text-muted hover:bg-surface");

  const submit = async () => {
    if (!titulo.trim() || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const [, mm, dd] = dataFinal.split("-");
      const prazo = `${dd}/${mm}`;
      const res = edicao
        ? await editarTarefa({
            id: tarefa!.id,
            titulo: titulo.trim(),
            descricao,
            processoNumero: numero,
            status,
            data: dataFinal,
            prazo,
            responsaveis: resps,
          })
        : await criarTarefa({
            titulo: titulo.trim(),
            descricao,
            processoNumero: numero,
            area,
            data: dataFinal,
            prazo,
            responsaveis: resps,
          });
      if (res.ok) {
        router.refresh();
        onClose();
        return;
      }
      setErro(res.erro);
    } catch {
      setErro("Erro inesperado ao salvar.");
    }
    setSalvando(false);
  };

  const excluir = async () => {
    if (!tarefa || salvando) return;
    if (!confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    setSalvando(true);
    setErro("");
    const res = await excluirTarefa(tarefa.id);
    if (res.ok) {
      router.refresh();
      onClose();
      return;
    }
    setErro(res.erro);
    setSalvando(false);
  };

  return (
    <Modal
      titulo={edicao ? "Editar tarefa" : "Nova tarefa"}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {edicao && coord && (
              <button
                onClick={excluir}
                disabled={salvando}
                className="text-[13px] text-danger hover:underline disabled:opacity-40"
              >
                Excluir tarefa
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={!titulo.trim() || salvando}
              className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
            >
              {salvando ? "Salvando…" : edicao ? "Salvar" : "Criar tarefa"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Título da tarefa</label>
          <input
            className={inputCls}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Elaborar contestação"
            autoFocus
          />
        </div>
        <div>
          <label className={labelCls}>Descrição curta</label>
          <textarea
            className={inputCls + " resize-none"}
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Um resumo do que precisa ser feito (opcional)"
          />
        </div>
        <div>
          <label className={labelCls}>Responsáveis (uma ou mais pessoas)</label>
          <div className="flex flex-wrap gap-2">
            {responsaveis.map((r) => {
              const sel = resps.includes(r.iniciais);
              return (
                <button
                  type="button"
                  key={r.iniciais}
                  onClick={() => toggleResp(r.iniciais)}
                  className={
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] " +
                    (sel
                      ? "border-navy bg-navy/10 text-navy"
                      : "border-line text-muted hover:bg-surface")
                  }
                >
                  {sel && <Check size={12} />}
                  {r.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* Processo vinculado — busca por nome ou número */}
        <div>
          <label className={labelCls}>Processo vinculado</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 focus-within:border-navy/60">
              <Search size={15} className="shrink-0 text-faint" />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
                value={
                  procAberto
                    ? procBusca
                    : procSel
                      ? `${procSel.numero} — ${procSel.cliente}`
                      : ""
                }
                onChange={(e) => {
                  setProcBusca(e.target.value);
                  setProcAberto(true);
                }}
                onFocus={() => {
                  setProcAberto(true);
                  setProcBusca("");
                }}
                onBlur={() => setTimeout(() => setProcAberto(false), 150)}
                placeholder="Buscar por nome ou número do processo…"
              />
              {numero && !procAberto && (
                <button
                  type="button"
                  onClick={() => setNumero("")}
                  className="shrink-0 text-[12px] text-faint hover:text-muted"
                >
                  limpar
                </button>
              )}
            </div>
            {procAberto && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-surface shadow-lg">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNumero("");
                    setProcAberto(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[12px] text-muted hover:bg-cream"
                >
                  — Sem processo —
                </button>
                {procFiltrados.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNumero(p.numero);
                      setProcAberto(false);
                    }}
                    className="block w-full border-t border-line px-3 py-2 text-left hover:bg-cream"
                  >
                    <span className="font-mono text-[12px] text-ink">
                      {p.numero}
                    </span>
                    <span className="text-[12px] text-muted"> — {p.cliente}</span>
                  </button>
                ))}
                {procFiltrados.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-faint">
                    Nenhum processo encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
            Área {numero ? "detectada" : "padrão"}: <AreaTag area={area} />
          </div>
        </div>

        {/* Prazo */}
        <div>
          <label className={labelCls}>Prazo</label>
          {coord ? (
            <>
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModoPrazo("dias")}
                  className={pill(modoPrazo === "dias")}
                >
                  Calcular por dias
                </button>
                <button
                  type="button"
                  onClick={() => setModoPrazo("data")}
                  className={pill(modoPrazo === "data")}
                >
                  Já tenho a data final
                </button>
              </div>

              {modoPrazo === "dias" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-faint">
                        A partir de
                      </label>
                      <input
                        type="date"
                        className={inputCls}
                        value={prazoBase}
                        onChange={(e) => setPrazoBase(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-faint">
                        Prazo
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-20 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
                        value={prazoDias}
                        onChange={(e) => setPrazoDias(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-faint">
                        Tipo
                      </label>
                      <select
                        className={inputCls}
                        value={prazoTipo}
                        onChange={(e) =>
                          setPrazoTipo(e.target.value as "uteis" | "corridos")
                        }
                      >
                        <option value="uteis">dias úteis</option>
                        <option value="corridos">dias corridos</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-md bg-cream px-3 py-2 text-[12.5px] text-ink">
                    Prazo final:{" "}
                    <span className="font-medium text-navy">
                      {brData(dataFinal)}
                    </span>
                    <span className="text-faint">
                      {" "}
                      ({prazoDias || 0}{" "}
                      {prazoTipo === "uteis" ? "dias úteis" : "dias corridos"})
                    </span>
                  </div>
                  {prazoTipo === "uteis" && (
                    <p className="text-[11px] text-faint">
                      Desconta fins de semana e feriados nacionais. Feriados
                      locais e forenses (recesso) não entram — confira datas
                      próximas a feriados.
                    </p>
                  )}
                </div>
              ) : (
                <input
                  type="date"
                  className={inputCls}
                  value={prazoData}
                  onChange={(e) => setPrazoData(e.target.value)}
                />
              )}
            </>
          ) : (
            <>
              <input
                type="date"
                disabled
                readOnly
                className={inputCls + " cursor-not-allowed opacity-60"}
                value={dataFinal}
              />
              <p className="mt-1 text-[11px] text-faint">
                Só o coordenador pode definir o prazo.
              </p>
            </>
          )}
        </div>

        {edicao && (
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
