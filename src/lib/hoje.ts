// "Hoje" no fuso de Brasília (UTC-3, sem horário de verão), consistente em
// servidor (UTC na Vercel) e cliente. Módulo puro.

export function hojeISO(): string {
  const brt = new Date(Date.now() - 3 * 3600 * 1000);
  return brt.toISOString().slice(0, 10); // yyyy-mm-dd
}

export function hojeBR(): string {
  const [y, m, d] = hojeISO().split("-");
  return `${d}/${m}/${y}`;
}

// "Bom dia" / "Boa tarde" / "Boa noite" conforme a hora de Brasília.
export function saudacao(): string {
  const h = Number(
    new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(11, 13),
  );
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Formata "yyyy-mm-dd" como "Sexta-feira, 19 de junho de 2026".
export function dataPorExtenso(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  // Meio-dia evita troca de dia por fuso ao instanciar.
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return `${DIAS_SEMANA[dt.getDay()]}, ${d} de ${MESES[m - 1]} de ${y}`;
}

// "junho de 2026" a partir de "yyyy-mm-dd".
export function mesAnoExtenso(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

// "19/06" a partir de "yyyy-mm-dd".
export function brCurto(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// Soma/subtrai dias de uma data ISO (yyyy-mm-dd), retornando ISO.
export function addDiasISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n, 12, 0, 0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

const DOW_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Os 5 dias úteis (seg–sex) da semana em que cai a data ISO informada.
export function semanaUtil(iso: string): {
  data: string;
  dow: string;
  dia: string;
}[] {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(y, m - 1, d, 12).getDay(); // 0=domingo
  const offSeg = wd === 0 ? -6 : 1 - wd; // recua até a segunda da semana
  const out: { data: string; dow: string; dia: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const di = addDiasISO(iso, offSeg + i);
    out.push({ data: di, dow: DOW_CURTO[1 + i], dia: di.slice(8) });
  }
  return out;
}
