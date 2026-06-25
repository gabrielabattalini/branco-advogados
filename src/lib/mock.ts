export type Area = "trabalhista" | "civel";
export type Status =
  | "a_fazer"
  | "em_curso"
  | "em_correcao"
  | "aguardando"
  | "concluida";

/**
 * Classifica o processo a partir do número único do CNJ
 * (NNNNNNN-DD.AAAA.J.TR.OOOO). O dígito "J" identifica a Justiça:
 * 5 = Justiça do Trabalho (TRT/TST) → trabalhista; o resto → cível.
 */
export function classificarArea(numeroCnj: string): Area {
  const d = numeroCnj.replace(/\D/g, "");
  return d.charAt(13) === "5" ? "trabalhista" : "civel";
}

/** Dia "de hoje" da demonstração — alinhado ao calendário de Tarefas. */
export const HOJE_ISO = "2026-06-19";
export const HOJE_BR = "19/06/2026";

export const usuarioAtual = {
  nome: "Gabriel",
  iniciais: "GB",
  area: "civel" as Area,
};

export type Tarefa = {
  id: string;
  titulo: string;
  processo: string;
  area: Area;
  prazo: string;
  prazoUrgente?: boolean;
  status: Status;
  responsavel: string;
};

export const tarefas: Tarefa[] = [
  { id: "1", titulo: "Elaborar contestação", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", prazo: "Hoje", prazoUrgente: true, status: "a_fazer", responsavel: "AB" },
  { id: "2", titulo: "Juntar procuração e documentos", processo: "1001234-55.2024.8.26.0309", area: "civel", prazo: "23/06", status: "a_fazer", responsavel: "GB" },
  { id: "3", titulo: "Analisar despacho e dar ciência", processo: "0050123-44.2025.5.15.0010", area: "trabalhista", prazo: "24/06", status: "em_curso", responsavel: "PL" },
  { id: "4", titulo: "Protocolar cumprimento de sentença", processo: "1009876-12.2023.8.26.0114", area: "civel", prazo: "26/06", status: "a_fazer", responsavel: "CS" },
];

export type Evento = { hora: string; titulo: string; detalhe: string };

export const eventosHoje: Evento[] = [
  { hora: "09:30", titulo: "Reunião — Construtora Habita", detalhe: "Sala 2 · 1h" },
  { hora: "11:00", titulo: "Audiência — TRT15", detalhe: "Dr. Gabriel · trabalhista" },
  { hora: "15:00", titulo: "Alinhamento da equipe cível", detalhe: "Online · Teams" },
];

export type Publicacao = { titulo: string; numero: string; area: Area };

export const publicacoes: Publicacao[] = [
  { titulo: "TRT15 · Intimação", numero: "0050123-44.2025.5.15.0010", area: "trabalhista" },
  { titulo: "TJSP · Despacho", numero: "1001234-55.2024.8.26.0309", area: "civel" },
];

export const kpis = [
  { label: "Tarefas abertas", valor: 14 },
  { label: "Prazos hoje", valor: 3, danger: true },
  { label: "Publicações a triar", valor: 7 },
  { label: "Audiências na semana", valor: 5 },
];

export const statusLabel: Record<Status, string> = {
  a_fazer: "A fazer",
  em_curso: "Em curso",
  em_correcao: "Em correção",
  aguardando: "Aguardando",
  concluida: "Concluída",
};

/** Status disponíveis e a ordem das colunas no quadro. */
export const STATUS_LIST: { key: Status; label: string; cor: string }[] = [
  { key: "a_fazer", label: "A fazer", cor: "gray" },
  { key: "em_curso", label: "Em curso", cor: "info" },
  { key: "em_correcao", label: "Em correção", cor: "amber" },
  { key: "aguardando", label: "Aguardando", cor: "navy" },
  { key: "concluida", label: "Concluída", cor: "ok" },
];

/** Classes Tailwind por cor de status. */
export function corStatus(cor: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (cor) {
    case "info":
      return { bg: "bg-info/15", text: "text-info", border: "border-info/40" };
    case "amber":
      return {
        bg: "bg-trab-bg",
        text: "text-trab-text",
        border: "border-trab-text/40",
      };
    case "ok":
      return { bg: "bg-ok/15", text: "text-ok", border: "border-ok/40" };
    case "navy":
      return { bg: "bg-navy/10", text: "text-navy", border: "border-navy/30" };
    default:
      return { bg: "bg-navy/5", text: "text-muted", border: "border-line" };
  }
}

export const corDoStatus = (s: string) =>
  corStatus(STATUS_LIST.find((x) => x.key === s)?.cor ?? "gray");

export type TarefaFull = {
  id: string;
  titulo: string;
  descricao?: string;
  processo: string;
  area: Area;
  data: string; // ISO yyyy-mm-dd (prazo final / data fatal)
  dataDisponibilizacao?: string; // ISO yyyy-mm-dd
  dataPublicacao?: string; // ISO yyyy-mm-dd (base da contagem)
  prazoDias?: number;
  prazoTipo?: string; // uteis | corridos
  prazo: string;
  prazoUrgente?: boolean;
  status: Status;
  responsaveis: string[];
  solicitante?: string;
  revisor?: string;
};

export const semana = [
  { dow: "Seg", dia: "15", data: "2026-06-15", hoje: false },
  { dow: "Ter", dia: "16", data: "2026-06-16", hoje: false },
  { dow: "Qua", dia: "17", data: "2026-06-17", hoje: false },
  { dow: "Qui", dia: "18", data: "2026-06-18", hoje: false },
  { dow: "Sex", dia: "19", data: "2026-06-19", hoje: true },
];

export const tarefasFull: TarefaFull[] = [
  // Cível — espalhadas por junho/2026.
  { id: "1", titulo: "Revisar contrato de locação", descricao: "Conferir cláusulas de reajuste e multa.", processo: "1005432-21.2024.8.26.0309", area: "civel", data: "2026-06-03", prazo: "03/06", status: "concluida", responsaveis: ["GB"] },
  { id: "2", titulo: "Protocolar petição inicial", descricao: "Ação de cobrança contra o banco.", processo: "1001234-55.2024.8.26.0309", area: "civel", data: "2026-06-05", prazo: "05/06", status: "concluida", responsaveis: ["GB"] },
  { id: "3", titulo: "Analisar documentos do condomínio", descricao: "Convenção e atas de assembleia.", processo: "1005432-21.2024.8.26.0309", area: "civel", data: "2026-06-10", prazo: "10/06", status: "em_curso", responsaveis: ["GB", "AB"] },
  { id: "4", titulo: "Elaborar réplica", descricao: "Responder à contestação da Habita.", processo: "1009876-12.2023.8.26.0114", area: "civel", data: "2026-06-12", prazo: "12/06", status: "em_correcao", responsaveis: ["GB"] },
  { id: "5", titulo: "Reunião com cliente Aurora", descricao: "Alinhar estratégia do recurso.", processo: "1005432-21.2024.8.26.0309", area: "civel", data: "2026-06-15", prazo: "15/06", status: "concluida", responsaveis: ["GB"] },
  { id: "6", titulo: "Calcular atualização do débito", descricao: "Aguardando planilha do contador.", processo: "1001234-55.2024.8.26.0309", area: "civel", data: "2026-06-17", prazo: "17/06", status: "aguardando", responsaveis: ["GB"] },
  { id: "7", titulo: "Analisar despacho e dar ciência", descricao: "Despacho de saneamento — verificar pontos controvertidos.", processo: "1009876-12.2023.8.26.0114", area: "civel", data: "2026-06-19", prazo: "Hoje", prazoUrgente: true, status: "a_fazer", responsaveis: ["GB", "CS"] },
  { id: "8", titulo: "Preparar audiência Habita", descricao: "Rol de testemunhas e quesitos.", processo: "1009876-12.2023.8.26.0114", area: "civel", data: "2026-06-19", prazo: "Hoje", prazoUrgente: true, status: "em_curso", responsaveis: ["GB", "AB"] },
  { id: "9", titulo: "Juntar procuração atualizada", descricao: "Instrumento com os novos poderes.", processo: "1001234-55.2024.8.26.0309", area: "civel", data: "2026-06-22", prazo: "22/06", status: "a_fazer", responsaveis: ["GB"] },
  { id: "10", titulo: "Protocolar cumprimento de sentença", descricao: "Iniciar a fase de execução.", processo: "1009876-12.2023.8.26.0114", area: "civel", data: "2026-06-24", prazo: "24/06", status: "a_fazer", responsaveis: ["GB"] },
  { id: "11", titulo: "Manifestar sobre laudo pericial", descricao: "Prazo de 15 dias para impugnação.", processo: "1005432-21.2024.8.26.0309", area: "civel", data: "2026-06-26", prazo: "26/06", status: "a_fazer", responsaveis: ["GB"] },
  { id: "12", titulo: "Preparar razões de apelação", descricao: "Recurso da sentença de improcedência.", processo: "1001234-55.2024.8.26.0309", area: "civel", data: "2026-06-30", prazo: "30/06", status: "a_fazer", responsaveis: ["GB"] },
  // Trabalhista — de outros advogados.
  { id: "13", titulo: "Elaborar contestação", descricao: "Defesa na reclamatória.", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", data: "2026-06-22", prazo: "22/06", status: "a_fazer", responsaveis: ["AB"] },
  { id: "14", titulo: "Calcular liquidação", descricao: "Apurar verbas rescisórias.", processo: "0050123-44.2025.5.15.0010", area: "trabalhista", data: "2026-06-18", prazo: "18/06", status: "concluida", responsaveis: ["PL"] },
];

export type TipoPessoa = "pf" | "pj";
export type TipoContato =
  | "cliente"
  | "parte_contraria"
  | "advogado_contrario"
  | "parte_processo"
  | "fornecedor"
  | "interno"
  | "perito"
  | "correspondente"
  | "diverso";

export type Contato = {
  id: string;
  tipo: TipoPessoa;
  nome: string;
  documento: string;
  tipoContato: TipoContato;
  profissao?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  processos: number;
  iniciais: string;
};

export const contatos: Contato[] = [
  { id: "1", tipo: "pf", nome: "João da Silva", documento: "CPF 123.456.789-00", tipoContato: "cliente", processos: 2, iniciais: "JS" },
  { id: "2", tipo: "pj", nome: "Indústria Metalúrgica Zardetto Ltda", documento: "CNPJ 12.345.678/0001-90", tipoContato: "parte_contraria", processos: 1, iniciais: "IZ" },
  { id: "3", tipo: "pj", nome: "Construtora Habita S.A.", documento: "CNPJ 98.765.432/0001-10", tipoContato: "cliente", processos: 5, iniciais: "CH" },
  { id: "4", tipo: "pf", nome: "Maria Oliveira", documento: "CPF 987.654.321-00", tipoContato: "cliente", processos: 1, iniciais: "MO" },
  { id: "5", tipo: "pj", nome: "Condomínio Edifício Aurora", documento: "CNPJ 45.123.789/0001-55", tipoContato: "cliente", processos: 3, iniciais: "CA" },
  { id: "6", tipo: "pf", nome: "Ricardo Pereira", documento: "CPF 321.654.987-00", tipoContato: "perito", processos: 4, iniciais: "RP" },
  { id: "7", tipo: "pj", nome: "Comércio de Alimentos BomPreço Ltda", documento: "CNPJ 33.444.555/0001-22", tipoContato: "parte_contraria", processos: 1, iniciais: "CB" },
  { id: "8", tipo: "pf", nome: "Antônio Correia", documento: "CPF 222.333.444-55", tipoContato: "correspondente", processos: 8, iniciais: "AC" },
];

export type Processo = {
  id: string;
  numero: string;
  area: Area;
  tribunal: string;
  status: string;
  cliente: string;
  parteContraria: string;
  responsavel: string;
  responsavelIniciais: string;
  valorCausa: string;
  distribuido: string;
  fase: string;
};

export const processos: Processo[] = [
  { id: "p1", numero: "0010567-89.2025.5.15.0042", area: "trabalhista", tribunal: "TRT15 · 2ª Vara do Trabalho de Jundiaí", status: "Em andamento", cliente: "João da Silva", parteContraria: "Indústria Metalúrgica Zardetto Ltda", responsavel: "Dra. Ana Branco", responsavelIniciais: "AB", valorCausa: "R$ 85.000,00", distribuido: "12/03/2025", fase: "Conhecimento" },
  { id: "p2", numero: "1005432-21.2024.8.26.0309", area: "civel", tribunal: "TJSP · 3ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Condomínio Edifício Aurora", parteContraria: "Construtora Habita S.A.", responsavel: "Dr. Carlos Souza", responsavelIniciais: "CS", valorCausa: "R$ 240.000,00", distribuido: "21/08/2024", fase: "Conhecimento" },
  { id: "p3", numero: "0050123-44.2025.5.15.0010", area: "trabalhista", tribunal: "TRT15 · 10ª Vara do Trabalho de Campinas", status: "Em andamento", cliente: "Maria Oliveira", parteContraria: "Comércio de Alimentos BomPreço Ltda", responsavel: "Est. Pedro Lima", responsavelIniciais: "PL", valorCausa: "R$ 60.000,00", distribuido: "02/02/2025", fase: "Conhecimento" },
  { id: "p4", numero: "1009876-12.2023.8.26.0114", area: "civel", tribunal: "TJSP · 1ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Construtora Habita S.A.", parteContraria: "Município de Jundiaí", responsavel: "Dra. Ana Branco", responsavelIniciais: "AB", valorCausa: "R$ 120.000,00", distribuido: "10/05/2023", fase: "Cumprimento de sentença" },
  { id: "p5", numero: "1001234-55.2024.8.26.0309", area: "civel", tribunal: "TJSP · 2ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Maria Oliveira", parteContraria: "Banco Crédito S.A.", responsavel: "Dr. Carlos Souza", responsavelIniciais: "CS", valorCausa: "R$ 45.000,00", distribuido: "15/07/2024", fase: "Conhecimento" },
];

export type DocumentoProc = { ordem: string; nome: string; data: string };

export const documentosPorProcesso: Record<string, DocumentoProc[]> = {
  "0010567-89.2025.5.15.0042": [
    { ordem: "01", nome: "Procuração.pdf", data: "12/03/2025" },
    { ordem: "02", nome: "Contrato de trabalho.pdf", data: "14/03/2025" },
    { ordem: "03", nome: "Petição inicial.pdf", data: "18/03/2025" },
    { ordem: "04", nome: "Documentos pessoais.pdf", data: "18/03/2025" },
  ],
  "1005432-21.2024.8.26.0309": [
    { ordem: "01", nome: "Procuração.pdf", data: "21/08/2024" },
    { ordem: "02", nome: "Convenção de condomínio.pdf", data: "22/08/2024" },
    { ordem: "03", nome: "Petição inicial.pdf", data: "25/08/2024" },
  ],
};

export type PublicacaoProc = {
  titulo: string;
  origem: string;
  estado: "gerou_tarefa" | "arquivada";
  data: string;
};

export const publicacoesPorProcesso: Record<string, PublicacaoProc[]> = {
  "0010567-89.2025.5.15.0042": [
    { titulo: "Intimação para apresentar contestação", origem: "TRT15 · publicado 05/06/2026", estado: "gerou_tarefa", data: "2026-06-05" },
    { titulo: "Despacho de saneamento", origem: "TRT15 · publicado 11/06/2026", estado: "arquivada", data: "2026-06-11" },
  ],
  "1005432-21.2024.8.26.0309": [
    { titulo: "Manifeste-se sobre os documentos", origem: "TJSP · publicado 09/06/2026", estado: "gerou_tarefa", data: "2026-06-09" },
    { titulo: "Decisão interlocutória", origem: "TJSP · publicado 16/06/2026", estado: "arquivada", data: "2026-06-16" },
  ],
  "1009876-12.2023.8.26.0114": [
    { titulo: "Sentença publicada", origem: "TJSP · publicado 13/06/2026", estado: "gerou_tarefa", data: "2026-06-13" },
  ],
};

// Equipe real do escritório (fonte do seed). A lista "atribuível" em runtime
// vem do banco (getResponsaveis), para refletir quem o admin cadastrar.
export const equipeInicial: {
  iniciais: string;
  nome: string;
  email: string;
  papel: string;
  area: string;
}[] = [
  { iniciais: "LB", nome: "Luiz Carlos Branco", email: "luizcarlos@brancoadvogados.com", papel: "socio", area: "trabalhista" },
  { iniciais: "DB", nome: "Débora", email: "debora@brancoadvogados.com", papel: "coordenador", area: "civel" },
  { iniciais: "MR", nome: "Mauro", email: "mauro@brancoadvogados.com", papel: "coordenador", area: "civel" },
  { iniciais: "KA", nome: "Karen", email: "karen@brancoadvogados.com", papel: "coordenador", area: "trabalhista" },
  { iniciais: "MN", nome: "Mariana", email: "mariana@brancoadvogados.com", papel: "advogado", area: "civel" },
  { iniciais: "GB", nome: "Gabriel", email: "gabriel@brancoadvogados.com", papel: "coordenador", area: "civel" },
  { iniciais: "LS", nome: "Laís", email: "lais@brancoadvogados.com", papel: "advogado", area: "civel" },
  { iniciais: "MT", nome: "Matheus", email: "matheus@brancoadvogados.com", papel: "advogado", area: "civel" },
  { iniciais: "JU", nome: "Julia", email: "julia@brancoadvogados.com", papel: "advogado", area: "trabalhista" },
  { iniciais: "SU", nome: "Suelen", email: "suelen@brancoadvogados.com", papel: "administrativo", area: "civel" },
];

// Remapeia as iniciais dos dados de demonstração (equipe antiga) para a real.
export const REMAP_DEMO: Record<string, string> = {
  AB: "DB",
  CS: "MR",
  PL: "MT",
  GB: "GB",
};

export type EventoAgenda = {
  hora: string;
  tipo: "reuniao" | "audiencia" | "prazo" | "atendimento";
  titulo: string;
  detalhe: string;
  participantes: string[];
};

export const eventosAgenda: EventoAgenda[] = [
  { hora: "09:00", tipo: "reuniao", titulo: "Cliente — Construtora Habita", detalhe: "Sala 2 · 09:00 – 10:00", participantes: ["AB"] },
  { hora: "10:30", tipo: "prazo", titulo: "Contestação — proc. …5.15.0042", detalhe: "Prazo fatal", participantes: ["GB"] },
  { hora: "14:00", tipo: "reuniao", titulo: "Alinhamento da equipe cível", detalhe: "Online · Teams · 14:00 – 15:00", participantes: ["GB", "AB", "CS", "PL"] },
  { hora: "16:00", tipo: "atendimento", titulo: "Novo cliente — Direito do Consumidor", detalhe: "Recepção · 16:00", participantes: ["PL"] },
];

// Audiências de demonstração (iniciais já na equipe real). A de 19/06 também
// aparece na agenda do dia.
export const audienciasSeed: {
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
  lembretes: number[];
}[] = [
  { processoNumero: "0010567-89.2025.5.15.0042", titulo: "Audiência de instrução — João da Silva", data: "2026-06-19", hora: "11:00", tipo: "instrucao", modalidade: "presencial", link: "", local: "TRT15 · 2ª Vara do Trabalho de Jundiaí", partes: "João da Silva × Indústria Metalúrgica Zardetto Ltda", participantes: ["GB", "MR"], observacoes: "Levar rol de testemunhas.", status: "agendada", lembretes: [1440, 120, 30] },
  { processoNumero: "1005432-21.2024.8.26.0309", titulo: "Audiência de conciliação — Cond. Aurora", data: "2026-07-10", hora: "14:30", tipo: "conciliacao", modalidade: "virtual", link: "https://meet.google.com/abc-defg-hij", local: "TJSP · 3ª Vara Cível de Jundiaí", partes: "Condomínio Edifício Aurora × Construtora Habita S.A.", participantes: ["MN", "KA"], observacoes: "", status: "agendada", lembretes: [2880, 60] },
];

export type Intimacao = {
  id: string;
  tribunal: string;
  tipo: string;
  numero: string;
  area: Area;
  partes: string;
  despacho: string;
  prazo: string;
  data: string; // ISO yyyy-mm-dd (data da publicação)
  processoCadastrado: boolean;
};

export const intimacoes: Intimacao[] = [
  { id: "i1", tribunal: "TRT15", tipo: "Intimação", numero: "0010567-89.2025.5.15.0042", area: "trabalhista", partes: "João da Silva × Indústria Metalúrgica Zardetto Ltda", despacho: "Intimação para apresentar contestação no prazo legal.", prazo: "04/07/2026", data: "2026-06-18", processoCadastrado: true },
  { id: "i2", tribunal: "TJSP", tipo: "Despacho", numero: "1005432-21.2024.8.26.0309", area: "civel", partes: "Condomínio Edifício Aurora × Construtora Habita S.A.", despacho: "Manifeste-se sobre os documentos juntados, em 5 dias.", prazo: "26/06/2026", data: "2026-06-19", processoCadastrado: true },
  { id: "i3", tribunal: "TRT15", tipo: "Sentença", numero: "0021987-54.2025.5.15.0010", area: "trabalhista", partes: "Maria Oliveira × Comércio de Alimentos BomPreço Ltda", despacho: "Sentença publicada — ciência às partes.", prazo: "30/06/2026", data: "2026-06-19", processoCadastrado: false },
];
