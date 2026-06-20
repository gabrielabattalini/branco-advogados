import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { getEventosAgenda } from "@/lib/data";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

const tipoMap: Record<string, { label: string; bar: string; tag: string }> = {
  reuniao: { label: "Reunião", bar: "bg-info", tag: "bg-info/15 text-info" },
  audiencia: {
    label: "Audiência",
    bar: "bg-gold",
    tag: "bg-trab-bg text-trab-text",
  },
  prazo: { label: "Prazo", bar: "bg-danger", tag: "bg-danger/15 text-danger" },
  atendimento: { label: "Atendimento", bar: "bg-ok", tag: "bg-ok/15 text-ok" },
};

export default async function AgendaPage() {
  const eventos = await getEventosAgenda();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Agenda</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream">
            Dia
          </span>
          <span className="rounded-md border border-line px-3 py-1.5 text-sm text-muted">
            Semana
          </span>
          <span className="rounded-md border border-line px-3 py-1.5 text-sm text-muted">
            Mês
          </span>
          <button className="ml-1 flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark">
            <Plus size={16} /> Novo evento
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted">
          <ChevronLeft size={16} />
          Sexta, 19 de junho de 2026
          <ChevronRight size={16} />
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-ok">
          <RefreshCw size={13} /> Sincronizado com o Outlook
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {eventos.map((e, idx) => {
          const t = tipoMap[e.tipo] ?? tipoMap.reuniao;
          return (
            <div key={idx} className="flex gap-3">
              <div className="w-12 pt-2 text-[12px] font-medium text-navy">
                {e.hora}
              </div>
              <div className="flex flex-1 overflow-hidden rounded-md border border-line bg-surface">
                <div className={"w-1 shrink-0 " + t.bar} />
                <div className="flex-1 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={"rounded px-2 py-0.5 text-[10px] " + t.tag}
                    >
                      {t.label}
                    </span>
                    {e.ini ? (
                      <Avatar ini={e.ini} size={22} />
                    ) : (
                      <span className="text-[11px] text-faint">equipe</span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[13px] text-ink">{e.titulo}</div>
                  <div className="text-[11px] text-faint">{e.detalhe}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
