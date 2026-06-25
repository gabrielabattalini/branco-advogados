import { PrismaClient } from "@prisma/client";
import {
  equipeInicial,
  REMAP_DEMO,
  contatos,
  processos,
  tarefasFull,
  documentosPorProcesso,
  publicacoesPorProcesso,
  eventosAgenda,
  audienciasSeed,
  intimacoes,
  classificarArea,
} from "../src/lib/mock";
import { hashSenha } from "../src/lib/seguranca";
import { instanteBRT } from "../src/lib/audiencia";
import { hojeISO } from "../src/lib/hoje";

const prisma = new PrismaClient();

// Senha inicial das contas semeadas (o usuário deve trocar no Perfil).
const SENHA_INICIAL = "Branco@2026";

// Remapeia as iniciais dos dados de demonstração para a equipe real.
const equipeByIni: Record<string, { nome: string; iniciais: string }> =
  Object.fromEntries(equipeInicial.map((p) => [p.iniciais, p]));
const mapIni = (i: string) => REMAP_DEMO[i] ?? i;
const nomeDe = (ini: string) => equipeByIni[mapIni(ini)]?.nome ?? "—";

async function main() {
  // Limpa (ordem respeita as FKs)
  await prisma.tarefa.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.publicacao.deleteMany();
  await prisma.lembrete.deleteMany();
  await prisma.audiencia.deleteMany();
  await prisma.processo.deleteMany();
  await prisma.contato.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.eventoAgenda.deleteMany();

  for (const p of equipeInicial) {
    await prisma.usuario.create({
      data: {
        nome: p.nome,
        iniciais: p.iniciais,
        email: p.email,
        senhaHash: hashSenha(SENHA_INICIAL),
        area: p.area,
        papel: p.papel,
      },
    });
  }

  for (const c of contatos) {
    await prisma.contato.create({
      data: {
        tipo: c.tipo,
        nome: c.nome,
        documento: c.documento,
        tipoContato: c.tipoContato,
        iniciais: c.iniciais,
        processosCount: c.processos,
      },
    });
  }

  const procByNumero: Record<string, string> = {};
  for (const p of processos) {
    const created = await prisma.processo.create({
      data: {
        numero: p.numero,
        area: p.area,
        tribunal: p.tribunal,
        status: p.status,
        cliente: p.cliente,
        parteContraria: p.parteContraria,
        responsavel: nomeDe(p.responsavelIniciais),
        responsavelIniciais: mapIni(p.responsavelIniciais),
        valorCausa: p.valorCausa,
        distribuido: p.distribuido,
        fase: p.fase,
      },
    });
    procByNumero[p.numero] = created.id;
  }

  for (const t of tarefasFull) {
    await prisma.tarefa.create({
      data: {
        titulo: t.titulo,
        descricao: t.descricao ?? null,
        processoId: procByNumero[t.processo] ?? null,
        area: t.area,
        prazo: t.prazo,
        data: t.data,
        prazoUrgente: !!t.prazoUrgente,
        status: t.status,
        responsaveis: t.responsaveis.map(mapIni),
        origem: "manual",
      },
    });
  }

  for (const [numero, docs] of Object.entries(documentosPorProcesso)) {
    const pid = procByNumero[numero];
    if (!pid) continue;
    for (const d of docs) {
      await prisma.documento.create({
        data: {
          processoId: pid,
          ordem: parseInt(d.ordem, 10),
          nome: d.nome,
          data: d.data,
        },
      });
    }
  }

  // Publicações: fila da AASP (pendentes)
  for (const i of intimacoes) {
    await prisma.publicacao.create({
      data: {
        processoId: procByNumero[i.numero] ?? null,
        numero: i.numero,
        area: i.area,
        tribunal: i.tribunal,
        tipo: i.tipo,
        partes: i.partes,
        despacho: i.despacho,
        prazo: i.prazo,
        data: i.data,
        processoCadastrado: i.processoCadastrado,
        statusTriagem: "pendente",
      },
    });
  }

  // Publicações históricas já triadas (aparecem na ficha do processo)
  for (const [numero, pubs] of Object.entries(publicacoesPorProcesso)) {
    const pid = procByNumero[numero];
    if (!pid) continue;
    for (const pub of pubs) {
      await prisma.publicacao.create({
        data: {
          processoId: pid,
          numero,
          area: classificarArea(numero),
          tribunal: (pub.origem.split("·")[0] ?? "").trim() || "—",
          tipo: "Publicação",
          partes: "",
          despacho: pub.titulo,
          prazo: "",
          data: pub.data,
          processoCadastrado: true,
          statusTriagem:
            pub.estado === "gerou_tarefa" ? "processada" : "ignorada",
        },
      });
    }
  }

  for (const e of eventosAgenda) {
    await prisma.eventoAgenda.create({
      data: {
        data: hojeISO(),
        hora: e.hora,
        tipo: e.tipo,
        titulo: e.titulo,
        detalhe: e.detalhe,
        participantes: e.participantes.map(mapIni),
      },
    });
  }

  for (const a of audienciasSeed) {
    await prisma.audiencia.create({
      data: {
        processoId: procByNumero[a.processoNumero] ?? null,
        titulo: a.titulo,
        data: a.data,
        hora: a.hora,
        inicioUtc: instanteBRT(a.data, a.hora),
        tipo: a.tipo,
        modalidade: a.modalidade,
        link: a.link,
        local: a.local,
        partes: a.partes,
        participantes: a.participantes,
        observacoes: a.observacoes,
        status: a.status,
        lembretes: { create: a.lembretes.map((offsetMin) => ({ offsetMin })) },
      },
    });
  }
}

main()
  .then(() => console.log("Seed concluído com sucesso."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
