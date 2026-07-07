"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  CalendarClock,
  Send,
  Mail,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  salvarProcessoRelatorio,
  adicionarSituacao,
  editarSituacao,
  removerSituacao,
  removerProcesso,
  salvarEnvioCliente,
  enviarRelatorioPorCliente,
} from "@/lib/relatorio-actions";
import { CATEGORIAS_RELATORIO } from "@/lib/relatorio-categorias";
import type { ProcRelEditorDTO, SituacaoEditorDTO, EnvioClienteDTO } from "@/lib/data";

// Card de envio do relatório do cliente: e-mails, corpo, nome do arquivo,
// tipo, envio automático + botões Salvar e Enviar agora.
function EnvioCard({ cliente, envio }: { cliente: string; envio: EnvioClienteDTO }) {
  const router = useRouter();
  const [f, setF] = useState({
    emails: envio.emails,
    corpoEmail: envio.corpoEmail,
    nomeArquivo: envio.nomeArquivo,
    tipo: envio.tipo,
    ativo: envio.ativo,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setF({ ...f, [k]: k === "ativo" ? (e.target as HTMLInputElement).checked : e.target.value });
      setSalvo(false);
    };

  const salvar = async () => {
    setSalvando(true);
    const res = await salvarEnvioCliente(cliente, f);
    setSalvando(false);
    if (res.ok) { setSalvo(true); router.refresh(); } else alert(res.erro);
  };
  const enviar = async () => {
    setEnviando(true);
    setMsg(null);
    // salva antes de enviar, para usar os dados atuais
    await salvarEnvioCliente(cliente, f);
    const res = await enviarRelatorioPorCliente(cliente);
    setEnviando(false);
    setMsg({
      ok: res.ok,
      texto: res.ok ? `Enviado para ${res.destinatarios} e-mail(s).` : res.motivo || "Falha no envio.",
    });
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-navy/25 bg-cream/30">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <Mail size={16} className="text-navy" />
        <div className="text-[14px] font-medium text-navy">Envio do relatório</div>
        {envio.ultimoEnvio && (
          <span className="ml-auto text-[11px] text-faint">último envio: {envio.ultimoEnvio}</span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div>
          <label className={labelCls}>E-mails (separe por ; ou ,)</label>
          <input className={inputCls} value={f.emails} onChange={set("emails")} placeholder="fulano@empresa.com; outro@empresa.com" />
        </div>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div>
            <label className={labelCls}>Nome do arquivo</label>
            <input className={inputCls} value={f.nomeArquivo} onChange={set("nomeArquivo")} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={f.tipo} onChange={set("tipo")}>
              <option value="">—</option>
              <option value="PF">PF</option>
              <option value="PJ">PJ</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Corpo do e-mail — {"{MES_ANO_REFERENCIA_TITULO}"} vira o mês</label>
          <textarea className={inputCls + " min-h-[80px] resize-y"} value={f.corpoEmail} onChange={set("corpoEmail")} maxLength={6000} />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={f.ativo} onChange={set("ativo")} />
          Incluir no envio automático mensal (até o dia 5)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-navy hover:bg-surface disabled:opacity-40">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {salvando ? "Salvando…" : "Salvar envio"}
          </button>
          {salvo && <span className="inline-flex items-center gap-1 text-[13px] text-ok"><Check size={15} /> Salvo</span>}
          <button onClick={enviar} disabled={enviando} className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40">
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {enviando ? "Enviando…" : "Enviar agora"}
          </button>
          {msg && (
            <span className={"inline-flex items-center gap-1 text-[12.5px] " + (msg.ok ? "text-ok" : "text-danger")}>
              {msg.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {msg.texto}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint";

function Situacao({
  s,
  onChange,
}: {
  s: SituacaoEditorDTO;
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(s.texto);
  const [busy, setBusy] = useState(false);

  const salvar = async () => {
    if (!texto.trim() || busy) return;
    setBusy(true);
    await editarSituacao(s.id, texto);
    setBusy(false);
    setEditando(false);
    onChange();
  };
  const remover = async () => {
    if (busy) return;
    if (!confirm("Remover este lançamento da situação?")) return;
    setBusy(true);
    await removerSituacao(s.id);
    onChange();
  };

  if (editando) {
    return (
      <div className="rounded-md border border-navy/30 bg-cream/40 p-2">
        <textarea
          className={inputCls + " min-h-[70px] resize-y"}
          value={texto}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            onClick={salvar}
            disabled={busy || !texto.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1 text-[12px] text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
          </button>
          <button
            onClick={() => {
              setTexto(s.texto);
              setEditando(false);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-surface"
          >
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-cream/40">
      <span className="mt-1 select-none text-navy">•</span>
      <p className="flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
        {s.texto}
      </p>
      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => setEditando(true)}
          title="Editar"
          className="rounded p-1 text-faint hover:bg-surface hover:text-navy"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={remover}
          disabled={busy}
          title="Remover"
          className="rounded p-1 text-faint hover:bg-surface hover:text-danger"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function ProcessoForm({ p }: { p: ProcRelEditorDTO }) {
  const router = useRouter();
  const [f, setF] = useState({
    parteContraria: p.parteContraria,
    parteContrariaTipo: p.parteContrariaTipo,
    juizo: p.juizo,
    sinteseDoPedido: p.sinteseDoPedido,
    valorCausa: p.valorCausa,
    valorEstimado: p.valorEstimado,
    audienciaRel: p.audienciaRel,
    observacoesRel: p.observacoesRel,
    categoria: p.categoria || "judicial",
    infoAdicional: p.infoAdicional,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [nova, setNova] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    setSalvo(false);
  };

  const salvar = async () => {
    setSalvando(true);
    const res = await salvarProcessoRelatorio(p.id, f);
    setSalvando(false);
    if (res.ok) {
      setSalvo(true);
      router.refresh();
    } else alert(res.erro);
  };

  const adicionar = async () => {
    if (!nova.trim() || addBusy) return;
    setAddBusy(true);
    const res = await adicionarSituacao(p.id, nova);
    setAddBusy(false);
    if (res.ok) {
      setNova("");
      router.refresh();
    } else alert(res.erro);
  };

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="font-mono text-[13px] font-medium text-navy">
          {p.numero}
        </div>
        <button
          onClick={async () => {
            if (!confirm(`Remover este processo (${p.numero}) do relatório?`)) return;
            const res = await removerProcesso(p.id);
            if (res.ok) router.refresh();
            else alert(res.erro);
          }}
          title="Remover processo"
          className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11.5px] text-faint hover:border-danger/40 hover:text-danger"
        >
          <Trash2 size={13} /> Remover
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <label className={labelCls}>Modalidade (seção do relatório)</label>
          <select
            className={inputCls}
            value={f.categoria}
            onChange={(e) => {
              setF({ ...f, categoria: e.target.value });
              setSalvo(false);
            }}
          >
            {CATEGORIAS_RELATORIO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[1fr_160px] gap-3">
          <div>
            <label className={labelCls}>Parte contrária</label>
            <input className={inputCls} value={f.parteContraria} onChange={set("parteContraria")} />
          </div>
          <div>
            <label className={labelCls}>Tipo (ré, autora…)</label>
            <input className={inputCls} value={f.parteContrariaTipo} onChange={set("parteContrariaTipo")} placeholder="ré" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Juízo</label>
          <input className={inputCls} value={f.juizo} onChange={set("juizo")} placeholder={p.tribunal} />
        </div>

        <div>
          <label className={labelCls}>1. Síntese do pedido</label>
          <textarea className={inputCls + " min-h-[70px] resize-y"} value={f.sinteseDoPedido} onChange={set("sinteseDoPedido")} maxLength={4000} />
        </div>

        {/* 2. Situação atual */}
        <div>
          <label className={labelCls}>2. Situação atual (status)</label>
          <div className="rounded-md border border-line bg-cream/30 p-2">
            {p.situacoes.length === 0 && (
              <p className="px-1 py-1 text-[12px] text-faint">
                Nenhum lançamento ainda.
              </p>
            )}
            {p.situacoes.map((s) => (
              <Situacao key={s.id} s={s} onChange={() => router.refresh()} />
            ))}
            <div className="mt-2 flex items-start gap-2 border-t border-line pt-2">
              <textarea
                className={inputCls + " min-h-[44px] resize-y"}
                value={nova}
                maxLength={2000}
                onChange={(e) => setNova(e.target.value)}
                placeholder="Adicionar um novo lançamento à situação…"
              />
              <button
                onClick={adicionar}
                disabled={addBusy || !nova.trim()}
                className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-navy px-3 py-2 text-[12px] text-cream hover:bg-navy-dark disabled:opacity-40"
              >
                {addBusy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>3. Valor da causa</label>
            <input className={inputCls} value={f.valorCausa} onChange={set("valorCausa")} />
          </div>
          <div>
            <label className={labelCls}>Valor estimado</label>
            <input className={inputCls} value={f.valorEstimado} onChange={set("valorEstimado")} />
          </div>
        </div>

        <div>
          <label className={labelCls}>4. Audiência</label>
          <input className={inputCls} value={f.audienciaRel} onChange={set("audienciaRel")} placeholder={p.audienciaSugerida || "Não há."} />
          {p.audienciaSugerida && (
            <button
              type="button"
              onClick={() => {
                setF({ ...f, audienciaRel: p.audienciaSugerida });
                setSalvo(false);
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-navy hover:underline"
            >
              <CalendarClock size={12} /> Usar audiência agendada: {p.audienciaSugerida}
            </button>
          )}
        </div>

        <div>
          <label className={labelCls}>5. Observações</label>
          <textarea className={inputCls + " min-h-[60px] resize-y"} value={f.observacoesRel} onChange={set("observacoesRel")} maxLength={4000} />
        </div>

        <div>
          <label className={labelCls}>Informações adicionais</label>
          <textarea className={inputCls + " min-h-[60px] resize-y"} value={f.infoAdicional} onChange={set("infoAdicional")} maxLength={4000} placeholder="Dados extras — ex.: crédito habilitado, classe, administrador judicial (recuperação/falência)…" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {salvando ? "Salvando…" : "Salvar processo"}
          </button>
          {salvo && (
            <span className="inline-flex items-center gap-1 text-[13px] text-ok">
              <Check size={15} /> Salvo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RelatorioClienteEditor({
  cliente,
  envio,
  processos,
}: {
  cliente: string;
  envio: EnvioClienteDTO;
  processos: ProcRelEditorDTO[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <EnvioCard cliente={cliente} envio={envio} />
      {processos.map((p) => (
        <ProcessoForm key={p.id} p={p} />
      ))}
    </div>
  );
}
