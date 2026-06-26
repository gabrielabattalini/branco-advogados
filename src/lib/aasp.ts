// Leitura, separação e extração das publicações da AASP (recortes do DJEN).
// Módulo PURO (sem I/O): recebe o texto já extraído do PDF e devolve as
// publicações estruturadas, separadas por área e com as duplicatas marcadas.
// Ver formato em memory/aasp-publicacoes-formato.md.

export type AreaPub = "trabalhista" | "civel";
export type AtoTipo =
  | "sentenca"
  | "acordao"
  | "decisao"
  | "despacho"
  | "ato_ordinatorio"
  | "pauta"
  | "edital"
  | "intimacao";
export type Resultado = "procedente" | "improcedente" | "parcial" | "";

export type PublicacaoParsed = {
  item: number; // número sequencial dado pela AASP
  tribunal: string; // TRT15, TJSP, TRF3...
  area: AreaPub;
  processo: string; // CNJ
  orgao: string; // vara / câmara / comarca
  partes: string; // texto bruto de "Parte(s):"
  poloAtivo: string;
  poloPassivo: string;
  disponibilizacao: string; // ISO yyyy-mm-dd
  publicacaoNum: string;
  atoTipo: AtoTipo;
  atoId: string; // "ID xxxxx" — usado na deduplicação
  resultado: Resultado;
  prazoDias: number | null;
  prazoTipo: "uteis" | "corridos" | null;
  intimado: string;
  teor: string; // resumo do dispositivo / despacho (trecho)
  duplicataDe: number | null; // item do qual esta é repetição (mesmo processo+ato)
};

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5,
  junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10,
  novembro: 11, dezembro: 12,
};

function dataParaISO(s: string): string {
  // "DD/MM/AAAA"
  const br = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  // "... DD de <mês> de AAAA"
  const ext = s.match(/(\d{1,2})\s+de\s+([A-Za-zçãÇÃ]+)\s+de\s+(\d{4})/);
  if (ext) {
    const mes = MESES[ext[2].toLowerCase()];
    if (mes)
      return `${ext[3]}-${String(mes).padStart(2, "0")}-${ext[1].padStart(2, "0")}`;
  }
  return "";
}

// Área pelo segmento de Justiça do CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO).
// Só duas categorias: Justiça do Trabalho (segmento 5) = trabalhista; todo o
// resto (federal/TRF, estadual, superiores) = cível.
export function areaDoProcesso(processo: string): AreaPub {
  const m = processo.match(/\d{7}-\d{2}\.\d{4}\.(\d)\.\d{2}\.\d{4}/);
  return m?.[1] === "5" ? "trabalhista" : "civel";
}

function areaPorTribunal(trib: string): AreaPub {
  return /^TRT|^TST/i.test(trib) ? "trabalhista" : "civel";
}

function primeiro(re: RegExp, s: string): string {
  const m = s.match(re);
  return m ? m[1].trim() : "";
}

const POLO_ATIVO =
  "AUTOR|AUTORA|RECLAMANTE|EXEQUENTE|APELANTE|RECORRENTE|AGRAVANTE|EMBARGANTE|REQUERENTE|IMPETRANTE";
const POLO_PASSIVO =
  "RÉU|REU|RECLAMAD[OA]|EXECUTAD[OA]|APELAD[OA]|RECORRID[OA]|AGRAVAD[OA]|EMBARGAD[OA]|REQUERID[OA]|IMPETRAD[OA]";

