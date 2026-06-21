"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Plus, AlertTriangle, Check } from "lucide-react";
import type { Intimacao } from "@/lib/mock";
import { AreaTag } from "@/components/AreaTag";
import { gerarTarefaDaIntimacao, ignorarIntimacao } from "@/lib/actions";

export function TriagemView({ intimacoes }: { intimacoes: Intimacao[] }) {
  const router = useRouter();
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const total = intimacoes.length;
  const trab = intimacoes.filter((i) => i.area === "trabalhista").length;
  const civ = intimacoes.filter((i) => i.area === "civel").length;
  const semProc = intimacoes.filter((i) => !i.processoCadastrado).length;

  const acao = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setProcessandoId(id);
    try {
      await fn(id);
      router.refresh();
    } finally {
      setProcessandoId(null);
    }
  };

  const metrics = [
    { label: "Intimações", valor: total, danger: false },
    { label: "Trabalhista", valor: trab, danger: false },
    { label: "Cível", valor: civ, danger: false },
    { label: "Sem processo", valor: semProc, danger: semProc > 0 },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-[12px] text-faint">
        <FileText size={14} /> relacao-aasp-19-06-2026.pdf · {total} intimações na
        fila
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">
        <Upload size={18} className="text-faint" />
        <span>Arraste o PDF da AASP aqui ou clique para enviar</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-line bg-surface px-4 py-3"
          >
            <div className="text-[12px] text-muted">{m.label}</div>
            <div
              className={
                "mt-1 text-xl font-medium " +
                (m.danger ? "text-danger" : "text-navy")
              }
            >
              {m.valor}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {intimacoes.map((i) => (
          <div
            key={i.id}
            className={
              "rounded-lg border bg-surface p-4 " +
              (i.processoCadastrado ? "border-line" : "border-danger/40")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[13px] text-ink">{i.numero}</div>
                <div className="mt-0.5 text-[12px] text-muted">
                  {i.tribunal} · {i.tipo}
                </div>
              </div>
              <AreaTag area={i.area} />
            </div>

            <div className="mt-2 text-[13px] text-ink">{i.partes}</div>

            <div className="mt-2 rounded-md bg-cream px-3 py-2">
              <div className="text-[11px] text-faint">Despacho detectado</div>
              <div className="mt-0.5 text-[13px] text-ink">{i.despacho}</div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-[12px]">
                <span className="text-muted">
                  Prazo sugerido:{" "}
                  <span className="font-medium text-ink">{i.prazo}</span>
                </span>
                {i.processoCadastrado ? (
                  <span className="inline-flex items-center gap-1 text-ok">
                    <Check size={13} /> vinculado ao processo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-danger">
                    <AlertTriangle size={13} /> processo não cadastrado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={processandoId === i.id}
                  onClick={() => acao(i.id, ignorarIntimacao)}
                  className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-muted hover:bg-cream disabled:opacity-40"
                >
                  Ignorar
                </button>
                <button
                  disabled={processandoId === i.id}
                  onClick={() => acao(i.id, gerarTarefaDaIntimacao)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] disabled:opacity-40 " +
                    (i.processoCadastrado
                      ? "bg-navy text-cream hover:bg-navy-dark"
                      : "bg-gold text-navy hover:opacity-90")
                  }
                >
                  <Plus size={13} />
                  {i.processoCadastrado ? "Gerar tarefa" : "Cadastrar e gerar"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {intimacoes.length === 0 && (
          <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-[13px] text-faint">
            Fila vazia — todas as intimações foram triadas.
          </div>
        )}
      </div>
    </div>
  );
}
