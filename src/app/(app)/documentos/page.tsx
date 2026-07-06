import { redirect } from "next/navigation";
import { DocumentosView } from "@/components/DocumentosView";
import { getPastasDocumentos } from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  const pastas = await getPastasDocumentos();
  return <DocumentosView pastas={pastas} papel={s.papel} />;
}
