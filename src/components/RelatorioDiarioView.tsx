"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  Check,
  Plus,
  ArrowRightLeft,
  MessageSquare,
  Users,
  CalendarClock,
} from "lucide-react";
import type { RelatorioDiario, PessoaDia, AcaoDiaria } from "@/lib/data";
import { addDiasISO, dataPorExtenso } from "@/lib/hoje";
import { enviarRelatorioAgora } from "@/lib/relatorio-actions";

const ICONE: Record<string, typeof Plus> = {
  criacao: Plus,
  status: ArrowRightLeft,
  responsaveis: Users,
  prazo: CalendarClock,
  comentario: MessageSquare,
};
const COR: Record<string, string> = {
  criacao: "text-navy",
  status: "text-gold",
  prazo: "text-[#c0892e]",
  comentario: "text-[#2f6f8f]",
  responsaveis: "text-muted",
};

function Chips({ p }: { p: PessoaDia }) {
  const chips: [string, number, string][] = [
    ["concluídas", p.concluidas, "bg-ok/15 text-ok"],
    ["revisão", p.revisao, "bg-[#c0892e]/15 text-[#c0892e]"],
    ["criadas", p.criadas, "bg-navy/10 text-navy"],
    ["comentários", p.comentarios, "bg-[#2f6f8f]/12 text-[#2f6f8f]"],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips
        .filter(([, n]) => n > 0)
        .map(([label, n, cls]) => (
          <span
            key={label}
            className={"rounded-full px-2 py-0.5 text-[10.5px] font-medium " + cls}
          >
            {n} {label}
          </span>
        ))}
    </div>
  );
}

function Acao({ a }: { a: AcaoDiaria }) {
  const Icone = ICONE[a.tipo] ?? MessageSquare;
  return (
    <div className="flex items-start gap-2.5 border-t border-line py-2 first:border-t-0">
      <Icone size={13} className={"mt-0.5 shrink-0 " + (COR[a.tipo] ?? "text-muted")} />
      <span className="w-10 shrink-0 text-[11px] tabular-nums text-faint">
        {a.hora}
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] text-ink">
        {a.texto} <span className="text-muted">— {a.tarefa}</span>
      </div>
    </div>
  );
}

export function RelatorioDiarioView({
  rel,
  hoje,
}: {
  rel: RelatorioDiario;
  hoje: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const irPara = (d: string) => router.push(`/relatorio/diario?data=${d}`);
  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    setMsg(null);
    const r = await enviarRelatorioAgora(rel.data);
    if (r.ok)
      setMsg({
        ok: true,
        texto: `Enviado para ${r.destinatarios} destinatário(s).`,
      });
    else
      setMsg({
        ok: false,
        texto:
          r.erro === "e-mail não configurado"
            ? "E-mail ainda não configurado (verifique o domínio no Resend)."
            : r.erro === "sem destinatários"
              ? "Sem destinatário definido (configure RELATORIO_EMAIL ou um sócio)."
              : `Não foi possível enviar${r.motivo ? `: ${r.motivo}` : "."}`,
      });
    setEnviando(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">Relatório do dia</h1>
          <p className="text-[13px] text-muted">
            Prévia do que será enviado ao sócio às 19h.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/relatorio-diario?data=${rel.data}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-navy hover:bg-cream"
          >
            <Download size={15} /> PDF
          </a>
          <button
            onClick={enviar}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            <Send size={15} /> {enviando ? "Enviando…" : "Enviar agora"}
          </button>
        </div>
      </div>

      {/* Navegação de dia */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          onClick={() => irPara(addDiasISO(rel.data, -1))}
          className="text-muted hover:text-navy"
          aria-label="Dia anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={rel.data}
          max={hoje}
          onChange={(e) => e.target.value && irPara(e.target.value)}
          className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none"
        />
        <button
          onClick={() => rel.data < hoje && irPara(addDiasISO(rel.data, 1))}
          disabled={rel.data >= hoje}
          className="text-muted hover:text-navy disabled:opacity-30"
          aria-label="Próximo dia"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {msg && (
        <div
          className={
            "mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] " +
            (msg.ok
              ? "bg-ok/10 text-ok"
              : "bg-danger/10 text-danger")
          }
        >
          {msg.ok && <Check size={15} />} {msg.texto}
        </div>
      )}

      {/* Relatório (mesma informação do PDF) */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="bg-navy px-5 py-4">
          <div className="font-serif text-lg text-cream">BRANCO ADVOGADOS</div>
          <div className="text-[12px] text-gold">
            Relatório de Atividades do Dia
          </div>
          <div className="mt-1 text-[12px] capitalize text-cream/70">
            {dataPorExtenso(rel.data)}
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 text-[12px] text-muted">
            {rel.total}{" "}
            {rel.total === 1 ? "ação registrada" : "ações registradas"} ·{" "}
            {rel.pessoas.length}{" "}
            {rel.pessoas.length === 1 ? "pessoa" : "pessoas"}
          </div>
          {rel.pessoas.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-faint">
              Nenhuma atividade registrada neste dia.
            </p>
          ) : (
            rel.pessoas.map((p) => (
              <div key={p.iniciais} className="mb-5 last:mb-0">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-navy pb-1.5">
                  <span className="text-[14px] font-semibold text-navy">
                    {p.nome}
                  </span>
                  <Chips p={p} />
                </div>
                {p.acoes.map((a, i) => (
                  <Acao key={i} a={a} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
