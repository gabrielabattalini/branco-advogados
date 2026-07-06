"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AndamentoModal } from "@/components/AndamentoModal";

// Botão na ficha do processo para registrar um novo status manualmente
// (quando o processo se movimenta sem ser pela conclusão de uma tarefa).
export function AdicionarAndamento({
  processoNumero,
}: {
  processoNumero: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 px-2.5 py-1 text-[12px] font-medium text-navy hover:bg-gold/10"
      >
        <Plus size={14} /> Atualizar status
      </button>
      {aberto && (
        <AndamentoModal
          processoNumero={processoNumero}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  );
}
