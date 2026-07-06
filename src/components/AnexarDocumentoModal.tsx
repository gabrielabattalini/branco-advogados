"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const [numero, setNumero] = useState(
    processoNumeroInicial ?? pastas[0]?.numero ?? "",
  );
  const [nome, setNome] = useState("");
  const [temArquivo, setTemArquivo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const arquivoRef = useRef<HTMLInputElement>(null);

  const pasta = pastas.find((p) => p.numero === numero);
  const proximo =
    (pasta?.docs.reduce((m, d) => Math.max(m, parseInt(d.ordem, 10) || 0), 0) ??
      0) + 1;

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
          <label htmlFor="anexar-processo" className={labelCls}>
            Processo
          </label>
          <select
            id="anexar-processo"
            className={inputCls}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          >
            {pastas.length === 0 && <option value="">— Nenhum processo —</option>}
            {pastas.map((p) => (
              <option key={p.id} value={p.numero}>
                {p.numero} — {p.cliente}
              </option>
            ))}
          </select>
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
