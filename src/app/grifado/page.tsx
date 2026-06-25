import { redirect } from "next/navigation";
import { getSessao } from "@/lib/sessao";
import { getTriagemPublicacoes, getResponsaveis } from "@/lib/data";
import { GrifadoView } from "@/components/GrifadoView";

export const dynamic = "force-dynamic";

export default async function GrifadoPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  const [pubs, responsaveis] = await Promise.all([
    getTriagemPublicacoes(),
    getResponsaveis(),
  ]);
  const nomes: Record<string, string> = Object.fromEntries(
    responsaveis.map((r) => [r.iniciais, r.nome.split(/\s+/)[0]]),
  );
  return <GrifadoView pubs={pubs} nomes={nomes} associado={s.nome} />;
}
