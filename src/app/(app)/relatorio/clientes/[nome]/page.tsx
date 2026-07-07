import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";
import { getRelatorioClienteEditor } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { RelatorioClienteEditor } from "@/components/RelatorioClienteEditor";

export const dynamic = "force-dynamic";

export default async function RelatorioClienteEditorPage({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");

  const { nome } = await params;
  const cliente = decodeURIComponent(nome);
  const dados = await getRelatorioClienteEditor(cliente);
  if (!dados) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/relatorio/clientes"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Relatório dos clientes
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">{dados.cliente}</h1>
          <p className="mt-1 text-[13px] text-muted">
            Preencha e atualize o relatório de cada processo. As alterações valem
            para o PDF enviado ao cliente.
          </p>
        </div>
        <a
          href={`/api/relatorio-cliente?cliente=${encodeURIComponent(dados.cliente)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[12.5px] text-navy hover:bg-cream"
        >
          <Download size={15} /> Baixar PDF
        </a>
      </div>

      <RelatorioClienteEditor
        cliente={dados.cliente}
        envio={dados.envio}
        processos={dados.processos}
      />
    </div>
  );
}
