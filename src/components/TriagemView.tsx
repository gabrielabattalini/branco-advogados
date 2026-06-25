"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, Scale, Landmark } from "lucide-react";
import {
  importarAASP,
  type ResultadoTriagem,
  type PubComCliente,
} from "@/lib/aasp-actions";

const atoLabel: Record<string, string> = {
  sentenca: "Sentença",
  acordao: "Acórdão",
  decisao: "Decisão",
  despacho: "Despacho",
  ato_ordinatorio: "Ato ordinatório",
  pauta: "Pauta de julgamento",
  edital: "Edital",
  intimacao: "Intimação",
};
const resultadoLabel: Record<string, string> = {
  procedente: "Procedente",
  improcedente: "Improcedente",
  parcial: "Parcialmente procedente",
};
const areaInfo: Record<string, { label: string; icon: typeof Scale }> = {
  trabalhista: { label: "Trabalhista", icon: Scale },
  civel: { label: "Cível", icon: Landmark },
  federal: { label: "Federal → Cível", icon: Landmark },
};

function brL(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function Cartao({ p }: { p: PubComCliente }) {
  const bom = p.resultado === "improcedente";
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-3.5">
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-navy/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-navy">
          {atoLabel[p.atoTipo] ?? p.atoTipo}
        </span>
        <span className="rounded bg-navy/5 px-2 py-0.5 text-[10.5px] text-muted">
          {p.tribunal}
        </span>
        {p.resultado && (
          <span
            className={
              "ml-auto rounded px-2 py-0.5 text-[10.5px] font-semibold " +
              (bom ? "bg-ok/15 text-ok" : "bg-trab-bg text-trab-text")
            }
          >
            {resultadoLabel[p.resultado]}
          </span>
        )}
      </div>
      <div className="font-mono text-[12.5px] font-semibold text-navy">
        {p.processo || "(processo não identificado)"}
        {p.orgao && (
          <span className="font-sans text-[12px] font-normal text-muted">
            {" · "}
            {p.orgao}
          </span>
        )}
      </div>
      <div className="mt-1 text-[12.5px]">
        {p.cliente ? (
          <>
            Cliente:{" "}
            <span className="rounded bg-gold/15 px-1.5 py-0.5 font-medium text-navy">
              {p.cliente}
            </span>
          </>
        ) : (
          <span className="text-faint">Cliente não localizado na base · </span>
        )}
        {(p.poloAtivo || p.poloPassivo) && (
          <span className="text-muted">
            {" "}
            {p.poloAtivo}
            {p.poloPassivo ? ` × ${p.poloPassivo}` : ""}
          </span>
        )}
      </div>
      {p.teor && (
        <div
          className="mt-2 rounded border-l-2 px-2.5 py-1.5 text-[11.5px] leading-relaxed"
          style={{ borderColor: "#7bbd6b", background: "#eef8ea", color: "#234a1c" }}
        >
          {p.teor.length > 230 ? p.teor.slice(0, 230) + "…" : p.teor}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>Disponibilização {brL(p.disponibilizacao)}</span>
        {p.prazoDias ? (
          <span className="font-medium text-navy">
            Prazo: {p.prazoDias} dias{" "}
            {p.prazoTipo === "corridos" ? "corridos" : "úteis"}
          </span>
        ) : null}
        <span className="ml-auto text-faint">
          item {p.item} · publ. {p.publicacaoNum}
        </span>
      </div>
    </div>
  );
}

export function TriagemView() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [res, setRes] = useState<ResultadoTriagem | null>(null);

  const enviar = async () => {
    if (!arquivo || carregando) return;
    setCarregando(true);
    setRes(null);
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    try {
      setRes(await importarAASP(fd));
    } catch {
      setRes({ ok: false, erro: "Erro inesperado ao processar o arquivo." });
    }
    setCarregando(false);
  };

  return (
    <div>
      <p className="mb-3 text-[13px] text-muted">
        Suba o PDF de publicações da AASP (DJEN). O sistema separa cível, trabalhista e
        federal, agrupa as duplicatas e identifica o cliente.
      </p>

      <div className="rounded-lg border border-dashed border-line bg-surface p-5">
        <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
          <Upload size={26} className="text-gold" />
          <span className="text-[13px] text-muted">
            {arquivo ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                <FileText size={15} /> {arquivo.name}
              </span>
            ) : (
              "Clique para escolher o PDF da AASP"
            )}
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
              setRes(null);
            }}
          />
        </label>
        <div className="mt-4 flex justify-center">
          <button
            onClick={enviar}
            disabled={!arquivo || carregando}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {carregando ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Lendo o PDF…
              </>
            ) : (
              <>
                <Upload size={16} /> Importar e separar
              </>
            )}
          </button>
        </div>
      </div>

      {res && !res.ok && (
        <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {res.erro}
        </p>
      )}

      {res && res.ok && (
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full border border-line bg-cream px-3 py-1 text-navy">
              <b className="text-gold">{res.total}</b> publicações
            </span>
            <span className="rounded-full border border-line bg-cream px-3 py-1 text-navy">
              <b className="text-gold">{res.unicas}</b> únicas
            </span>
            <span className="rounded-full border border-line bg-cream px-3 py-1 text-navy">
              <b className="text-gold">{res.duplicatas}</b> duplicatas agrupadas
            </span>
          </div>

          {res.grupos.map((g) => {
            const info = areaInfo[g.area];
            const Icon = info?.icon ?? Scale;
            return (
              <section key={g.area} className="mb-6">
                <h2 className="mb-2 flex items-center gap-2 border-b border-line pb-1 font-serif text-lg text-navy">
                  <Icon size={18} className="text-gold" />
                  {info?.label ?? g.area}
                  <span className="font-sans text-[13px] font-normal text-muted">
                    · {g.pubs.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {g.pubs.map((p) => (
                    <Cartao key={p.item} p={p} />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="text-[12px] text-faint">
            Próximo passo (em construção): sugerir o responsável pelo histórico do
            processo, a tarefa e o prazo com a margem de 1 dia — e aprovar para virar
            tarefa.
          </p>
        </div>
      )}
    </div>
  );
}
