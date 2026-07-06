import { redirect } from "next/navigation";
import { PerfilView } from "@/components/PerfilView";
import { getSessao } from "@/lib/sessao";
import { getStatusTelegram } from "@/lib/telegram-actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  const telegram = await getStatusTelegram();
  return (
    <PerfilView
      inicial={{ nome: s.nome, email: s.email, area: s.area, papel: s.papel }}
      telegram={telegram}
    />
  );
}
