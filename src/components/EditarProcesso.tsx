"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { atualizarProcesso } from "@/lib/actions";
import type { Processo } from "@/lib/mock";
import type { Responsavel } from "@/lib/data";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function EditarProcesso({
  processo,
  responsaveis,
}: {
  processo: Processo;
  responsaveis: Responsavel[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({
    numero: processo.numero,
    area: processo.area as string,
    tribunal: processo.tribunal === "—" ? "" : processo.tribunal,
    cliente: processo.cliente,
    parteContraria: processo.parteContraria === "—" ? "" : processo.parteContraria,
    responsavelIniciais: processo.responsavelIniciais,
    valorCausa: processo.valorCausa === "—" ? "" : processo.valorCausa,
    distribuido: processo.distribuido,
    fase: processo.fase,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro("");
    const r = responsaveis.find((x) => x.iniciais === f.responsavelIniciais);
    const res = await atualizarProcesso(processo.id, {
      numero: f.numero,
      area: f.area,
      tribunal: f.tribunal,
      cliente: f.cliente,
      parteContraria: f.parteContraria,
      responsavel: r?.nome ?? "",
      responsavelIniciais: r?.iniciais ?? "",
      valorCausa: f.valorCausa,
      distribuido: f.distribuido,
      fase: f.fase,
    });
    setSalvando(false);
    if (res.ok) {
      setAberto(false);
      router.refresh();
    } else setErro(res.erro);
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-navy hover:bg-cream"
      >
        <Pencil size={13} /> Editar
      </button>

      {aberto && (
        <Modal
          titulo="Editar processo"
          onClose={() => setAberto(false)}
          footer={
            <>
              <button
                onClick={() => setAberto(false)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
              >
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div>
                <label className={labelCls}>Número do processo (CNJ)</label>
                <input className={inputCls + " font-mono"} value={f.numero} onChange={set("numero")} />
              </div>
              <div>
                <label className={labelCls}>Área</label>
                <select className={inputCls} value={f.area} onChange={set("area")}>
                  <option value="civel">Cível</option>
                  <option value="trabalhista">Trabalhista</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vara / tribunal</label>
              <input className={inputCls} value={f.tribunal} onChange={set("tribunal")} />
            </div>
            <div>
              <label className={labelCls}>Cliente</label>
              <input className={inputCls} value={f.cliente} onChange={set("cliente")} />
            </div>
            <div>
              <label className={labelCls}>Parte contrária</label>
              <textarea className={inputCls + " min-h-[60px] resize-y"} value={f.parteContraria} onChange={set("parteContraria")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Responsável</label>
                <select className={inputCls} value={f.responsavelIniciais} onChange={set("responsavelIniciais")}>
                  <option value="">—</option>
                  {responsaveis.map((r) => (
                    <option key={r.iniciais} value={r.iniciais}>{r.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Valor da causa</label>
                <input className={inputCls} value={f.valorCausa} onChange={set("valorCausa")} placeholder="R$ 0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Distribuído em</label>
                <input className={inputCls} value={f.distribuido} onChange={set("distribuido")} placeholder="dd/mm/aaaa" />
              </div>
              <div>
                <label className={labelCls}>Fase</label>
                <input className={inputCls} value={f.fase} onChange={set("fase")} placeholder="Conhecimento, Execução…" />
              </div>
            </div>
            {erro && <p className="text-[12px] text-danger">{erro}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
