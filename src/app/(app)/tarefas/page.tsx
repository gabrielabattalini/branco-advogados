import { TarefasView } from "@/components/TarefasView";
import { getTarefas, getProcessos, getResponsaveis } from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos, responsaveis, sessao] = await Promise.all([
    getTarefas(),
    getProcessos(),
    getResponsaveis(),
    getSessao(),
  ]);
  return (
    <TarefasView
      tarefas={tarefas}
      processos={processos}
      responsaveis={responsaveis}
      papel={sessao?.papel ?? "advogado"}
      me={sessao?.iniciais ?? ""}
    />
  );
}
