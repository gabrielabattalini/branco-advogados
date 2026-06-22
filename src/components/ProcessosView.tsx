"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Plus, ChevronRight } from "lucide-react";
import type { Area, Processo } from "@/lib/mock";
import type { Responsavel } from "@/lib/data";
import { AreaTag } from "@/components/AreaTag";
import { Avatar } from "@/components/Avatar";
import { NovoProcessoModal } from "@/components/NovoProcessoModal";

type Filtro = "todos" | Area;

const filtros: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "trabalhista", label: "Trabalhista" },
  { key: "civel", label: "Cível" },
];

export function ProcessosView({
  processos,
  responsaveis,
}: {
  processos: Processo[];
  responsaveis: Responsavel[];
}) {
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [showNovo, setShowNovo] = useState(searchParams.get("novo") === "1");

  const filtrados = processos.filter((p) => {
    const okFiltro = filtro === "todos" || p.area === filtro;
    const q = busca.trim().toLowerCase();
    const okBusca =
      q === "" ||
      p.numero.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q);
    return okFiltro && okBusca;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Processos</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
            <Search size={16} className="text-faint" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar número ou cliente"
              className="w-56 bg-transparent text-ink outline-none placeholder:text-faint"
            />
          </div>
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark"
          >
            <Plus size={16} /> Novo processo
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={
              "rounded-md px-3 py-1 text-[13px] transition-colors " +
              (filtro === f.key
                ? "bg-navy/10 font-medium text-navy"
                : "border border-line text-muted hover:bg-surface")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {filtrados.map((p) => (
          <Link
            key={p.id}
            href={`/processos/${p.id}`}
            className="flex items-center gap-3 border-t border-line px-4 py-3 transition-colors first:border-t-0 hover:bg-navy/5"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[12.5px] text-ink">{p.numero}</div>
              <div className="text-[11px] text-faint">{p.tribunal}</div>
            </div>
            <AreaTag area={p.area} />
            <span className="hidden max-w-[150px] truncate text-[12px] text-muted sm:block">
              {p.cliente}
            </span>
            <Avatar ini={p.responsavelIniciais} />
            <ChevronRight size={16} className="text-faint" />
          </Link>
        ))}
        {filtrados.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-faint">
            Nenhum processo encontrado.
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-faint">
        {filtrados.length} de {processos.length} processos
      </div>

      {showNovo && (
        <NovoProcessoModal
          responsaveis={responsaveis}
          onClose={() => setShowNovo(false)}
        />
      )}
    </div>
  );
}
