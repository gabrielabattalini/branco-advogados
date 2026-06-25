"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Loader2,
  Scale,
  Landmark,
  Check,
  Plus,
  Trash2,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  importarAASP,
  excluirPublicacao,
  ignorarPublicacao,
  type ResultadoImport,
} from "@/lib/aasp-actions";
import { NovaTarefaModal } from "@/components/NovaTarefaModal";
import type { Responsavel, TriagemPub } from "@/lib/data";
import type { Processo } from "@/lib/mock";

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

type ModalCtx = {
  processos: Processo[];
  responsaveis: Responsavel[];
  ultimosResp: Record<string, string[]>;
  papel: string;
  me?: string;
};

function Cartao({ p, ctx }: { p: TriagemPub; ctx: ModalCtx }) {
  const router = useRouter();
  const processada = p.status === "processada";
  const [abrir, setAbrir] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const enviando = useRef(false);
  const bom = p.resultado === "improcedente";

  const acaoServidor = async (fn: () => Promise<{ ok: boolean; erro?: string }>) => {
    if (enviando.current) return;
    enviando.current = true;
    setBusy(true);
    setErro("");
    try {
      const res = await fn();
      if (res.ok) {
        router.refresh();
        return;
      }
      setErro(res.erro ?? "Erro.");
    } catch {
      setErro("Erro inesperado.");
    }
    enviando.current = false;
    setBusy(false);
  };

  const nomeDe = (ini: string) =>
    ctx.responsaveis.find((r) => r.iniciais === ini)?.nome.split(/\s+/)[0] ?? ini;

  return (
    <div
      className={
        "relative overflow-hidden rounded-lg border bg-surface p-3.5 " +
        (processada ? "border-ok/40" : "border-line")
      }
    >
      <div className={"absolute inset-y-0 left-0 w-1 " + (processada ? "bg-ok" : "bg-gold")} />
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
              "rounded px-2 py-0.5 text-[10.5px] font-semibold " +
              (bom ? "bg-ok/15 text-ok" : "bg-trab-bg text-trab-text")
            }
          >
            {resultadoLabel[p.resultado]}
          </span>
        )}
        {processada && (
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-ok/12 px-2 py-0.5 text-[10.5px] font-semibold text-ok">
            <Check size={12} /> Tarefa criada
          </span>
        )}
      </div>

      <div className="font-mono text-[12.5px] font-semibold text-navy">
        {p.numero || (
          <span className="inline-flex items-center gap-1 font-sans text-danger">
            <AlertTriangle size={13} /> processo não identificado
          </span>
        )}
        {p.orgao && (
          <span className="font-sans text-[12px] font-normal text-muted"> · {p.orgao}</span>
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
        <span>
          Disponibilização {brL(p.disponibilizacao)} → Publicação {brL(p.dataPublicacao)}
        </span>
        <span className="ml-auto text-faint">publ. {p.publicacaoNum}</span>
      </div>

      {!processada && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-gold/5 px-2.5 py-1.5 text-[11.5px] text-muted">
          <span className="font-semibold uppercase tracking-wide text-[9.5px] text-gold">
            Sugestão
          </span>
          <span className="font-medium text-navy">{p.acao || "Verificar"}</span>
          <span>
            ·{" "}
            {p.responsaveis.length
              ? p.responsaveis.map(nomeDe).join(" / ")
              : "responsável a definir"}
          </span>
          {p.dataFatal && <span>· até {brL(p.dataFatal)}</span>}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        {!processada && (
          <button
            onClick={() => setAbrir(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-ok px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
          >
            <Plus size={13} /> Criar tarefa
          </button>
        )}
        {!processada && (
          <button
            onClick={() => acaoServidor(() => ignorarPublicacao(p.id))}
            disabled={busy}
            className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-navy disabled:opacity-40"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={13} />} Ignorar
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("Excluir esta publicação? Não pode ser desfeito.")) {
              acaoServidor(() => excluirPublicacao(p.id));
            }
          }}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-danger hover:underline disabled:opacity-40"
        >
          <Trash2 size={13} /> Excluir
        </button>
        {erro && <span className="text-[11px] text-danger">{erro}</span>}
      </div>

      {abrir && (
        <NovaTarefaModal
          processos={ctx.processos}
          responsaveis={ctx.responsaveis}
          ultimosResp={ctx.ultimosResp}
          papel={ctx.papel}
          me={ctx.me}
          triagemPublicacaoId={p.id}
          inicial={{
            titulo: p.acao || "Verificar",
            processoNumero: p.numero,
            responsaveis: p.responsaveis,
            dataDisponibilizacao: p.disponibilizacao,
            dataPublicacao: p.dataPublicacao,
            prazoDias: p.prazoDias || undefined,
            prazoTipo: p.prazoTipo || undefined,
          }}
          onClose={() => setAbrir(false)}
        />
      )}
    </div>
  );
}

export function TriagemView({
  pubs,
  processos,
  responsaveis,
  ultimosResp,
  papel,
  me,
}: {
  pubs: TriagemPub[];
  processos: Processo[];
  responsaveis: Responsavel[];
  ultimosResp: Record<string, string[]>;
  papel: string;
  me?: string;
}) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<ResultadoImport | null>(null);
  const ctx: ModalCtx = { processos, responsaveis, ultimosResp, papel, me };

  const enviar = async () => {
    if (!arquivo || carregando) return;
    setCarregando(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    try {
      const r = await importarAASP(fd);
      setMsg(r);
      if (r.ok) {
        setArquivo(null);
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, erro: "Erro inesperado ao processar o arquivo." });
    }
    setCarregando(false);
  };

  const grupos = (["trabalhista", "civel", "federal"] as const)
    .map((area) => ({ area, lista: pubs.filter((p) => p.area === area) }))
    .filter((g) => g.lista.length > 0);
  const pendentes = pubs.filter((p) => p.status === "pendente").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-3">
        <div className="text-[13px] text-muted">
          <span className="font-medium text-navy">{arquivo?.name ?? "Importar PDF da AASP"}</span>
          <span className="ml-1 text-faint">
            — separa, agrupa duplicatas, identifica o cliente e sugere a tarefa.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-[13px] text-muted hover:bg-cream">
            <FileText size={14} className="mr-1 inline" />
            Escolher
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                setMsg(null);
              }}
            />
          </label>
          <button
            onClick={enviar}
            disabled={!arquivo || carregando}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-[13px] text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {carregando ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Lendo…
              </>
            ) : (
              <>
                <Upload size={14} /> Importar
              </>
            )}
          </button>
        </div>
      </div>

      {msg && !msg.ok && (
        <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {msg.erro}
        </p>
      )}
      {msg && msg.ok && (
        <p className="mb-4 rounded-md bg-ok/10 px-3 py-2 text-[13px] text-ok">
          {msg.novas} nova(s) publicação(ões) importada(s)
          {msg.jaExistiam > 0 && ` · ${msg.jaExistiam} já estavam salvas`}.
        </p>
      )}

      {pubs.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-12 text-center text-[13px] text-faint">
          Nenhuma publicação ainda. Importe um PDF da AASP para começar.
        </div>
      ) : (
        <>
          <div className="mb-3 text-[12px] text-muted">
            {pubs.length} publicação(ões) salva(s) · {pendentes} a triar
          </div>
          {grupos.map((g) => {
            const info = areaInfo[g.area];
            const Icon = info?.icon ?? Scale;
            return (
              <section key={g.area} className="mb-6">
                <h2 className="mb-2 flex items-center gap-2 border-b border-line pb-1 font-serif text-lg text-navy">
                  <Icon size={18} className="text-gold" />
                  {info?.label ?? g.area}
                  <span className="font-sans text-[13px] font-normal text-muted">
                    · {g.lista.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {g.lista.map((p) => (
                    <Cartao key={p.id} p={p} ctx={ctx} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
