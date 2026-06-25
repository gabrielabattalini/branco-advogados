"use server";

import { extractText, getDocumentProxy } from "unpdf";
import {
  parseAASP,
  resumoTriagem,
  type PublicacaoParsed,
  type AreaPub,
} from "@/lib/aasp";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type PubComCliente = PublicacaoParsed & { cliente: string | null };

export type ResultadoTriagem =
  | { ok: false; erro: string }
  | {
      ok: true;
      total: number;
      unicas: number;
      duplicatas: number;
      grupos: { area: AreaPub; pubs: PubComCliente[] }[];
    };

export async function importarAASP(
  formData: FormData,
): Promise<ResultadoTriagem> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Selecione o PDF de publicações da AASP." };
  if (file.size > 25 * 1024 * 1024)
    return { ok: false, erro: "Arquivo muito grande (máximo 25 MB)." };

  let pubs: PublicacaoParsed[];
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    pubs = parseAASP(Array.isArray(text) ? text.join(" ") : text);
  } catch {
    return {
      ok: false,
      erro: "Não consegui ler este PDF. Confirme que é o arquivo de publicações da AASP.",
    };
  }
  if (pubs.length === 0)
    return {
      ok: false,
      erro: "Nenhuma publicação encontrada. O PDF precisa ser o recorte do DJEN exportado pela AASP.",
    };

  // Casa as partes com a lista de clientes (para apontar "nosso cliente").
  const clientes = await prisma.contato.findMany({
    where: { tipoContato: "cliente" },
    select: { nome: true },
  });
  // Ordena por nome mais longo primeiro, para preferir o match mais específico
  // (ex.: "Luiz Carlos Branco Junior" antes de "Luiz Carlos Branco").
  const nomesCli = clientes
    .map((c) => ({ nome: c.nome, up: c.nome.toUpperCase() }))
    .filter((c) => c.up.length >= 6)
    .sort((a, b) => b.up.length - a.up.length);
  const acharCliente = (txt: string): string | null => {
    const up = txt.toUpperCase();
    for (const c of nomesCli) if (up.includes(c.up)) return c.nome;
    return null;
  };
  // Casa só contra a lista de PARTES (o advogado "Luiz Carlos Branco" aparece
  // em toda publicação e geraria falso-positivo).
  const comCliente = (p: PublicacaoParsed): PubComCliente => ({
    ...p,
    cliente: acharCliente(p.partes),
  });

  const r = resumoTriagem(pubs);
  const grupos: { area: AreaPub; pubs: PubComCliente[] }[] = [];
  if (r.trabalhista.length)
    grupos.push({ area: "trabalhista", pubs: r.trabalhista.map(comCliente) });
  if (r.civel.length)
    grupos.push({ area: "civel", pubs: r.civel.map(comCliente) });
  if (r.federal.length)
    grupos.push({ area: "federal", pubs: r.federal.map(comCliente) });

  return {
    ok: true,
    total: r.total,
    unicas: r.unicas,
    duplicatas: r.duplicatas,
    grupos,
  };
}
