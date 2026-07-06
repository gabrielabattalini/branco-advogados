"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, FileSpreadsheet, FileText, Loader2, Check, AlertTriangle } from "lucide-react";
import {
  importarContatos,
  importarPlanilhaClientes,
  importarRelatoriosDocx,
} from "@/lib/importar-actions";

type Msg = { ok: boolean; texto: string } | null;

export function ImportarView() {
  const router = useRouter();
  const contatosRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const [impContatos, setImpContatos] = useState(false);
  const [impPlan, setImpPlan] = useState(false);
  const [impDocs, setImpDocs] = useState(false);
  const [msgContatos, setMsgContatos] = useState<Msg>(null);
  const [msgPlan, setMsgPlan] = useState<Msg>(null);
  const [msgDocs, setMsgDocs] = useState<Msg>(null);

  const enviarContatos = async () => {
    const file = contatosRef.current?.files?.[0];
    if (!file) return;
    setImpContatos(true);
    setMsgContatos(null);
    const fd = new FormData();
    fd.set("arquivo", file);
    const res = await importarContatos(fd);
    setMsgContatos({ ok: res.ok, texto: res.ok ? res.msg : res.erro });
    setImpContatos(false);
    router.refresh();
  };

  const enviarPlanilha = async () => {
    const file = planRef.current?.files?.[0];
    if (!file) return;
    setImpPlan(true);
    setMsgPlan(null);
    const fd = new FormData();
    fd.set("arquivo", file);
    const res = await importarPlanilhaClientes(fd);
    setMsgPlan({ ok: res.ok, texto: res.ok ? res.msg : res.erro });
    setImpPlan(false);
    router.refresh();
  };

  const enviarDocs = async () => {
    const files = docsRef.current?.files;
    if (!files || files.length === 0) return;
    setImpDocs(true);
    setMsgDocs(null);
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("arquivos", f);
    const res = await importarRelatoriosDocx(fd);
    setMsgDocs({ ok: res.ok, texto: res.ok ? res.msg : res.erro });
    setImpDocs(false);
    router.refresh();
  };

  const aviso = (m: Msg) =>
    m && (
      <div
        className={
          "mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] " +
          (m.ok ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger")
        }
      >
        {m.ok ? <Check size={15} /> : <AlertTriangle size={15} />} {m.texto}
      </div>
    );

  const card = "rounded-lg border border-line bg-surface p-5";
  const fileInput =
    "block w-full text-[12px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-cream hover:file:bg-navy-dark";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-2xl text-navy">Importar</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Traga os dados reais do escritório para o sistema.
      </p>

      {/* 1. Contatos (Legal One) */}
      <div className={card + " mb-4"}>
        <div className="flex items-center gap-2 text-[14px] font-medium text-navy">
          <Users size={16} /> 1. Contatos (export do Legal One)
        </div>
        <p className="mt-1 mb-3 text-[12.5px] text-muted">
          Sobe a planilha de contatos exportada (.xlsx) com nome, CPF/CNPJ,
          profissão, telefone, e-mail, grupos e classificações. Os contatos
          aparecem na aba Contatos. Contatos já cadastrados não são duplicados.
        </p>
        <input ref={contatosRef} type="file" accept=".xlsx,.xlsm" className={fileInput} />
        <button
          onClick={enviarContatos}
          disabled={impContatos}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {impContatos ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
          {impContatos ? "Importando…" : "Importar contatos"}
        </button>
        {aviso(msgContatos)}
      </div>

      {/* 2. Planilha de clientes */}
      <div className={card + " mb-4"}>
        <div className="flex items-center gap-2 text-[14px] font-medium text-navy">
          <FileSpreadsheet size={16} /> 2. Planilha de clientes (envio)
        </div>
        <p className="mt-1 mb-3 text-[12.5px] text-muted">
          Sobe a planilha (.xlsx/.xlsm) com nome, e-mails, corpo do e-mail, nome
          do arquivo e PF/PJ de cada cliente.
        </p>
        <input ref={planRef} type="file" accept=".xlsx,.xlsm" className={fileInput} />
        <button
          onClick={enviarPlanilha}
          disabled={impPlan}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {impPlan ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
          {impPlan ? "Importando…" : "Importar planilha"}
        </button>
        {aviso(msgPlan)}
      </div>

      {/* 3. Relatórios .docx */}
      <div className={card}>
        <div className="flex items-center gap-2 text-[14px] font-medium text-navy">
          <FileText size={16} /> 3. Relatórios dos clientes (.docx)
        </div>
        <p className="mt-1 mb-3 text-[12.5px] text-muted">
          Sobe um ou vários relatórios .docx. O sistema cria os processos (parte
          contrária, número, juízo, síntese, valor) e a situação atual de cada um.
        </p>
        <input ref={docsRef} type="file" accept=".docx" multiple className={fileInput} />
        <button
          onClick={enviarDocs}
          disabled={impDocs}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {impDocs ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
          {impDocs ? "Importando…" : "Importar relatórios"}
        </button>
        {aviso(msgDocs)}
      </div>
    </div>
  );
}
