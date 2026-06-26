import { prisma } from "@/lib/db";
import type {
  Area,
  Status,
  TarefaFull,
  Contato,
  Processo,
  Intimacao,
} from "@/lib/mock";
import { getSessao, ehGestor } from "@/lib/sessao";
import { brData } from "@/lib/audiencia";
import { hojeISO } from "@/lib/hoje";

// Filtros de visibilidade conforme o perfil (gestor vê tudo). Sem sessão,
// nada é retornado (defesa em profundidade — as páginas já exigem login).
async function escopoTarefas() {
  const s = await getSessao();
  if (!s) return { id: "__sem_sessao__" };
  return ehGestor(s.papel) ? {} : { responsaveis: { has: s.iniciais } };
}
async function escopoAgenda() {
  const s = await getSessao();
  if (!s) return { id: "__sem_sessao__" };
  return ehGestor(s.papel) ? {} : { participantes: { has: s.iniciais } };
}

// Equipe atribuível (advogados/coordenadores/sócio ativos) — alimenta os
// seletores de responsável. O perfil "administrativo" não recebe tarefas.
export type Responsavel = { iniciais: string; nome: string; area: string };
export async function getResponsaveis(): Promise<Responsavel[]> {
  return prisma.usuario.findMany({
    where: { ativo: true, papel: { not: "administrativo" } },
    orderBy: { nome: "asc" },
    select: { iniciais: true, nome: true, area: true },
  });
}

// Responsáveis da tarefa mais recente de cada processo — sugestão ao criar
// nova tarefa (processos costumam ir para os mesmos responsáveis).
export async function getUltimosResponsaveis(): Promise<
  Record<string, string[]>
> {
  const tarefas = await prisma.tarefa.findMany({
    where: { processoId: { not: null } },
    orderBy: { criadoEm: "desc" },
    select: { responsaveis: true, processo: { select: { numero: true } } },
  });
  const map: Record<string, string[]> = {};
  for (const t of tarefas) {
    const num = t.processo?.numero;
    if (num && !(num in map)) map[num] = t.responsaveis;
  }
  return map;
}

// Todos os usuários (para a Administração).
export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  area: string;
  iniciais: string;
  ativo: boolean;
};
// Itens pesquisáveis pela busca global (processos, contatos, tarefas, audiências).
export type ItemBusca = {
  tipo: string;
  titulo: string;
  sub: string;
  href: string;
};

export async function getBuscaGlobal(): Promise<ItemBusca[]> {
  const [escT, escA] = [await escopoTarefas(), await escopoAgenda()];
  const [procs, conts, tars, audis] = await Promise.all([
    prisma.processo.findMany({
      select: { id: true, numero: true, cliente: true },
      orderBy: { criadoEm: "desc" },
    }),
    // Só clientes na busca global (a base tem milhares de contatos; o resto
    // é pesquisável na aba Contatos, com busca paginada no servidor).
    prisma.contato.findMany({
      where: { tipoContato: "cliente", ativo: true },
      select: { nome: true, documento: true },
      orderBy: { nome: "asc" },
      take: 800,
    }),
    prisma.tarefa.findMany({
      where: escT,
      select: { titulo: true, processo: { select: { numero: true } } },
      orderBy: { criadoEm: "desc" },
      take: 300,
    }),
    prisma.audiencia.findMany({
      where: escA,
      select: { titulo: true, data: true, hora: true },
      orderBy: { inicioUtc: "desc" },
      take: 300,
    }),
  ]);
  const itens: ItemBusca[] = [];
  for (const p of procs)
    itens.push({
      tipo: "Processo",
      titulo: p.numero,
      sub: p.cliente,
      href: `/processos/${p.id}`,
    });
  for (const c of conts)
    itens.push({
      tipo: "Contato",
      titulo: c.nome,
      sub: c.documento,
      href: "/contatos",
    });
  for (const t of tars)
    itens.push({
      tipo: "Tarefa",
      titulo: t.titulo,
      sub: t.processo?.numero ?? "",
      href: "/tarefas",
    });
  for (const a of audis)
    itens.push({
      tipo: "Audiência",
      titulo: a.titulo,
      sub: `${brData(a.data)} ${a.hora}`,
      href: "/audiencias",
    });
  return itens;
}

export async function getUsuarios(): Promise<UsuarioAdmin[]> {
  const rows = await prisma.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    area: u.area,
    iniciais: u.iniciais,
    ativo: u.ativo,
  }));
}

export type AcessoLog = {
  id: string;
  nome: string;
  email: string;
  evento: string;
  navegador: string;
  ip: string;
  quando: string; // ISO
};

