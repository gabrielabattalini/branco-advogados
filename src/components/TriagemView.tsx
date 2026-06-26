"use client";

import { useState, useRef, useEffect } from "react";
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
  FileDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  importarAASP,
  sincronizarAASP,
  excluirPublicacao,
  ignorarPublicacao,
  gerarGrifadoSalvo,
  type ResultadoImport,
} from "@/lib/aasp-actions";
import { NovaTarefaModal } from "@/components/NovaTarefaModal";
import { dataPorExtenso } from "@/lib/hoje";
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
function brL(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function baixarPDF(nome: string, base64: string) {
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
  const [aberto, setAberto] = useState(false);
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
          <div className={aberto ? "whitespace-pre-wrap" : ""}>
            {aberto || p.teor.length <= 280 ? p.teor : p.teor.slice(0, 280) + "…"}
          </div>
          {p.teor.length > 280 && (
            <button
              onClick={() => setAberto((v) => !v)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              {aberto ? (
                <>
                  <ChevronUp size={13} /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Ver publicação completa
                </>
              )}
            </button>
          )}
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
  dataFiltro,
}: {
  pubs: TriagemPub[];
  processos: Processo[];
  responsaveis: Responsavel[];
  ultimosResp: Record<string, string[]>;
  papel: string;
  me?: string;
  dataFiltro?: string;
}) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<ResultadoImport | null>(null);
  const [grifando, setGrifando] = useState(false);
  const [grifErro, setGrifErro] = useState("");
  const ctx: ModalCtx = { processos, responsaveis, ultimosResp, papel, me };

  // Gera os dois grifados (cível + trabalhista) a partir do PDF guardado no
  // último import — sem precisar subir o arquivo de novo.
  const gerarGrifados = async () => {
    if (grifando) return;
    setGrifando(true);
    setGrifErro("");
    try {
      const r = await gerarGrifadoSalvo();
      if (r.ok) {
        r.arquivos.forEach((a, i) =>
          setTimeout(() => baixarPDF(a.nome, a.base64), i * 400),
        );
      } else {
        setGrifErro(r.erro);
      }
    } catch {
      setGrifErro("Erro ao gerar os PDFs grifados.");
    }
    setGrifando(false);
  };

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

  const [buscando, setBuscando] = useState(false);
  // Busca as publicações direto na AASP (sem subir PDF).
  const buscarNaAASP = async () => {
    if (buscando) return;
    setBuscando(true);
    setMsg(null);
    try {
      const r = await sincronizarAASP(5);
      setMsg(r);
      if (r.ok) router.refresh();
    } catch {
      setMsg({ ok: false, erro: "Não consegui buscar na AASP agora." });
    }
    setBuscando(false);
  };

  // Filtra pelo dia selecionado no calendário (quando houver).
  const doDia = dataFiltro
    ? pubs.filter((p) => p.disponibilizacao === dataFiltro)
    : pubs;
  // Duas categorias só: Trabalhista e Cível (qualquer outra, inclusive federal
  // antigo, conta como cível).
  const trab = doDia.filter((p) => p.area === "trabalhista");
  const civ = doDia.filter((p) => p.area !== "trabalhista");
  const [aba, setAba] = useState<"trabalhista" | "civel">(
    trab.length ? "trabalhista" : "civel",
  );
  const lista = aba === "trabalhista" ? trab : civ;
  const pendentes = doDia.filter((p) => p.status === "pendente").length;

  // Ao trocar de dia, abre a aba que tem conteúdo (se só uma tiver).
  useEffect(() => {
    if (trab.length && !civ.length) setAba("trabalhista");
    else if (!trab.length && civ.length) setAba("civel");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFiltro]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy/15 bg-navy/[0.03] px-4 py-3">
        <div className="text-[13px] text-muted">
          <span className="font-medium text-navy">Buscar publicações na AASP</span>
          <span className="ml-1 text-faint">
            — puxa direto da AASP os últimos dias, sem subir PDF.
          </span>
        </div>
        <button
          onClick={buscarNaAASP}
          disabled={buscando}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-1.5 text-[13px] font-medium text-cream hover:bg-navy-dark disabled:opacity-50"
        >
          {buscando ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Buscando…
            </>
          ) : (
            <>
              <RefreshCw size={14} /> Buscar publicações
            </>
          )}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-3">
        <div className="text-[13px] text-muted">
          <span className="font-medium text-navy">{arquivo?.name ?? "Ou importe um PDF da AASP"}</span>
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

      {dataFiltro && pubs.length > 0 && (
        <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
          <h2 className="text-[15px] font-medium capitalize text-navy">
            {dataPorExtenso(dataFiltro)}
          </h2>
          <span className="shrink-0 text-[12px] text-muted">
            {doDia.length} publicação(ões)
            {pendentes > 0 ? ` · ${pendentes} a triar` : ""}
          </span>
        </div>
      )}

      {pubs.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-12 text-center text-[13px] text-faint">
          Nenhuma publicação ainda. Clique em “Buscar publicações” ou importe um PDF
          da AASP.
        </div>
      ) : doDia.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-[13px] text-faint">
          Nenhuma publicação neste dia. Escolha um dia destacado em amarelo no
          calendário.
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAba("trabalhista")}
              className={
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm " +
                (aba === "trabalhista"
                  ? "bg-navy text-cream"
                  : "border border-line text-muted hover:bg-surface")
              }
            >
              <Scale size={15} /> Trabalhista · {trab.length}
            </button>
            <button
              onClick={() => setAba("civel")}
              className={
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm " +
                (aba === "civel"
                  ? "bg-navy text-cream"
                  : "border border-line text-muted hover:bg-surface")
              }
            >
              <Landmark size={15} /> Cível · {civ.length}
            </button>
            <button
              onClick={gerarGrifados}
              disabled={grifando}
              title="Gera os dois PDFs grifados (Cível e Trabalhista) do último PDF importado"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gold/60 bg-gold/10 px-3 py-1.5 text-sm text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              {grifando ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Gerando…
                </>
              ) : (
                <>
                  <FileDown size={15} /> Gerar PDF (grifado)
                </>
              )}
            </button>
          </div>
          {grifErro && (
            <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
              {grifErro}{" "}
              <a href="/grifado" target="_blank" rel="noopener noreferrer" className="underline">
                Subir um PDF manualmente
              </a>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {lista.map((p) => (
              <Cartao key={p.id} p={p} ctx={ctx} />
            ))}
          </div>
          {lista.length === 0 && (
            <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-[13px] text-faint">
              Nenhuma publicação nesta aba.
            </div>
          )}
        </>
      )}
    </div>
  );
}
