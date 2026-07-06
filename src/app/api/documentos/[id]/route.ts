import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

// Download autenticado de um documento. A URL do Blob nunca vai ao cliente:
// só quem tem sessão válida passa por aqui, e o arquivo é transmitido pelo
// servidor. `?dl=1` força o download (attachment) em vez de abrir no navegador.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSessao();
  if (!s) return NextResponse.redirect(new URL("/login", req.url));

  const { id } = await params;
  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc || !doc.blobUrl)
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });

  const upstream = await fetch(doc.blobUrl);
  if (!upstream.ok || !upstream.body)
    return NextResponse.json({ erro: "indisponível" }, { status: 502 });

  const url = new URL(req.url);
  const forcar = url.searchParams.get("dl") === "1";
  const nomeArquivo = doc.nome.replace(/["\\\r\n]/g, "_");
  const headers = new Headers();
  headers.set("Content-Type", doc.mime || "application/octet-stream");
  if (doc.tamanho) headers.set("Content-Length", String(doc.tamanho));
  headers.set(
    "Content-Disposition",
    `${forcar ? "attachment" : "inline"}; filename="${nomeArquivo}"`,
  );
  headers.set("Cache-Control", "private, no-store");
  return new Response(upstream.body, { headers });
}
