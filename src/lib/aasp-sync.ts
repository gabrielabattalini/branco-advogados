// Núcleo de ingestão de publicações (sem "use server"): cálculo de prazo,
// gravação na fila de triagem e a sincronização com a API da AASP. Fica fora
// das server actions para que a rotina diária (cron, sem sessão) também o use.

import {
  parseIntimacoesAASP,
  resumoTriagem,
  sugerirAcao,
  type PublicacaoParsed,
} from "@/lib/aasp";
import { buscarIntimacoesRecentes } from "@/lib/aasp-api";
import {
  somarDiasUteis,
  somarDiasCorridos,
  diaUtilAnterior,
} from "@/lib/diasUteis";
import { addDiasISO } from "@/lib/hoje";
import { getUltimosResponsaveis } from "@/lib/data";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Publicação → datas (CPC 224 + margem de 1 dia do escritório).
export function calcPrazo(
  disp: string,
  prazoDias: number | null,
  prazoTipo: "uteis" | "corridos" | null,
) {
  const publicacao = disp ? somarDiasUteis(disp, 1) : "";
  if (!publicacao) return { publicacao: "", vencimentoLegal: "", dataFatal: "" };
  if (!prazoDias) return { publicacao, vencimentoLegal: "", dataFatal: publicacao };
  const tipo = prazoTipo ?? "uteis";
  const vencimentoLegal =
    tipo === "corridos"
      ? somarDiasCorridos(publicacao, prazoDias)
      : somarDiasUteis(publicacao, prazoDias);
  const n = Math.max(1, prazoDias - 1);
  const dataFatal =
    tipo === "corridos"
      ? diaUtilAnterior(addDiasISO(publicacao, n))
      : somarDiasUteis(publicacao, n);
  return { publicacao, vencimentoLegal, dataFatal };
}

// Salva publicações (vindas do PDF ou da API da AASP) na fila de triagem.
// Casa o cliente pela base, calcula prazos (CPC 224 + margem) e deduplica
// contra o que já está salvo (chave = processo|ato|publicação).
export async function salvarPublicacoes(
  pubs: PublicacaoParsed[],
): Promise<{ total: number; novas: number; jaExistiam: number }> {
  const [clientes, ultimos] = await Promise.all([
    prisma.contato.findMany({
      where: { tipoContato: "cliente" },
      select: { nome: true },
    }),
    getUltimosResponsaveis(),
  ]);
  const nomesCli = clientes
    .map((c) => ({ nome: c.nome, up: c.nome.toUpperCase() }))
    .filter((c) => c.up.length >= 6)
    .sort((a, b) => b.up.length - a.up.length);
  const acharCliente = (txt: string): string => {
    const up = txt.toUpperCase();
    for (const c of nomesCli) if (up.includes(c.up)) return c.nome;
    return "";
  };

  const r = resumoTriagem(pubs);
  const unicas = [...r.trabalhista, ...r.civel];
  const chaveDe = (p: PublicacaoParsed) =>
    `${p.processo}|${p.atoId || p.teor.slice(0, 60)}|${p.publicacaoNum}`;

  const chaves = unicas.map(chaveDe).filter(Boolean);
  const existentes = new Set(
    (
      await prisma.publicacao.findMany({
        where: { chave: { in: chaves } },
        select: { chave: true },
      })
    ).map((x) => x.chave),
  );

  const linhas = unicas
    .filter((p) => !existentes.has(chaveDe(p)))
    .map((p) => {
      const d = calcPrazo(p.disponibilizacao, p.prazoDias, p.prazoTipo);
      return {
        numero: p.processo.slice(0, 60),
        area: p.area,
        tribunal: p.tribunal.slice(0, 20),
        tipo: p.atoTipo,
        partes: p.partes.slice(0, 2000),
        despacho: p.teor.slice(0, 4000),
        prazo: p.prazoDias
          ? `${p.prazoDias} dias ${p.prazoTipo === "corridos" ? "corridos" : "úteis"}`
          : "",
        data: p.disponibilizacao,
        orgao: p.orgao.slice(0, 300),
        poloAtivo: p.poloAtivo.slice(0, 300),
        poloPassivo: p.poloPassivo.slice(0, 300),
        resultado: p.resultado,
        dataPublicacao: d.publicacao,
        vencimentoLegal: d.vencimentoLegal,
        dataFatal: d.dataFatal,
        prazoDias: p.prazoDias ?? 0,
        prazoTipo: p.prazoTipo ?? "uteis",
        intimado: p.intimado.slice(0, 200),
        cliente: acharCliente(p.partes),
        acaoSugerida: sugerirAcao(p),
        responsaveisSugeridos: ultimos[p.processo] ?? [],
        atoId: p.atoId,
        publicacaoNum: p.publicacaoNum,
        chave: chaveDe(p),
        statusTriagem: "pendente",
      };
    });

  if (linhas.length) await prisma.publicacao.createMany({ data: linhas });
  return {
    total: r.unicas,
    novas: linhas.length,
    jaExistiam: r.unicas - linhas.length,
  };
}

// Busca na API da AASP os últimos `dias` dias e salva o que for novo. Sem
// checagem de sessão — quem chama (action ou cron) faz o controle de acesso.
export async function sincronizarAASPCore(
  dias: number,
): Promise<{ total: number; novas: number; jaExistiam: number }> {
  const intims = await buscarIntimacoesRecentes(
    Math.min(Math.max(dias, 1), 10),
  );
  if (!intims.length) return { total: 0, novas: 0, jaExistiam: 0 };
  const res = await salvarPublicacoes(parseIntimacoesAASP(intims));
  revalidatePath("/publicacoes");
  return res;
}
