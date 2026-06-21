"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Modal } from "@/components/Modal";
import { AreaTag } from "@/components/AreaTag";
import {
  classificarArea,
  responsaveis,
  usuarioAtual,
  HOJE_ISO,
  STATUS_LIST,
  type Processo,
  type TarefaFull,
} from "@/lib/mock";
import { criarTarefa, editarTarefa, excluirTarefa } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function NovaTarefaModal({
  processos,
  tarefa,
  papel,
  me,
  onClose,
}: {
  processos: Processo[];
  tarefa?: TarefaFull;
  papel: string;
  me?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const edicao = !!tarefa;
  const coord = papel === "coordenador";
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [numero, setNumero] = useState(
    tarefa?.processo ?? processos[0]?.numero ?? "",
  );
  const [resps, setResps] = useState<string[]>(
    tarefa?.responsaveis ?? [me || usuarioAtual.iniciais],
  );
  const [status, setStatus] = useState<string>(tarefa?.status ?? "a_fazer");
  const [data, setData] = useState(tarefa?.data ?? HOJE_ISO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const area = numero ? classificarArea(numero) : "civel";

  const toggleResp = (ini: string) =>
    setResps((rs) =>
      rs.includes(ini) ? rs.filter((x) => x !== ini) : [...rs, ini],
    );

  const submit = async () => {
    if (!titulo.trim() || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const [, mm, dd] = data.split("-");
      const prazo = `${dd}/${mm}`;
      const res = edicao
        ? await editarTarefa({
            id: tarefa!.id,
            titulo: titulo.trim(),
            descricao,
            processoNumero: numero,
            status,
            data,
            prazo,
            responsaveis: resps,
          })
        : await criarTarefa({
            titulo: titulo.trim(),
            descricao,
            processoNumero: numero,
            area,
            data,
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
        <div>
          <label className={labelCls}>Processo vinculado</label>
          <select
            className={inputCls}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          >
            <option value="">— Sem processo —</option>
            {processos.map((p) => (
              <option key={p.id} value={p.numero}>
                {p.numero} — {p.cliente}
              </option>
            ))}
          </select>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
            Área {numero ? "detectada" : "padrão"}: <AreaTag area={area} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Prazo</label>
            <input
              type="date"
              disabled={!coord}
              className={
                inputCls + (!coord ? " cursor-not-allowed opacity-60" : "")
              }
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            {!coord && (
              <p className="mt-1 text-[11px] text-faint">
                Só o coordenador pode alterar o prazo.
              </p>
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
        </div>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
