import { PrismaClient } from "@prisma/client";
import {
  responsaveis,
  contatos,
  processos,
  tarefasFull,
  documentosPorProcesso,
  publicacoesPorProcesso,
  eventosAgenda,
  intimacoes,
} from "../src/lib/mock";

const prisma = new PrismaClient();

const papeis: Record<string, string> = {
  GB: "socio",
  AB: "advogado",
  CS: "advogado",
  PL: "estagiario",
};

async function main() {
  // Limpa (ordem respeita as FKs)
  await prisma.tarefa.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.publicacao.deleteMany();
  await prisma.processo.deleteMany();
  await prisma.contato.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.eventoAgenda.deleteMany();

  for (const r of responsaveis) {
    await prisma.usuario.create({
      data: {
        nome: r.nome,
        iniciais: r.iniciais,
        email: `${r.iniciais.toLowerCase()}@brancoadvogados.com`,
        papel: papeis[r.iniciais] ?? "advogado",
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
        responsavel: p.responsavel,
        responsavelIniciais: p.responsavelIniciais,
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
        responsavel: t.responsavel,
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
          area: "trabalhista",
          tribunal: (pub.origem.split("·")[0] ?? "").trim() || "—",
          tipo: "Publicação",
          partes: "",
          despacho: pub.titulo,
          prazo: "",
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
        hora: e.hora,
        tipo: e.tipo,
        titulo: e.titulo,
        detalhe: e.detalhe,
        ini: e.ini,
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
