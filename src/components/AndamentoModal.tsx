"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Scale, Loader2 } from "lucide-react";
import {
  registrarAndamentoProcesso,
  getUltimoAndamento,
} from "@/lib/actions";

// Pedido ao concluir uma tarefa vinculada a um processo: um resumo da situação
// atual. Pré-preenche com o último andamento (dá pra ajustar). É opcional —
// "Agora não" fecha sem registrar.
export function AndamentoModal({
  processoNumero,
  tarefaId,
  onClose,
}: {
  processoNumero: string;
  tarefaId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [anterior, setAnterior] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    getUltimoAndamento(processoNumero)
      .then((a) => {
        if (!vivo) return;
        setAnterior(a?.texto ?? null);
        if (a?.texto) setTexto(a.texto);
      })
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [processoNumero]);

  const salvar = async () => {
    if (!texto.trim() || salvando) return;
    setSalvando(true);
    setErro("");
    const res = await registrarAndamentoProcesso({
      processoNumero,
      texto: texto.trim(),
      tarefaId,
    });
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
      titulo="Situação atual do processo"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            onClick={onClose}
            className="text-[13px] text-muted hover:underline"
          >
            Agora não
          </button>
          <button
            onClick={salvar}
            disabled={!texto.trim() || salvando}
            className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar situação"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <Scale size={14} className="text-gold" />
          <span className="font-mono">{processoNumero}</span>
        </div>
        <p className="text-[12.5px] text-muted">
          Tarefa concluída. Em uma frase, como está o processo agora? Isso
          alimenta o relatório mensal do cliente.
        </p>
        {carregando ? (
          <div className="flex items-center gap-2 py-3 text-[12px] text-faint">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            {anterior && (
              <div className="rounded-md bg-cream px-2.5 py-1.5 text-[11.5px] text-muted">
                Situação anterior — ajuste se mudou.
              </div>
            )}
            <textarea
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Ex.: Contestação protocolada; aguardando réplica. Próximo passo: audiência de instrução a designar."
              className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
            />
          </>
        )}
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
