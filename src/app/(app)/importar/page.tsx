import { redirect } from "next/navigation";
import { ImportarView } from "@/components/ImportarView";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");
  return <ImportarView />;
}
