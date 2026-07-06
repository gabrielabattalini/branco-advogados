import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Download, Mail, AlertTriangle, Scale, Pencil } from "lucide-react";
import { getClientesRelatorio } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

export default async function RelatorioClientesPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const clientes = await getClientesRelatorio();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/relatorio"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Relatórios
      </Link>
      <h1 className="font-serif text-2xl text-navy">Relatório dos clientes</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Um relatório por cliente, no papel timbrado do escritório. Clique em um
        cliente para preencher e atualizar cada processo. O envio automático (até
        o dia 5) usa o e-mail cadastrado na planilha.
      </p>

      {clientes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-12 text-center text-[13px] text-faint">
          Nenhum cliente com processo. Importe os relatórios em{" "}
          <Link href="/importar" className="text-navy underline">
            Importar
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {clientes.map((c) => (
            <div
              key={c.nome}
              className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
            >
              <Link
                href={`/relatorio/clientes/${encodeURIComponent(c.nome)}`}
                className="group min-w-0 flex-1"
              >
                <div className="truncate text-[13px] font-medium text-ink group-hover:text-navy">
                  {c.nome}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-faint">
                  <span className="inline-flex items-center gap-1">
                    <Scale size={11} /> {c.processos} processo(s)
                  </span>
                  {c.temConfig ? (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Mail size={11} /> {c.emails || "sem e-mail"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#c0892e]">
                      <AlertTriangle size={11} /> sem envio na planilha
                    </span>
                  )}
                </div>
              </Link>
              <Link
                href={`/relatorio/clientes/${encodeURIComponent(c.nome)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-navy hover:bg-cream"
              >
                <Pencil size={13} /> Editar
              </Link>
              <a
                href={`/api/relatorio-cliente?cliente=${encodeURIComponent(c.nome)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-navy hover:bg-cream"
              >
                <Download size={14} /> PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
