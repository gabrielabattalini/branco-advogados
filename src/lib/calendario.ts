// Helpers de calendário compartilhados (Tarefas e Publicações).

export const DOWS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export type CelulaMes = { iso: string; dia: number; doMes: boolean };

// Semanas (seg→dom) do mês informado, descartando linhas sem nenhum dia do mês.
export function gridMes(ano: number, mes: number): CelulaMes[][] {
  const primeiro = new Date(ano, mes - 1, 1);
  const offset = (primeiro.getDay() + 6) % 7;
  const semanas: CelulaMes[][] = [];
  let cur = new Date(ano, mes - 1, 1 - offset);
  for (let w = 0; w < 6; w++) {
    const dias: CelulaMes[] = [];
    for (let d = 0; d < 7; d++) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const dd = cur.getDate();
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      dias.push({ iso, dia: dd, doMes: cur.getMonth() === mes - 1 });
      cur = new Date(y, cur.getMonth(), dd + 1);
    }
    semanas.push(dias);
  }
  return semanas.filter((s) => s.some((d) => d.doMes));
}