// Últimos acessos (log de auditoria) — para a aba Administração.
export async function getAcessosRecentes(): Promise<AcessoLog[]> {
  const rows = await prisma.loginLog.findMany({
    orderBy: { criadoEm: "desc" },
    take: 60,
  });
  const ids = [
    ...new Set(rows.map((r) => r.usuarioId).filter(Boolean)),
  ] as string[];
  const nomes = new Map(
    (
      await prisma.usuario.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true },
      })
    ).map((u) => [u.id, u.nome]),
  );
  return rows.map((r) => ({
    id: r.id,
    nome: r.usuarioId ? (nomes.get(r.usuarioId) ?? "—") : "—",
    email: r.email,
    evento: r.evento,
    navegador: r.navegador,
    ip: r.ip,
    quando: r.criadoEm.toISOString(),
  }));
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
    dataDisponibilizacao: r.dataDisponibilizacao || undefined,
    dataPublicacao: r.dataPublicacao || undefined,
    prazoDias: r.prazoDias,
    prazoTipo: r.prazoTipo,
    prazo: r.prazo,
    prazoUrgente: r.prazoUrgente,
    status: r.status as Status,
    responsaveis: r.responsaveis,
    solicitante: r.solicitante || undefined,
    revisor: r.revisor || undefined,
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
      dataDisponibilizacao: t.dataDisponibilizacao || undefined,
      dataPublicacao: t.dataPublicacao || undefined,
      prazoDias: t.prazoDias,
      prazoTipo: t.prazoTipo,
      prazo: t.prazo,
      prazoUrgente: t.prazoUrgente,
      status: t.status as Status,
      responsaveis: t.responsaveis,
      solicitante: t.solicitante || undefined,
      revisor: t.revisor || undefined,
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

export type ContatosPagina = {
  contatos: Contato[];
  total: number;
  pagina: number;
  porPagina: number;
};

// Busca paginada no servidor (a base tem milhares de contatos).
export async function getContatos(opts?: {
  q?: string;
  tipo?: string;
  pagina?: number;
}): Promise<ContatosPagina> {
  const porPagina = 50;
  const pagina = Math.max(1, opts?.pagina ?? 1);
  const q = (opts?.q ?? "").trim();
  const tipo = opts?.tipo ?? "todos";
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { documento: { contains: q } },
    ];
  }
  if (tipo === "pf" || tipo === "pj") where.tipo = tipo;
  else if (tipo && tipo !== "todos") where.tipoContato = tipo;

  const [rows, total] = await Promise.all([
    prisma.contato.findMany({
      where,
      orderBy: { nome: "asc" },
      take: porPagina,
      skip: (pagina - 1) * porPagina,
    }),
    prisma.contato.count({ where }),
  ]);
  return {
    contatos: rows.map((c) => ({
      id: c.id,
      tipo: c.tipo as "pf" | "pj",
      nome: c.nome,
      documento: c.documento,
      tipoContato: c.tipoContato as Contato["tipoContato"],
      profissao: c.profissao || undefined,
      telefone: c.telefone || undefined,
      email: c.email || undefined,
      ativo: c.ativo,
      processos: c.processosCount,
      iniciais: c.iniciais,
    })),
    total,
    pagina,
    porPagina,
  };
}

// Itens da agenda (eventos + audiências, com data) — a tela filtra/navega por dia.
export type ItemAgenda = {
  data: string;
  hora: string;
  tipo: string;
  titulo: string;
  detalhe: string;
  participantes: string[];
};

export async function getAgendaItens(): Promise<ItemAgenda[]> {
  const escopo = await escopoAgenda();
  const [rows, audi] = await Promise.all([
    prisma.eventoAgenda.findMany({ where: escopo, orderBy: { hora: "asc" } }),
    prisma.audiencia.findMany({
      where: { status: { not: "cancelada" }, ...escopo },
      orderBy: { hora: "asc" },
    }),
  ]);
  const eventos: ItemAgenda[] = rows.map((e) => ({
    data: e.data,
    hora: e.hora,
    tipo: e.tipo,
    titulo: e.titulo,
    detalhe: e.detalhe,
    participantes: e.participantes,
  }));
  const audiencias: ItemAgenda[] = audi.map((a) => ({
    data: a.data,
    hora: a.hora,
    tipo: "audiencia",
    titulo: a.titulo,
    detalhe: [a.modalidade === "virtual" ? "Virtual" : "", a.local, a.partes]
      .filter(Boolean)
      .join(" · "),
    participantes: a.participantes,
  }));
  return [...eventos, ...audiencias];
}

export type LembreteDTO = { id: string; offsetMin: number; enviado: boolean };
export type AudienciaDTO = {
  id: string;
  processoNumero: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  modalidade: string;
  link: string;
  local: string;
  partes: string;
  participantes: string[];
  observacoes: string;
  status: string;
  lembretes: LembreteDTO[];
};

