import { redirect } from "next/navigation";
import { getUsuarios } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { AdminView } from "@/components/AdminView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!ehGestor(sessao.papel)) redirect("/painel");
  const usuarios = await getUsuarios();
  return (
    <AdminView usuarios={usuarios} me={{ id: sessao.id, papel: sessao.papel }} />
  );
}
