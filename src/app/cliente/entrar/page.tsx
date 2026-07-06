import { redirect } from "next/navigation";
import { ClienteLoginForm } from "@/components/cliente/ClienteLoginForm";
import { getSessaoCliente } from "@/lib/sessao-cliente";

export const dynamic = "force-dynamic";

export default async function ClienteEntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await getSessaoCliente()) redirect("/cliente");
  const { e } = await searchParams;
  return <ClienteLoginForm loginInicial={e} />;
}
