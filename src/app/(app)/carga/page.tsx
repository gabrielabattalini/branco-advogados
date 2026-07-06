import { redirect } from "next/navigation";
import { CargaView } from "@/components/CargaView";
import { getCargaEquipe } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

export default async function CargaPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  const { tarefas, equipe } = await getCargaEquipe();
  return <CargaView tarefas={tarefas} equipe={equipe} />;
}
