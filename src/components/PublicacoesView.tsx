"use client";

import { useState } from "react";
import { ListChecks, CalendarDays, type LucideIcon } from "lucide-react";
import { TriagemView } from "@/components/TriagemView";
import { PublicacoesCalendario } from "@/components/PublicacoesCalendario";
import type { PublicacaoCal, Responsavel, TriagemPub } from "@/lib/data";
import type { Processo } from "@/lib/mock";

type View = "triagem" | "calendario";

export function PublicacoesView({
  publicacoes,
  triagem,
  responsaveis,
  processos,
  ultimosResp,
  papel,
  me,
}: {
  publicacoes: PublicacaoCal[];
  triagem: TriagemPub[];
  responsaveis: Responsavel[];
  processos: Processo[];
  ultimosResp: Record<string, string[]>;
  papel: string;
  me?: string;
}) {
  const [view, setView] = useState<View>("triagem");

  const tabBtn = (v: View, Icon: LucideIcon, label: string) => (
    <button
      onClick={() => setView(v)}
      className={
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors " +
        (view === v
          ? "bg-navy text-cream"
          : "border border-line text-muted hover:bg-surface")
      }
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Publicações</h1>
        <div className="flex items-center gap-2">
          {tabBtn("triagem", ListChecks, "Triagem")}
          {tabBtn("calendario", CalendarDays, "Calendário")}
        </div>
      </div>

      {view === "triagem" ? (
        <TriagemView
          pubs={triagem}
          processos={processos}
          responsaveis={responsaveis}
          ultimosResp={ultimosResp}
          papel={papel}
          me={me}
        />
      ) : (
        <PublicacoesCalendario publicacoes={publicacoes} />
      )}
    </div>
  );
}
