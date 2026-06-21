import { redirect } from "next/navigation";
import { getSessao } from "@/lib/sessao";
import { AuthShell } from "@/components/AuthShell";
import { CadastroForm } from "@/components/CadastroForm";

export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  if (await getSessao()) redirect("/painel");
  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Cadastro restrito à equipe Branco Advogados."
    >
      <CadastroForm />
    </AuthShell>
  );
}
