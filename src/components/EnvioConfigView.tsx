"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Send, Loader2, Check, AlertTriangle, Trash2, Mail, Scale, Power,
} from "lucide-react";
import {
  setEnvioAutomaticoClientes,
  salvarEnvioConfig,
  removerEnvioConfig,
  enviarRelatorioClienteAgora,
  enviarTodosRelatoriosClientesAgora,
} from "@/lib/relatorio-actions";
import type { EnvioConfigItem } from "@/lib/data";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint";

function ClienteEnvio({ it }: { it: EnvioConfigItem }) {
  const router = useRouter();
  const [f, setF] = useState({
    emails: it.emails,
    corpoEmail: it.corpoEmail,
    nomeArquivo: it.nomeArquivo,
    tipo: it.tipo,
    ativo: it.ativo,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const salvar = async () => {
    setSalvando(true);
    const res = await salvarEnvioConfig(it.id, f);
    setSalvando(false);
    if (res.ok) { setSalvo(true); router.refresh(); } else alert(res.erro);
  };
  const enviar = async () => {
    setEnviando(true);
    setMsg(null);
    const res = await enviarRelatorioClienteAgora(it.id);
    setEnviando(false);
    setMsg({
      ok: res.ok,
      texto: res.ok
        ? `Enviado para ${res.destinatarios} e-mail(s).`
        : res.motivo || "Falha no envio.",
    });
    router.refresh();
  };
  const remover = async () => {
    if (!confirm(`Remover o cadastro de envio de "${it.nome}"?`)) return;
    const res = await removerEnvioConfig(it.id);
    if (res.ok) router.refresh(); else alert(res.erro);
  };

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-navy">{it.nome}</div>
          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-faint">
            {it.cliente ? (
              <span className="inline-flex items-center gap-1 text-muted">
                <Scale size={11} /> {it.processos} processo(s) · {it.cliente.slice(0, 40)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#c0892e]">
                <AlertTriangle size={11} /> sem processos casados no sistema
              </span>
            )}
            {it.ultimoEnvio && <span>último envio: {it.ultimoEnvio}</span>}
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-muted">
          <input
            type="checkbox"
            checked={f.ativo}
            onChange={(e) => { setF({ ...f, ativo: e.target.checked }); setSalvo(false); }}
          />
          Envio automático
        </label>
        <button onClick={remover} title="Remover cadastro" className="rounded p-1 text-faint hover:text-danger">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <label className={labelCls}>E-mails (separe por ; ou ,)</label>
          <input className={inputCls} value={f.emails} onChange={(e) => { setF({ ...f, emails: e.target.value }); setSalvo(false); }} placeholder="fulano@empresa.com; outro@empresa.com" />
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className={labelCls}>Nome do arquivo (casa com o relatório)</label>
            <input className={inputCls} value={f.nomeArquivo} onChange={(e) => { setF({ ...f, nomeArquivo: e.target.value }); setSalvo(false); }} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={f.tipo} onChange={(e) => { setF({ ...f, tipo: e.target.value }); setSalvo(false); }}>
              <option value="">—</option>
              <option value="PF">PF</option>
              <option value="PJ">PJ</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Corpo do e-mail — use {"{MES_ANO_REFERENCIA_TITULO}"} para o mês</label>
          <textarea className={inputCls + " min-h-[90px] resize-y"} value={f.corpoEmail} onChange={(e) => { setF({ ...f, corpoEmail: e.target.value }); setSalvo(false); }} maxLength={6000} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          {salvo && <span className="inline-flex items-center gap-1 text-[13px] text-ok"><Check size={15} /> Salvo</span>}
          <button onClick={enviar} disabled={enviando} className="inline-flex items-center gap-2 rounded-md border border-navy/40 px-4 py-2 text-sm text-navy hover:bg-cream disabled:opacity-40">
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

export function EnvioConfigView({
  ligado,
  itens,
}: {
  ligado: boolean;
  itens: EnvioConfigItem[];
}) {
  const router = useRouter();
  const [on, setOn] = useState(ligado);
  const [togBusy, setTogBusy] = useState(false);
  const [loteBusy, setLoteBusy] = useState(false);
  const [loteMsg, setLoteMsg] = useState<string | null>(null);

  const toggle = async () => {
    setTogBusy(true);
    const novo = !on;
    const res = await setEnvioAutomaticoClientes(novo);
    setTogBusy(false);
    if (res.ok) { setOn(novo); router.refresh(); } else alert(res.erro);
  };
  const enviarTodos = async () => {
    if (!confirm("Enviar agora o relatório de todos os clientes com envio automático ligado?")) return;
    setLoteBusy(true);
    setLoteMsg(null);
    const res = await enviarTodosRelatoriosClientesAgora();
    setLoteBusy(false);
    if ("erro" in res) setLoteMsg(res.erro);
    else setLoteMsg(`${res.enviados} enviado(s), ${res.falhas} falha(s).`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <Power size={18} className={on ? "text-ok" : "text-faint"} />
          <div>
            <div className="text-[14px] font-medium text-navy">Envio automático mensal</div>
            <div className="text-[12px] text-muted">
              {on ? "Ligado — envia os clientes ativos até o dia 5." : "Desligado — nenhum envio automático."}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={togBusy}
          className={"ml-auto inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-40 " + (on ? "border border-line text-muted hover:bg-surface" : "bg-navy text-cream hover:bg-navy-dark")}
        >
          {togBusy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
          {on ? "Desligar" : "Ligar"}
        </button>
        <button
          onClick={enviarTodos}
          disabled={loteBusy}
          className="inline-flex items-center gap-2 rounded-md border border-navy/40 px-4 py-2 text-sm text-navy hover:bg-cream disabled:opacity-40"
        >
          {loteBusy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {loteBusy ? "Enviando…" : "Enviar todos agora"}
        </button>
        {loteMsg && <span className="text-[12.5px] text-muted">{loteMsg}</span>}
      </div>

      {itens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-12 text-center text-[13px] text-faint">
          Nenhum cadastro de envio. Importe a planilha em Importar → Planilha de clientes.
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <Mail size={13} /> {itens.length} cadastro(s) de envio
        </div>
      )}

      {itens.map((it) => (
        <ClienteEnvio key={it.id} it={it} />
      ))}
    </div>
  );
}
