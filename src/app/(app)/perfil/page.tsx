import { PerfilView } from "@/components/PerfilView";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const s = await getSessao();
  return (
    <PerfilView
      inicial={{ nome: s.nome, email: s.email, area: s.area, papel: s.papel }}
    />
  );
}
