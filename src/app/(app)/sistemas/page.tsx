import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Server, Scale, AlertTriangle } from "lucide-react";
import { getLevantamentoSistemas, type LevantamentoItem } from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

function Barras({
  titulo,
  itens,
  total,
  Icon,
}: {
  titulo: string;
  itens: LevantamentoItem[];
  total: number;
  Icon: typeof Scale;
}) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="mb-4 inline-flex items-center gap-2 text-[15px] font-medium text-navy">
        <Icon size={16} /> {titulo}
      </h2>
      {itens.length === 0 ? (
        <p className="text-[12.5px] text-faint">Nada para mostrar ainda.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {itens.map((i) => (
            <div key={i.rotulo} className="flex items-center gap-3">
              <div className="w-40 shrink-0 truncate text-[13px] text-ink" title={i.rotulo}>
                {i.rotulo}
              </div>
              <div className="h-4 flex-1 overflow-hidden rounded bg-cream">
                <div
                  className="h-full rounded bg-navy/70"
                  style={{ width: `${Math.round((i.total / max) * 100)}%` }}
                />
              </div>
              <div className="w-16 shrink-0 text-right text-[12px] text-muted">
                {i.total} · {Math.round((i.total / total) * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function SistemasPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  const dados = await getLevantamentoSistemas();
  if (!dados) redirect("/painel");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/processos"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Processos
      </Link>
      <h1 className="font-serif text-2xl text-navy">Levantamento de sistemas</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Onde os {dados.total} processos tramitam. O tribunal é identificado
        automaticamente pelo número CNJ; o sistema (PJe, e-SAJ…) vem do que for
        cadastrado em cada processo.
      </p>

      <div className="flex flex-col gap-4">
        <Barras titulo="Por tribunal (pelo número CNJ)" itens={dados.porTribunal} total={dados.total} Icon={Scale} />
        <Barras titulo="Por sistema cadastrado" itens={dados.porSistema} total={dados.total} Icon={Server} />
        {dados.semSistema > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-[12.5px] text-[#8a6d2f]">
            <AlertTriangle size={15} />
            {dados.semSistema} processo(s) ainda sem o sistema cadastrado — informe
            na ficha de cada processo para o levantamento por sistema ficar completo.
          </div>
        )}
      </div>
    </div>
  );
}
