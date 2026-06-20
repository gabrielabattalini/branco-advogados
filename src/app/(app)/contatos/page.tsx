import { ContatosView } from "@/components/ContatosView";
import { getContatos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const contatos = await getContatos();
  return <ContatosView contatos={contatos} />;
}
