"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Modal } from "@/components/Modal";
import type { Responsavel } from "@/lib/data";
import { criarEvento } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

const TIPOS = [
  { key: "reuniao", label: "Reunião" },
  { key: "audiencia", label: "Audiência" },
  { key: "prazo", label: "Prazo" },
  { key: "atendimento", label: "Atendimento" },
];

export function NovoEventoModal({
  responsaveis,
  onClose,
}: {
  responsaveis: Responsavel[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("reuniao");
  const [hora, setHora] = useState("09:00");
  const [detalhe, setDetalhe] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const toggle = (ini: string) =>
    setParts((p) => (p.includes(ini) ? p.filter((x) => x !== ini) : [...p, ini]));

  const submit = async () => {
    if (!titulo.trim() || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const res = await criarEvento({
        titulo: titulo.trim(),
        tipo,
        hora,
        detalhe,
        participantes: parts,
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
      titulo="Novo evento"
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
            {salvando ? "Salvando…" : "Criar evento"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Título</label>
          <input
            className={inputCls}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Reunião com o cliente"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              className={inputCls}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Horário</label>
            <input
              type="time"
              className={inputCls}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Detalhe</label>
          <input
            className={inputCls}
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            placeholder="Local, duração, observações (opcional)"
          />
        </div>
        <div>
          <label className={labelCls}>Participantes (uma ou mais pessoas)</label>
          <div className="flex flex-wrap gap-2">
            {responsaveis.map((r) => {
              const sel = parts.includes(r.iniciais);
              return (
                <button
                  type="button"
                  key={r.iniciais}
                  onClick={() => toggle(r.iniciais)}
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
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
