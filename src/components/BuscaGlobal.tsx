"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ItemBusca } from "@/lib/data";

export function BuscaGlobal({ itens }: { itens: ItemBusca[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);

  const query = q.trim().toLowerCase();
  const qd = query.replace(/\D/g, "");
  const resultados =
    query.length < 2
      ? []
      : itens
          .filter(
            (it) =>
              it.titulo.toLowerCase().includes(query) ||
              it.sub.toLowerCase().includes(query) ||
              (qd.length > 1 && it.titulo.replace(/\D/g, "").includes(qd)),
          )
          .slice(0, 10);

  const ir = (href: string) => {
    setAberto(false);
    setQ("");
    router.push(href);
  };

  return (
    <div className="relative w-72 sm:w-80">
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm focus-within:border-navy/60">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar processo, contato, tarefa…"
          className="w-full bg-transparent text-ink outline-none placeholder:text-faint"
          aria-label="Busca global"
        />
      </div>
      {aberto && query.length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-auto rounded-md border border-line bg-surface shadow-lg">
          {resultados.length === 0 ? (
            <div className="px-3 py-3 text-[12px] text-faint">
              Nada encontrado para “{q.trim()}”.
            </div>
          ) : (
            resultados.map((it, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ir(it.href)}
                className="block w-full border-t border-line px-3 py-2 text-left first:border-t-0 hover:bg-cream"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] text-navy">
                    {it.tipo}
                  </span>
                  <span className="truncate text-[12.5px] text-ink">
                    {it.titulo}
                  </span>
                </div>
                {it.sub && (
                  <div className="truncate pl-1 text-[11px] text-faint">
                    {it.sub}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
