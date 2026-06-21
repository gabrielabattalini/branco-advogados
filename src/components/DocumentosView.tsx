"use client";

import { useState } from "react";
import { Folder, FileText, Check, Search, Paperclip, Plus } from "lucide-react";
import { AnexarDocumentoModal } from "@/components/AnexarDocumentoModal";
import type { PastaDocumentos } from "@/lib/data";

export function DocumentosView({ pastas }: { pastas: PastaDocumentos[] }) {
  const [busca, setBusca] = useState("");
  // undefined = modal fechado; null = aberto sem processo escolhido;
  // string = aberto já com o processo da pasta selecionado.
  const [anexarPara, setAnexarPara] = useState<string | null | undefined>(
    undefined,
  );

  const q = busca.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const casa = (p: PastaDocumentos) =>
    p.cliente.toLowerCase().includes(q) ||
    p.numero.toLowerCase().includes(q) ||
    (qDigits.length > 0 && p.numero.replace(/\D/g, "").includes(qDigits));

  // Sem busca: só pastas com documentos. Com busca: qualquer processo que casa
  // (inclusive sem documentos ainda, para anexar o primeiro).
  const visiveis = q ? pastas.filter(casa) : pastas.filter((p) => p.docs.length);

  const abrirAnexar = (numero?: string) => setAnexarPara(numero ?? null);
  const fechar = () => setAnexarPara(undefined);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Documentos</h1>
        <button
          onClick={() => abrirAnexar()}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
        >
          <Plus size={16} /> Anexar documento
        </button>
      </div>
      <p className="mt-1 mb-4 text-[13px] text-muted">
        Pastas criadas automaticamente por cliente e processo, numeradas por
        ordem de chegada. Cada arquivo é guardado em duas cópias: Google Drive e
        servidor.
      </p>

      <div className="mb-5 flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou número do processo…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="shrink-0 text-[12px] text-faint hover:text-muted"
          >
            limpar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {visiveis.map((pasta) => (
          <section
            key={pasta.numero}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Folder size={18} className="shrink-0 text-gold" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">
                    {pasta.cliente}
                  </div>
                  <div className="font-mono text-[11px] text-faint">
                    {pasta.numero}
                  </div>
                </div>
              </div>
              <button
                onClick={() => abrirAnexar(pasta.numero)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-navy hover:bg-cream"
              >
                <Paperclip size={13} /> Anexar
              </button>
            </div>
            {pasta.docs.map((d) => (
              <div
                key={d.ordem}
                className="flex items-center gap-3 border-t border-line py-2.5"
              >
                <span className="w-6 font-mono text-[12px] text-faint">
                  {d.ordem}
                </span>
                <FileText size={18} className="text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-ink">{d.nome}</div>
                  <div className="text-[11px] text-faint">
                    Adicionado {d.data}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-ok">
                  <Check size={13} /> Drive + servidor
                </span>
              </div>
            ))}
            {pasta.docs.length === 0 && (
              <div className="border-t border-line py-3 text-center text-[12px] text-faint">
                Pasta vazia — anexe o primeiro documento.
              </div>
            )}
          </section>
        ))}

        {visiveis.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center text-[13px] text-faint">
            {q
              ? "Nenhum processo encontrado para essa busca."
              : "Nenhum documento ainda — clique em “Anexar documento”."}
          </div>
        )}
      </div>

      {anexarPara !== undefined && (
        <AnexarDocumentoModal
          pastas={pastas}
          processoNumeroInicial={anexarPara ?? undefined}
          onClose={fechar}
        />
      )}
    </div>
  );
}