function tipoDoAto(b: string): AtoTipo {
  if (/Pauta de Julgamento/i.test(b)) return "pauta";
  if (/EDITAL DE INTIMA[ÇC][ÃA]O/i.test(b)) return "edital";
  if (/ATO ORDINAT[ÓO]RIO/i.test(b)) return "ato_ordinatorio";
  // TRT: "intimado para tomar ciência da/do <Ato>" é o sinal mais confiável.
  const ci = b.match(
    /ci[êe]ncia (?:da|do)\s+(Senten[çc]a|Decis[ãa]o|Despacho|Ac[óo]rd[ãa]o)/i,
  );
  if (ci) {
    const x = ci[1].toLowerCase();
    return x.startsWith("senten")
      ? "sentenca"
      : x.startsWith("decis")
        ? "decisao"
        : x.startsWith("despac")
          ? "despacho"
          : "acordao";
  }
  // TJSP / 2º grau
  if (
    /INTIMA[ÇC][ÃA]O DE AC[ÓO]RD[ÃA]O|EMENTA:|N[ãa]o conheceram|deram provimento|negaram provimento|V\.\s?U\./i.test(
      b,
    )
  )
    return "acordao";
  // "sentença" como dispositivo (não "cumprimento de sentença")
  if (
    /SENTEN[ÇC]A\s*(?:Diante|DEFIRO|Julgo|JULGO|Posto isso|Ante o exposto|ISSO POSTO|extin)/i.test(
      b,
    )
  )
    return "sentenca";
  if (
    /DESPACHO\s*\/?\s*DECIS[ÃA]O|\bDECIS[ÃA]O\b\s*(?:Pressupostos|Vistos|Defiro|Trata-se|Diante)/i.test(
      b,
    )
  )
    return "decisao";
  if (/\bVistos\b|Vistos\./i.test(b)) return "despacho";
  if (/manifeste-se|manifestar-se|certifico|decorreu o prazo/i.test(b))
    return "despacho";
  return "intimacao";
}

function resultadoDe(b: string, ato: AtoTipo): Resultado {
  if (ato !== "sentenca" && ato !== "acordao") return "";
  if (/PARCIALMENTE PROCEDENTE/i.test(b)) return "parcial";
  if (/IMPROCEDENTE/i.test(b)) return "improcedente";
  if (/\bPROCEDENTE/i.test(b)) return "procedente";
  return "";
}

function prazoDe(b: string): { dias: number | null; tipo: "uteis" | "corridos" | null } {
  // tenta "no prazo de N (...) dias", "em N dias", "em quinze dias"
  const num = b.match(/(?:no prazo de|em|prazo:?)\s*(\d{1,3})\s*\(?\s*[a-zç]*\s*\)?\s*dias/i);
  let dias: number | null = num ? Number(num[1]) : null;
  if (!dias) {
    const ext = b.match(/em\s+(cinco|dez|quinze|vinte|trinta)\s+dias/i);
    const map: Record<string, number> = { cinco: 5, dez: 10, quinze: 15, vinte: 20, trinta: 30 };
    if (ext) dias = map[ext[1].toLowerCase()] ?? null;
  }
  const corridos = /dias corridos|Lei n?º?\s*11\.?101|dias corridos/i.test(b);
  const tipo = dias ? (corridos ? "corridos" : "uteis") : null;
  return { dias, tipo };
}

