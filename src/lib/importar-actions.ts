"use server";

import { prisma } from "@/lib/db";
import { getSessao, ehGestor } from "@/lib/sessao";
import { classificarArea } from "@/lib/mock";
import {
  docxParaTexto,
  parseRelatorioDocx,
  parsePlanilhaClientes,
  parsePlanilhaContatos,
} from "@/lib/importar";

export type ImportResult =
  | { ok: false; erro: string }
  | { ok: true; msg: string };

async function exigirGestor() {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return null;
  return s;
}

// Iniciais a partir do nome (2 primeiras palavras relevantes).
function iniciaisDe(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1 || /[A-Za-zÀ-ú]/.test(p));
  const letras = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letras.toUpperCase() || "?";
}

// PF | PJ (da planilha) → pf | pj (do Contato). Sem info clara → pj.
function tipoContatoDe(tipoPlanilha: string): "pf" | "pj" {
  return /pf|f[ií]sic/i.test(tipoPlanilha) ? "pf" : "pj";
}

// Importa a planilha de clientes (nome, e-mails, corpo, arquivo, PF/PJ).
export async function importarPlanilhaClientes(
  formData: FormData,
): Promise<ImportResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Envie a planilha (.xlsx/.xlsm)." };
  try {
    const clientes = await parsePlanilhaClientes(await file.arrayBuffer());
    if (clientes.length === 0)
      return { ok: false, erro: "Nenhum cliente encontrado na planilha." };
    let criados = 0;
    let contatosNovos = 0;
    for (const c of clientes) {
      const existe = await prisma.clienteRelatorio.findFirst({
        where: { nome: c.nome },
      });
      if (existe) {
        await prisma.clienteRelatorio.update({
          where: { id: existe.id },
          data: {
            emails: c.emails,
            corpoEmail: c.corpoEmail,
            nomeArquivo: c.nomeArquivo,
            tipo: c.tipo,
          },
        });
      } else {
        await prisma.clienteRelatorio.create({ data: c });
        criados++;
      }

      // Também cadastra como Contato (tipo cliente) para aparecer na aba Contatos.
      const email = c.emails.split(/[;,]/)[0]?.trim() ?? "";
      const jaContato = await prisma.contato.findFirst({
        where: { nome: c.nome, tipoContato: "cliente" },
      });
      if (jaContato) {
        await prisma.contato.update({
          where: { id: jaContato.id },
          data: {
            tipo: tipoContatoDe(c.tipo),
            email: email || jaContato.email,
          },
        });
      } else {
        await prisma.contato.create({
          data: {
            tipo: tipoContatoDe(c.tipo),
            nome: c.nome,
            documento: "",
            tipoContato: "cliente",
            email,
            iniciais: iniciaisDe(c.nome),
          },
        });
        contatosNovos++;
      }
    }
    return {
      ok: true,
      msg: `${clientes.length} cliente(s) na planilha · ${criados} novo(s) no relatório · ${contatosNovos} novo(s) em Contatos.`,
    };
  } catch {
    return { ok: false, erro: "Não foi possível ler a planilha." };
  }
}

// Importa a planilha de contatos (export do Legal One): cria os Contatos que
// ainda não existem, sem duplicar. Trabalha em lote por causa do volume (~11 mil).
export async function importarContatos(
  formData: FormData,
): Promise<ImportResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Envie a planilha de contatos (.xlsx)." };
  try {
    const contatos = await parsePlanilhaContatos(await file.arrayBuffer());
    if (contatos.length === 0)
      return { ok: false, erro: "Nenhum contato encontrado na planilha." };

    // Chave de deduplicação: nome + documento (ambos normalizados).
    const chave = (nome: string, doc: string) =>
      `${nome.trim().toLowerCase()}|${doc.replace(/\D/g, "")}`;

    // Já existentes no banco.
    const existentes = await prisma.contato.findMany({
      select: { nome: true, documento: true },
    });
    const vistos = new Set(existentes.map((c) => chave(c.nome, c.documento)));

    // Novos (deduplicando também dentro do próprio arquivo).
    const novos: {
      tipo: string;
      nome: string;
      documento: string;
      tipoContato: string;
      profissao: string;
      telefone: string;
      email: string;
      classificacao: string;
      grupos: string;
      iniciais: string;
      ativo: boolean;
    }[] = [];
    for (const c of contatos) {
      const k = chave(c.nome, c.documento);
      if (vistos.has(k)) continue;
      vistos.add(k);
      novos.push({
        tipo: c.tipo,
        nome: c.nome,
        documento: c.documento,
        tipoContato: c.tipoContato,
        profissao: c.profissao,
        telefone: c.telefone,
        email: c.email,
        classificacao: c.classificacao,
        grupos: c.grupos,
        iniciais: iniciaisDe(c.nome),
        ativo: c.ativo,
      });
    }

    // Insere em lotes.
    let criados = 0;
    for (let i = 0; i < novos.length; i += 1000) {
      const lote = novos.slice(i, i + 1000);
      const r = await prisma.contato.createMany({ data: lote });
      criados += r.count;
    }
    return {
      ok: true,
      msg: `${contatos.length} linha(s) na planilha · ${criados} contato(s) novo(s) · ${contatos.length - criados} já existiam.`,
    };
  } catch {
    return { ok: false, erro: "Não foi possível importar os contatos." };
  }
}

// Importa relatórios .docx: cria os processos (campos fixos) e a situação atual.
export async function importarRelatoriosDocx(
  formData: FormData,
): Promise<ImportResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const files = formData.getAll("arquivos").filter((f): f is File => f instanceof File);
  if (files.length === 0)
    return { ok: false, erro: "Envie um ou mais relatórios (.docx)." };
  try {
    let processos = 0;
    let clientes = 0;
    for (const file of files) {
      const texto = await docxParaTexto(await file.arrayBuffer());
      const rel = parseRelatorioDocx(texto);
      if (!rel.cliente || rel.processos.length === 0) continue;
      clientes++;
      for (const p of rel.processos) {
        const numero = p.numero;
        const area = classificarArea(numero);
        const dados = {
          area,
          tribunal: p.juizo || "—",
          status: "Em andamento",
          cliente: rel.cliente,
          parteContraria: p.parteContraria || "—",
          responsavel: "",
          responsavelIniciais: "",
          valorCausa: p.valorCausa || "",
          distribuido: "",
          fase: "",
          parteContrariaTipo: p.parteContrariaTipo,
          juizo: p.juizo,
          sinteseDoPedido: p.sinteseDoPedido,
        };
        const proc = await prisma.processo.upsert({
          where: { numero },
          update: dados,
          create: { numero, ...dados },
        });
        // Situação atual como um lançamento (só se veio texto e ainda não há um igual).
        if (p.status.trim()) {
          const jaTem = await prisma.processoAndamento.findFirst({
            where: { processoId: proc.id, texto: p.status.trim() },
          });
          if (!jaTem) {
            await prisma.processoAndamento.create({
              data: {
                processoId: proc.id,
                texto: p.status.trim().slice(0, 2000),
                autor: s.iniciais,
              },
            });
          }
        }
        processos++;
      }
    }
    return {
      ok: true,
      msg: `${clientes} relatório(s) · ${processos} processo(s) importado(s).`,
    };
  } catch {
    return { ok: false, erro: "Não foi possível importar os relatórios." };
  }
}
