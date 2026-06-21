import { DocumentosView } from "@/components/DocumentosView";
import { getPastasDocumentos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const pastas = await getPastasDocumentos();
  return <DocumentosView pastas={pastas} />;
}
