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
  const [procs, conts, tars, audis, docs] = await Promise.all([
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
    prisma.documento.findMany({
      select: { nome: true, processo: { select: { id: true, numero: true } } },
      orderBy: { criadoEm: "desc" },
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
  for (const d of docs)
    itens.push({
      tipo: "Documento",
      titulo: d.nome,
      sub: d.processo?.numero ?? "",
      href: d.processo ? `/processos/${d.processo.id}` : "/documentos",
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

// Carga de trabalho da equipe (dashboard de balanceamento). Só gestores —
// busca TODAS as tarefas (sem o escopo por responsável) + a equipe atribuível.
export type CargaTarefa = {
  id: string;
  titulo: string;
  area: Area;
  status: Status;
  responsaveis: string[];
  prazoUrgente: boolean;
  data: string;
  solicitante: string;
  revisor: string;
  origem: string;
  criadoEm: string; // ISO
  concluidaEm: string; // ISO ou "" (ainda não concluída / sem registro)
};
export type MembroEquipe = {
  iniciais: string;
  nome: string;
  area: string;
  papel: string;
};
export async function getCargaEquipe(): Promise<{
  tarefas: CargaTarefa[];
  equipe: MembroEquipe[];
}> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return { tarefas: [], equipe: [] };
  const [rows, users] = await Promise.all([
    prisma.tarefa.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.usuario.findMany({
      where: { ativo: true, papel: { in: ["socio", "coordenador", "advogado"] } },
      orderBy: { nome: "asc" },
      select: { iniciais: true, nome: true, area: true, papel: true },
    }),
  ]);
  return {
    tarefas: rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      area: r.area as Area,
      status: r.status as Status,
      responsaveis: r.responsaveis,
      prazoUrgente: r.prazoUrgente,
      data: r.data,
      solicitante: r.solicitante || "",
      revisor: r.revisor || "",
      origem: r.origem || "manual",
      criadoEm: r.criadoEm.toISOString(),
      concluidaEm: r.concluidaEm ? r.concluidaEm.toISOString() : "",
    })),
    equipe: users,
  };
}

// ---- Relatório diário de atividades (por pessoa) ----
export type AcaoDiaria = {
  hora: string; // HH:MM Brasília
  tipo: string; // criacao | status | responsaveis | prazo | comentario
  texto: string;
  tarefa: string;
};
export type PessoaDia = {
  iniciais: string;
  nome: string;
  acoes: AcaoDiaria[];
  criadas: number;
  concluidas: number;
  revisao: number;
  comentarios: number;
};
export type RelatorioDiario = {
  data: string; // yyyy-mm-dd
  pessoas: PessoaDia[];
  total: number;
};

// Todas as ações registradas na linha do tempo das tarefas em um dia (Brasília),
// agrupadas por pessoa. Base do relatório diário enviado ao sócio. Gestor-only.
export async function getRelatorioDiario(
  dataISO: string,
): Promise<RelatorioDiario> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return { data: dataISO, pessoas: [], total: 0 };
  return montarRelatorioDiario(dataISO);
}

// Versão sem checagem de sessão — usada pelo cron (protegido por CRON_SECRET).
export async function montarRelatorioDiario(
  dataISO: string,
): Promise<RelatorioDiario> {
  const inicio = new Date(`${dataISO}T03:00:00.000Z`); // 00:00 BRT
  const fim = new Date(inicio.getTime() + 24 * 3600 * 1000);
  const hist = await prisma.tarefaHistorico.findMany({
    where: { criadoEm: { gte: inicio, lt: fim } },
    orderBy: { criadoEm: "asc" },
  });
  const tids = [...new Set(hist.map((h) => h.tarefaId))];
  const tarefas = tids.length
    ? await prisma.tarefa.findMany({
        where: { id: { in: tids } },
        select: { id: true, titulo: true },
      })
    : [];
  const titulo = new Map(tarefas.map((t) => [t.id, t.titulo]));
  const inis = [...new Set(hist.map((h) => h.autor))];
  const users = inis.length
    ? await prisma.usuario.findMany({
        where: { iniciais: { in: inis } },
        select: { iniciais: true, nome: true },
      })
    : [];
  const nome = new Map(users.map((u) => [u.iniciais, u.nome]));

  const map = new Map<string, PessoaDia>();
  for (const h of hist) {
    if (!map.has(h.autor))
      map.set(h.autor, {
        iniciais: h.autor,
        nome: nome.get(h.autor) ?? h.autor,
        acoes: [],
        criadas: 0,
        concluidas: 0,
        revisao: 0,
        comentarios: 0,
      });
    const p = map.get(h.autor)!;
    const hora = new Date(h.criadoEm.getTime() - 3 * 3600 * 1000)
      .toISOString()
      .slice(11, 16);
    let texto = h.texto;
    if (h.tipo === "comentario") texto = `Comentou: “${h.texto}”`;
    else if (h.tipo === "criacao") texto = "Criou a tarefa";
    p.acoes.push({
      hora,
      tipo: h.tipo,
      texto,
      tarefa: titulo.get(h.tarefaId) ?? "(tarefa removida)",
    });
    if (h.tipo === "criacao") p.criadas++;
    else if (h.tipo === "comentario") p.comentarios++;
    else if (h.tipo === "status") {
      if (h.texto.includes("Concluída")) p.concluidas++;
      if (h.texto.includes("Em correção")) p.revisao++;
    }
  }
  const pessoas = [...map.values()].sort(
    (a, b) => b.acoes.length - a.acoes.length || a.nome.localeCompare(b.nome),
  );
  return { data: dataISO, pessoas, total: hist.length };
}

// ---- Portal do cliente ----
export type ProcessoCliente = {
  numero: string;
  area: Area;
  tribunal: string;
  status: string;
  parteContraria: string;
  andamentos: Lancamento[]; // últimos 5 (mais recente primeiro)
};

// Processos de um cliente (pelo nome, como em Processo.cliente) com os últimos 5
// lançamentos de status. Usada pelo portal — NÃO exige sessão da equipe (a
// página do portal já valida a sessão do cliente).
export async function getProcessosDoCliente(
  nomeCliente: string,
): Promise<ProcessoCliente[]> {
  const nome = (nomeCliente || "").trim();
  if (!nome) return [];
  const procs = await prisma.processo.findMany({
    where: { cliente: nome },
    orderBy: { criadoEm: "desc" },
    include: { andamentos: { orderBy: { criadoEm: "desc" }, take: 5 } },
  });
  return procs.map((p) => ({
    numero: p.numero,
    area: p.area as Area,
    tribunal: p.tribunal,
    status: p.status,
    parteContraria: p.parteContraria,
    andamentos: p.andamentos.map((a) => ({
      texto: a.texto,
      autor: a.autor,
      quando: a.criadoEm.toISOString(),
    })),
  }));
}

export type AcessoCliente = {
  id: string;
  nomeCliente: string;
  login: string;
  ativo: boolean;
  temSenha: boolean;
  ultimoAcesso: string | null;
  acessos: number;
  processos: number;
};

// Lista as contas do portal do cliente (gestor). Conta quantos processos cada
// uma "enxerga" pelo nome, pra sinalizar vínculos vazios.
export async function getAcessosClientes(): Promise<AcessoCliente[]> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return [];
  const contas = await prisma.clienteAcesso.findMany({
    orderBy: [{ ativo: "desc" }, { nomeCliente: "asc" }],
  });
  const contagem = await prisma.processo.groupBy({
    by: ["cliente"],
    _count: { _all: true },
  });
  const porNome = new Map(contagem.map((c) => [c.cliente, c._count._all]));
  return contas.map((c) => ({
    id: c.id,
    nomeCliente: c.nomeCliente,
    login: c.login,
    ativo: c.ativo,
    temSenha: !!c.senhaHash,
    ultimoAcesso: c.ultimoAcesso ? c.ultimoAcesso.toISOString() : null,
    acessos: c.acessos,
    processos: porNome.get(c.nomeCliente) ?? 0,
  }));
}

