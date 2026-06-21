import { prisma } from "@/lib/db";
import type {
  Area,
  Status,
  TarefaFull,
  Contato,
  Processo,
  EventoAgenda,
  Intimacao,
} from "@/lib/mock";
import { HOJE_ISO, usuarioAtual } from "@/lib/mock";
import { getPapel } from "@/lib/sessao";

// Filtros de visibilidade conforme o perfil (coordenador vê tudo).
async function escopoTarefas() {
  const papel = await getPapel();
  return papel === "coordenador"
    ? {}
    : { responsaveis: { has: usuarioAtual.iniciais } };
}
async function escopoAgenda() {
  const papel = await getPapel();
  return papel === "coordenador"
    ? {}
    : { participantes: { has: usuarioAtual.iniciais } };
}

export async function getTarefas(): Promise<TarefaFull[]> {
  const rows = await prisma.tarefa.findMany({
    where: await escopoTarefas(),
    orderBy: { criadoEm: "desc" },
    include: { processo: true },
  });
  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao ?? undefined,
    processo: r.processo?.numero ?? "",
    area: r.area as Area,
    data: r.data,
    prazo: r.prazo,
    prazoUrgente: r.prazoUrgente,
    status: r.status as Status,
    responsaveis: r.responsaveis,
  }));
}

export async function getProcessos(): Promise<Processo[]> {
  const rows = await prisma.processo.findMany({ orderBy: { criadoEm: "desc" } });
  return rows.map(mapProcesso);
}

function mapProcesso(p: {
  id: string;
  numero: string;
  area: string;
  tribunal: string;
  status: string;
  cliente: string;
  parteContraria: string;
  responsavel: string;
  responsavelIniciais: string;
  valorCausa: string;
  distribuido: string;
  fase: string;
}): Processo {
  return {
    id: p.id,
    numero: p.numero,
    area: p.area as Area,
    tribunal: p.tribunal,
    status: p.status,
    cliente: p.cliente,
    parteContraria: p.parteContraria,
    responsavel: p.responsavel,
    responsavelIniciais: p.responsavelIniciais,
    valorCausa: p.valorCausa,
    distribuido: p.distribuido,
    fase: p.fase,
  };
}

export type FichaProcesso = {
  processo: Processo;
  tarefas: TarefaFull[];
  documentos: { ordem: string; nome: string; data: string }[];
  publicacoes: { id: string; titulo: string; origem: string; estado: string }[];
};

