import { TarefasView } from "@/components/TarefasView";
import {
  getTarefas,
  getProcessos,
  getResponsaveis,
  getUltimosResponsaveis,
  getAudiencias,
  getEventosAgenda,
} from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tarefas, processos, responsaveis, ultimosResp, audiencias, eventos, sessao] =
    await Promise.all([
      getTarefas(),
      getProcessos(),
      getResponsaveis(),
      getUltimosResponsaveis(),
      getAudiencias(),
      getEventosAgenda(),
      getSessao(),
    ]);
  return (
    <TarefasView
      tarefas={tarefas}
      processos={processos}
      responsaveis={responsaveis}
      ultimosResp={ultimosResp}
      audiencias={audiencias}
      eventos={eventos}
      papel={sessao?.papel ?? "advogado"}
      me={sessao?.iniciais ?? ""}
    />
  );
}
