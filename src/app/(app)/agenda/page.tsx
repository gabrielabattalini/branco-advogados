import { AgendaView } from "@/components/AgendaView";
import { getEventosAgenda } from "@/lib/data";
import { getPapel } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [eventos, papel] = await Promise.all([
    getEventosAgenda(),
    getPapel(),
  ]);
  return <AgendaView eventos={eventos} papel={papel} />;
}
