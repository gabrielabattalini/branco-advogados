import { redirect } from "next/navigation";
import { RelatorioView } from "@/components/RelatorioView";
import { getCargaEquipe } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { hojeISO } from "@/lib/hoje";

export const dynamic = "force-dynamic";

export default async function RelatorioMensalPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const { tarefas, equipe } = await getCargaEquipe();
  return <RelatorioView tarefas={tarefas} equipe={equipe} hoje={hojeISO()} />;
}
