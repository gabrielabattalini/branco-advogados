"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { AreaTag } from "@/components/AreaTag";
import {
  classificarArea,
  responsaveis,
  HOJE_ISO,
  type Processo,
} from "@/lib/mock";
import { criarTarefa } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function NovaTarefaModal({
  processos,
  onClose,
}: {
  processos: Processo[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [numero, setNumero] = useState(processos[0]?.numero ?? "");
  const [responsavel, setResponsavel] = useState(responsaveis[0].iniciais);
  const [data, setData] = useState(HOJE_ISO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const area = numero ? classificarArea(numero) : "civel";

  const submit = async () => {
    if (!titulo.trim() || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const [, mm, dd] = data.split("-");
      const res = await criarTarefa({
        titulo: titulo.trim(),
        processoNumero: numero,
        area,
        data,
        prazo: `${dd}/${mm}`,
        responsavel,
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

  return (
    <Modal
      titulo="Nova tarefa"
      onClose={onClose}
      footer={
        <>
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
            {salvando ? "Salvando…" : "Criar tarefa"}
          </button>
        </>
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
            <label className={labelCls}>Responsável</label>
            <select
              className={inputCls}
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
            >
              {responsaveis.map((r) => (
                <option key={r.iniciais} value={r.iniciais}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Prazo</label>
            <input
              type="date"
              className={inputCls}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
