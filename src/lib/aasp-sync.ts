// Núcleo de ingestão de publicações (sem "use server"): cálculo de prazo,
// gravação na fila de triagem e a sincronização com a API da AASP. Fica fora
// das server actions para que a rotina diária (cron, sem sessão) também o use.

import {
  parseIntimacoesAASP,
  resumoTriagem,
  sugerirAcao,
  chavePublicacao,
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
    chavePublicacao({
      processo: p.processo,
      atoId: p.atoId,
      disponibilizacao: p.disponibilizacao,
      teor: p.teor,
    });

  // Casa contra o que já está salvo recomputando a chave robusta de cada
  // registro (a chave guardada pode estar no formato antigo — daí buscar por
  // número do processo e recomputar, em vez de filtrar pela coluna `chave`).
  const numeros = [...new Set(unicas.map((p) => p.processo).filter(Boolean))];
  const existRows = numeros.length
    ? await prisma.publicacao.findMany({
        where: { numero: { in: numeros }, statusTriagem: { not: "ignorada" } },
        select: {
          id: true,
          numero: true,
          atoId: true,
          data: true,
          despacho: true,
          chave: true,
        },
      })
    : [];
  const existMap = new Map<string, (typeof existRows)[number]>();
  for (const x of existRows) {
    const k = chavePublicacao({
      processo: x.numero,
      atoId: x.atoId,
      disponibilizacao: x.data,
      teor: x.despacho,
    });
    if (!existMap.has(k)) existMap.set(k, x);
  }

  const linhaDe = (p: PublicacaoParsed) => {
    const d = calcPrazo(p.disponibilizacao, p.prazoDias, p.prazoTipo);
    return {
      numero: p.processo.slice(0, 60),
      area: p.area,
      tribunal: p.tribunal.slice(0, 20),
      tipo: p.atoTipo,
      partes: p.partes.slice(0, 2000),
      despacho: p.teor.slice(0, 6000),
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
  };

  const novas: ReturnType<typeof linhaDe>[] = [];
  const atualizar: { id: string; despacho?: string; chave?: string }[] = [];
  for (const p of unicas) {
    const k = chaveDe(p);
    const ex = existMap.get(k);
    if (!ex) {
      novas.push(linhaDe(p));
      continue;
    }
    // Já existe: atualiza no lugar — texto mais completo (refresca os cartões
    // antigos truncados) e migra a chave para o formato novo.
    const dados: { id: string; despacho?: string; chave?: string } = { id: ex.id };
    const novoTeor = p.teor.slice(0, 6000);
    if (novoTeor.length > (ex.despacho?.length ?? 0)) dados.despacho = novoTeor;
    if (ex.chave !== k) dados.chave = k;
    if (dados.despacho !== undefined || dados.chave !== undefined)
      atualizar.push(dados);
  }

  if (novas.length) await prisma.publicacao.createMany({ data: novas });
  for (const u of atualizar)
    await prisma.publicacao.update({
      where: { id: u.id },
      data: {
        ...(u.despacho !== undefined ? { despacho: u.despacho } : {}),
        ...(u.chave !== undefined ? { chave: u.chave } : {}),
      },
    });

  return {
    total: r.unicas,
    novas: novas.length,
    jaExistiam: r.unicas - novas.length,
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
  await deduplicarPublicacoes(); // limpa duplicatas (mesmo ato em vários diários)
  revalidatePath("/publicacoes");
  return res;
}

// Remove publicações PENDENTES que são duplicata de outra do mesmo ato (a AASP
// devolve a mesma publicação em mais de um diário — DJEN + diário antigo — e em
// pares autor/réu). Mantém uma por ato (preferindo a já processada e o teor
// limpo); NUNCA apaga uma publicação com tarefa criada. Idempotente.
export async function deduplicarPublicacoes(): Promise<number> {
  const rows = await prisma.publicacao.findMany({
    where: { statusTriagem: { not: "ignorada" } },
    select: {
      id: true,
      numero: true,
      atoId: true,
      data: true,
      despacho: true,
      statusTriagem: true,
      criadoEm: true,
      chave: true,
    },
  });
  const grupos = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!r.numero) continue;
    const k = chavePublicacao({
      processo: r.numero,
      atoId: r.atoId,
      disponibilizacao: r.data,
      teor: r.despacho,
    });
    const g = grupos.get(k) ?? [];
    g.push(r);
    grupos.set(k, g);
  }
  const sujo = (t: string) => (/^\s*\d{1,3}\s*-\s*D J E N/.test(t) ? 1 : 0);
  const apagar: string[] = [];
  for (const [k, g] of grupos) {
    if (g.length < 2) continue;
    // Mantida = processada (nunca apagar tarefa) > texto mais completo >
    // texto limpo > mais antiga.
    g.sort(
      (a, b) =>
        (a.statusTriagem === "processada" ? 0 : 1) -
          (b.statusTriagem === "processada" ? 0 : 1) ||
        (b.despacho?.length ?? 0) - (a.despacho?.length ?? 0) ||
        sujo(a.despacho) - sujo(b.despacho) ||
        a.criadoEm.getTime() - b.criadoEm.getTime(),
    );
    const manter = g[0];
    // Texto mais completo do grupo (mesmo que esteja num registro que será
    // apagado, copia para o mantido) + corrige a chave para o formato novo.
    const melhorTeor = g.reduce(
      (m, x) => ((x.despacho?.length ?? 0) > m.length ? x.despacho : m),
      manter.despacho ?? "",
    );
    const dados: { despacho?: string; chave?: string } = {};
    if ((manter.despacho?.length ?? 0) < melhorTeor.length)
      dados.despacho = melhorTeor;
    if (manter.chave !== k) dados.chave = k;
    if (Object.keys(dados).length)
      await prisma.publicacao.update({ where: { id: manter.id }, data: dados });
    for (const x of g)
      if (x.id !== manter.id && x.statusTriagem !== "processada")
        apagar.push(x.id);
  }
  if (apagar.length)
    await prisma.publicacao.deleteMany({ where: { id: { in: apagar } } });
  return apagar.length;
}
