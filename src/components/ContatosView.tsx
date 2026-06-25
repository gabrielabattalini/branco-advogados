"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Scale, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import type { TipoContato } from "@/lib/mock";
import type { ContatosPagina } from "@/lib/data";
import { Avatar } from "@/components/Avatar";

const tipoStyle: Record<string, string> = {
  cliente: "bg-ok/15 text-ok",
  parte_contraria: "bg-trab-bg text-trab-text",
  advogado_contrario: "bg-danger/10 text-danger",
  parte_processo: "bg-navy/10 text-navy",
  fornecedor: "bg-gold/15 text-gold",
  interno: "bg-info/10 text-info",
  perito: "bg-navy/10 text-navy",
  correspondente: "bg-civ-bg text-civ-text",
  diverso: "bg-line text-faint",
};
const tipoLabel: Record<string, string> = {
  cliente: "Cliente",
  parte_contraria: "Parte contrária",
  advogado_contrario: "Adv. contrário",
  parte_processo: "Parte do processo",
  fornecedor: "Fornecedor",
  interno: "Interno",
  perito: "Perito",
  correspondente: "Correspondente",
  diverso: "Diverso",
};
const filtros: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "cliente", label: "Clientes" },
  { key: "parte_contraria", label: "Parte contrária" },
  { key: "advogado_contrario", label: "Adv. contrários" },
  { key: "pf", label: "Pessoa física" },
  { key: "pj", label: "Pessoa jurídica" },
];

export function ContatosView({
  dados,
  q,
  tipo,
}: {
  dados: ContatosPagina;
  q: string;
  tipo: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState(q);
  const montou = useRef(false);

  // Monta a URL com os filtros atuais (qualquer mudança de busca/tipo volta à pág. 1).
  const navega = (next: { q?: string; tipo?: string; pagina?: number }) => {
    const nq = next.q !== undefined ? next.q : busca;
    const nt = next.tipo !== undefined ? next.tipo : tipo;
    const np = next.pagina !== undefined ? next.pagina : 1;
    const sp = new URLSearchParams();
    if (nq.trim()) sp.set("q", nq.trim());
    if (nt && nt !== "todos") sp.set("tipo", nt);
    if (np > 1) sp.set("pagina", String(np));
    const qs = sp.toString();
    router.replace(qs ? `/contatos?${qs}` : "/contatos");
  };

  // Busca com debounce (350ms) ao digitar.
  useEffect(() => {
    if (!montou.current) {
      montou.current = true;
      return;
    }
    const t = setTimeout(() => navega({ q: busca, pagina: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const { contatos, total, pagina, porPagina } = dados;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const de = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ate = Math.min(pagina * porPagina, total);

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
            onClick={() => navega({ tipo: f.key, pagina: 1 })}
            className={
              "rounded-md px-3 py-1 text-[13px] transition-colors " +
              (tipo === f.key
                ? "bg-navy/10 font-medium text-navy"
                : "border border-line text-muted hover:bg-surface")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {contatos.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
          >
            <Avatar ini={c.iniciais} size={34} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px] text-ink">
                <span className="truncate">{c.nome}</span>
                {c.ativo === false && (
                  <span className="shrink-0 rounded bg-line px-1.5 py-0.5 text-[9px] uppercase text-faint">
                    inativo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-faint">
                {c.documento && <span>{c.documento}</span>}
                {c.telefone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={11} /> {c.telefone}
                  </span>
                )}
                {c.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={11} /> {c.email}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded bg-navy/5 px-2 py-0.5 text-[10px] text-muted">
              {c.tipo === "pf" ? "PF" : "PJ"}
            </span>
            <span
              className={
                "shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-[11px] " +
                (tipoStyle[c.tipoContato] ?? tipoStyle.diverso)
              }
            >
              {tipoLabel[c.tipoContato as TipoContato] ?? "Contato"}
            </span>
            {c.processos > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-muted">
                <Scale size={13} />
                {c.processos}
              </span>
            )}
          </div>
        ))}
        {contatos.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-faint">
            Nenhum contato encontrado.
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
        <span>
          {de}–{ate} de {total.toLocaleString("pt-BR")} contatos
        </span>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={pagina <= 1}
              onClick={() => navega({ pagina: pagina - 1 })}
              className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted hover:bg-cream disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="tabular-nums">
              {pagina} / {totalPaginas}
            </span>
            <button
              disabled={pagina >= totalPaginas}
              onClick={() => navega({ pagina: pagina + 1 })}
              className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted hover:bg-cream disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
