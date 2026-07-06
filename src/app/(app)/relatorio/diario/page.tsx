import { redirect } from "next/navigation";
import { RelatorioDiarioView } from "@/components/RelatorioDiarioView";
import { getRelatorioDiario } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { hojeISO } from "@/lib/hoje";

export const dynamic = "force-dynamic";

export default async function RelatorioDiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const hoje = hojeISO();
  const { data } = await searchParams;
  const dia = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hoje;
  const rel = await getRelatorioDiario(dia);
  return <RelatorioDiarioView rel={rel} hoje={hoje} />;
}
