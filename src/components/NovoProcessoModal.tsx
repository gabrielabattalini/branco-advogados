"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { AreaTag } from "@/components/AreaTag";
import { classificarArea } from "@/lib/mock";
import type { Responsavel } from "@/lib/data";
import { criarProcesso } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function NovoProcessoModal({
  responsaveis,
  onClose,
}: {
  responsaveis: Responsavel[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [numero, setNumero] = useState("");
  const [cliente, setCliente] = useState("");
  const [parteContraria, setParteContraria] = useState("");
  const [responsavel, setResponsavel] = useState(
    responsaveis[0]?.iniciais ?? "",
  );
  const [tribunal, setTribunal] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [sistema, setSistema] = useState("");
  const [linkSistema, setLinkSistema] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const digitos = numero.replace(/\D/g, "");
  const area = digitos.length >= 14 ? classificarArea(numero) : null;
  const valido = digitos.length >= 14 && cliente.trim().length > 0;

  const submit = async () => {
    if (!valido || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const r = responsaveis.find((x) => x.iniciais === responsavel);
      if (!r) {
        setErro("Selecione um responsável.");
        setSalvando(false);
        return;
      }
      const res = await criarProcesso({
        numero: numero.trim(),
        area: area ?? "civel",
        tribunal,
        cliente,
        parteContraria,
        responsavel: r.nome,
        responsavelIniciais: r.iniciais,
        valorCausa,
        sistema,
        linkSistema,
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
      titulo="Novo processo"
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
            disabled={!valido || salvando}
            className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Cadastrar processo"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Número do processo (CNJ)</label>
          <input
            className={inputCls + " font-mono"}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="0000000-00.0000.0.00.0000"
            autoFocus
          />
          {area && (
            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
              Área detectada pelo número: <AreaTag area={area} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Cliente</label>
            <input
              className={inputCls}
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className={labelCls}>Parte contrária</label>
            <input
              className={inputCls}
              value={parteContraria}
              onChange={(e) => setParteContraria(e.target.value)}
              placeholder="Nome da parte contrária"
            />
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
            <label className={labelCls}>Valor da causa</label>
            <input
              className={inputCls}
              value={valorCausa}
              onChange={(e) => setValorCausa(e.target.value)}
              placeholder="R$ 0,00"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Vara / tribunal</label>
          <input
            className={inputCls}
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            placeholder="Ex.: TRT15 · 2ª Vara do Trabalho de Jundiaí"
          />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-3">
          <div>
            <label className={labelCls}>Sistema</label>
            <input
              className={inputCls}
              list="sistemas-lista"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              placeholder="PJe, e-SAJ…"
            />
            <datalist id="sistemas-lista">
              <option value="PJe" />
              <option value="e-SAJ" />
              <option value="Projudi" />
              <option value="EPROC" />
              <option value="ESAJ" />
              <option value="PJe-JT" />
              <option value="Creta" />
              <option value="Físico" />
            </datalist>
          </div>
          <div>
            <label className={labelCls}>Link do processo no sistema</label>
            <input
              className={inputCls}
              value={linkSistema}
              onChange={(e) => setLinkSistema(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
