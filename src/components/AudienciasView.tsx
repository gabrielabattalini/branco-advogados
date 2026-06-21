"use client";

import { useState } from "react";
import { Plus, Bell, Gavel, MapPin } from "lucide-react";
import { AvatarGroup } from "@/components/Avatar";
import { NovaAudienciaModal } from "@/components/NovaAudienciaModal";
import { brData, labelTipoAudiencia, formatOffset } from "@/lib/audiencia";
import type { Processo } from "@/lib/mock";
import type { Responsavel, AudienciaDTO } from "@/lib/data";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  agendada: { label: "Agendada", cls: "bg-gold/15 text-gold" },
  realizada: { label: "Realizada", cls: "bg-ok/15 text-ok" },
  cancelada: { label: "Cancelada", cls: "bg-line text-faint" },
};

export function AudienciasView({
  audiencias,
  processos,
  responsaveis,
  papel,
  me,
}: {
  audiencias: AudienciaDTO[];
  processos: Processo[];
  responsaveis: Responsavel[];
  papel: string;
  me: string;
}) {
  const [showNova, setShowNova] = useState(false);
  const [editar, setEditar] = useState<AudienciaDTO | null>(null);

  // Próximas (agendadas) primeiro; depois realizadas/canceladas.
  const proximas = audiencias.filter((a) => a.status === "agendada");
  const outras = audiencias.filter((a) => a.status !== "agendada");

  const Card = (a: AudienciaDTO) => {
    const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.agendada;
    return (
      <button
        key={a.id}
        onClick={() => setEditar(a)}
        className="flex w-full flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-gold/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center rounded-md bg-navy px-2.5 py-1 text-cream">
              <span className="text-[10px] uppercase leading-none opacity-80">
                {brData(a.data).slice(0, 5)}
              </span>
              <span className="text-[15px] font-medium leading-tight">
                {a.hora}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">
                {a.titulo}
              </div>
              <div className="text-[11.5px] text-muted">
                {labelTipoAudiencia(a.tipo)}
                {a.processoNumero && (
                  <>
                    {" · "}
                    <span className="font-mono">{a.processoNumero}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className={"rounded px-2 py-0.5 text-[11px] " + badge.cls}>
            {badge.label}
          </span>
        </div>

        {(a.local || a.partes) && (
          <div className="flex flex-col gap-0.5 text-[12px] text-muted">
            {a.local && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-faint" /> {a.local}
              </span>
            )}
            {a.partes && <span className="text-ink">{a.partes}</span>}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {a.lembretes.length > 0 ? (
              <>
                <Bell size={12} className="text-gold" />
                {a.lembretes.slice(0, 4).map((l) => (
                  <span
                    key={l.id}
                    className={
                      "rounded-full px-2 py-0.5 text-[10.5px] " +
                      (l.enviado
                        ? "bg-ok/10 text-ok"
                        : "bg-navy/10 text-navy")
                    }
                  >
                    {formatOffset(l.offsetMin)}
                  </span>
                ))}
                {a.lembretes.length > 4 && (
                  <span className="text-[10.5px] text-faint">
                    +{a.lembretes.length - 4}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-faint">Sem lembretes</span>
            )}
          </div>
          {a.participantes.length > 0 && (
            <AvatarGroup inis={a.participantes} size={22} />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Audiências</h1>
        <button
          onClick={() => setShowNova(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
        >
          <Plus size={16} /> Nova audiência
        </button>
      </div>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        As audiências também aparecem na Agenda. Os lembretes são enviados por
        e-mail aos participantes na antecedência configurada.
      </p>

      {audiencias.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-surface px-4 py-12 text-center">
          <Gavel size={22} className="text-faint" />
          <div className="text-[13px] text-faint">
            Nenhuma audiência cadastrada — clique em “Nova audiência”.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {proximas.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-medium uppercase tracking-wide text-faint">
                Próximas
              </div>
              {proximas.map(Card)}
            </div>
          )}
          {outras.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-medium uppercase tracking-wide text-faint">
                Realizadas / canceladas
              </div>
              {outras.map(Card)}
            </div>
          )}
        </div>
      )}

      {showNova && (
        <NovaAudienciaModal
          processos={processos}
          responsaveis={responsaveis}
          papel={papel}
          me={me}
          onClose={() => setShowNova(false)}
        />
      )}
      {editar && (
        <NovaAudienciaModal
          processos={processos}
          responsaveis={responsaveis}
          audiencia={editar}
          papel={papel}
          me={me}
          onClose={() => setEditar(null)}
        />
      )}
    </div>
  );
}
