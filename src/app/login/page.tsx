import { redirect } from "next/navigation";
import { getSessao } from "@/lib/sessao";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessao()) redirect("/painel");
  return (
    <AuthShell titulo="Entrar" subtitulo="Acesse o sistema do escritório.">
      <LoginForm />
    </AuthShell>
  );
}