// Nomes de clientes que têm processo (para o seletor ao criar um acesso).
export async function getNomesClientesComProcesso(): Promise<string[]> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return [];
  const rows = await prisma.processo.groupBy({
    by: ["cliente"],
    orderBy: { cliente: "asc" },
  });
  return rows.map((r) => r.cliente).filter(Boolean);
}

// ---- Relatório mensal dos clientes ----
export type ClienteRelListagem = {
  nome: string;
  processos: number;
  emails: string;
  temConfig: boolean;
  ativo: boolean; // envio automático ligado para este cliente
};
// Normaliza para comparar nomes/arquivos (sem acento, maiúsculas, espaços).
const DIACRITICOS = /[̀-ͯ]/g;
function normNome(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Casa um grupo de processos (cliente + arquivo de origem) com a linha da
// planilha de envio. Tenta pelo nome do arquivo (mais confiável) e, como
// reforço, pelo nome do cliente.
export function acharConfigRelatorio<T extends { nome: string; nomeArquivo: string }>(
  cliente: string,
  arquivo: string,
  configs: T[],
): T | undefined {
  const nc = normNome(cliente);
  const na = normNome(arquivo);
  if (na) {
    const exato = configs.find((c) => normNome(c.nomeArquivo) === na);
    if (exato) return exato;
    const prefixo = configs.find((c) => {
      const x = normNome(c.nomeArquivo);
      return (
        x && (na.startsWith(x) || x.startsWith(na)) && Math.min(x.length, na.length) >= 4
      );
    });
    if (prefixo) return prefixo;
  }
  const nomeExato = configs.find((c) => normNome(c.nome) === nc);
  if (nomeExato) return nomeExato;
  return configs.find((c) => {
    const x = normNome(c.nome);
    return x.length >= 4 && nc.includes(x);
  });
}

export async function getClientesRelatorio(): Promise<ClienteRelListagem[]> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return [];
  const grupos = await prisma.processo.groupBy({
    by: ["cliente"],
    _count: { _all: true },
    orderBy: { cliente: "asc" },
  });
  const arqRows = await prisma.processo.findMany({
    select: { cliente: true, arquivoOrigem: true },
    distinct: ["cliente"],
  });
  const arqPorCliente = new Map(arqRows.map((r) => [r.cliente, r.arquivoOrigem]));
  const configs = await prisma.clienteRelatorio.findMany();
  return grupos
    .filter((g) => g.cliente)
    .map((g) => {
      const cfg = acharConfigRelatorio(
        g.cliente,
        arqPorCliente.get(g.cliente) ?? "",
        configs,
      );
      return {
        nome: g.cliente,
        processos: g._count._all,
        emails: cfg?.emails ?? "",
        temConfig: !!cfg,
        ativo: cfg?.ativo ?? false,
      };
    });
}

