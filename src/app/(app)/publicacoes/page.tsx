import { PublicacoesView } from "@/components/PublicacoesView";
import {
  getPublicacoes,
  getResponsaveis,
  getTriagemPublicacoes,
} from "@/lib/data";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function PublicacoesPage() {
  const [publicacoes, triagem, responsaveis, sessao] = await Promise.all([
    getPublicacoes(),
    getTriagemPublicacoes(),
    getResponsaveis(),
    getSessao(),
  ]);
  return (
    <PublicacoesView
      publicacoes={publicacoes}
      triagem={triagem}
      responsaveis={responsaveis}
      me={sessao?.iniciais}
    />
  );
}
