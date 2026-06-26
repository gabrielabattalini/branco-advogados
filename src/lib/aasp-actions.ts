"use server";

import { extractText, getDocumentProxy } from "unpdf";
import { parseAASP, resumoTriagem, sugerirAcao } from "@/lib/aasp";
import { grifarAASP } from "@/lib/grifar";
import {
  somarDiasUteis,
  somarDiasCorridos,
  diaUtilAnterior,
} from "@/lib/diasUteis";
import { addDiasISO } from "@/lib/hoje";
import { getUltimosResponsaveis, getResponsaveis } from "@/lib/data";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { criarTarefa, type ActionResult } from "@/lib/actions";
import { revalidatePath } from "next/cache";

export type ResultadoImport =
  | { ok: false; erro: string }
  | { ok: true; total: number; novas: number; jaExistiam: number };

// ISO (AAAA-MM-DD) → DD/MM/AAAA. Vazio vira "".
function brL(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
// ISO (AAAA-MM-DD) → DD.MM.AAAA (para o nome do arquivo).
function brPontos(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// Publicação → datas (CPC 224 + margem de 1 dia do escritório).
function calcPrazo(
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

export async function importarAASP(
  formData: FormData,
): Promise<ResultadoImport> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Selecione o PDF de publicações da AASP." };
  if (file.size > 25 * 1024 * 1024)
    return { ok: false, erro: "Arquivo muito grande (máximo 25 MB)." };

  let pubs;
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    if (pdf.numPages > 300)
      return {
        ok: false,
        erro: "PDF com páginas demais (máx. 300). Isso não parece um recorte do DJEN.",
      };
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
  const chaveDe = (p: (typeof unicas)[number]) =>
    `${p.processo}|${p.atoId || p.teor.slice(0, 60)}|${p.publicacaoNum}`;

  // Dedup contra o que já está salvo (reimportar o mesmo PDF não duplica).
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

  // Guarda o PDF original para gerar o grifado depois sem subir de novo.
  // (lê o arquivo de novo: o buffer do parse foi "detachado" pelo pdfjs.)
  try {
    const dataDisp = unicas.find((p) => p.disponibilizacao)?.disponibilizacao ?? "";
    await prisma.arquivoAASP.create({
      data: {
        nome: file.name.slice(0, 200),
        data: dataDisp,
        bytes: Buffer.from(await file.arrayBuffer()),
      },
    });
    // mantém apenas os 8 PDFs mais recentes guardados
    const antigos = await prisma.arquivoAASP.findMany({
      orderBy: { criadoEm: "desc" },
      skip: 8,
      select: { id: true },
    });
    if (antigos.length)
      await prisma.arquivoAASP.deleteMany({
        where: { id: { in: antigos.map((a) => a.id) } },
      });
  } catch {
    // se falhar ao guardar, a importação continua válida; só não terá o atalho.
  }

  revalidatePath("/publicacoes");
  return {
    ok: true,
    total: r.unicas,
    novas: linhas.length,
    jaExistiam: r.unicas - linhas.length,
  };
}

// Cria a tarefa a partir de uma publicação e marca a publicação como processada.
export async function criarTarefaPublicacao(input: {
  publicacaoId: string;
  titulo: string;
  descricao: string;
  processoNumero: string;
  area: string;
  data: string;
  dataDisponibilizacao: string;
  dataPublicacao: string;
  prazoDias: number;
  prazoTipo: string;
  prazo: string;
  responsaveis: string[];
  solicitante?: string;
  revisor?: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  // Trava atômica (idempotência): só uma chamada "ganha" o pendente → processada.
  // Bloqueia clique duplo e recriação após reimportar.
  const claim = await prisma.publicacao.updateMany({
    where: { id: input.publicacaoId, statusTriagem: "pendente" },
    data: { statusTriagem: "processada" },
  });
  if (claim.count === 0) {
    revalidatePath("/publicacoes");
    return { ok: true }; // já processada por outra chamada
  }
  const res = await criarTarefa({ ...input, origem: "aasp" });
  if (!res.ok) {
    // reverte o claim para o usuário poder tentar de novo
    await prisma.publicacao.updateMany({
      where: { id: input.publicacaoId },
      data: { statusTriagem: "pendente" },
    });
    return res;
  }
  revalidatePath("/publicacoes");
  return res;
}

// Gera os PDFs grifados (Trabalhista e Cível) a partir do PDF original da AASP.
// Grifa NO próprio arquivo (dispositivo + partes) e anota responsável · ação ·
// prazo no canto, como o escritório faz à mão.
export type ResultadoGrifado =
  | { ok: false; erro: string }
  | { ok: true; arquivos: { nome: string; base64: string }[] };

// Núcleo: recebe os bytes do PDF original e devolve os dois grifados (base64).
async function montarGrifados(bytes: Uint8Array): Promise<ResultadoGrifado> {
  const [resp, ultimos] = await Promise.all([
    getResponsaveis(),
    getUltimosResponsaveis(),
  ]);
  const primeiroNome: Record<string, string> = Object.fromEntries(
    resp.map((r) => [r.iniciais, r.nome.split(/\s+/)[0]]),
  );
  // Revisor por área (cível = Mauro, trabalhista = Karen) — pega o primeiro
  // nome real cadastrado; se não achar, usa o rótulo padrão. ("Mauro"/"Karen"
  // não têm acento, então basta minúsculas.)
  const primeiroPorNome = (alvo: string, padrao: string) => {
    const u = resp.find((r) => r.nome.toLowerCase().includes(alvo));
    return u ? u.nome.split(/\s+/)[0] : padrao;
  };
  const revisorCivel = primeiroPorNome("mauro", "Mauro");
  const revisorTrab = primeiroPorNome("karen", "Karen");

  try {
    const out = await grifarAASP(bytes, (p) => {
      // Quem FAZ (responsável do histórico do processo) + quem REVISA (revisor
      // da área). NÃO entra a solicitante (Karen/Débora), que é quem lança.
      const quemFaz = (ultimos[p.processo] ?? []).map((i) => primeiroNome[i] ?? i);
      const revisor = p.area === "trabalhista" ? revisorTrab : revisorCivel;
      const nomes = [...new Set([...quemFaz, revisor].filter(Boolean))].join(" / ");
      const d = calcPrazo(p.disponibilizacao, p.prazoDias, p.prazoTipo);
      return {
        nomes,
        tarefa: sugerirAcao(p),
        data: d.dataFatal ? brL(d.dataFatal) : "",
      };
    });

    const dataArq = out.data ? brPontos(out.data) : "";
    const sufixo = dataArq ? ` - ${dataArq}` : "";
    const arquivos: { nome: string; base64: string }[] = [];
    if (out.trabalhista)
      arquivos.push({
        nome: `Publicações Trabalhista${sufixo}.pdf`,
        base64: Buffer.from(out.trabalhista).toString("base64"),
      });
    if (out.civel)
      arquivos.push({
        nome: `Publicações Cível${sufixo}.pdf`,
        base64: Buffer.from(out.civel).toString("base64"),
      });
    if (!arquivos.length)
      return {
        ok: false,
        erro: "Nenhuma publicação encontrada. Confirme que é o recorte do DJEN da AASP.",
      };
    return { ok: true, arquivos };
  } catch {
    return {
      ok: false,
      erro: "Não consegui grifar este PDF. Confirme que é o arquivo de publicações da AASP.",
    };
  }
}

// Grifa a partir de um PDF enviado agora (tela /grifado).
export async function gerarGrifado(
  formData: FormData,
): Promise<ResultadoGrifado> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Selecione o PDF de publicações da AASP." };
  if (file.size > 25 * 1024 * 1024)
    return { ok: false, erro: "Arquivo muito grande (máximo 25 MB)." };
  return montarGrifados(new Uint8Array(await file.arrayBuffer()));
}

// Grifa a partir do último PDF guardado no import da triagem (sem subir de novo).
export async function gerarGrifadoSalvo(): Promise<ResultadoGrifado> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const arq = await prisma.arquivoAASP.findFirst({
    orderBy: { criadoEm: "desc" },
    select: { bytes: true },
  });
  if (!arq)
    return {
      ok: false,
      erro: "Nenhum PDF guardado. Importe um PDF da AASP na Triagem primeiro.",
    };
  return montarGrifados(new Uint8Array(arq.bytes));
}

export async function excluirPublicacao(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  try {
    await prisma.publicacao.delete({ where: { id } });
    revalidatePath("/publicacoes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível excluir a publicação." };
  }
}

export async function ignorarPublicacao(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  try {
    await prisma.publicacao.update({
      where: { id },
      data: { statusTriagem: "ignorada" },
    });
    revalidatePath("/publicacoes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível ignorar a publicação." };
  }
}
