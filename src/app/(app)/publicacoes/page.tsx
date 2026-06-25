import { PublicacoesView } from "@/components/PublicacoesView";
import { getPublicacoes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicacoesPage() {
  const publicacoes = await getPublicacoes();
  return <PublicacoesView publicacoes={publicacoes} />;
}
