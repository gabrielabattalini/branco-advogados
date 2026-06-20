"use client";

import { useState } from "react";
import { Search, Plus, Scale } from "lucide-react";
import type { Contato, TipoContato } from "@/lib/mock";
import { Avatar } from "@/components/Avatar";

type Filtro = "todos" | "clientes" | "pf" | "pj" | "parte_contraria";

const tipoStyle: Record<TipoContato, string> = {
  cliente: "bg-ok/15 text-ok",
  parte_contraria: "bg-trab-bg text-trab-text",
  perito: "bg-navy/10 text-navy",
  correspondente: "bg-civ-bg text-civ-text",
};

const tipoLabel: Record<TipoContato, string> = {
  cliente: "Cliente",
  parte_contraria: "Parte contrária",
  perito: "Perito",
  correspondente: "Correspondente",
};

const filtros: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "clientes", label: "Clientes" },
  { key: "pf", label: "Pessoa física" },
  { key: "pj", label: "Pessoa jurídica" },
  { key: "parte_contraria", label: "Parte contrária" },
];

export function ContatosView({ contatos }: { contatos: Contato[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = contatos.filter((c) => {
    const okFiltro =
      filtro === "todos" ||
      (filtro === "clientes" && c.tipoContato === "cliente") ||
      (filtro === "pf" && c.tipo === "pf") ||
      (filtro === "pj" && c.tipo === "pj") ||
      (filtro === "parte_contraria" && c.tipoContato === "parte_contraria");
    const q = busca.trim().toLowerCase();
    const okBusca =
      q === "" ||
      c.nome.toLowerCase().includes(q) ||
      c.documento.toLowerCase().includes(q);
    return okFiltro && okBusca;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Contatos</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
            <Search size={16} className="text-faint" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome ou CPF/CNPJ"
              className="w-56 bg-transparent text-ink outline-none placeholder:text-faint"
            />
          </div>
          <button className="flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark">
            <Plus size={16} /> Novo contato
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
        {filtrados.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
          >
            <Avatar ini={c.iniciais} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-ink">{c.nome}</div>
              <div className="text-[11px] text-faint">{c.documento}</div>
            </div>
            <span className="rounded bg-navy/5 px-2 py-0.5 text-[10px] text-muted">
              {c.tipo === "pf" ? "PF" : "PJ"}
            </span>
            <span
              className={
                "whitespace-nowrap rounded px-2 py-0.5 text-[11px] " +
                tipoStyle[c.tipoContato]
              }
            >
              {tipoLabel[c.tipoContato]}
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-muted">
              <Scale size={13} />
              {c.processos} {c.processos === 1 ? "processo" : "processos"}
            </span>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-faint">
            Nenhum contato encontrado.
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-faint">
        {filtrados.length} de {contatos.length} contatos
      </div>
    </div>
  );
}
