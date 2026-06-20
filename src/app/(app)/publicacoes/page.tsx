import { TriagemView } from "@/components/TriagemView";
import { getIntimacoesPendentes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicacoesPage() {
  const intimacoes = await getIntimacoesPendentes();
  return <TriagemView intimacoes={intimacoes} />;
}
