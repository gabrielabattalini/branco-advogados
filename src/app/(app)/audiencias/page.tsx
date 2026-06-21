import { redirect } from "next/navigation";
import { getAudiencias, getProcessos, getResponsaveis } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { AudienciasView } from "@/components/AudienciasView";

export const dynamic = "force-dynamic";

export default async function AudienciasPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  const [audiencias, processos, responsaveis] = await Promise.all([
    getAudiencias(),
    getProcessos(),
    getResponsaveis(),
  ]);
  return (
    <AudienciasView
      audiencias={audiencias}
      processos={processos}
      responsaveis={responsaveis}
      papel={sessao.papel}
      me={sessao.iniciais}
    />
  );
}
