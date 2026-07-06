"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ItemBusca } from "@/lib/data";

export function BuscaGlobal({ itens }: { itens: ItemBusca[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho de teclado: Ctrl/Cmd + K foca a busca de qualquer tela.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    inputRef.current?.blur();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[ativo]) {
      e.preventDefault();
      ir(resultados[ativo].href);
    } else if (e.key === "Escape") {
      setAberto(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-72 sm:w-80">
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm focus-within:border-navy/60">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
            setAtivo(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar processo, contato, tarefa…"
          className="w-full bg-transparent text-ink outline-none placeholder:text-faint"
          aria-label="Busca global"
        />
        <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-faint sm:inline">
          ⌘K
        </kbd>
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
                onMouseEnter={() => setAtivo(i)}
                onClick={() => ir(it.href)}
                className={
                  "block w-full border-t border-line px-3 py-2 text-left first:border-t-0 " +
                  (i === ativo ? "bg-cream" : "hover:bg-cream")
                }
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
