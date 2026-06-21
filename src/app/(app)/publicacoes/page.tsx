import { PublicacoesView } from "@/components/PublicacoesView";
import { getIntimacoesPendentes, getPublicacoes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicacoesPage() {
  const [intimacoes, publicacoes] = await Promise.all([
    getIntimacoesPendentes(),
    getPublicacoes(),
  ]);
  return (
    <PublicacoesView intimacoes={intimacoes} publicacoes={publicacoes} />
  );
}
