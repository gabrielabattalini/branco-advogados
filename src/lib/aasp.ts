// Leitura, separação e extração das publicações da AASP (recortes do DJEN).
// Módulo PURO (sem I/O): recebe o texto já extraído do PDF e devolve as
// publicações estruturadas, separadas por área e com as duplicatas marcadas.
// Ver formato em memory/aasp-publicacoes-formato.md.

export type AreaPub = "trabalhista" | "civel" | "federal";
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
export function areaDoProcesso(processo: string): AreaPub {
  const m = processo.match(/\d{7}-\d{2}\.\d{4}\.(\d)\.\d{2}\.\d{4}/);
  const j = m?.[1];
  if (j === "5") return "trabalhista"; // Justiça do Trabalho
  if (j === "4") return "federal"; // Justiça Federal
  return "civel"; // 8 estadual; 1/2/3 superiores; demais → cível p/ triagem
}

function areaPorTribunal(trib: string): AreaPub {
  if (/^TRT|^TST/i.test(trib)) return "trabalhista";
  if (/^TRF/i.test(trib)) return "federal";
  return "civel";
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

function parseBloco(item: number, tribunal: string, bloco: string): PublicacaoParsed {
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
  // teor: do "INTIMAÇÃO"/dispositivo até ~360 chars
  let teor = bloco;
  const corte = bloco.search(/INTIMA[ÇC][ÃA]O Fica|DISPOSITIVO|DESPACHO|DECIS[ÃA]O|SENTEN[ÇC]A|Vistos|ATO ORDINAT/i);
  if (corte >= 0) teor = bloco.slice(corte);
  teor = limpar(teor).slice(0, 360);

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

function marcarDuplicatas(pubs: PublicacaoParsed[]): void {
  const visto = new Map<string, number>(); // chave -> item canônico
  for (const p of pubs) {
    if (!p.processo) continue;
    // Duplicata "IDEM" = mesmo processo + mesmo ato. Usamos o ID do ato quando
    // existe (mais confiável); senão, o teor (mesma decisão, outra parte
    // intimada) — evita mesclar atos diferentes do mesmo processo.
    const chave = `${p.processo}|${p.atoId || p.teor.slice(0, 100)}`;
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
    federal: por("federal"),
  };
}
