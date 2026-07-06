"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  ArrowRightLeft,
  Users,
  CalendarClock,
  Loader2,
} from "lucide-react";
import {
  comentarTarefa,
  getHistoricoTarefa,
  type HistoricoItem,
} from "@/lib/actions";
import { Avatar } from "@/components/Avatar";

// "06/07 · 14:32" a partir de um ISO (horário de Brasília, UTC-3).
function quandoBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} · ${p(
    d.getUTCHours(),
  )}:${p(d.getUTCMinutes())}`;
}

const ICONE: Record<string, typeof MessageSquare> = {
  comentario: MessageSquare,
  criacao: Plus,
  status: ArrowRightLeft,
  responsaveis: Users,
  prazo: CalendarClock,
};

export function TarefaTimeline({ tarefaId }: { tarefaId: string }) {
  const [itens, setItens] = useState<HistoricoItem[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setItens(await getHistoricoTarefa(tarefaId));
    } catch {
      setItens([]);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaId]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setErro("");
    const res = await comentarTarefa(tarefaId, t);
    if (res.ok) {
      setTexto("");
      await carregar();
    } else {
      setErro(res.erro);
    }
    setEnviando(false);
  };

  return (
    <div className="rounded-md border border-line bg-cream/40 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-muted">
        <MessageSquare size={14} /> Comentários e histórico
      </div>

      {itens === null ? (
        <div className="flex items-center gap-2 py-3 text-[12px] text-faint">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : itens.length === 0 ? (
        <p className="py-2 text-[12px] text-faint">
          Nenhum comentário ou alteração ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {itens.map((it) => {
            const Icone = ICONE[it.tipo] ?? MessageSquare;
            const comentario = it.tipo === "comentario";
            return (
              <li key={it.id} className="flex items-start gap-2">
                {comentario ? (
                  <Avatar ini={it.autor} size={26} />
                ) : (
                  <span className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                    <Icone size={13} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-[12px] font-medium text-ink">
                      {it.autorNome}
                    </span>
                    {!comentario && (
                      <span className="text-[12px] text-muted">{it.texto}</span>
                    )}
                    <span className="text-[10.5px] text-faint">
                      {quandoBR(it.quando)}
                    </span>
                  </div>
                  {comentario && (
                    <p className="whitespace-pre-wrap rounded-md rounded-tl-none bg-surface px-2.5 py-1.5 text-[12.5px] text-ink">
                      {it.texto}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") enviar();
          }}
          rows={2}
          placeholder="Escrever um comentário…"
          className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          className="shrink-0 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {enviando ? "…" : "Enviar"}
        </button>
      </div>
      {erro && <p className="mt-1 text-[11px] text-danger">{erro}</p>}
    </div>
  );
}
