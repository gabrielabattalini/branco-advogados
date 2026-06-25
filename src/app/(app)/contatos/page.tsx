import { ContatosView } from "@/components/ContatosView";
import { getContatos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const tipo = sp.tipo ?? "todos";
  const q = sp.q ?? "";
  const dados = await getContatos({
    q,
    tipo,
    pagina: sp.pagina ? Number(sp.pagina) : 1,
  });
  return <ContatosView dados={dados} q={q} tipo={tipo} />;
}
