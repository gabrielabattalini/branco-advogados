import { redirect } from "next/navigation";
import { getSessao } from "@/lib/sessao";
import { GrifadoView } from "@/components/GrifadoView";

export const dynamic = "force-dynamic";

export default async function GrifadoPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  return <GrifadoView />;
}
