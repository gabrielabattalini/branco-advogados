"use client";

import { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import type { TriagemPub } from "@/lib/data";

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

function brL(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function GrifadoView({
  pubs,
  nomes,
  associado,
}: {
  pubs: TriagemPub[];
  nomes: Record<string, string>;
  associado: string;
}) {
  // Abre o diálogo de impressão (Salvar como PDF) ao carregar.
  useEffect(() => {
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, []);

  const nomeDe = (ini: string) => nomes[ini] ?? ini;
  const trab = pubs.filter((p) => p.area === "trabalhista");
  const civ = pubs.filter((p) => p.area !== "trabalhista");

  const Bloco = ({ p }: { p: TriagemPub }) => (
    <div className="gbloco">
      <div className="ganota">
        <b>{p.responsaveis.map(nomeDe).join(" / ") || "responsável a definir"}</b>
        {" · "}
        {p.acao || "Verificar"}
        {p.dataFatal ? ` · até ${brL(p.dataFatal)}` : ""}
        {p.status === "processada" && <span className="gok"> · ✓ tarefa criada</span>}
      </div>
      <div className="gproc">
        {p.numero || "(processo não identificado)"}
        {p.orgao ? ` · ${p.orgao}` : ""} · {p.tribunal}
      </div>
      <div className="gpartes">
        {p.cliente && <span className="gcli">{p.cliente}</span>}{" "}
        {p.poloAtivo}
        {p.poloPassivo ? ` × ${p.poloPassivo}` : ""}
      </div>
      <div className="gato">
        {atoLabel[p.atoTipo] ?? p.atoTipo}
        {p.resultado ? ` · ${resultadoLabel[p.resultado]}` : ""} · disponibilização{" "}
        {brL(p.disponibilizacao)}
        {p.vencimentoLegal
          ? ` · vencimento legal ${brL(p.vencimentoLegal)} (margem −1)`
          : ""}
      </div>
      {p.teor && <div className="ggrifo">{p.teor}</div>}
    </div>
  );

  return (
    <div className="gwrap">
      <style>{`
        .gwrap { max-width: 820px; margin: 0 auto; padding: 18px 22px 40px; font-family: Georgia, 'Times New Roman', serif; color: #1b1b1b; background: #fff; }
        .gtools { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .gbtn { display: inline-flex; align-items: center; gap: 6px; background: #21314F; color: #faf7f1; border: none; border-radius: 6px; padding: 8px 14px; font-size: 14px; font-family: sans-serif; cursor: pointer; }
        .gback { display: inline-flex; align-items: center; gap: 4px; color: #6b6b6b; font-size: 13px; font-family: sans-serif; text-decoration: none; }
        .gtitle { font-size: 20px; color: #21314F; margin: 0 0 2px; }
        .gsub { font-size: 12px; color: #777; font-family: sans-serif; margin-bottom: 16px; }
        .gsec { font-size: 16px; color: #21314F; border-bottom: 2px solid #B0894F; padding-bottom: 3px; margin: 22px 0 10px; }
        .gbloco { border: 1px solid #e2dcc9; border-left: 4px solid #B0894F; border-radius: 5px; padding: 9px 12px; margin-bottom: 9px; page-break-inside: avoid; }
        .ganota { font-size: 13px; color: #21314F; font-family: sans-serif; margin-bottom: 3px; }
        .gok { color: #2E7D52; }
        .gproc { font-family: ui-monospace, monospace; font-size: 12px; color: #21314F; font-weight: 600; }
        .gpartes { font-size: 12.5px; margin: 2px 0; }
        .gcli { background: #f0e2c4; padding: 0 4px; border-radius: 3px; font-weight: 600; color: #21314F; }
        .gato { font-size: 11.5px; color: #666; font-family: sans-serif; }
        .ggrifo { background: #d8f0d2; border-left: 3px solid #7bbd6b; color: #234a1c; padding: 6px 9px; border-radius: 0 4px 4px 0; margin-top: 6px; font-size: 12px; line-height: 1.5; }
        .gempty { color: #999; font-size: 13px; font-family: sans-serif; padding: 20px; text-align: center; }
        @media print {
          .no-print { display: none !important; }
          .gwrap { padding: 0; max-width: 100%; }
          @page { margin: 1.4cm; }
        }
      `}</style>

      <div className="gtools no-print">
        <button className="gbtn" onClick={() => window.print()}>
          <Printer size={15} /> Salvar como PDF / Imprimir
        </button>
        <a className="gback" href="/publicacoes">
          <ArrowLeft size={14} /> Voltar
        </a>
      </div>

      <h1 className="gtitle">Publicações grifadas</h1>
      <div className="gsub">
        {associado} · {pubs.length} publicação(ões)
      </div>

      {pubs.length === 0 && (
        <div className="gempty">
          Nenhuma publicação salva. Importe um PDF na aba Publicações → Triagem.
        </div>
      )}
      {trab.length > 0 && (
        <>
          <div className="gsec">Trabalhista · {trab.length}</div>
          {trab.map((p) => (
            <Bloco key={p.id} p={p} />
          ))}
        </>
      )}
      {civ.length > 0 && (
        <>
          <div className="gsec">Cível · {civ.length}</div>
          {civ.map((p) => (
            <Bloco key={p.id} p={p} />
          ))}
        </>
      )}
    </div>
  );
}