function limpar(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Remove do teor o cabeçalho de partes + a lista de advogados/OAB (o usuário não
// quer ver "Advogado(s) ... OAB ..."). O lookahead casa até o ÚLTIMO OAB, então
// tira o bloco inteiro e preserva o corpo da publicação que vem depois.
function tirarMetadados(s: string): string {
  const ate = /[\s\S]*?OAB\s+[A-Z]{2}-?\d+(?:\/[A-Z]{2})?(?![\s\S]*OAB\s+[A-Z]{2}-?\d)/;
  return s
    .replace(new RegExp(`Parte\\(s\\):${ate.source}`, "i"), " ")
    .replace(new RegExp(`Advogado\\(s\\)${ate.source}`, "i"), " ");
}

export function parseBloco(item: number, tribunal: string, bloco: string): PublicacaoParsed {
  const processo =
    primeiro(/Processo:?\s*([\d.\-]+\.\d{4}\.\d\.\d{2}\.\d{4})/, bloco) ||
    primeiro(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/, bloco) ||
    primeiro(/(ROT-\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/, bloco);
  const procLimpo = processo.replace(/^ROT-/, "");
  const area = procLimpo
    ? areaDoProcesso(procLimpo)
    : areaPorTribunal(tribunal);
  const orgao = limpar(
    primeiro(/Órg[ãa]o:\s*(.+?)\s*Data de disponibiliza/i, bloco),
  );
  const partes = limpar(primeiro(/Parte\(s\):\s*(.+?)\s*Advogado\(s\)/i, bloco));
  const ativoRe = new RegExp(`(?:${POLO_ATIVO}):\\s*(.+?)\\s*(?:${POLO_PASSIVO}):`, "i");
  const passivoRe = new RegExp(
    `(?:${POLO_PASSIVO}):\\s*(.+?)\\s*(?:INTIMA[ÇC][ÃA]O|E OUTROS|Advogad|Ficam|Fica V)`,
    "i",
  );
  const poloAtivo = limpar(primeiro(ativoRe, bloco));
  const poloPassivo = limpar(primeiro(passivoRe, bloco));
  const disp = dataParaISO(
    primeiro(/Data de disponibiliza[çc][ãa]o:\s*(\d{2}\/\d{2}\/\d{4})/i, bloco) ||
      primeiro(/Disponibiliza[çc][ãa]o:\s*(.+?)\s*Arquivo:/i, bloco),
  );
  const publicacaoNum = primeiro(/Publica[çc][ãa]o:\s*(\d+)/i, bloco);
  const atoTipo = tipoDoAto(bloco);
  const atoId = primeiro(/\bID\s*([0-9a-fA-F]{5,})/, bloco);
  // corta o rodapé de paginação ("X de Y") que às vezes gruda no fim
  const intimado = limpar(
    primeiro(/Intimado\(s\)\s*\/\s*Citado\(s\)\s*[-–]\s*(.+)$/i, bloco).split(
      /\b\d+\s+de\s+\d+\b/,
    )[0],
  ).slice(0, 160);
  const { dias, tipo } = prazoDe(bloco);
  // teor = corpo da publicação, COMPLETO e limpo: começa no ato (pula o
  // cabeçalho de processo/partes/advogados) e remove o rodapé de intimados.
  let teor = bloco;
  const corte = bloco.search(
    /INTIMA[ÇC][ÃA]O Fica|DISPOSITIVO|DESPACHO|DECIS[ÃA]O|SENTEN[ÇC]A|Vistos|ATO ORDINAT|HOMOLOGO|EMENTA|Lista de distribui/i,
  );
  if (corte >= 0)
    teor = bloco.slice(corte);
  // sem marcador de ato: tira o cabeçalho DJEN do começo (já está no cartão).
  else teor = bloco.replace(/^[\s\S]*?Eletr[ôo]nico Nacional\s*/i, "");
  // tira o rodapé "Intimado(s)/Citado(s) - ...", a lista de advogados/OAB e a
  // paginação "X de Y".
  teor = teor.split(/Intimado\(s\)\s*\/\s*Citado\(s\)/i)[0];
  teor = tirarMetadados(teor).replace(/\b\d{1,3}\s+de\s+\d{1,3}\b\s*$/, "");
  teor = limpar(teor).slice(0, 6000);

  return {
    item,
    tribunal,
    area,
    processo: procLimpo,
    orgao,
    partes,
    poloAtivo,
    poloPassivo,
    disponibilizacao: disp,
    publicacaoNum,
    atoTipo,
    atoId,
    resultado: resultadoDe(bloco, atoTipo),
    prazoDias: dias,
    prazoTipo: tipo,
    intimado,
    teor,
    duplicataDe: null,
  };
}

// Chave canônica de uma publicação (mesmo ato = mesma chave), usada na
// deduplicação dentro do lote E contra o que já está salvo. Mesmo processo +
// mesmo ATO: o ID do ato quando existe (autor/réu compartilham o ID); senão a
// DATA de disponibilização (a AASP devolve a mesma publicação em mais de um
// diário — DJEN + diário antigo — no mesmo dia); só recorre ao teor sem nada.
export function chavePublicacao(p: {
  processo: string;
  atoId: string;
  disponibilizacao: string;
  teor: string;
}): string {
  const ato = p.atoId
    ? `ID:${p.atoId}`
    : p.disponibilizacao
      ? `D:${p.disponibilizacao}`
      : `T:${p.teor.slice(0, 80)}`;
  return `${p.processo}|${ato}`;
}

function marcarDuplicatas(pubs: PublicacaoParsed[]): void {
  const visto = new Map<string, number>(); // chave -> item canônico
  for (const p of pubs) {
    if (!p.processo) continue;
    const chave = chavePublicacao(p);
    const canon = visto.get(chave);
    if (canon != null) p.duplicataDe = canon;
    else visto.set(chave, p.item);
  }
}

// Quebra o texto contínuo do DJEN nos cabeçalhos "N - D J E N - TRIB" /
// "N - TRT - Nª Região" e devolve cada publicação estruturada.
export function parseAASP(textoBruto: string): PublicacaoParsed[] {
  const t = textoBruto.replace(/\s+/g, " ");
  const headerRe =
    /(\d{1,3})\s*-\s*(?:D J E N\s*-\s*(TRT\d*|TJSP|TRF\d*|TST|STJ|STF|TJ[A-Z]{0,2})|TRT\s*-\s*(\d+)ª?\s*Regi[ãa]o)/g;
  const heads: { item: number; tribunal: string; idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(t))) {
    const tribunal = m[2] ? m[2].toUpperCase() : "TRT" + m[3];
    heads.push({ item: Number(m[1]), tribunal, idx: m.index });
  }
  const pubs: PublicacaoParsed[] = [];
  for (let i = 0; i < heads.length; i++) {
    const fim = i + 1 < heads.length ? heads[i + 1].idx : t.length;
    pubs.push(parseBloco(heads[i].item, heads[i].tribunal, t.slice(heads[i].idx, fim)));
  }
  marcarDuplicatas(pubs);
  return pubs;
}

// Opções do menu "O QUÊ" (ações + recursos cível/trabalhista).
export const ACOES_TAREFA = [
  "Verificar",
  "Verificar e avisar a empresa",
  "Verificar e avaliar recurso",
  "Avisar a empresa (resultado)",
  "Manifestar",
  "Manifestar / cumprir",
  "Cumprir / providenciar",
  "Lançar no sistema",
  "Memoriais / sustentação",
  "Ciência",
  "Contestação",
  "Apelação",
  "Agravo de instrumento",
  "Agravo interno",
  "Recurso ordinário (RO)",
  "Recurso de revista (RR)",
  "Agravo de petição",
  "Embargos de declaração",
  "Recurso especial (REsp)",
  "Recurso extraordinário (RE)",
  "Contrarrazões",
  "Contraminuta",
];

// Sugere a ação (o "O QUÊ" da anotação) a partir do tipo de ato e do teor.
export function sugerirAcao(p: {
  atoTipo: AtoTipo;
  resultado: Resultado;
  prazoDias: number | null;
  teor: string;
}): string {
  const t = p.teor.toLowerCase();
  if (p.atoTipo === "pauta") return "Memoriais / sustentação";
  if (/contraminuta/.test(t)) return "Contraminuta";
  if (/contrarraz/.test(t)) return "Contrarrazões";
  if (p.atoTipo === "sentenca" || p.atoTipo === "acordao")
    return p.resultado === "improcedente"
      ? "Verificar e avisar a empresa"
      : "Verificar e avaliar recurso";
  if (p.atoTipo === "ato_ordinatorio") return "Manifestar";
  if (p.prazoDias) return "Manifestar / cumprir";
  if (p.atoTipo === "edital") return "Ciência";
  return "Verificar";
}

// ===== Integração com a API de Intimações da AASP (associado) =====
// Cada intimação da API já vem com o textoPublicacao (mesmo formato do PDF) +
// campos estruturados confiáveis (numeroUnicoProcesso, data, numeroPublicacao).
// Reusamos o parseBloco e só sobrescrevemos os campos confiáveis.
export type IntimacaoAASP = {
  jornal?: {
    nomeJornal?: string | null;
    dataDisponibilizacao_Publicacao?: string | null;
  } | null;
  textoPublicacao?: string | null;
  titulo?: string | null;
  cabecalho?: string | null;
  rodape?: string | null;
  numeroPublicacao?: number | string | null;
  numeroArquivo?: number | null;
  codigoRelacionamento?: number | string | null;
  numeroUnicoProcesso?: string | null;
};

const RE_TRIB = /^(TRT\d+|TST|TJSP|TRF\d+|STJ|STF|TJ[A-Z]{2})$/;

// "DJENTJSP" -> "TJSP"; "DJENTRT15" -> "TRT15"; usa o título como reserva.
function tribunalDaIntimacao(it: IntimacaoAASP): string {
  const j = (it.jornal?.nomeJornal ?? "").toUpperCase().replace(/^DJEN/, "");
  if (RE_TRIB.test(j)) return j;
  const t = (it.titulo ?? "")
    .toUpperCase()
    .match(/\b(TRT\d+|TST|TJSP|TRF\d+|STJ|STF|TJ[A-Z]{2})\b/);
  return t ? t[1] : j || "DJEN";
}

function isoData(s: string | null | undefined): string {
  const m = (s ?? "").match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

// Alguns diários trazem o cabeçalho cru do PDF colado no início do texto
// ("N - D J E N - TRIB Disponibilização:... Publicação: NNN TRIB Diário ...
// Nacional"). Removemos para o teor sair limpo e bater com a versão limpa do
// mesmo ato (que vem de outro diário).
function limparCabecalho(texto: string): string {
  return texto.replace(
    /^\s*\d{1,3}\s*-\s*D J E N\b[\s\S]*?Di[áa]rio de Justi[çc]a Eletr[ôo]nico Nacional\s*/,
    "",
  );
}

// Converte as intimações da API da AASP em PublicacaoParsed[] (com dedup IDEM).
export function parseIntimacoesAASP(intims: IntimacaoAASP[]): PublicacaoParsed[] {
  // Diários DJEN (texto limpo) primeiro: viram o "canônico" na dedup, deixando
  // a versão suja (diário antigo) como duplicata.
  const ordenadas = [...intims]
    .map((it, i) => ({ it, i }))
    .sort((a, b) => {
      const da = (a.it.jornal?.nomeJornal ?? "").toUpperCase().startsWith("DJEN") ? 0 : 1;
      const db = (b.it.jornal?.nomeJornal ?? "").toUpperCase().startsWith("DJEN") ? 0 : 1;
      return da - db || a.i - b.i;
    })
    .map((x) => x.it);
  const pubs = ordenadas.map((it, i) => {
    const trib = tribunalDaIntimacao(it);
    const bloco = limparCabecalho(`${it.cabecalho ?? ""} ${it.textoPublicacao ?? ""}`);
    const p = parseBloco(i + 1, trib, bloco);
    const proc = (it.numeroUnicoProcesso ?? p.processo ?? "").trim();
    p.processo = proc;
    p.area = proc ? areaDoProcesso(proc) : areaPorTribunal(trib);
    const disp = isoData(it.jornal?.dataDisponibilizacao_Publicacao);
    if (disp) p.disponibilizacao = disp;
    if (it.numeroPublicacao != null && it.numeroPublicacao !== "")
      p.publicacaoNum = String(it.numeroPublicacao);
    return p;
  });
  marcarDuplicatas(pubs);
  return pubs;
}

// Agrupa o resultado para a tela de triagem.
export function resumoTriagem(pubs: PublicacaoParsed[]) {
  const unicas = pubs.filter((p) => p.duplicataDe == null);
  const por = (a: AreaPub) => unicas.filter((p) => p.area === a);
  return {
    total: pubs.length,
    duplicatas: pubs.length - unicas.length,
    unicas: unicas.length,
    trabalhista: por("trabalhista"),
    civel: por("civel"),
  };
}
