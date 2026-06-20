import { Folder, FileText, Check } from "lucide-react";
import { getPastasDocumentos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const pastas = await getPastasDocumentos();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-2xl text-navy">Documentos</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Pastas criadas automaticamente por cliente e processo, numeradas por
        ordem de chegada. Cada arquivo é guardado em duas cópias: Google Drive e
        servidor.
      </p>

      <div className="flex flex-col gap-4">
        {pastas.map((pasta) => (
          <section
            key={pasta.numero}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <Folder size={18} className="text-gold" />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink">
                  {pasta.cliente}
                </div>
                <div className="font-mono text-[11px] text-faint">
                  {pasta.numero}
                </div>
              </div>
            </div>
            {pasta.docs.map((d) => (
              <div
                key={d.ordem}
                className="flex items-center gap-3 border-t border-line py-2.5"
              >
                <span className="w-6 font-mono text-[12px] text-faint">
                  {d.ordem}
                </span>
                <FileText size={18} className="text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-ink">{d.nome}</div>
                  <div className="text-[11px] text-faint">
                    Adicionado {d.data}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-ok">
                  <Check size={13} /> Drive + servidor
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
