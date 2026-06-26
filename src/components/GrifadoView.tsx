"use client";

import { useRef, useState } from "react";
import { FileUp, ArrowLeft, Download, Loader2, CheckCircle2 } from "lucide-react";
import { gerarGrifado, type ResultadoGrifado } from "@/lib/aasp-actions";

function baixar(nome: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function GrifadoView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [arquivos, setArquivos] = useState<
    { nome: string; base64: string }[] | null
  >(null);

  async function processar(file: File) {
    setErro("");
    setArquivos(null);
    setNomeArquivo(file.name);
    setProcessando(true);
    const fd = new FormData();
    fd.append("arquivo", file);
    let res: ResultadoGrifado;
    try {
      res = await gerarGrifado(fd);
    } catch {
      res = { ok: false, erro: "Falha ao processar o PDF. Tente novamente." };
    }
    setProcessando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setArquivos(res.arquivos);
    // baixa automaticamente os PDFs gerados
    res.arquivos.forEach((a, i) => setTimeout(() => baixar(a.nome, a.base64), i * 400));
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <a
        href="/publicacoes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft size={15} /> Voltar para Publicações
      </a>

      <h1 className="text-2xl font-semibold text-[#21314F]">
        Gerar publicações grifadas
      </h1>
      <p className="mt-1.5 text-sm text-stone-500">
        Envie o PDF de publicações da AASP. O sistema grifa as partes e o
        dispositivo, escreve responsável · ação · prazo no canto de cada
        publicação e devolve dois arquivos separados — um Cível e um
        Trabalhista.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processar(f);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={processando}
        onClick={() => inputRef.current?.click()}
        className="mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center transition hover:border-[#B0894F] hover:bg-[#faf7f1] disabled:opacity-60"
      >
        {processando ? (
          <>
            <Loader2 size={32} className="animate-spin text-[#B0894F]" />
            <span className="text-sm font-medium text-stone-600">
              Grifando {nomeArquivo}…
            </span>
            <span className="text-xs text-stone-400">
              Isso leva alguns segundos.
            </span>
          </>
        ) : (
          <>
            <FileUp size={32} className="text-[#B0894F]" />
            <span className="text-sm font-medium text-stone-700">
              Clique para escolher o PDF da AASP
            </span>
            <span className="text-xs text-stone-400">PDF até 25 MB</span>
          </>
        )}
      </button>

      {erro && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {arquivos && arquivos.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} /> Pronto! O download começou
            automaticamente.
          </div>
          <div className="space-y-2">
            {arquivos.map((a) => (
              <button
                key={a.nome}
                onClick={() => baixar(a.nome, a.base64)}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-[#B0894F] hover:bg-[#faf7f1]"
              >
                <span className="text-sm font-medium text-[#21314F]">
                  {a.nome}
                </span>
                <Download size={16} className="text-[#B0894F]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
