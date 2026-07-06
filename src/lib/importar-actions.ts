"use server";

import { prisma } from "@/lib/db";
import { getSessao, ehGestor } from "@/lib/sessao";
import { classificarArea } from "@/lib/mock";
import {
  docxParaTexto,
  parseRelatorioDocx,
  parsePlanilhaClientes,
} from "@/lib/importar";

export type ImportResult =
  | { ok: false; erro: string }
  | { ok: true; msg: string };

async function exigirGestor() {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return null;
  return s;
}

// Apaga TODO o conteúdo de demonstração (processos, tarefas, contatos, etc.),
// mantendo usuários e acessos. Usar antes de importar os dados reais.
export async function limparDadosExemplo(): Promise<ImportResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  try {
    await prisma.tarefaHistorico.deleteMany({});
    await prisma.processoAndamento.deleteMany({});
    await prisma.lembrete.deleteMany({});
    await prisma.documento.deleteMany({});
    await prisma.tarefa.deleteMany({});
    await prisma.publicacao.deleteMany({});
    await prisma.audiencia.deleteMany({});
    await prisma.eventoAgenda.deleteMany({});
    await prisma.arquivoAASP.deleteMany({});
    await prisma.processo.deleteMany({});
    await prisma.contato.deleteMany({});
    return { ok: true, msg: "Dados de exemplo removidos." };
  } catch {
    return { ok: false, erro: "Não foi possível limpar os dados." };
  }
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
    }
    return {
      ok: true,
      msg: `${clientes.length} cliente(s) na planilha · ${criados} novo(s).`,
    };
  } catch {
    return { ok: false, erro: "Não foi possível ler a planilha." };
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
