"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check, AlertTriangle, Power } from "lucide-react";
import {
  setEnvioAtivoCliente,
  setEnvioAtivoTodos,
  enviarRelatorioPorCliente,
} from "@/lib/relatorio-actions";

// Ligar/Desligar o envio automático de TODOS os clientes de uma vez.
export function AcoesEnvioTodos() {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "on" | "off">("");
  const todos = async (ativo: boolean) => {
    setBusy(ativo ? "on" : "off");
    const res = await setEnvioAtivoTodos(ativo);
    setBusy("");
    if (res.ok) router.refresh();
    else alert(res.erro);
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
      <Power size={16} className="text-navy" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-navy">Envio automático mensal</div>
        <div className="text-[12px] text-muted">
          Enviado até o dia 5 para cada cliente marcado como automático (botão “Auto” verde).
        </div>
      </div>
      <button
        onClick={() => todos(true)}
        disabled={busy !== ""}
        className="inline-flex items-center gap-1.5 rounded-md border border-ok/40 bg-ok/10 px-3 py-1.5 text-[12px] text-ok hover:bg-ok/15 disabled:opacity-40"
      >
        {busy === "on" ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
        Ligar todos
      </button>
      <button
        onClick={() => todos(false)}
        disabled={busy !== ""}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-muted hover:bg-cream disabled:opacity-40"
      >
        {busy === "off" ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
        Desligar todos
      </button>
    </div>
  );
}

// Liga/desliga o envio automático de um cliente específico (na linha da lista).
export function EnvioAtivoBotao({
  cliente,
  ativo,
}: {
  cliente: string;
  ativo: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(ativo);
  const [busy, setBusy] = useState(false);
  // Sincroniza com o servidor após refresh (ex.: depois de "Ligar/Desligar todos").
  useEffect(() => setOn(ativo), [ativo]);

  const toggle = async () => {
    setBusy(true);
    const novo = !on;
    const res = await setEnvioAtivoCliente(cliente, novo);
    setBusy(false);
    if (res.ok) {
      setOn(novo);
      router.refresh();
    } else alert(res.erro);
  };
  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={on ? "Envio automático LIGADO — clique para desligar" : "Envio automático DESLIGADO — clique para ligar"}
      className={
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] disabled:opacity-40 " +
        (on
          ? "border-ok/40 bg-ok/10 text-ok hover:bg-ok/15"
          : "border-line text-faint hover:bg-cream")
      }
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
      Auto {on ? "on" : "off"}
    </button>
  );
}

// Botão de enviar o relatório de um cliente agora (ao lado do relatório).
export function EnviarBotao({ cliente }: { cliente: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const enviar = async () => {
    setBusy(true);
    setMsg(null);
    const res = await enviarRelatorioPorCliente(cliente);
    setBusy(false);
    setMsg({
      ok: res.ok,
      texto: res.ok ? `Enviado (${res.destinatarios})` : res.motivo || "Falha",
    });
    router.refresh();
  };
  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className={"text-[11px] " + (msg.ok ? "text-ok" : "text-danger")}>
          {msg.ok ? <Check size={12} className="inline" /> : <AlertTriangle size={12} className="inline" />} {msg.texto}
        </span>
      )}
      <button
        onClick={enviar}
        disabled={busy}
        title="Enviar relatório por e-mail"
        className="inline-flex items-center gap-1.5 rounded-md border border-navy/40 px-3 py-1.5 text-[12px] text-navy hover:bg-cream disabled:opacity-40"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Enviar
      </button>
    </div>
  );
}
