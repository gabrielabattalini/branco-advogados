import { TarefasView } from "@/components/TarefasView";
import { getTarefas, getProcessos } from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos, sessao] = await Promise.all([
    getTarefas(),
    getProcessos(),
    getSessao(),
  ]);
  return (
    <TarefasView
      tarefas={tarefas}
      processos={processos}
      papel={sessao?.papel ?? "advogado"}
      me={sessao?.iniciais ?? ""}
    />
  );
}