export async function getFichaProcesso(
  id: string,
): Promise<FichaProcesso | null> {
  const p = await prisma.processo.findUnique({
    where: { id },
    include: {
      tarefas: { orderBy: { criadoEm: "desc" } },
      documentos: { orderBy: { ordem: "asc" } },
      publicacoes: {
        where: { statusTriagem: { not: "pendente" } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!p) return null;
  return {
    processo: mapProcesso(p),
    tarefas: p.tarefas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao ?? undefined,
      processo: p.numero,
      area: t.area as Area,
      data: t.data,
      prazo: t.prazo,
      prazoUrgente: t.prazoUrgente,
      status: t.status as Status,
      responsaveis: t.responsaveis,
    })),
    documentos: p.documentos.map((d) => ({
      ordem: String(d.ordem).padStart(2, "0"),
      nome: d.nome,
      data: d.data,
    })),
    publicacoes: p.publicacoes.map((pub) => ({
      id: pub.id,
      titulo: pub.despacho || pub.tipo,
      origem: `${pub.tribunal} · ${pub.tipo}`,
      estado: pub.statusTriagem,
    })),
  };
}

export async function getContatos(): Promise<Contato[]> {
  const [rows, procs] = await Promise.all([
    prisma.contato.findMany({ orderBy: { nome: "asc" } }),
    prisma.processo.findMany({ select: { cliente: true, parteContraria: true } }),
  ]);
  const contar = (nome: string) =>
    procs.filter((p) => p.cliente === nome || p.parteContraria === nome).length;
  return rows.map((c) => ({
    id: c.id,
    tipo: c.tipo as "pf" | "pj",
    nome: c.nome,
    documento: c.documento,
    tipoContato: c.tipoContato as Contato["tipoContato"],
    processos: contar(c.nome),
    iniciais: c.iniciais,
  }));
}

export async function getEventosAgenda(): Promise<EventoAgenda[]> {
  const rows = await prisma.eventoAgenda.findMany({
    where: await escopoAgenda(),
    orderBy: { hora: "asc" },
  });
  return rows.map((e) => ({
    hora: e.hora,
    tipo: e.tipo as EventoAgenda["tipo"],
    titulo: e.titulo,
    detalhe: e.detalhe,
    participantes: e.participantes,
  }));
}

export type PastaDocumentos = {
  numero: string;
  cliente: string;
  docs: { ordem: string; nome: string; data: string }[];
};

export async function getPastasDocumentos(): Promise<PastaDocumentos[]> {
  const procs = await prisma.processo.findMany({
    where: { documentos: { some: {} } },
    include: { documentos: { orderBy: { ordem: "asc" } } },
    orderBy: { criadoEm: "asc" },
  });
  return procs.map((p) => ({
    numero: p.numero,
    cliente: p.cliente,
    docs: p.documentos.map((d) => ({
      ordem: String(d.ordem).padStart(2, "0"),
      nome: d.nome,
      data: d.data,
    })),
  }));
}

export async function getIntimacoesPendentes(): Promise<Intimacao[]> {
  const rows = await prisma.publicacao.findMany({
    where: { statusTriagem: "pendente" },
    orderBy: { criadoEm: "asc" },
  });
  return rows.map((p) => ({
    id: p.id,
    tribunal: p.tribunal,
    tipo: p.tipo,
    numero: p.numero,
    area: p.area as Area,
    partes: p.partes,
    despacho: p.despacho,
    prazo: p.prazo,
    processoCadastrado: p.processoCadastrado,
  }));
}

export type PainelData = {
  kpis: { label: string; valor: number; danger?: boolean }[];
  tarefas: {
    id: string;
    titulo: string;
    processo: string;
    area: Area;
    prazo: string;
    prazoUrgente: boolean;
  }[];
  eventos: { hora: string; titulo: string; detalhe: string }[];
  publicacoes: { titulo: string; numero: string; area: Area }[];
};

export async function getPainel(): Promise<PainelData> {
  const minhasTarefas = await escopoTarefas();
  const minhasAgendas = await escopoAgenda();

  const [
    tarefas,
    eventos,
    pubs,
    tarefasAbertas,
    prazosHoje,
    publicacoesPendentes,
    audiencias,
  ] = await Promise.all([
    prisma.tarefa.findMany({
      where: { ...minhasTarefas, status: { not: "concluida" } },
      include: { processo: true },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
    prisma.eventoAgenda.findMany({
      where: minhasAgendas,
      orderBy: { hora: "asc" },
      take: 3,
    }),
    prisma.publicacao.findMany({
      where: { statusTriagem: "pendente" },
      take: 2,
    }),
    prisma.tarefa.count({
      where: { ...minhasTarefas, status: { not: "concluida" } },
    }),
    prisma.tarefa.count({
      where: { ...minhasTarefas, data: HOJE_ISO, status: { not: "concluida" } },
    }),
    prisma.publicacao.count({ where: { statusTriagem: "pendente" } }),
    prisma.eventoAgenda.count({
      where: { ...minhasAgendas, tipo: "audiencia" },
    }),
  ]);

  return {
    kpis: [
      { label: "Tarefas abertas", valor: tarefasAbertas },
      { label: "Prazos hoje", valor: prazosHoje, danger: true },
      { label: "Publicações a triar", valor: publicacoesPendentes },
      { label: "Audiências agendadas", valor: audiencias },
    ],
    tarefas: tarefas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      processo: t.processo?.numero ?? "",
      area: t.area as Area,
      prazo: t.prazo,
      prazoUrgente: t.prazoUrgente,
    })),
    eventos: eventos.map((e) => ({
      hora: e.hora,
      titulo: e.titulo,
      detalhe: e.detalhe,
    })),
    publicacoes: pubs.map((p) => ({
      titulo: `${p.tribunal} · ${p.tipo}`,
      numero: p.numero,
      area: p.area as Area,
    })),
  };
}
