import { redirect } from "next/navigation";
import { PortalClientesView } from "@/components/PortalClientesView";
import { getAcessosClientes, getNomesClientesComProcesso } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

export default async function PortalClientesPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const [acessos, nomes] = await Promise.all([
    getAcessosClientes(),
    getNomesClientesComProcesso(),
  ]);
  return <PortalClientesView acessos={acessos} nomesClientes={nomes} />;
}