export async function getAudiencias(): Promise<AudienciaDTO[]> {
  const rows = await prisma.audiencia.findMany({
    where: await escopoAgenda(),
    include: { processo: true, lembretes: { orderBy: { offsetMin: "desc" } } },
    orderBy: { inicioUtc: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    processoNumero: a.processo?.numero ?? "",
    titulo: a.titulo,
    data: a.data,
    hora: a.hora,
    tipo: a.tipo,
    modalidade: a.modalidade,
    link: a.link,
    local: a.local,
    partes: a.partes,
    participantes: a.participantes,
    observacoes: a.observacoes,
    status: a.status,
    lembretes: a.lembretes.map((l) => ({
      id: l.id,
      offsetMin: l.offsetMin,
      enviado: !!l.enviadoEm,
    })),
  }));
}

export type PastaDocumentos = {
  id: string;
  numero: string;
  cliente: string;
  area: Area;
  docs: { ordem: string; nome: string; data: string }[];
};

// Todos os processos (com suas pastas, mesmo vazias) — a busca/anexo precisa
// alcançar processos que ainda não têm nenhum documento.
export async function getPastasDocumentos(): Promise<PastaDocumentos[]> {
  const procs = await prisma.processo.findMany({
    include: { documentos: { orderBy: { ordem: "asc" } } },
    orderBy: { criadoEm: "asc" },
  });
  return procs.map((p) => ({
    id: p.id,
    numero: p.numero,
    cliente: p.cliente,
    area: p.area as Area,
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
    data: p.data,
    processoCadastrado: p.processoCadastrado,
  }));
}

// Todas as publicações posicionadas por dia (visão de calendário).
export type PublicacaoCal = {
  id: string;
  numero: string;
  tribunal: string;
  tipo: string;
  area: Area;
  data: string; // ISO yyyy-mm-dd
  prazo: string;
  partes: string;
  despacho: string;
  statusTriagem: string; // pendente | processada | ignorada
};

export async function getPublicacoes(): Promise<PublicacaoCal[]> {
  const rows = await prisma.publicacao.findMany({
    orderBy: { data: "asc" },
  });
  return rows.map((p) => ({
    id: p.id,
    numero: p.numero,
    tribunal: p.tribunal,
    tipo: p.tipo,
    area: p.area as Area,
    data: p.data,
    prazo: p.prazo,
    partes: p.partes,
    despacho: p.despacho,
    statusTriagem: p.statusTriagem,
  }));
}

// Publicações salvas para a tela de Triagem (esconde as ignoradas).
export type TriagemPub = {
  id: string;
  numero: string;
  area: string;
  tribunal: string;
  orgao: string;
  partes: string;
  poloAtivo: string;
  poloPassivo: string;
  atoTipo: string;
  resultado: string;
  teor: string;
  disponibilizacao: string;
  dataPublicacao: string;
  vencimentoLegal: string;
  dataFatal: string;
  prazoDias: number;
  prazoTipo: string;
  intimado: string;
  cliente: string;
  acao: string;
  responsaveis: string[];
  publicacaoNum: string;
  status: string;
};

export async function getTriagemPublicacoes(): Promise<TriagemPub[]> {
  const rows = await prisma.publicacao.findMany({
    where: { statusTriagem: { not: "ignorada" } },
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    take: 500,
  });
  return rows.map((p) => ({
    id: p.id,
    numero: p.numero,
    area: p.area,
    tribunal: p.tribunal,
    orgao: p.orgao,
    partes: p.partes,
    poloAtivo: p.poloAtivo,
    poloPassivo: p.poloPassivo,
    atoTipo: p.tipo,
    resultado: p.resultado,
    teor: p.despacho,
    disponibilizacao: p.data,
    dataPublicacao: p.dataPublicacao,
    vencimentoLegal: p.vencimentoLegal,
    dataFatal: p.dataFatal,
    prazoDias: p.prazoDias,
    prazoTipo: p.prazoTipo,
    intimado: p.intimado,
    cliente: p.cliente,
    acao: p.acaoSugerida,
    responsaveis: p.responsaveisSugeridos,
    publicacaoNum: p.publicacaoNum,
    status: p.statusTriagem,
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
      where: { ...minhasAgendas, data: hojeISO() },
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
      where: { ...minhasTarefas, data: hojeISO(), status: { not: "concluida" } },
    }),
    prisma.publicacao.count({ where: { statusTriagem: "pendente" } }),
    prisma.audiencia.count({
      where: { ...minhasAgendas, status: "agendada" },
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