export type ProcRelClienteDTO = {
  numero: string;
  parteContrariaTipo: string;
  parteContraria: string;
  juizo: string;
  sinteseDoPedido: string;
  status: string[];
  valorCausa: string;
  valorEstimado: string;
  audiencia: string;
  observacoes: string;
  categoria: string;
  infoAdicional: string;
};
// Texto da próxima audiência agendada de um processo, para o relatório.
// Ex.: "Instrução em 12/08/2026 às 14:00 (virtual)." — "" se não houver.
type AudienciaMin = {
  data: string;
  hora: string;
  tipo: string;
  modalidade: string;
  local: string;
  status: string;
};
const TIPO_AUD: Record<string, string> = {
  instrucao: "Instrução",
  conciliacao: "Conciliação",
  inicial: "Inicial",
  una: "Una",
  outra: "Audiência",
};
export function textoProximaAudiencia(audiencias: AudienciaMin[]): string {
  const hoje = new Date().toISOString().slice(0, 10);
  const futuras = audiencias
    .filter((a) => a.status === "agendada" && a.data >= hoje)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const a = futuras[0];
  if (!a) return "";
  const [y, m, d] = a.data.split("-");
  const quando = y ? `${d}/${m}/${y}` : a.data;
  const tipo = TIPO_AUD[a.tipo] ?? "Audiência";
  const modal = a.modalidade === "virtual" ? " (virtual)" : " (presencial)";
  const local = a.local ? ` — ${a.local}` : "";
  return `${tipo} em ${quando}${a.hora ? ` às ${a.hora}` : ""}${modal}${local}.`;
}

