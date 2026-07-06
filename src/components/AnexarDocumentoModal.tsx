"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Modal } from "@/components/Modal";
import { anexarDocumento } from "@/lib/actions";
import type { PastaDocumentos } from "@/lib/data";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function AnexarDocumentoModal({
  pastas,
  processoNumeroInicial,
  onClose,
}: {
  pastas: PastaDocumentos[];
  processoNumeroInicial?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [numero, setNumero] = useState(processoNumeroInicial ?? "");
  const [procBusca, setProcBusca] = useState("");
  const [procAberto, setProcAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [temArquivo, setTemArquivo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const arquivoRef = useRef<HTMLInputElement>(null);

  const pasta = pastas.find((p) => p.numero === numero);
  const proximo =
    (pasta?.docs.reduce((m, d) => Math.max(m, parseInt(d.ordem, 10) || 0), 0) ??
      0) + 1;

  // Busca de processo por nome do cliente ou número (com/sem pontuação).
  const q = procBusca.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  const procFiltrados = (
    q
      ? pastas.filter(
          (p) =>
            p.cliente.toLowerCase().includes(q) ||
            p.numero.toLowerCase().includes(q) ||
            (qd.length > 0 && p.numero.replace(/\D/g, "").includes(qd)),
        )
      : pastas
  ).slice(0, 8);

  const onArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setTemArquivo(!!f);
    if (f && !nome.trim()) setNome(f.name);
  };

  const submit = async () => {
    const file = arquivoRef.current?.files?.[0];
    if (!nome.trim() || !numero || !file || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const fd = new FormData();
      fd.set("processoNumero", numero);
      fd.set("nome", nome.trim());
      fd.set("arquivo", file);
      const res = await anexarDocumento(fd);
      if (res.ok) {
        router.refresh();
        onClose();
        return;
      }
      setErro(res.erro);
    } catch {
      setErro("Erro inesperado ao anexar.");
    }
    setSalvando(false);
  };

  return (
    <Modal
      titulo="Anexar documento"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!nome.trim() || !numero || !temArquivo || salvando}
            className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Anexando…" : "Anexar"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Processo</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 focus-within:border-navy/60">
              <Search size={15} className="shrink-0 text-faint" />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
                value={
                  procAberto
                    ? procBusca
                    : pasta
                      ? `${pasta.numero} — ${pasta.cliente}`
                      : ""
                }
                onChange={(e) => {
                  setProcBusca(e.target.value);
                  setProcAberto(true);
                }}
                onFocus={() => {
                  setProcAberto(true);
                  setProcBusca("");
                }}
                onBlur={() => setTimeout(() => setProcAberto(false), 150)}
                placeholder="Buscar por nome do cliente ou número…"
              />
              {numero && !procAberto && (
                <button
                  type="button"
                  onClick={() => setNumero("")}
                  className="shrink-0 text-[12px] text-faint hover:text-muted"
                >
                  limpar
                </button>
              )}
            </div>
            {procAberto && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-surface shadow-lg">
                {procFiltrados.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNumero(p.numero);
                      setProcAberto(false);
                    }}
                    className="block w-full border-t border-line px-3 py-2 text-left first:border-t-0 hover:bg-cream"
                  >
                    <span className="font-mono text-[12px] text-ink">
                      {p.numero}
                    </span>
                    <span className="text-[12px] text-muted"> — {p.cliente}</span>
                  </button>
                ))}
                {procFiltrados.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-faint">
                    Nenhum processo encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
          {pasta && (
            <div className="mt-1.5 font-mono text-[11px] text-faint">
              Pasta de {pasta.cliente} · {pasta.docs.length} documento(s) ·
              próximo nº {String(proximo).padStart(2, "0")}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="anexar-arquivo" className={labelCls}>
            Arquivo
          </label>
          <input
            id="anexar-arquivo"
            ref={arquivoRef}
            type="file"
            onChange={onArquivo}
            className="block w-full text-[12px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-cream hover:file:bg-navy-dark"
          />
        </div>

        <div>
          <label htmlFor="anexar-nome" className={labelCls}>
            Nome do documento
          </label>
          <input
            id="anexar-nome"
            className={inputCls}
            value={nome}
            maxLength={255}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Procuração.pdf"
          />
        </div>

        <p className="text-[11px] text-faint">
          O documento entra na pasta numerado automaticamente. O arquivo é
          enviado com segurança e só pode ser baixado por quem está logado no
          sistema. Máximo de 20 MB.
        </p>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
