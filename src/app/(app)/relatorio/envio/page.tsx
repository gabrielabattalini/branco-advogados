import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getEnvioConfig } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { EnvioConfigView } from "@/components/EnvioConfigView";

export const dynamic = "force-dynamic";

export default async function EnvioPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const dados = await getEnvioConfig();
  if (!dados) redirect("/painel");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/relatorio"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-navy"
      >
        <ChevronLeft size={14} /> Relatórios
      </Link>
      <h1 className="font-serif text-2xl text-navy">Envio dos relatórios</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Configure para onde vai cada relatório (e-mails), o corpo do e-mail e o
        nome do arquivo. Ligue o envio automático mensal ou envie manualmente.
      </p>
      <EnvioConfigView ligado={dados.ligado} itens={dados.itens} />
    </div>
  );
}
