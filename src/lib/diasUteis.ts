// Cálculo de prazos: dias corridos e dias úteis (descontando fins de semana e
// feriados NACIONAIS, incluindo os móveis derivados da Páscoa). Módulo puro.
// OBS.: feriados estaduais/municipais e forenses (recesso) NÃO entram aqui.

function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const cacheFeriados = new Map<number, Set<string>>();

export function feriadosNacionais(ano: number): Set<string> {
  const cache = cacheFeriados.get(ano);
  if (cache) return cache;
  const p = pascoa(ano);
  const set = new Set<string>([
    `${ano}-01-01`, // Confraternização
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência
    `${ano}-10-12`, // N. Sra. Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Consciência Negra (nacional desde 2024)
    `${ano}-12-25`, // Natal
    iso(addDias(p, -48)), // Carnaval (segunda)
    iso(addDias(p, -47)), // Carnaval (terça)
    iso(addDias(p, -2)), // Sexta-feira Santa
    iso(addDias(p, 60)), // Corpus Christi
  ]);
  cacheFeriados.set(ano, set);
  return set;
}

function ehDiaUtil(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !feriadosNacionais(d.getFullYear()).has(iso(d));
}

// Recua para o dia útil anterior, se a data cair em fim de semana/feriado
// (a própria data é devolvida quando já é dia útil). Usado na "margem" do
// escritório, que sempre antecipa o vencimento em 1 dia.
export function diaUtilAnterior(baseIso: string): string {
  if (!baseIso) return baseIso;
  let d = new Date(`${baseIso}T12:00:00`);
  let guarda = 0;
  while (!ehDiaUtil(d) && guarda < 100000) {
    d = addDias(d, -1);
    guarda++;
  }
  return iso(d);
}

// Avança n dias úteis a partir do dia base (o dia base não é contado).
export function somarDiasUteis(baseIso: string, n: number): string {
  if (!baseIso || !Number.isFinite(n) || n <= 0) return baseIso;
  let d = new Date(`${baseIso}T12:00:00`);
  let restantes = Math.floor(n);
  let guarda = 0;
  while (restantes > 0 && guarda < 100000) {
    d = addDias(d, 1);
    if (ehDiaUtil(d)) restantes--;
    guarda++;
  }
  return iso(d);
}

export function somarDiasCorridos(baseIso: string, n: number): string {
  if (!baseIso || !Number.isFinite(n) || n <= 0) return baseIso;
  let d = addDias(new Date(`${baseIso}T12:00:00`), Math.floor(n));
  // CPC art. 224, §1º: vencendo o prazo em dia não útil, prorroga-se para o
  // 1º dia útil seguinte. (A contagem segue corrida; só o vencimento prorroga.)
  let guarda = 0;
  while (!ehDiaUtil(d) && guarda < 100000) {
    d = addDias(d, 1);
    guarda++;
  }
  return iso(d);
}