// Dados de um cliente para o relatório mensal (processos + situação atual).
// Sem checagem de sessão — chamado por rota já protegida (gestor/cron).
export async function getRelatorioClienteDados(
  nomeCliente: string,
): Promise<{ cliente: string; processos: ProcRelClienteDTO[] } | null> {
  const nome = (nomeCliente || "").trim();
  if (!nome) return null;
  const procs = await prisma.processo.findMany({
    where: { cliente: nome },
    orderBy: { criadoEm: "asc" },
    include: {
      andamentos: { orderBy: { criadoEm: "asc" }, take: 50 },
      audiencias: true,
    },
  });
  if (procs.length === 0) return null;
  return {
    cliente: nome,
    processos: procs.map((p) => ({
      numero: p.numero,
      parteContrariaTipo: p.parteContrariaTipo,
      parteContraria: p.parteContraria,
      juizo: p.juizo || p.tribunal,
      sinteseDoPedido: p.sinteseDoPedido,
      status: p.andamentos.map((a) => a.texto),
      valorCausa: p.valorCausa,
      valorEstimado: p.valorEstimado,
      audiencia: p.audienciaRel || textoProximaAudiencia(p.audiencias),
      observacoes: p.observacoesRel,
      categoria: p.categoria,
      infoAdicional: p.infoAdicional,
    })),
  };
}

// ---- Editor do relatório dos clientes (preencher/atualizar no sistema) ----
export type SituacaoEditorDTO = { id: string; texto: string; criadoEm: string };
export type ProcRelEditorDTO = {
  id: string;
  numero: string;
  parteContraria: string;
  parteContrariaTipo: string;
  juizo: string;
  tribunal: string;
  sinteseDoPedido: string;
  valorCausa: string;
  valorEstimado: string;
  audienciaRel: string;
  audienciaSugerida: string;
  observacoesRel: string;
  categoria: string;
  infoAdicional: string;
  situacoes: SituacaoEditorDTO[];
};
export type EnvioClienteDTO = {
  emails: string;
  corpoEmail: string;
  nomeArquivo: string;
  tipo: string;
  ativo: boolean;
  ultimoEnvio: string;
};
export async function getRelatorioClienteEditor(
  nomeCliente: string,
): Promise<{
  cliente: string;
  processos: ProcRelEditorDTO[];
  envio: EnvioClienteDTO;
} | null> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return null;
  const nome = (nomeCliente || "").trim();
  if (!nome) return null;
  const procs = await prisma.processo.findMany({
    where: { cliente: nome },
    orderBy: { criadoEm: "asc" },
    include: {
      andamentos: { orderBy: { criadoEm: "asc" } },
      audiencias: true,
    },
  });
  if (procs.length === 0) return null;
  const arquivo = procs[0]?.arquivoOrigem ?? "";
  const configs = await prisma.clienteRelatorio.findMany();
  const cfg = acharConfigRelatorio(nome, arquivo, configs);
  const envio: EnvioClienteDTO = {
    emails: cfg?.emails ?? "",
    corpoEmail: cfg?.corpoEmail ?? "",
    nomeArquivo: cfg?.nomeArquivo || arquivo,
    tipo: cfg?.tipo ?? "",
    ativo: cfg?.ativo ?? true,
    ultimoEnvio: cfg?.ultimoEnvio ?? "",
  };
  return {
    cliente: nome,
    envio,
    processos: procs.map((p) => ({
      id: p.id,
      numero: p.numero,
      parteContraria: p.parteContraria,
      parteContrariaTipo: p.parteContrariaTipo,
      juizo: p.juizo,
      tribunal: p.tribunal,
      sinteseDoPedido: p.sinteseDoPedido,
      valorCausa: p.valorCausa,
      valorEstimado: p.valorEstimado,
      audienciaRel: p.audienciaRel,
      audienciaSugerida: textoProximaAudiencia(p.audiencias),
      observacoesRel: p.observacoesRel,
      categoria: p.categoria,
      infoAdicional: p.infoAdicional,
      situacoes: p.andamentos.map((a) => ({
        id: a.id,
        texto: a.texto,
        criadoEm: a.criadoEm.toISOString(),
      })),
    })),
  };
}

export async function getProcessos(): Promise<Processo[]> {
  const rows = await prisma.processo.findMany({ orderBy: { criadoEm: "desc" } });
  return rows.map(mapProcesso);
}

