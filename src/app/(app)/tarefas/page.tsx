import { TarefasView } from "@/components/TarefasView";
import {
  getTarefas,
  getProcessos,
  getResponsaveis,
  getUltimosResponsaveis,
  getAudiencias,
} from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos, responsaveis, ultimosResp, audiencias, sessao] =
    await Promise.all([
      getTarefas(),
      getProcessos(),
      getResponsaveis(),
      getUltimosResponsaveis(),
      getAudiencias(),
      getSessao(),
    ]);
  return (
    <TarefasView
      tarefas={tarefas}
      processos={processos}
      responsaveis={responsaveis}
      ultimosResp={ultimosResp}
      audiencias={audiencias}
      papel={sessao?.papel ?? "advogado"}
      me={sessao?.iniciais ?? ""}
    />
  );
}
