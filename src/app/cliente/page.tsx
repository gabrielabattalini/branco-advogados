import { redirect } from "next/navigation";
import { ClientePortalView } from "@/components/cliente/ClientePortalView";
import { getSessaoCliente } from "@/lib/sessao-cliente";
import { getProcessosDoCliente } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientePortalPage() {
  const s = await getSessaoCliente();
  if (!s) redirect("/cliente/entrar");
  const processos = await getProcessosDoCliente(s.nomeCliente);
  return (
    <ClientePortalView nomeCliente={s.nomeCliente} processos={processos} />
  );
}
