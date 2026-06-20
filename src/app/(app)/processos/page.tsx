import { ProcessosView } from "@/components/ProcessosView";
import { getProcessos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  const processos = await getProcessos();
  return <ProcessosView processos={processos} />;
}
