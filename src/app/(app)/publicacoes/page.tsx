import { PublicacoesView } from "@/components/PublicacoesView";
import {
  getPublicacoes,
  getResponsaveis,
  getTriagemPublicacoes,
  getProcessos,
  getUltimosResponsaveis,
} from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function PublicacoesPage() {
  const [publicacoes, triagem, responsaveis, processos, ultimosResp, sessao] =
    await Promise.all([
      getPublicacoes(),
      getTriagemPublicacoes(),
      getResponsaveis(),
      getProcessos(),
      getUltimosResponsaveis(),
      getSessao(),
    ]);
  return (
    <PublicacoesView
      publicacoes={publicacoes}
      triagem={triagem}
      responsaveis={responsaveis}
      processos={processos}
      ultimosResp={ultimosResp}
      papel={sessao?.papel ?? "advogado"}
      me={sessao?.iniciais}
    />
  );
}