// ---- Levantamento de sistemas/tribunais (a partir do número CNJ) ----
const UF_TJ: Record<string, string> = {
  "01": "TJAC", "02": "TJAL", "03": "TJAP", "04": "TJAM", "05": "TJBA",
  "06": "TJCE", "07": "TJDFT", "08": "TJES", "09": "TJGO", "10": "TJMA",
  "11": "TJMT", "12": "TJMS", "13": "TJMG", "14": "TJPA", "15": "TJPB",
  "16": "TJPR", "17": "TJPE", "18": "TJPI", "19": "TJRJ", "20": "TJRN",
  "21": "TJRS", "22": "TJRO", "23": "TJRR", "24": "TJSC", "25": "TJSE",
  "26": "TJSP", "27": "TJTO",
};
export function tribunalDoCNJ(numero: string): string {
  const m = (numero || "").match(/\d{7}-?\d{2}\.\d{4}\.(\d)\.(\d{2})\./);
  if (!m) return "Sem número CNJ";
  const j = m[1];
  const tr = m[2];
  if (j === "8") return UF_TJ[tr] ?? `Justiça Estadual (${tr})`;
  if (j === "5") return `TRT${Number(tr)} (Trabalho)`;
  if (j === "4") return `TRF${Number(tr)} (Federal)`;
  if (j === "6") return "Justiça Eleitoral";
  if (j === "7" || j === "9") return "Justiça Militar";
  if (j === "1") return "STF";
  if (j === "2") return "Conselhos (CNJ/CJF/CSJT)";
  if (j === "3") return "STJ";
  return `Segmento ${j}`;
}

export type LevantamentoItem = { rotulo: string; total: number };
export async function getLevantamentoSistemas(): Promise<{
  total: number;
  porTribunal: LevantamentoItem[];
  porSistema: LevantamentoItem[];
  semSistema: number;
} | null> {
  const s = await getSessao();
  if (!s) return null;
  const rows = await prisma.processo.findMany({
    select: { numero: true, sistema: true },
  });
  const trib = new Map<string, number>();
  const sist = new Map<string, number>();
  let semSistema = 0;
  for (const r of rows) {
    const t = tribunalDoCNJ(r.numero);
    trib.set(t, (trib.get(t) ?? 0) + 1);
    const sis = (r.sistema || "").trim();
    if (sis) sist.set(sis, (sist.get(sis) ?? 0) + 1);
    else semSistema++;
  }
  const ordena = (m: Map<string, number>): LevantamentoItem[] =>
    [...m.entries()]
      .map(([rotulo, total]) => ({ rotulo, total }))
      .sort((a, b) => b.total - a.total);
  return {
    total: rows.length,
    porTribunal: ordena(trib),
    porSistema: ordena(sist),
    semSistema,
  };
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
  sistema?: string;
  linkSistema?: string;
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
    sistema: p.sistema ?? "",
    linkSistema: p.linkSistema ?? "",
  };
}

export type Lancamento = { texto: string; autor: string; quando: string };
export type FichaProcesso = {
  processo: Processo;
  tarefas: TarefaFull[];
  documentos: DocItem[];
  publicacoes: { id: string; titulo: string; origem: string; estado: string }[];
  // Últimos lançamentos de status (mais recente primeiro) — o relatório mostra
  // os 5 mais recentes de cada processo.
  andamentos: Lancamento[];
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
      andamentos: { orderBy: { criadoEm: "desc" }, take: 5 },
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
      id: d.id,
      ordem: String(d.ordem).padStart(2, "0"),
      nome: d.nome,
      data: d.data,
      temArquivo: !!d.blobUrl,
      tamanho: d.tamanho,
      mime: d.mime,
    })),
    publicacoes: p.publicacoes.map((pub) => ({
      id: pub.id,
      titulo: pub.despacho || pub.tipo,
      origem: `${pub.tribunal} · ${pub.tipo}`,
      estado: pub.statusTriagem,
    })),
    andamentos: p.andamentos.map((a) => ({
      texto: a.texto,
      autor: a.autor,
      quando: a.criadoEm.toISOString(),
    })),
  };
}

export type FichaAudiencia = {
  id: string;
  processoNumero: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  modalidade: string;
  local: string;
  status: string;
};
export type FichaCliente = {
  nome: string;
  contato: {
    documento: string;
    telefone: string;
    email: string;
    tipo: string; // pf | pj
    profissao: string;
  } | null;
  processos: Processo[];
  tarefas: TarefaFull[];
  audiencias: FichaAudiencia[];
  totais: { processos: number; tarefasAbertas: number; audienciasFuturas: number };
};

