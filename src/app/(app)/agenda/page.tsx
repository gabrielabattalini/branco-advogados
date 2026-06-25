import { AgendaView } from "@/components/AgendaView";
import { getAgendaItens, getResponsaveis } from "@/lib/data";
import { getPapel } from "@/lib/sessao";
import { hojeISO } from "@/lib/hoje";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [itens, responsaveis, papel] = await Promise.all([
    getAgendaItens(),
    getResponsaveis(),
    getPapel(),
  ]);
  return (
    <AgendaView
      itens={itens}
      responsaveis={responsaveis}
      papel={papel}
      hoje={hojeISO()}
    />
  );
}
