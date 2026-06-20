import { TarefasView } from "@/components/TarefasView";
import { getTarefas, getProcessos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos] = await Promise.all([
    getTarefas(),
    getProcessos(),
  ]);
  return <TarefasView tarefas={tarefas} processos={processos} />;
}
