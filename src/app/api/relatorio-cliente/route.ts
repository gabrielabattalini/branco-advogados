import { NextResponse } from "next/server";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { getRelatorioClienteDados } from "@/lib/data";
import { gerarPdfRelatorioCliente } from "@/lib/relatorio-cliente-pdf";
import { hojeISO } from "@/lib/hoje";

export const dynamic = "force-dynamic";

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

// Mês de referência do relatório: o mês anterior ao atual (Brasília).
function mesAnoReferencia(): string {
  const hoje = hojeISO();
  let ano = Number(hoje.slice(0, 4));
  let mes = Number(hoje.slice(5, 7)) - 1;
  if (mes < 1) {
    mes = 12;
    ano -= 1;
  }
  return `${MESES[mes - 1]} DE ${ano}`;
}

function nomeArquivo(cliente: string): string {
  const limpo = cliente.replace(/[^\w\s.-]/g, "").trim().slice(0, 80) || "cliente";
  return `Relatorio ${limpo}.pdf`;
}

export async function GET(req: Request) {
  const s = await getSessao();
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  if (!ehGestor(s.papel))
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });

  const cliente = new URL(req.url).searchParams.get("cliente") || "";
  const dados = await getRelatorioClienteDados(cliente);
  if (!dados)
    return NextResponse.json({ erro: "cliente sem processos" }, { status: 404 });

  const pdf = await gerarPdfRelatorioCliente({
    cliente: dados.cliente,
    mesAno: mesAnoReferencia(),
    processos: dados.processos,
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArquivo(dados.cliente)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
