import { ProcessosView } from "@/components/ProcessosView";
import { getProcessos, getResponsaveis } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  const [processos, responsaveis] = await Promise.all([
    getProcessos(),
    getResponsaveis(),
  ]);
  return <ProcessosView processos={processos} responsaveis={responsaveis} />;
}
