import { TarefasView } from "@/components/TarefasView";
import { getTarefas, getProcessos } from "@/lib/data";
import { getPapel } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos, papel] = await Promise.all([
    getTarefas(),
    getProcessos(),
    getPapel(),
  ]);
  return (
    <TarefasView tarefas={tarefas} processos={processos} papel={papel} />
  );
}