// Reúne tudo de um cliente (por nome, como aparece nos processos): dados de
// contato, processos, tarefas e audiências. Tarefas/audiências respeitam o
// escopo do usuário (advogado vê só as suas); processos são visíveis a todos.
export async function getFichaCliente(
  nome: string,
): Promise<FichaCliente | null> {
  const alvo = nome.trim();
  if (!alvo) return null;
  const procs = await prisma.processo.findMany({
    where: { cliente: alvo },
    orderBy: { criadoEm: "desc" },
  });
  if (procs.length === 0) {
    // Sem processos: ainda pode existir como contato cadastrado.
    const c = await prisma.contato.findFirst({
      where: { nome: alvo, tipoContato: "cliente" },
    });
    if (!c) return null;
  }
  const procIds = procs.map((p) => p.id);
  const contato = await prisma.contato.findFirst({
    where: { nome: alvo, tipoContato: "cliente" },
    orderBy: { criadoEm: "asc" },
  });
  const [escT, escA] = [await escopoTarefas(), await escopoAgenda()];
  const [tars, audis] = await Promise.all([
    procIds.length
      ? prisma.tarefa.findMany({
          where: { processoId: { in: procIds }, ...escT },
          orderBy: { data: "asc" },
        })
      : Promise.resolve([]),
    procIds.length
      ? prisma.audiencia.findMany({
          where: { processoId: { in: procIds }, ...escA },
          orderBy: { inicioUtc: "asc" },
        })
      : Promise.resolve([]),
  ]);
  const hoje = hojeISO();
  return {
    nome: alvo,
    contato: contato
      ? {
          documento: contato.documento,
          telefone: contato.telefone,
          email: contato.email,
          tipo: contato.tipo,
          profissao: contato.profissao,
        }
      : null,
    processos: procs.map(mapProcesso),
    tarefas: tars.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao ?? undefined,
      processo:
        procs.find((p) => p.id === t.processoId)?.numero ?? "",
      area: t.area as Area,
      data: t.data,
      prazo: t.prazo,
      prazoUrgente: t.prazoUrgente,
      status: t.status as Status,
      responsaveis: t.responsaveis,
      solicitante: t.solicitante || undefined,
      revisor: t.revisor || undefined,
    })),
    audiencias: audis.map((a) => ({
      id: a.id,
      processoNumero:
        procs.find((p) => p.id === a.processoId)?.numero ?? "",
      titulo: a.titulo,
      data: a.data,
      hora: a.hora,
      tipo: a.tipo,
      modalidade: a.modalidade,
      local: a.local,
      status: a.status,
    })),
    totais: {
      processos: procs.length,
      tarefasAbertas: tars.filter((t) => t.status !== "concluida").length,
      audienciasFuturas: audis.filter(
        (a) => a.status === "agendada" && a.data >= hoje,
      ).length,
    },
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

// Só os eventos da Agenda (sem as audiências, que já vêm por getAudiencias) —
// usado para exibi-los junto das tarefas.
export type EventoAgendaDTO = {
  id: string;
  data: string;
  hora: string;
  tipo: string;
  titulo: string;
  detalhe: string;
  participantes: string[];
};
export async function getEventosAgenda(): Promise<EventoAgendaDTO[]> {
  const rows = await prisma.eventoAgenda.findMany({
    where: await escopoAgenda(),
    orderBy: { hora: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    data: e.data,
    hora: e.hora,
    tipo: e.tipo,
    titulo: e.titulo,
    detalhe: e.detalhe,
    participantes: e.participantes,
  }));
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

export type DocItem = {
  id: string;
  ordem: string;
  nome: string;
  data: string;
  temArquivo: boolean;
  tamanho: number;
  mime: string;
};
export type PastaDocumentos = {
  id: string;
  numero: string;
  cliente: string;
  area: Area;
  docs: DocItem[];
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
      id: d.id,
      ordem: String(d.ordem).padStart(2, "0"),
      nome: d.nome,
      data: d.data,
      temArquivo: !!d.blobUrl,
      tamanho: d.tamanho,
      mime: d.mime,
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
