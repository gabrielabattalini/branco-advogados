import { AgendaView } from "@/components/AgendaView";
import { getEventosAgenda, getResponsaveis } from "@/lib/data";
import { getPapel } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [eventos, responsaveis, papel] = await Promise.all([
    getEventosAgenda(),
    getResponsaveis(),
    getPapel(),
  ]);
  return (
    <AgendaView eventos={eventos} responsaveis={responsaveis} papel={papel} />
  );
}
